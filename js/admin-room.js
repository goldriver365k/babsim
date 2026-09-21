/* ==========================================================================
   관리자 페이지 - 방 구하기 문의 (js/admin-room.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "방 구하기 문의" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다(별도 로그인 화면 없음) — roomInquiries는 이름·전화번호 등
     개인정보를 담고 있어 Firestore 보안 규칙이 로그인한 관리자에게만
     읽기를 허용합니다(공개 조회 불가).
   - 탭을 실제로 열 때(또는 로그인 상태가 바뀔 때)만 최근 100건을 1회
     조회합니다 — 실시간 리스너를 걸어두지 않습니다(비용 최소화).
   - 탭 상단의 "문자 수신번호" 설정도 이 컬렉션과 별개로 Firestore
     siteSettings/general 문서 하나를 재사용합니다(방 구하기 SMS
     수신번호 변경 단계, 2026-09-21 추가) — 전화번호 하나 때문에 새
     설정 컬렉션 구조를 여러 개 만들지 않습니다.
   ========================================================================== */

var AdminRoom = (function () {
  "use strict";

  var els = {};
  var selectedId = null;
  var cachedDocs = [];
  var listenerAttached = false;
  var phoneLoaded = false;

  var STATUS_LABEL = { new: "신규", processing: "처리중", completed: "완료" };

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function currentAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function setPhoneStatus(text, isError) {
    if (!els.phoneStatus) return;
    if (!text) { els.phoneStatus.hidden = true; return; }
    els.phoneStatus.hidden = false;
    els.phoneStatus.textContent = text;
    els.phoneStatus.className = "publish-status" + (isError ? " error" : " success");
  }

  // 하이픈 유무만 허용하는 느슨한 검증(과도한 정규식 금지) — 숫자만 뽑아
  // 9~11자리면 통과시킵니다(010-1234-5678, 01012345678 모두 허용).
  function isPlausiblePhone(value) {
    var digits = String(value || "").replace(/[^0-9]/g, "");
    return digits.length >= 9 && digits.length <= 11;
  }

  // 탭을 열 때 1회만 조회하고, 이후에는 다시 읽지 않습니다(입력칸에 남은
  // 값을 그대로 신뢰 — 저장 성공 시에도 새로 안 읽고 입력값을 유지).
  function loadPhoneSetting() {
    if (phoneLoaded || !els.phoneInput) return;
    var d = db();
    if (!d) return;
    phoneLoaded = true;
    d.collection("siteSettings").doc("general").get().then(function (doc) {
      var raw = doc.exists ? doc.data().roomInquiryPhone : "";
      if (raw) els.phoneInput.value = raw;
    }).catch(function () { /* 조용히 무시 — 입력칸은 빈 채로 둠 */ });
  }

  function handlePhoneSave(e) {
    e.preventDefault();
    var d = db();
    if (!d || !currentAdminUser()) { setPhoneStatus("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.", true); return; }
    var value = els.phoneInput.value.trim();
    if (!value) { setPhoneStatus("수신번호를 입력해주세요.", true); return; }
    if (!isPlausiblePhone(value)) { setPhoneStatus("올바른 전화번호 형식이 아닙니다.", true); return; }

    els.phoneSaveBtn.disabled = true;
    d.collection("siteSettings").doc("general").set({ roomInquiryPhone: value }, { merge: true }).then(function () {
      setPhoneStatus("저장되었습니다.", false);
    }).catch(function () {
      setPhoneStatus("저장에 실패했습니다.", true);
    }).finally(function () {
      els.phoneSaveBtn.disabled = false;
    });
  }

  function fmtDateTime(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : null;
    if (!d) return "-";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function renderList() {
    var body = els.listBody;
    if (!body) return;
    body.innerHTML = "";

    if (!cachedDocs.length) {
      els.listEmpty.textContent = "접수된 문의가 없습니다.";
      els.listEmpty.hidden = false;
      return;
    }
    els.listEmpty.hidden = true;

    var table = document.createElement("table");
    table.className = "results-table";
    table.innerHTML = "<thead><tr><th>접수일시</th><th>이름</th><th>전화번호</th>"
      + "<th>입주 희망일</th><th>희망 지역</th><th>희망 예산</th><th>보증금</th>"
      + "<th>월세</th><th>언어</th><th>상태</th></tr></thead>";
    var tbody = document.createElement("tbody");

    cachedDocs.forEach(function (item) {
      var p = item.data;
      var tr = document.createElement("tr");
      if (item.id === selectedId) tr.className = "selected";
      [
        fmtDateTime(p.createdAt), p.name, p.phone, p.moveInDate, p.preferredArea,
        p.budget, p.deposit, p.monthlyRent, p.language || "-",
        STATUS_LABEL[p.status] || p.status || "-"
      ].forEach(function (val) {
        var td = document.createElement("td");
        td.textContent = val || "-";
        tr.appendChild(td);
      });
      tr.addEventListener("click", function () {
        selectedId = item.id;
        renderList();
        renderDetail(item);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
  }

  function detailBox(label, value) {
    var box = document.createElement("div");
    box.className = "stat-box";
    var l = document.createElement("p"); l.className = "stat-label"; l.textContent = label;
    var v = document.createElement("p"); v.className = "stat-value"; v.style.fontSize = "15px"; v.textContent = value || "-";
    box.appendChild(l); box.appendChild(v);
    return box;
  }

  function renderDetail(item) {
    var p = item.data;
    els.detailCard.hidden = false;
    els.detailBody.innerHTML = "";

    var grid = document.createElement("div");
    grid.className = "stat-grid";
    grid.appendChild(detailBox("이름", p.name));
    grid.appendChild(detailBox("전화번호", p.phone));
    grid.appendChild(detailBox("입주 희망일", p.moveInDate));
    grid.appendChild(detailBox("희망 지역", p.preferredArea));
    grid.appendChild(detailBox("희망 예산", p.budget));
    grid.appendChild(detailBox("보증금", p.deposit));
    grid.appendChild(detailBox("월세", p.monthlyRent));
    els.detailBody.appendChild(grid);

    if (p.phone) {
      var telLink = document.createElement("a");
      telLink.href = "tel:" + p.phone;
      telLink.textContent = "📞 " + p.phone + "로 전화 걸기";
      telLink.style.display = "inline-block";
      telLink.style.margin = "14px 0 4px";
      els.detailBody.appendChild(telLink);
    }

    var statusBar = document.createElement("div");
    statusBar.className = "filter-bar";
    ["new", "processing", "completed"].forEach(function (st) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-btn" + (p.status === st ? " active" : "");
      btn.textContent = STATUS_LABEL[st];
      btn.addEventListener("click", function () { updateStatus(item.id, st, btn); });
      statusBar.appendChild(btn);
    });
    els.detailBody.appendChild(statusBar);
  }

  function updateStatus(id, status, btn) {
    var d = db();
    if (!d || !currentAdminUser()) return;
    if (btn) btn.disabled = true;
    d.collection("roomInquiries").doc(id).update({ status: status }).then(function () {
      loadInquiries();
    }).catch(function () {
      if (btn) btn.disabled = false;
    });
  }

  function loadInquiries() {
    var d = db();
    if (!els.listCard) return;
    if (!d || !currentAdminUser()) {
      els.authNotice.hidden = false;
      if (els.phoneCard) els.phoneCard.hidden = true;
      els.listCard.hidden = true;
      els.detailCard.hidden = true;
      return;
    }
    els.authNotice.hidden = true;
    if (els.phoneCard) { els.phoneCard.hidden = false; loadPhoneSetting(); }
    els.listCard.hidden = false;
    els.listLoading.hidden = false;
    els.listEmpty.hidden = true;

    d.collection("roomInquiries").orderBy("createdAt", "desc").limit(100).get().then(function (snap) {
      cachedDocs = [];
      snap.forEach(function (doc) { cachedDocs.push({ id: doc.id, data: doc.data() }); });
      els.listLoading.hidden = true;
      renderList();
    }).catch(function () {
      els.listLoading.hidden = true;
      els.listEmpty.textContent = "불러오지 못했습니다.";
      els.listEmpty.hidden = false;
    });
  }

  function init() {
    els.authNotice = qs("roomAuthNotice");
    els.phoneCard = qs("roomPhoneCard");
    els.phoneForm = qs("roomPhoneForm");
    els.phoneInput = qs("roomPhoneInput");
    els.phoneSaveBtn = qs("roomPhoneSaveBtn");
    els.phoneStatus = qs("roomPhoneStatus");
    els.listCard = qs("roomListCard");
    els.listLoading = qs("roomListLoading");
    els.listEmpty = qs("roomListEmpty");
    els.listBody = qs("roomListBody");
    els.detailCard = qs("roomDetailCard");
    els.detailBody = qs("roomDetailBody");
    if (!els.listBody) return; // 방 구하기 문의 탭 마크업이 없으면(구버전) 아무 것도 하지 않음

    if (els.phoneForm) els.phoneForm.addEventListener("submit", handlePhoneSave);

    loadInquiries();

    // 로그인 상태가 바뀔 때(예: 다른 탭에서 방금 로그인)만 다시 조회합니다
    // — 실시간 문서 리스너가 아니라 로그인/로그아웃 이벤트에만 반응합니다.
    if (!listenerAttached) {
      listenerAttached = true;
      var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
      if (auth) auth.onAuthStateChanged(function () { loadInquiries(); });
    }
  }

  return { init: init };
})();

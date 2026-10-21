/* ==========================================================================
   관리자 페이지 - 방 구하기 문의 (js/admin-room-inquiry.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "방 구하기 문의" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다(별도 로그인 화면 없음). js/admin-popup.js와 같은 방식입니다.
   - 문자(SMS) 수신번호(roomInquiryPhone)는 siteSettings/main 문서
     하나에 저장합니다(전화번호 하나만을 위한 새 설정 시스템을 만들지
     않음 — 기존 문서·필드 재사용).
   - 2026-09 "관리자 저장 기능 추가" 지시서 — 목록 컬럼(접수일/이름/국적/
     지역/입주일/인원/보증금/월세/상태)과 클릭 시 상세보기를 추가합니다.
     상세보기는 새 모달 라이브러리 없이 기존 ratings 탭의 "행 클릭 →
     .selected 표시 → 아래 패널 갱신" 패턴(admin.html selectRatingDate)을
     그대로 재사용합니다.
   ========================================================================== */

var AdminRoomInquiry = (function () {
  "use strict";

  var els = {};
  // siteSettings/main 캐시(같은 화면에서 반복 read 방지). null=아직 안 읽음.
  var cachedPhone = null;
  var inquiryCache = {}; // doc.id -> 마지막으로 불러온 문의 데이터(상세 패널 재사용)
  var selectedId = null;
  // "확인" 단계는 기존에 processing 값으로 저장되어 있어 값은 그대로 두고
  // 화면에 보이는 한글 라벨만 지시서 6번(신규/확인/완료)에 맞춥니다.
  var STATUS_LABEL = { new: "신규", processing: "확인", completed: "완료" };
  var STATUS_ORDER = ["new", "processing", "completed"];
  var REGION_LABEL = { injeUniv: "인제대학교 근처", gimhae: "김해", busan: "부산", etc: "기타" };
  var OCCUPANTS_LABEL = { "1": "1명", "2": "2명" };

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function currentAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function fmtDateTime(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : null;
    if (!d || isNaN(d.getTime())) return "-";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function normalizePhoneDigits(v) { return (v || "").replace(/[^0-9]/g, ""); }

  function regionText(v) { return REGION_LABEL[v] || v || "-"; }
  function occupantsText(v) { return OCCUPANTS_LABEL[v] || v || "-"; }
  function moneyText(v) { return v ? (v + "만원") : "-"; }

  // 지나치게 복잡한 검증은 만들지 않습니다 — 하이픈 유무만 허용하고
  // 자릿수만 느슨하게 확인합니다.
  function isValidPhoneLoose(v) {
    var digits = normalizePhoneDigits(v);
    return digits.length >= 9 && digits.length <= 11;
  }

  function setPhoneStatus(text, isError) {
    if (!els.phoneStatus) return;
    if (!text) { els.phoneStatus.hidden = true; return; }
    els.phoneStatus.hidden = false;
    els.phoneStatus.textContent = text;
    els.phoneStatus.className = "publish-status" + (isError ? " error" : " success");
  }

  function loadPhone() {
    var d = db();
    if (!d || !els.phoneInput) return;
    d.collection("siteSettings").doc("main").get().then(function (doc) {
      cachedPhone = (doc.exists && doc.data().roomInquiryPhone) || "";
      els.phoneInput.value = cachedPhone;
    }).catch(function () {
      setPhoneStatus("불러오지 못했습니다.", true);
    });
  }

  function handlePhoneSave(e) {
    e.preventDefault();
    var d = db();
    if (!d) { setPhoneStatus("Firebase가 연결되지 않았습니다.", true); return; }
    if (!currentAdminUser()) { setPhoneStatus("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.", true); return; }

    var value = els.phoneInput.value.trim();
    if (!value) { setPhoneStatus("전화번호를 입력해주세요.", true); return; }
    if (!isValidPhoneLoose(value)) { setPhoneStatus("올바른 전화번호 형식이 아닙니다.", true); return; }

    els.phoneSaveBtn.disabled = true;
    setPhoneStatus("저장 중...", false);
    d.collection("siteSettings").doc("main").set({ roomInquiryPhone: value }, { merge: true }).then(function () {
      cachedPhone = value; // 재배포 없이 바로 다음 문의부터 적용(학생 화면은 자체적으로 다시 읽음)
      setPhoneStatus("저장되었습니다.", false);
    }).catch(function () {
      setPhoneStatus("저장에 실패했습니다.", true);
    }).finally(function () { els.phoneSaveBtn.disabled = false; });
  }

  function updateStatus(id, next, selectEl, prevValue) {
    var d = db();
    if (!d) return;
    if (!currentAdminUser()) {
      window.alert("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.");
      selectEl.value = prevValue;
      return;
    }
    selectEl.disabled = true;
    d.collection("roomInquiries").doc(id).update({ status: next }).then(function () {
      if (inquiryCache[id]) inquiryCache[id].status = next;
      // 목록의 상태 텍스트·"신규" 강조(굵게 표시)를 재조회 없이 바로 갱신.
      var row = els.listBody && els.listBody.querySelector('tr[data-id="' + id + '"]');
      if (row) {
        row.classList.toggle("room-inquiry-new", next === "new");
        var statusCell = row.querySelector("td:last-child");
        if (statusCell) statusCell.textContent = STATUS_LABEL[next];
      }
    }).catch(function () {
      selectEl.value = prevValue;
    }).finally(function () {
      selectEl.disabled = false;
    });
  }

  // ratings 탭의 "행 클릭 → 선택 표시 → 아래 패널 갱신" 패턴을 그대로
  // 재사용(selectRatingDate와 같은 방식, 새 모달 없음).
  function selectInquiry(id) {
    selectedId = id;
    Array.prototype.forEach.call(els.listBody.querySelectorAll("tr[data-id]"), function (tr) {
      tr.classList.toggle("selected", tr.dataset.id === id);
    });
    renderDetail(inquiryCache[id]);
  }

  function renderDetail(r) {
    if (!els.detailBody) return;
    if (!r) { els.detailBody.innerHTML = "<p class=\"empty-note\">문의를 선택해주세요.</p>"; return; }

    els.detailBody.innerHTML = "";
    var rows = [
      ["접수일", fmtDateTime(r.createdAt)],
      ["이름", r.name || "-"],
      ["국적", r.nationality || "-"],
      ["희망지역", regionText(r.region)],
      ["입주 희망일", r.moveInDate || "-"],
      ["입주인원", occupantsText(r.occupants)],
      ["보증금", moneyText(r.deposit)],
      ["월세", moneyText(r.rent)]
    ];
    rows.forEach(function (pair) {
      var p = document.createElement("p");
      p.innerHTML = "<strong>" + pair[0] + ":</strong> ";
      p.appendChild(document.createTextNode(pair[1]));
      els.detailBody.appendChild(p);
    });

    // 전화번호만 tel: 링크(모바일 기본 전화 기능 재사용, 새 전화 API 없음).
    var phoneP = document.createElement("p");
    phoneP.innerHTML = "<strong>전화번호:</strong> ";
    if (r.phone) {
      var a = document.createElement("a");
      a.href = "tel:" + normalizePhoneDigits(r.phone);
      a.textContent = r.phone;
      phoneP.appendChild(a);
    } else {
      phoneP.appendChild(document.createTextNode("-"));
    }
    els.detailBody.appendChild(phoneP);

    var statusRow = document.createElement("p");
    statusRow.innerHTML = "<strong>처리상태:</strong> ";
    var select = document.createElement("select");
    STATUS_ORDER.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s;
      opt.textContent = STATUS_LABEL[s];
      if ((r.status || "new") === s) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      var prev = r.status || "new";
      r.status = select.value;
      updateStatus(r.id, select.value, select, prev);
    });
    statusRow.appendChild(select);
    els.detailBody.appendChild(statusRow);
  }

  function loadInquiries() {
    var d = db();
    var body = els.listBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("roomInquiries").orderBy("createdAt", "desc").limit(200).get().then(function (snap) {
      body.innerHTML = "";
      inquiryCache = {};
      selectedId = null;
      renderDetail(null);
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">등록된 문의가 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr>" +
        "<th>접수일</th><th>이름</th><th>국적</th><th>지역</th><th>입주일</th><th>인원</th><th>보증금</th><th>월세</th><th>상태</th>" +
        "</tr></thead>";
      var tbody = document.createElement("tbody");

      snap.forEach(function (doc) {
        var r = doc.data();
        r.id = doc.id;
        inquiryCache[doc.id] = r;

        var tr = document.createElement("tr");
        tr.dataset.id = doc.id;
        // 신규 문의는 굵게 표시해 눈에 띄게 합니다(새 라이브러리/애니메이션 없음).
        if ((r.status || "new") === "new") tr.classList.add("room-inquiry-new");
        tr.innerHTML =
          "<td>" + fmtDateTime(r.createdAt) + "</td>" +
          "<td>" + (r.name || "-") + "</td>" +
          "<td>" + (r.nationality || "-") + "</td>" +
          "<td>" + regionText(r.region) + "</td>" +
          "<td>" + (r.moveInDate || "-") + "</td>" +
          "<td>" + occupantsText(r.occupants) + "</td>" +
          "<td>" + moneyText(r.deposit) + "</td>" +
          "<td>" + moneyText(r.rent) + "</td>" +
          "<td>" + STATUS_LABEL[r.status || "new"] + "</td>";
        tr.addEventListener("click", function () { selectInquiry(doc.id); });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    }).catch(function () {
      body.innerHTML = "<p class=\"empty-note\">불러오지 못했습니다(관리자 로그인이 필요할 수 있습니다).</p>";
    });
  }

  function init() {
    els.phoneForm = qs("roomInquiryPhoneForm");
    if (!els.phoneForm) return; // 탭 마크업이 없으면(구버전) 아무 것도 하지 않음
    els.phoneInput = qs("roomInquiryPhoneInput");
    els.phoneSaveBtn = qs("roomInquiryPhoneSaveBtn");
    els.phoneStatus = qs("roomInquiryPhoneStatus");
    els.listBody = qs("roomInquiryListBody");
    els.detailBody = qs("roomInquiryDetailBody");

    els.phoneForm.addEventListener("submit", handlePhoneSave);

    loadPhone();
    loadInquiries();
    renderDetail(null);
  }

  return { init: init };
})();

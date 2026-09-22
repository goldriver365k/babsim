/* ==========================================================================
   관리자 페이지 - 방 구하기 문의 (js/admin-room-inquiry.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "방 구하기 문의" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다(별도 로그인 화면 없음). js/admin-popup.js와 같은 방식입니다.
   - 문자(SMS) 수신번호(roomInquiryPhone)는 siteSettings/main 문서
     하나에 저장합니다(전화번호 하나만을 위한 새 설정 시스템을 만들지
     않음 — 기존 문서·필드 재사용).
   ========================================================================== */

var AdminRoomInquiry = (function () {
  "use strict";

  var els = {};
  // siteSettings/main 캐시(같은 화면에서 반복 read 방지). null=아직 안 읽음.
  var cachedPhone = null;
  var STATUS_LABEL = { new: "신규", processing: "처리중", completed: "완료" };
  var STATUS_ORDER = ["new", "processing", "completed"];

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
    d.collection("roomInquiries").doc(id).update({ status: next }).catch(function () {
      selectEl.value = prevValue;
    }).finally(function () {
      selectEl.disabled = false;
    });
  }

  function loadInquiries() {
    var d = db();
    var body = els.listBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("roomInquiries").orderBy("createdAt", "desc").limit(200).get().then(function (snap) {
      body.innerHTML = "";
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">등록된 문의가 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr>" +
        "<th>접수일시</th><th>이름</th><th>전화번호</th><th>입주예정일</th><th>상태</th>" +
        "</tr></thead>";
      var tbody = document.createElement("tbody");

      snap.forEach(function (doc) {
        var r = doc.data();
        var tr = document.createElement("tr");

        var tdDate = document.createElement("td");
        tdDate.textContent = fmtDateTime(r.createdAt);
        tr.appendChild(tdDate);

        var tdName = document.createElement("td");
        tdName.textContent = r.name || "-";
        tr.appendChild(tdName);

        // 문의자 본인 전화번호(사용자가 입력한 phone 필드) — 관리자
        // 수신번호(roomInquiryPhone)와 절대 혼동하지 않습니다.
        var tdPhone = document.createElement("td");
        if (r.phone) {
          var phoneLink = document.createElement("a");
          phoneLink.href = "tel:" + normalizePhoneDigits(r.phone);
          phoneLink.textContent = r.phone;
          tdPhone.appendChild(phoneLink);
        } else {
          tdPhone.textContent = "-";
        }
        tr.appendChild(tdPhone);

        var tdMoveIn = document.createElement("td");
        tdMoveIn.textContent = r.moveInDate || "-";
        tr.appendChild(tdMoveIn);

        var tdStatus = document.createElement("td");
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
          updateStatus(doc.id, select.value, select, prev);
        });
        tdStatus.appendChild(select);
        tr.appendChild(tdStatus);

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

    els.phoneForm.addEventListener("submit", handlePhoneSave);

    loadPhone();
    loadInquiries();
  }

  return { init: init };
})();

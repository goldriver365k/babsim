/* ==========================================================================
   관리자 페이지 - 방 구하기 문의 (js/admin-room-inquiry.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "방 구하기 문의" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다(별도 로그인 화면 없음). js/admin-popup.js와 같은 방식입니다.
   - 카카오톡 채팅 연결주소(roomInquiryKakaoUrl)는 siteSettings/main
     문서 하나에 저장합니다(전화번호 대신 URL 하나만을 위한 새 설정
     시스템을 만들지 않음 — 기존 문서·필드 재사용).
   ========================================================================== */

var AdminRoomInquiry = (function () {
  "use strict";

  var els = {};
  // siteSettings/main 캐시(같은 화면에서 반복 read 방지). null=아직 안 읽음.
  var cachedKakaoUrl = null;
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

  // 지나치게 복잡한 검증은 만들지 않습니다 — http(s):// URL인지만 확인
  // 합니다(작업지시서 4번). 카카오톡 링크 자체를 코드에서 만들지 않고
  // 관리자가 직접 입력한 주소를 그대로 씁니다.
  function isValidHttpUrl(v) {
    try {
      var u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch (e) {
      return false;
    }
  }

  function setKakaoStatus(text, isError) {
    if (!els.kakaoStatus) return;
    if (!text) { els.kakaoStatus.hidden = true; return; }
    els.kakaoStatus.hidden = false;
    els.kakaoStatus.textContent = text;
    els.kakaoStatus.className = "publish-status" + (isError ? " error" : " success");
  }

  function loadKakaoUrl() {
    var d = db();
    if (!d || !els.kakaoInput) return;
    d.collection("siteSettings").doc("main").get().then(function (doc) {
      cachedKakaoUrl = (doc.exists && doc.data().roomInquiryKakaoUrl) || "";
      els.kakaoInput.value = cachedKakaoUrl;
    }).catch(function () {
      setKakaoStatus("불러오지 못했습니다.", true);
    });
  }

  function handleKakaoSave(e) {
    e.preventDefault();
    var d = db();
    if (!d) { setKakaoStatus("Firebase가 연결되지 않았습니다.", true); return; }
    if (!currentAdminUser()) { setKakaoStatus("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.", true); return; }

    var value = els.kakaoInput.value.trim();
    if (!value) { setKakaoStatus("카카오톡 연결주소를 입력해주세요.", true); return; }
    if (!isValidHttpUrl(value)) { setKakaoStatus("올바른 URL 형식이 아닙니다(http:// 또는 https://).", true); return; }

    els.kakaoSaveBtn.disabled = true;
    setKakaoStatus("저장 중...", false);
    d.collection("siteSettings").doc("main").set({ roomInquiryKakaoUrl: value }, { merge: true }).then(function () {
      cachedKakaoUrl = value; // 재배포 없이 바로 다음 문의부터 적용(학생 화면은 자체적으로 다시 읽음)
      setKakaoStatus("저장되었습니다.", false);
    }).catch(function () {
      setKakaoStatus("저장에 실패했습니다.", true);
    }).finally(function () { els.kakaoSaveBtn.disabled = false; });
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
        "<th>접수일시</th><th>이름</th><th>전화번호</th><th>입주희망일</th>" +
        "<th>희망지역</th><th>희망예산</th><th>보증금</th><th>월세</th><th>언어</th><th>상태</th>" +
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
        // 카카오톡 연결주소(roomInquiryKakaoUrl)와 절대 혼동하지 않습니다.
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

        var tdArea = document.createElement("td");
        tdArea.className = "menu-cell";
        tdArea.textContent = r.preferredArea || "-";
        tr.appendChild(tdArea);

        var tdBudget = document.createElement("td");
        tdBudget.textContent = r.budget || "-";
        tr.appendChild(tdBudget);

        var tdDeposit = document.createElement("td");
        tdDeposit.textContent = r.deposit || "-";
        tr.appendChild(tdDeposit);

        var tdRent = document.createElement("td");
        tdRent.textContent = r.monthlyRent || "-";
        tr.appendChild(tdRent);

        var tdLang = document.createElement("td");
        tdLang.textContent = r.language || "-";
        tr.appendChild(tdLang);

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
    els.kakaoForm = qs("roomInquiryKakaoForm");
    if (!els.kakaoForm) return; // 탭 마크업이 없으면(구버전) 아무 것도 하지 않음
    els.kakaoInput = qs("roomInquiryKakaoUrlInput");
    els.kakaoSaveBtn = qs("roomInquiryKakaoSaveBtn");
    els.kakaoStatus = qs("roomInquiryKakaoStatus");
    els.listBody = qs("roomInquiryListBody");

    els.kakaoForm.addEventListener("submit", handleKakaoSave);

    loadKakaoUrl();
    loadInquiries();
  }

  return { init: init };
})();

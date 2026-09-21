/* ==========================================================================
   방 구하기 문의 (js/room-inquiry.js)
   - 홈 화면 "방 구하기" 카드 → 언어 선택(4개) → 7개 입력 폼 → Firestore
     roomInquiries 컬렉션에 저장 성공 확인 후 sms: 링크로 기본 문자 앱을
     엽니다. 결제형 SMS API·새 번역 API·새 Netlify 함수를 쓰지 않습니다
     (기존 firebase-config.js의 Firestore 연결만 재사용).
   - 저장 성공 후에는 사용자가 실제 문자 전송을 취소하더라도 문의는
     이미 접수된 것으로 간주합니다(관리자가 저장된 전화번호로 별도 연락
     가능) — 지시서 15항의 의도된 동작입니다.
   - 수신 번호는 코드에 하드코딩하지 않고 관리자가 admin.html "방 구하기
     문의" 탭에서 저장한 Firestore siteSettings/general 문서의
     roomInquiryPhone 값을 읽어 씁니다(같은 페이지에서는 1회만 조회하고
     재사용 — js/admin-room.js와 같은 문서를 공유).
   ========================================================================== */

var RoomInquiry = (function () {
  "use strict";

  var LANGS = ["ko", "en", "vi", "zh"];
  var lang = null;
  var submitting = false;
  var els = {};
  var phonePromise = null; // 페이지 내 중복 조회 방지(최초 1회만 Firestore 조회)

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function tr(dict) { return (dict && lang && dict[lang]) || (dict && dict.ko) || ""; }
  function normalizePhone(raw) {
    return raw ? String(raw).replace(/[^0-9]/g, "") : "";
  }
  // siteSettings/general.roomInquiryPhone을 최초 1회만 읽고, 그 이후에는
  // 캐시된 값(또는 진행 중인 조회 Promise)을 그대로 재사용합니다.
  function loadPhoneOnce() {
    if (phonePromise) return phonePromise;
    var d = db();
    if (!d) { phonePromise = Promise.resolve(""); return phonePromise; }
    phonePromise = d.collection("siteSettings").doc("general").get().then(function (doc) {
      var raw = doc.exists ? doc.data().roomInquiryPhone : "";
      return normalizePhone(raw);
    }).catch(function () { return ""; });
    return phonePromise;
  }
  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function field(labelText, inputEl) {
    var wrap = el("div", "community-field");
    var label = el("label", "community-label", labelText);
    var id = "ri-" + Math.random().toString(36).slice(2, 9);
    label.setAttribute("for", id);
    inputEl.id = id;
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function openModal() {
    lang = null;
    submitting = false;
    if (els.overlay) els.overlay.hidden = false;
    loadPhoneOnce(); // 미리 조회를 시작해 두면(캐시) 실제 제출 시점엔 대부분 이미 준비돼 있음
    renderLangStep();
  }
  function closeModal() {
    if (els.overlay) els.overlay.hidden = true;
  }

  function renderLangStep() {
    var T = ROOM_INQUIRY_TEXT;
    els.title.textContent = "한국어 · English · Tiếng Việt · 中文";
    els.body.innerHTML = "";
    var list = el("div", "room-lang-list");
    LANGS.forEach(function (code) {
      var btn = el("button", "community-btn-secondary room-lang-btn", T.langNames[code]);
      btn.type = "button";
      btn.addEventListener("click", function () {
        lang = code;
        renderFormStep();
      });
      list.appendChild(btn);
    });
    els.body.appendChild(list);
  }

  function renderFormStep() {
    var T = ROOM_INQUIRY_TEXT;
    els.title.textContent = tr(T.formTitle);
    els.body.innerHTML = "";

    var form = el("form", "community-form room-inquiry-form");

    var nameInput = el("input"); nameInput.type = "text"; nameInput.required = true; nameInput.maxLength = 60;
    var phoneInput = el("input"); phoneInput.type = "tel"; phoneInput.required = true; phoneInput.maxLength = 20;
    var moveInInput = el("input"); moveInInput.type = "date"; moveInInput.required = true;
    var areaInput = el("input"); areaInput.type = "text"; areaInput.required = true; areaInput.maxLength = 80;
    var budgetInput = el("input"); budgetInput.type = "text"; budgetInput.required = true; budgetInput.maxLength = 40;
    var depositInput = el("input"); depositInput.type = "text"; depositInput.required = true; depositInput.maxLength = 40;
    var rentInput = el("input"); rentInput.type = "text"; rentInput.required = true; rentInput.maxLength = 40;

    form.appendChild(field(tr(T.fieldName), nameInput));
    form.appendChild(field(tr(T.fieldPhone), phoneInput));
    form.appendChild(field(tr(T.fieldMoveIn), moveInInput));
    form.appendChild(field(tr(T.fieldArea), areaInput));
    form.appendChild(field(tr(T.fieldBudget), budgetInput));
    form.appendChild(field(tr(T.fieldDeposit), depositInput));
    form.appendChild(field(tr(T.fieldRent), rentInput));

    form.appendChild(el("p", "room-inquiry-notice", tr(T.storageNotice)));

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", tr(T.submitButton));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return;
      errorP.textContent = "";

      var data = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        moveInDate: moveInInput.value,
        preferredArea: areaInput.value.trim(),
        budget: budgetInput.value.trim(),
        deposit: depositInput.value.trim(),
        monthlyRent: rentInput.value.trim(),
        language: lang,
        status: "new"
      };
      if (!data.name || !data.phone || !data.moveInDate || !data.preferredArea
          || !data.budget || !data.deposit || !data.monthlyRent) {
        errorP.textContent = tr(T.errRequired);
        return;
      }

      var d = db();
      if (!d) { errorP.textContent = tr(T.errGeneric); return; }

      submitting = true;
      submitBtn.disabled = true;

      var saveData = data;
      saveData.createdAt = firebase.firestore.FieldValue.serverTimestamp();

      d.collection("roomInquiries").add(saveData).then(function () {
        // 저장은 이미 성공했습니다 — 수신번호가 없어도 문의 접수 자체는
        // 그대로 유지합니다(7항: 임의 번호로 문자 앱을 열지 않음).
        return loadPhoneOnce().then(function (phone) {
          if (phone) launchSms(data, phone);
          renderDoneStep(!!phone);
        });
      }).catch(function (err) {
        console.error("방 구하기 문의 저장 오류:", err && err.code);
        errorP.textContent = tr(T.errGeneric);
        submitting = false;
        submitBtn.disabled = false;
      });
    });

    els.body.appendChild(form);
  }

  function launchSms(data, phone) {
    var body = "[방 구하기 문의]\n\n"
      + "이름: " + data.name + "\n"
      + "전화번호: " + data.phone + "\n"
      + "입주 희망일: " + data.moveInDate + "\n"
      + "희망 지역: " + data.preferredArea + "\n"
      + "희망 예산: " + data.budget + "\n"
      + "보증금: " + data.deposit + "\n"
      + "월세: " + data.monthlyRent;
    window.location.href = "sms:" + phone + "?body=" + encodeURIComponent(body);
  }

  function renderDoneStep(phoneConfigured) {
    var T = ROOM_INQUIRY_TEXT;
    els.title.textContent = tr(T.doneTitle);
    els.body.innerHTML = "";
    var msg = phoneConfigured ? T.doneMessage : T.notConfiguredMessage;
    els.body.appendChild(el("p", "room-inquiry-done-msg", tr(msg)));
    var closeBtn = el("button", "community-btn-primary", tr(T.closeButton));
    closeBtn.type = "button";
    closeBtn.addEventListener("click", closeModal);
    els.body.appendChild(closeBtn);
  }

  function init() {
    els.cardBtn = qs("roomSearchCardBtn");
    els.overlay = qs("roomInquiryOverlay");
    els.closeBtn = qs("roomInquiryClose");
    els.title = qs("roomInquiryTitle");
    els.body = qs("roomInquiryBody");
    if (!els.cardBtn || !els.overlay) return;

    els.cardBtn.addEventListener("click", openModal);
    if (els.closeBtn) els.closeBtn.addEventListener("click", closeModal);
    els.overlay.addEventListener("click", function (e) {
      if (e.target === els.overlay) closeModal();
    });
  }

  return { init: init };
})();

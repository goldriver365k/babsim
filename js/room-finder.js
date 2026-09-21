/* ==========================================================================
   babsim.store 방 구하기 (js/room-finder.js)
   - 홈 카드(#roomFinderCardBtn) 클릭 시 언어 선택 → 입력폼 순서로 진행하는
     모달을 띄웁니다. 기존 팝업들(js/hometown-popup.js 등)과 같은 방식
     (.modal-overlay/.modal, 새 팝업 라이브러리 없음)을 재사용합니다.
   - 입력폼은 기존 커뮤니티 폼 스타일(.community-form/.community-field/
     .community-label/.community-btn-primary)을 그대로 재사용합니다.
   - Firestore roomInquiries에 문의를 저장하고, 관리자가 설정한 SMS 수신번호
     (siteSettings/main의 roomInquiryPhone)를 읽어 휴대폰 기본 문자 앱을
     엽니다(sms: 링크, 유료 SMS API 없음).
   ========================================================================== */

var RoomFinder = (function () {
  "use strict";

  var LANGS = ["ko", "en", "vi", "zh"];
  var LANG_LABEL = { ko: "한국어", en: "English", vi: "Tiếng Việt", zh: "中文" };

  var els = {};
  var selectedLang = "ko";
  var submitting = false;
  // siteSettings/main의 roomInquiryPhone 캐시(같은 페이지에서 반복 read 방지).
  // null=아직 읽지 않음, ""=읽었지만 값 없음, 그 외=실제 번호.
  var cachedPhone = null;

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }

  function t(key) {
    var entry = (typeof ROOM_FINDER !== "undefined") ? ROOM_FINDER[key] : null;
    if (!entry) return "";
    return entry[selectedLang] || entry.ko || "";
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function closeModal() {
    var overlay = qs("roomFinderOverlay");
    if (overlay) overlay.remove();
    submitting = false;
  }

  function openModal() {
    if (qs("roomFinderOverlay")) return; // 이미 열려 있으면 중복 생성 방지
    selectedLang = "ko";

    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "roomFinderOverlay";

    var modal = document.createElement("div");
    modal.className = "modal room-finder-modal";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "닫기");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeModal);
    modal.appendChild(closeBtn);

    var body = document.createElement("div");
    body.id = "roomFinderBody";
    modal.appendChild(body);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
    document.body.appendChild(overlay);

    renderLangStep();
  }

  function renderLangStep() {
    var body = qs("roomFinderBody");
    if (!body) return;
    body.innerHTML = "";
    body.appendChild(el("h2", "room-finder-step-title", t("langStepTitle") || "방 구하기"));
    body.appendChild(el("p", "room-finder-step-desc", t("langStepDesc") || "언어를 선택해주세요"));

    var list = el("div", "room-finder-lang-list");
    LANGS.forEach(function (lang) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "community-btn-primary room-finder-lang-btn";
      btn.textContent = LANG_LABEL[lang];
      btn.addEventListener("click", function () {
        selectedLang = lang;
        renderFormStep();
      });
      list.appendChild(btn);
    });
    body.appendChild(list);
  }

  // 입력항목 정확히 7개(작업지시서 7번) — 임의 추가/삭제 금지.
  var FIELDS = [
    { key: "name", type: "text" },
    { key: "phone", type: "tel" },
    { key: "moveInDate", type: "date" },
    { key: "preferredArea", type: "text" },
    { key: "budget", type: "text" },
    { key: "deposit", type: "text" },
    { key: "monthlyRent", type: "text" }
  ];

  function renderFormStep() {
    var body = qs("roomFinderBody");
    if (!body) return;
    body.innerHTML = "";
    body.appendChild(el("h2", "room-finder-step-title", t("title")));

    var form = document.createElement("form");
    form.className = "community-form room-finder-form";

    var inputs = {};
    FIELDS.forEach(function (f) {
      var wrap = el("div", "community-field");
      var inputId = "roomFinderField_" + f.key;
      var label = el("label", "community-label", t("field_" + f.key));
      label.setAttribute("for", inputId);
      wrap.appendChild(label);

      var input = document.createElement("input");
      input.type = f.type;
      input.id = inputId;
      wrap.appendChild(input);

      form.appendChild(wrap);
      inputs[f.key] = input;
    });

    var statusP = el("p", "community-form-error");
    form.appendChild(statusP);

    form.appendChild(el("p", "room-finder-privacy", t("privacy")));

    var submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.className = "community-btn-primary room-finder-submit";
    submitBtn.textContent = t("submitButton");
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (submitting) return; // 버튼 중복 클릭 방지(같은 문의 중복 등록 방지)

      var name = inputs.name.value.trim();
      var phone = inputs.phone.value.trim();
      if (!name || !phone) {
        statusP.textContent = t("requiredError");
        return;
      }

      var d = db();
      if (!d) {
        statusP.textContent = t("saveError");
        return;
      }

      statusP.textContent = "";
      submitting = true;
      submitBtn.disabled = true;

      var data = {
        name: name,
        phone: phone,
        moveInDate: inputs.moveInDate.value.trim(),
        preferredArea: inputs.preferredArea.value.trim(),
        budget: inputs.budget.value.trim(),
        deposit: inputs.deposit.value.trim(),
        monthlyRent: inputs.monthlyRent.value.trim(),
        language: selectedLang,
        status: "new",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1) Firestore 저장 먼저(성공해야만 문자 앱을 엽니다) → 2) 관리자
      // 수신번호 확인 → 3) 문자 앱 실행. 저장에 실패했는데 성공한 것처럼
      // 처리하지 않습니다.
      d.collection("roomInquiries").add(data).then(function () {
        return sendSms(data, statusP, submitBtn);
      }).catch(function () {
        submitting = false;
        submitBtn.disabled = false;
        statusP.textContent = t("saveError");
      });
    });

    body.appendChild(form);
  }

  function fetchPhone() {
    if (cachedPhone !== null) return Promise.resolve(cachedPhone);
    var d = db();
    if (!d) { cachedPhone = ""; return Promise.resolve(""); }
    return d.collection("siteSettings").doc("main").get().then(function (doc) {
      cachedPhone = (doc.exists && doc.data().roomInquiryPhone) || "";
      return cachedPhone;
    }).catch(function () {
      cachedPhone = "";
      return "";
    });
  }

  function buildSmsBody(data) {
    var lines = [
      "[방 구하기 문의]",
      "",
      "이름: " + data.name,
      "전화번호: " + data.phone,
      "입주 희망일: " + (data.moveInDate || "-"),
      "희망 지역: " + (data.preferredArea || "-"),
      "희망 예산: " + (data.budget || "-"),
      "보증금: " + (data.deposit || "-"),
      "월세: " + (data.monthlyRent || "-"),
      "선택 언어: " + data.language
    ];
    return lines.join("\n");
  }

  // iPhone/Android sms: 링크 구분자 차이만 최소 분기(그 외 호환성 처리는
  // 브라우저 기본 동작에 맡깁니다 — 새 라이브러리 없음).
  function buildSmsLink(phone, body) {
    var digits = phone.replace(/[^0-9]/g, "");
    var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    var sep = isIOS ? "&" : "?";
    return "sms:" + digits + sep + "body=" + encodeURIComponent(body);
  }

  function sendSms(data, statusP, submitBtn) {
    return fetchPhone().then(function (phone) {
      submitting = false;
      if (!phone) {
        // 수신번호 미설정: 임의 번호로 문자 앱을 열지 않습니다. 문의는 이미
        // Firestore에 저장되어 관리자 문의 목록에는 그대로 남아 있습니다.
        statusP.textContent = t("phoneNotReady");
        submitBtn.disabled = true;
        return;
      }
      var smsLink = buildSmsLink(phone, buildSmsBody(data));
      window.location.href = smsLink;
      closeModal();
    });
  }

  function init() {
    els.cardBtn = qs("roomFinderCardBtn");
    if (!els.cardBtn) return;
    els.cardBtn.addEventListener("click", openModal);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { openModal: openModal };
})();

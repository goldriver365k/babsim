/* ==========================================================================
   babsim.store 방 구하기 (js/room-finder.js)
   - 홈 카드(#roomFinderCardBtn) 클릭 시 언어 선택 → 입력폼 순서로 진행하는
     모달을 띄웁니다. 기존 팝업들(js/hometown-popup.js 등)과 같은 방식
     (.modal-overlay/.modal, 새 팝업 라이브러리 없음)을 재사용합니다.
   - 입력폼은 기존 커뮤니티 폼 스타일(.community-form/.community-field/
     .community-label/.community-btn-primary)을 그대로 재사용합니다.
   - 2026-09 "관리자 저장" 지시서 — 사용자 입력항목은 정확히 8개(희망지역/
     입주희망일/입주인원/희망보증금/희망월세/이름/전화번호/국적)입니다.
     Firestore roomInquiries에 이 8개 정보(+운영용 language/status/
     createdAt)를 저장하고, 저장이 실제로 성공한 뒤에만 접수 완료 문구를
     보여줍니다. 그 다음 관리자가 설정한 SMS 수신번호(siteSettings/main의
     roomInquiryPhone)를 읽어 휴대폰 기본 문자 앱을 엽니다(sms: 링크,
     유료 SMS API 없음, 기존 문자 전달 기능 그대로 유지).
   - 국적 입력은 밥심커뮤니티 회원가입 화면(js/community.js
     renderCompleteProfile 등)과 같은 방식(text input + datalist +
     전역 COUNTRY_LIST)을 그대로 재사용합니다.
   ========================================================================== */

var RoomFinder = (function () {
  "use strict";

  var LANGS = ["ko", "en", "vi", "zh", "mn", "bn", "my"];
  var LANG_LABEL = { ko: "한국어", en: "English", vi: "Tiếng Việt", zh: "中文", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ" };

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

  // regionOptions/occupantOptions처럼 ROOM_FINDER 안에 중첩된 언어별
  // 사전을 조회할 때 씁니다(예: tNested(ROOM_FINDER.regionOptions, "gimhae")).
  function tNested(dict, key) {
    var entry = dict ? dict[key] : null;
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

  // 입력항목 정확히 8개(희망지역/입주희망일/입주인원/희망보증금/희망월세/
  // 이름/전화번호/국적) — 2026-09 "관리자 저장" 지시서로 확정. 임의
  // 추가/삭제 금지.
  var FIELDS = [
    { key: "region", kind: "select", options: ["injeUniv", "gimhae", "busan", "etc"] },
    { key: "moveInDate", kind: "date" },
    { key: "occupants", kind: "select", options: ["1", "2"] },
    { key: "deposit", kind: "number" },
    { key: "rent", kind: "number" },
    { key: "name", kind: "text" },
    { key: "phone", kind: "tel" },
    { key: "nationality", kind: "nationality" }
  ];

  function fieldLabel(f) {
    // 국적 라벨은 밥심커뮤니티 회원가입 화면의 기존 번역 키(COMMUNITY_AUTH.
    // nationalityLabel)를 그대로 재사용합니다(새 번역 키 없음).
    if (f.key === "nationality") {
      return (typeof COMMUNITY_AUTH !== "undefined" && COMMUNITY_AUTH.nationalityLabel)
        ? (COMMUNITY_AUTH.nationalityLabel[selectedLang] || COMMUNITY_AUTH.nationalityLabel.ko)
        : "";
    }
    return t("field_" + f.key);
  }

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
      var label = el("label", "community-label", fieldLabel(f));
      label.setAttribute("for", inputId);
      wrap.appendChild(label);

      var input;
      if (f.kind === "select") {
        input = document.createElement("select");
        var optDict = (f.key === "region") ? ROOM_FINDER.regionOptions : ROOM_FINDER.occupantOptions;
        f.options.forEach(function (optKey) {
          var opt = document.createElement("option");
          opt.value = optKey;
          opt.textContent = tNested(optDict, optKey);
          input.appendChild(opt);
        });
      } else {
        input = document.createElement("input");
        input.type = (f.kind === "nationality") ? "text" : f.kind;
        if (f.kind === "nationality" && typeof COUNTRY_LIST !== "undefined") {
          input.setAttribute("list", "roomFinderNationalityList");
        }
        if (f.kind === "number") {
          input.setAttribute("inputmode", "numeric");
          input.min = "0";
        }
      }
      input.id = inputId;
      wrap.appendChild(input);

      form.appendChild(wrap);
      inputs[f.key] = input;
    });

    // 국적 자동완성 — 밥심커뮤니티 회원가입 화면과 같은 전역 COUNTRY_LIST
    // datalist를 그대로 재사용(새 국가 목록 없음).
    if (typeof COUNTRY_LIST !== "undefined") {
      var datalist = document.createElement("datalist");
      datalist.id = "roomFinderNationalityList";
      COUNTRY_LIST.forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c;
        datalist.appendChild(opt);
      });
      form.appendChild(datalist);
    }

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

      var values = {};
      FIELDS.forEach(function (f) { values[f.key] = inputs[f.key].value.trim(); });
      var allFilled = FIELDS.every(function (f) { return !!values[f.key]; });
      if (!allFilled) {
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

      // 사용자 입력 8개 + 운영용 최소 메타데이터(language/status/createdAt).
      var data = {
        region: values.region,
        moveInDate: values.moveInDate,
        occupants: values.occupants,
        deposit: values.deposit,
        rent: values.rent,
        name: values.name,
        phone: values.phone,
        nationality: values.nationality,
        language: selectedLang,
        status: "new",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 1) Firestore 저장 먼저(성공해야만 접수 완료 문구를 보여주고 문자
      // 앱을 엽니다) → 2) 접수 완료 문구 표시 → 3) 관리자 수신번호 확인 →
      // 4) 문자 앱 실행. 저장에 실패했는데 성공한 것처럼 처리하지 않습니다
      // (비용 최소화 지시서 9번).
      d.collection("roomInquiries").add(data).then(function () {
        statusP.textContent = t("submitSuccess");
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

  // 문자 내용은 짧게 유지합니다(선택 언어·접수시간 등 긴 안내문은 넣지
  // 않음). 문자를 받는 쪽은 관리자이므로 한국어 라벨로 고정 표기합니다.
  function buildSmsBody(data) {
    var regionKo = (ROOM_FINDER.regionOptions[data.region] && ROOM_FINDER.regionOptions[data.region].ko) || data.region;
    var lines = [
      "[방 구하기 문의]",
      "",
      "이름: " + data.name,
      "전화번호: " + data.phone,
      "국적: " + (data.nationality || "-"),
      "희망지역: " + regionKo,
      "입주희망일: " + (data.moveInDate || "-"),
      "입주인원: " + (data.occupants || "-") + "명",
      "보증금: " + (data.deposit || "-") + "만원",
      "월세: " + (data.rent || "-") + "만원"
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
        // 접수 완료 문구(submitSuccess)는 이미 표시되어 있으므로 지우지
        // 않고 안내만 이어 붙입니다.
        statusP.textContent = t("submitSuccess") + " " + t("phoneNotReady");
        submitBtn.disabled = true;
        return;
      }
      var smsLink = buildSmsLink(phone, buildSmsBody(data));
      // 접수 완료 문구(submitSuccess)를 사용자가 실제로 읽을 수 있도록
      // 잠깐 보여준 뒤 문자 앱으로 이동합니다(새 라이브러리 없이
      // setTimeout만 사용).
      window.setTimeout(function () {
        window.location.href = smsLink;
        closeModal();
      }, 600);
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

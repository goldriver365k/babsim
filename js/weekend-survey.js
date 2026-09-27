/* ==========================================================================
   babsim.store 1,000원의 아침밥 — 주말·공휴일 운영 설문조사
   (js/weekend-survey.js)
   - 홈 최초 진입 시(및 홈 카드 클릭 시) 5개 언어(ko/en/zh/vi/bn) 중 하나를
     고르고 5문항에 답하는 모달을 띄웁니다. js/room-finder.js와 완전히 같은
     방식(.modal-overlay/.modal, 새 팝업 라이브러리 없음, 로그인/회원가입
     없음)을 그대로 재사용합니다.
   - 번역 문구는 5문항뿐이라 외부 번역 API 없이 이 파일 안에 직접
     저장합니다(비용 최소화 지시서 8/41번).
   - 질문을 넘길 때마다 Firestore에 쓰지 않습니다. 모든 답은 브라우저
     메모리(answers 변수)에만 두었다가 "완료" 버튼을 눌렀을 때 딱 1번만
     weekendBreakfastSurveys에 저장합니다(비용 최소화 지시서 39번).
   - 참여 여부는 기존 localStorage 방식(js/pwa.js의 INSTALLED_KEY류)과
     같은 패턴으로 "weekendBreakfastSurveyCompleted"/
     "weekendBreakfastSurveyVersion"에 기록합니다. 새 서버 검증 시스템 없음.
   ========================================================================== */

var WeekendSurvey = (function () {
  "use strict";

  var SURVEY_VERSION = 1;
  var COMPLETED_KEY = "weekendBreakfastSurveyCompleted";
  var VERSION_KEY = "weekendBreakfastSurveyVersion";
  var LANGS = ["ko", "en", "zh", "vi", "bn"];
  var LANG_LABEL = { ko: "한국어", en: "English", zh: "中文", vi: "Tiếng Việt", bn: "বাংলা" };
  // 오픈 시각(2026-09-28 오전 7시, 한국시간) — 그 전에는 최초 진입 자동
  // 표시도, 이벤트 배너 클릭도 설문을 열지 않고 "곧 시작합니다" 안내만
  // 보여줍니다. 새 스케줄러/서버 없이 클라이언트에서 현재 시각만 비교.
  var SURVEY_START_AT = new Date("2026-09-28T07:00:00+09:00");

  function hasStarted() { return Date.now() >= SURVEY_START_AT.getTime(); }

  // "이미 참여했습니다"/"곧 시작합니다" 같은 짧은 안내 모달은 사이트가
  // 현재 표시 중인 언어(foodhall_lang)에 맞춰 보여줍니다(설문 응답
  // 자체의 언어와는 무관 — mn/my처럼 설문이 지원하지 않는 언어면 한국어).
  function siteLang() {
    try {
      var l = localStorage.getItem("foodhall_lang");
      return (l && LANGS.indexOf(l) !== -1) ? l : "ko";
    } catch (e) { return "ko"; }
  }

  var els = {};
  var lang = "ko";
  var step = 0; // 0=언어선택, 1~5=질문
  var answers = {};
  var submitting = false;
  var onCloseCallback = null; // 설문이 닫힌 뒤(완료/× 모두) 이어서 실행할 콜백(기존 팝업 체인용)

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }

  function t(key) {
    var entry = WEEKEND_SURVEY[key];
    if (!entry) return "";
    return entry[lang] || entry.ko || "";
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // 이미 완료했는지(그리고 그 완료가 현재 설문 버전 기준인지) 확인합니다.
  // 버전이 올라가면(관리자가 새 설문을 만들면) 예전 참여자도 다시 볼 수
  // 있게, 완료 버전이 현재 버전보다 낮으면 "미완료"로 취급합니다.
  function hasCompletedCurrentVersion() {
    try {
      if (localStorage.getItem(COMPLETED_KEY) !== "true") return false;
      var v = parseInt(localStorage.getItem(VERSION_KEY), 10);
      return v >= SURVEY_VERSION;
    } catch (e) { return false; }
  }

  function markCompleted() {
    try {
      localStorage.setItem(COMPLETED_KEY, "true");
      localStorage.setItem(VERSION_KEY, String(SURVEY_VERSION));
    } catch (e) { /* localStorage 사용 불가 시에도 설문 자체는 이미 저장됨 */ }
  }

  function closeOverlay() {
    var overlay = qs("weekendSurveyOverlay");
    if (overlay) overlay.remove();
    submitting = false;
    var cb = onCloseCallback;
    onCloseCallback = null;
    if (cb) cb();
  }

  function openOverlay() {
    if (qs("weekendSurveyOverlay")) return;
    lang = "ko";
    step = 0;
    answers = {};

    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "weekendSurveyOverlay";

    var modal = document.createElement("div");
    modal.className = "modal weekend-survey-modal";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "닫기");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeOverlay);
    modal.appendChild(closeBtn);

    var body = document.createElement("div");
    body.id = "weekendSurveyBody";
    modal.appendChild(body);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeOverlay(); });
    document.body.appendChild(overlay);

    renderIntroStep();
  }

  // 이미 현재 버전 설문에 참여한 사람이 이벤트 배너를 눌렀을 때 — 새
  // "완료 화면"을 만들지 않고 기존 모달 껍데기 재사용, 버튼 1개(확인).
  // "이미 참여했습니다"/"곧 시작합니다"처럼 제목+설명+확인 버튼 1개뿐인
  // 짧은 안내 모달의 공용 껍데기(중복 코드 없이 재사용).
  function openSimpleModal(titleKey, descKey) {
    if (qs("weekendSurveyOverlay")) return;
    lang = siteLang();

    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "weekendSurveyOverlay";

    var modal = document.createElement("div");
    modal.className = "modal";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", "닫기");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeOverlay);
    modal.appendChild(closeBtn);

    modal.appendChild(el("h2", "modal-title", t(titleKey)));
    modal.appendChild(el("p", "room-finder-step-desc", t(descKey)));

    var okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "community-btn-primary weekend-survey-submit";
    okBtn.textContent = t("okButton");
    okBtn.addEventListener("click", closeOverlay);
    modal.appendChild(okBtn);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeOverlay(); });
    document.body.appendChild(overlay);
  }

  function openAlreadyDoneModal() { openSimpleModal("alreadyDoneTitle", "alreadyDoneDesc"); }
  function openNotStartedModal() { openSimpleModal("notStartedTitle", "notStartedDesc"); }

  function renderIntroStep() {
    var body = qs("weekendSurveyBody");
    if (!body) return;
    body.innerHTML = "";

    body.appendChild(el("h2", "weekend-survey-title", "1,000원의 아침밥"));
    body.appendChild(el("p", "weekend-survey-subtitle", "주말 및 공휴일 운영 설문조사"));

    // 5개 언어를 동시에 보여줌(지시서 5번) — 언어별 안내문을 한 화면에
    // 모두 표시하고, 그 아래 큰 언어 버튼을 누르면 바로 질문 1로 이동.
    var introList = el("div", "weekend-survey-intro-list");
    LANGS.forEach(function (l) {
      var line = el("p", "weekend-survey-intro-line");
      var langName = el("strong", null, LANG_LABEL[l] + " ");
      line.appendChild(langName);
      line.appendChild(document.createTextNode(WEEKEND_SURVEY.introDesc[l]));
      introList.appendChild(line);
    });
    body.appendChild(introList);

    var langList = el("div", "room-finder-lang-list");
    LANGS.forEach(function (l) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "community-btn-primary weekend-survey-lang-btn";
      btn.textContent = LANG_LABEL[l];
      btn.addEventListener("click", function () {
        lang = l;
        step = 1;
        renderQuestionStep();
      });
      langList.appendChild(btn);
    });
    body.appendChild(langList);
  }

  // 질문 정의 — key는 저장 필드명(지시서 37번)과 그대로 맞춥니다.
  var QUESTIONS = {
    1: { field: "nationalityType", qKey: "q1", options: ["korean", "international"] },
    2: { field: "livingType", qKey: "q2", options: ["dorm", "offcampus", "commute"] },
    3: { field: "preferredTime", qKey: "q3", options: ["0730", "0800"] },
    4: { field: "menuPreference", qKey: "q4", options: ["simple", "simple_korean", "other"], hasOther: true },
    5: { field: "usageIntent", qKey: "q5", options: ["often", "sometimes", "unsure", "no"], hasSuggestion: true }
  };

  function progressLabel(n) {
    var tpl = WEEKEND_SURVEY.progress[lang] || WEEKEND_SURVEY.progress.ko;
    return tpl.replace("{n}", n).replace("{total}", "5");
  }

  function renderQuestionStep() {
    var body = qs("weekendSurveyBody");
    if (!body) return;
    body.innerHTML = "";
    var q = QUESTIONS[step];

    body.appendChild(el("p", "weekend-survey-progress", progressLabel(step)));
    body.appendChild(el("h2", "room-finder-step-title", t(q.qKey + "_title")));

    var optionsWrap = el("div", "weekend-survey-options");
    var otherInput = null;
    q.options.forEach(function (optKey) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "community-btn-secondary weekend-survey-option-btn" +
        (answers[q.field] === optKey ? " weekend-survey-option-selected" : "");
      btn.textContent = t(q.qKey + "_opt_" + optKey);
      btn.addEventListener("click", function () {
        answers[q.field] = optKey;
        if (!q.hasOther || optKey !== "other") answers.menuOtherOpinion = answers.menuOtherOpinion || "";
        renderQuestionStep();
      });
      optionsWrap.appendChild(btn);
    });
    body.appendChild(optionsWrap);

    if (q.hasOther && answers[q.field] === "other") {
      otherInput = document.createElement("textarea");
      otherInput.className = "weekend-survey-textarea";
      otherInput.placeholder = t("q4_otherPlaceholder");
      otherInput.value = answers.menuOtherOpinion || "";
      otherInput.addEventListener("input", function () { answers.menuOtherOpinion = otherInput.value; });
      body.appendChild(otherInput);
    }

    var suggestionInput = null;
    if (q.hasSuggestion) {
      body.appendChild(el("h3", "weekend-survey-suggestion-title", t("suggestionTitle")));
      body.appendChild(el("p", "weekend-survey-suggestion-desc", t("suggestionDesc")));
      suggestionInput = document.createElement("textarea");
      suggestionInput.className = "weekend-survey-textarea";
      suggestionInput.placeholder = t("suggestionPlaceholder");
      suggestionInput.value = answers.suggestion || "";
      suggestionInput.addEventListener("input", function () { answers.suggestion = suggestionInput.value; });
      body.appendChild(suggestionInput);
    }

    var statusP = el("p", "community-form-error");
    body.appendChild(statusP);

    var navRow = el("div", "weekend-survey-nav");
    if (step > 1) {
      var prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "community-btn-secondary weekend-survey-nav-btn";
      prevBtn.textContent = t("prevButton");
      prevBtn.addEventListener("click", function () { step -= 1; renderQuestionStep(); });
      navRow.appendChild(prevBtn);
    }

    var nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "community-btn-primary weekend-survey-nav-btn";
    nextBtn.textContent = (step === 5) ? t("completeButton") : t("nextButton");
    nextBtn.addEventListener("click", function () {
      if (!answers[q.field]) {
        statusP.textContent = t("selectRequired");
        return;
      }
      if (step === 5) {
        submitSurvey(nextBtn, statusP);
        return;
      }
      step += 1;
      renderQuestionStep();
    });
    navRow.appendChild(nextBtn);

    body.appendChild(navRow);
  }

  function submitSurvey(btn, statusP) {
    if (submitting) return; // 완료 버튼 중복 클릭 방지(지시서 19번)
    var d = db();
    if (!d) { statusP.textContent = t("saveError"); return; }

    submitting = true;
    btn.disabled = true;

    // 저장 항목은 지시서 37번에 명시된 것만(개인정보 없음 — 38번).
    var data = {
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      selectedLanguage: lang,
      nationalityType: answers.nationalityType,
      livingType: answers.livingType,
      preferredTime: answers.preferredTime,
      menuPreference: answers.menuPreference,
      menuOtherOpinion: answers.menuOtherOpinion || "",
      usageIntent: answers.usageIntent,
      suggestion: answers.suggestion || "",
      surveyVersion: SURVEY_VERSION
    };

    d.collection("weekendBreakfastSurveys").add(data).then(function () {
      markCompleted();
      closeOverlay(); // 별도 완료 화면 없이 바로 밥심 홈페이지 노출(지시서 18번)
    }).catch(function () {
      submitting = false;
      btn.disabled = false;
      statusP.textContent = t("saveError");
    });
  }

  // 홈 최초 진입 시 자동 호출(지시서 3번) — 오픈 시각 전이거나 이미
  // 현재 버전에 참여했으면 아무 것도 띄우지 않고 바로 next()를 불러
  // 기존 팝업 체인을 그대로 진행.
  function maybeShowOnEntry(next) {
    if (!hasStarted() || hasCompletedCurrentVersion()) { if (next) next(); return; }
    onCloseCallback = next || null; // 설문을 닫은 뒤(완료/×)에만 다음 팝업(SitePopup 등)으로 이어감 — 겹쳐 뜨지 않게
    openOverlay();
  }

  // 이벤트 배너 클릭(지시서 24/25번) — 오픈 전이면 "곧 시작합니다" 안내,
  // 이미 참여했으면 "이미 참여했습니다" 안내만 보여줍니다.
  function openFromBanner() {
    if (!hasStarted()) { openNotStartedModal(); return; }
    if (hasCompletedCurrentVersion()) { openAlreadyDoneModal(); return; }
    openOverlay();
  }

  function init() {
    els.bannerBtn = qs("homeLegoSurveyBtn");
    if (els.bannerBtn) els.bannerBtn.addEventListener("click", openFromBanner);
  }

  document.addEventListener("DOMContentLoaded", init);

  return { openFromBanner: openFromBanner, maybeShowOnEntry: maybeShowOnEntry };
})();

/* ==========================================================================
   천원의 아침밥 — 오늘의 메뉴 평가 (학생용)
   - 캐릭터 하나를 터치하면 별도 버튼 없이 즉시 저장됩니다.
   - 같은 기기에서는 같은 날짜(KST 기준)에 1회만 평가할 수 있습니다.
   - 문구는 BREAKFAST_RATING_TEXT(js/translations.js)의 번역을 그대로 사용합니다.
   - app.js의 renderBreakfastArea()에서 window.BreakfastRating.render(...)를
     호출하는 방식으로 연결되며, 이 스크립트가 없어도 기존 화면은 그대로
     동작합니다(선택적 연동).
   ========================================================================== */

var BreakfastRating = (function () {
  "use strict";

  var DEVICE_ID_KEY = "foodhall_device_id";
  var RATED_KEY_PREFIX = "foodhall_breakfast_rating_"; // + dateKey(YYYY-MM-DD)
  var SCORES = [5, 4, 3, 2, 1];

  var els = null;
  var busy = false;
  var justRatedDateKey = null; // 이번 화면 방문 중 방금 평가를 마친 날짜(감사 문구용)

  function qs(id) { return document.getElementById(id); }

  function ensureEls() {
    if (els) return els;
    var wrap = qs("baRating");
    if (!wrap) { els = {}; return els; }
    els = {
      wrap: wrap,
      title: qs("baRatingTitle"),
      options: qs("baRatingOptions"),
      message: qs("baRatingMessage")
    };
    return els;
  }

  /* ---------------- 기기 식별 / 하루 1회 제한 (강한 인증이 아닌 단순 중복 방지용) ---------------- */

  function getDeviceId() {
    try {
      var id = localStorage.getItem(DEVICE_ID_KEY);
      if (id) return id;
      id = (window.crypto && typeof crypto.randomUUID === "function")
        ? crypto.randomUUID()
        : ("dev-" + Date.now() + "-" + Math.random().toString(16).slice(2));
      localStorage.setItem(DEVICE_ID_KEY, id);
      return id;
    } catch (e) {
      return "dev-nostorage";
    }
  }

  function getRatedToday(dateKey) {
    try { return localStorage.getItem(RATED_KEY_PREFIX + dateKey); } catch (e) { return null; }
  }

  function setRatedToday(dateKey, score) {
    try { localStorage.setItem(RATED_KEY_PREFIX + dateKey, String(score)); } catch (e) { /* localStorage 미지원 시 무시 */ }
  }

  /* ---------------- 캐릭터 얼굴 SVG (동일 캐릭터, 표정만 5단계로 변화) ---------------- */

  var FACE_SPEC = {
    5: { mouth: "M27,54 Q50,80 73,54 Q50,67 27,54 Z", fill: true, browTilt: 4, eye: "happy" },
    4: { mouth: "M30,56 Q50,70 70,56", fill: false, browTilt: 2, eye: "normal" },
    3: { mouth: "M33,61 L67,61", fill: false, browTilt: 0, eye: "normal" },
    2: { mouth: "M30,68 Q50,58 70,68", fill: false, browTilt: -2, eye: "normal" },
    1: { mouth: "M27,71 Q50,52 73,71", fill: false, browTilt: -4, eye: "sad" }
  };

  function buildFaceSvg(score) {
    var spec = FACE_SPEC[score];
    var browY = 34 - spec.browTilt;

    var eyesSvg;
    if (spec.eye === "happy") {
      eyesSvg =
        '<path d="M23,41 Q31,31 39,41" fill="none" stroke="#1f2328" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M61,41 Q69,31 77,41" fill="none" stroke="#1f2328" stroke-width="4" stroke-linecap="round"/>';
    } else if (spec.eye === "sad") {
      eyesSvg =
        '<circle cx="31" cy="40" r="4.5" fill="#1f2328"/>' +
        '<circle cx="69" cy="40" r="4.5" fill="#1f2328"/>';
    } else {
      eyesSvg =
        '<circle cx="31" cy="39" r="5" fill="#1f2328"/>' +
        '<circle cx="69" cy="39" r="5" fill="#1f2328"/>';
    }

    var mouthSvg = spec.fill
      ? '<path d="' + spec.mouth + '" fill="#a13a2f"/>'
      : '<path d="' + spec.mouth + '" fill="none" stroke="#1f2328" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';

    return (
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<circle cx="50" cy="50" r="46" fill="#ffd166" stroke="#1f2328" stroke-width="3"/>' +
      '<path d="M17,' + browY + ' L39,' + (browY - 3) + '" stroke="#1f2328" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M61,' + (browY - 3) + ' L83,' + browY + '" stroke="#1f2328" stroke-width="4" stroke-linecap="round"/>' +
      eyesSvg +
      mouthSvg +
      '</svg>'
    );
  }

  /* ---------------- 저장 (Firestore 우선, 미설정 시 기기 저장만) ---------------- */

  function saveRating(score, dateKey, lang, menuText) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      // Firebase 미설정 상태: 학생 화면은 정상 동작하되 관리자 통계에는 집계되지 않음
      return Promise.resolve({ local: true });
    }

    var docData = {
      date: dateKey,
      menuId: "breakfast-" + dateKey.replace(/-/g, ""),
      rating: score,
      language: lang,
      deviceId: getDeviceId(),
      mainMenu: menuText || null,
      createdAt: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    return db.collection("breakfastRatings").add(docData);
  }

  /* ---------------- 렌더링 ---------------- */

  function text(key, lang) {
    var entry = BREAKFAST_RATING_TEXT[key];
    if (!entry) return "";
    return entry[lang] || entry.ko || "";
  }

  function renderOptions(dateKey, lang, menuText) {
    els.options.innerHTML = "";
    SCORES.forEach(function (score) {
      var label = text("score" + score, lang);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ba-rating-option";
      btn.setAttribute("aria-label", label);

      var faceWrap = document.createElement("span");
      faceWrap.className = "ba-rating-face";
      faceWrap.innerHTML = buildFaceSvg(score);
      btn.appendChild(faceWrap);

      var labelEl = document.createElement("span");
      labelEl.className = "ba-rating-label";
      labelEl.textContent = label;
      btn.appendChild(labelEl);

      btn.addEventListener("click", function () { handlePick(score, dateKey, lang, menuText); });
      els.options.appendChild(btn);
    });
  }

  function showOptions(lang, dateKey, menuText) {
    els.title.hidden = false;
    els.title.textContent = text("title", lang);
    els.options.hidden = false;
    renderOptions(dateKey, lang, menuText);
    els.message.hidden = true;
  }

  function showCompletedOrThanks(lang, dateKey) {
    els.title.hidden = true;
    els.options.hidden = true;
    els.options.innerHTML = "";
    els.message.hidden = false;
    if (justRatedDateKey === dateKey) {
      els.message.className = "ba-rating-message ba-rating-message-thanks";
      els.message.textContent = text("thanks", lang);
    } else {
      els.message.className = "ba-rating-message ba-rating-message-completed";
      els.message.textContent = text("completed", lang);
    }
  }

  function showErrorKeepOptions(lang) {
    Array.prototype.forEach.call(els.options.querySelectorAll(".ba-rating-option"), function (btn) {
      btn.disabled = false;
    });
    els.message.hidden = false;
    els.message.className = "ba-rating-message ba-rating-message-error";
    els.message.textContent = text("error", lang);
    busy = false;
  }

  function handlePick(score, dateKey, lang, menuText) {
    if (busy) return;
    busy = true;
    els.message.hidden = true;
    Array.prototype.forEach.call(els.options.querySelectorAll(".ba-rating-option"), function (btn) {
      btn.disabled = true;
    });

    saveRating(score, dateKey, lang, menuText).then(function () {
      setRatedToday(dateKey, score);
      justRatedDateKey = dateKey;
      busy = false;
      showCompletedOrThanks(lang, dateKey);
    }).catch(function (err) {
      console.error("아침밥 평가 저장 오류:", err);
      showErrorKeepOptions(lang);
    });
  }

  /**
   * @param {string} lang 현재 선택된 언어 (ko/en/zh/vi/mn)
   * @param {boolean} hasTodayMenu 오늘 천원의 아침밥 메뉴가 존재하는지 (주말/휴무 시 false)
   * @param {string} dateKey 오늘 날짜 (Asia/Seoul, YYYY-MM-DD)
   * @param {string} menuText 오늘의 주메뉴(한국어) - 관리자 통계 표시용
   */
  function render(lang, hasTodayMenu, dateKey, menuText) {
    ensureEls();
    if (!els.wrap) return;

    if (!hasTodayMenu || typeof BREAKFAST_RATING_TEXT === "undefined") {
      els.wrap.hidden = true;
      return;
    }
    els.wrap.hidden = false;

    var already = getRatedToday(dateKey);
    if (already) {
      showCompletedOrThanks(lang, dateKey);
      return;
    }
    showOptions(lang, dateKey, menuText);
  }

  return { render: render };
})();

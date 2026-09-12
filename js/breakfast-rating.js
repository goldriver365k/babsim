/* ==========================================================================
   천원의 아침밥 — 오늘의 메뉴 평가 (학생용)
   - 캐릭터 하나를 터치하면 별도 버튼 없이 즉시 저장됩니다.
   - 같은 기기에서는 같은 날짜(KST 기준)에 1회만 평가할 수 있습니다.
   - 문구는 BREAKFAST_RATING_TEXT(js/translations.js)의 번역을 그대로 사용합니다.
   - app.js의 openBreakfastPopup()에서 window.BreakfastRating.render(...)를
     호출하는 방식으로 연결되며(평가 UI 수정 단계부터 본문이 아닌 당일
     첫 방문 팝업 안에서만 렌더링됩니다), 이 스크립트가 없어도 기존
     화면은 그대로 동작합니다(선택적 연동).
   ========================================================================== */

var BreakfastRating = (function () {
  "use strict";

  var DEVICE_ID_KEY = "foodhall_device_id";
  var RATED_KEY_PREFIX = "foodhall_breakfast_rating_"; // + dateKey(YYYY-MM-DD)
  var SCORES = [5, 4, 3, 2, 1];

  var els = null;
  var busy = false;
  var justRatedDateKey = null; // 이번 화면 방문 중 방금 평가를 마친 날짜(감사 문구용)
  var onRatedCallback = null; // 평가 저장 성공 직후 호출자(app.js)에게 알리는 선택적 콜백

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

  /* ---------------- 평가 이모티콘 이미지 (2026-09-12 이모티콘 교체) ----------------
     기존 인라인 SVG 캐릭터 대신, 업로드받은 5단계 표정 이미지를 그대로
     씁니다(images/breakfast/rating-{score}.png, score가 클수록 좋은 평가). */
  function faceImageSrc(score) {
    return "images/breakfast/rating-" + score + ".png";
  }

  /* ---------------- 저장 (Firestore 우선, 미설정 시 기기 저장만) ---------------- */

  function saveRating(score, dateKey, lang, menuText, menuNames, mealType) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      // Firebase 미설정 상태: 학생 화면은 정상 동작하되 관리자 통계에는 집계되지 않음
      return Promise.resolve({ local: true });
    }

    var docData = {
      date: dateKey,
      menuDate: dateKey,
      menuId: "breakfast-" + dateKey.replace(/-/g, ""),
      mealType: mealType || "regular",
      rating: score,
      language: lang,
      deviceId: getDeviceId(),
      mainMenu: menuText || null,
      menuNames: Array.isArray(menuNames) && menuNames.length ? menuNames : null,
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

  function renderOptions(dateKey, lang, menuText, menuNames, mealType) {
    els.options.innerHTML = "";
    SCORES.forEach(function (score) {
      var label = text("score" + score, lang);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ba-rating-option";
      btn.setAttribute("aria-label", label);

      var faceImg = document.createElement("img");
      faceImg.className = "ba-rating-face";
      faceImg.src = faceImageSrc(score);
      faceImg.alt = "";
      faceImg.setAttribute("aria-hidden", "true");
      btn.appendChild(faceImg);

      var labelEl = document.createElement("span");
      labelEl.className = "ba-rating-label";
      labelEl.textContent = label;
      btn.appendChild(labelEl);

      btn.addEventListener("click", function () { handlePick(score, dateKey, lang, menuText, menuNames, mealType); });
      els.options.appendChild(btn);
    });
  }

  function showOptions(lang, dateKey, menuText, menuNames, mealType) {
    els.title.hidden = false;
    els.title.textContent = text("title", lang);
    els.options.hidden = false;
    renderOptions(dateKey, lang, menuText, menuNames, mealType);
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

  function handlePick(score, dateKey, lang, menuText, menuNames, mealType) {
    if (busy) return;
    busy = true;
    els.message.hidden = true;
    Array.prototype.forEach.call(els.options.querySelectorAll(".ba-rating-option"), function (btn) {
      btn.disabled = true;
    });

    saveRating(score, dateKey, lang, menuText, menuNames, mealType).then(function () {
      // 저장이 실제로 성공한 뒤에만(DB 응답 확인 후) 완료 처리합니다 —
      // 실패 시에는 이 블록에 도달하지 않으므로 아래 콜백도 호출되지 않습니다.
      setRatedToday(dateKey, score);
      justRatedDateKey = dateKey;
      busy = false;
      showCompletedOrThanks(lang, dateKey);
      if (typeof onRatedCallback === "function") onRatedCallback(dateKey, score);
    }).catch(function (err) {
      console.error("아침밥 평가 저장 오류:", err);
      showErrorKeepOptions(lang);
    });
  }

  /**
   * @param {string} lang 현재 선택된 언어 (ko/en/zh/vi/mn)
   * @param {boolean} hasTodayMenu 오늘 천원의 아침밥 메뉴가 존재하는지 (주말/휴무/미등록 시 false)
   * @param {string} dateKey 오늘 날짜 (Asia/Seoul, YYYY-MM-DD)
   * @param {string} menuText 오늘의 대표 메뉴(한국어) - 관리자 통계 표시용
   * @param {string[]} [menuNames] 오늘 제공된 메뉴 전체 목록(한국어) - 평가 데이터에 함께 저장
   * @param {string} [mealType] "regular" | "simple" - menuNames가 어느 쪽 메뉴인지
   * @param {function} [onRated] 평가 저장이 성공한 직후 호출되는 선택적 콜백(dateKey, score)
   *   — 평가 팝업(app.js)이 "오늘 평가 완료" 상태 저장 + 팝업 닫기에 사용합니다.
   */
  function render(lang, hasTodayMenu, dateKey, menuText, menuNames, mealType, onRated) {
    ensureEls();
    onRatedCallback = onRated || null;
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
    showOptions(lang, dateKey, menuText, menuNames, mealType);
  }

  // 모바일 UI 개선 6단계: 당일 첫 방문 평가 팝업이 "이미 평가했는지"
  // 확인할 때 새 저장소를 또 만들지 않고 이 모듈의 기존 저장 값을
  // 그대로 재사용하기 위한 조회 전용 함수입니다.
  function isRatedToday(dateKey) { return !!getRatedToday(dateKey); }

  return { render: render, isRatedToday: isRatedToday };
})();

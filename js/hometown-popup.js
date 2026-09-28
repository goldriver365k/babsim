/* ==========================================================================
   babsim.store 홈 이벤트 팝업 — 후루룩찹찹 신메뉴(새우완탕쌀국수) 안내
   (js/hometown-popup.js)
   - 관리자 등록 팝업(js/site-popup.js)과 같은 방식(.modal-overlay/.modal,
     새 팝업 라이브러리 없음)을 재사용합니다.
   - 2026-09 "새우완탕쌀국수" 지시서 — 이전에 이 컴포넌트가 보여주던
     "고추장버터 화산불백" 예고는 이제 홈 히어로 영역(js/app.js
     renderHomeHeroSlide, HERO_MENU_PROMO)에서 상시 노출되므로 그 쪽은
     전혀 건드리지 않고, 여기(자동표시 팝업)는 다음 신메뉴로 교체해
     재사용합니다.
   - 일반 관리자 팝업(SitePopup) → 이 팝업 → 천원의 아침밥 평가 팝업 순서로
     app.js가 순차 호출해 동시에 겹치지 않습니다(app.js의 체인에서 호출되는
     한 단계만 이 파일이 담당).
   ========================================================================== */

var HometownPopup = (function () {
  "use strict";

  var SESSION_DISMISS_KEY = "hometownPopupDismissedSession";
  var TODAY_DISMISS_KEY = "hometownPopupDismissedDate";
  var LANG_KEY = "foodhall_lang"; // js/app.js LANG_KEY와 동일한 값(공용 저장소 재사용)

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function currentLang() {
    try {
      var v = localStorage.getItem(LANG_KEY);
      return (v && HOMETOWN_POPUP.button[v]) ? v : "ko";
    } catch (e) { return "ko"; }
  }

  function t(key) {
    var entry = HOMETOWN_POPUP[key];
    if (!entry) return "";
    var lang = currentLang();
    return entry[lang] || entry.ko || "";
  }

  function isDismissedToday() {
    try { return localStorage.getItem(TODAY_DISMISS_KEY) === todayKey(); } catch (e) { return false; }
  }
  function markDismissedToday() {
    try { localStorage.setItem(TODAY_DISMISS_KEY, todayKey()); } catch (e) { /* localStorage 미지원 시 무시 */ }
  }
  function isDismissedThisSession() {
    try { return sessionStorage.getItem(SESSION_DISMISS_KEY) === "true"; } catch (e) { return false; }
  }
  function markDismissedThisSession() {
    try { sessionStorage.setItem(SESSION_DISMISS_KEY, "true"); } catch (e) { /* sessionStorage 미지원 시 무시 */ }
  }

  // 홈 서비스 카드/헤더 매장 탭이 쓰는 기존 매장 이동 함수(js/app.js
  // goToStore)를 그대로 재사용합니다 — 새 라우팅/URL을 만들지 않습니다.
  function goToHururuk() {
    if (typeof window.goToStore === "function") window.goToStore("hururuk");
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderPopup(onClosed) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "hometownPopupOverlay";

    var modal = document.createElement("div");
    modal.className = "modal hometown-popup-modal";

    function closeNow() {
      markDismissedThisSession();
      overlay.remove();
      if (onClosed) onClosed();
    }

    function goAndClose() {
      markDismissedThisSession();
      overlay.remove();
      if (onClosed) onClosed();
      goToHururuk();
    }

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", t("closeAriaLabel") || "닫기");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeNow);
    modal.appendChild(closeBtn);

    // 새우완탕쌀국수(2026-09 신메뉴 지시서) — ①사진 ②메뉴명 ③가격
    // ④NEW MENU ⑤짧은 설명 순서로 눈에 들어오도록 사진을 가장 먼저
    // 배치합니다. 메뉴명·가격은 다른 브랜드/메뉴명과 같이 언어와 무관하게
    // 원문(한국어) 그대로 고정합니다(지시서 7번 — 번역하지 않음).
    var poster = el("div", "hometown-popup-poster");

    var img = document.createElement("img");
    img.className = "hometown-popup-image";
    img.src = "images/hururuk/shrimp-wonton-rice-noodle.webp";
    img.alt = "새우완탕쌀국수";
    poster.appendChild(img);

    poster.appendChild(el("p", "hometown-popup-eyebrow", "NEW MENU"));

    var titleBlock = el("div", "hometown-popup-title-block");
    titleBlock.appendChild(el("p", "hometown-popup-title-main", "새우완탕쌀국수"));
    poster.appendChild(titleBlock);

    poster.appendChild(el("p", "hometown-popup-price", "5,500원"));
    poster.appendChild(el("p", "hometown-popup-tagline", t("newMenuTagline")));

    modal.appendChild(poster);

    var ctaBtn = document.createElement("button");
    ctaBtn.type = "button";
    ctaBtn.className = "community-btn-primary hometown-popup-cta";
    ctaBtn.textContent = t("button");
    ctaBtn.addEventListener("click", goAndClose);
    modal.appendChild(ctaBtn);

    var dismissTodayBtn = document.createElement("button");
    dismissTodayBtn.type = "button";
    dismissTodayBtn.className = "hometown-popup-dismiss-today";
    dismissTodayBtn.textContent = t("dismissToday");
    dismissTodayBtn.addEventListener("click", function () {
      markDismissedToday();
      overlay.remove();
      if (onClosed) onClosed();
    });
    modal.appendChild(dismissTodayBtn);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeNow();
    });
    document.body.appendChild(overlay);
  }

  // done은 반드시 호출됩니다(팝업을 안 띄우는 경우 즉시, 띄운 경우 닫히거나
  // 버튼을 누른 뒤) — app.js가 이 콜백 다음에 천원의 아침밥 평가 팝업을
  // 띄웁니다(동시 노출 방지, js/site-popup.js와 같은 체인 방식).
  function maybeShow(done) {
    var finish = typeof done === "function" ? done : function () {};
    if (typeof HOMETOWN_POPUP === "undefined") { finish(); return; }
    // 커뮤니티 화면으로 바로 들어온 경우(딥링크)에는 홈 전용 팝업을
    // 띄우지 않습니다(기존 SitePopup/평가 팝업과 동일한 원칙 재사용).
    if (window.Community && typeof window.Community.isCommunityPath === "function" && window.Community.isCommunityPath(location.pathname)) { finish(); return; }
    if (isDismissedToday() || isDismissedThisSession()) { finish(); return; }
    renderPopup(finish);
  }

  return { maybeShow: maybeShow };
})();

/* ==========================================================================
   babsim.store 홈 이벤트 팝업 — 후루룩찹찹 주말(토·일) 점심영업 안내
   (js/hometown-popup.js)
   - 관리자 등록 팝업(js/site-popup.js)과 같은 방식(.modal-overlay/.modal,
     새 팝업 라이브러리 없음)을 재사용합니다. 포스터 이미지 자체에 모든
     안내 문구가 들어있어 별도 HTML 텍스트는 표시하지 않습니다(포스터+
     [메뉴 확인] 버튼만).
   - 일반 관리자 팝업(SitePopup) → 이 팝업 → 천원의 아침밥 평가 팝업 순서로
     app.js가 순차 호출해 동시에 겹치지 않습니다(app.js의 체인에서 호출되는
     한 단계만 이 파일이 담당).
   ========================================================================== */

var HometownPopup = (function () {
  "use strict";

  var IMAGE_SRC = "images/events/hometown-story.jpg";
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
      return (v && HOMETOWN_POPUP.title[v]) ? v : "ko";
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

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "modal-close";
    closeBtn.setAttribute("aria-label", t("closeAriaLabel") || "닫기");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", closeNow);
    modal.appendChild(closeBtn);

    // 안내 문구가 모두 포스터 안에 있으므로 별도 HTML 텍스트는 넣지
    // 않습니다. alt만 버튼 문구와 같은 값으로 채워 스크린리더 사용자도
    // 내용을 알 수 있게 합니다.
    function goAndClose() {
      markDismissedThisSession();
      overlay.remove();
      if (onClosed) onClosed();
      goToHururuk();
    }

    var img = document.createElement("img");
    img.className = "site-popup-image hometown-popup-image";
    img.src = IMAGE_SRC;
    img.alt = t("button");
    img.loading = "eager";
    img.style.cursor = "pointer";
    img.addEventListener("click", goAndClose);
    modal.appendChild(img);

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

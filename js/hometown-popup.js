/* ==========================================================================
   babsim.store 홈 이벤트 팝업 — 「나의 고향 이야기」 커뮤니티 참여 유도
   (js/hometown-popup.js)
   - 관리자 등록 팝업(js/site-popup.js)과 같은 방식(.modal-overlay/.modal,
     새 팝업 라이브러리 없음)을 재사용합니다. 이미지는 정적 파일이고,
     문구는 HOMETOWN_POPUP(js/translations.js) 번역 데이터를 그대로 읽어
     현재 선택된 언어(localStorage "foodhall_lang", js/app.js와 동일한 키)로
     보여줍니다.
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
  var WRITE_PATH = "/community/write?cat=hometown"; // 기존 "이 카테고리에 글쓰기" 딥링크와 동일한 방식

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

  // 기존 밥심커뮤니티 "이 카테고리에 글쓰기" 버튼과 같은 방식(navigate만
  // 호출) — 로그인이 필요하면 글쓰기 저장 시점에 커뮤니티 모듈이 이미
  // 처리하는 기존 로그인/익명참여 로직을 그대로 따릅니다.
  function goToWrite() {
    if (window.Community && typeof window.Community.navigate === "function") {
      window.Community.navigate(WRITE_PATH);
    } else {
      location.href = WRITE_PATH;
    }
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

    // 글자 없는 이미지(제공 이미지) — alt는 비워 두고 아래 HTML 문구가
    // 실제 내용을 전달합니다(스크린리더 중복 방지).
    var img = document.createElement("img");
    img.className = "site-popup-image hometown-popup-image";
    img.src = IMAGE_SRC;
    img.alt = "";
    img.loading = "eager";
    modal.appendChild(img);

    var title = document.createElement("p");
    title.className = "modal-desc hometown-popup-title";
    title.textContent = t("title");
    modal.appendChild(title);

    ["body1", "body2", "reward"].forEach(function (key) {
      var p = document.createElement("p");
      p.className = "modal-desc hometown-popup-line" + (key === "reward" ? " hometown-popup-reward" : "");
      p.textContent = t(key);
      modal.appendChild(p);
    });

    var ctaBtn = document.createElement("button");
    ctaBtn.type = "button";
    ctaBtn.className = "community-btn-primary hometown-popup-cta";
    ctaBtn.textContent = t("button");
    ctaBtn.addEventListener("click", function () {
      markDismissedThisSession();
      overlay.remove();
      if (onClosed) onClosed();
      goToWrite();
    });
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

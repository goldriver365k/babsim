/* ==========================================================================
   babsim.store 홈 이벤트 팝업 — 후루룩찹찹 "화산불백" 홍보 영상 +
   "점심 영업 안내"(기간 한정)
   (js/hometown-popup.js)
   - 관리자 등록 팝업(js/site-popup.js)과 같은 방식(.modal-overlay/.modal,
     새 팝업 라이브러리 없음)을 재사용합니다.
   - 2026-10-05 지시 — "10월 5일 2층 후루룩찹찹 영업" 기간 한정 공지는
     삭제하고, 그 자리에 사용자가 올려준 화산불백 홍보 영상을 넣습니다.
     이전 새우완탕쌀국수 신메뉴 안내(정적 사진)는 이 영상으로 교체됩니다.
     화산불백은 후루룩찹찹 매장의 메뉴라 CTA(goToHururuk)는 그대로
     재사용합니다. 홈 히어로 영역(HERO_MENU_PROMO)의 화산불백 고정
     노출은 이 팝업과 별개로 전혀 건드리지 않습니다.
   - 2026-10-06 지시 — 화산불백 영상 팝업은 POPUP_SUSPENDED로 자동
     노출을 중단한 상태입니다. 같은 자리에 "점심 영업 안내"(10/9·10/10,
     모인관 2층 후루룩찹찹) 팝업을 기간 한정(2026-10-11 00:00 KST까지)으로
     추가했습니다 — 같은 .modal-overlay/.modal 껍데기와 닫기/오늘 하루
     보지 않기 로직을 재사용하고, 밝은 배경(기존 다크 톤과 반대)만 이
     팝업 전용 클래스(.lunch-notice-modal)로 덮어씁니다.
   - 일반 관리자 팝업(SitePopup) → 이 팝업 → 천원의 아침밥 평가 팝업 순서로
     app.js가 순차 호출해 동시에 겹치지 않습니다(app.js의 체인에서 호출되는
     한 단계만 이 파일이 담당).
   ========================================================================== */

var HometownPopup = (function () {
  "use strict";

  var SESSION_DISMISS_KEY = "hometownPopupDismissedSession";
  var TODAY_DISMISS_KEY = "hometownPopupDismissedDate";
  var LANG_KEY = "foodhall_lang"; // js/app.js LANG_KEY와 동일한 값(공용 저장소 재사용)

  // 2026-10-06 지시 — 화산불백 영상 팝업 자동 노출 중단. 코드/영상 파일은
  // 그대로 두고 이 플래그만 꺼서, 나중에 다시 켤 때는 false로만 바꾸면
  // 됩니다(재구현 불필요).
  var POPUP_SUSPENDED = true;

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

    // 화산불백 홍보 영상(2026-10-05 지시) — ①영상 ②매장 배지 ③메뉴명
    // ④짧은 설명 순서. 영상 자체에 "화산불백"/"불백덮밥전문점" 문구가
    // 이미 들어있어 한국어 사용자는 그대로 보이고, 다른 언어 사용자를
    // 위해 매장 배지(영문 고정)와 짧은 설명만 번역해 아래에 덧붙입니다.
    // 메뉴명은 다른 브랜드/메뉴명과 같이 언어와 무관하게 원문(한국어)
    // 그대로 고정합니다.
    var poster = el("div", "hometown-popup-poster");

    var video = document.createElement("video");
    video.className = "hometown-popup-image";
    video.src = "images/hururuk/hwasan-bulbaek.mp4";
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", ""); // 구형 iOS 사파리 대응
    poster.appendChild(video);

    poster.appendChild(el("p", "hometown-popup-eyebrow", "HURURUK CHAPCHAP"));

    var titleBlock = el("div", "hometown-popup-title-block");
    titleBlock.appendChild(el("p", "hometown-popup-title-main", "화산불백"));
    poster.appendChild(titleBlock);

    poster.appendChild(el("p", "hometown-popup-tagline", t("hwasanTagline")));

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

  // 2026-10-06 지시 — "점심 영업 안내" 팝업. 한국시간 기준 2026-10-11
  // 00:00부터 자동으로 숨깁니다(종료일 이후에는 이 블록 전체가 비활성).
  var LUNCH_NOTICE_END_AT = "2026-10-11T00:00:00+09:00";
  function lunchNoticeActive() {
    return Date.now() < new Date(LUNCH_NOTICE_END_AT).getTime();
  }

  // 날짜/영업시간/위치와 5개 언어 문구는 모두 고정 문구(언어 전환 없이
  // 한 장에 동시 표시) — HOMETOWN_POPUP 번역 테이블을 쓰지 않습니다.
  function renderLunchNoticePopup(onClosed) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "hometownPopupOverlay";

    var modal = document.createElement("div");
    modal.className = "modal lunch-notice-modal";

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

    var poster = el("div", "lunch-notice-poster");
    poster.appendChild(el("p", "lunch-notice-dates", "10월 9일(금) · 10월 10일(토)"));
    poster.appendChild(el("p", "lunch-notice-hours", "AM 11:00 ~ PM 01:30"));
    poster.appendChild(el("p", "lunch-notice-location", "모인관 2층 후루룩찹찹"));

    var langList = el("div", "lunch-notice-lang-list");
    [
      "점심 영업합니다",
      "午餐营业",
      "Mở cửa phục vụ bữa trưa",
      "Open for lunch",
      "দুপুরের খাবারের জন্য খোলা থাকবে"
    ].forEach(function (line) {
      langList.appendChild(el("p", "lunch-notice-lang-line", line));
    });
    poster.appendChild(langList);

    modal.appendChild(poster);

    var ctaBtn = document.createElement("button");
    ctaBtn.type = "button";
    ctaBtn.className = "community-btn-primary lunch-notice-cta";
    ctaBtn.appendChild(el("span", "lunch-notice-cta-line", "메뉴 확인 · 查看菜单 · Xem thực đơn"));
    ctaBtn.appendChild(el("span", "lunch-notice-cta-line", "View menu · মেনু দেখুন"));
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
    // 커뮤니티 화면으로 바로 들어온 경우(딥링크)에는 홈 전용 팝업을
    // 띄우지 않습니다(기존 SitePopup/평가 팝업과 동일한 원칙 재사용).
    if (window.Community && typeof window.Community.isCommunityPath === "function" && window.Community.isCommunityPath(location.pathname)) { finish(); return; }
    // 점심 영업 안내(기간 한정)는 화산불백 영상 팝업 중단 여부와 무관하게
    // 종료일 전까지 우선 표시됩니다.
    if (lunchNoticeActive()) {
      if (isDismissedToday() || isDismissedThisSession()) { finish(); return; }
      renderLunchNoticePopup(finish);
      return;
    }
    if (POPUP_SUSPENDED) { finish(); return; }
    if (typeof HOMETOWN_POPUP === "undefined") { finish(); return; }
    if (isDismissedToday() || isDismissedThisSession()) { finish(); return; }
    renderPopup(finish);
  }

  return { maybeShow: maybeShow };
})();

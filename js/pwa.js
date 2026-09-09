/* ==========================================================================
   PWA 업데이트 알림 / 바탕화면(홈 화면) 추가 안내 (js/pwa.js)
   - 새 배포로 서비스 워커(service-worker.js) 내용이 바뀌면 화면 하단에
     "지금 업데이트" 배너를 띄우고, 누르면 새 버전을 즉시 적용합니다.
   - 처음 방문한 사용자(아직 설치 안 함, standalone 아님)에게만 "바탕화면에
     추가" 안내를 보여줍니다. 안드로이드는 실제 설치창을, 아이폰/아이패드는
     Safari 공유 메뉴 사용법을 안내합니다.
   - 업데이트 배너 > 업데이트 완료 > 바탕화면 추가 안내 순서로 한 번에
     하나만 표시합니다(js/app.js, 기존 화면 요소는 건드리지 않습니다).
   - 이 스크립트가 없거나 실행에 실패해도 기존 화면은 그대로 동작합니다
     (선택적 연동 — 다른 js/*.js 모듈과 동일한 패턴).
   ========================================================================== */

var PwaManager = (function () {
  "use strict";

  var INSTALLED_KEY = "moingwan_pwa_installed";
  var SNOOZE_KEY = "moingwan_install_snooze_until";
  var JUST_UPDATED_KEY = "moingwan_just_updated";
  var SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7일

  var els = {};
  var lang = "ko";
  var currentView = "hidden"; // "update" | "updateComplete" | "install" | "hidden"
  var waitingWorker = null;
  var deferredInstallEvent = null;
  var refreshing = false; // controllerchange 중복 발생 시 새로고침이 두 번 일어나지 않도록

  function qs(id) { return document.getElementById(id); }

  function text(dict, l) {
    return (dict && (dict[l] || dict.ko)) || "";
  }

  function isIos() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent || "") && !window.MSStream;
  }

  function isStandalone() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      window.navigator.standalone === true;
  }

  function isMarkedInstalled() {
    try { return localStorage.getItem(INSTALLED_KEY) === "1"; } catch (e) { return false; }
  }

  function markInstalled() {
    try { localStorage.setItem(INSTALLED_KEY, "1"); } catch (e) { /* 무시 */ }
  }

  function isSnoozed() {
    try {
      var until = parseInt(localStorage.getItem(SNOOZE_KEY) || "0", 10);
      return Date.now() < until;
    } catch (e) { return false; }
  }

  function snoozeInstall() {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch (e) { /* 무시 */ }
  }

  /* 배너 높이만큼 하단 여백을 만들어, 기존 "사장님께 말해요" 플로팅
     버튼이나 페이지 마지막 내용을 가리지 않게 합니다. */
  function syncBannerSpacing() {
    if (!els.banner) return;
    var h = els.banner.hidden ? 0 : els.banner.offsetHeight;
    document.documentElement.style.setProperty("--pwa-banner-height", h + "px");
  }

  function hideBanner() {
    if (!els.banner) return;
    els.banner.hidden = true;
    els.bannerBody.innerHTML = "";
    currentView = "hidden";
    syncBannerSpacing();
  }

  function renderUpdateView() {
    currentView = "update";
    els.bannerBody.innerHTML = "";
    var msg = document.createElement("p");
    msg.className = "pwa-banner-msg";
    msg.textContent = text(PWA_UPDATE_INFO.message, lang);
    els.bannerBody.appendChild(msg);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pwa-banner-btn-primary";
    btn.textContent = text(PWA_UPDATE_INFO.button, lang);
    btn.addEventListener("click", applyUpdate);
    els.bannerBody.appendChild(btn);

    els.banner.hidden = false;
    els.bannerClose.hidden = true; // 업데이트 배너는 닫기 버튼 없이 바로 적용을 유도
    syncBannerSpacing();
  }

  function renderUpdateCompleteView() {
    currentView = "updateComplete";
    els.bannerBody.innerHTML = "";
    var msg = document.createElement("p");
    msg.className = "pwa-banner-msg pwa-banner-msg-success";
    msg.textContent = text(PWA_UPDATE_INFO.done, lang);
    els.bannerBody.appendChild(msg);

    els.banner.hidden = false;
    els.bannerClose.hidden = false;
    syncBannerSpacing();

    setTimeout(function () {
      try { sessionStorage.removeItem(JUST_UPDATED_KEY); } catch (e) { /* 무시 */ }
      if (currentView === "updateComplete") {
        hideBanner();
        evaluateAndRender();
      }
    }, 3000);
  }

  function renderInstallView() {
    currentView = "install";
    els.bannerBody.innerHTML = "";

    var title = document.createElement("p");
    title.className = "pwa-banner-title";
    title.textContent = text(PWA_INSTALL_INFO.title, lang);
    els.bannerBody.appendChild(title);

    var desc = document.createElement("p");
    desc.className = "pwa-banner-msg";
    desc.textContent = text(PWA_INSTALL_INFO.desc, lang);
    els.bannerBody.appendChild(desc);

    var actions = document.createElement("div");
    actions.className = "pwa-banner-actions";

    var laterBtn = document.createElement("button");
    laterBtn.type = "button";
    laterBtn.className = "pwa-banner-btn-secondary";
    laterBtn.textContent = text(PWA_INSTALL_INFO.later, lang);
    laterBtn.addEventListener("click", function () { snoozeInstall(); hideBanner(); });
    actions.appendChild(laterBtn);

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "pwa-banner-btn-primary";
    addBtn.textContent = text(PWA_INSTALL_INFO.button, lang);
    addBtn.addEventListener("click", handleInstallClick);
    actions.appendChild(addBtn);

    els.bannerBody.appendChild(actions);

    els.banner.hidden = false;
    els.bannerClose.hidden = false;
    syncBannerSpacing();
  }

  /* 업데이트 배너 > 업데이트 완료 > 바탕화면 추가 안내 — 한 번에 하나만. */
  function evaluateAndRender() {
    if (waitingWorker) { renderUpdateView(); return; }

    var justUpdated = false;
    try { justUpdated = sessionStorage.getItem(JUST_UPDATED_KEY) === "1"; } catch (e) { /* 무시 */ }
    if (justUpdated && currentView !== "install") { renderUpdateCompleteView(); return; }

    if (canOfferInstall()) { renderInstallView(); return; }

    hideBanner();
  }

  function canOfferInstall() {
    if (isStandalone() || isMarkedInstalled()) return false;
    if (isSnoozed()) return false;
    // beforeinstallprompt가 뜬 안드로이드/데스크톱 크롬, 또는 아이폰/아이패드
    // (자체 안내 화면으로 대체) 중 하나라도 실제로 설치를 진행할 수 있을
    // 때만 보여줍니다 — 작동하지 않는 버튼을 보여주지 않기 위함입니다.
    return !!deferredInstallEvent || isIos();
  }

  /* ---------------- 서비스 워커 업데이트 ---------------- */

  function applyUpdate() {
    if (!waitingWorker) return;
    try { sessionStorage.setItem(JUST_UPDATED_KEY, "1"); } catch (e) { /* 무시 */ }
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    hideBanner(); // 곧 새로고침되므로 배너는 바로 치웁니다.
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/service-worker.js").then(function (reg) {
      if (!reg) return; // 등록이 막혀 있는 등 정상적인 registration 객체를 못 받은 경우

      // 이미 대기 중인 워커가 있는 상태로 페이지가 열린 경우
      if (reg.waiting && navigator.serviceWorker.controller) {
        waitingWorker = reg.waiting;
        evaluateAndRender();
      }

      reg.addEventListener("updatefound", function () {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", function () {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            // controller가 이미 있다는 건 "처음 설치"가 아니라 "진짜 업데이트"라는 뜻
            waitingWorker = reg.waiting || newWorker;
            evaluateAndRender();
          }
        });
      });
    }).catch(function (err) {
      console.error("서비스 워커 등록 오류:", err);
    });
  }

  /* ---------------- 바탕화면(홈 화면) 추가 ---------------- */

  function handleInstallClick() {
    if (isIos()) {
      showIosInstructions();
      return;
    }
    if (!deferredInstallEvent) return;
    var evt = deferredInstallEvent;
    deferredInstallEvent = null;
    evt.prompt();
    evt.userChoice.then(function (choice) {
      if (choice && choice.outcome === "accepted") {
        markInstalled();
        hideBanner();
      } else {
        // 거부해도 다시 물어보지 않고, "나중에"와 같은 기간만큼 조용히 둡니다.
        snoozeInstall();
        hideBanner();
      }
    }).catch(function () { /* 무시 */ });
  }

  function showIosInstructions() {
    if (!els.iosOverlay) return;
    els.iosSteps.innerHTML = "";
    var steps = PWA_INSTALL_INFO.iosSteps[lang] || PWA_INSTALL_INFO.iosSteps.ko || [];
    steps.forEach(function (step) {
      var li = document.createElement("li");
      li.textContent = step;
      els.iosSteps.appendChild(li);
    });
    els.iosOverlay.hidden = false;
  }

  function hideIosInstructions() {
    if (els.iosOverlay) els.iosOverlay.hidden = true;
  }

  /* ---------------- 초기화 ---------------- */

  function setLang(newLang) {
    lang = newLang || "ko";
    if (currentView !== "hidden") evaluateAndRender(); // 언어를 바꿔도 배너 문구가 즉시 갱신되도록
  }

  function init() {
    els.banner = qs("pwaBanner");
    els.bannerBody = qs("pwaBannerBody");
    els.bannerClose = qs("pwaBannerClose");
    els.iosOverlay = qs("iosInstallOverlay");
    els.iosSteps = qs("iosInstallSteps");
    els.iosClose = qs("iosInstallClose");
    if (!els.banner) return;

    els.bannerClose.addEventListener("click", function () {
      if (currentView === "install") snoozeInstall();
      hideBanner();
    });

    if (els.iosClose) els.iosClose.addEventListener("click", hideIosInstructions);
    if (els.iosOverlay) {
      els.iosOverlay.addEventListener("click", function (e) {
        if (e.target === els.iosOverlay) hideIosInstructions();
      });
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredInstallEvent = e;
      evaluateAndRender();
    });

    window.addEventListener("appinstalled", function () {
      markInstalled();
      deferredInstallEvent = null;
      hideBanner();
    });

    window.addEventListener("resize", function () { syncBannerSpacing(); });

    registerServiceWorker();
    evaluateAndRender(); // 최초 로드: 아이폰/아이패드는 여기서 바로 설치 안내 후보가 됨
  }

  return { init: init, setLang: setLang };
})();

document.addEventListener("DOMContentLoaded", PwaManager.init);

/* ==========================================================================
   babsim.store 새 버전 자동 업데이트 (js/site-update.js)
   - 정적 파일 version.json 하나만 확인합니다(새 DB/API/Firebase 없음,
     scripts/build-inline.py가 빌드할 때 자동 생성).
   - 5분마다, 그리고 화면이 다시 보일 때(Page Visibility API) 한 번만
     확인하고, 배포된 버전이 바뀌었으면 자동으로 새로고침합니다.
   - 커뮤니티 글쓰기/수정/댓글 작성 중에는 새로고침을 보류합니다(다음
     확인 때 다시 시도).
   ========================================================================== */

var SiteUpdate = (function () {
  "use strict";

  var VERSION_URL = "/version.json";
  var CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5분에 1회
  var MIN_RECHECK_GAP_MS = 60 * 1000; // 화면 복귀 등으로 너무 짧은 간격에 반복 확인하지 않도록
  var RELOAD_GUARD_KEY = "siteUpdateReloadedForVersion";

  var currentVersion = null; // 메모리에만 보관(별도 저장 없음)
  var lastCheckAt = 0;
  var checking = false;

  // 게시글 작성/수정/댓글 작성 중인지 — 새 상태를 추가하지 않고 기존
  // DOM 포커스와 커뮤니티 라우팅(주소)만으로 보수적으로 판단합니다.
  function isUserComposing() {
    var el = document.activeElement;
    if (el) {
      var tag = (el.tagName || "").toLowerCase();
      if (tag === "textarea") return true;
      if (tag === "input") {
        var type = (el.type || "text").toLowerCase();
        var textTypes = ["text", "search", "email", "password", "tel", "url"];
        if (textTypes.indexOf(type) !== -1 && el.value) return true;
      }
      if (el.isContentEditable) return true;
    }
    // 글쓰기/수정 화면은 카테고리 선택 등으로 포커스가 잠깐 벗어나도
    // 보수적으로 보류합니다(같은 주소를 수정 모드에도 그대로 씀).
    if (location.pathname.indexOf("/community/write") === 0) return true;
    return false;
  }

  function reloadForNewVersion(newVersion) {
    try {
      // 새로고침해도 같은 버전이 계속 감지되는 경우 반복 새로고침을 막습니다.
      if (sessionStorage.getItem(RELOAD_GUARD_KEY) === newVersion) return;
      sessionStorage.setItem(RELOAD_GUARD_KEY, newVersion);
    } catch (e) { /* sessionStorage 미지원 시에도 새로고침은 계속 진행 */ }
    location.reload();
  }

  function checkForUpdate() {
    if (checking) return;
    checking = true;
    fetch(VERSION_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        checking = false;
        if (!data || typeof data.version !== "string") return; // 조회 실패 시 조용히 기존 버전 유지
        if (currentVersion === null) { currentVersion = data.version; return; } // 최초 로드 시 현재 버전만 기억
        if (data.version === currentVersion) return; // 같은 버전 → 아무 동작 없음
        if (isUserComposing()) return; // 작성 중이면 이번 확인은 보류
        reloadForNewVersion(data.version);
      })
      .catch(function () { checking = false; /* 네트워크 오류는 조용히 무시, 다음 확인 때 재시도 */ });
  }

  function checkIfDue() {
    var now = Date.now();
    if (now - lastCheckAt < MIN_RECHECK_GAP_MS) return;
    lastCheckAt = now;
    checkForUpdate();
  }

  function init() {
    checkForUpdate(); // 최초 로드 시 현재 버전 기억
    lastCheckAt = Date.now();
    setInterval(checkIfDue, CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") checkIfDue();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return {};
})();

/* ==========================================================================
   한국어 학습 사이트(hellokorean.site) 연결 클릭 통계 (학생용)
   - 홈 화면 하단 카드를 클릭했을 때 Firestore에 클릭 이벤트를 기록합니다.
   - 이름·전화번호·이메일·IP 원문 등 개인정보는 전혀 수집하지 않습니다
     (날짜/시간/선택 언어/기기 종류/클릭 위치/대상 주소만 기록).
   - 같은 브라우저에서 30분 이내에 반복 클릭하면 통계에는 1회로만
     집계하지만, 링크 자체는 매번 정상적으로 새 창에서 열립니다
     (기록 여부와 무관하게 <a target="_blank">가 그대로 동작).
   - js/app.js의 renderHelloKorean()에서 카드 클릭 시 호출합니다.
     이 스크립트가 없어도 카드/링크는 그대로 동작합니다(선택적 연동).
   ========================================================================== */

var HelloKoreanStats = (function () {
  "use strict";

  var SEOUL_TZ = "Asia/Seoul";
  var LAST_LOGGED_KEY = "hellokorean_last_logged_at";
  var COOLDOWN_MS = 30 * 60 * 1000; // 30분

  function getSeoulDateKey() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SEOUL_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }

  function getSeoulTimeString() {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: SEOUL_TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(new Date());
  }

  function detectDevice() {
    var ua = (navigator && navigator.userAgent) || "";
    return /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" : "pc";
  }

  function withinCooldown() {
    try {
      var last = localStorage.getItem(LAST_LOGGED_KEY);
      if (!last) return false;
      return (Date.now() - parseInt(last, 10)) < COOLDOWN_MS;
    } catch (e) {
      return false; // localStorage 미지원 시에는 매번 기록(중복 방지보다 동작 우선)
    }
  }

  function markLogged() {
    try { localStorage.setItem(LAST_LOGGED_KEY, String(Date.now())); } catch (e) { /* 무시 */ }
  }

  /**
   * @param {string} lang 클릭 시점에 선택되어 있던 언어(ko/zh/vi/en/mn)
   * @returns {Promise} 통계 기록 결과(항상 resolve — 실패해도 화면 동작에 영향 없음)
   */
  function logClick(lang) {
    if (withinCooldown()) return Promise.resolve({ skipped: true });
    markLogged(); // 응답을 기다리지 않고 먼저 기록해, 짧은 시간 내 중복 호출을 막습니다.

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) return Promise.resolve({ local: true });

    var docData = {
      date: getSeoulDateKey(),
      time: getSeoulTimeString(),
      language: lang || "ko",
      device: detectDevice(),
      location: "home",
      target: "hellokorean.site",
      createdAt: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    };

    return db.collection("hellokoreanClicks").add(docData).catch(function (err) {
      console.error("한국어 학습 사이트 클릭 통계 저장 오류:", err);
    });
  }

  return { logClick: logClick };
})();

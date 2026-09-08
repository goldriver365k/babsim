/* ==========================================================================
   언어 선택 통계 (js/language-stats.js)
   - 새로운 언어 선택 UI를 만들지 않습니다. 기존 언어 버튼(app.js의
     setLang)에서 이 모듈의 record()만 호출해 기록합니다.
   - 문서 ID를 "날짜_기기ID"로 고정해서, 같은 기기가 하루에 여러 번
     새로고침하거나 언어를 여러 번 바꿔도 하루 1개 문서만 남습니다
     (매번 set()으로 덮어쓰므로 "그날의 최종 선택 언어"가 자동으로 남음).
   - 이 컬렉션은 "오늘 접속자" 수를 세는 데도 함께 쓰입니다(기기 단위
     고유 방문 근사치 — 서버 로그 기반의 정확한 트래픽 집계는 아닙니다).
   ========================================================================== */

var LanguageStats = (function () {
  "use strict";

  var DEVICE_ID_KEY = "foodhall_device_id";
  var SEOUL_TZ = "Asia/Seoul";

  function getSeoulDateKey() {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SEOUL_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date());
  }

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

  var lastRecordedLang = null;

  /**
   * 오늘 날짜 + 이 기기의 언어 선택 기록을 남깁니다(덮어쓰기).
   * 같은 언어를 연속으로 다시 기록하려는 호출은(예: 화면 재방문) 생략해
   * 불필요한 쓰기를 줄이되, 페이지 로드 시 최초 1회는 방문 집계를 위해
   * 항상 기록합니다.
   * @param {string} lang 현재 선택된 언어 코드
   * @param {boolean} [force] true면 같은 언어라도 다시 기록(변경 이력 확장용)
   */
  function record(lang, force) {
    if (!lang) return;
    if (!force && lastRecordedLang === lang) return;

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      lastRecordedLang = lang; // Firebase 미설정 시에도 중복 시도만 방지
      return;
    }

    var dateKey = getSeoulDateKey();
    var deviceId = getDeviceId();
    var docId = dateKey + "_" + deviceId;

    db.collection("languageStats").doc(docId).set({
      date: dateKey,
      language: lang,
      deviceId: deviceId,
      updatedAt: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString(),
      changeCount: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.increment(1)
        : 1
    }, { merge: true }).then(function () {
      lastRecordedLang = lang;
    }).catch(function (err) {
      console.error("언어 통계 저장 오류:", err);
    });
  }

  return { record: record };
})();

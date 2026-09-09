/* ==========================================================================
   주간메뉴 Firestore 동기화 (js/weekly-menu-sync.js)
   - 관리자 페이지("주간메뉴 관리")에서 "확인 후 게시"한 데이터를 읽어와
     data/breakfast-weekly-menu.js의 정적 BREAKFAST_WEEKLY_MENU 객체에
     덮어씁니다. Firestore에 해당 날짜의 게시된(published) 데이터가 없으면
     정적 파일의 내용이 그대로 유지됩니다(기존 방식과 100% 호환).
   - "임시저장"(status: draft)은 관리자 화면에서만 보이고, 학생 화면에는
     반영되지 않습니다.
   - 오늘·내일 메뉴 칸에는 이미지를 넣지 않고 글자만 표시합니다
     (js/app.js의 renderMealList가 담당). 주간메뉴 원본 이미지 보기
     기능은 학생 화면에서 제거되었습니다.

   화면은 렌더링이 끝난 뒤 비동기로 동기화하고, 데이터가 갱신되면
   콜백으로 다시 그리게 합니다(초기 표시가 늦어지지 않도록).
   ========================================================================== */

var WeeklyMenuSync = (function () {
  "use strict";

  var SEOUL_TZ = "Asia/Seoul";

  function getSeoulDateKey(offsetDays) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SEOUL_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(new Date(Date.now() + (offsetDays || 0) * 24 * 60 * 60 * 1000));
  }

  function applyDayDoc(dateKey, data) {
    if (!data) return;
    if (data.status !== "published") return; // 임시저장(draft)은 학생 화면에 반영하지 않음
    if (typeof BREAKFAST_WEEKLY_MENU === "undefined") return;

    var hasRegular = data.regular && data.regular.length;
    var hasSimple = data.simple && data.simple.length;
    var hasItems = data.items && data.items.length; // 예전 저장 방식(단일 목록) 하위 호환
    var isOpen = data.isOpen !== false;

    if (!BREAKFAST_WEEKLY_MENU.days) BREAKFAST_WEEKLY_MENU.days = {};
    BREAKFAST_WEEKLY_MENU.days[dateKey] = {
      isOpen: isOpen,
      regular: hasRegular ? data.regular : (hasItems ? data.items : []),
      simple: hasSimple ? data.simple : []
    };
  }

  function sync(onReady) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db || typeof BREAKFAST_WEEKLY_MENU === "undefined") {
      if (onReady) onReady();
      return;
    }

    var todayKey = getSeoulDateKey(0);
    var tomorrowKey = getSeoulDateKey(1);

    Promise.all([
      db.collection("weeklyMenus").doc(todayKey).get().catch(function () { return null; }),
      db.collection("weeklyMenus").doc(tomorrowKey).get().catch(function () { return null; })
    ]).then(function (results) {
      var todaySnap = results[0];
      var tomorrowSnap = results[1];

      if (todaySnap && todaySnap.exists) applyDayDoc(todayKey, todaySnap.data());
      if (tomorrowSnap && tomorrowSnap.exists) applyDayDoc(tomorrowKey, tomorrowSnap.data());

      if (onReady) onReady();
    }).catch(function (err) {
      console.error("주간메뉴 동기화 오류:", err);
      if (onReady) onReady();
    });
  }

  return { sync: sync };
})();

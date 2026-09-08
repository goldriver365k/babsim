/* ==========================================================================
   주간메뉴 Firestore 동기화 (js/weekly-menu-sync.js)
   - 관리자 페이지("주간메뉴 관리")에서 등록한 데이터를 읽어와
     data/breakfast-weekly-menu.js의 정적 BREAKFAST_WEEKLY_MENU 객체에
     덮어씁니다. Firestore에 해당 날짜 데이터가 없으면 정적 파일의
     내용이 그대로 유지됩니다(기존 방식과 100% 호환되는 안전한 대체 동작).

   우선순위 (관리자 페이지 안내와 동일):
     1) weeklyMenus에 그 날짜의 직접 입력 데이터가 있으면 그것을 사용
     2) 없고 그 주의 weeklyMenuImages 이미지가 있으면 이미지를 사용
        (기존 "주간 메뉴 원본 보기" 팝업을 그대로 재사용 —
        BREAKFAST_WEEKLY_MENU.sourceImage 값만 바꿔주면 됩니다)
     3) 둘 다 없으면 정적 파일 내용(대개 비어있음 → "운영하지 않습니다")

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

  function addDaysToKey(dateKey, days) {
    var parts = dateKey.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function mondayKeyOf(dateKey) {
    var parts = dateKey.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    var weekday = (d.getUTCDay() + 6) % 7; // 0=월 ... 6=일
    return addDaysToKey(dateKey, -weekday);
  }

  function applyDayDoc(dateKey, data) {
    if (!data) return;
    var hasRegular = data.regular && data.regular.length;
    var hasSimple = data.simple && data.simple.length;
    var hasItems = data.items && data.items.length; // 예전 저장 방식(단일 목록) 하위 호환
    if (!hasRegular && !hasSimple && !hasItems) return;
    if (typeof BREAKFAST_WEEKLY_MENU === "undefined") return;
    if (!BREAKFAST_WEEKLY_MENU.days) BREAKFAST_WEEKLY_MENU.days = {};
    BREAKFAST_WEEKLY_MENU.days[dateKey] = {
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
    var weekKey = mondayKeyOf(todayKey);

    Promise.all([
      db.collection("weeklyMenus").doc(todayKey).get().catch(function () { return null; }),
      db.collection("weeklyMenus").doc(tomorrowKey).get().catch(function () { return null; }),
      db.collection("weeklyMenuImages").doc(weekKey).get().catch(function () { return null; })
    ]).then(function (results) {
      var todaySnap = results[0];
      var tomorrowSnap = results[1];
      var imageSnap = results[2];

      if (todaySnap && todaySnap.exists) applyDayDoc(todayKey, todaySnap.data());
      if (tomorrowSnap && tomorrowSnap.exists) applyDayDoc(tomorrowKey, tomorrowSnap.data());

      // 직접 입력 데이터가 없는 날에 한해서만 이미지로 보완
      function hasDirectInput(dateKey) {
        var d = BREAKFAST_WEEKLY_MENU.days[dateKey];
        return !!(d && ((d.regular && d.regular.length) || (d.simple && d.simple.length)));
      }
      var todayHasItems = hasDirectInput(todayKey);
      var tomorrowHasItems = hasDirectInput(tomorrowKey);
      if (imageSnap && imageSnap.exists && (!todayHasItems || !tomorrowHasItems)) {
        var imgData = imageSnap.data();
        if (imgData && imgData.imageUrl) {
          BREAKFAST_WEEKLY_MENU.sourceImage = imgData.imageUrl;
        }
      }

      if (onReady) onReady();
    }).catch(function (err) {
      console.error("주간메뉴 동기화 오류:", err);
      if (onReady) onReady();
    });
  }

  return { sync: sync };
})();

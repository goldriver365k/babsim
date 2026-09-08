/* ==========================================================================
   관리자 페이지 (js/admin.js)
   4개 탭: 대시보드 / 메뉴 평가 / 언어 통계 / 주간메뉴 관리
   - Firestore(breakfastRatings, languageStats, weeklyMenus, weeklyMenuImages)
     에서 데이터를 읽어와 집계합니다. 화면 문구는 한국어로 고정입니다.
   - 무거운 차트 라이브러리를 쓰지 않고 순수 SVG/CSS로 그래프를 그립니다.
   - 통계 열람은 기존 암호 게이트(ADMIN_PASSPHRASE)를 그대로 사용하고,
     주간메뉴 "쓰기"(등록·수정·삭제, 이미지 업로드)는 별도로
     Firebase Authentication 로그인을 요구합니다.
   ========================================================================== */

(function () {
  "use strict";

  /* 관리자 페이지 접근용 임시 암호(강한 보안 아님, 단순 접근 제한용).
     실제 운영 시 반드시 이 값을 바꾸세요. Firestore 규칙이 진짜 보안 경계입니다. */
  var ADMIN_PASSPHRASE = "foodhall2026";
  var SESSION_KEY = "foodhall_admin_authed";

  var SEOUL_TZ = "Asia/Seoul";
  var SCORES = [5, 4, 3, 2, 1];
  var SCORE_LABEL_KO = { 5: "아주 좋아요", 4: "좋아요", 3: "보통이에요", 2: "아쉬워요", 1: "별로예요" };

  /* 지원 언어 — 사이트에서 실제 지원 중인 언어(js/app.js의 SUPPORTED_LANGS)와 동일하게 유지 */
  var LANGS = ["ko", "zh", "vi", "en", "mn"];
  var LANG_LABEL_KO = { ko: "한국어", zh: "중국어", vi: "베트남어", en: "영어", mn: "몽골어" };

  var DAY_DEFS = [
    { code: "mon", label: "월요일", offset: 0 },
    { code: "tue", label: "화요일", offset: 1 },
    { code: "wed", label: "수요일", offset: 2 },
    { code: "thu", label: "목요일", offset: 3 },
    { code: "fri", label: "금요일", offset: 4 }
  ];

  var els = {};

  function qs(id) { return document.getElementById(id); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* 사용자에게는 원인을 짐작할 수 있는 한국어 문구만 보여주고,
     실제 Firebase 오류 내용은 콘솔에만 남깁니다. */
  function friendlyError(context, err) {
    console.error(context, err);
    return context + " 잠시 후 다시 시도해주세요.";
  }

  /* ---------------- 날짜 유틸 (Asia/Seoul 기준, app.js와 동일한 방식) ---------------- */

  function seoulInstant(offsetDays) {
    return new Date(Date.now() + (offsetDays || 0) * 24 * 60 * 60 * 1000);
  }

  function getSeoulDateKey(offsetDays) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SEOUL_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(seoulInstant(offsetDays));
  }

  function addDaysToKey(dateKey, days) {
    var parts = dateKey.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function monthStartKey(dateKey) {
    return dateKey.slice(0, 7) + "-01";
  }

  function formatMonthDay(dateKey) {
    var parts = dateKey.split("-");
    return parts[1] + "/" + parts[2];
  }

  function mondayKeyOf(dateKey) {
    var parts = dateKey.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    var weekday = (d.getUTCDay() + 6) % 7; // 0=월 ... 6=일
    return addDaysToKey(dateKey, -weekday);
  }

  /* ---------------- 로그인 게이트 (통계 열람용) ---------------- */

  function isAuthed() {
    try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return false; }
  }

  function setAuthed() {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) { /* 무시 */ }
  }

  function initGate() {
    els.gate = qs("adminGate");
    els.gateForm = qs("adminGateForm");
    els.gateInput = qs("adminGateInput");
    els.gateError = qs("adminGateError");
    els.app = qs("adminApp");

    if (isAuthed()) {
      showApp();
      return;
    }

    els.gateForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (els.gateInput.value === ADMIN_PASSPHRASE) {
        setAuthed();
        showApp();
      } else {
        els.gateError.textContent = "암호가 올바르지 않습니다.";
      }
    });
  }

  function showApp() {
    els.gate.hidden = true;
    els.app.hidden = false;
    initApp();
  }

  /* ---------------- Firestore 조회 (공통) ---------------- */

  function fetchCollectionRange(collectionName, startKey, endKey) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) return Promise.resolve([]);
    return db.collection(collectionName)
      .where("date", ">=", startKey)
      .where("date", "<=", endKey)
      .get()
      .then(function (snap) {
        var out = [];
        snap.forEach(function (doc) { out.push(doc.data()); });
        return out;
      });
  }

  function fetchRatingsRange(startKey, endKey) { return fetchCollectionRange("breakfastRatings", startKey, endKey); }
  function fetchLanguageRange(startKey, endKey) { return fetchCollectionRange("languageStats", startKey, endKey); }

  /* ---------------- 공용 집계/차트 ---------------- */

  function emptyCounts(keys) {
    var o = {};
    keys.forEach(function (k) { o[k] = 0; });
    return o;
  }

  function statsFromRatingDocs(docs) {
    var counts = emptyCounts(SCORES);
    var sum = 0, count = 0;
    var menuVotes = {};
    docs.forEach(function (d) {
      var r = d.rating;
      if (typeof r !== "number" || r < 1 || r > 5) return;
      r = Math.round(r);
      counts[r] = (counts[r] || 0) + 1;
      sum += r;
      count += 1;
      if (d.mainMenu) menuVotes[d.mainMenu] = (menuVotes[d.mainMenu] || 0) + 1;
    });
    var avg = count > 0 ? sum / count : 0;
    var positive = count > 0 ? ((counts[5] + counts[4]) / count) * 100 : 0;
    var negative = count > 0 ? ((counts[2] + counts[1]) / count) * 100 : 0;
    var topMenu = "", topMenuVotes = 0;
    Object.keys(menuVotes).forEach(function (m) {
      if (menuVotes[m] > topMenuVotes) { topMenu = m; topMenuVotes = menuVotes[m]; }
    });
    return { count: count, sum: sum, avg: avg, positive: positive, negative: negative, counts: counts, menuText: topMenu };
  }

  /* 하루 1기기당 1문서(languageStats 문서 ID = 날짜_기기ID)이므로
     문서 수를 그대로 "그날의 고유 방문/언어선택 수"로 취급합니다. */
  function statsFromLanguageDocs(docs) {
    var counts = emptyCounts(LANGS);
    var count = 0;
    docs.forEach(function (d) {
      if (!d.language) return;
      if (!(d.language in counts)) counts[d.language] = 0; // 지원 언어 목록 밖 값도 누락 없이 집계
      counts[d.language] += 1;
      count += 1;
    });
    var topLang = "", topCount = 0;
    Object.keys(counts).forEach(function (l) {
      if (counts[l] > topCount) { topLang = l; topCount = counts[l]; }
    });
    return { count: count, counts: counts, topLang: topLang, topCount: topCount };
  }

  function groupByDate(docs) {
    var byDate = {};
    docs.forEach(function (d) {
      if (!d.date) return;
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });
    return byDate;
  }

  /**
   * items: [{label, value, displayText}]
   */
  function renderBarList(container, items) {
    container.innerHTML = "";
    var max = Math.max(1, Math.max.apply(null, items.map(function (i) { return i.value; })));
    items.forEach(function (item) {
      var row = document.createElement("div");
      row.className = "dist-row";

      var label = document.createElement("span");
      label.className = "dist-label";
      label.textContent = item.label;
      row.appendChild(label);

      var track = document.createElement("span");
      track.className = "dist-bar-track";
      var fill = document.createElement("span");
      fill.className = "dist-bar-fill";
      fill.style.width = ((item.value / max) * 100) + "%";
      track.appendChild(fill);
      row.appendChild(track);

      var countEl = document.createElement("span");
      countEl.className = "dist-count";
      countEl.textContent = item.displayText;
      row.appendChild(countEl);

      container.appendChild(row);
    });
  }

  function renderRatingDistList(container, counts) {
    renderBarList(container, SCORES.map(function (s) {
      return { label: SCORE_LABEL_KO[s], value: counts[s] || 0, displayText: (counts[s] || 0) + "명" };
    }));
  }

  function renderLanguageDistList(container, counts, total) {
    renderBarList(container, LANGS.map(function (l) {
      var v = counts[l] || 0;
      var pct = total > 0 ? Math.round((v / total) * 100) : 0;
      return { label: LANG_LABEL_KO[l], value: v, displayText: v + "명 " + pct + "%" };
    }));
  }

  /**
   * 선(라인) 차트를 그립니다. valueByDate 없는 날짜는 점을 찍지 않고
   * 이어지는 선만 건너뜁니다.
   * @param {SVGElement} svg
   * @param {string[]} days 날짜 키 배열(과거→오늘 순)
   * @param {Object} valueByDate {dateKey: number}
   * @param {Object} opts {maxY?: number, auto?: boolean}
   */
  function drawLineChart(svg, days, valueByDate, opts) {
    opts = opts || {};
    var w = 320, h = 140, padL = 24, padR = 10, padT = 14, padB = 22;
    var innerW = w - padL - padR, innerH = h - padT - padB;

    var maxY = opts.maxY;
    if (!maxY) {
      var maxVal = 0;
      days.forEach(function (d) { if (valueByDate[d] != null) maxVal = Math.max(maxVal, valueByDate[d]); });
      maxY = Math.max(1, maxVal);
    }

    var points = days.map(function (dateKey, i) {
      var v = valueByDate[dateKey];
      var x = padL + (innerW * (days.length > 1 ? i / (days.length - 1) : 0));
      var y = padT + innerH - (v != null ? (v / maxY) * innerH : 0);
      return { x: x, y: y, v: v, dateKey: dateKey };
    });

    var parts = [];
    parts.push('<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">');

    var gridLines = 5;
    for (var g = 0; g <= gridLines; g++) {
      var gy = padT + innerH - (g / gridLines) * innerH;
      parts.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="#e5e8ee" stroke-width="1"/>');
    }

    var withData = points.filter(function (p) { return p.v != null; });
    if (withData.length > 1) {
      var lineD = withData.map(function (p, i) { return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
      parts.push('<path d="' + lineD + '" fill="none" stroke="#1957d6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
    }

    points.forEach(function (p) {
      if (p.v == null) return;
      parts.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3" fill="#1957d6"/>');
    });

    var labelEvery = days.length > 15 ? Math.ceil(days.length / 10) : 1;
    points.forEach(function (p, i) {
      if (i % labelEvery !== 0 && i !== points.length - 1) return;
      parts.push('<text x="' + p.x.toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="#4b5563" text-anchor="middle">' + formatMonthDay(p.dateKey) + '</text>');
    });

    parts.push('</svg>');
    svg.innerHTML = parts.join("");
  }

  /* ================================================================
     탭 내비게이션
     ================================================================ */

  var PAGE_EL_ID = { dashboard: "pageDashboard", ratings: "pageRatings", language: "pageLanguage", weeklymenu: "pageWeeklyMenu" };
  var pageLoaded = {};

  function showPage(page) {
    Object.keys(PAGE_EL_ID).forEach(function (p) {
      qs(PAGE_EL_ID[p]).hidden = p !== page;
    });
    Array.prototype.forEach.call(els.navBtns, function (btn) {
      btn.classList.toggle("active", btn.dataset.page === page);
    });
    if (!pageLoaded[page]) {
      pageLoaded[page] = true;
      loadPage(page);
    }
  }

  function loadPage(page) {
    if (page === "dashboard") loadDashboard();
    else if (page === "ratings") initRatingsPage();
    else if (page === "language") initLanguagePage();
    else if (page === "weeklymenu") initWeeklyMenuPage();
  }

  /* ================================================================
     대시보드
     ================================================================ */

  function loadDashboard() {
    var todayKey = getSeoulDateKey(0);

    fetchRatingsRange(todayKey, todayKey).then(function (docs) {
      var s = statsFromRatingDocs(docs);
      qs("dashRatingParticipants").textContent = s.count.toLocaleString("ko-KR") + "명";
      qs("dashAvgRating").textContent = s.count > 0 ? (s.avg.toFixed(1) + " / 5") : "-";
      renderRatingDistList(qs("dashRatingDistList"), s.counts);
    }).catch(function (err) {
      qs("dashRatingParticipants").textContent = "-";
      console.error(friendlyError("오늘 평가 데이터를 불러오지 못했습니다.", err));
    });

    fetchLanguageRange(todayKey, todayKey).then(function (docs) {
      var s = statsFromLanguageDocs(docs);
      qs("dashVisitors").textContent = s.count.toLocaleString("ko-KR") + "명";
      if (s.topLang) {
        var pct = s.count > 0 ? Math.round((s.topCount / s.count) * 100) : 0;
        qs("dashTopLang").textContent = LANG_LABEL_KO[s.topLang] + " " + pct + "%";
      } else {
        qs("dashTopLang").textContent = "-";
      }
      renderLanguageDistList(qs("dashLangDistList"), s.counts, s.count);
    }).catch(function (err) {
      qs("dashVisitors").textContent = "-";
      qs("dashTopLang").textContent = "-";
      console.error(friendlyError("오늘 언어 통계를 불러오지 못했습니다.", err));
    });

    var startKey = getSeoulDateKey(-6);
    fetchLanguageRange(startKey, todayKey).then(function (docs) {
      var byDate = groupByDate(docs);
      var days = [];
      var valueByDate = {};
      for (var i = -6; i <= 0; i++) {
        var k = getSeoulDateKey(i);
        days.push(k);
        valueByDate[k] = byDate[k] ? byDate[k].length : 0;
      }
      drawLineChart(qs("dashVisitorTrend"), days, valueByDate, {});
    }).catch(function (err) {
      console.error(friendlyError("최근 7일 접속자 추이를 불러오지 못했습니다.", err));
    });
  }

  /* ================================================================
     메뉴 평가 탭 (기존 기능 그대로 유지 + 부정평가·최근 30일 추가)
     ================================================================ */

  var ratingsState = {
    filter: "today",
    customStart: null,
    customEnd: null,
    selectedDate: null
  };

  function renderTodayRatingSection() {
    var todayKey = getSeoulDateKey(0);
    fetchRatingsRange(todayKey, todayKey).then(function (docs) {
      var s = statsFromRatingDocs(docs);
      qs("todayParticipants").textContent = s.count.toLocaleString("ko-KR") + "명";
      qs("todayAvg").textContent = s.count > 0 ? (s.avg.toFixed(1) + " / 5") : "-";
      qs("todayPositive").textContent = s.count > 0 ? (Math.round(s.positive) + "%") : "-";
      qs("todayNegative").textContent = s.count > 0 ? (Math.round(s.negative) + "%") : "-";
      renderRatingDistList(qs("todayDistList"), s.counts);
    }).catch(function (err) {
      qs("tableEmpty").hidden = false;
      qs("tableEmpty").textContent = friendlyError("오늘 평가 데이터를 불러오지 못했습니다.", err);
    });
  }

  function renderRatingTrend(days, svgId, maxY) {
    var startKey = getSeoulDateKey(-(days - 1));
    var todayKey = getSeoulDateKey(0);
    fetchRatingsRange(startKey, todayKey).then(function (docs) {
      var byDate = {};
      groupByDateInto(docs, byDate);
      var dateKeys = [];
      var valueByDate = {};
      for (var i = -(days - 1); i <= 0; i++) {
        var k = getSeoulDateKey(i);
        dateKeys.push(k);
        if (byDate[k] && byDate[k].length) {
          var s = statsFromRatingDocs(byDate[k]);
          valueByDate[k] = s.avg;
        }
      }
      drawLineChart(qs(svgId), dateKeys, valueByDate, { maxY: maxY });
    }).catch(function (err) {
      console.error(friendlyError("평점 추이를 불러오지 못했습니다.", err));
    });
  }

  function groupByDateInto(docs, target) {
    docs.forEach(function (d) {
      if (!d.date) return;
      if (!target[d.date]) target[d.date] = [];
      target[d.date].push(d);
    });
  }

  function ratingsCurrentRangeKeys() {
    var todayKey = getSeoulDateKey(0);
    if (ratingsState.filter === "today") return [todayKey, todayKey];
    if (ratingsState.filter === "7d") return [getSeoulDateKey(-6), todayKey];
    if (ratingsState.filter === "month") return [monthStartKey(todayKey), todayKey];
    if (ratingsState.filter === "custom" && ratingsState.customStart && ratingsState.customEnd) {
      return [ratingsState.customStart, ratingsState.customEnd];
    }
    return [todayKey, todayKey];
  }

  function reloadRatingsRange() {
    var range = ratingsCurrentRangeKeys();
    var tableBody = qs("resultsTableBody");
    var tableEmpty = qs("tableEmpty");
    var tableLoading = qs("tableLoading");
    tableBody.innerHTML = "";
    tableEmpty.hidden = true;
    tableLoading.hidden = false;

    fetchRatingsRange(range[0], range[1]).then(function (docs) {
      tableLoading.hidden = true;
      var byDate = {};
      groupByDateInto(docs, byDate);
      var statsByDate = {};
      Object.keys(byDate).forEach(function (k) { statsByDate[k] = statsFromRatingDocs(byDate[k]); });
      var dateKeys = Object.keys(statsByDate).sort().reverse();

      if (dateKeys.length === 0) {
        tableEmpty.hidden = false;
        tableEmpty.textContent = "선택한 기간에 평가 데이터가 없습니다.";
        clearSelectedRatingDistribution();
        return;
      }

      renderRatingsTable(dateKeys, statsByDate);
      var selected = dateKeys.indexOf(ratingsState.selectedDate) !== -1 ? ratingsState.selectedDate : dateKeys[0];
      selectRatingDate(selected, statsByDate[selected], statsByDate);
    }).catch(function (err) {
      tableLoading.hidden = true;
      tableEmpty.hidden = false;
      tableEmpty.textContent = friendlyError("날짜별 평가 데이터를 불러오지 못했습니다.", err);
    });
  }

  function renderRatingsTable(dateKeys, statsByDate) {
    var tableBody = qs("resultsTableBody");
    tableBody.innerHTML = "";
    dateKeys.forEach(function (dateKey) {
      var s = statsByDate[dateKey];
      var tr = document.createElement("tr");
      tr.dataset.date = dateKey;
      tr.innerHTML =
        '<td>' + dateKey + '</td>' +
        '<td class="menu-cell">' + (s.menuText ? escapeHtml(s.menuText) + " 외" : "-") + '</td>' +
        '<td>' + s.count + '명</td>' +
        '<td>' + (s.count > 0 ? s.avg.toFixed(1) : "-") + '</td>' +
        '<td>' + s.counts[5] + '</td>' +
        '<td>' + s.counts[4] + '</td>' +
        '<td>' + s.counts[3] + '</td>' +
        '<td>' + s.counts[2] + '</td>' +
        '<td>' + s.counts[1] + '</td>';
      tr.addEventListener("click", function () { selectRatingDate(dateKey, s, statsByDate); });
      tableBody.appendChild(tr);
    });
  }

  function selectRatingDate(dateKey, stats) {
    ratingsState.selectedDate = dateKey;
    Array.prototype.forEach.call(qs("resultsTableBody").querySelectorAll("tr"), function (tr) {
      tr.classList.toggle("selected", tr.dataset.date === dateKey);
    });
    qs("selectedDateLabel").textContent = dateKey;
    renderRatingDistList(qs("selectedDistList"), stats.counts);
  }

  function clearSelectedRatingDistribution() {
    ratingsState.selectedDate = null;
    qs("selectedDateLabel").textContent = "-";
    renderRatingDistList(qs("selectedDistList"), emptyCounts(SCORES));
  }

  function setRatingsFilter(filter) {
    ratingsState.filter = filter;
    Array.prototype.forEach.call(document.querySelectorAll("#pageRatings .filter-btn[data-filter]"), function (btn) {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    qs("customRange").hidden = filter !== "custom";
    if (filter !== "custom") reloadRatingsRange();
  }

  function initRatingsPage() {
    Array.prototype.forEach.call(document.querySelectorAll("#pageRatings .filter-btn[data-filter]"), function (btn) {
      btn.addEventListener("click", function () { setRatingsFilter(btn.dataset.filter); });
    });
    var todayKey = getSeoulDateKey(0);
    qs("customStartInput").value = todayKey;
    qs("customEndInput").value = todayKey;
    qs("customRangeApply").addEventListener("click", function () {
      ratingsState.customStart = qs("customStartInput").value || todayKey;
      ratingsState.customEnd = qs("customEndInput").value || todayKey;
      reloadRatingsRange();
    });

    renderTodayRatingSection();
    renderRatingTrend(7, "trendChart", 5);
    renderRatingTrend(30, "trendChart30", 5);
    reloadRatingsRange();
  }

  /* ================================================================
     언어 통계 탭
     ================================================================ */

  var languageState = { filter: "today", customStart: null, customEnd: null };

  function languageCurrentRangeKeys() {
    var todayKey = getSeoulDateKey(0);
    if (languageState.filter === "today") return [todayKey, todayKey];
    if (languageState.filter === "7d") return [getSeoulDateKey(-6), todayKey];
    if (languageState.filter === "month") return [monthStartKey(todayKey), todayKey];
    if (languageState.filter === "custom" && languageState.customStart && languageState.customEnd) {
      return [languageState.customStart, languageState.customEnd];
    }
    return [todayKey, todayKey];
  }

  function reloadLanguagePage() {
    var range = languageCurrentRangeKeys();
    var loading = qs("langLoading");
    var empty = qs("langEmpty");
    loading.hidden = false;
    empty.hidden = true;
    qs("langDistList").innerHTML = "";

    fetchLanguageRange(range[0], range[1]).then(function (docs) {
      loading.hidden = true;
      var s = statsFromLanguageDocs(docs);
      if (s.count === 0) {
        empty.hidden = false;
        empty.textContent = "선택한 기간에 언어 통계 데이터가 없습니다.";
        return;
      }
      renderLanguageDistList(qs("langDistList"), s.counts, s.count);
    }).catch(function (err) {
      loading.hidden = true;
      empty.hidden = false;
      empty.textContent = friendlyError("언어 통계를 불러오지 못했습니다.", err);
    });
  }

  function setLanguageFilter(filter) {
    languageState.filter = filter;
    Array.prototype.forEach.call(document.querySelectorAll("#pageLanguage .filter-btn[data-filter]"), function (btn) {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    qs("langCustomRange").hidden = filter !== "custom";
    if (filter !== "custom") reloadLanguagePage();
  }

  function initLanguagePage() {
    Array.prototype.forEach.call(document.querySelectorAll("#pageLanguage .filter-btn[data-filter]"), function (btn) {
      btn.addEventListener("click", function () { setLanguageFilter(btn.dataset.filter); });
    });
    var todayKey = getSeoulDateKey(0);
    qs("langCustomStartInput").value = todayKey;
    qs("langCustomEndInput").value = todayKey;
    qs("langCustomRangeApply").addEventListener("click", function () {
      languageState.customStart = qs("langCustomStartInput").value || todayKey;
      languageState.customEnd = qs("langCustomEndInput").value || todayKey;
      reloadLanguagePage();
    });
    reloadLanguagePage();
  }

  /* ================================================================
     주간메뉴 관리 탭
     ================================================================ */

  var weeklyMenuState = {
    weekStart: null,
    dayDocs: {},     // dateKey -> { items, updatedAt } | null
    imageDoc: null    // { imageUrl, ... } | null
  };

  function initWeeklyMenuAuth() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;

    els.weeklyAuthSignedOut = qs("weeklyAuthSignedOut");
    els.weeklyAuthSignedIn = qs("weeklyAuthSignedIn");
    els.weeklyAuthForm = qs("weeklyAuthForm");
    els.weeklyAuthEmail = qs("weeklyAuthEmail");
    els.weeklyAuthPassword = qs("weeklyAuthPassword");
    els.weeklyAuthError = qs("weeklyAuthError");
    els.weeklyAuthEmailLabel = qs("weeklyAuthEmailLabel");
    els.weeklyAuthSignOutBtn = qs("weeklyAuthSignOutBtn");
    els.weeklyMenuLockedNote = qs("weeklyMenuLockedNote");
    els.weeklyMenuEditorArea = qs("weeklyMenuEditorArea");

    if (!auth) {
      els.weeklyAuthError.textContent = "Firebase Authentication이 아직 설정되지 않았습니다. 관리자에게 문의하세요.";
      els.weeklyMenuLockedNote.hidden = false;
      return;
    }

    els.weeklyAuthForm.addEventListener("submit", function (e) {
      e.preventDefault();
      els.weeklyAuthError.textContent = "";
      var email = els.weeklyAuthEmail.value.trim();
      var pw = els.weeklyAuthPassword.value;
      if (!email || !pw) {
        els.weeklyAuthError.textContent = "이메일과 비밀번호를 입력해주세요.";
        return;
      }
      auth.signInWithEmailAndPassword(email, pw).catch(function (err) {
        console.error("관리자 로그인 오류:", err);
        els.weeklyAuthError.textContent = "로그인에 실패했습니다. 이메일/비밀번호를 확인해주세요.";
      });
    });

    els.weeklyAuthSignOutBtn.addEventListener("click", function () {
      auth.signOut();
    });

    auth.onAuthStateChanged(function (user) {
      var signedIn = !!user;
      els.weeklyAuthSignedOut.hidden = signedIn;
      els.weeklyAuthSignedIn.hidden = !signedIn;
      els.weeklyMenuLockedNote.hidden = signedIn;
      els.weeklyMenuEditorArea.hidden = !signedIn;
      if (signedIn) {
        els.weeklyAuthEmailLabel.textContent = user.email || "관리자";
        if (!weeklyMenuState.weekStart) loadWeeklyMenuWeek(mondayKeyOf(getSeoulDateKey(0)));
      }
    });
  }

  function requireAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function loadWeeklyMenuWeek(weekStartKey) {
    weeklyMenuState.weekStart = weekStartKey;
    qs("weekStartInput").value = weekStartKey;

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      renderWeekDayGrid();
      renderWeekImage();
      return;
    }

    var dateKeys = DAY_DEFS.map(function (d) { return addDaysToKey(weekStartKey, d.offset); });
    Promise.all(dateKeys.map(function (dk) {
      return db.collection("weeklyMenus").doc(dk).get().catch(function () { return null; });
    })).then(function (snaps) {
      weeklyMenuState.dayDocs = {};
      snaps.forEach(function (snap, i) {
        weeklyMenuState.dayDocs[dateKeys[i]] = (snap && snap.exists) ? snap.data() : null;
      });
      renderWeekDayGrid();
    }).catch(function (err) {
      console.error(friendlyError("주간메뉴 데이터를 불러오지 못했습니다.", err));
      renderWeekDayGrid();
    });

    db.collection("weeklyMenuImages").doc(weekStartKey).get().then(function (snap) {
      weeklyMenuState.imageDoc = (snap && snap.exists) ? snap.data() : null;
      renderWeekImage();
    }).catch(function (err) {
      console.error(friendlyError("주간메뉴 이미지를 불러오지 못했습니다.", err));
      weeklyMenuState.imageDoc = null;
      renderWeekImage();
    });
  }

  var MEAL_TYPES = [
    { key: "regular", label: "일반식" },
    { key: "simple", label: "간편식" }
  ];

  /* 기존 데이터 호환: 예전 저장 방식은 day.items(단일 목록)만 있었습니다.
     그 경우 "일반식" 목록으로 그대로 옮겨서 보여줍니다. */
  function existingListFor(existing, typeKey) {
    if (!existing) return null;
    if (existing[typeKey] && existing[typeKey].length) return existing[typeKey].slice();
    if (typeKey === "regular" && existing.items && existing.items.length) return existing.items.slice();
    return null;
  }

  function renderWeekDayGrid() {
    var grid = qs("weekDayGrid");
    grid.innerHTML = "";
    var weekStartKey = weeklyMenuState.weekStart;

    DAY_DEFS.forEach(function (def) {
      var dateKey = addDaysToKey(weekStartKey, def.offset);
      var existing = weeklyMenuState.dayDocs ? weeklyMenuState.dayDocs[dateKey] : null;

      var card = document.createElement("div");
      card.className = "week-day-card";
      card.dataset.date = dateKey;
      card.dataset.dayCode = def.code;

      var h3 = document.createElement("h3");
      h3.textContent = def.label;
      card.appendChild(h3);

      var dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.className = "week-day-date-input";
      dateInput.value = dateKey;
      card.appendChild(dateInput);

      var pasteBox = document.createElement("textarea");
      pasteBox.className = "week-paste-box";
      pasteBox.rows = 2;
      pasteBox.placeholder = "엑셀에서 이 요일의 일반식·간편식 두 칸(6줄)을 복사해서 여기에 붙여넣으세요";
      card.appendChild(pasteBox);

      var pasteBtn = document.createElement("button");
      pasteBtn.type = "button";
      pasteBtn.className = "week-paste-apply-btn";
      pasteBtn.textContent = "붙여넣기 적용";
      card.appendChild(pasteBtn);

      var lists = {}; // typeKey -> itemsList 엘리먼트

      MEAL_TYPES.forEach(function (type) {
        var section = document.createElement("div");
        section.className = "week-meal-section";

        var label = document.createElement("p");
        label.className = "week-meal-label";
        label.textContent = type.label;
        section.appendChild(label);

        var itemsList = document.createElement("div");
        itemsList.className = "week-items-list";
        var savedItems = existingListFor(existing, type.key) || (type.key === "regular" ? ["", "", "", ""] : [""]);
        savedItems.forEach(function (text) { itemsList.appendChild(buildItemRow(text)); });
        section.appendChild(itemsList);
        lists[type.key] = itemsList;

        var addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "week-add-item-btn";
        addBtn.textContent = "+ 메뉴 추가";
        addBtn.addEventListener("click", function () { itemsList.appendChild(buildItemRow("")); });
        section.appendChild(addBtn);

        card.appendChild(section);
      });

      pasteBtn.addEventListener("click", function () {
        applyPasteToLists(pasteBox.value, lists.regular, lists.simple);
        pasteBox.value = "";
      });

      var actions = document.createElement("div");
      actions.className = "week-day-actions";

      var saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "week-save-btn";
      saveBtn.textContent = existing ? "수정 저장" : "저장";
      actions.appendChild(saveBtn);

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "week-delete-btn";
      deleteBtn.textContent = "삭제";
      deleteBtn.hidden = !existing;
      actions.appendChild(deleteBtn);

      card.appendChild(actions);

      var msg = document.createElement("p");
      msg.className = "week-day-msg";
      card.appendChild(msg);

      saveBtn.addEventListener("click", function () {
        saveWeekDay(card, dateInput, lists, msg, saveBtn, deleteBtn);
      });
      deleteBtn.addEventListener("click", function () {
        deleteWeekDay(card.dataset.date, msg, saveBtn, deleteBtn);
      });

      grid.appendChild(card);
    });
  }

  function buildItemRow(text) {
    var row = document.createElement("div");
    row.className = "week-item-row";

    var input = document.createElement("input");
    input.type = "text";
    input.value = text || "";
    input.placeholder = "메뉴명";
    row.appendChild(input);

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "week-item-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.setAttribute("aria-label", "메뉴 삭제");
    removeBtn.addEventListener("click", function () { row.remove(); });
    row.appendChild(removeBtn);

    return row;
  }

  function setItemsList(listEl, items) {
    listEl.innerHTML = "";
    items.forEach(function (text) { listEl.appendChild(buildItemRow(text)); });
  }

  /**
   * 엑셀에서 복사한 내용을 붙여넣기 적용합니다.
   * 한 줄 = 메뉴 한 줄. 탭으로 구분된 1번째 칸은 일반식, 2번째 칸은 간편식으로 채웁니다.
   * (탭 없이 한 줄씩만 붙여넣으면 전부 일반식 목록으로 채워집니다.)
   * 값이 없는 쪽은 기존 입력 내용을 그대로 둡니다.
   */
  function applyPasteToLists(pasted, regularList, simpleList) {
    if (!pasted || !pasted.trim()) return;
    var lines = pasted.split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    var regularItems = [];
    var simpleItems = [];
    lines.forEach(function (line) {
      var cells = line.split("\t");
      var a = (cells[0] || "").trim();
      var b = (cells[1] || "").trim();
      if (a) regularItems.push(a);
      if (b) simpleItems.push(b);
    });
    if (regularItems.length) setItemsList(regularList, regularItems);
    if (simpleItems.length) setItemsList(simpleList, simpleItems);
  }

  function saveWeekDay(card, dateInput, lists, msg, saveBtn, deleteBtn) {
    var user = requireAdminUser();
    if (!user) {
      msg.className = "week-day-msg error";
      msg.textContent = "로그인이 만료되었습니다. 다시 로그인해주세요.";
      return;
    }

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      msg.className = "week-day-msg error";
      msg.textContent = "저장 기능을 사용할 수 없습니다.";
      return;
    }

    var dateKey = dateInput.value;
    if (!dateKey) {
      msg.className = "week-day-msg error";
      msg.textContent = "날짜를 입력해주세요.";
      return;
    }

    function collect(listEl) {
      return Array.prototype.map.call(listEl.querySelectorAll("input[type=text]"), function (i) { return i.value.trim(); })
        .filter(function (t) { return t.length > 0; });
    }

    var regular = collect(lists.regular);
    var simple = collect(lists.simple);

    if (regular.length === 0 && simple.length === 0) {
      msg.className = "week-day-msg error";
      msg.textContent = "일반식 또는 간편식 메뉴를 1개 이상 입력해주세요.";
      return;
    }

    saveBtn.disabled = true;
    msg.className = "week-day-msg";
    msg.textContent = "저장 중...";

    db.collection("weeklyMenus").doc(dateKey).set({
      weekStart: weeklyMenuState.weekStart,
      date: dateKey,
      day: card.dataset.dayCode,
      regular: regular,
      simple: simple,
      updatedAt: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date().toISOString()
    }).then(function () {
      saveBtn.disabled = false;
      msg.className = "week-day-msg success";
      msg.textContent = "저장되었습니다.";
      saveBtn.textContent = "수정 저장";
      deleteBtn.hidden = false;
      weeklyMenuState.dayDocs[dateKey] = { regular: regular, simple: simple };
      card.dataset.date = dateKey;
    }).catch(function (err) {
      saveBtn.disabled = false;
      msg.className = "week-day-msg error";
      msg.textContent = friendlyError("저장에 실패했습니다.", err);
    });
  }

  function deleteWeekDay(dateKey, msg, saveBtn, deleteBtn) {
    var user = requireAdminUser();
    if (!user) {
      msg.className = "week-day-msg error";
      msg.textContent = "로그인이 만료되었습니다. 다시 로그인해주세요.";
      return;
    }
    if (!window.confirm(dateKey + " 메뉴를 삭제할까요?")) return;

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) return;

    deleteBtn.disabled = true;
    db.collection("weeklyMenus").doc(dateKey).delete().then(function () {
      deleteBtn.disabled = false;
      deleteBtn.hidden = true;
      saveBtn.textContent = "저장";
      msg.className = "week-day-msg success";
      msg.textContent = "삭제되었습니다.";
      weeklyMenuState.dayDocs[dateKey] = null;
    }).catch(function (err) {
      deleteBtn.disabled = false;
      msg.className = "week-day-msg error";
      msg.textContent = friendlyError("삭제에 실패했습니다.", err);
    });
  }

  /* ---- 이미지 업로드 ---- */

  var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  var MAX_IMAGE_BYTES = 10 * 1024 * 1024;

  function renderWeekImage() {
    var wrap = qs("weekImagePreviewWrap");
    var img = qs("weekImagePreviewImg");
    var deleteBtn = qs("weekImageDeleteBtn");
    if (weeklyMenuState.imageDoc && weeklyMenuState.imageDoc.imageUrl) {
      img.src = weeklyMenuState.imageDoc.imageUrl;
      wrap.hidden = false;
      deleteBtn.hidden = false;
    } else {
      wrap.hidden = true;
      img.removeAttribute("src");
      deleteBtn.hidden = true;
    }
    qs("weekImageError").textContent = "";
    qs("weekImageSuccess").textContent = "";
  }

  function initWeeklyImageUpload() {
    var fileInput = qs("weekImageInput");
    var saveBtn = qs("weekImageSaveBtn");
    var deleteBtn = qs("weekImageDeleteBtn");
    var errorEl = qs("weekImageError");
    var successEl = qs("weekImageSuccess");
    var wrap = qs("weekImagePreviewWrap");
    var previewImg = qs("weekImagePreviewImg");

    fileInput.addEventListener("change", function () {
      errorEl.textContent = "";
      successEl.textContent = "";
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (ALLOWED_IMAGE_TYPES.indexOf(file.type) === -1) {
        errorEl.textContent = "jpg, jpeg, png, webp 파일만 업로드할 수 있습니다.";
        fileInput.value = "";
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        errorEl.textContent = "파일 크기는 10MB 이하만 가능합니다.";
        fileInput.value = "";
        return;
      }
      previewImg.src = URL.createObjectURL(file);
      wrap.hidden = false;
    });

    saveBtn.addEventListener("click", function () {
      var user = requireAdminUser();
      if (!user) {
        errorEl.textContent = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        return;
      }
      var file = fileInput.files && fileInput.files[0];
      if (!file) {
        errorEl.textContent = "업로드할 이미지를 먼저 선택해주세요.";
        return;
      }
      var storage = (typeof getFirebaseStorage === "function") ? getFirebaseStorage() : null;
      var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
      if (!storage || !db) {
        errorEl.textContent = "이미지 업로드 기능을 사용할 수 없습니다.";
        return;
      }

      errorEl.textContent = "";
      successEl.textContent = "업로드 중...";
      saveBtn.disabled = true;

      var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      var weekStartKey = weeklyMenuState.weekStart;
      var path = "weeklyMenuImages/" + weekStartKey + "." + ext;
      var ref = storage.ref().child(path);

      ref.put(file).then(function () {
        return ref.getDownloadURL();
      }).then(function (url) {
        return db.collection("weeklyMenuImages").doc(weekStartKey).set({
          weekStart: weekStartKey,
          imageUrl: url,
          uploadedAt: (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date().toISOString()
        });
      }).then(function () {
        saveBtn.disabled = false;
        successEl.textContent = "이미지가 저장되었습니다.";
        weeklyMenuState.imageDoc = { imageUrl: previewImg.src };
        deleteBtn.hidden = false;
      }).catch(function (err) {
        saveBtn.disabled = false;
        errorEl.textContent = friendlyError("이미지 업로드에 실패했습니다.", err);
      });
    });

    deleteBtn.addEventListener("click", function () {
      var user = requireAdminUser();
      if (!user) {
        errorEl.textContent = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        return;
      }
      if (!window.confirm("등록된 주간메뉴 이미지를 삭제할까요?")) return;

      var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
      if (!db) return;

      deleteBtn.disabled = true;
      db.collection("weeklyMenuImages").doc(weeklyMenuState.weekStart).delete().then(function () {
        deleteBtn.disabled = false;
        weeklyMenuState.imageDoc = null;
        fileInput.value = "";
        renderWeekImage();
        successEl.textContent = "이미지가 삭제되었습니다.";
      }).catch(function (err) {
        deleteBtn.disabled = false;
        errorEl.textContent = friendlyError("이미지 삭제에 실패했습니다.", err);
      });
    });
  }

  function initWeeklyMenuPage() {
    var configured = (typeof isFirebaseConfigured === "function") && isFirebaseConfigured();
    if (!configured) {
      qs("weeklyMenuLockedNote").hidden = false;
      qs("weeklyMenuLockedNote").querySelector("p").textContent = "Firebase가 연결되지 않아 주간메뉴 관리 기능을 사용할 수 없습니다.";
      return;
    }

    initWeeklyMenuAuth();
    initWeeklyImageUpload();

    qs("weekLoadBtn").addEventListener("click", function () {
      var val = qs("weekStartInput").value;
      if (!val) return;
      loadWeeklyMenuWeek(mondayKeyOf(val));
    });

    qs("weekStartInput").value = mondayKeyOf(getSeoulDateKey(0));
  }

  /* ================================================================
     초기화
     ================================================================ */

  function initApp() {
    els.warnBanner = qs("adminFirebaseWarning");
    els.navBtns = document.querySelectorAll(".admin-nav-btn");

    var configured = (typeof isFirebaseConfigured === "function") && isFirebaseConfigured();
    els.warnBanner.hidden = configured;

    Array.prototype.forEach.call(els.navBtns, function (btn) {
      btn.addEventListener("click", function () { showPage(btn.dataset.page); });
    });

    showPage("dashboard");
  }

  document.addEventListener("DOMContentLoaded", initGate);
})();

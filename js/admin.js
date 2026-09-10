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
  var ADMIN_PASSPHRASE = "8838";
  var SESSION_KEY = "foodhall_admin_authed";

  var SEOUL_TZ = "Asia/Seoul";
  var SCORES = [5, 4, 3, 2, 1];
  var SCORE_LABEL_KO = { 5: "아주 좋아요", 4: "좋아요", 3: "보통이에요", 2: "아쉬워요", 1: "별로예요" };

  /* 지원 언어 — 사이트에서 실제 지원 중인 언어(js/app.js의 SUPPORTED_LANGS)와 동일하게 유지 */
  var LANGS = ["ko", "zh", "vi", "en", "mn", "bn", "my"];
  var LANG_LABEL_KO = { ko: "한국어", zh: "중국어", vi: "베트남어", en: "영어", mn: "몽골어", bn: "벵골어", my: "미얀마어" };

  var DAY_DEFS = [
    { code: "mon", label: "월요일", offset: 0 },
    { code: "tue", label: "화요일", offset: 1 },
    { code: "wed", label: "수요일", offset: 2 },
    { code: "thu", label: "목요일", offset: 3 },
    { code: "fri", label: "금요일", offset: 4 }
  ];

  var els = {};

  /* 예상치 못한 오류로 관리자 페이지가 흰 화면이 되는 것을 막는 안전망
     (Gemini 장애 대비 작업지시서 3번). 어떤 스크립트 오류든 여기서
     받아 화면 위에 작은 배너로 보여주기만 하고, 이미 그려진 화면은
     그대로 둡니다. */
  function showGlobalErrorBanner(message) {
    var banner = document.getElementById("adminGlobalErrorBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "adminGlobalErrorBanner";
      banner.className = "admin-global-error-banner";
      document.body.insertBefore(banner, document.body.firstChild);
    }
    banner.textContent = message;
    banner.hidden = false;
  }

  window.addEventListener("error", function (e) {
    console.error("전역 오류:", e.error || e.message);
    showGlobalErrorBanner("일시적인 오류가 발생했습니다. 화면이 이상하면 새로고침해 주세요.");
  });
  window.addEventListener("unhandledrejection", function (e) {
    console.error("처리되지 않은 오류:", e.reason);
    showGlobalErrorBanner("일시적인 오류가 발생했습니다. 화면이 이상하면 새로고침해 주세요.");
  });

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

  function fetchCollectionAll(collectionName) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) return Promise.resolve([]);
    return db.collection(collectionName).get().then(function (snap) {
      var out = [];
      snap.forEach(function (doc) { out.push(doc.data()); });
      return out;
    });
  }

  function fetchHelloKoreanRange(startKey, endKey) { return fetchCollectionRange("hellokoreanClicks", startKey, endKey); }
  function fetchHelloKoreanAll() { return fetchCollectionAll("hellokoreanClicks"); }

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

  /**
   * 막대(바) 차트를 그립니다. "날짜별 클릭 수"처럼 요일마다 값이 항상
   * 존재하는(0 포함) 데이터에 적합합니다.
   * @param {SVGElement} svg
   * @param {string[]} days 날짜 키 배열(과거→오늘 순)
   * @param {Object} valueByDate {dateKey: number}
   */
  function drawBarChart(svg, days, valueByDate) {
    var w = 320, h = 140, padL = 24, padR = 10, padT = 14, padB = 22;
    var innerW = w - padL - padR, innerH = h - padT - padB;

    var maxVal = 0;
    days.forEach(function (d) { maxVal = Math.max(maxVal, valueByDate[d] || 0); });
    var maxY = Math.max(1, maxVal);

    var slot = innerW / days.length;
    var barWidth = Math.max(2, slot * 0.6);

    var parts = [];
    parts.push('<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">');

    var gridLines = 5;
    for (var g = 0; g <= gridLines; g++) {
      var gy = padT + innerH - (g / gridLines) * innerH;
      parts.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (w - padR) + '" y2="' + gy + '" stroke="#e5e8ee" stroke-width="1"/>');
    }

    var labelEvery = days.length > 15 ? Math.ceil(days.length / 10) : 1;
    days.forEach(function (dateKey, i) {
      var v = valueByDate[dateKey] || 0;
      var barH = (v / maxY) * innerH;
      var x = padL + slot * i + (slot - barWidth) / 2;
      var y = padT + innerH - barH;
      parts.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + barWidth.toFixed(1) + '" height="' + barH.toFixed(1) + '" rx="2" fill="#1957d6"/>');
      if (i % labelEvery === 0 || i === days.length - 1) {
        var lx = padL + slot * i + slot / 2;
        parts.push('<text x="' + lx.toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="#4b5563" text-anchor="middle">' + formatMonthDay(dateKey) + '</text>');
      }
    });

    parts.push('</svg>');
    svg.innerHTML = parts.join("");
  }

  /* 하루 1클릭당 1문서(hellokoreanClicks)이므로 문서 수를 그대로
     클릭 수로 취급합니다. */
  function statsFromHelloKoreanDocs(docs) {
    var counts = emptyCounts(LANGS);
    var byDevice = { mobile: 0, pc: 0 };
    var count = 0;
    docs.forEach(function (d) {
      count += 1;
      if (d.language) {
        if (!(d.language in counts)) counts[d.language] = 0;
        counts[d.language] += 1;
      }
      if (d.device === "mobile" || d.device === "pc") byDevice[d.device] += 1;
    });
    return { count: count, counts: counts, byDevice: byDevice };
  }

  /* ================================================================
     탭 내비게이션
     ================================================================ */

  var PAGE_EL_ID = { dashboard: "pageDashboard", ratings: "pageRatings", language: "pageLanguage", hellokorean: "pageHelloKorean", weeklymenu: "pageWeeklyMenu", community: "pageCommunity" };
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
    else if (page === "hellokorean") initHelloKoreanPage();
    else if (page === "weeklymenu") initWeeklyMenuPage();
    else if (page === "community") { if (window.AdminCommunity) AdminCommunity.init(); }
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
     한국어 학습 사이트(hellokorean.site) 연결 통계 탭
     ================================================================ */

  var helloKoreanState = { filter: "today" };

  /* 오늘/어제/이번 주/이번 달/전체/모바일/PC — 항상 동시에 보이는
     고정 요약 지표입니다(기간 선택 필터와는 별개). 문서 수가 아직
     크지 않은 신규 기능이라 전체를 한 번에 불러와 클라이언트에서
     계산합니다(범위별로 5번 따로 조회하는 대신 1번만 조회). */
  function loadHelloKoreanSummary() {
    var loading = qs("hkSummaryLoading");
    loading.hidden = false;

    fetchHelloKoreanAll().then(function (docs) {
      loading.hidden = true;
      var todayKey = getSeoulDateKey(0);
      var yesterdayKey = getSeoulDateKey(-1);
      var weekStartKey = mondayKeyOf(todayKey);
      var monthKey = monthStartKey(todayKey);

      var todayCount = 0, yesterdayCount = 0, weekCount = 0, monthCount = 0;
      var mobileCount = 0, pcCount = 0;
      docs.forEach(function (d) {
        if (!d.date) return;
        if (d.date === todayKey) todayCount++;
        if (d.date === yesterdayKey) yesterdayCount++;
        if (d.date >= weekStartKey && d.date <= todayKey) weekCount++;
        if (d.date >= monthKey && d.date <= todayKey) monthCount++;
        if (d.device === "mobile") mobileCount++;
        else if (d.device === "pc") pcCount++;
      });

      qs("hkTodayClicks").textContent = todayCount.toLocaleString("ko-KR") + "회";
      qs("hkYesterdayClicks").textContent = yesterdayCount.toLocaleString("ko-KR") + "회";
      qs("hkWeekClicks").textContent = weekCount.toLocaleString("ko-KR") + "회";
      qs("hkMonthClicks").textContent = monthCount.toLocaleString("ko-KR") + "회";
      qs("hkTotalClicks").textContent = docs.length.toLocaleString("ko-KR") + "회";
      qs("hkMobileClicks").textContent = mobileCount.toLocaleString("ko-KR") + "회";
      qs("hkPcClicks").textContent = pcCount.toLocaleString("ko-KR") + "회";
    }).catch(function (err) {
      loading.hidden = true;
      console.error(friendlyError("한국어 학습 사이트 통계를 불러오지 못했습니다.", err));
    });
  }

  function helloKoreanCurrentRangeKeys() {
    var todayKey = getSeoulDateKey(0);
    if (helloKoreanState.filter === "today") return [todayKey, todayKey];
    if (helloKoreanState.filter === "7d") return [getSeoulDateKey(-6), todayKey];
    if (helloKoreanState.filter === "30d") return [getSeoulDateKey(-29), todayKey];
    return null; // "all" — 날짜 범위 없이 전체 조회
  }

  /* 기간 선택(오늘/최근 7일/최근 30일/전체)에 따라 언어별 통계와
     날짜별 막대그래프를 갱신합니다. */
  function reloadHelloKoreanPeriod() {
    var range = helloKoreanCurrentRangeKeys();
    var langLoading = qs("hkLangLoading");
    var langEmpty = qs("hkLangEmpty");
    var trendEmpty = qs("hkTrendEmpty");
    langLoading.hidden = false;
    langEmpty.hidden = true;
    trendEmpty.hidden = true;
    qs("hkLangDistList").innerHTML = "";
    qs("hkTrendChart").innerHTML = "";

    var fetchPromise = range ? fetchHelloKoreanRange(range[0], range[1]) : fetchHelloKoreanAll();

    fetchPromise.then(function (docs) {
      langLoading.hidden = true;
      var s = statsFromHelloKoreanDocs(docs);
      if (s.count === 0) {
        langEmpty.hidden = false;
        langEmpty.textContent = "선택한 기간에 클릭 데이터가 없습니다.";
      } else {
        renderLanguageDistList(qs("hkLangDistList"), s.counts, s.count);
      }

      var byDate = groupByDate(docs);
      var days = [];
      var valueByDate = {};
      var captionText;

      if (helloKoreanState.filter === "all") {
        // 전체 기간은 실제 데이터가 있는 날짜만 오래된 순으로 나열합니다.
        days = Object.keys(byDate).sort();
        if (days.length === 0) days = [getSeoulDateKey(0)];
        days.forEach(function (k) { valueByDate[k] = byDate[k].length; });
        captionText = "가로축: 클릭이 있었던 날짜(전체 기간)";
      } else {
        var offsetStart = helloKoreanState.filter === "7d" ? -6 : (helloKoreanState.filter === "30d" ? -29 : 0);
        for (var i = offsetStart; i <= 0; i++) {
          var k2 = getSeoulDateKey(i);
          days.push(k2);
          valueByDate[k2] = byDate[k2] ? byDate[k2].length : 0;
        }
        captionText = helloKoreanState.filter === "today" ? "가로축: 오늘" : "가로축: " + (-offsetStart + 1) + "일간(MM/DD)";
      }

      if (days.length <= 1 && helloKoreanState.filter !== "all") {
        trendEmpty.hidden = false;
        trendEmpty.textContent = "";
      }
      drawBarChart(qs("hkTrendChart"), days, valueByDate);
      qs("hkTrendCaption").textContent = captionText;
    }).catch(function (err) {
      langLoading.hidden = true;
      langEmpty.hidden = false;
      langEmpty.textContent = friendlyError("한국어 학습 사이트 통계를 불러오지 못했습니다.", err);
    });
  }

  function setHelloKoreanFilter(filter) {
    helloKoreanState.filter = filter;
    Array.prototype.forEach.call(document.querySelectorAll("#pageHelloKorean .filter-btn[data-hk-filter]"), function (btn) {
      btn.classList.toggle("active", btn.dataset.hkFilter === filter);
    });
    reloadHelloKoreanPeriod();
  }

  function initHelloKoreanPage() {
    Array.prototype.forEach.call(document.querySelectorAll("#pageHelloKorean .filter-btn[data-hk-filter]"), function (btn) {
      btn.addEventListener("click", function () { setHelloKoreanFilter(btn.dataset.hkFilter); });
    });
    loadHelloKoreanSummary();
    reloadHelloKoreanPeriod();
  }

  /* ================================================================
     주간메뉴 관리 탭
     ================================================================ */

  var weeklyMenuState = {
    weekStart: null,
    dayDocs: {},           // dateKey -> Firestore weeklyMenus 문서 | null
    imageDoc: null,         // { imageUrl, ... } | null (Firestore weeklyMenuImages 문서)
    pendingImageFile: null, // 이번 세션에 새로 고른, 아직 게시 전인 이미지 파일(원본 업로드용)
    pendingImageBase64: null, // 분석/임시저장 복원용으로 유지하는 축소 이미지(base64)
    pendingImageMimeType: null,
    lastTranslations: null, // "번역 확인" 결과({}면 전부 미번역=한글만) — null이면 아직 실행 안 함
    lastFailedTerms: [],    // 마지막 번역 확인에서 번역하지 못한 항목
    publishInFlight: false, // 중복 게시(연타) 방지
    analyzeInFlight: false
  };

  function serverTimestampOrNow() {
    return (window.firebase && firebase.firestore && firebase.firestore.FieldValue)
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date().toISOString();
  }

  /* ================================================================
     임시저장(자동 저장, localStorage) — Gemini 장애 대비 작업지시서 4번
     이미지 분석을 시작하기 전에 "주 시작일/종료일, 업로드한 이미지,
     입력 내용, 분석 진행 상태"를 브라우저에 자동 저장해 두어, 새로고침
     해도 작성 중이던 내용이 사라지지 않게 합니다. Firestore의 "임시저장
     (draft)"과는 별개로, 아직 저장 버튼을 누르기 전 단계를 보호합니다.
     ================================================================ */

  var AUTOSAVE_KEY = "babsim_admin_weekly_autosave_v1";
  var AUTOSAVE_MAX_IMAGE_CHARS = 3 * 1024 * 1024; // base64 약 3MB까지만 저장(localStorage 용량 보호)
  var autosaveTimer = null;

  function getAutosave() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearAutosave() {
    try { localStorage.removeItem(AUTOSAVE_KEY); } catch (e) { /* 무시 */ }
    var notice = qs("weekAutosaveNotice");
    if (notice) notice.hidden = true;
  }

  function writeAutosaveNow() {
    var grid = qs("weekDayGrid");
    if (!grid || !grid.children.length || !weeklyMenuState.weekStart) return;
    var snapshot = {
      weekStart: weeklyMenuState.weekStart,
      weekEnd: addDaysToKey(weeklyMenuState.weekStart, 4),
      savedAt: new Date().toISOString(),
      days: collectAllCards(),
      imageBase64: (weeklyMenuState.pendingImageBase64 && weeklyMenuState.pendingImageBase64.length <= AUTOSAVE_MAX_IMAGE_CHARS)
        ? weeklyMenuState.pendingImageBase64
        : null,
      imageMimeType: weeklyMenuState.pendingImageMimeType || null,
      analyzeStatus: weeklyMenuState.analyzeInFlight ? "analyzing" : "idle"
    };
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
    } catch (e) {
      // 용량 초과 등으로 실패하면 이미지 없이 텍스트만이라도 저장 시도
      try {
        snapshot.imageBase64 = null;
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot));
      } catch (e2) { /* 그래도 실패하면 자동저장은 포기(화면 동작에는 영향 없음) */ }
    }
  }

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(writeAutosaveNow, 500);
  }

  /* 자동저장된 내용이 있고 지금 불러온 주와 같으면 화면에 되돌려 놓습니다. */
  function restoreAutosaveIfMatching(weekStartKey) {
    var saved = getAutosave();
    var notice = qs("weekAutosaveNotice");
    if (!saved || saved.weekStart !== weekStartKey) {
      if (notice) notice.hidden = true;
      return;
    }
    var grid = qs("weekDayGrid");
    var cards = Array.prototype.slice.call(grid.children);
    (saved.days || []).forEach(function (dayState) {
      var card = cards.filter(function (c) { return c.dataset.date === dayState.dateKey; })[0];
      if (!card) return;
      card._openCheckbox.checked = dayState.isOpen !== false;
      setItemsList(card._lists.regular, dayState.regular || []);
      setItemsList(card._lists.simple, dayState.simple || []);
    });
    if (saved.imageBase64) {
      weeklyMenuState.pendingImageBase64 = saved.imageBase64;
      weeklyMenuState.pendingImageMimeType = saved.imageMimeType || "image/jpeg";
      var wrap = qs("weekImagePreviewWrap");
      var previewImg = qs("weekImagePreviewImg");
      if (wrap && previewImg) {
        previewImg.src = "data:" + weeklyMenuState.pendingImageMimeType + ";base64," + saved.imageBase64;
        wrap.hidden = false;
      }
    }
    if (notice) {
      notice.hidden = false;
      var savedTime = saved.savedAt ? new Date(saved.savedAt).toLocaleString("ko-KR") : "";
      notice.querySelector(".autosave-text").textContent =
        "이전에 작성 중이던 내용을 복원했습니다" + (savedTime ? " (" + savedTime + " 저장분)" : "") +
        (saved.imageBase64 ? ". 이미지는 분석용으로만 복원되었으며, 원본 이미지를 게시하려면 파일을 다시 선택해주세요." : ".");
    }
  }

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

  /* 카드를 새로 그리는 시점까지 기다려야 하는 호출(예: 이미지 분석 결과 반영)을
     위해 Promise를 반환합니다. */
  function loadWeeklyMenuWeek(weekStartKey) {
    weeklyMenuState.weekStart = weekStartKey;
    weeklyMenuState.pendingImageFile = null;
    qs("weekStartInput").value = weekStartKey;
    var imgInput = qs("weekImageInput");
    if (imgInput) imgInput.value = "";
    var statusEl = qs("weekAnalyzeStatus");
    if (statusEl) statusEl.hidden = true;
    var publishStatusEl = qs("weekPublishStatus");
    if (publishStatusEl) publishStatusEl.hidden = true;

    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) {
      renderWeekDayGrid();
      renderWeekImage();
      return Promise.resolve();
    }

    weeklyMenuState.lastTranslations = null;
    weeklyMenuState.lastFailedTerms = [];
    weeklyMenuState.pendingImageBase64 = null;
    weeklyMenuState.pendingImageMimeType = null;
    var reviewEl = qs("weekTranslateReview");
    if (reviewEl) reviewEl.innerHTML = "";
    var confirmBtn = qs("weekPublishConfirmBtn");
    if (confirmBtn) confirmBtn.disabled = true;
    var retranslateNote = qs("weekRetranslateNote");
    if (retranslateNote) retranslateNote.hidden = true;

    var dateKeys = DAY_DEFS.map(function (d) { return addDaysToKey(weekStartKey, d.offset); });
    var daysPromise = Promise.all(dateKeys.map(function (dk) {
      return db.collection("weeklyMenus").doc(dk).get().catch(function () { return null; });
    })).then(function (snaps) {
      weeklyMenuState.dayDocs = {};
      snaps.forEach(function (snap, i) {
        weeklyMenuState.dayDocs[dateKeys[i]] = (snap && snap.exists) ? snap.data() : null;
      });
      renderWeekDayGrid();
      restoreAutosaveIfMatching(weekStartKey);
      updateRetranslateNoteVisibility();
    }).catch(function (err) {
      console.error(friendlyError("주간메뉴 데이터를 불러오지 못했습니다.", err));
      weeklyMenuState.dayDocs = {};
      renderWeekDayGrid();
      restoreAutosaveIfMatching(weekStartKey);
    });

    db.collection("weeklyMenuImages").doc(weekStartKey).get().then(function (snap) {
      weeklyMenuState.imageDoc = (snap && snap.exists) ? snap.data() : null;
      renderWeekImage();
    }).catch(function (err) {
      console.error(friendlyError("주간메뉴 이미지를 불러오지 못했습니다.", err));
      weeklyMenuState.imageDoc = null;
      renderWeekImage();
    });

    return daysPromise;
  }

  var MEAL_TYPES = [
    { key: "regular", label: "일반식" },
    { key: "simple", label: "간편식" }
  ];

  /* 기존 데이터를 { text, uncertain } 형태로 통일해서 돌려줍니다.
     - 새 저장 방식: { ko, zh, vi, en, mn } 또는 임시저장 { ko, uncertain }
     - 아주 예전 저장 방식(day.items 단일 목록)도 계속 지원 */
  function existingListFor(existing, typeKey) {
    if (!existing) return null;
    var raw = null;
    if (existing[typeKey] && existing[typeKey].length) raw = existing[typeKey];
    else if (typeKey === "regular" && existing.items && existing.items.length) raw = existing.items;
    if (!raw) return null;
    return raw.map(function (item) {
      if (typeof item === "string") return { text: item, uncertain: false };
      return { text: (item && item.ko) || "", uncertain: !!(item && item.uncertain) };
    });
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

      var openLabel = document.createElement("label");
      openLabel.className = "week-open-toggle";
      var openCheckbox = document.createElement("input");
      openCheckbox.type = "checkbox";
      openCheckbox.checked = existing ? existing.isOpen !== false : true;
      openLabel.appendChild(openCheckbox);
      openLabel.appendChild(document.createTextNode(" 운영 (해제 시 휴무)"));
      card.appendChild(openLabel);

      var pasteBox = document.createElement("textarea");
      pasteBox.className = "week-paste-box";
      pasteBox.rows = 2;
      pasteBox.placeholder = "엑셀에서 이 요일의 일반식·간편식 두 칸(여러 줄)을 복사해서 여기에 붙여넣으세요";
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
        var savedItems = existingListFor(existing, type.key);
        if (savedItems && savedItems.length) {
          savedItems.forEach(function (norm) { itemsList.appendChild(buildItemRow(norm.text, norm.uncertain)); });
        } else {
          itemsList.appendChild(buildItemRow("", false));
        }
        section.appendChild(itemsList);
        lists[type.key] = itemsList;

        var addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.className = "week-add-item-btn";
        addBtn.textContent = "+ 메뉴 추가";
        addBtn.addEventListener("click", function () { itemsList.appendChild(buildItemRow("", false)); });
        section.appendChild(addBtn);

        card.appendChild(section);
      });

      pasteBtn.addEventListener("click", function () {
        applyPasteToLists(pasteBox.value, lists.regular, lists.simple);
        pasteBox.value = "";
      });

      card._dateInput = dateInput;
      card._openCheckbox = openCheckbox;
      card._lists = lists;

      grid.appendChild(card);
    });
  }

  var TRANSLATION_LANGS = ["zh", "vi", "en", "mn", "bn", "my"];

  /* 이미 게시된 문서 중 4개 언어 번역이 다 채워지지 않은 항목이 있으면
     "번역 다시 실행" 안내를 보여줍니다(작업지시서 7번). */
  function weekHasUntranslatedItems() {
    var docs = weeklyMenuState.dayDocs || {};
    return Object.keys(docs).some(function (dk) {
      var doc = docs[dk];
      if (!doc) return false;
      var items = (doc.regular || []).concat(doc.simple || []);
      return items.some(function (item) {
        if (!item || !item.ko) return false;
        return TRANSLATION_LANGS.some(function (lang) { return !item[lang]; });
      });
    });
  }

  function updateRetranslateNoteVisibility() {
    var note = qs("weekRetranslateNote");
    if (!note) return;
    note.hidden = !weekHasUntranslatedItems();
  }

  function buildItemRow(text, uncertain) {
    var row = document.createElement("div");
    row.className = "week-item-row" + (uncertain ? " uncertain" : "");
    row.dataset.uncertain = uncertain ? "1" : "0";

    var input = document.createElement("input");
    input.type = "text";
    input.value = text || "";
    input.placeholder = "메뉴명";
    input.addEventListener("input", function () {
      // 관리자가 확인 필요 항목을 직접 수정하면 표시를 지웁니다.
      if (row.dataset.uncertain !== "1") return;
      row.dataset.uncertain = "0";
      row.classList.remove("uncertain");
      var tag = row.querySelector(".week-item-uncertain-tag");
      if (tag) tag.remove();
    });
    row.appendChild(input);

    if (uncertain) {
      var tag = document.createElement("span");
      tag.className = "week-item-uncertain-tag";
      tag.textContent = "확인 필요";
      row.appendChild(tag);
    }

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
    items.forEach(function (text) { listEl.appendChild(buildItemRow(text, false)); });
  }

  function setItemsListWithUncertain(listEl, items) {
    listEl.innerHTML = "";
    if (!items || !items.length) {
      listEl.appendChild(buildItemRow("", false));
      return;
    }
    items.forEach(function (item) {
      listEl.appendChild(buildItemRow((item && item.ko) || "", !!(item && item.uncertain)));
    });
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

  var ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  var MAX_IMAGE_BYTES = 10 * 1024 * 1024;

  /* 이번 세션에 새로 고른 이미지가 있으면 그 미리보기를 유지하고,
     없으면 이미 등록된(Firestore) 이미지를 보여줍니다. */
  function renderWeekImage() {
    if (weeklyMenuState.pendingImageFile) return;
    var wrap = qs("weekImagePreviewWrap");
    var img = qs("weekImagePreviewImg");
    if (weeklyMenuState.imageDoc && weeklyMenuState.imageDoc.imageUrl) {
      img.src = weeklyMenuState.imageDoc.imageUrl;
      wrap.hidden = false;
    } else {
      wrap.hidden = true;
      img.removeAttribute("src");
    }
  }

  /* ---------------- 관리자 로그인 함수(Netlify Function) 호출 ---------------- */

  // 서버(callGemini)가 최악의 경우 20초×3회+2초×2회(약 64초)까지 걸릴 수
  // 있어(장애 대비 재시도 설계), 클라이언트 쪽은 그보다 넉넉한 75초에서
  // 포기합니다 — 그래야 서버가 정상 응답하기 전에 화면이 먼저 "실패"로
  // 끊기지 않습니다. 이 시간 안에도 응답이 없으면(네트워크 자체 문제 등)
  // 관리자 페이지가 무한정 멈춰있지 않도록 여기서 확실히 실패 처리합니다.
  var MENU_FUNCTION_TIMEOUT_MS = 75000;

  function callMenuFunction(action, extra) {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    var user = auth && auth.currentUser;
    if (!user) return Promise.reject({ friendly: "로그인이 만료되었습니다. 다시 로그인해주세요." });

    return user.getIdToken().then(function (idToken) {
      var body = Object.assign({ action: action, idToken: idToken }, extra || {});
      var controller = (typeof AbortController === "function") ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, MENU_FUNCTION_TIMEOUT_MS) : null;
      return fetch("/.netlify/functions/parse-weekly-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller ? controller.signal : undefined
      }).finally(function () { if (timer) clearTimeout(timer); });
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (!res.ok || !data || !data.ok) {
          throw {
            friendly: (data && data.error) || "요청 처리에 실패했습니다. 잠시 후 다시 시도해주세요.",
            code: data && data.code
          };
        }
        return data;
      });
    }).catch(function (err) {
      if (err && err.name === "AbortError") {
        throw { friendly: "서버 응답이 너무 오래 걸려 중단했습니다. 잠시 후 다시 시도해주세요.", code: "CLIENT_TIMEOUT" };
      }
      throw err;
    });
  }

  /* 이미지를 서버로 보내기 전에 크기를 줄여 전송량을 낮춥니다(JPEG로 통일). */
  function resizeImageToBase64(file, maxDim) {
    return new Promise(function (resolve, reject) {
      var objectUrl = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        URL.revokeObjectURL(objectUrl);
        var w = img.naturalWidth || 1, h = img.naturalHeight || 1;
        var scale = Math.min(1, maxDim / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        var dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        var base64 = dataUrl.split(",")[1] || "";
        resolve({ base64: base64, mimeType: "image/jpeg" });
      };
      img.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이미지를 불러오지 못했습니다."));
      };
      img.src = objectUrl;
    });
  }

  /* ---------------- 방식 1: 이미지 자동 인식 ---------------- */

  function resetAnalyzeFailureActions() {
    var actionsEl = qs("weekAnalyzeFailActions");
    if (actionsEl) actionsEl.hidden = true;
  }

  function showAnalyzeFailureActions() {
    var actionsEl = qs("weekAnalyzeFailActions");
    if (actionsEl) actionsEl.hidden = false;
  }

  function initWeeklyImageAnalyze() {
    var fileInput = qs("weekImageInput");
    var errorEl = qs("weekImageError");
    var wrap = qs("weekImagePreviewWrap");
    var previewImg = qs("weekImagePreviewImg");
    var statusEl = qs("weekAnalyzeStatus");
    var analyzeBtn = qs("weekAnalyzeBtn");

    function resetImageSelection() {
      fileInput.value = "";
      weeklyMenuState.pendingImageFile = null;
      weeklyMenuState.pendingImageBase64 = null;
      weeklyMenuState.pendingImageMimeType = null;
      wrap.hidden = true;
      previewImg.removeAttribute("src");
      errorEl.textContent = "";
      statusEl.hidden = true;
      resetAnalyzeFailureActions();
      scheduleAutosave();
    }

    fileInput.addEventListener("change", function () {
      errorEl.textContent = "";
      statusEl.hidden = true;
      resetAnalyzeFailureActions();
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
      weeklyMenuState.pendingImageFile = file;
      previewImg.src = URL.createObjectURL(file);
      wrap.hidden = false;
      // 임시저장(4번 항목)에 쓸 수 있도록, 분석 요청과 별개로 축소본을 미리 만들어 둡니다.
      resizeImageToBase64(file, 1600).then(function (resized) {
        weeklyMenuState.pendingImageBase64 = resized.base64;
        weeklyMenuState.pendingImageMimeType = resized.mimeType;
        scheduleAutosave();
      }).catch(function () { /* 미리보기 실패는 무시 — 분석 시도 시 다시 시도됨 */ });
    });

    function runAnalyze() {
      var user = requireAdminUser();
      errorEl.textContent = "";
      resetAnalyzeFailureActions();
      if (!user) {
        errorEl.textContent = "로그인이 만료되었습니다. 다시 로그인해주세요.";
        return;
      }
      if (weeklyMenuState.analyzeInFlight) return; // 중복 클릭 방지
      var file = weeklyMenuState.pendingImageFile;
      if (!file) {
        errorEl.textContent = "분석할 이미지를 먼저 선택해주세요.";
        return;
      }

      weeklyMenuState.analyzeInFlight = true;
      analyzeBtn.disabled = true;
      statusEl.hidden = false;
      statusEl.className = "analyze-status";
      statusEl.textContent = "주간 메뉴를 분석하고 있습니다. (최대 1분 정도 걸릴 수 있습니다)";

      var imagePromise = weeklyMenuState.pendingImageBase64
        ? Promise.resolve({ base64: weeklyMenuState.pendingImageBase64, mimeType: weeklyMenuState.pendingImageMimeType })
        : resizeImageToBase64(file, 1600);

      imagePromise.then(function (resized) {
        weeklyMenuState.pendingImageBase64 = resized.base64;
        weeklyMenuState.pendingImageMimeType = resized.mimeType;
        return callMenuFunction("analyze", { imageBase64: resized.base64, mimeType: resized.mimeType });
      }).then(function (data) {
        var weekPromise = (data.weekStart && data.weekStart !== weeklyMenuState.weekStart)
          ? loadWeeklyMenuWeek(data.weekStart)
          : Promise.resolve();
        return weekPromise.then(function () {
          applyAnalyzedResult(data);
          weeklyMenuState.analyzeInFlight = false;
          analyzeBtn.disabled = false;
          statusEl.className = "analyze-status success";
          statusEl.textContent = "분석이 완료되었습니다. 메뉴와 날짜를 확인해 주세요.";
          scheduleAutosave();
        });
      }).catch(function (err) {
        console.error("이미지 분석 오류:", err);
        weeklyMenuState.analyzeInFlight = false;
        analyzeBtn.disabled = false;
        statusEl.className = "analyze-status error";
        // 고정 문구(작업지시서 3번)가 기본값이지만, "키 설정 안 됨"처럼 재시도로는
        // 해결되지 않는 관리자 조치가 필요한 경우는 서버가 준 안내를 그대로 보여줍니다.
        // 업로드한 이미지와 입력 내용은 어느 경우든 그대로 유지됩니다.
        statusEl.textContent = (err && err.code === "AI_API_KEY_MISSING" && err.friendly)
          ? err.friendly
          : "자동 메뉴 분석에 실패했습니다.\n잠시 후 다시 시도하거나 직접 입력해 주세요.";
        showAnalyzeFailureActions();
        scheduleAutosave();
      });
    }

    analyzeBtn.addEventListener("click", runAnalyze);

    var retryBtn = qs("weekAnalyzeRetryBtn");
    if (retryBtn) retryBtn.addEventListener("click", runAnalyze);

    var switchBtn = qs("weekSwitchToManualBtn");
    if (switchBtn) switchBtn.addEventListener("click", function () {
      var grid = qs("weekDayGrid");
      if (grid) grid.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var reselectBtn = qs("weekReselectImageBtn");
    if (reselectBtn) reselectBtn.addEventListener("click", resetImageSelection);
  }

  function applyAnalyzedResult(data) {
    var grid = qs("weekDayGrid");
    var cards = Array.prototype.slice.call(grid.children);
    var days = data.days || {};

    Object.keys(days).forEach(function (dateKey) {
      var dayData = days[dateKey] || {};
      var card = cards.filter(function (c) { return c.dataset.dayCode === dayData.day; })[0];
      if (!card) card = cards.filter(function (c) { return c.dataset.date === dateKey; })[0];
      if (!card) {
        console.warn("분석 결과의 날짜/요일과 일치하는 카드를 찾지 못했습니다:", dateKey, dayData.day);
        return;
      }

      if (dateKey) {
        card._dateInput.value = dateKey;
        card.dataset.date = dateKey;
      }
      card._openCheckbox.checked = dayData.isOpen !== false;
      setItemsListWithUncertain(card._lists.regular, dayData.regular);
      setItemsListWithUncertain(card._lists.simple, dayData.simple);
    });
  }

  /* ---------------- 저장/게시(방식 1·2 공통) ---------------- */

  function collectCardState(card) {
    function collect(listEl) {
      return Array.prototype.map.call(listEl.querySelectorAll("input[type=text]"), function (i) { return i.value.trim(); })
        .filter(function (t) { return t.length > 0; });
    }
    return {
      dateKey: card._dateInput.value,
      dayCode: card.dataset.dayCode,
      isOpen: card._openCheckbox.checked,
      regular: collect(card._lists.regular),
      simple: collect(card._lists.simple)
    };
  }

  function collectAllCards() {
    var grid = qs("weekDayGrid");
    return Array.prototype.map.call(grid.children, collectCardState);
  }

  function showPublishStatus(text, isError, isSuccess) {
    var el = qs("weekPublishStatus");
    el.hidden = false;
    el.className = "publish-status" + (isError ? " error" : (isSuccess ? " success" : ""));
    el.textContent = text;
  }

  function setPublishButtonsDisabled(disabled) {
    qs("weekSaveDraftBtn").disabled = disabled;
    qs("weekTranslateCheckBtn").disabled = disabled;
    // "게시 확정"은 번역 확인을 거쳐야 눌리므로, 진행 중(disabled=true)일 때만
    // 강제로 잠그고, 다시 풀 때는 runTranslateCheck/게시 흐름이 각자 판단해 다시 켭니다.
    if (disabled) qs("weekPublishConfirmBtn").disabled = true;
    var retranslateBtn = qs("weekRetranslateBtn");
    if (retranslateBtn) retranslateBtn.disabled = disabled;
    qs("weekDeleteAllBtn").disabled = disabled;
  }

  function uploadWeekImage(file) {
    var storage = (typeof getFirebaseStorage === "function") ? getFirebaseStorage() : null;
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!storage || !db) return Promise.resolve(null);

    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var weekStartKey = weeklyMenuState.weekStart;
    var path = "weeklyMenuImages/" + weekStartKey + "." + ext;
    var ref = storage.ref().child(path);

    return ref.put(file).then(function () {
      return ref.getDownloadURL();
    }).then(function (url) {
      return db.collection("weeklyMenuImages").doc(weekStartKey).set({
        weekStart: weekStartKey,
        imageUrl: url,
        uploadedAt: serverTimestampOrNow()
      }).then(function () { return url; });
    });
  }

  /* 번역 결과 검토 화면(작업지시서 5번: 관리자 확인 → 번역 확인 → 게시)
     "번역 대기" 항목은 빨간색으로 표시합니다. */
  function renderTranslateReview(cards, translations, failedTerms) {
    var reviewEl = qs("weekTranslateReview");
    if (!reviewEl) return;
    reviewEl.innerHTML = "";
    var failedSet = {};
    (failedTerms || []).forEach(function (t) { failedSet[t] = true; });

    cards.forEach(function (c) {
      if (!c.dateKey || (!c.regular.length && !c.simple.length)) return;
      var dayBlock = document.createElement("div");
      dayBlock.className = "translate-review-day";
      var title = document.createElement("h4");
      title.textContent = c.dateKey + (c.isOpen === false ? " (휴무)" : "");
      dayBlock.appendChild(title);

      c.regular.concat(c.simple).forEach(function (term) {
        var row = document.createElement("div");
        row.className = "translate-review-row" + (failedSet[term] ? " pending" : "");
        var koSpan = document.createElement("span");
        koSpan.className = "translate-review-ko";
        koSpan.textContent = term;
        row.appendChild(koSpan);

        var statusSpan = document.createElement("span");
        if (failedSet[term]) {
          statusSpan.className = "translate-review-pending-tag";
          statusSpan.textContent = "번역 대기";
        } else {
          var tr = translations[term] || {};
          statusSpan.className = "translate-review-done-tag";
          statusSpan.textContent = "번역 완료 (EN: " + (tr.en || "-") + ")";
        }
        row.appendChild(statusSpan);
        dayBlock.appendChild(row);
      });
      reviewEl.appendChild(dayBlock);
    });
  }

  function buildTranslatedList(list, translations) {
    return list.map(function (t) {
      var obj = { ko: t };
      var tr = translations[t];
      if (tr) {
        if (tr.zh) obj.zh = tr.zh;
        if (tr.vi) obj.vi = tr.vi;
        if (tr.en) obj.en = tr.en;
        if (tr.mn) obj.mn = tr.mn;
        if (tr.bn) obj.bn = tr.bn;
        if (tr.my) obj.my = tr.my;
      }
      return obj;
    });
  }

  /* "번역 확인" — Gemini가 완전히 막혀 있어도(장애 대비 7번) 여기서
     예외를 던지지 않고, 캐시로 찾은 번역만이라도 반영한 뒤 "게시 확정"을
     항상 눌러볼 수 있는 상태로 만듭니다. 번역이 하나도 안 된 항목은
     "번역 대기"로 남고, 게시하면 한글로만 표시됩니다. */
  function runTranslateCheck() {
    var user = requireAdminUser();
    if (!user) { showPublishStatus("로그인이 만료되었습니다. 다시 로그인해주세요.", true); return; }

    var cards = collectAllCards();
    var terms = [];
    cards.forEach(function (c) { terms = terms.concat(c.regular, c.simple); });
    terms = Array.from(new Set(terms));

    setPublishButtonsDisabled(true);
    showPublishStatus(terms.length ? "번역을 확인하고 있습니다... (최대 1분 정도 걸릴 수 있습니다)" : "확인 중...", false);

    var translatePromise = terms.length > 0
      ? callMenuFunction("translate", { terms: terms })
      : Promise.resolve({ translations: {}, failedTerms: [] });

    translatePromise.catch(function (err) {
      // 함수 호출 자체가 실패해도(네트워크 문제 등) 게시를 막지 않습니다 —
      // 전부 "번역 대기"로 취급하고 한글만으로 게시할 수 있게 합니다.
      console.error("번역 확인 실패(한글만으로 게시 가능):", err);
      return { translations: {}, failedTerms: terms, failedReason: (err && err.friendly) || "번역 서버에 연결할 수 없습니다." };
    }).then(function (data) {
      weeklyMenuState.lastTranslations = data.translations || {};
      weeklyMenuState.lastFailedTerms = data.failedTerms || [];
      renderTranslateReview(cards, weeklyMenuState.lastTranslations, weeklyMenuState.lastFailedTerms);
      setPublishButtonsDisabled(false);
      qs("weekPublishConfirmBtn").disabled = false; // 실패해도 "게시 확정"은 항상 눌러볼 수 있음

      if (weeklyMenuState.lastFailedTerms.length === 0) {
        showPublishStatus("번역 확인이 끝났습니다. 내용을 확인한 뒤 '게시 확정'을 눌러주세요.", false, true);
      } else if (weeklyMenuState.lastFailedTerms.length === terms.length && terms.length > 0) {
        showPublishStatus((data.failedReason || "지금 번역 서버에 연결할 수 없습니다.") + " '게시 확정'을 누르면 한글로만 게시됩니다.", true);
      } else {
        showPublishStatus("일부 메뉴(" + weeklyMenuState.lastFailedTerms.length + "개)는 번역하지 못해 '번역 대기'로 표시됩니다. 그대로 게시하면 한글로만 보여집니다.", true);
      }
    });
  }

  /* "게시 확정" — 마지막 "번역 확인" 결과(없으면 빈 번역, 즉 한글만)로
     그대로 게시합니다. Gemini/번역 서버 장애와 무관하게 항상 동작합니다. */
  function runPublishConfirm() {
    var user = requireAdminUser();
    if (!user) { showPublishStatus("로그인이 만료되었습니다. 다시 로그인해주세요.", true); return; }
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) { showPublishStatus("게시 기능을 사용할 수 없습니다.", true); return; }
    if (weeklyMenuState.publishInFlight) return; // 중복 게시(연타) 방지

    var cards = collectAllCards();
    var translations = weeklyMenuState.lastTranslations || {}; // null이면(번역 확인 안 함) 한글만으로 게시

    weeklyMenuState.publishInFlight = true;
    setPublishButtonsDisabled(true);
    showPublishStatus("게시 중...", false);

    var imageUploadPromise = weeklyMenuState.pendingImageFile
      ? uploadWeekImage(weeklyMenuState.pendingImageFile)
      : Promise.resolve(null);

    imageUploadPromise.then(function (imageUrl) {
      var dayWrites = cards.filter(function (c) { return c.dateKey; }).map(function (c) {
        var docData = {
          weekStart: weeklyMenuState.weekStart,
          date: c.dateKey,
          day: c.dayCode,
          isOpen: c.isOpen,
          regular: buildTranslatedList(c.regular, translations),
          simple: buildTranslatedList(c.simple, translations),
          status: "published",
          updatedAt: serverTimestampOrNow()
        };
        if (imageUrl) docData.sourceImageUrl = imageUrl;
        return db.collection("weeklyMenus").doc(c.dateKey).set(docData, { merge: true });
      });

      var dictWrites = Object.keys(translations).map(function (term) {
        var tr = translations[term] || {};
        var docData = { ko: term, updatedAt: serverTimestampOrNow() };
        if (tr.zh) docData.zh = tr.zh;
        if (tr.vi) docData.vi = tr.vi;
        if (tr.en) docData.en = tr.en;
        if (tr.mn) docData.mn = tr.mn;
        if (tr.bn) docData.bn = tr.bn;
        if (tr.my) docData.my = tr.my;
        return db.collection("menuTranslations").doc(term).set(docData, { merge: true });
      });

      return Promise.all(dayWrites.concat(dictWrites));
    }).then(function () {
      weeklyMenuState.publishInFlight = false;
      setPublishButtonsDisabled(false);
      var pendingCount = weeklyMenuState.lastFailedTerms ? weeklyMenuState.lastFailedTerms.length : 0;
      showPublishStatus(
        pendingCount > 0
          ? "게시되었습니다. 번역 안 된 " + pendingCount + "개 메뉴는 한글로 표시됩니다(나중에 '번역 다시 실행'으로 처리할 수 있습니다)."
          : "게시되었습니다. 학생 화면에 오늘·내일 메뉴로 반영됩니다.",
        false, true
      );
      weeklyMenuState.pendingImageFile = null;
      clearAutosave();
      loadWeeklyMenuWeek(weeklyMenuState.weekStart);
    }).catch(function (err) {
      weeklyMenuState.publishInFlight = false;
      setPublishButtonsDisabled(false);
      showPublishStatus((err && err.friendly) || friendlyError("게시에 실패했습니다.", err), true);
    });
  }

  function initWeeklyPublishActions() {
    qs("weekSaveDraftBtn").addEventListener("click", function () {
      var user = requireAdminUser();
      if (!user) { showPublishStatus("로그인이 만료되었습니다. 다시 로그인해주세요.", true); return; }
      var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
      if (!db) { showPublishStatus("저장 기능을 사용할 수 없습니다.", true); return; }

      var cards = collectAllCards();
      setPublishButtonsDisabled(true);
      showPublishStatus("임시저장 중...", false);

      var writes = cards.filter(function (c) { return c.dateKey; }).map(function (c) {
        return db.collection("weeklyMenus").doc(c.dateKey).set({
          weekStart: weeklyMenuState.weekStart,
          date: c.dateKey,
          day: c.dayCode,
          isOpen: c.isOpen,
          regular: c.regular.map(function (t) { return { ko: t }; }),
          simple: c.simple.map(function (t) { return { ko: t }; }),
          status: "draft",
          updatedAt: serverTimestampOrNow()
        }, { merge: true });
      });

      Promise.all(writes).then(function () {
        setPublishButtonsDisabled(false);
        showPublishStatus("임시저장되었습니다. (학생 화면에는 아직 반영되지 않습니다)", false, true);
      }).catch(function (err) {
        setPublishButtonsDisabled(false);
        showPublishStatus(friendlyError("임시저장에 실패했습니다.", err), true);
      });
    });

    qs("weekTranslateCheckBtn").addEventListener("click", runTranslateCheck);
    qs("weekPublishConfirmBtn").addEventListener("click", runPublishConfirm);

    var retranslateBtn = qs("weekRetranslateBtn");
    if (retranslateBtn) retranslateBtn.addEventListener("click", runTranslateCheck);

    qs("weekDeleteAllBtn").addEventListener("click", function () {
      var user = requireAdminUser();
      if (!user) { showPublishStatus("로그인이 만료되었습니다. 다시 로그인해주세요.", true); return; }
      var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
      if (!db) return;
      if (!window.confirm(weeklyMenuState.weekStart + " 주간 전체 메뉴를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;

      setPublishButtonsDisabled(true);
      showPublishStatus("삭제 중...", false);

      var dateKeys = DAY_DEFS.map(function (d) { return addDaysToKey(weeklyMenuState.weekStart, d.offset); });
      var deletes = dateKeys.map(function (dk) { return db.collection("weeklyMenus").doc(dk).delete(); });
      deletes.push(db.collection("weeklyMenuImages").doc(weeklyMenuState.weekStart).delete());

      Promise.all(deletes).then(function () {
        setPublishButtonsDisabled(false);
        showPublishStatus("삭제되었습니다.", false, true);
        clearAutosave();
        loadWeeklyMenuWeek(weeklyMenuState.weekStart);
      }).catch(function (err) {
        setPublishButtonsDisabled(false);
        showPublishStatus(friendlyError("삭제에 실패했습니다.", err), true);
      });
    });

    // 카드 내용을 고치면 이전 "번역 확인" 결과가 더는 정확하지 않으므로
    // 다시 확인하도록 "게시 확정"을 잠그고 검토 화면을 비웁니다.
    var grid = qs("weekDayGrid");
    if (grid) {
      grid.addEventListener("input", handleGridChanged);
      grid.addEventListener("change", handleGridChanged);
    }
  }

  function handleGridChanged() {
    weeklyMenuState.lastTranslations = null;
    weeklyMenuState.lastFailedTerms = [];
    var confirmBtn = qs("weekPublishConfirmBtn");
    if (confirmBtn) confirmBtn.disabled = true;
    var reviewEl = qs("weekTranslateReview");
    if (reviewEl) reviewEl.innerHTML = "";
    scheduleAutosave();
  }

  function initWeeklyMenuPage() {
    var configured = (typeof isFirebaseConfigured === "function") && isFirebaseConfigured();
    if (!configured) {
      qs("weeklyMenuLockedNote").hidden = false;
      qs("weeklyMenuLockedNote").querySelector("p").textContent = "Firebase가 연결되지 않아 주간메뉴 관리 기능을 사용할 수 없습니다.";
      return;
    }

    initWeeklyMenuAuth();
    initWeeklyImageAnalyze();
    initWeeklyPublishActions();

    qs("weekLoadBtn").addEventListener("click", function () {
      var val = qs("weekStartInput").value;
      if (!val) return;
      loadWeeklyMenuWeek(mondayKeyOf(val));
    });

    var discardBtn = qs("weekAutosaveDiscardBtn");
    if (discardBtn) discardBtn.addEventListener("click", function () {
      clearAutosave();
      loadWeeklyMenuWeek(weeklyMenuState.weekStart);
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

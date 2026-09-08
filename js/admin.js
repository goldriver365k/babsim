/* ==========================================================================
   관리자 페이지 — 천원의 아침밥 메뉴 평가 통계 (js/admin.js)
   - Firestore(breakfastRatings 컬렉션)에서 평가 데이터를 읽어와
     날짜별로 집계하여 보여줍니다. 화면 문구는 한국어로 고정입니다.
   - 무거운 차트 라이브러리를 쓰지 않고 순수 SVG/CSS로 그래프를 그립니다.
   ========================================================================== */

(function () {
  "use strict";

  /* 관리자 페이지 접근용 임시 암호(강한 보안 아님, 단순 접근 제한용).
     실제 운영 시 반드시 이 값을 바꾸세요. Firestore 규칙이 진짜 보안 경계입니다. */
  var ADMIN_PASSPHRASE = "foodhall2026";
  var SESSION_KEY = "foodhall_admin_authed";

  var SEOUL_TZ = "Asia/Seoul";
  var SCORES = [5, 4, 3, 2, 1];

  var els = {};
  var state = {
    filter: "today", // today | 7d | month | custom
    customStart: null,
    customEnd: null,
    rangeDocs: [],
    selectedDate: null
  };

  function qs(id) { return document.getElementById(id); }

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

  /* ---------------- 로그인 게이트 ---------------- */

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

  /* ---------------- Firestore 조회 ---------------- */

  function fetchRange(startKey, endKey) {
    var db = (typeof getFirestoreDb === "function") ? getFirestoreDb() : null;
    if (!db) return Promise.resolve([]);
    return db.collection("breakfastRatings")
      .where("date", ">=", startKey)
      .where("date", "<=", endKey)
      .get()
      .then(function (snap) {
        var out = [];
        snap.forEach(function (doc) { out.push(doc.data()); });
        return out;
      });
  }

  /* ---------------- 집계 ---------------- */

  function emptyCounts() { return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }; }

  function statsFromDocs(docs) {
    var counts = emptyCounts();
    var sum = 0;
    var count = 0;
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
    var topMenu = "";
    var topMenuVotes = 0;
    Object.keys(menuVotes).forEach(function (m) {
      if (menuVotes[m] > topMenuVotes) { topMenu = m; topMenuVotes = menuVotes[m]; }
    });
    return { count: count, sum: sum, avg: avg, positive: positive, counts: counts, menuText: topMenu };
  }

  function groupByDate(docs) {
    var byDate = {};
    docs.forEach(function (d) {
      if (!d.date) return;
      if (!byDate[d.date]) byDate[d.date] = [];
      byDate[d.date].push(d);
    });
    var result = {};
    Object.keys(byDate).forEach(function (dateKey) {
      result[dateKey] = statsFromDocs(byDate[dateKey]);
    });
    return result;
  }

  /* ---------------- 오늘 평가 결과 (항상 오늘 기준, 필터와 무관) ---------------- */

  function renderTodaySection() {
    var todayKey = getSeoulDateKey(0);
    fetchRange(todayKey, todayKey).then(function (docs) {
      var s = statsFromDocs(docs);
      els.todayParticipants.textContent = s.count.toLocaleString("ko-KR") + "명";
      els.todayAvg.textContent = s.count > 0 ? (s.avg.toFixed(1) + " / 5") : "-";
      els.todayPositive.textContent = s.count > 0 ? (Math.round(s.positive) + "%") : "-";
      renderDistList(els.todayDistList, s.counts, s.count);
    }).catch(function (err) {
      console.error("오늘 평가 조회 오류:", err);
    });
  }

  var SCORE_LABEL_KO = { 5: "아주 좋아요", 4: "좋아요", 3: "보통이에요", 2: "아쉬워요", 1: "별로예요" };

  function renderDistList(container, counts, total) {
    container.innerHTML = "";
    var max = Math.max(1, counts[5], counts[4], counts[3], counts[2], counts[1]);
    SCORES.forEach(function (score) {
      var row = document.createElement("div");
      row.className = "dist-row";

      var label = document.createElement("span");
      label.className = "dist-label";
      label.textContent = SCORE_LABEL_KO[score];
      row.appendChild(label);

      var track = document.createElement("span");
      track.className = "dist-bar-track";
      var fill = document.createElement("span");
      fill.className = "dist-bar-fill";
      fill.style.width = (total > 0 ? (counts[score] / max) * 100 : 0) + "%";
      track.appendChild(fill);
      row.appendChild(track);

      var countEl = document.createElement("span");
      countEl.className = "dist-count";
      countEl.textContent = counts[score];
      row.appendChild(countEl);

      container.appendChild(row);
    });
  }

  /* ---------------- 최근 7일 평균평점 추이 (필터와 무관, 항상 최근 7일) ---------------- */

  function renderTrend() {
    var startKey = getSeoulDateKey(-6);
    var endKey = getSeoulDateKey(0);
    fetchRange(startKey, endKey).then(function (docs) {
      var byDate = groupByDate(docs);
      var days = [];
      for (var i = -6; i <= 0; i++) days.push(getSeoulDateKey(i));
      drawTrendChart(days, byDate);
    }).catch(function (err) {
      console.error("최근 7일 추이 조회 오류:", err);
    });
  }

  function drawTrendChart(days, byDate) {
    var svg = els.trendChart;
    var w = 320, h = 140, padL = 24, padR = 10, padT = 14, padB = 22;
    var innerW = w - padL - padR, innerH = h - padT - padB;

    var points = days.map(function (dateKey, i) {
      var s = byDate[dateKey];
      var avg = s && s.count > 0 ? s.avg : null;
      var x = padL + (innerW * (i / (days.length - 1)));
      var y = padT + innerH - (avg !== null ? (avg / 5) * innerH : 0);
      return { x: x, y: y, avg: avg, dateKey: dateKey };
    });

    var parts = [];
    parts.push('<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">');

    // 기준선 (0~5점 격자)
    [0, 1, 2, 3, 4, 5].forEach(function (v) {
      var y = padT + innerH - (v / 5) * innerH;
      parts.push('<line x1="' + padL + '" y1="' + y + '" x2="' + (w - padR) + '" y2="' + y + '" stroke="#e5e8ee" stroke-width="1"/>');
    });

    // 꺾은선
    var withData = points.filter(function (p) { return p.avg !== null; });
    if (withData.length > 1) {
      var lineD = withData.map(function (p, i) { return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
      parts.push('<path d="' + lineD + '" fill="none" stroke="#1957d6" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>');
    }

    points.forEach(function (p) {
      if (p.avg === null) return;
      parts.push('<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="3.5" fill="#1957d6"/>');
    });

    // x축 날짜 라벨
    points.forEach(function (p) {
      parts.push('<text x="' + p.x.toFixed(1) + '" y="' + (h - 6) + '" font-size="9" fill="#4b5563" text-anchor="middle">' + formatMonthDay(p.dateKey) + '</text>');
    });

    parts.push('</svg>');
    svg.innerHTML = parts.join("");
  }

  /* ---------------- 필터 / 날짜별 결과 표 ---------------- */

  function currentRangeKeys() {
    var todayKey = getSeoulDateKey(0);
    if (state.filter === "today") return [todayKey, todayKey];
    if (state.filter === "7d") return [getSeoulDateKey(-6), todayKey];
    if (state.filter === "month") return [monthStartKey(todayKey), todayKey];
    if (state.filter === "custom" && state.customStart && state.customEnd) {
      return [state.customStart, state.customEnd];
    }
    return [todayKey, todayKey];
  }

  function reloadRange() {
    var range = currentRangeKeys();
    els.tableBody.innerHTML = "";
    els.tableEmpty.hidden = true;
    els.tableLoading.hidden = false;

    fetchRange(range[0], range[1]).then(function (docs) {
      els.tableLoading.hidden = true;
      state.rangeDocs = docs;
      var byDate = groupByDate(docs);
      var dateKeys = Object.keys(byDate).sort().reverse();

      if (dateKeys.length === 0) {
        els.tableEmpty.hidden = false;
        els.tableEmpty.textContent = "선택한 기간에 평가 데이터가 없습니다.";
        clearSelectedDistribution();
        return;
      }

      renderTable(dateKeys, byDate);

      var selected = dateKeys.indexOf(state.selectedDate) !== -1 ? state.selectedDate : dateKeys[0];
      selectDate(selected, byDate[selected], dateKeys, byDate);
    }).catch(function (err) {
      console.error("기간별 조회 오류:", err);
      els.tableLoading.hidden = true;
      els.tableEmpty.hidden = false;
      els.tableEmpty.textContent = "데이터를 불러오지 못했습니다.";
    });
  }

  function renderTable(dateKeys, byDate) {
    els.tableBody.innerHTML = "";
    dateKeys.forEach(function (dateKey) {
      var s = byDate[dateKey];
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
      tr.addEventListener("click", function () {
        selectDate(dateKey, s, dateKeys, byDate);
      });
      els.tableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function selectDate(dateKey, stats, dateKeys, byDate) {
    state.selectedDate = dateKey;
    Array.prototype.forEach.call(els.tableBody.querySelectorAll("tr"), function (tr) {
      tr.classList.toggle("selected", tr.dataset.date === dateKey);
    });
    els.selectedDateLabel.textContent = dateKey;
    renderDistList(els.selectedDistList, stats.counts, stats.count);
  }

  function clearSelectedDistribution() {
    state.selectedDate = null;
    els.selectedDateLabel.textContent = "-";
    renderDistList(els.selectedDistList, emptyCounts(), 0);
  }

  function setFilter(filter) {
    state.filter = filter;
    Array.prototype.forEach.call(els.filterBtns, function (btn) {
      btn.classList.toggle("active", btn.dataset.filter === filter);
    });
    els.customRange.hidden = filter !== "custom";
    if (filter !== "custom") reloadRange();
  }

  /* ---------------- 초기화 ---------------- */

  function initApp() {
    els.warnBanner = qs("adminFirebaseWarning");
    els.todayParticipants = qs("todayParticipants");
    els.todayAvg = qs("todayAvg");
    els.todayPositive = qs("todayPositive");
    els.todayDistList = qs("todayDistList");

    els.filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
    els.customRange = qs("customRange");
    els.customStartInput = qs("customStartInput");
    els.customEndInput = qs("customEndInput");
    els.customRangeApply = qs("customRangeApply");

    els.tableBody = qs("resultsTableBody");
    els.tableEmpty = qs("tableEmpty");
    els.tableLoading = qs("tableLoading");
    els.selectedDateLabel = qs("selectedDateLabel");
    els.selectedDistList = qs("selectedDistList");

    els.trendChart = qs("trendChart");

    var configured = (typeof isFirebaseConfigured === "function") && isFirebaseConfigured();
    els.warnBanner.hidden = configured;

    Array.prototype.forEach.call(els.filterBtns, function (btn) {
      btn.addEventListener("click", function () { setFilter(btn.dataset.filter); });
    });

    var todayKey = getSeoulDateKey(0);
    els.customStartInput.value = todayKey;
    els.customEndInput.value = todayKey;
    els.customRangeApply.addEventListener("click", function () {
      state.customStart = els.customStartInput.value || todayKey;
      state.customEnd = els.customEndInput.value || todayKey;
      reloadRange();
    });

    renderTodaySection();
    renderTrend();
    reloadRange();
  }

  document.addEventListener("DOMContentLoaded", initGate);
})();

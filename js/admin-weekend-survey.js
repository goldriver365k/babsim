/* ==========================================================================
   관리자 페이지 - 1,000원의 아침밥 주말·공휴일 설문조사
   (js/admin-weekend-survey.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "주말·공휴일 설문" 탭 하나를 추가합니다(js/admin-room-inquiry.js와
     같은 방식). 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase
     계정을 그대로 씁니다.
   - 탭을 열 때 weekendBreakfastSurveys를 딱 1번만 조회하고(실시간 리스너
     없음), 이후 언어 필터는 이미 받아온 데이터를 브라우저에서 다시 계산만
     합니다(재조회 없음 — 비용 최소화 지시서 40번).
   - Chart.js 등 새 차트 라이브러리 없이 "인원 + %" 텍스트만 사용합니다
     (36번).
   ========================================================================== */

var AdminWeekendSurvey = (function () {
  "use strict";

  var els = {};
  var allDocs = null; // 최초 조회 결과 캐시(.get() 1회) — 언어 필터는 이 배열을 다시 계산

  var LANG_LABEL = { ko: "한국어", en: "English", zh: "中文", vi: "Tiếng Việt", bn: "বাংলা" };
  var LANG_ORDER = ["ko", "en", "zh", "vi", "bn"];
  var Q1_LABEL = { korean: "한국인 학생", international: "유학생" };
  var Q2_LABEL = { dorm: "기숙사 생활", offcampus: "자취", commute: "통학" };
  var Q3_LABEL = { "0730": "오전 7:30 ~ 오전 9:30", "0800": "오전 8:00 ~ 오전 10:00" };
  var Q4_LABEL = { simple: "간편식", simple_korean: "간편식 + 한식", other: "기타 의견" };
  var Q5_LABEL = { often: "자주 이용하겠다", sometimes: "가끔 이용하겠다", unsure: "잘 모르겠다", no: "이용하지 않을 것 같다" };

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }

  function fmtDateTime(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : null;
    if (!d || isNaN(d.getTime())) return "-";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function pct(count, total) {
    if (!total) return "0.0%";
    return (count / total * 100).toFixed(1) + "%";
  }

  // 현재 언어 필터가 적용된 응답 목록 — render()와 CSV 취합(exportResultsCsv)
  // 양쪽에서 재사용해 같은 필터 로직을 중복 작성하지 않습니다.
  function getFiltered() {
    var docs = allDocs || [];
    var filterLang = els.langFilter ? els.langFilter.value : "all";
    return (filterLang === "all") ? docs : docs.filter(function (d) { return d.selectedLanguage === filterLang; });
  }

  // 인원+% 텍스트만 쌓는 단순 통계 블록(새 차트 라이브러리 없음 — 36번).
  function renderCountStats(container, rows, total) {
    container.innerHTML = "";
    rows.forEach(function (r) {
      var p = document.createElement("p");
      p.className = "weekend-survey-stat-row";
      p.innerHTML = "<strong>" + r.label + "</strong> — " + r.count + "명 / " + pct(r.count, total);
      container.appendChild(p);
    });
    if (!rows.length) container.innerHTML = "<p class=\"empty-note\">데이터가 없습니다.</p>";
  }

  function countBy(docs, field, keys) {
    var counts = {};
    keys.forEach(function (k) { counts[k] = 0; });
    docs.forEach(function (d) { if (counts[d[field]] !== undefined) counts[d[field]] += 1; });
    return counts;
  }

  // 테스트/스팸 응답을 지울 때 씁니다 — 재조회 없이 캐시(allDocs)에서만
  // 지우고 다시 그립니다(비용 최소화 40번과 같은 원칙).
  function deleteEntry(docId, btn) {
    var d = db();
    if (!d) return;
    if (!window.confirm("이 응답을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    btn.disabled = true;
    d.collection("weekendBreakfastSurveys").doc(docId).delete().then(function () {
      allDocs = (allDocs || []).filter(function (d) { return d.id !== docId; });
      render();
    }).catch(function () {
      window.alert("삭제 실패(관리자 권한이 없을 수 있습니다).");
      btn.disabled = false;
    });
  }

  /* ---------------- 결과 취합 다운로드(CSV) ----------------
     새 라이브러리 없이 브라우저 기본 Blob/URL.createObjectURL만 사용합니다.
     화면에 이미 그려둔 통계와 같은 집계 로직(countBy/pct/getFiltered)을
     그대로 재사용해 중복 계산을 만들지 않습니다. 언어별 응답 수는 필터와
     무관하게 항상 전체 기준이고(화면 통계와 동일), 문항별 통계·기타
     의견·건의사항은 현재 선택된 언어 필터를 그대로 반영합니다. */
  function csvEscape(v) {
    var s = (v === undefined || v === null) ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvRow(cells) { return cells.map(csvEscape).join(",") + "\r\n"; }

  function fmtNow() {
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  function buildResultsCsv() {
    var docs = allDocs || [];
    var filtered = getFiltered();
    var total = filtered.length;
    var filterLang = els.langFilter ? els.langFilter.value : "all";
    var out = "";

    out += csvRow(["1,000원의 아침밥 주말·공휴일 설문조사 결과 취합"]);
    out += csvRow(["생성일시", fmtNow()]);
    out += csvRow(["언어 필터", filterLang === "all" ? "전체" : (LANG_LABEL[filterLang] || filterLang)]);
    out += csvRow(["응답 수(필터 기준)", total + "명"]);
    out += csvRow([]);

    out += csvRow(["[언어별 응답 — 전체 기준, 필터 무관]"]);
    out += csvRow(["언어", "인원", "비율"]);
    var langCounts = countBy(docs, "selectedLanguage", LANG_ORDER);
    LANG_ORDER.forEach(function (l) { out += csvRow([LANG_LABEL[l], langCounts[l], pct(langCounts[l], docs.length)]); });
    out += csvRow([]);

    function statSection(title, field, labelMap) {
      out += csvRow(["[" + title + "]"]);
      out += csvRow(["선택지", "인원", "비율"]);
      var counts = countBy(filtered, field, Object.keys(labelMap));
      Object.keys(labelMap).forEach(function (k) { out += csvRow([labelMap[k], counts[k], pct(counts[k], total)]); });
      out += csvRow([]);
    }
    function freeTextSection(title, field) {
      out += csvRow(["[" + title + "]"]);
      out += csvRow(["작성일", "언어", "내용"]);
      var rows = filtered.filter(function (d) { return d[field] && d[field].trim(); })
        .sort(function (a, b) { return (b._createdMs || 0) - (a._createdMs || 0); });
      if (!rows.length) { out += csvRow(["(없음)"]); }
      rows.forEach(function (d) { out += csvRow([fmtDateTime(d.createdAt), LANG_LABEL[d.selectedLanguage] || d.selectedLanguage, d[field]]); });
      out += csvRow([]);
    }

    statSection("질문 1 — 귀하는 어디에 해당합니까?", "nationalityType", Q1_LABEL);
    statSection("질문 2 — 현재 생활 형태는?", "livingType", Q2_LABEL);
    statSection("질문 3 — 희망 운영시간", "preferredTime", Q3_LABEL);
    statSection("질문 4 — 메뉴 구성", "menuPreference", Q4_LABEL);
    freeTextSection("질문 4 기타 의견", "menuOtherOpinion");
    statSection("질문 5 — 이용 의향", "usageIntent", Q5_LABEL);
    freeTextSection("건의사항", "suggestion");

    return out;
  }

  function downloadResultsCsv() {
    if (!allDocs) { window.alert("먼저 데이터를 불러온 뒤 다운로드해주세요."); return; }
    var csv = buildResultsCsv();
    var blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var d = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    a.href = url;
    a.download = "weekend-survey-results-" + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function render() {
    var docs = allDocs || [];
    var filtered = getFiltered();
    var total = filtered.length;

    if (els.totalCount) els.totalCount.textContent = total + "명";

    // 선택 언어 통계는 필터와 무관하게 전체 기준으로 보여줍니다(필터는
    // "그 언어만 기준으로 나머지 문항 통계를 다시 계산"하는 용도 — 35번).
    var langCounts = countBy(docs, "selectedLanguage", LANG_ORDER);
    renderCountStats(els.langStats, LANG_ORDER.map(function (l) {
      return { label: LANG_LABEL[l], count: langCounts[l] };
    }), docs.length);

    var q1Counts = countBy(filtered, "nationalityType", Object.keys(Q1_LABEL));
    renderCountStats(els.q1Stats, Object.keys(Q1_LABEL).map(function (k) {
      return { label: Q1_LABEL[k], count: q1Counts[k] };
    }), total);

    var q2Counts = countBy(filtered, "livingType", Object.keys(Q2_LABEL));
    renderCountStats(els.q2Stats, Object.keys(Q2_LABEL).map(function (k) {
      return { label: Q2_LABEL[k], count: q2Counts[k] };
    }), total);

    var q3Counts = countBy(filtered, "preferredTime", Object.keys(Q3_LABEL));
    renderCountStats(els.q3Stats, Object.keys(Q3_LABEL).map(function (k) {
      return { label: Q3_LABEL[k], count: q3Counts[k] };
    }), total);

    var q4Counts = countBy(filtered, "menuPreference", Object.keys(Q4_LABEL));
    renderCountStats(els.q4Stats, Object.keys(Q4_LABEL).map(function (k) {
      return { label: Q4_LABEL[k], count: q4Counts[k] };
    }), total);

    // 기타 의견(menuOtherOpinion) — 비어있지 않은 것만, 최근순.
    var q4Others = filtered.filter(function (d) { return d.menuOtherOpinion && d.menuOtherOpinion.trim(); })
      .sort(function (a, b) { return (b._createdMs || 0) - (a._createdMs || 0); });
    els.q4Other.innerHTML = "";
    if (!q4Others.length) {
      els.q4Other.innerHTML = "<p class=\"empty-note\">기타 의견이 없습니다.</p>";
    } else {
      q4Others.forEach(function (d) {
        var p = document.createElement("p");
        p.innerHTML = "<strong>" + fmtDateTime(d.createdAt) + " (" + (LANG_LABEL[d.selectedLanguage] || d.selectedLanguage) + "):</strong> ";
        p.appendChild(document.createTextNode(d.menuOtherOpinion + " "));
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "삭제";
        delBtn.addEventListener("click", function () { deleteEntry(d.id, delBtn); });
        p.appendChild(delBtn);
        els.q4Other.appendChild(p);
      });
    }

    var q5Counts = countBy(filtered, "usageIntent", Object.keys(Q5_LABEL));
    renderCountStats(els.q5Stats, Object.keys(Q5_LABEL).map(function (k) {
      return { label: Q5_LABEL[k], count: q5Counts[k] };
    }), total);

    // 건의사항(suggestion) — 비어있지 않은 것만, 최근순(34번).
    var suggestions = filtered.filter(function (d) { return d.suggestion && d.suggestion.trim(); })
      .sort(function (a, b) { return (b._createdMs || 0) - (a._createdMs || 0); });
    els.suggestions.innerHTML = "";
    if (!suggestions.length) {
      els.suggestions.innerHTML = "<p class=\"empty-note\">건의사항이 없습니다.</p>";
    } else {
      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr><th>작성일</th><th>선택 언어</th><th>건의사항</th><th>작업</th></tr></thead>";
      var tbody = document.createElement("tbody");
      suggestions.forEach(function (d) {
        var tr = document.createElement("tr");
        var tdDate = document.createElement("td"); tdDate.textContent = fmtDateTime(d.createdAt); tr.appendChild(tdDate);
        var tdLang = document.createElement("td"); tdLang.textContent = LANG_LABEL[d.selectedLanguage] || d.selectedLanguage; tr.appendChild(tdLang);
        var tdText = document.createElement("td"); tdText.textContent = d.suggestion; tr.appendChild(tdText);
        var tdActions = document.createElement("td");
        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "삭제";
        delBtn.addEventListener("click", function () { deleteEntry(d.id, delBtn); });
        tdActions.appendChild(delBtn);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      els.suggestions.appendChild(table);
    }
  }

  function load() {
    var d = db();
    if (!d) return;
    els.totalCount.textContent = "불러오는 중...";
    d.collection("weekendBreakfastSurveys").orderBy("createdAt", "desc").limit(2000).get().then(function (snap) {
      allDocs = [];
      snap.forEach(function (doc) {
        var data = doc.data();
        data.id = doc.id;
        data._createdMs = (data.createdAt && typeof data.createdAt.toMillis === "function") ? data.createdAt.toMillis() : 0;
        allDocs.push(data);
      });
      render();
    }).catch(function () {
      els.totalCount.textContent = "불러오지 못했습니다(관리자 로그인이 필요할 수 있습니다).";
    });
  }

  function init() {
    els.totalCount = qs("weekendSurveyTotalCount");
    if (!els.totalCount) return; // 탭 마크업이 없으면(구버전) 아무 것도 하지 않음
    els.langFilter = qs("weekendSurveyLangFilter");
    els.langStats = qs("weekendSurveyLangStats");
    els.q1Stats = qs("weekendSurveyQ1Stats");
    els.q2Stats = qs("weekendSurveyQ2Stats");
    els.q3Stats = qs("weekendSurveyQ3Stats");
    els.q4Stats = qs("weekendSurveyQ4Stats");
    els.q4Other = qs("weekendSurveyQ4Other");
    els.q5Stats = qs("weekendSurveyQ5Stats");
    els.suggestions = qs("weekendSurveySuggestions");
    els.exportBtn = qs("weekendSurveyExportBtn");

    if (els.langFilter) els.langFilter.addEventListener("change", render);
    if (els.exportBtn) els.exportBtn.addEventListener("click", downloadResultsCsv);

    if (allDocs === null) load(); else render(); // 탭을 다시 열 때는 재조회하지 않고 캐시만 다시 그림
  }

  return { init: init };
})();

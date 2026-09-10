/* ==========================================================================
   관리자 페이지 - 유학생 커뮤니티 관리 (js/admin-community.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "커뮤니티" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 관리자 판정은 Firestore 보안 규칙(js/firebase-config.js 문서 참고)이
     하며, 이 화면은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을
     그대로 사용합니다. 그 계정의 communityUsers 문서 role이 'admin'이
     아니면 서버(Firestore 규칙)가 쓰기를 거부합니다 — 화면에서도 안내합니다.
   ========================================================================== */

var AdminCommunity = (function () {
  "use strict";

  var els = {};
  var currentTab = "stats";
  var currentPeriod = "today";

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function currentAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function fmtDate(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : (typeof ts === "string" ? new Date(ts) : null);
    if (!d || isNaN(d.getTime())) return "-";
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function periodStartDate(period) {
    var now = new Date();
    if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null; // 전체
  }

  function tsToDate(ts) {
    if (!ts) return null;
    if (typeof ts.toDate === "function") return ts.toDate();
    if (typeof ts === "string") return new Date(ts);
    return null;
  }

  /* ---------------- 탭 전환 ---------------- */

  function showTab(tab) {
    currentTab = tab;
    Object.keys(els.subTabs).forEach(function (key) {
      els.subTabs[key].classList.toggle("active", key === tab);
    });
    Object.keys(els.subPages).forEach(function (key) {
      els.subPages[key].hidden = key !== tab;
    });
    if (tab === "stats") loadStats();
    else if (tab === "posts") loadPosts();
    else if (tab === "users") loadUsers();
    else if (tab === "translations") loadTranslations();
  }

  /* ---------------- 통계 ---------------- */

  function loadStats() {
    var d = db();
    var body = els.statsBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    Promise.all([
      d.collection("communityUsers").get(),
      d.collection("communityPosts").get()
    ]).then(function (results) {
      var users = [];
      results[0].forEach(function (doc) { users.push(doc.data()); });
      var posts = [];
      results[1].forEach(function (doc) { posts.push(doc.data()); });

      var start = periodStartDate(currentPeriod);
      function inPeriod(ts) {
        if (!start) return true;
        var d2 = tsToDate(ts);
        return d2 && d2 >= start;
      }

      var newUsers = users.filter(function (u) { return inPeriod(u.createdAt); }).length;
      var newPosts = posts.filter(function (p) { return inPeriod(p.createdAt); }).length;
      var byCategory = {};
      COMMUNITY_CATEGORY_ORDER.forEach(function (c) { byCategory[c] = 0; });
      posts.filter(function (p) { return inPeriod(p.createdAt); }).forEach(function (p) {
        if (byCategory[p.category] !== undefined) byCategory[p.category]++;
      });
      var reportedCount = posts.filter(function (p) { return (p.reportCount || 0) > 0; }).length;
      var hiddenCount = posts.filter(function (p) { return p.status === "hidden"; }).length;
      var failedTranslations = posts.filter(function (p) { return p.translationStatus === "failed"; }).length;
      var marketDone = posts.filter(function (p) { return p.category === "market" && p.dealStatus === "done"; }).length;
      var helpResolved = posts.filter(function (p) { return p.category === "help" && p.helpStatus === "resolved"; }).length;

      var natCount = {};
      users.forEach(function (u) { var n = u.nationality || "-"; natCount[n] = (natCount[n] || 0) + 1; });
      var langCount = {};
      users.forEach(function (u) { var l = u.preferredLanguage || "-"; langCount[l] = (langCount[l] || 0) + 1; });

      body.innerHTML = "";
      var tiles = [
        ["신규 가입자", newUsers], ["전체 회원", users.length], ["신규 게시글", newPosts],
        ["신고된 게시글", reportedCount], ["숨김 처리됨", hiddenCount], ["번역 실패", failedTranslations],
        ["중고거래 완료", marketDone], ["도움요청 해결", helpResolved]
      ];
      var grid = document.createElement("div");
      grid.className = "stat-grid";
      tiles.forEach(function (t) {
        var box = document.createElement("div");
        box.className = "stat-box";
        box.innerHTML = "<p class=\"stat-label\"></p><p class=\"stat-value\"></p>";
        box.querySelector(".stat-label").textContent = t[0];
        box.querySelector(".stat-value").textContent = t[1];
        grid.appendChild(box);
      });
      body.appendChild(grid);

      var catTitle = document.createElement("h3");
      catTitle.textContent = "카테고리별 게시글 수(선택 기간)";
      body.appendChild(catTitle);
      var catList = document.createElement("div");
      catList.className = "dist-list";
      COMMUNITY_CATEGORY_ORDER.forEach(function (c) {
        var row = document.createElement("div");
        row.className = "dist-row";
        row.textContent = (COMMUNITY_CATEGORIES[c] ? COMMUNITY_CATEGORIES[c].ko : c) + ": " + byCategory[c];
        catList.appendChild(row);
      });
      body.appendChild(catList);

      var natTitle = document.createElement("h3");
      natTitle.textContent = "국적별 회원 수";
      body.appendChild(natTitle);
      var natList = document.createElement("div");
      natList.className = "dist-list";
      Object.keys(natCount).sort(function (a, b) { return natCount[b] - natCount[a]; }).forEach(function (n) {
        var row = document.createElement("div");
        row.className = "dist-row";
        row.textContent = n + ": " + natCount[n];
        natList.appendChild(row);
      });
      body.appendChild(natList);

      var langTitle = document.createElement("h3");
      langTitle.textContent = "선택 언어별 회원 수";
      body.appendChild(langTitle);
      var langList = document.createElement("div");
      langList.className = "dist-list";
      Object.keys(langCount).forEach(function (l) {
        var row = document.createElement("div");
        row.className = "dist-row";
        row.textContent = l + ": " + langCount[l];
        langList.appendChild(row);
      });
      body.appendChild(langList);
    }).catch(function (err) {
      body.innerHTML = "<p class=\"empty-note\">불러오기 실패: " + (err && err.message ? err.message : "오류") + "</p>";
    });
  }

  /* ---------------- 게시글 관리 ---------------- */

  function loadPosts() {
    var d = db();
    var body = els.postsBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("communityPosts").orderBy("createdAt", "desc").limit(200).get().then(function (snap) {
      body.innerHTML = "";
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">게시글이 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr><th>카테고리</th><th>제목</th><th>작성자</th><th>상태</th><th>신고</th><th>등록일</th><th>작업</th></tr></thead>";
      var tbody = document.createElement("tbody");
      snap.forEach(function (doc) {
        var p = doc.data();
        var tr = document.createElement("tr");

        var tdCat = document.createElement("td");
        tdCat.textContent = (COMMUNITY_CATEGORIES[p.category] ? COMMUNITY_CATEGORIES[p.category].ko : p.category);
        tr.appendChild(tdCat);

        var tdTitle = document.createElement("td");
        tdTitle.textContent = p.originalTitle || "";
        tr.appendChild(tdTitle);

        var tdAuthor = document.createElement("td");
        tdAuthor.textContent = p.authorNameMasked || "";
        tr.appendChild(tdAuthor);

        var tdStatus = document.createElement("td");
        tdStatus.textContent = p.status || "";
        tr.appendChild(tdStatus);

        var tdReport = document.createElement("td");
        tdReport.textContent = String(p.reportCount || 0);
        tr.appendChild(tdReport);

        var tdDate = document.createElement("td");
        tdDate.textContent = fmtDate(p.createdAt);
        tr.appendChild(tdDate);

        var tdActions = document.createElement("td");
        var showBtn = document.createElement("button");
        showBtn.type = "button";
        showBtn.textContent = "다시 공개";
        showBtn.addEventListener("click", function () { updatePostStatus(doc.id, "visible", showBtn); });
        tdActions.appendChild(showBtn);

        var hideBtn = document.createElement("button");
        hideBtn.type = "button";
        hideBtn.textContent = "숨김";
        hideBtn.addEventListener("click", function () { updatePostStatus(doc.id, "hidden", hideBtn); });
        tdActions.appendChild(hideBtn);

        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "삭제";
        delBtn.addEventListener("click", function () {
          if (!window.confirm("정말 삭제하시겠습니까?")) return;
          updatePostStatus(doc.id, "deleted", delBtn);
        });
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    }).catch(function (err) {
      body.innerHTML = "<p class=\"empty-note\">불러오기 실패: " + (err && err.message ? err.message : "오류") + "</p>";
    });
  }

  function updatePostStatus(postId, status, btn) {
    var d = db();
    if (!d) return;
    btn.disabled = true;
    d.collection("communityPosts").doc(postId).update({ status: status }).then(function () {
      loadPosts();
    }).catch(function (err) {
      window.alert("변경 실패(관리자 권한이 없을 수 있습니다): " + (err && err.message ? err.message : "오류"));
      btn.disabled = false;
    });
  }

  /* ---------------- 회원 관리 ---------------- */

  function loadUsers() {
    var d = db();
    var body = els.usersBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("communityUsers").orderBy("createdAt", "desc").limit(200).get().then(function (snap) {
      body.innerHTML = "";
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">회원이 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr><th>가입일</th><th>이름</th><th>국적</th><th>이메일</th><th>언어</th><th>인증</th><th>상태</th><th>작업</th></tr></thead>";
      var tbody = document.createElement("tbody");
      snap.forEach(function (doc) {
        var u = doc.data();
        var tr = document.createElement("tr");
        [fmtDate(u.createdAt), u.name || "", u.nationality || "", u.email || "", u.preferredLanguage || "",
          (u.emailVerified ? "완료" : "미완료"), u.status || ""].forEach(function (v) {
          var td = document.createElement("td");
          td.textContent = v;
          tr.appendChild(td);
        });

        var tdActions = document.createElement("td");
        var suspendBtn = document.createElement("button");
        suspendBtn.type = "button";
        suspendBtn.textContent = "이용 정지";
        suspendBtn.addEventListener("click", function () { updateUserStatus(doc.id, "suspended", suspendBtn); });
        tdActions.appendChild(suspendBtn);

        var restoreBtn = document.createElement("button");
        restoreBtn.type = "button";
        restoreBtn.textContent = "정지 해제";
        restoreBtn.addEventListener("click", function () { updateUserStatus(doc.id, "active", restoreBtn); });
        tdActions.appendChild(restoreBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    }).catch(function (err) {
      body.innerHTML = "<p class=\"empty-note\">불러오기 실패: " + (err && err.message ? err.message : "오류") + "</p>";
    });
  }

  function updateUserStatus(uid, status, btn) {
    var d = db();
    if (!d) return;
    btn.disabled = true;
    d.collection("communityUsers").doc(uid).update({ status: status }).then(function () {
      loadUsers();
    }).catch(function (err) {
      window.alert("변경 실패(관리자 권한이 없을 수 있습니다): " + (err && err.message ? err.message : "오류"));
      btn.disabled = false;
    });
  }

  /* ---------------- 번역 관리 ---------------- */

  function loadTranslations() {
    var d = db();
    var body = els.translationsBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("communityPosts").where("translationStatus", "==", "failed").limit(100).get().then(function (snap) {
      body.innerHTML = "";
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">번역 실패한 게시글이 없습니다.</p>"; return; }

      snap.forEach(function (doc) {
        var p = doc.data();
        var card = document.createElement("div");
        card.className = "admin-card";
        var title = document.createElement("h3");
        title.textContent = "[" + (COMMUNITY_CATEGORIES[p.category] ? COMMUNITY_CATEGORIES[p.category].ko : p.category) + "] " + p.originalTitle;
        card.appendChild(title);
        var meta = document.createElement("p");
        meta.className = "empty-note";
        meta.textContent = "원문 언어: " + p.originalLanguage + " · 번역 상태: 번역 실패";
        card.appendChild(meta);

        var retryBtn = document.createElement("button");
        retryBtn.type = "button";
        retryBtn.className = "filter-apply-btn";
        retryBtn.textContent = "이 게시글 다시 번역";
        retryBtn.addEventListener("click", function () { retryTranslation(doc.id, p, retryBtn); });
        card.appendChild(retryBtn);

        body.appendChild(card);
      });
    }).catch(function (err) {
      body.innerHTML = "<p class=\"empty-note\">불러오기 실패: " + (err && err.message ? err.message : "오류") + "</p>";
    });
  }

  function retryTranslation(postId, post, btn) {
    var user = currentAdminUser();
    if (!user) { window.alert("먼저 관리자 계정으로 로그인해주세요."); return; }
    btn.disabled = true;
    btn.textContent = "번역 중...";
    var targets = ["ko", "zh", "vi", "en", "mn"].filter(function (l) { return l !== post.originalLanguage; });
    user.getIdToken().then(function (idToken) {
      return fetch("/.netlify/functions/community-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translatePost", idToken: idToken, originalLanguage: post.originalLanguage,
          title: post.originalTitle, content: post.originalContent, targetLanguages: targets
        })
      });
    }).then(function (res) { return res.json(); }).then(function (data) {
      var update = { translations: data.translations || {} };
      update.translationStatus = (data.failedLanguages && data.failedLanguages.length) ? "failed" : "done";
      return db().collection("communityPosts").doc(postId).update(update);
    }).then(function () {
      loadTranslations();
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = "이 게시글 다시 번역";
      window.alert("재번역에 실패했습니다. 잠시 후 다시 시도해주세요.");
    });
  }

  /* ---------------- 초기화 ---------------- */

  function init() {
    els.subTabs = {
      stats: qs("commAdminTabStats"), posts: qs("commAdminTabPosts"),
      users: qs("commAdminTabUsers"), translations: qs("commAdminTabTranslations")
    };
    els.subPages = {
      stats: qs("commAdminPageStats"), posts: qs("commAdminPagePosts"),
      users: qs("commAdminPageUsers"), translations: qs("commAdminPageTranslations")
    };
    if (!els.subTabs.stats) return; // 커뮤니티 관리 탭 마크업이 없으면(구버전) 아무 것도 하지 않음

    els.statsBody = qs("commAdminStatsBody");
    els.postsBody = qs("commAdminPostsBody");
    els.usersBody = qs("commAdminUsersBody");
    els.translationsBody = qs("commAdminTranslationsBody");

    Object.keys(els.subTabs).forEach(function (key) {
      els.subTabs[key].addEventListener("click", function () { showTab(key); });
    });

    var periodBar = qs("commAdminStatsPeriodBar");
    if (periodBar) {
      Array.prototype.forEach.call(periodBar.querySelectorAll("button"), function (btn) {
        btn.addEventListener("click", function () {
          Array.prototype.forEach.call(periodBar.querySelectorAll("button"), function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          currentPeriod = btn.getAttribute("data-period");
          loadStats();
        });
      });
    }

    showTab("stats");
  }

  return { init: init, refresh: function () { showTab(currentTab); } };
})();

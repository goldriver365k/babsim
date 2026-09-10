/* ==========================================================================
   모인관(인제대학교) app.js
   - 매장 선택 / 언어 선택 / 메뉴 그룹 이전·다음 / 천원의 아침밥 모달
   - 외부 라이브러리 없이 순수 JavaScript로 동작합니다.
   ========================================================================== */

(function () {
  "use strict";

  var STORE_ORDER = ["bapsim", "mangwon", "hururuk"];
  var LANG_KEY = "foodhall_lang";
  var SUPPORTED_LANGS = ["ko", "zh", "vi", "en", "mn", "bn", "my"];

  var state = {
    store: "bapsim",
    bapsimView: "breakfast",
    groupByStore: { bapsim: 1, mangwon: 1, hururuk: 1 },
    lang: "ko",
    view: "home" // "home"(모바일 UI 개선 4단계: 새 홈 화면) | "store"(기존 매장 화면)
  };

  var els = {};

  function qs(id) { return document.getElementById(id); }

  function formatPrice(price, lang) {
    if (price === null || typeof price === "undefined") {
      return { text: UI_TEXT.priceTBD[lang] || UI_TEXT.priceTBD.ko, tbd: true };
    }
    var withComma = price.toLocaleString("ko-KR");
    return { text: withComma + UI_TEXT.won[lang], tbd: false };
  }

  function getGroupsForStore(store) {
    var groups = {};
    MENU_DATA.forEach(function (item) {
      if (item.store === store) groups[item.group] = true;
    });
    return Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
  }

  function getItems(store, group) {
    return MENU_DATA
      .filter(function (item) { return item.store === store && item.group === group; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function buildCard(item) {
    var card = document.createElement("div");
    card.className = "menu-card";

    var imgWrap = document.createElement("div");
    imgWrap.className = "card-image-wrap";

    if (item.image) {
      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name.ko;
      img.loading = "lazy";
      img.onerror = function () {
        if (imgWrap.dataset.fallbackApplied) return;
        imgWrap.dataset.fallbackApplied = "1";
        imgWrap.innerHTML = "";
        var pending = document.createElement("span");
        pending.className = "image-pending";
        pending.textContent = UI_TEXT.imagePending[state.lang] || UI_TEXT.imagePending.ko;
        imgWrap.appendChild(pending);
      };
      imgWrap.appendChild(img);
    } else {
      var pendingEl = document.createElement("span");
      pendingEl.className = "image-pending";
      pendingEl.textContent = UI_TEXT.imagePending[state.lang] || UI_TEXT.imagePending.ko;
      imgWrap.appendChild(pendingEl);
    }

    if (item.soldOut) {
      var badge = document.createElement("span");
      badge.className = "sold-out-badge";
      badge.textContent = UI_TEXT.soldOut[state.lang] || UI_TEXT.soldOut.ko;
      imgWrap.appendChild(badge);
    }

    card.appendChild(imgWrap);

    var body = document.createElement("div");
    body.className = "card-body";

    var names = document.createElement("div");
    names.className = "card-names";

    var koName = document.createElement("p");
    koName.className = "card-name-ko";
    koName.textContent = item.name.ko;
    names.appendChild(koName);

    if (state.lang !== "ko") {
      var translated = document.createElement("p");
      translated.className = "card-name-translated";
      translated.textContent = item.name[state.lang] || "";
      names.appendChild(translated);
    }

    body.appendChild(names);

    var priceInfo = formatPrice(item.price, state.lang);
    var priceEl = document.createElement("p");
    priceEl.className = "card-price" + (priceInfo.tbd ? " tbd" : "");
    priceEl.textContent = priceInfo.text;
    body.appendChild(priceEl);

    card.appendChild(body);

    return card;
  }

  function renderGrid() {
    var grid = els.menuGrid;
    grid.innerHTML = "";
    var items = getItems(state.store, state.groupByStore[state.store]);
    var frag = document.createDocumentFragment();
    items.forEach(function (item) { frag.appendChild(buildCard(item)); });
    grid.appendChild(frag);
  }

  function renderGroupNav() {
    var groups = getGroupsForStore(state.store);
    if (groups.length <= 1) {
      els.groupNav.hidden = true;
      return;
    }
    els.groupNav.hidden = false;
    var current = state.groupByStore[state.store];
    els.prevBtn.disabled = current <= groups[0];
    els.nextBtn.disabled = current >= groups[groups.length - 1];
    els.groupIndicator.textContent = current + " / " + groups.length;
  }

  function renderHeader() {
    els.siteTitle.textContent = UI_TEXT.siteTitle[state.lang];
    document.title = UI_TEXT.siteTitle[state.lang];

    STORE_ORDER.forEach(function (store) {
      var btn = els.storeTabButtons[store];
      var info = UI_TEXT.storeNames[store];
      btn.innerHTML = "";

      var brandEl = document.createElement("span");
      brandEl.className = "store-tab-brand";
      brandEl.textContent = info.brand;
      btn.appendChild(brandEl);

      var floorEl = document.createElement("span");
      floorEl.className = "store-tab-floor";
      floorEl.textContent = info.floor[state.lang];
      btn.appendChild(floorEl);

      if (state.lang !== "ko") {
        var pronEl = document.createElement("span");
        pronEl.className = "store-tab-pronunciation";
        pronEl.textContent = info.pronunciation[state.lang];
        btn.appendChild(pronEl);
      }

      btn.classList.toggle("active", store === state.store);
      btn.setAttribute("aria-pressed", store === state.store ? "true" : "false");
    });

    SUPPORTED_LANGS.forEach(function (lang) {
      var btn = els.langButtons[lang];
      btn.classList.toggle("active", lang === state.lang);
      btn.setAttribute("aria-pressed", lang === state.lang ? "true" : "false");
    });
    if (els.langToggleLabel && els.langButtons[state.lang]) {
      els.langToggleLabel.textContent = els.langButtons[state.lang].textContent;
    }

    els.storeHeading.textContent = UI_TEXT.storeHeading[state.store][state.lang];
    els.prevBtn.textContent = UI_TEXT.prevButton[state.lang];
    els.nextBtn.textContent = UI_TEXT.nextButton[state.lang];
  }

  function renderAll() {
    try {
      renderHeader();
      renderBapsimSubtabs();
      renderColaBanner();
      renderOwnerChat();
      renderHelloKorean();
      renderGrid();
      renderGroupNav();
      updateBapsimViewVisibility();
      if (state.store === "bapsim" && state.bapsimView === "breakfast") renderBreakfastArea();
      els.fallbackMsg.hidden = true;
    } catch (err) {
      console.error("메뉴 렌더링 오류:", err);
      els.menuGrid.innerHTML = "";
      els.fallbackMsg.hidden = false;
      els.fallbackMsg.textContent = UI_TEXT.loadError[state.lang] || UI_TEXT.loadError.ko;
    }
  }

  function setStore(store) {
    if (state.store === store) return;
    state.store = store;
    state.bapsimView = "breakfast";
    renderAll();
  }

  /* ---------------- 모바일 UI 개선 4단계: 홈 화면 ---------------- */

  // 홈 화면(#homeView) ↔ 매장 화면(main) 중 지금 state.view에 맞는 쪽만
  // 보여줍니다. 커뮤니티 화면(js/community.js)은 이 둘과 서로 배타적이며,
  // 커뮤니티에서 빠져나올 때 community.js가 이 함수를 호출해 무엇을
  // 다시 보여줄지 물어봅니다(window.AppHome.applyView).
  function applyViewVisibility() {
    var showHomeView = state.view === "home";
    if (els.homeView) els.homeView.hidden = !showHomeView;
    // 모바일 UI 개선 8단계: 하단 내비게이션은 화면과 무관하게 항상
    // 고정 표시됩니다(홈에서만 보이던 이전 동작을 폐지).
    if (els.bottomNavHomeBtn) els.bottomNavHomeBtn.classList.toggle("active", showHomeView);
    var main = document.querySelector("main");
    if (main) main.hidden = showHomeView;
  }

  function goHome() {
    state.view = "home";
    if (window.Community && window.Community.isCommunityPath(location.pathname)) {
      window.Community.navigate("/"); // 커뮤니티 안에 있었다면 빠져나옵니다(빠져나오며 applyViewVisibility 재호출됨)
    } else {
      applyViewVisibility();
    }
    renderHome();
  }

  function goToStore(store) {
    state.view = "store";
    if (state.store !== store) setStore(store); else renderAll();
    if (window.Community && window.Community.isCommunityPath(location.pathname)) {
      window.Community.navigate("/");
    } else {
      applyViewVisibility();
    }
  }

  function renderHomeLatestPosts() {
    if (!els.homeCommunityLatest) return;
    if (!(window.Community && typeof window.Community.fetchLatestPosts === "function")) return;
    var container = els.homeCommunityLatest;
    var requestLang = state.lang;
    window.Community.fetchLatestPosts(3).then(function (posts) {
      if (state.lang !== requestLang) return; // 응답 오는 사이 언어가 바뀌었으면 버립니다
      container.innerHTML = "";
      if (!posts.length) {
        var empty = document.createElement("p");
        empty.className = "home-community-empty";
        empty.textContent = UI_TEXT.homeCommunityLatestEmpty[state.lang];
        container.appendChild(empty);
        return;
      }
      posts.forEach(function (post) {
        var card = document.createElement("button");
        card.type = "button";
        card.className = "home-community-post-card";
        card.addEventListener("click", function () {
          if (window.Community && typeof window.Community.navigate === "function") {
            window.Community.navigate(window.Community.routePrefix + "/post/" + post.id);
          }
        });
        var title = document.createElement("p");
        title.className = "home-community-post-title";
        title.textContent = post.title;
        card.appendChild(title);
        var meta = document.createElement("p");
        meta.className = "home-community-post-meta";
        meta.textContent = [post.authorMasked, post.nationality, post.dateText].filter(Boolean).join(" · ");
        card.appendChild(meta);
        container.appendChild(card);
      });
    }).catch(function () { /* 홈 화면 미리보기는 실패해도 조용히 무시(핵심 기능 아님) */ });
  }

  function renderHome() {
    if (!els.homeView) return;
    if (els.homeHeroTagline) els.homeHeroTagline.textContent = UI_TEXT.homeHeroTagline[state.lang];
    if (els.homeServicesTitle) els.homeServicesTitle.textContent = UI_TEXT.homeServicesTitle[state.lang];
    if (els.homeCommunityLatestTitle) els.homeCommunityLatestTitle.textContent = UI_TEXT.homeCommunityLatestTitle[state.lang];
    if (els.homeCardCommunityName && window.COMMUNITY_HOME) {
      els.homeCardCommunityName.textContent = window.COMMUNITY_HOME.title[state.lang];
    }
    var moinPrefix = { ko: "모인관 ", en: "Moin-gwan ", zh: "摩茵馆 ", vi: "Moin-gwan ", mn: "Моин-гван ", bn: "মোইন-গোয়ান ", my: "မိုအင်ဂွမ် " };
    // 천원의 아침밥 카드 — 새 화면이 아니라 밥심 내부 화면을 그대로
    // 재사용하므로(위치도 밥심과 동일), 기존 BREAKFAST_INFO.title 문구를
    // 그대로 씁니다(새 번역 없음).
    if (els.homeCardBreakfastName) els.homeCardBreakfastName.textContent = BREAKFAST_INFO.title[state.lang];
    if (els.homeCardBreakfastLoc) els.homeCardBreakfastLoc.textContent = (moinPrefix[state.lang] || moinPrefix.ko) + UI_TEXT.storeNames.bapsim.floor[state.lang];
    if (els.homeCardBapsimLoc) els.homeCardBapsimLoc.textContent = (moinPrefix[state.lang] || moinPrefix.ko) + UI_TEXT.storeNames.bapsim.floor[state.lang];
    if (els.homeCardMangwonLoc) els.homeCardMangwonLoc.textContent = (moinPrefix[state.lang] || moinPrefix.ko) + UI_TEXT.storeNames.mangwon.floor[state.lang];
    if (els.homeCardHururukLoc) els.homeCardHururukLoc.textContent = (moinPrefix[state.lang] || moinPrefix.ko) + UI_TEXT.storeNames.hururuk.floor[state.lang];
    if (els.bottomNavHomeLabel) els.bottomNavHomeLabel.textContent = UI_TEXT.bottomNavHome[state.lang];
    if (els.bottomNavSearchLabel) els.bottomNavSearchLabel.textContent = UI_TEXT.bottomNavSearch[state.lang];
    // "글쓰기"는 이미 있는 COMMUNITY_POST.writeTitle을 그대로 재사용합니다(새 키 없음).
    if (els.bottomNavWriteLabel && window.COMMUNITY_POST) els.bottomNavWriteLabel.textContent = window.COMMUNITY_POST.writeTitle[state.lang];
    if (els.bottomNavNotifyLabel) els.bottomNavNotifyLabel.textContent = UI_TEXT.bottomNavNotify[state.lang];
    renderHomeLatestPosts();
  }

  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1 || state.lang === lang) return;
    state.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* localStorage 미지원 시 무시 */ }
    renderAll();
    renderHome();
    if (!els.colaDetailOverlay.hidden) renderColaDetail();
    if (!els.staffShowOverlay.hidden) renderStaffShow();
    if (els.breakfastPopupOverlay && !els.breakfastPopupOverlay.hidden) openBreakfastPopup(); // 열려 있으면 문구만 새 언어로 갱신
    if (window.LanguageStats && typeof window.LanguageStats.record === "function") {
      window.LanguageStats.record(lang);
    }
    if (window.PwaManager && typeof window.PwaManager.setLang === "function") {
      window.PwaManager.setLang(lang);
    }
    if (window.Community && typeof window.Community.setLang === "function") {
      window.Community.setLang(lang);
    }
  }

  function openLangMenu() {
    if (!els.langSelect || !els.langToggleBtn) return;
    els.langSelect.hidden = false;
    els.langToggleBtn.setAttribute("aria-expanded", "true");
  }

  function closeLangMenu() {
    if (!els.langSelect || !els.langToggleBtn) return;
    els.langSelect.hidden = true;
    els.langToggleBtn.setAttribute("aria-expanded", "false");
  }

  function changeGroup(delta) {
    var groups = getGroupsForStore(state.store);
    var current = state.groupByStore[state.store];
    var idx = groups.indexOf(current);
    var nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= groups.length) return;
    state.groupByStore[state.store] = groups[nextIdx];
    renderGrid();
    renderGroupNav();
  }

  /* ---------------- 날짜 계산 (Asia/Seoul 기준) ---------------- */

  var SEOUL_TZ = "Asia/Seoul";
  var DATE_LOCALE_MAP = { ko: "ko-KR", en: "en-US", zh: "zh-CN", vi: "vi-VN", mn: "mn-MN", bn: "bn-BD", my: "my-MM" };

  function seoulInstant(offsetDays) {
    return new Date(Date.now() + (offsetDays || 0) * 24 * 60 * 60 * 1000);
  }

  function getSeoulDateKey(offsetDays) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: SEOUL_TZ, year: "numeric", month: "2-digit", day: "2-digit"
    }).format(seoulInstant(offsetDays));
  }

  function isSeoulWeekend(offsetDays) {
    var weekday = new Intl.DateTimeFormat("en-US", { timeZone: SEOUL_TZ, weekday: "long" }).format(seoulInstant(offsetDays));
    return weekday === "Saturday" || weekday === "Sunday";
  }

  function formatSeoulDateDisplay(lang, offsetDays) {
    var locale = DATE_LOCALE_MAP[lang] || "ko-KR";
    var opts = { timeZone: SEOUL_TZ, month: "long", day: "numeric", weekday: "long" };
    try {
      return new Intl.DateTimeFormat(locale, opts).format(seoulInstant(offsetDays));
    } catch (e) {
      return new Intl.DateTimeFormat("ko-KR", opts).format(seoulInstant(offsetDays));
    }
  }

  /* ---------------- 밥심 서브탭 (일반 메뉴 / 천원의 아침밥) ---------------- */

  function renderBapsimSubtabs() {
    var show = state.store === "bapsim";
    els.bapsimSubtabs.hidden = !show;
    if (!show) return;

    var lang = state.lang;
    els.bapsimTabMenu.textContent = BREAKFAST_INFO.tabLabel[lang];
    els.bapsimTabBreakfast.textContent = BREAKFAST_INFO.title[lang];

    els.bapsimTabMenu.classList.toggle("active", state.bapsimView === "menu");
    els.bapsimTabMenu.setAttribute("aria-pressed", state.bapsimView === "menu" ? "true" : "false");
    els.bapsimTabBreakfast.classList.toggle("active", state.bapsimView === "breakfast");
    els.bapsimTabBreakfast.setAttribute("aria-pressed", state.bapsimView === "breakfast" ? "true" : "false");
  }

  function setBapsimView(view) {
    if (state.bapsimView === view) return;
    state.bapsimView = view;
    renderBapsimSubtabs();
    updateBapsimViewVisibility();
    if (view === "breakfast") renderBreakfastArea();
  }

  function updateBapsimViewVisibility() {
    var showBreakfast = state.store === "bapsim" && state.bapsimView === "breakfast";
    els.breakfastArea.hidden = !showBreakfast;
    els.menuGrid.hidden = showBreakfast;
    els.groupNav.hidden = showBreakfast || getGroupsForStore(state.store).length <= 1;
  }

  /* ---------------- 천원의 아침밥 전용 영역 (오늘·내일) ---------------- */

  /* 그 날짜에 관리자가 등록한(또는 정적 파일의) 글자 메뉴 데이터가 있는지 */
  function dayHasDirectData(day) {
    if (!day) return false;
    if (day.regular && day.regular.length) return true;
    if (day.simple && day.simple.length) return true;
    if (day.items && day.items.length) return true;
    return !!(day.rice || day.soup || day.main || day.side1 || day.side2 || day.kimchi);
  }

  function renderMealList(listEl, lang, offsetDays, closedText) {
    var dateKey = getSeoulDateKey(offsetDays);
    var day = BREAKFAST_WEEKLY_MENU && BREAKFAST_WEEKLY_MENU.days ? BREAKFAST_WEEKLY_MENU.days[dateKey] : null;

    listEl.innerHTML = "";

    function showMessage(className, text) {
      var p = document.createElement("p");
      p.className = className;
      p.textContent = text;
      listEl.appendChild(p);
    }

    if (isSeoulWeekend(offsetDays)) {
      showMessage("today-meal-closed", closedText);
      return;
    }

    // 관리자가 명시적으로 휴무로 등록한 날(isOpen: false)
    if (day && day.isOpen === false) {
      showMessage("today-meal-closed", closedText);
      return;
    }

    if (!dayHasDirectData(day)) {
      // 운영일이지만 아직 메뉴가 등록되지 않은 상태 — 주간표 스크린샷은
      // 오늘·내일 칸에 넣지 않고, "메뉴를 준비 중입니다"로만 안내합니다.
      var preparingMsg = BREAKFAST_INFO.menuPreparingMessage
        ? (BREAKFAST_INFO.menuPreparingMessage[lang] || BREAKFAST_INFO.menuPreparingMessage.ko)
        : closedText;
      showMessage("today-meal-preparing", preparingMsg);
      return;
    }

    var anyLine = false;

    function appendItemLine(container, item) {
      var text = typeof item === "string" ? item : (item && (item[lang] || item.ko));
      if (!text) return;
      anyLine = true;
      var li = document.createElement("li");
      li.textContent = text;
      container.appendChild(li);
    }

    if ((day.regular && day.regular.length) || (day.simple && day.simple.length)) {
      // 관리자 페이지 "주간메뉴 관리 → 직접 입력"으로 등록된 데이터
      // (일반식 / 간편식 두 갈래, 요일별 고정 항목이 아닌 자유 목록 형태)
      ["regular", "simple"].forEach(function (typeKey) {
        var list = day[typeKey];
        if (!list || !list.length) return;

        var groupLi = document.createElement("li");
        groupLi.className = "ba-meal-group";

        var titleEl = document.createElement("span");
        titleEl.className = "ba-meal-group-title";
        var labelInfo = BREAKFAST_INFO.mealFieldLabels[typeKey];
        titleEl.textContent = labelInfo ? (labelInfo[lang] || labelInfo.ko) : typeKey;
        groupLi.appendChild(titleEl);

        var subUl = document.createElement("ul");
        subUl.className = "ba-meal-subgroup";
        list.forEach(function (item) { appendItemLine(subUl, item); });
        groupLi.appendChild(subUl);

        listEl.appendChild(groupLi);
      });
    } else if (day.items && day.items.length) {
      // 과거 저장 방식(일반식/간편식 구분 없는 단일 목록) 하위 호환
      day.items.forEach(function (item) { appendItemLine(listEl, item); });
    } else {
      var order = ["rice", "soup", "main", "side1", "side2", "kimchi"];
      order.forEach(function (key) { appendItemLine(listEl, day[key]); });
    }

    if (!anyLine) {
      var closedP2 = document.createElement("p");
      closedP2.className = "today-meal-closed";
      closedP2.textContent = closedText;
      listEl.appendChild(closedP2);
    }
  }

  function renderBreakfastArea() {
    if (state.store !== "bapsim" || state.bapsimView !== "breakfast") return;
    var lang = state.lang;
    var info = BREAKFAST_INFO;
    var labels = info.fieldLabels;

    els.baTitle.textContent = info.title[lang];
    els.baPriceValue.textContent = info.price[lang];

    els.baTodayMenuTitle.textContent = info.todayMenuTitle[lang];
    els.baTodayDateValue.textContent = formatSeoulDateDisplay(lang, 0);
    renderMealList(els.todayMealList, lang, 0, info.todayClosedMessage[lang] || info.todayClosedMessage.ko);
    renderBreakfastRating(lang);

    els.baTomorrowMenuTitle.textContent = info.tomorrowMenuTitle[lang];
    els.baTomorrowDateValue.textContent = formatSeoulDateDisplay(lang, 1);
    renderMealList(els.tomorrowMealList, lang, 1, info.tomorrowClosedMessage[lang] || info.tomorrowClosedMessage.ko);

    els.baHoursLabel.textContent = labels.hours[lang];
    els.baHoursValue.textContent = info.hours[lang];

    els.baEligLabel.textContent = labels.eligibility[lang];
    els.baEligList.innerHTML = "";
    info.eligibility[lang].forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      els.baEligList.appendChild(li);
    });

    els.baStepsLabel.textContent = labels.steps[lang];
    els.baStepsList.innerHTML = "";
    info.steps[lang].forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      els.baStepsList.appendChild(li);
    });
  }

  /* "오늘의 메뉴 평가" 위젯 연동 (js/breakfast-rating.js, 선택적 모듈) */
  // 오늘 아침 메뉴가 실제로 있는지(주말/휴무/데이터 없음이면 false) —
  // 아침밥 평가 영역과 6단계의 평가 팝업이 같은 판단 기준을 씁니다.
  function todayBreakfastDay() {
    var dateKey = getSeoulDateKey(0);
    return BREAKFAST_WEEKLY_MENU && BREAKFAST_WEEKLY_MENU.days ? BREAKFAST_WEEKLY_MENU.days[dateKey] : null;
  }

  function hasTodayBreakfastMenu() {
    var day = todayBreakfastDay();
    var isExplicitlyClosed = !!(day && day.isOpen === false);
    return !isSeoulWeekend(0) && !isExplicitlyClosed && dayHasDirectData(day);
  }

  function renderBreakfastRating(lang) {
    if (!window.BreakfastRating || typeof window.BreakfastRating.render !== "function") return;
    var dateKey = getSeoulDateKey(0);
    var day = todayBreakfastDay();
    var hasTodayMenu = hasTodayBreakfastMenu();

    var menuText = "";
    var menuNames = [];
    var mealType = "regular";
    if (hasTodayMenu) {
      var firstList = null;
      if (day.regular && day.regular.length) {
        firstList = day.regular;
        mealType = "regular";
      } else if (day.simple && day.simple.length) {
        firstList = day.simple;
        mealType = "simple";
      } else if (day.items && day.items.length) {
        firstList = day.items;
      }
      if (firstList) {
        menuNames = firstList.map(function (item) { return typeof item === "string" ? item : (item && item.ko) || ""; }).filter(Boolean);
        menuText = menuNames[0] || "";
      } else if (day.main) {
        menuText = day.main.ko;
        menuNames = [menuText];
      }
    }
    window.BreakfastRating.render(lang, hasTodayMenu, dateKey, menuText, menuNames, mealType);
  }

  /* ---------------- 모바일 UI 개선 6단계: 당일 첫 방문 평가 팝업 ----------------
     Firebase read/write 없이 localStorage만 사용합니다(비용 최소화 지시).
     같은 기기/브라우저에서 하루(KST 기준) 최초 방문에만 1회 표시하고,
     이미 오늘 평가를 마친 경우에도 다시 표시하지 않습니다(기존
     BreakfastRating 모듈의 저장값을 그대로 재사용 — 새 평가 시스템 없음). */
  var BREAKFAST_POPUP_KEY = "breakfastRatingPopupDate";

  function markBreakfastPopupShownToday() {
    try { localStorage.setItem(BREAKFAST_POPUP_KEY, getSeoulDateKey(0)); } catch (e) { /* localStorage 미지원 시 무시 */ }
  }

  function closeBreakfastPopup() {
    if (els.breakfastPopupOverlay) els.breakfastPopupOverlay.hidden = true;
  }

  function openBreakfastPopup() {
    if (!els.breakfastPopupOverlay) return;
    if (els.breakfastPopupTitle) els.breakfastPopupTitle.textContent = BREAKFAST_RATING_TEXT.title[state.lang];
    if (els.breakfastPopupRateBtn) els.breakfastPopupRateBtn.textContent = BREAKFAST_RATING_TEXT.popupRateBtn[state.lang];
    if (els.breakfastPopupDismissBtn) els.breakfastPopupDismissBtn.textContent = BREAKFAST_RATING_TEXT.popupDismissBtn[state.lang];
    els.breakfastPopupOverlay.hidden = false;
  }

  function maybeShowBreakfastPopup() {
    if (!els.breakfastPopupOverlay) return;
    // 커뮤니티 화면으로 바로 들어온 경우(딥링크)에는 메인 화면 전용
    // 팝업을 띄우지 않습니다.
    if (window.Community && window.Community.isCommunityPath(location.pathname)) return;
    var todayKey = getSeoulDateKey(0);
    var alreadyShownToday;
    try { alreadyShownToday = localStorage.getItem(BREAKFAST_POPUP_KEY) === todayKey; } catch (e) { alreadyShownToday = true; }
    if (alreadyShownToday) return;
    if (!hasTodayBreakfastMenu()) { markBreakfastPopupShownToday(); return; }
    if (window.BreakfastRating && typeof window.BreakfastRating.isRatedToday === "function" && window.BreakfastRating.isRatedToday(todayKey)) {
      markBreakfastPopupShownToday();
      return;
    }
    openBreakfastPopup();
  }

  /* 자정이 지나 날짜가 바뀌면 화면을 새로고침 없이 갱신 */
  var lastKnownSeoulDateKey = null;
  function checkMidnightRollover() {
    var currentKey = getSeoulDateKey(0);
    if (lastKnownSeoulDateKey === null) {
      lastKnownSeoulDateKey = currentKey;
      return;
    }
    if (currentKey !== lastKnownSeoulDateKey) {
      lastKnownSeoulDateKey = currentKey;
      if (state.store === "bapsim" && state.bapsimView === "breakfast") renderBreakfastArea();
    }
  }

  /* ---------------- 무료 콜라 쿠폰 배너 ---------------- */

  function renderColaBanner() {
    var eligible = COLA_COUPON.eligibleStores.indexOf(state.store) !== -1;
    els.colaBanner.hidden = !eligible;
    if (!eligible) return;
    var lang = state.lang;
    els.colaBannerTitle.textContent = "\uD83C\uDF81 " + COLA_COUPON.banner.title[lang];
    els.colaBannerSubtitle.textContent = COLA_COUPON.banner.subtitle[lang];
    els.colaBannerBtn.textContent = COLA_COUPON.banner.button[lang];
  }

  /* ---------------- 콜라 쿠폰 상세창 ---------------- */

  function renderColaDetail() {
    var lang = state.lang;
    var d = COLA_COUPON.detail;

    els.colaDetailTitle.textContent = d.title[lang];
    els.colaDetailSubtitle.textContent = d.subtitle[lang];

    els.colaStoresLabel.textContent = d.storesLabel[lang];
    els.colaStoresList.innerHTML = "";
    d.stores.forEach(function (store) {
      var li = document.createElement("li");
      li.textContent = store.brand + " " + store.floor[lang];
      els.colaStoresList.appendChild(li);
    });

    els.colaConditionLabel.textContent = d.conditionLabel[lang];
    els.colaConditionList.innerHTML = "";
    d.conditions[lang].forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      els.colaConditionList.appendChild(li);
    });

    els.colaCountLabel.textContent = d.countLabel[lang];
    els.colaCountValue.textContent = d.count[lang];

    els.colaHowToLabel.textContent = d.howToLabel[lang];
    els.colaHowToValue.textContent = d.howTo[lang];

    els.colaCaptureLabel.textContent = d.captureLabel[lang];
    els.colaCaptureValue.textContent = d.capture[lang];

    els.colaPeriodLabel.textContent = d.periodLabel[lang];
    els.colaPeriodValue.textContent = d.period[lang];

    els.colaNotesList.innerHTML = "";
    d.notes[lang].forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = "\u203B " + line;
      els.colaNotesList.appendChild(li);
    });

    els.colaShowStaffBtn.textContent = d.showButton[lang];
    els.colaDetailCloseBtn.textContent = d.closeButton[lang];
  }

  var colaLastFocusedEl = null;

  function openColaDetail() {
    renderColaDetail();
    colaLastFocusedEl = document.activeElement;
    els.colaDetailOverlay.hidden = false;
    els.colaDetailClose.focus();
    document.addEventListener("keydown", onColaDetailKeydown);
  }

  function closeColaDetail() {
    els.colaDetailOverlay.hidden = true;
    document.removeEventListener("keydown", onColaDetailKeydown);
    if (colaLastFocusedEl && typeof colaLastFocusedEl.focus === "function") colaLastFocusedEl.focus();
  }

  function onColaDetailKeydown(e) {
    if (e.key === "Escape") closeColaDetail();
  }

  /* ---------------- 직원에게 보여주기 화면 ---------------- */

  function renderStaffShow() {
    var lang = state.lang;
    var s = COLA_COUPON.staffShow;
    els.staffShowTitle.textContent = s.title[lang];
    els.staffShowSubtitle.textContent = s.subtitle[lang];
    els.staffShowStoresLabel.textContent = s.storesLabel[lang];
    els.staffShowStoresValue.textContent = s.storesValue;
    els.staffShowPeriod.textContent = s.period[lang];
  }

  var staffShowLastFocusedEl = null;

  function openStaffShow() {
    renderStaffShow();
    staffShowLastFocusedEl = document.activeElement;
    els.staffShowOverlay.hidden = false;
    els.staffShowClose.focus();
    document.addEventListener("keydown", onStaffShowKeydown);
  }

  function closeStaffShow() {
    els.staffShowOverlay.hidden = true;
    document.removeEventListener("keydown", onStaffShowKeydown);
    if (staffShowLastFocusedEl && typeof staffShowLastFocusedEl.focus === "function") staffShowLastFocusedEl.focus();
  }

  function onStaffShowKeydown(e) {
    if (e.key === "Escape") closeStaffShow();
  }

  /* ---------------- 사장님께 말해요 ---------------- */

  function renderOwnerChat() {
    var lang = state.lang;
    els.ownerChatTitle.textContent = OWNER_CHAT.title[lang];
    els.ownerChatDescLine1.textContent = OWNER_CHAT.desc[lang][0];
    els.ownerChatDescLine2.textContent = OWNER_CHAT.desc[lang][1];
    els.ownerChatBtnLabel.textContent = OWNER_CHAT.button[lang];
    els.ownerChatFabLabel.textContent = OWNER_CHAT.title[lang];
  }

  /* ---------------- 한국어 학습 사이트(hellokorean.site) 연결 카드 ---------------- */

  function renderHelloKorean() {
    if (typeof HELLOKOREAN_INFO === "undefined" || !els.helloKoreanLink) return;
    var lang = state.lang;
    els.helloKoreanTitle.textContent = HELLOKOREAN_INFO.title[lang] || HELLOKOREAN_INFO.title.ko;
    els.helloKoreanDesc.textContent = HELLOKOREAN_INFO.desc[lang] || HELLOKOREAN_INFO.desc.ko;
    els.helloKoreanBtn.textContent = (HELLOKOREAN_INFO.button[lang] || HELLOKOREAN_INFO.button.ko) + " ↗";
    els.helloKoreanUrl.textContent = HELLOKOREAN_INFO.urlDisplay;
  }

  /* ---------------- 초기화 ---------------- */

  function loadSavedLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && SUPPORTED_LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage 미지원 시 무시 */ }
    return "ko";
  }

  function init() {
    els.siteTitle = qs("siteTitle");
    els.siteLogo = qs("siteLogo");
    els.siteLogoBtn = qs("siteLogoBtn");
    els.langToggleBtn = qs("langToggleBtn");
    els.langToggleLabel = qs("langToggleLabel");
    els.langSelect = qs("langSelect");

    els.homeView = qs("homeView");
    els.homeHeroImg = qs("homeHeroImg");
    els.homeHeroTagline = qs("homeHeroTagline");
    els.homeServicesTitle = qs("homeServicesTitle");
    els.homeCardCommunity = qs("homeCardCommunity");
    els.homeCardCommunityName = qs("homeCardCommunityName");
    els.homeCardBreakfast = qs("homeCardBreakfast");
    els.homeCardBreakfastName = qs("homeCardBreakfastName");
    els.homeCardBreakfastLoc = qs("homeCardBreakfastLoc");
    els.homeCardBapsimLoc = qs("homeCardBapsimLoc");
    els.homeCardMangwonLoc = qs("homeCardMangwonLoc");
    els.homeCardHururukLoc = qs("homeCardHururukLoc");
    els.homeCommunityLatestTitle = qs("homeCommunityLatestTitle");
    els.homeCommunityLatest = qs("homeCommunityLatest");
    els.bottomNav = qs("bottomNav");
    els.bottomNavHomeBtn = qs("bottomNavHomeBtn");
    els.bottomNavHomeLabel = qs("bottomNavHomeLabel");
    els.bottomNavSearchBtn = qs("bottomNavSearchBtn");
    els.bottomNavSearchLabel = qs("bottomNavSearchLabel");
    els.bottomNavWriteBtn = qs("bottomNavWriteBtn");
    els.bottomNavWriteLabel = qs("bottomNavWriteLabel");
    els.bottomNavNotifyBtn = qs("bottomNavNotifyBtn");
    els.bottomNavNotifyLabel = qs("bottomNavNotifyLabel");
    els.bottomNavMyBtn = qs("bottomNavMyBtn");

    els.breakfastPopupOverlay = qs("breakfastPopupOverlay");
    els.breakfastPopupTitle = qs("breakfastPopupTitle");
    els.breakfastPopupRateBtn = qs("breakfastPopupRateBtn");
    els.breakfastPopupDismissBtn = qs("breakfastPopupDismissBtn");

    els.storeTabs = qs("storeTabs");
    els.storeHeading = qs("storeHeading");
    els.menuGrid = qs("menuGrid");
    els.groupNav = qs("groupNav");
    els.prevBtn = qs("prevBtn");
    els.nextBtn = qs("nextBtn");
    els.groupIndicator = qs("groupIndicator");
    els.fallbackMsg = qs("fallbackMsg");

    els.bapsimSubtabs = qs("bapsimSubtabs");
    els.bapsimTabMenu = qs("bapsimTabMenu");
    els.bapsimTabBreakfast = qs("bapsimTabBreakfast");

    els.breakfastArea = qs("breakfastArea");
    els.baTitle = qs("baTitle");
    els.baPriceValue = qs("baPriceValue");
    els.baTodayMenuTitle = qs("baTodayMenuTitle");
    els.baTodayDateValue = qs("baTodayDateValue");
    els.todayMealList = qs("todayMealList");
    els.baTomorrowMenuTitle = qs("baTomorrowMenuTitle");
    els.baTomorrowDateValue = qs("baTomorrowDateValue");
    els.tomorrowMealList = qs("tomorrowMealList");
    els.baHoursLabel = qs("baHoursLabel");
    els.baHoursValue = qs("baHoursValue");
    els.baEligLabel = qs("baEligLabel");
    els.baEligList = qs("baEligList");
    els.baStepsLabel = qs("baStepsLabel");
    els.baStepsList = qs("baStepsList");

    els.colaBanner = qs("colaBanner");
    els.colaBannerTitle = qs("colaBannerTitle");
    els.colaBannerSubtitle = qs("colaBannerSubtitle");
    els.colaBannerBtn = qs("colaBannerBtn");

    els.colaDetailOverlay = qs("colaDetailOverlay");
    els.colaDetailClose = qs("colaDetailClose");
    els.colaDetailTitle = qs("colaDetailTitle");
    els.colaDetailSubtitle = qs("colaDetailSubtitle");
    els.colaStoresLabel = qs("colaStoresLabel");
    els.colaStoresList = qs("colaStoresList");
    els.colaConditionLabel = qs("colaConditionLabel");
    els.colaConditionList = qs("colaConditionList");
    els.colaCountLabel = qs("colaCountLabel");
    els.colaCountValue = qs("colaCountValue");
    els.colaHowToLabel = qs("colaHowToLabel");
    els.colaHowToValue = qs("colaHowToValue");
    els.colaCaptureLabel = qs("colaCaptureLabel");
    els.colaCaptureValue = qs("colaCaptureValue");
    els.colaPeriodLabel = qs("colaPeriodLabel");
    els.colaPeriodValue = qs("colaPeriodValue");
    els.colaNotesList = qs("colaNotesList");
    els.colaShowStaffBtn = qs("colaShowStaffBtn");
    els.colaDetailCloseBtn = qs("colaDetailCloseBtn");

    els.staffShowOverlay = qs("staffShowOverlay");
    els.staffShowClose = qs("staffShowClose");
    els.staffShowTitle = qs("staffShowTitle");
    els.staffShowSubtitle = qs("staffShowSubtitle");
    els.staffShowStoresLabel = qs("staffShowStoresLabel");
    els.staffShowStoresValue = qs("staffShowStoresValue");
    els.staffShowPeriod = qs("staffShowPeriod");

    els.ownerChatTitle = qs("ownerChatTitle");
    els.ownerChatDescLine1 = qs("ownerChatDescLine1");
    els.ownerChatDescLine2 = qs("ownerChatDescLine2");
    els.ownerChatBtnLabel = qs("ownerChatBtnLabel");
    els.ownerChatFabLabel = qs("ownerChatFabLabel");

    els.helloKoreanLink = qs("helloKoreanLink");
    els.helloKoreanTitle = qs("helloKoreanTitle");
    els.helloKoreanDesc = qs("helloKoreanDesc");
    els.helloKoreanBtn = qs("helloKoreanBtn");
    els.helloKoreanUrl = qs("helloKoreanUrl");

    els.storeTabButtons = {};
    // 커뮤니티 버튼(.community-tab, data-store 없음)은 매장이 아니므로 제외합니다.
    Array.prototype.forEach.call(els.storeTabs.querySelectorAll(".store-tab[data-store]"), function (btn) {
      var store = btn.getAttribute("data-store");
      els.storeTabButtons[store] = btn;
      // goToStore()는 setStore()에 더해 홈/커뮤니티 화면에서 매장 화면으로
      // 전환하는 것까지 함께 처리합니다(모바일 UI 개선 4단계).
      btn.addEventListener("click", function () { goToStore(store); });
    });

    // 홈 화면의 핵심 서비스 카드 — 기존 헤더 탭과 같은 동작을 재사용합니다
    // (새 라우팅 로직·새 페이지를 따로 만들지 않음).
    if (els.homeCardCommunity && els.storeTabs) {
      els.homeCardCommunity.addEventListener("click", function () {
        var communityTabBtn = els.storeTabs.querySelector(".community-tab");
        if (communityTabBtn) communityTabBtn.click();
      });
    }
    // 천원의 아침밥 카드 — 새 화면 없이 기존 밥심 내부의 천원의 아침밥
    // 화면으로 바로 이동합니다. 이미 밥심의 "일반 메뉴" 탭에 있던
    // 상태여도 이 카드는 항상 아침밥 화면으로 보내야 하므로, 매장이
    // 이미 밥심이라 goToStore()가 화면을 새로 그리지 않는 경우까지
    // 대비해 bapsimView를 먼저 breakfast로 맞춰둡니다.
    if (els.homeCardBreakfast) {
      els.homeCardBreakfast.addEventListener("click", function () {
        state.bapsimView = "breakfast";
        goToStore("bapsim");
      });
    }
    Array.prototype.forEach.call(document.querySelectorAll(".home-service-card[data-store]"), function (card) {
      var store = card.getAttribute("data-store");
      card.addEventListener("click", function () { goToStore(store); });
    });

    // 공식 로고 클릭 시 홈으로 이동(모바일 UI 개선 10단계) — 기존 홈
    // 라우팅(goHome)을 그대로 재사용합니다.
    if (els.siteLogoBtn) {
      els.siteLogoBtn.addEventListener("click", goHome);
    }

    // 하단 내비게이션(홈/검색/글쓰기/알림/MY, 모바일 UI 개선 8단계) —
    // 전부 기존 커뮤니티 라우팅·안내창 로직을 그대로 재사용합니다.
    if (els.bottomNavHomeBtn) {
      els.bottomNavHomeBtn.addEventListener("click", goHome);
    }
    if (els.bottomNavSearchBtn) {
      els.bottomNavSearchBtn.addEventListener("click", function () {
        if (window.Community && typeof window.Community.navigate === "function") {
          window.Community.navigate(window.Community.routePrefix);
        }
        // 게시판/콘텐츠 검색은 새로 만들지 않고, 커뮤니티 목록에 이미 있는
        // 검색창(제목·본문 검색)으로 포커스만 이동합니다.
        setTimeout(function () {
          var input = document.querySelector(".community-search-input");
          if (input) input.focus();
        }, 150);
      });
    }
    if (els.bottomNavWriteBtn) {
      els.bottomNavWriteBtn.addEventListener("click", function () {
        // 비회원이면 기존 로그인 안내창이, 회원이면 글쓰기 화면이 뜹니다
        // (js/community.js의 AUTH_REQUIRED_ROUTES를 그대로 재사용).
        if (window.Community && typeof window.Community.navigate === "function") {
          window.Community.navigate(window.Community.routePrefix + "/write");
        }
      });
    }
    if (els.bottomNavNotifyBtn) {
      els.bottomNavNotifyBtn.addEventListener("click", function () {
        // 기존 알림 기능이 없어, 새 알림 시스템을 만드는 대신 있는
        // 토스트(community.js showToast)로 안내만 합니다.
        if (window.Community && typeof window.Community.showToast === "function") {
          window.Community.showToast(UI_TEXT.bottomNavNotifyComingSoon[state.lang]);
        }
      });
    }
    if (els.bottomNavMyBtn) {
      els.bottomNavMyBtn.addEventListener("click", function () {
        // 비회원이면 로그인 안내, 회원이면 기존 마이페이지(동일 로직 재사용).
        if (window.Community && typeof window.Community.navigate === "function") {
          window.Community.navigate(window.Community.routePrefix + "/my");
        }
      });
    }

    // 히어로 이미지도 로고와 같은 방식으로, 파일이 없으면 자동으로 숨깁니다.
    if (els.homeHeroImg) {
      var hideBrokenHero = function () {
        if (els.homeHeroImg.complete && els.homeHeroImg.naturalWidth === 0) els.homeHeroImg.hidden = true;
      };
      els.homeHeroImg.addEventListener("error", hideBrokenHero, { once: true });
      hideBrokenHero();
    }

    // js/community.js가 커뮤니티 화면에서 빠져나올 때 홈/매장 중 무엇을
    // 다시 보여줄지 이 함수를 통해 물어봅니다.
    window.AppHome = {
      applyView: applyViewVisibility,
      // 커뮤니티 화면으로 들어갈 때 하단 내비게이션의 "홈" 활성 표시만
      // 꺼달라고 community.js가 호출합니다(하단 내비게이션 자체는 8단계부터
      // 항상 고정 표시).
      setHomeActive: function (active) {
        if (els.bottomNavHomeBtn) els.bottomNavHomeBtn.classList.toggle("active", active);
      }
    };

    // 당일 첫 방문 평가 팝업(모바일 UI 개선 6단계)
    if (els.breakfastPopupRateBtn) {
      els.breakfastPopupRateBtn.addEventListener("click", function () {
        markBreakfastPopupShownToday();
        closeBreakfastPopup();
        state.bapsimView = "breakfast";
        goToStore("bapsim"); // 기존 천원의 아침밥 화면(밥심 내부)을 그대로 재사용
      });
    }
    if (els.breakfastPopupDismissBtn) {
      els.breakfastPopupDismissBtn.addEventListener("click", function () {
        markBreakfastPopupShownToday();
        closeBreakfastPopup();
      });
    }
    if (els.breakfastPopupOverlay) {
      els.breakfastPopupOverlay.addEventListener("click", function (e) {
        if (e.target === els.breakfastPopupOverlay) { markBreakfastPopupShownToday(); closeBreakfastPopup(); }
      });
    }

    els.langButtons = {};
    Array.prototype.forEach.call(document.querySelectorAll(".lang-btn"), function (btn) {
      var lang = btn.getAttribute("data-lang");
      els.langButtons[lang] = btn;
      btn.addEventListener("click", function () {
        setLang(lang);
        closeLangMenu();
      });
    });

    // 로고 파일이 아직 없으면(placeholder) 깨진 이미지 아이콘 없이 자동으로 숨깁니다.
    // 나중에 images/icon/site-logo.png 파일을 올리기만 하면 코드 수정 없이 보입니다.
    if (els.siteLogo) {
      var hideBrokenLogo = function () {
        if (els.siteLogo.complete && els.siteLogo.naturalWidth === 0) els.siteLogo.hidden = true;
      };
      els.siteLogo.addEventListener("error", hideBrokenLogo, { once: true });
      // init() 실행 전에 이미 로드가 끝나버렸을 수도 있어(로컬/캐시처럼
      // 아주 빠른 응답) 즉시 한 번 더 확인합니다.
      hideBrokenLogo();
    }

    // 핵심 서비스 카드의 공식 로고 이미지(10단계)도 같은 방식으로
    // 파일이 없으면 자동 숨김 처리합니다(임의 로고 제작 없이 자리만 마련).
    Array.prototype.forEach.call(document.querySelectorAll(".home-service-icon-img"), function (img) {
      var hideBrokenIcon = function () {
        if (img.complete && img.naturalWidth === 0) img.hidden = true;
      };
      img.addEventListener("error", hideBrokenIcon, { once: true });
      hideBrokenIcon();
    });

    // 모바일에서는 7개 언어를 한 줄로 나열하지 않고, 현재 언어 버튼을
    // 누르면 목록이 펼쳐지는 방식으로 바꿨습니다(기존 언어 선택 로직 재사용).
    if (els.langToggleBtn && els.langSelect) {
      els.langToggleBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (els.langSelect.hidden) openLangMenu(); else closeLangMenu();
      });
      document.addEventListener("click", function (e) {
        if (els.langSelect.hidden) return;
        if (els.langToggleBtn.contains(e.target) || els.langSelect.contains(e.target)) return;
        closeLangMenu();
      });
    }

    els.prevBtn.addEventListener("click", function () { changeGroup(-1); });
    els.nextBtn.addEventListener("click", function () { changeGroup(1); });

    els.bapsimTabMenu.addEventListener("click", function () { setBapsimView("menu"); });
    els.bapsimTabBreakfast.addEventListener("click", function () { setBapsimView("breakfast"); });

    if (els.helloKoreanLink) {
      els.helloKoreanLink.addEventListener("click", function () {
        // 링크 자체는 이 리스너와 무관하게 항상 정상적으로 새 창에서 열립니다.
        // 통계 기록이 실패하거나 늦어도 이동을 막지 않습니다(비동기, 결과 무시).
        if (window.HelloKoreanStats && typeof HelloKoreanStats.logClick === "function") {
          HelloKoreanStats.logClick(state.lang);
        }
      });
    }

    els.colaBannerBtn.addEventListener("click", openColaDetail);
    els.colaDetailClose.addEventListener("click", closeColaDetail);
    els.colaDetailCloseBtn.addEventListener("click", closeColaDetail);
    els.colaDetailOverlay.addEventListener("click", function (e) {
      if (e.target === els.colaDetailOverlay) closeColaDetail();
    });
    els.colaShowStaffBtn.addEventListener("click", function () {
      closeColaDetail();
      openStaffShow();
    });

    els.staffShowClose.addEventListener("click", closeStaffShow);
    els.staffShowOverlay.addEventListener("click", function (e) {
      if (e.target === els.staffShowOverlay) closeStaffShow();
    });

    state.lang = loadSavedLang();

    renderAll();
    renderHome();
    // 커뮤니티 경로로 바로 들어온 경우(딥링크)에는 community.js가 이미
    // 화면 전환을 처리했으므로, 여기서 홈/매장 보이기를 덮어쓰지 않습니다.
    if (!(window.Community && window.Community.isCommunityPath(location.pathname))) {
      applyViewVisibility();
    }

    lastKnownSeoulDateKey = getSeoulDateKey(0);
    setInterval(checkMidnightRollover, 60000);

    /* 언어 통계 기록 (새 UI 없음, 방문 시점의 언어를 그대로 기록) */
    if (window.LanguageStats && typeof window.LanguageStats.record === "function") {
      window.LanguageStats.record(state.lang);
    }
    // PWA 업데이트/설치 배너 문구도 처음부터 저장된 언어에 맞춰 둡니다.
    if (window.PwaManager && typeof window.PwaManager.setLang === "function") {
      window.PwaManager.setLang(state.lang);
    }
    // 커뮤니티 상단 버튼 문구도 처음부터 저장된 언어에 맞춰 둡니다.
    if (window.Community && typeof window.Community.setLang === "function") {
      window.Community.setLang(state.lang);
    }

    /* 관리자 페이지에서 등록한 주간메뉴로 동기화 (없으면 정적 데이터 유지) */
    if (window.WeeklyMenuSync && typeof window.WeeklyMenuSync.sync === "function") {
      window.WeeklyMenuSync.sync(function () {
        if (state.store === "bapsim" && state.bapsimView === "breakfast") renderBreakfastArea();
      });
    }

    // 메인 화면이 먼저 정상 표시된 뒤 약간의 지연 후 자연스럽게 팝업을
    // 띄웁니다(사이트 진입 즉시 화면을 가리지 않음).
    setTimeout(maybeShowBreakfastPopup, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

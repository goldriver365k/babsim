/* ==========================================================================
   푸드홀(인제대학교) app.js
   - 매장 선택 / 언어 선택 / 메뉴 그룹 이전·다음 / 천원의 아침밥 모달
   - 외부 라이브러리 없이 순수 JavaScript로 동작합니다.
   ========================================================================== */

(function () {
  "use strict";

  var STORE_ORDER = ["bapsim", "mangwon", "hururuk"];
  var LANG_KEY = "foodhall_lang";
  var SUPPORTED_LANGS = ["ko", "zh", "vi", "en", "mn"];

  var state = {
    store: "bapsim",
    bapsimView: "breakfast",
    groupByStore: { bapsim: 1, mangwon: 1, hururuk: 1 },
    lang: "ko"
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

  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1 || state.lang === lang) return;
    state.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* localStorage 미지원 시 무시 */ }
    renderAll();
    if (!els.colaDetailOverlay.hidden) renderColaDetail();
    if (!els.staffShowOverlay.hidden) renderStaffShow();
    if (window.LanguageStats && typeof window.LanguageStats.record === "function") {
      window.LanguageStats.record(lang);
    }
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
  var DATE_LOCALE_MAP = { ko: "ko-KR", en: "en-US", zh: "zh-CN", vi: "vi-VN", mn: "mn-MN" };

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

  function renderMealList(listEl, lang, offsetDays, closedText) {
    var dateKey = getSeoulDateKey(offsetDays);
    var day = BREAKFAST_WEEKLY_MENU && BREAKFAST_WEEKLY_MENU.days ? BREAKFAST_WEEKLY_MENU.days[dateKey] : null;

    listEl.innerHTML = "";

    if (isSeoulWeekend(offsetDays) || !day) {
      var closedP = document.createElement("p");
      closedP.className = "today-meal-closed";
      closedP.textContent = closedText;
      listEl.appendChild(closedP);
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

    var hasImage = !!(BREAKFAST_WEEKLY_MENU && BREAKFAST_WEEKLY_MENU.sourceImage);
    els.baViewOriginalBtn.hidden = !hasImage;
    if (hasImage) {
      els.baViewOriginalBtn.textContent = info.viewOriginalButton[lang];
    }
  }

  /* "오늘의 메뉴 평가" 위젯 연동 (js/breakfast-rating.js, 선택적 모듈) */
  function renderBreakfastRating(lang) {
    if (!window.BreakfastRating || typeof window.BreakfastRating.render !== "function") return;
    var dateKey = getSeoulDateKey(0);
    var day = BREAKFAST_WEEKLY_MENU && BREAKFAST_WEEKLY_MENU.days ? BREAKFAST_WEEKLY_MENU.days[dateKey] : null;
    var firstList = day && ((day.regular && day.regular.length) ? day.regular : (day.simple && day.simple.length ? day.simple : null));
    var hasDirectInput = !!firstList;
    var hasItems = !!(day && day.items && day.items.length);
    var hasTodayMenu = !isSeoulWeekend(0) && !!(day && (hasDirectInput || hasItems || day.main || day.rice || day.soup));
    var menuText = "";
    if (day) {
      if (hasDirectInput) {
        var firstDirect = firstList[0];
        menuText = typeof firstDirect === "string" ? firstDirect : (firstDirect.ko || "");
      } else if (hasItems) {
        var first = day.items[0];
        menuText = typeof first === "string" ? first : (first.ko || "");
      } else if (day.main) {
        menuText = day.main.ko;
      }
    }
    window.BreakfastRating.render(lang, hasTodayMenu, dateKey, menuText);
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

  /* ---------------- 주간 메뉴 원본 이미지 팝업 ---------------- */

  var weeklyImageLastFocusedEl = null;

  function openWeeklyImage() {
    if (!BREAKFAST_WEEKLY_MENU || !BREAKFAST_WEEKLY_MENU.sourceImage) return;
    els.weeklyImageImg.src = BREAKFAST_WEEKLY_MENU.sourceImage;
    els.weeklyImageImg.alt = BREAKFAST_INFO.viewOriginalButton[state.lang];
    weeklyImageLastFocusedEl = document.activeElement;
    els.weeklyImageOverlay.hidden = false;
    els.weeklyImageClose.focus();
    document.addEventListener("keydown", onWeeklyImageKeydown);
  }

  function closeWeeklyImage() {
    els.weeklyImageOverlay.hidden = true;
    document.removeEventListener("keydown", onWeeklyImageKeydown);
    if (weeklyImageLastFocusedEl && typeof weeklyImageLastFocusedEl.focus === "function") weeklyImageLastFocusedEl.focus();
  }

  function onWeeklyImageKeydown(e) {
    if (e.key === "Escape") closeWeeklyImage();
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
    els.baViewOriginalBtn = qs("baViewOriginalBtn");

    els.weeklyImageOverlay = qs("weeklyImageOverlay");
    els.weeklyImageClose = qs("weeklyImageClose");
    els.weeklyImageImg = qs("weeklyImageImg");

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

    els.storeTabButtons = {};
    Array.prototype.forEach.call(els.storeTabs.querySelectorAll(".store-tab"), function (btn) {
      var store = btn.getAttribute("data-store");
      els.storeTabButtons[store] = btn;
      btn.addEventListener("click", function () { setStore(store); });
    });

    els.langButtons = {};
    Array.prototype.forEach.call(document.querySelectorAll(".lang-btn"), function (btn) {
      var lang = btn.getAttribute("data-lang");
      els.langButtons[lang] = btn;
      btn.addEventListener("click", function () { setLang(lang); });
    });

    els.prevBtn.addEventListener("click", function () { changeGroup(-1); });
    els.nextBtn.addEventListener("click", function () { changeGroup(1); });

    els.bapsimTabMenu.addEventListener("click", function () { setBapsimView("menu"); });
    els.bapsimTabBreakfast.addEventListener("click", function () { setBapsimView("breakfast"); });

    els.baViewOriginalBtn.addEventListener("click", openWeeklyImage);
    els.weeklyImageClose.addEventListener("click", closeWeeklyImage);
    els.weeklyImageOverlay.addEventListener("click", function (e) {
      if (e.target === els.weeklyImageOverlay) closeWeeklyImage();
    });

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

    lastKnownSeoulDateKey = getSeoulDateKey(0);
    setInterval(checkMidnightRollover, 60000);

    /* 언어 통계 기록 (새 UI 없음, 방문 시점의 언어를 그대로 기록) */
    if (window.LanguageStats && typeof window.LanguageStats.record === "function") {
      window.LanguageStats.record(state.lang);
    }

    /* 관리자 페이지에서 등록한 주간메뉴로 동기화 (없으면 정적 데이터 유지) */
    if (window.WeeklyMenuSync && typeof window.WeeklyMenuSync.sync === "function") {
      window.WeeklyMenuSync.sync(function () {
        if (state.store === "bapsim" && state.bapsimView === "breakfast") renderBreakfastArea();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

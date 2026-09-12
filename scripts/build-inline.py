"""
css/style.css, js/translations.js, js/menu-data.js, js/app.js 등의 원본
파일을 index.html / admin.html 안에 <style>/<script>로 직접 합쳐 넣는
스크립트입니다.

왜 필요한가:
  일부 미리보기 환경(iframe, 샌드박스 등)에서는 <link>나
  <script src="...">로 불러오는 외부 파일을 읽지 못해 CSS와 JS가
  전혀 적용되지 않는 문제가 있었습니다. 이를 근본적으로 피하기 위해
  실제 배포용 index.html·admin.html은 프로젝트 자체 CSS/JS는
  외부 참조 없이 전부 내장한 "독립 실행형" 파일로 만듭니다.
  (Firebase SDK처럼 외부 CDN에서 불러오는 라이브러리는 예외입니다.)

사용법:
  메뉴, 번역, 동작, 디자인, 관리자 페이지를 수정할 때는
  css/style.css, js/translations.js, js/menu-data.js, js/app.js,
  js/firebase-config.js, js/breakfast-rating.js, js/hellokorean-stats.js,
  js/pwa.js, css/admin.css, js/admin.js

  유학생 커뮤니티 기능은 js/community-translations.js(5개 언어 문구,
  국가 목록), js/community.js(라우팅·회원가입/로그인·게시글/댓글·신고·
  번역 요청)에 있습니다. 번역 API 호출은 브라우저가 아니라
  netlify/functions/community-translate.js에서만 이뤄집니다(기존
  OPENAI_API_KEY 환경변수를 그대로 재사용, 새 환경변수 없음). index.html
  은 이제 커뮤니티 회원가입/로그인/이미지 업로드를 위해 Firebase
  Auth·Storage SDK도 함께 불러옵니다(admin.html과 동일한 SDK,
  프로젝트는 그대로 babsim-46284).

  service-worker.js와 manifest.webmanifest는 index.html에 합쳐지지 않고
  저장소 루트에 그대로 배포되는 독립 파일입니다(서비스 워커는 브라우저가
  별도 URL로 직접 받아야 하므로 inline 스크립트로 넣을 수 없습니다).
  이 두 파일은 수정 후 바로 배포하면 됩니다(build-inline.py 실행 불필요).
  이 원본 파일들만 수정하고, 그 다음 아래 명령을 실행하세요.

      python3 scripts/build-inline.py

  실행하면 index.html과 admin.html이 최신 내용으로 자동 갱신됩니다.
  (이 스크립트는 배포에 필요한 빌드 과정이 아니라,
   로컬에서 편집을 도와주는 선택적 도구입니다.
   Netlify에는 이미 완성된 index.html·admin.html만 그대로 올리면 됩니다.)
"""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel_path):
    with open(os.path.join(BASE, rel_path), encoding="utf-8") as f:
        return f.read()


def build():
    css = read("css/style.css")
    translations = read("js/translations.js")
    menu_data = read("js/menu-data.js")
    weekly_menu = read("data/breakfast-weekly-menu.js")
    firebase_config = read("js/firebase-config.js")
    breakfast_rating = read("js/breakfast-rating.js")
    language_stats = read("js/language-stats.js")
    weekly_menu_sync = read("js/weekly-menu-sync.js")
    hellokorean_stats = read("js/hellokorean-stats.js")
    pwa = read("js/pwa.js")
    community_translations = read("js/community-translations.js")
    community = read("js/community.js")
    site_popup = read("js/site-popup.js")
    app = read("js/app.js")

    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>모인관(인제대학교)</title>
<meta name="description" content="인제대학교 모인관 - 밥심, 만권화밥, 후루룩찹찹 온라인 메뉴판">

<!-- 홈 화면 추가(PWA) 아이콘 -->
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="/images/icon/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/images/icon/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/images/icon/apple-touch-icon.png">
<meta name="theme-color" content="#1957d6">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="모인관">
<!-- 벵골어·미얀마어 표시용 웹폰트 — 필요한 굵기(400/700)만 불러오고,
     Google Fonts CSS2가 실제 쓰인 글자에 맞춰 자동으로 서브셋을 나눠
     보내주므로 브라우저는 화면에 쓰인 문자 범위만 내려받습니다. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Myanmar:wght@400;700&display=swap">
<style>
""" + css + """
</style>
</head>
<body>

<header class="site-header">
  <div class="header-top">
    <div class="site-brand">
      <!-- 공식 로고(모바일 UI 개선 10단계: 사용자 제공 인제대학교 공식
           마크, images/icon/site-logo.jpg) — 원본 그대로 사용, 비율
           왜곡 없이 height 기준으로만 표시합니다. 클릭 시 기존 홈
           라우팅(goHome)을 재사용해 메인 홈으로 이동합니다. -->
      <button type="button" class="site-logo-btn" id="siteLogoBtn" aria-label="인제대학교 — 홈으로 이동">
        <img class="site-logo" id="siteLogo" src="/images/icon/site-logo.jpg" alt="인제대학교">
      </button>
      <h1 class="site-title" id="siteTitle">모인관(인제대학교)</h1>
    </div>
  </div>
  <!-- 언어 선택 위치/표시 방식 변경: 드롭다운·팝업 없이 7개 언어 버튼을
       항상 표시합니다(모인관·인제대학교 바로 아래, 식당/커뮤니티 선택
       메뉴 바로 위). 국기 이미지·"언어 선택" 제목 없이 언어명만 나열. -->
  <div class="lang-bar" id="langBar" role="group" aria-label="언어 선택">
    <button type="button" class="lang-bar-btn" data-lang="ko" aria-label="한국어">한국어</button>
    <button type="button" class="lang-bar-btn" data-lang="zh" aria-label="中文">中文</button>
    <button type="button" class="lang-bar-btn" data-lang="vi" aria-label="Tiếng Việt">Tiếng Việt</button>
    <button type="button" class="lang-bar-btn" data-lang="en" aria-label="English">English</button>
    <button type="button" class="lang-bar-btn" data-lang="mn" aria-label="Монгол">Монгол</button>
    <button type="button" class="lang-bar-btn" data-lang="bn" aria-label="বাংলা">বাংলা</button>
    <button type="button" class="lang-bar-btn" data-lang="my" aria-label="မြန်မာ">မြန်မာ</button>
  </div>
  <nav class="store-tabs" id="storeTabs" aria-label="매장 선택">
    <button type="button" class="store-tab community-tab" id="communityTabBtn" aria-label="밥심 커뮤니티">
      <span class="community-tab-line1"></span><span class="community-tab-line2"></span>
    </button>
    <button type="button" class="store-tab" data-store="bapsim">밥심<br>1층</button>
    <button type="button" class="store-tab" data-store="mangwon">만권화밥<br>1층</button>
    <button type="button" class="store-tab" data-store="hururuk">후루룩찹찹<br>2층</button>
  </nav>
</header>

<!-- 홈 화면(js/app.js의 renderHome()이 내용을 채웁니다). 기본으로
     보이는 화면이며, 매장(밥심 등)을 고르거나 커뮤니티로 이동하면
     숨겨집니다(main 이하 / #communityRoot와 서로 배타적). -->
<section class="home-view" id="homeView">
  <div class="home-hero">
    <!-- 히어로 이미지 placeholder — images/icon/home-hero.jpg 파일을
         나중에 올리기만 하면 코드 수정 없이 적용됩니다. 파일이 없는
         동안은 js/app.js가 자동으로 숨깁니다(임의 이미지 제작 없음). -->
    <img class="home-hero-img" id="homeHeroImg" src="/images/icon/home-hero.jpg" alt="">
    <p class="home-hero-tagline" id="homeHeroTagline"></p>
  </div>

  <h2 class="home-section-title" id="homeServicesTitle"></h2>
  <div class="home-service-grid" id="homeServiceGrid">
    <!-- 모바일 UI 개선 6단계: 서비스 노출 순서 확정 — 1.천원의 아침밥
         2.유학생 커뮤니티 3.후루룩찹찹 4.만권화밥 5.밥심. 천원의 아침밥은
         새 페이지가 아니라 기존 밥심 내부 화면(data-store="bapsim")을
         그대로 재사용합니다(밥심 카드와 같은 곳으로 이동, 조금 더 강조만).
         10단계: 후루룩찹찹/만권화밥/밥심은 사용자 제공 공식 로고
         이미지(images/icon/logo-*.png, 원본 그대로)로 교체. 천원의
         아침밥/유학생 커뮤니티는 제공된 로고가 없어 기존 이모지 유지. -->
    <button type="button" class="home-service-card home-service-card-featured" id="homeCardBreakfast">
      <span class="home-service-icon" aria-hidden="true">🍳</span>
      <span class="home-service-name" id="homeCardBreakfastName"></span>
      <span class="home-service-loc" id="homeCardBreakfastLoc"></span>
    </button>
    <button type="button" class="home-service-card" id="homeCardCommunity">
      <span class="home-service-icon" aria-hidden="true">💬</span>
      <span class="home-service-name" id="homeCardCommunityName"></span>
    </button>
    <button type="button" class="home-service-card" data-store="hururuk">
      <img class="home-service-icon-img" src="/images/icon/logo-hururuk.png" alt="">
      <span class="home-service-name">후루룩찹찹</span>
      <span class="home-service-loc" id="homeCardHururukLoc"></span>
    </button>
    <button type="button" class="home-service-card" data-store="mangwon">
      <img class="home-service-icon-img" src="/images/icon/logo-mangwon.png" alt="">
      <span class="home-service-name">만권화밥</span>
      <span class="home-service-loc" id="homeCardMangwonLoc"></span>
    </button>
    <button type="button" class="home-service-card" data-store="bapsim">
      <img class="home-service-icon-img" src="/images/icon/logo-bapsim.png" alt="">
      <span class="home-service-name">밥심</span>
      <span class="home-service-loc" id="homeCardBapsimLoc"></span>
    </button>
  </div>

  <h2 class="home-section-title" id="homeCommunityLatestTitle"></h2>
  <div class="home-community-latest" id="homeCommunityLatest"></div>
</section>

<!-- 하단 내비게이션 — 홈/커뮤니티 두 화면만 빠르게 오갈 수 있게 합니다
     (이번 단계는 홈 화면 관련 범위라, 우선 홈 화면에서만 보입니다). -->
<!-- 모바일 UI 개선 8단계: 하단 내비게이션을 홈/검색/글쓰기/알림/MY
     5개로 정리(천원의 아침밥·유학생 커뮤니티 등 핵심 서비스 5개는
     메인 홈 카드에서만 접근 — 여기에 넣지 않음). 화면(홈/매장/커뮤니티)
     과 무관하게 항상 고정 표시됩니다. -->
<nav class="bottom-nav" id="bottomNav" aria-label="하단 내비게이션">
  <button type="button" class="bottom-nav-btn" id="bottomNavHomeBtn">
    <span class="bottom-nav-icon" aria-hidden="true">🏠</span>
    <span class="bottom-nav-label" id="bottomNavHomeLabel"></span>
  </button>
  <button type="button" class="bottom-nav-btn" id="bottomNavSearchBtn">
    <span class="bottom-nav-icon" aria-hidden="true">🔍</span>
    <span class="bottom-nav-label" id="bottomNavSearchLabel"></span>
  </button>
  <button type="button" class="bottom-nav-btn bottom-nav-btn-write" id="bottomNavWriteBtn">
    <span class="bottom-nav-icon" aria-hidden="true">✏️</span>
    <span class="bottom-nav-label" id="bottomNavWriteLabel"></span>
  </button>
  <button type="button" class="bottom-nav-btn" id="bottomNavNotifyBtn">
    <span class="bottom-nav-icon" aria-hidden="true">🔔</span>
    <span class="bottom-nav-label" id="bottomNavNotifyLabel"></span>
  </button>
  <button type="button" class="bottom-nav-btn" id="bottomNavMyBtn">
    <span class="bottom-nav-icon" aria-hidden="true">👤</span>
    <span class="bottom-nav-label">MY</span>
  </button>
</nav>

<!-- 당일 첫 방문 천원의 아침밥 평가 팝업(모바일 UI 개선 6단계, 평가 UI
     수정 단계에서 본문 평가 영역을 이 팝업 안으로 이동). 평가 완료 여부
     확인에는 localStorage만 쓰고 별도 Firebase 조회는 하지 않습니다
     (js/app.js의 maybeShowBreakfastPopup). 평가 위젯 자체(#baRating 이하)는
     js/breakfast-rating.js가 기존 로직 그대로 채웁니다 — 새 평가
     시스템이 아니라 같은 위젯을 화면 본문에서 팝업으로 옮긴 것입니다. -->
<div class="breakfast-popup-overlay" id="breakfastPopupOverlay" hidden>
  <div class="breakfast-popup-sheet" role="dialog" aria-modal="true" aria-labelledby="baRatingTitle">
    <button type="button" class="breakfast-popup-close-btn" id="breakfastPopupCloseBtn"></button>
    <div class="ba-rating" id="baRating" hidden>
      <h4 class="ba-rating-title" id="baRatingTitle"></h4>
      <div class="ba-rating-options" id="baRatingOptions" role="group"></div>
      <p class="ba-rating-message" id="baRatingMessage" aria-live="polite" hidden></p>
    </div>
  </div>
</div>

<!-- 유학생 커뮤니티(js/community.js가 내용을 채웁니다). /community 경로일
     때만 보이고, 그 외에는 기존 매장 화면(main 이하)이 그대로 보입니다. -->
<div class="community-root" id="communityRoot" hidden></div>

<div class="cola-banner" id="colaBanner" hidden>
  <img class="cola-banner-icon" src="/images/bapsim/cola.jpg" alt="" aria-hidden="true">
  <div class="cola-banner-text">
    <p class="cola-banner-title" id="colaBannerTitle">🎁 무료 콜라 쿠폰</p>
    <p class="cola-banner-subtitle" id="colaBannerSubtitle">음식 주문하고 콜라 1캔 무료로 받으세요!</p>
  </div>
  <button type="button" class="cola-banner-btn" id="colaBannerBtn">쿠폰 보기</button>
</div>

<main hidden>
  <h2 class="store-heading" id="storeHeading">밥심1층</h2>

  <div class="bapsim-subtabs" id="bapsimSubtabs" hidden role="group" aria-label="밥심 화면 전환">
    <button type="button" class="bapsim-subtab" id="bapsimTabBreakfast">천원의 아침밥</button>
    <button type="button" class="bapsim-subtab" id="bapsimTabMenu">일반 메뉴</button>
  </div>

  <div class="menu-grid" id="menuGrid" aria-live="polite"></div>

  <section class="breakfast-area" id="breakfastArea" hidden aria-labelledby="baTitle">
    <div class="ba-top-strip"></div>
    <h3 class="ba-title" id="baTitle">천원의 아침밥</h3>
    <p class="ba-price" id="baPriceValue">1,000원</p>

    <!-- 평가 위젯은 더 이상 이 화면 본문에 표시하지 않습니다(평가 UI
         수정 단계) — 당일 첫 방문 팝업(#breakfastPopupOverlay)에서만
         보여줍니다. -->

    <div class="ba-meal-cards">
      <div class="ba-meal-card ba-meal-card-today">
        <h4 class="ba-meal-card-title" id="baTodayMenuTitle">오늘의 아침 메뉴</h4>
        <p class="ba-meal-card-date" id="baTodayDateValue"></p>
        <ul class="ba-today-meal" id="todayMealList"></ul>
      </div>
      <div class="ba-meal-card ba-meal-card-tomorrow">
        <h4 class="ba-meal-card-title" id="baTomorrowMenuTitle">내일의 아침 메뉴</h4>
        <p class="ba-meal-card-date" id="baTomorrowDateValue"></p>
        <ul class="ba-today-meal" id="tomorrowMealList"></ul>
      </div>
    </div>

    <div class="ba-block">
      <span class="ba-label" id="baHoursLabel"></span>
      <p class="ba-value" id="baHoursValue"></p>
    </div>

    <div class="ba-block">
      <span class="ba-label" id="baEligLabel"></span>
      <ul class="ba-list" id="baEligList"></ul>
    </div>

    <div class="ba-block">
      <span class="ba-label" id="baStepsLabel"></span>
      <ol class="ba-list ba-steps-list" id="baStepsList"></ol>
    </div>
  </section>

  <div class="group-nav" id="groupNav" hidden>
    <button type="button" class="group-btn" id="prevBtn">이전</button>
    <span class="group-indicator" id="groupIndicator"></span>
    <button type="button" class="group-btn" id="nextBtn">다음</button>
  </div>

  <p class="fallback-msg" id="fallbackMsg" hidden></p>
</main>

<section class="hellokorean-card">
  <a class="hellokorean-link" id="helloKoreanLink" href="https://hellokorean.site/?utm_source=babsim.store&utm_medium=website&utm_campaign=korean_learning" target="_blank" rel="noopener noreferrer" aria-label="hellokorean.site 새 창에서 열기">
    <h3 class="hellokorean-title" id="helloKoreanTitle">무료 한국어 공부</h3>
    <p class="hellokorean-desc" id="helloKoreanDesc">한국어를 쉽고 재미있게 배워보세요</p>
    <span class="hellokorean-btn" id="helloKoreanBtn">무료로 시작하기 ↗</span>
    <span class="hellokorean-url"><span id="helloKoreanUrl">hellokorean.site</span> <span aria-hidden="true">↗</span></span>
  </a>
</section>

<footer class="owner-chat-banner" id="ownerChatBanner">
  <h3 class="owner-chat-title" id="ownerChatTitle">사장님께 말해요</h3>
  <p class="owner-chat-desc" id="ownerChatDescLine1">메뉴 제안, 칭찬, 불편사항을 편하게 알려주세요.</p>
  <p class="owner-chat-desc" id="ownerChatDescLine2">작성한 내용은 홈페이지에 공개되거나 저장되지 않습니다.</p>
  <a class="owner-chat-btn" id="ownerChatBtn" href="https://open.kakao.com/o/sxJlUwMi" target="_blank" rel="noopener noreferrer">
    <span aria-hidden="true">\U0001F4AC</span>
    <span id="ownerChatBtnLabel">카카오톡으로 말하기</span>
  </a>
</footer>

<a class="owner-chat-fab" id="ownerChatFab" href="https://open.kakao.com/o/sxJlUwMi" target="_blank" rel="noopener noreferrer" aria-label="사장님께 말해요">
  <span aria-hidden="true">\U0001F4AC</span>
  <span id="ownerChatFabLabel">사장님께 말해요</span>
</a>

<!-- 무료 콜라 쿠폰 상세창 -->
<div class="modal-overlay" id="colaDetailOverlay" hidden>
  <div class="modal cola-modal" role="dialog" aria-modal="true" aria-labelledby="colaDetailTitle">
    <button type="button" class="modal-close" id="colaDetailClose" aria-label="닫기">×</button>
    <h3 class="modal-title cola-modal-title" id="colaDetailTitle">무료 콜라 쿠폰</h3>
    <p class="modal-desc" id="colaDetailSubtitle"></p>

    <div class="modal-section">
      <h4 id="colaStoresLabel"></h4>
      <ul id="colaStoresList" class="cola-stores-list"></ul>
    </div>
    <div class="modal-section">
      <h4 id="colaConditionLabel"></h4>
      <ul id="colaConditionList"></ul>
    </div>
    <div class="modal-section">
      <h4 id="colaCountLabel"></h4>
      <p id="colaCountValue" class="cola-plain-value"></p>
    </div>
    <div class="modal-section">
      <h4 id="colaHowToLabel"></h4>
      <p id="colaHowToValue" class="cola-plain-value"></p>
    </div>
    <div class="modal-section">
      <h4 id="colaCaptureLabel"></h4>
      <p id="colaCaptureValue" class="cola-plain-value"></p>
    </div>
    <div class="modal-section">
      <h4 id="colaPeriodLabel"></h4>
      <p id="colaPeriodValue" class="cola-plain-value"></p>
    </div>

    <ul class="bp-notes" id="colaNotesList"></ul>

    <div class="cola-modal-actions">
      <button type="button" class="cola-show-btn" id="colaShowStaffBtn">직원에게 보여주기</button>
      <button type="button" class="group-btn" id="colaDetailCloseBtn">닫기</button>
    </div>
  </div>
</div>

<!-- 직원에게 보여주기 화면 -->
<div class="staff-show-overlay" id="staffShowOverlay" hidden>
  <button type="button" class="staff-show-close" id="staffShowClose" aria-label="닫기">×</button>
  <div class="staff-show-card">
    <p class="staff-show-title" id="staffShowTitle">무료 콜라 1캔</p>
    <p class="staff-show-subtitle" id="staffShowSubtitle"></p>
    <div class="staff-show-field">
      <span class="staff-show-label" id="staffShowStoresLabel"></span>
      <span class="staff-show-value" id="staffShowStoresValue"></span>
    </div>
    <p class="staff-show-period" id="staffShowPeriod"></p>
  </div>
</div>

<!-- PWA 업데이트 알림 / 바탕화면 추가 안내 (js/pwa.js가 내용을 채우고,
     업데이트 배너와 바탕화면 추가 안내는 동시에 뜨지 않습니다) -->
<div class="pwa-banner" id="pwaBanner" hidden role="status" aria-live="polite">
  <button type="button" class="pwa-banner-close" id="pwaBannerClose" aria-label="닫기">×</button>
  <div class="pwa-banner-body" id="pwaBannerBody"></div>
</div>

<!-- 아이폰/아이패드 홈 화면 추가 방법 안내(자동 설치창이 없어 직접 안내) -->
<div class="modal-overlay" id="iosInstallOverlay" hidden>
  <div class="modal ios-install-modal" role="dialog" aria-modal="true" aria-label="홈 화면에 추가하는 방법">
    <button type="button" class="modal-close" id="iosInstallClose" aria-label="닫기">×</button>
    <ol class="ios-install-steps" id="iosInstallSteps"></ol>
  </div>
</div>

<script>
""" + translations + """
</script>
<script>
""" + menu_data + """
</script>
<script>
""" + weekly_menu + """
</script>

<!-- "오늘의 메뉴 평가" 기능과 유학생 커뮤니티(회원가입/로그인/이미지 업로드)가
     함께 사용하는 Firebase SDK. js/firebase-config.js에 실제 프로젝트 값을
     넣기 전까지는 평가 데이터가 각 학생의 기기에만 저장되며, 이 화면의
     다른 기능에는 영향을 주지 않습니다. -->
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-storage-compat.js"></script>
<script>
""" + firebase_config + """
</script>
<script>
""" + breakfast_rating + """
</script>
<script>
""" + language_stats + """
</script>
<script>
""" + weekly_menu_sync + """
</script>
<script>
""" + hellokorean_stats + """
</script>
<script>
""" + pwa + """
</script>
<script>
""" + community_translations + """
</script>
<script>
""" + community + """
</script>
<script>
""" + site_popup + """
</script>
<script>
""" + app + """
</script>
</body>
</html>
"""

    out_path = os.path.join(BASE, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("index.html 갱신 완료:", len(html), "바이트")


def build_admin():
    """admin.html도 index.html과 동일한 이유로 CSS/JS를 전부 내장한
    독립 실행형 파일로 만듭니다. (외부 파일을 읽지 못하는 환경에서
    관리자 페이지가 빈 화면이나 "암호가 작동하지 않는" 상태로 보이는
    문제를 근본적으로 피하기 위함)"""
    admin_css = read("css/admin.css")
    firebase_config = read("js/firebase-config.js")
    community_translations = read("js/community-translations.js")
    admin_js = read("js/admin.js")
    admin_community = read("js/admin-community.js")
    admin_popup = read("js/admin-popup.js")

    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>관리자 - 메뉴 평가 통계</title>
<meta name="robots" content="noindex, nofollow">
<!-- 커뮤니티 탭에서 벵골어·미얀마어 게시글 원문/번역을 볼 때 깨지지
     않도록 같은 웹폰트를 불러옵니다(필요한 굵기 400/700만). -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;700&family=Noto+Sans+Myanmar:wght@400;700&display=swap">
<style>
""" + admin_css + """
</style>
</head>
<body>

<div class="admin-gate" id="adminGate">
  <h1>관리자 로그인</h1>
  <form id="adminGateForm">
    <input type="password" id="adminGateInput" placeholder="암호를 입력하세요" autocomplete="current-password">
    <p class="error" id="adminGateError"></p>
    <button type="submit">확인</button>
  </form>
  <p class="note">천원의 아침밥 메뉴 평가 · 언어 통계 · 주간메뉴 관리를 위한 내부 페이지입니다.</p>
</div>

<div id="adminApp" hidden>
  <header class="admin-header">
    <h1 class="admin-title">모인관 관리자 페이지</h1>
    <p class="admin-sub">평가 통계, 언어 통계, 주간메뉴를 관리합니다.</p>
    <nav class="admin-nav" id="adminNav">
      <button type="button" class="admin-nav-btn active" data-page="dashboard">대시보드</button>
      <button type="button" class="admin-nav-btn" data-page="ratings">메뉴 평가</button>
      <button type="button" class="admin-nav-btn" data-page="language">언어 통계</button>
      <button type="button" class="admin-nav-btn" data-page="hellokorean">한국어 학습</button>
      <button type="button" class="admin-nav-btn" data-page="weeklymenu">주간메뉴 관리</button>
      <button type="button" class="admin-nav-btn" data-page="community">커뮤니티</button>
      <button type="button" class="admin-nav-btn" data-page="popup">팝업 관리</button>
    </nav>
  </header>

  <main class="admin-main">
    <p class="admin-warn" id="adminFirebaseWarning" hidden>
      ⚠ Firebase가 아직 연결되지 않았습니다. js/firebase-config.js에 실제 프로젝트 값을
      입력하기 전까지는 통계에 표시되는 데이터가 없습니다. (학생 화면은 정상 작동합니다.)
    </p>

    <!-- ================= 대시보드 ================= -->
    <section class="admin-page" id="pageDashboard">
      <div class="admin-card">
        <h2>오늘 한눈에 보기</h2>
        <div class="stat-grid">
          <div class="stat-box">
            <p class="stat-label">오늘 접속자</p>
            <p class="stat-value" id="dashVisitors">-</p>
            <p class="stat-sub">언어 통계 기준 고유 기기 수</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">평가 참여</p>
            <p class="stat-value" id="dashRatingParticipants">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">평균평점</p>
            <p class="stat-value" id="dashAvgRating">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">최다 선택 언어</p>
            <p class="stat-value" id="dashTopLang">-</p>
          </div>
        </div>
      </div>

      <div class="admin-card">
        <h2>오늘 평가 분포</h2>
        <div class="dist-list" id="dashRatingDistList"></div>
      </div>

      <div class="admin-card">
        <h2>오늘 언어 선택 분포</h2>
        <div class="dist-list" id="dashLangDistList"></div>
      </div>

      <div class="admin-card">
        <h2>최근 7일 접속자 추이</h2>
        <svg class="trend-chart" id="dashVisitorTrend"></svg>
        <p class="trend-caption">가로축 최근 7일(MM/DD)</p>
      </div>
    </section>

    <!-- ================= 메뉴 평가 ================= -->
    <section class="admin-page" id="pageRatings" hidden>
      <div class="admin-card">
        <h2>오늘 평가</h2>
        <div class="stat-grid">
          <div class="stat-box">
            <p class="stat-label">참여자</p>
            <p class="stat-value" id="todayParticipants">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">평균평점</p>
            <p class="stat-value" id="todayAvg">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">긍정평가</p>
            <p class="stat-value" id="todayPositive">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">부정평가</p>
            <p class="stat-value" id="todayNegative">-</p>
          </div>
        </div>
        <div class="dist-list" id="todayDistList"></div>
      </div>

      <div class="admin-card">
        <h2>기간 선택</h2>
        <div class="filter-bar">
          <button type="button" class="filter-btn active" data-filter="today">오늘</button>
          <button type="button" class="filter-btn" data-filter="7d">최근 7일</button>
          <button type="button" class="filter-btn" data-filter="month">이번 달</button>
          <button type="button" class="filter-btn" data-filter="custom">날짜 직접 선택</button>
        </div>
        <div class="filter-range" id="customRange" hidden>
          <input type="date" id="customStartInput">
          <span>~</span>
          <input type="date" id="customEndInput">
          <button type="button" class="filter-apply-btn" id="customRangeApply">적용</button>
        </div>
      </div>

      <div class="admin-card">
        <h2>날짜별 결과</h2>
        <p class="loading-note" id="tableLoading">불러오는 중...</p>
        <p class="empty-note" id="tableEmpty" hidden></p>
        <div class="table-scroll">
          <table class="results-table" id="resultsTable">
            <thead>
              <tr>
                <th>날짜</th>
                <th>오늘의 메뉴</th>
                <th>평가수</th>
                <th>평균평점</th>
                <th>5점</th>
                <th>4점</th>
                <th>3점</th>
                <th>2점</th>
                <th>1점</th>
              </tr>
            </thead>
            <tbody id="resultsTableBody"></tbody>
          </table>
        </div>
      </div>

      <div class="admin-card">
        <h2>선택 날짜 (<span id="selectedDateLabel">-</span>) 평가 분포</h2>
        <div class="dist-list" id="selectedDistList"></div>
      </div>

      <div class="admin-card">
        <h2>최근 7일 평균평점 변화</h2>
        <svg class="trend-chart" id="trendChart"></svg>
        <p class="trend-caption">세로축 0~5점, 가로축 최근 7일(MM/DD)</p>
      </div>

      <div class="admin-card">
        <h2>최근 30일 평균평점 변화</h2>
        <svg class="trend-chart" id="trendChart30"></svg>
        <p class="trend-caption">세로축 0~5점, 가로축 최근 30일</p>
      </div>
    </section>

    <!-- ================= 언어 통계 ================= -->
    <section class="admin-page" id="pageLanguage" hidden>
      <div class="admin-card">
        <h2>기간 선택</h2>
        <div class="filter-bar">
          <button type="button" class="filter-btn active" data-filter="today">오늘</button>
          <button type="button" class="filter-btn" data-filter="7d">최근 7일</button>
          <button type="button" class="filter-btn" data-filter="month">이번 달</button>
          <button type="button" class="filter-btn" data-filter="custom">날짜 직접 선택</button>
        </div>
        <div class="filter-range" id="langCustomRange" hidden>
          <input type="date" id="langCustomStartInput">
          <span>~</span>
          <input type="date" id="langCustomEndInput">
          <button type="button" class="filter-apply-btn" id="langCustomRangeApply">적용</button>
        </div>
      </div>

      <div class="admin-card">
        <h2>언어별 통계</h2>
        <p class="loading-note" id="langLoading">불러오는 중...</p>
        <p class="empty-note" id="langEmpty" hidden></p>
        <div class="dist-list" id="langDistList"></div>
      </div>
    </section>

    <!-- ================= 한국어 학습 사이트(hellokorean.site) 연결 통계 ================= -->
    <section class="admin-page" id="pageHelloKorean" hidden>
      <div class="admin-card">
        <h2>한국어 학습 사이트 연결 통계</h2>
        <div class="stat-grid">
          <div class="stat-box">
            <p class="stat-label">오늘 클릭 수</p>
            <p class="stat-value" id="hkTodayClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">어제 클릭 수</p>
            <p class="stat-value" id="hkYesterdayClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">이번 주 클릭 수</p>
            <p class="stat-value" id="hkWeekClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">이번 달 클릭 수</p>
            <p class="stat-value" id="hkMonthClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">전체 클릭 수</p>
            <p class="stat-value" id="hkTotalClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">모바일 클릭 수</p>
            <p class="stat-value" id="hkMobileClicks">-</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">PC 클릭 수</p>
            <p class="stat-value" id="hkPcClicks">-</p>
          </div>
        </div>
        <p class="loading-note" id="hkSummaryLoading">불러오는 중...</p>
      </div>

      <div class="admin-card">
        <h2>기간 선택</h2>
        <div class="filter-bar">
          <button type="button" class="filter-btn active" data-hk-filter="today">오늘</button>
          <button type="button" class="filter-btn" data-hk-filter="7d">최근 7일</button>
          <button type="button" class="filter-btn" data-hk-filter="30d">최근 30일</button>
          <button type="button" class="filter-btn" data-hk-filter="all">전체</button>
        </div>
      </div>

      <div class="admin-card">
        <h2>언어별 클릭 통계</h2>
        <p class="loading-note" id="hkLangLoading">불러오는 중...</p>
        <p class="empty-note" id="hkLangEmpty" hidden></p>
        <div class="dist-list" id="hkLangDistList"></div>
      </div>

      <div class="admin-card">
        <h2>날짜별 클릭 수</h2>
        <p class="empty-note" id="hkTrendEmpty" hidden></p>
        <svg class="trend-chart" id="hkTrendChart"></svg>
        <p class="trend-caption" id="hkTrendCaption"></p>
      </div>
    </section>

    <!-- ================= 주간메뉴 관리 ================= -->
    <section class="admin-page" id="pageWeeklyMenu" hidden>
      <div class="admin-card">
        <h2>관리자 로그인 (주간메뉴 등록·수정 권한)</h2>
        <p class="empty-note" style="padding:0 0 10px;">통계를 보는 암호와는 별개입니다. 주간메뉴를 등록·수정·삭제하거나 이미지를 업로드하려면 아래에서 관리자 계정으로 로그인해야 합니다.</p>
        <div id="weeklyAuthSignedOut">
          <form class="weekly-auth-box" id="weeklyAuthForm">
            <input type="email" id="weeklyAuthEmail" placeholder="관리자 이메일" autocomplete="username">
            <input type="password" id="weeklyAuthPassword" placeholder="비밀번호" autocomplete="current-password">
            <button type="submit">로그인</button>
          </form>
          <p class="form-error" id="weeklyAuthError"></p>
        </div>
        <div id="weeklyAuthSignedIn" hidden>
          <div class="weekly-auth-status">
            <span>로그인됨: <span class="signed-in-email" id="weeklyAuthEmailLabel"></span></span>
            <button type="button" id="weeklyAuthSignOutBtn">로그아웃</button>
          </div>
        </div>
      </div>

      <div class="admin-card" id="weeklyMenuLockedNote" hidden>
        <p>주간메뉴를 등록·수정하려면 먼저 위에서 관리자 계정으로 로그인해야 합니다.</p>
      </div>

      <div id="weeklyMenuEditorArea" hidden>
        <p class="autosave-notice" id="weekAutosaveNotice" hidden>
          <span class="autosave-text"></span>
          <button type="button" class="autosave-discard-btn" id="weekAutosaveDiscardBtn">새로 시작(복원 취소)</button>
        </p>

        <div class="admin-card">
          <h2>주 선택</h2>
          <div class="week-select-bar">
            <label for="weekStartInput">주 시작일(월요일)</label>
            <input type="date" id="weekStartInput">
            <button type="button" class="filter-apply-btn" id="weekLoadBtn">이 주 불러오기</button>
          </div>
        </div>

        <div class="admin-card">
          <h2>방식 1 · 이미지로 자동 인식</h2>
          <p class="image-upload-caption">주간메뉴표 스크린샷을 올리면 월~금 날짜와 일반식·간편식 메뉴를 자동으로 읽어 아래 표에 채워줍니다. 결과는 게시 전에 반드시 확인·수정할 수 있습니다. (jpg, jpeg, png, webp / 최대 10MB) 이미지 분석이 안 되더라도 방식 2로 바로 입력해 게시할 수 있습니다.</p>
          <div class="image-upload-box">
            <div class="image-upload-row">
              <input type="file" id="weekImageInput" accept="image/jpeg,image/jpg,image/png,image/webp">
              <button type="button" class="image-upload-btn" id="weekAnalyzeBtn">이미지 분석하기</button>
            </div>
            <div class="image-preview-wrap" id="weekImagePreviewWrap" hidden>
              <img id="weekImagePreviewImg" alt="주간메뉴 이미지 미리보기">
            </div>
            <p class="form-error" id="weekImageError"></p>
            <p class="analyze-status" id="weekAnalyzeStatus" hidden></p>
            <div class="analyze-fail-actions" id="weekAnalyzeFailActions" hidden>
              <button type="button" id="weekAnalyzeRetryBtn">다시 분석</button>
              <button type="button" id="weekSwitchToManualBtn">직접 입력으로 전환</button>
              <button type="button" id="weekReselectImageBtn">이미지 다시 선택</button>
            </div>
          </div>
        </div>

        <div class="admin-card">
          <h2>방식 2 · 직접 입력 / 인식 결과 확인</h2>
          <p class="image-upload-caption">요일 카드는 일반식·간편식 두 목록으로 나뉩니다. 자동 인식 결과가 여기에 채워지며, 직접 입력하거나 엑셀에서 복사한 내용을 붙여넣기 칸에 넣고 "붙여넣기 적용"을 눌러 채울 수도 있습니다(1번째 칸=일반식, 탭으로 구분된 2번째 칸=간편식). <span class="uncertain-legend">빨간 배경 = 확인 필요</span>한 항목이니 원본과 대조해서 고쳐주세요. 이미지 분석 없이 여기에 바로 입력해도 됩니다.</p>
          <p class="retranslate-note" id="weekRetranslateNote" hidden>이 주에 번역이 안 된 메뉴가 있습니다 — 아래 "저장 / 게시" 카드의 "번역 다시 실행"을 눌러주세요.</p>
          <div class="week-day-grid" id="weekDayGrid"></div>
        </div>

        <div class="admin-card">
          <h2>저장 / 게시</h2>
          <p class="image-upload-caption">"임시저장"은 학생 화면에 반영되지 않고 이어서 수정할 수 있게만 저장합니다. "번역 확인"을 눌러 5개 언어 번역 결과(또는 번역 대기 상태)를 확인한 뒤 "게시 확정"을 누르면 학생 화면에 반영됩니다. 번역 서버에 문제가 있어도 한글 메뉴만으로 게시할 수 있습니다.</p>
          <div class="week-publish-actions">
            <button type="button" class="week-draft-btn" id="weekSaveDraftBtn">임시저장</button>
            <button type="button" class="week-translate-btn" id="weekTranslateCheckBtn">번역 확인</button>
            <button type="button" class="week-publish-btn" id="weekPublishConfirmBtn" disabled>게시 확정</button>
            <button type="button" class="week-retranslate-btn" id="weekRetranslateBtn">번역 다시 실행</button>
            <button type="button" class="week-delete-all-btn" id="weekDeleteAllBtn">이 주 전체 삭제</button>
          </div>
          <div class="translate-review" id="weekTranslateReview"></div>
          <p class="publish-status" id="weekPublishStatus" hidden></p>
        </div>
      </div>
    </section>

    <!-- ================= 유학생 커뮤니티 관리 ================= -->
    <section class="admin-page" id="pageCommunity" hidden>
      <div class="admin-card">
        <p class="empty-note" style="padding:0 0 10px;">이 화면의 "숨김/공개/삭제/정지" 등 작업은 위 "주간메뉴 관리"에서
          로그인한 계정으로 실행됩니다. 그 계정의 커뮤니티 회원 문서(role)가 "admin"이 아니면
          Firestore 보안 규칙이 저장을 거부합니다 — 회원가입을 먼저 마친 뒤 Firebase 콘솔에서
          해당 계정의 communityUsers 문서 role을 "admin"으로 바꿔주세요.</p>
        <nav class="filter-bar" id="commAdminSubNav">
          <button type="button" class="filter-btn active" id="commAdminTabStats">통계</button>
          <button type="button" class="filter-btn" id="commAdminTabPosts">게시글 관리</button>
          <button type="button" class="filter-btn" id="commAdminTabUsers">회원관리</button>
          <button type="button" class="filter-btn" id="commAdminTabTranslations">번역관리</button>
        </nav>
      </div>

      <div class="admin-card" id="commAdminPageStats">
        <h2>커뮤니티 통계</h2>
        <div class="filter-bar" id="commAdminStatsPeriodBar">
          <button type="button" class="filter-btn active" data-period="today">오늘</button>
          <button type="button" class="filter-btn" data-period="7d">최근 7일</button>
          <button type="button" class="filter-btn" data-period="30d">최근 30일</button>
          <button type="button" class="filter-btn" data-period="all">전체</button>
        </div>
        <div id="commAdminStatsBody"></div>
      </div>

      <div class="admin-card" id="commAdminPagePosts" hidden>
        <h2>게시글 관리</h2>
        <div class="table-scroll" id="commAdminPostsBody"></div>
      </div>

      <div class="admin-card" id="commAdminPageUsers" hidden>
        <h2>회원관리</h2>
        <div class="table-scroll" id="commAdminUsersBody"></div>
      </div>

      <div class="admin-card" id="commAdminPageTranslations" hidden>
        <h2>번역관리(번역 실패한 게시글)</h2>
        <div id="commAdminTranslationsBody"></div>
      </div>
    </section>

    <!-- ================= 팝업 관리 ================= -->
    <section class="admin-page" id="pagePopup" hidden>
      <div class="admin-card">
        <p class="empty-note" style="padding:0 0 10px;">팝업을 등록·수정·삭제하려면 먼저 "주간메뉴 관리" 탭에서
          관리자 계정으로 로그인해야 합니다(같은 로그인을 그대로 씁니다). 이 단계는 팝업을
          등록해 두는 화면까지만이며, 학생 화면에 실제로 팝업을 띄우는 기능은 다음 단계에서 연결합니다.</p>
      </div>

      <div class="admin-card">
        <h2 id="popupFormTitle">팝업 등록</h2>
        <form class="weekly-auth-box" id="popupForm" style="max-width:420px;">
          <label for="popupTitleInput">팝업 제목</label>
          <input type="text" id="popupTitleInput" maxlength="60">

          <label for="popupImageInput">팝업 이미지</label>
          <div class="image-upload-box">
            <div class="image-upload-row">
              <input type="file" id="popupImageInput" accept="image/jpeg,image/jpg,image/png,image/webp">
            </div>
            <div class="image-preview-wrap" id="popupImagePreviewWrap" hidden>
              <img id="popupImagePreviewImg" alt="팝업 이미지 미리보기">
            </div>
            <p class="form-error" id="popupImageError"></p>
          </div>

          <label for="popupLinkInput">링크 URL(선택)</label>
          <input type="url" id="popupLinkInput" placeholder="https://...">

          <label class="week-open-toggle"><input type="checkbox" id="popupActiveInput" checked> 사용함(ON)</label>

          <label for="popupStartInput">시작일시(선택)</label>
          <input type="datetime-local" id="popupStartInput">

          <label for="popupEndInput">종료일시(선택)</label>
          <input type="datetime-local" id="popupEndInput">

          <button type="submit" id="popupSaveBtn">등록</button>
          <button type="button" id="popupCancelEditBtn" hidden>새로 등록으로 취소</button>
        </form>
        <p class="publish-status" id="popupFormStatus" hidden></p>
      </div>

      <div class="admin-card">
        <h2>등록된 팝업</h2>
        <div class="table-scroll" id="popupListBody"></div>
      </div>
    </section>
  </main>
</div>

<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-storage-compat.js"></script>
<script>
""" + firebase_config + """
</script>
<script>
""" + community_translations + """
</script>
<script>
""" + admin_js + """
</script>
<script>
""" + admin_community + """
</script>
<script>
""" + admin_popup + """
</script>
</body>
</html>
"""

    out_path = os.path.join(BASE, "admin.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("admin.html 갱신 완료:", len(html), "바이트")


if __name__ == "__main__":
    build()
    build_admin()

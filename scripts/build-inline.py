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
  js/firebase-config.js, js/breakfast-rating.js,
  css/admin.css, js/admin.js
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
    app = read("js/app.js")

    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>모인관(인제대학교)</title>
<meta name="description" content="인제대학교 모인관 - 밥심, 만권화밥, 후루룩찹찹 온라인 메뉴판">

<!-- 홈 화면 추가(PWA) 아이콘 -->
<link rel="manifest" href="./manifest.json">
<link rel="icon" type="image/png" sizes="32x32" href="./images/icon/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="./images/icon/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="./images/icon/apple-touch-icon.png">
<meta name="theme-color" content="#1957d6">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="모인관">
<style>
""" + css + """
</style>
</head>
<body>

<header class="site-header">
  <div class="header-top">
    <h1 class="site-title" id="siteTitle">모인관(인제대학교)</h1>
    <div class="lang-select" role="group" aria-label="언어 선택" id="langSelect">
      <button type="button" class="lang-btn" data-lang="ko" aria-label="한국어">한국어</button>
      <span class="lang-sep" aria-hidden="true">|</span>
      <button type="button" class="lang-btn" data-lang="zh" aria-label="中文">中文</button>
      <span class="lang-sep" aria-hidden="true">|</span>
      <button type="button" class="lang-btn" data-lang="vi" aria-label="Tiếng Việt">Tiếng Việt</button>
      <span class="lang-sep" aria-hidden="true">|</span>
      <button type="button" class="lang-btn" data-lang="en" aria-label="English">English</button>
      <span class="lang-sep" aria-hidden="true">|</span>
      <button type="button" class="lang-btn" data-lang="mn" aria-label="Монгол">Монгол</button>
    </div>
  </div>
  <nav class="store-tabs" id="storeTabs" aria-label="매장 선택">
    <button type="button" class="store-tab" data-store="bapsim">밥심<br>1층</button>
    <button type="button" class="store-tab" data-store="mangwon">만권화밥<br>1층</button>
    <button type="button" class="store-tab" data-store="hururuk">후루룩찹찹<br>2층</button>
  </nav>
</header>

<div class="cola-banner" id="colaBanner" hidden>
  <img class="cola-banner-icon" src="images/bapsim/cola.jpg" alt="" aria-hidden="true">
  <div class="cola-banner-text">
    <p class="cola-banner-title" id="colaBannerTitle">🎁 무료 콜라 쿠폰</p>
    <p class="cola-banner-subtitle" id="colaBannerSubtitle">음식 주문하고 콜라 1캔 무료로 받으세요!</p>
  </div>
  <button type="button" class="cola-banner-btn" id="colaBannerBtn">쿠폰 보기</button>
</div>

<main>
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

    <div class="ba-rating" id="baRating" hidden>
      <h4 class="ba-rating-title" id="baRatingTitle"></h4>
      <div class="ba-rating-options" id="baRatingOptions" role="group"></div>
      <p class="ba-rating-message" id="baRatingMessage" aria-live="polite" hidden></p>
    </div>

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

<script>
""" + translations + """
</script>
<script>
""" + menu_data + """
</script>
<script>
""" + weekly_menu + """
</script>

<!-- "오늘의 메뉴 평가" 기능이 사용하는 Firestore(DB) SDK.
     js/firebase-config.js에 실제 프로젝트 값을 넣기 전까지는 평가 데이터가
     각 학생의 기기에만 저장되며, 이 화면의 다른 기능에는 영향을 주지 않습니다. -->
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js"></script>
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
    admin_js = read("js/admin.js")

    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>관리자 - 메뉴 평가 통계</title>
<meta name="robots" content="noindex, nofollow">
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
      <button type="button" class="admin-nav-btn" data-page="weeklymenu">주간메뉴 관리</button>
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
""" + admin_js + """
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

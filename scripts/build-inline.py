"""
css/style.css, js/translations.js, js/menu-data.js, js/app.js 파일을
index.html 안에 <style>/<script>로 직접 합쳐 넣는 스크립트입니다.

왜 필요한가:
  일부 미리보기 환경(iframe, 샌드박스 등)에서는 <link>나
  <script src="...">로 불러오는 외부 파일을 읽지 못해 CSS와 JS가
  전혀 적용되지 않는 문제가 있었습니다. 이를 근본적으로 피하기 위해
  실제 배포용 index.html은 외부 파일을 참조하지 않고
  CSS/JS를 전부 내장한 "독립 실행형" 파일로 만듭니다.

사용법:
  메뉴, 번역, 동작, 디자인을 수정할 때는
  css/style.css, js/translations.js, js/menu-data.js, js/app.js,
  js/firebase-config.js, js/breakfast-rating.js
  이 원본 파일들만 수정하고, 그 다음 아래 명령을 실행하세요.

      python3 scripts/build-inline.py

  실행하면 index.html이 최신 내용으로 자동 갱신됩니다.
  (이 스크립트는 배포에 필요한 빌드 과정이 아니라,
   로컬에서 편집을 도와주는 선택적 도구입니다.
   Netlify에는 이미 완성된 index.html만 그대로 올리면 됩니다.)
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
    app = read("js/app.js")

    html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>푸드홀(인제대학교)</title>
<meta name="description" content="인제대학교 푸드홀 - 밥심, 만권화밥, 후루룩찹찹 온라인 메뉴판">

<!-- 홈 화면 추가(PWA) 아이콘 -->
<link rel="manifest" href="./manifest.json">
<link rel="icon" type="image/png" sizes="32x32" href="./images/icon/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="./images/icon/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="./images/icon/apple-touch-icon.png">
<meta name="theme-color" content="#1957d6">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="푸드홀">
<style>
""" + css + """
</style>
</head>
<body>

<header class="site-header">
  <div class="header-top">
    <h1 class="site-title" id="siteTitle">푸드홀(인제대학교)</h1>
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

    <button type="button" class="ba-view-original-btn" id="baViewOriginalBtn" hidden>주간 메뉴 원본 보기</button>

    <div class="ba-rating" id="baRating" hidden>
      <h4 class="ba-rating-title" id="baRatingTitle"></h4>
      <div class="ba-rating-options" id="baRatingOptions" role="group"></div>
      <p class="ba-rating-message" id="baRatingMessage" aria-live="polite" hidden></p>
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

<!-- 주간 메뉴 원본 이미지 팝업 -->
<div class="modal-overlay" id="weeklyImageOverlay" hidden>
  <div class="modal weekly-image-modal" role="dialog" aria-modal="true" aria-label="주간 메뉴 원본 이미지">
    <button type="button" class="modal-close" id="weeklyImageClose" aria-label="닫기">×</button>
    <img id="weeklyImageImg" src="" alt="">
  </div>
</div>

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
""" + app + """
</script>
</body>
</html>
"""

    out_path = os.path.join(BASE, "index.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("index.html 갱신 완료:", len(html), "바이트")


if __name__ == "__main__":
    build()

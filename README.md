# 푸드홀(인제대학교) 온라인 메뉴판

밥심 · 만권화밥 · 후루룩찹찹 3개 매장의 메뉴를 소개하는 정적 홈페이지입니다.
HTML / CSS / 순수 JavaScript만 사용했으며, 별도의 빌드 과정 없이 그대로 Netlify에 올리면 됩니다.

## 1. 로컬에서 확인하는 방법

`index.html`은 CSS와 JavaScript를 전부 내장한 **독립 실행형 파일**입니다.
별도의 css/js 파일을 불러오지 못하는 미리보기 환경에서도 깨지지 않도록,
`index.html` 파일 하나만 열어도 정상적으로 작동합니다.

브라우저에서 `index.html`을 더블클릭해서 바로 열어도 됩니다.
(로컬 서버가 있다면 아래처럼 실행해도 됩니다.)

```bash
cd 프로젝트폴더
python3 -m http.server 8000
```

이후 브라우저에서 `http://localhost:8000` 접속.

## 2. GitHub 업로드 방법

```bash
cd 프로젝트폴더
git init
git add .
git commit -m "init: 푸드홀 메뉴판"
git branch -M main
git remote add origin <본인의 GitHub 저장소 주소>
git push -u origin main
```

## 3. Netlify와 GitHub 연결 방법

1. [Netlify](https://app.netlify.com)에 로그인 후 `Add new site` → `Import an existing project` 선택
2. GitHub 계정 연결 후 방금 올린 저장소 선택
3. Build command는 비워두고, Publish directory는 `.`(루트)로 지정
   (이미 `netlify.toml`에 설정되어 있어 자동으로 인식됩니다)
4. `Deploy site` 클릭

## 4. 자동 배포 방법

위 방식으로 한 번 연결해두면, 이후 GitHub 저장소의 `main` 브랜치에
`git push`만 하면 Netlify가 자동으로 다시 배포합니다.

## 5. 메뉴 가격 수정 위치

`js/menu-data.js` 파일에서 수정하려는 메뉴의 `price` 값을 숫자로 바꾸면 됩니다.

```js
price: 7500,   // 이 숫자만 바꾸면 화면에 "7,500원"으로 자동 표시됩니다.
```

## 6. 품절 상태 수정 위치

같은 파일(`js/menu-data.js`)에서 해당 메뉴의 `soldOut` 값을 바꾸면 됩니다.

```js
soldOut: true,   // 품절일 때
soldOut: false,  // 판매 중일 때
```

## 7. 수정 후 index.html에 반영하는 방법

`index.html`은 `css/style.css`, `js/translations.js`, `js/menu-data.js`,
`data/breakfast-weekly-menu.js`, `js/app.js`의 내용을 그대로 담고 있는
독립 실행형 파일입니다.

위 파일 중 하나라도 수정했다면, 아래 명령을 한 번 실행해서
`index.html`에 최신 내용을 다시 합쳐 넣어야 화면에 반영됩니다.

```bash
python3 scripts/build-inline.py
```

실행 후 `index.html`을 다시 열어 확인하세요.
(이 스크립트는 배포에 필요한 빌드 과정이 아니라 로컬 편집을 돕는
선택적 도구입니다. Netlify에는 완성된 `index.html`만 그대로 올리면 됩니다.)

## 8. 천원의 아침밥 — 주간 메뉴 매주 업데이트 방법

밥심 화면의 "천원의 아침밥" 탭에는 오늘 날짜(한국 표준시 기준)에 해당하는
아침 메뉴만 자동으로 표시됩니다. 매주 다음 순서만 반복하면 됩니다.

1. 새로 받은 엑셀 주간 메뉴 스크린샷을 `images/breakfast/` 폴더에 저장합니다.
   (파일명 예시: `2026-09-07-weekly-menu.jpg`)
2. Claude(또는 Claude Code)에게 아래 문구와 함께 스크린샷을 첨부해서 전달합니다.

   > 첨부한 엑셀 주간 메뉴 스크린샷을 확인하고 천원의 아침밥 메뉴 데이터를
   > 업데이트해라. 메뉴명, 날짜, 요일, 메뉴 순서를 원본 그대로 입력하고
   > 추측하거나 메뉴명을 바꾸지 마라. 스크린샷은 주간 메뉴 원본 이미지로
   > 저장하고, 홈페이지에는 한국시간을 기준으로 오늘 메뉴만 글자로
   > 표시되게 해라. 기존 디자인과 다른 기능은 변경하지 말고 완료 후
   > 날짜별 입력 내용을 보고해라.

3. `data/breakfast-weekly-menu.js` 파일만 수정됩니다. (다른 화면 코드는
   건드릴 필요가 없습니다.)
4. `python3 scripts/build-inline.py` 실행 → `index.html` 갱신
5. Netlify에 배포
6. 월요일부터 금요일까지 날짜별로 메뉴가 정확히 나오는지 확인

`data/breakfast-weekly-menu.js` 데이터 구조:

```js
const BREAKFAST_WEEKLY_MENU = {
  weekStart: "2026-09-07",
  weekEnd: "2026-09-11",
  sourceImage: "images/breakfast/2026-09-07-weekly-menu.jpg",
  days: {
    "2026-09-08": {
      rice: { ko: "쌀밥" },
      soup: { ko: "콩나물국" },
      main: { ko: "돼지불고기" },
      side1: { ko: "계란말이" },
      side2: { ko: "콩나물무침" },
      kimchi: { ko: "배추김치" }
    }
    // 날짜별로 계속 추가
  }
};
```

- 각 항목은 `{ ko: "..." }`만 있어도 정상 작동합니다 (다른 언어는 자동으로
  한글로 대체 표시됩니다). 번역까지 넣고 싶으면 `en` / `zh` / `vi` / `mn`
  키를 추가하면 됩니다.
- 데이터가 없는 날(주말 등)은 화면에 "오늘은 운영하지 않습니다" 문구가
  자동으로 표시됩니다.
- `sourceImage`가 없으면 "주간 메뉴 원본 보기" 버튼 자체가 화면에
  나타나지 않습니다.

---

## 9. 천원의 아침밥 — 오늘의 메뉴 평가 (신규)

학생이 "천원의 아침밥 → 오늘의 메뉴" 화면에서 캐릭터 하나를 터치하면
별도 버튼 없이 즉시 만족도가 저장되는 기능입니다. 같은 기기에서는
하루(한국시간 기준) 1회만 평가할 수 있습니다.

### 9-1. Firebase 프로젝트 연결 (필수 — 아직 미연결 상태)

평가 데이터를 여러 학생 기기에서 모아 관리자 페이지에서 통계로 보려면
Firebase(Firestore)가 필요합니다. `js/firebase-config.js` 파일 맨 위 주석에
설정 순서가 적혀 있습니다. 요약하면:

1. https://console.firebase.google.com 에서 새 프로젝트 생성
2. Firestore Database 생성 (프로덕션 모드, 서울 리전 권장)
3. Firestore 규칙을 `js/firebase-config.js` 주석에 적힌 대로 설정
   (breakfastRatings 컬렉션에 rating 1~5 유효성 검사가 있는 생성만 허용)
4. 웹 앱을 추가하고 발급되는 6개 값을 `js/firebase-config.js`의
   `FIREBASE_CONFIG` 객체에 그대로 옮겨 적기
5. `python3 scripts/build-inline.py` 실행 후 재배포

**연결 전에도 학생 화면은 정상 작동합니다.** 평가를 누르면 그 기기의
브라우저(localStorage)에만 하루 1회 제한이 적용되고 "감사합니다!"가
표시되지만, 관리자 페이지 통계에는 집계되지 않습니다.

### 9-2. 관리자 페이지

`admin.html`을 열면 통계를 확인할 수 있습니다. (기본 임시 암호:
`foodhall2026` — `js/admin.js` 맨 위 `ADMIN_PASSPHRASE` 값을 바꾼 뒤
`python3 scripts/build-inline.py`를 다시 실행해서 꼭 변경하세요.
이 암호는 화면 접근을 막는 최소한의 장치일 뿐, 실제 보안은
Firestore 보안 규칙이 담당합니다.)

`admin.html`도 `index.html`과 마찬가지로 CSS/JS를 전부 내장한
독립 실행형 파일입니다. `css/admin.css`, `js/admin.js`를 수정했다면
`python3 scripts/build-inline.py`를 실행해야 `admin.html`에 반영됩니다
(직접 `admin.html`을 열어서 수정하지 마세요 — 다음 빌드 때 덮어써집니다).

- 오늘 평가(참여자·평균평점·긍정평가·5단계 분포)
- 기간 선택(오늘 / 최근 7일 / 이번 달 / 날짜 직접 선택)에 따른 날짜별 결과 표
- 표에서 날짜를 클릭하면 그 날짜의 5단계 분포 그래프로 전환
- 최근 7일 평균평점 변화 추이 그래프

식사인원 대비 평가 참여율은 이 저장소에 기존 방문자/식사인원 집계
기능이 없어 구현하지 않았습니다. (임의로 만든 데이터를 쓰지 않기 위함
— 필요하시면 별도로 방문자 집계 기능부터 추가해 드릴 수 있습니다.)

### 9-3. 관련 파일

- `js/breakfast-rating.js` : 학생용 평가 위젯(캐릭터 SVG, 저장, 하루 1회 제한)
- `js/firebase-config.js` : Firebase 연결 설정 (이 파일의 값만 채우면 됨)
- `admin.html`, `js/admin.js`, `css/admin.css` : 관리자 통계 페이지
- `js/translations.js`의 `BREAKFAST_RATING_TEXT` : 평가 화면 다국어 문구
  (한국어/영어/중국어/베트남어/몽골어)

---

### 참고

- `js/translations.js` : 매장명, 버튼, 안내 문구 등 공통 UI 번역
- `images/kiosk-reference/` : 원본 키오스크 사진 6장 (홈페이지에는 직접 노출되지 않음, 확인용)
- `images/breakfast/` : 매주 받는 엑셀 주간 메뉴 스크린샷 원본 보관 폴더
- `data/breakfast-weekly-menu.js` : 천원의 아침밥 주간 메뉴 데이터 (매주 이 파일만 수정)
- `images/icon/` : 홈 화면 추가(PWA) 아이콘 모음 (favicon, apple-touch-icon, 안드로이드 아이콘)
- `manifest.json` : 홈 화면 추가 시 사용할 이름·아이콘·테마색 설정 파일
- `scripts/extract-menu-images.py` : 원본 사진에서 음식 이미지를 잘라낸 1회성 스크립트 (홈페이지 동작에는 필요 없음)
- `needsReview: true`로 표시된 메뉴는 원본 사진과 지시서 내용이 다르게 보이거나 확인이 필요한 항목입니다.

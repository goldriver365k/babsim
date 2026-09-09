/* ==========================================================================
   Firebase 프로젝트 연결 설정
   - babsim-46284 프로젝트 값으로 연결되어 있습니다 (2026-09-09 연동 완료).
   - Firestore(DB)는 학생 화면(천원의 아침밥 평가, 언어 통계, 주간메뉴)과
     관리자 페이지가 함께 사용합니다.
   - Firebase Authentication과 Storage는 관리자 페이지의 "주간메뉴 관리"
     (이미지 업로드, 직접 입력 저장/수정/삭제)에서만 사용합니다.
     학생 화면(index.html)은 이 둘을 전혀 불러오지 않습니다(가벼운 상태 유지).

   ⚠ Firestore 보안 규칙 — 아래 규칙 전체를 Firebase 콘솔의
   Firestore Database → "규칙" 탭에 그대로 붙여넣어야 합니다.
   (컬렉션마다 허용 범위가 다르므로 하나라도 빠지면 그 기능이 막힙니다.)

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {

          // 천원의 아침밥 평가 (학생이 직접 씀, 누구나 생성만 가능)
          match /breakfastRatings/{docId} {
            allow create: if request.resource.data.rating is int
              && request.resource.data.rating >= 1
              && request.resource.data.rating <= 5
              && request.resource.data.date is string
              && request.resource.data.keys().hasAll(['date','menuId','rating','language','deviceId']);
            allow read: if true;   // 관리자 페이지 통계 조회용
            allow update, delete: if false;
          }

          // 언어 선택 통계 (학생 화면이 방문/언어변경 시 자동 기록)
          // 문서 ID를 "날짜_기기ID"로 고정해서 하루 1기기당 문서 1개만
          // 남도록 하고(=최종 선택 언어로 덮어쓰기), 방문자 수 집계에도 씁니다.
          match /languageStats/{docId} {
            allow create, update: if request.resource.data.language is string
              && request.resource.data.date is string
              && request.resource.data.deviceId is string
              && docId == request.resource.data.date + '_' + request.resource.data.deviceId;
            allow read: if true;   // 관리자 페이지 통계 조회용
            allow delete: if false;
          }

          // 주간메뉴(요일별 문서, 문서 ID = 날짜 YYYY-MM-DD). 이미지 자동인식
          // 결과 확인 후 게시하거나 직접 입력할 때 저장됩니다.
          // status가 "published"인 문서만 학생 화면(js/weekly-menu-sync.js)에
          // 반영되고, "draft"(임시저장)는 관리자 화면에서만 보입니다.
          match /weeklyMenus/{docId} {
            allow read: if true;
            allow write: if request.auth != null;   // 관리자 로그인 필요
          }

          // 주간메뉴 원본 이미지 등록 정보(관리자 참고/이미지 자동인식 입력용, 문서 ID = 주 시작일).
          // 학생 화면에는 표시되지 않습니다.
          match /weeklyMenuImages/{docId} {
            allow read: if true;
            allow write: if request.auth != null;   // 관리자 로그인 필요
          }

          // 메뉴 번역 사전(문서 ID = 한글 메뉴명). 같은 메뉴를 매주 다시
          // 번역하지 않기 위한 캐시입니다. parse-weekly-menu 함수가 읽고,
          // 관리자 게시 시 클라이언트가 새로 번역된 항목만 씁니다.
          match /menuTranslations/{docId} {
            allow read: if true;
            allow write: if request.auth != null;   // 관리자 로그인 필요
          }

          // 한국어 학습 사이트(hellokorean.site) 연결 카드 클릭 통계.
          // 이름·전화번호·이메일·IP는 절대 받지 않습니다(필드 목록으로 강제).
          match /hellokoreanClicks/{docId} {
            allow create: if request.resource.data.date is string
              && request.resource.data.time is string
              && request.resource.data.language is string
              && request.resource.data.device in ['mobile', 'pc']
              && request.resource.data.location == 'home'
              && request.resource.data.target == 'hellokorean.site'
              && request.resource.data.keys().hasOnly(['date','time','language','device','location','target','createdAt']);
            allow read: if true;   // 관리자 페이지 통계 조회용
            allow update, delete: if false;
          }
        }
      }

   ⚠ Firebase Storage 보안 규칙 — "주간메뉴 이미지 업로드"에 필요합니다.
   Firebase 콘솔 → Storage → "규칙" 탭에 아래를 붙여넣으세요.
   (Storage를 아직 한 번도 안 켰다면 "시작하기"부터 눌러 생성해야 합니다.)

      rules_version = '2';
      service firebase.storage {
        match /b/{bucket}/o {
          match /weeklyMenuImages/{allPaths=**} {
            allow read: if true;
            allow write: if request.auth != null
              && request.resource.size < 10 * 1024 * 1024
              && request.resource.contentType.matches('image/.*');
          }
        }
      }

   ⚠ Firebase Authentication — 관리자 로그인에 필요합니다.
   Firebase 콘솔 → Authentication → "Sign-in method" 탭 →
   "이메일/비밀번호" 제공업체 사용 설정 → "Users" 탭에서 관리자 계정
   (이메일 + 비밀번호) 1개를 직접 추가하세요. 그 계정으로만
   주간메뉴를 등록·수정·삭제하고 이미지를 업로드할 수 있습니다.
   (관리자 페이지 상단의 "관리자 로그인" 버튼으로 통계를 보는 것과는
   별개입니다 — 통계 열람은 기존 암호로, 주간메뉴 쓰기는 이 계정으로.)

   ⚠ Netlify 환경변수 OPENAI_API_KEY — 주간메뉴 이미지 자동인식/번역에
   필요합니다(netlify/functions/parse-weekly-menu.js). Netlify 대시보드
   → 해당 사이트 → Site configuration → Environment variables에서
   Key: OPENAI_API_KEY, Value: (https://platform.openai.com 에서
   발급받은 키)로 등록하세요. 이 키는 서버 함수에서만 쓰이며 브라우저에는
   절대 전달되지 않습니다. 값을 등록하기 전까지는 "이미지 분석하기"를
   눌러도 안내 메시지만 뜨고, 직접 입력(방식 2)은 그대로 사용할 수
   있습니다. (Gemini로 되돌리려면 AI_PROVIDER=gemini와 GEMINI_API_KEY를
   등록하세요 — 코드 수정 없이 전환됩니다. README 10-4-1 참고.)

   다른 Firebase 프로젝트로 바꾸고 싶다면 프로젝트 설정(톱니바퀴 아이콘)
   → "일반" 탭 → "내 앱" → 웹 앱의 firebaseConfig 값을 아래 6개 값에
   그대로 옮겨 적고 `python3 scripts/build-inline.py`를 다시 실행하세요.

   참고: apiKey가 REPLACE_ME 상태이면 학생 화면은 정상적으로 보이지만,
   저장은 각 학생의 기기(localStorage)에만 남고 관리자 페이지 통계에는
   집계되지 않습니다. (학생 화면이 깨지지 않도록 하기 위한 안전장치)
   ========================================================================== */

var FIREBASE_CONFIG = {
  apiKey: "AIzaSyCSptfzh0RBVN1dPXLy9oIdE-Kg5vFZb3o",
  authDomain: "babsim-46284.firebaseapp.com",
  projectId: "babsim-46284",
  storageBucket: "babsim-46284.firebasestorage.app",
  messagingSenderId: "335217677805",
  appId: "1:335217677805:web:0621f10815f6bff13083e4",
  measurementId: "G-6YN63KKXNW"
};

function isFirebaseConfigured() {
  return !!(FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "REPLACE_ME");
}

function ensureFirebaseApp() {
  if (!isFirebaseConfigured()) return false;
  if (typeof firebase === "undefined") return false;
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    return true;
  } catch (e) {
    console.error("Firebase 초기화 오류:", e);
    return false;
  }
}

function getFirestoreDb() {
  if (!ensureFirebaseApp()) return null;
  try {
    return firebase.firestore();
  } catch (e) {
    console.error("Firestore 초기화 오류:", e);
    return null;
  }
}

/* 관리자 페이지(admin.html) 전용 — 학생 화면(index.html)은 이 두 함수를 쓰지 않습니다. */

function getFirebaseAuth() {
  if (!ensureFirebaseApp()) return null;
  if (typeof firebase === "undefined" || !firebase.auth) return null;
  try {
    return firebase.auth();
  } catch (e) {
    console.error("Firebase Auth 초기화 오류:", e);
    return null;
  }
}

function getFirebaseStorage() {
  if (!ensureFirebaseApp()) return null;
  if (typeof firebase === "undefined" || !firebase.storage) return null;
  try {
    return firebase.storage();
  } catch (e) {
    console.error("Firebase Storage 초기화 오류:", e);
    return null;
  }
}

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

          // 주간메뉴 직접 입력 (관리자만 쓰기, 학생 화면은 읽기만)
          match /weeklyMenus/{docId} {
            allow read: if true;
            allow write: if request.auth != null;   // 관리자 로그인 필요
          }

          // 주간메뉴 이미지 등록 정보 (관리자만 쓰기, 학생 화면은 읽기만)
          match /weeklyMenuImages/{docId} {
            allow read: if true;
            allow write: if request.auth != null;   // 관리자 로그인 필요
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

/* ==========================================================================
   Firebase 프로젝트 연결 설정
   - "천원의 아침밥 오늘의 메뉴 평가" 기능이 사용하는 Firestore(DB) 연결 정보입니다.
   - babsim-46284 프로젝트 값으로 연결되어 있습니다 (2026-09-09 연동 완료).

   ⚠ Firestore 보안 규칙을 아직 설정하지 않았다면 Firebase 콘솔의
   Firestore Database → "규칙" 탭에서 아래 규칙을 반드시 적용하세요.
   (breakfastRatings 컬렉션에 유효성 검사를 통과하는 생성만 허용하고,
   그 외 컬렉션·수정·삭제는 모두 막습니다. 기본 테스트 모드 규칙을
   그대로 두면 누구나 임의로 읽고 쓸 수 있으니 반드시 아래로 교체하세요.)

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /breakfastRatings/{docId} {
            allow create: if request.resource.data.rating is int
              && request.resource.data.rating >= 1
              && request.resource.data.rating <= 5
              && request.resource.data.date is string
              && request.resource.data.keys().hasAll(['date','menuId','rating','language','deviceId']);
            allow read: if true;   // 관리자 페이지가 통계 조회 시 사용
            allow update, delete: if false;
          }
        }
      }

   다른 Firebase 프로젝트로 바꾸고 싶다면 프로젝트 설정(톱니바퀴 아이콘)
   → "일반" 탭 → "내 앱" → 웹 앱의 firebaseConfig 값을 아래 6개 값에
   그대로 옮겨 적고 `python3 scripts/build-inline.py`를 다시 실행하세요.

   참고: apiKey가 REPLACE_ME 상태이면 평가 기능은 화면에는 정상적으로
   보이지만, 저장은 각 학생의 기기(localStorage)에만 남고 관리자 페이지
   통계에는 집계되지 않습니다. (학생 화면이 깨지지 않도록 하기 위한 안전장치)
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

function getFirestoreDb() {
  if (!isFirebaseConfigured()) return null;
  if (typeof firebase === "undefined") return null;
  try {
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    return firebase.firestore();
  } catch (e) {
    console.error("Firebase 초기화 오류:", e);
    return null;
  }
}

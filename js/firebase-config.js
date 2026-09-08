/* ==========================================================================
   Firebase 프로젝트 연결 설정
   - "천원의 아침밥 오늘의 메뉴 평가" 기능이 사용하는 Firestore(DB) 연결 정보입니다.
   - 아래 값은 실제 값이 아닙니다(REPLACE_ME). Firebase 콘솔에서 새 프로젝트를
     만든 뒤, 이 6개 값만 그대로 바꿔 넣으면 평가 데이터가 저장되기 시작합니다.

   설정 방법:
   1) https://console.firebase.google.com 접속 → "프로젝트 추가"로 새 프로젝트 생성
   2) 왼쪽 메뉴 "빌드 > Firestore Database" → "데이터베이스 만들기"
      (프로덕션 모드로 시작, 위치는 asia-northeast3(서울) 권장)
   3) Firestore "규칙" 탭에서 보안 규칙을 아래와 같이 설정
      (breakfastRatings 컬렉션에만 익명 쓰기를 허용하고, 그 외에는 막습니다):

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

   4) 프로젝트 설정(톱니바퀴 아이콘) → "일반" 탭 → "내 앱" → 웹 앱 추가(</> 아이콘)
      앱 등록 후 나오는 firebaseConfig 값을 아래 FIREBASE_CONFIG 객체에
      그대로 옮겨 적으세요.
   5) 저장 후 다시 배포하면 평가 데이터가 Firestore에 쌓이고,
      admin.html에서 통계를 확인할 수 있습니다.

   주의: apiKey를 REPLACE_ME 상태로 두면 평가 기능은 화면에는 정상적으로
   보이지만, 저장은 각 학생의 기기(localStorage)에만 남고 관리자 페이지
   통계에는 집계되지 않습니다. (학생 화면이 깨지지 않도록 하기 위한 안전장치)
   ========================================================================== */

var FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
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

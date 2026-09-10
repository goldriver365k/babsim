/* ==========================================================================
   Firebase 프로젝트 연결 설정
   - babsim-46284 프로젝트 값으로 연결되어 있습니다 (2026-09-09 연동 완료).
   - Firestore(DB)는 학생 화면(천원의 아침밥 평가, 언어 통계, 주간메뉴)과
     관리자 페이지가 함께 사용합니다.
   - Firebase Authentication과 Storage는 관리자 페이지의 "주간메뉴 관리"
     (이미지 업로드, 직접 입력 저장/수정/삭제)와, 학생 화면(index.html)의
     유학생 커뮤니티 회원가입·로그인·이메일 인증·게시글 사진 업로드에서
     사용합니다(2026-09-10 커뮤니티 기능 추가로 학생 화면도 이 두 SDK를
     불러오기 시작했습니다 — 커뮤니티를 쓰지 않는 방문자에게는 추가
     네트워크 요청 몇 개 외에 다른 영향이 없습니다).

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

          // ---------------- 유학생 커뮤니티 (2026-09-10 추가, 2026-09-11
          // 이메일 인증 요구 제거 + Google 로그인 지원으로 수정) ----------------
          function isSignedIn() { return request.auth != null; }
          function myProfile() { return get(/databases/$(database)/documents/communityUsers/$(request.auth.uid)).data; }
          function isActiveMember() { return isSignedIn() && myProfile().status == 'active'; }
          function isAdmin() { return isSignedIn() && myProfile().role == 'admin'; }

          // 회원 정보 — 이메일 노출 방지를 위해 본인 또는 관리자만 문서를
          // 읽을 수 있습니다(다른 회원의 이름·국적은 게시글/댓글에 저장된
          // 스냅샷 필드로만 공개됩니다 — 아래 communityPosts 참고).
          match /communityUsers/{uid} {
            allow read: if isSignedIn() && (request.auth.uid == uid || isAdmin());
            // role은 반드시 'user'로만 가입할 수 있습니다(가입 시 스스로
            // 'admin'을 적어 넣는 권한 상승을 막기 위함) — 관리자 지정은
            // Firebase 콘솔에서 문서를 직접 고쳐야만 가능합니다. 이름·국적은
            // Google 로그인으로 가입하더라도(이메일/비밀번호 없이도) 반드시
            // 채워야만 문서가 만들어지도록 서버(규칙)에서도 검사합니다.
            allow create: if isSignedIn() && request.auth.uid == uid && request.resource.data.role == 'user'
              && request.resource.data.name is string && request.resource.data.name.size() > 0
              && request.resource.data.nationality is string && request.resource.data.nationality.size() > 0;
            allow update: if (isSignedIn() && request.auth.uid == uid
                && request.resource.data.role == resource.data.role) // 본인은 role을 못 바꿈
              || isAdmin();
            allow delete: if false; // 탈퇴는 status:'withdrawn'으로만 처리
          }

          // 게시글 — 비회원·이메일 미인증·정지 회원은 전혀 접근 불가.
          // 작성자 본인/관리자는 모든 필드를 수정할 수 있고, 그 외 로그인
          // 회원은 신고 시 reportCount를 1씩만 늘리고 3회가 되면 status를
          // hidden으로 바꾸는 것만 허용합니다(신고 누적 자동 숨김).
          match /communityPosts/{postId} {
            allow read: if resource.data.status == 'visible'
              || (isSignedIn() && (request.auth.uid == resource.data.authorId || isAdmin()));
            allow create: if isActiveMember() && request.resource.data.authorId == request.auth.uid;
            allow update: if (isActiveMember() && (request.auth.uid == resource.data.authorId || isAdmin()))
              || (isActiveMember()
                  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reportCount', 'status'])
                  && request.resource.data.reportCount == resource.data.reportCount + 1
                  && (request.resource.data.status == resource.data.status
                      || (request.resource.data.reportCount >= 3 && request.resource.data.status == 'hidden')));
            allow delete: if false; // 삭제는 status:'deleted'로만(관리자가 복구 가능하도록)
          }

          // 댓글 — 게시글과 같은 원칙 + 번역 캐시(translations 필드)만
          // 별도로 채워 넣는 것은 로그인한 회원 누구나 할 수 있게 허용합니다
          // ("번역 보기"를 처음 누른 회원이 결과를 저장해 재사용).
          match /communityComments/{commentId} {
            allow read: if resource.data.status == 'visible'
              || (isSignedIn() && (request.auth.uid == resource.data.authorId || isAdmin()));
            allow create: if isActiveMember() && request.resource.data.authorId == request.auth.uid;
            allow update: if (isActiveMember() && (request.auth.uid == resource.data.authorId || isAdmin()))
              || (isActiveMember()
                  && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reportCount', 'status'])
                  && request.resource.data.reportCount == resource.data.reportCount + 1
                  && (request.resource.data.status == resource.data.status
                      || (request.resource.data.reportCount >= 3 && request.resource.data.status == 'hidden')))
              || (isActiveMember() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['translations']));
            allow delete: if false;
          }

          // 신고 — 문서 ID를 "대상종류_대상ID_신고자ID"로 고정해 같은
          // 회원이 같은 대상을 두 번 신고해도 덮어쓰지 못하게 막습니다
          // (allow update가 없으므로 이미 존재하면 재작성 자체가 거부됨).
          // 신고자 목록은 본인과 관리자만 볼 수 있습니다(다른 회원에게 비공개).
          match /communityReports/{reportId} {
            allow create: if isActiveMember()
              && request.resource.data.reporterId == request.auth.uid
              && reportId == request.resource.data.targetType + '_' + request.resource.data.targetId + '_' + request.auth.uid;
            allow read: if isSignedIn() && (request.auth.uid == resource.data.reporterId || isAdmin());
            allow update, delete: if isAdmin();
          }

          // 저장한 글(내 정보 > 저장한 글) — 본인 것만 읽고 쓸 수 있습니다.
          match /communitySaves/{saveId} {
            allow read, delete: if isSignedIn() && request.auth.uid == resource.data.uid;
            allow create: if isSignedIn() && request.auth.uid == request.resource.data.uid;
            allow update: if false;
          }
        }
      }

   ⚠ Firebase Storage 보안 규칙 — "주간메뉴 이미지 업로드"와 "커뮤니티
   게시글 사진 업로드"에 필요합니다.
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
          // 커뮤니티 게시글 사진(게시글당 최대 3장, 브라우저에서 이미
          // 압축된 상태로 올라오므로 5MB면 충분히 넉넉합니다). 로그인한
          // 회원만 올릴 수 있고, 누구나 볼 수 있습니다(게시글 자체의
          // Firestore 읽기 규칙이 이미 비회원/미인증 회원을 막습니다).
          match /communityImages/{allPaths=**} {
            allow read: if true;
            allow write: if request.auth != null
              && request.resource.size < 5 * 1024 * 1024
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

   ⚠ 유학생 커뮤니티 이메일/비밀번호 회원가입은 "이메일/비밀번호" 제공업체가
   켜져 있기만 하면 별도 설정 없이 바로 동작합니다(위 항목에서 이미
   켜둔 것과 같은 설정). 가입 시 이메일 인증메일을 보내지 않으며, 이메일
   인증 여부를 접근 조건으로 쓰지 않습니다(가입 즉시 이용 가능).

   ⚠ 유학생 커뮤니티 "Google로 계속하기" 로그인 — Firebase 콘솔 →
   Authentication → "Sign-in method" 탭 → "Google" 제공업체를 사용 설정
   해야 합니다(프로젝트 지원 이메일 지정 필요). 켜두지 않으면 Google
   버튼을 눌렀을 때 오류가 뜨고, 이메일/비밀번호 가입·로그인에는 영향이
   없습니다.

   커뮤니티 번역(netlify/functions/community-translate.js)은 새 환경변수
   없이 기존 OPENAI_API_KEY를 그대로 재사용합니다.

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

/* ==========================================================================
   유학생 커뮤니티 (js/community.js)
   - babsim.store(index.html) 안에 통째로 포함되는 모듈입니다(별도 사이트
     아님). 기존 Firebase 프로젝트(Firestore/Auth/Storage), 기존 언어
     선택(js/app.js state.lang, localStorage "foodhall_lang"), 기존
     번역 인프라(Netlify Function + OpenAI)를 그대로 재사용합니다.
   - 라우팅은 별도 패키지 없이 history.pushState + location.pathname으로
     직접 처리합니다(모든 경로가 index.html로 오는 기존 netlify.toml
     catch-all을 그대로 사용).
   - 이 스크립트가 없거나 실패해도 기존 식당 메뉴 화면은 영향받지
     않습니다(다른 js/*.js 모듈과 같은 독립 실행 패턴).
   ========================================================================== */

var Community = (function () {
  "use strict";

  var ROUTE_PREFIX = "/community";
  var SUPPORTED_LANGS = ["ko", "zh", "vi", "en", "mn", "bn", "my"];
  var MAX_PHOTOS = 1; // 게시글당 사진 1장(2026-09-11 비용 최소화 지시서)
  var MAX_PHOTO_DIMENSION = 800;
  var PHOTO_QUALITY_INITIAL = 0.65;
  var PHOTO_QUALITY_RETRY = 0.45;
  var PHOTO_RETRY_DIMENSION = 600;
  var PHOTO_MAX_BYTES = 200 * 1024; // 재압축 후에도 넘으면 업로드 거절
  var POST_PAGE_SIZE = 15;
  var COMMENT_PAGE_SIZE = 20;
  var TITLE_MAX_LEN = 100;
  var CONTENT_MAX_LEN = 2000;
  var JOB_INTRO_MAX_LEN = 1000; // 구직 자기소개(본문 필드 재사용)
  var COMMENT_MAX_LEN = 500;
  var SUMMARY_MAX_LEN = 100; // 비회원(및 목록 카드)에게 보이는 본문 요약 길이
  var REDIRECT_KEY = "communityRedirectAfterAuth"; // 로그인/가입 완료 후 돌아갈 경로(세션 동안만)

  var lang = "ko";
  var els = {};
  var authUser = null;      // firebase.auth().currentUser
  var profile = null;       // communityUsers/{uid} 문서 데이터
  var pendingProfileUser = null; // 로그인은 했지만 회원 정보 문서가 아직 없는 사용자(Google 첫 가입 등)
  var currentRoute = { path: "/", postId: null };
  var postCache = {};       // postId -> 마지막으로 불러온 게시글 문서(상세 화면 재사용)

  function qs(id) { return document.getElementById(id); }
  function t(dict) { return (dict && (dict[lang] || dict.ko)) || ""; }
  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function auth() { return (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null; }
  function storage() { return (typeof getFirebaseStorage === "function") ? getFirebaseStorage() : null; }

  /* ---------------- 라우팅 ---------------- */

  function isCommunityPath(path) {
    return path === ROUTE_PREFIX || path.indexOf(ROUTE_PREFIX + "/") === 0;
  }

  function parseRoute(path) {
    if (path === ROUTE_PREFIX || path === ROUTE_PREFIX + "/") return { name: "list" };
    var rest = path.slice(ROUTE_PREFIX.length + 1);
    var segs = rest.split("/").filter(Boolean);
    if (segs[0] === "login") return { name: "login" };
    if (segs[0] === "signup") return { name: "signup" };
    if (segs[0] === "write") return { name: "write" };
    if (segs[0] === "my") return { name: "my" };
    if (segs[0] === "rules") return { name: "rules" };
    if (segs[0] === "privacy") return { name: "privacy" };
    if (segs[0] === "post" && segs[1]) return { name: "post", postId: segs[1] };
    return { name: "list" };
  }

  function navigate(path, replace) {
    if (location.pathname !== path) {
      if (replace) history.replaceState({}, "", path);
      else history.pushState({}, "", path);
    }
    route();
  }

  window.addEventListener("popstate", function () { route(); });

  /* ---------------- 로그인/가입 후 원래 화면으로 돌아가기 ----------------
     비회원이 게시글·글쓰기·댓글 등을 누르면 로그인/가입 안내창을 띄우고,
     누르려던 경로를 sessionStorage에 잠깐만 저장해 둡니다(탭을 닫으면
     사라짐). 가입/로그인이 끝나면 이 경로로 돌아가고, 없으면 커뮤니티
     첫 화면으로 갑니다. babsim.store 내부 커뮤니티 경로("/community"로
     시작)만 허용해 외부 주소로 임의 이동하는 것을 막습니다. */
  function saveRedirectTarget(path) {
    if (typeof path !== "string" || path.indexOf(ROUTE_PREFIX) !== 0) return;
    try { sessionStorage.setItem(REDIRECT_KEY, path); } catch (e) { /* 저장 실패해도 가입은 계속 진행 */ }
  }

  function consumeRedirectTarget() {
    var target = null;
    try {
      target = sessionStorage.getItem(REDIRECT_KEY);
      sessionStorage.removeItem(REDIRECT_KEY);
    } catch (e) { /* 무시 */ }
    var isSafeInternalPath = typeof target === "string" && target.indexOf(ROUTE_PREFIX) === 0 && target.indexOf("//") !== 0;
    return isSafeInternalPath ? target : ROUTE_PREFIX;
  }

  function navigateAfterAuth() {
    navigate(consumeRedirectTarget());
  }

  /* ---------------- 로그인/가입 안내창(안내 모달) ----------------
     비회원이 로그인이 필요한 행동을 하면 화면 전체를 가리지 않고
     이 작은 안내창만 띄웁니다(기존 .modal-overlay/.modal 스타일 재사용). */
  function closeAuthGateModal() {
    var existing = qs("communityAuthGateOverlay");
    if (existing) existing.remove();
  }

  function showAuthGateModal(redirectPath) {
    closeAuthGateModal();
    var overlay = el("div", "modal-overlay");
    overlay.id = "communityAuthGateOverlay";
    var modal = el("div", "modal");
    modal.appendChild(el("p", "modal-desc", t(COMMUNITY_AUTH.authGateDesc)));

    var actions = el("div", "community-auth-gate-actions");
    var loginBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.loginTitle));
    loginBtn.type = "button";
    loginBtn.addEventListener("click", function () {
      saveRedirectTarget(redirectPath);
      closeAuthGateModal();
      navigate(ROUTE_PREFIX + "/login");
    });
    var signupBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.signupTitle));
    signupBtn.type = "button";
    signupBtn.addEventListener("click", function () {
      saveRedirectTarget(redirectPath);
      closeAuthGateModal();
      navigate(ROUTE_PREFIX + "/signup");
    });
    var cancelBtn = el("button", "community-btn-secondary", t(COMMUNITY_AUTH.authGateCancel));
    cancelBtn.type = "button";
    cancelBtn.addEventListener("click", function () { closeAuthGateModal(); });

    actions.appendChild(loginBtn);
    actions.appendChild(signupBtn);
    actions.appendChild(cancelBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeAuthGateModal(); });
    document.body.appendChild(overlay);
  }

  /* ---------------- 회원가입 유도 안내(2026-09-12 5단계 지시서) ----------------
     "가입해야 쓸 수 있는" 안내창(showAuthGateModal)과 달리, 이 안내는
     MY 등 계정이 있으면 더 좋은 기능에 들어갔을 때만 가볍게 띄우고
     [나중에]를 누르면(또는 바깥을 클릭하면) 그냥 닫히고 비회원(익명)
     상태로 기본 커뮤니티 이용을 계속할 수 있습니다(가입 강제 아님). */
  function closeSignupInviteModal() {
    var existing = qs("communitySignupInviteOverlay");
    if (existing) existing.remove();
  }

  function showSignupInviteModal(redirectPath) {
    if (qs("communitySignupInviteOverlay")) return; // 이미 떠 있으면 중복 표시 안 함
    closeAuthGateModal();
    var overlay = el("div", "modal-overlay");
    overlay.id = "communitySignupInviteOverlay";
    var modal = el("div", "modal");
    modal.appendChild(el("p", "modal-desc", t(COMMUNITY_AUTH.signupInviteDesc)));

    var actions = el("div", "community-auth-gate-actions");
    var signupBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.signupInviteAccept));
    signupBtn.type = "button";
    signupBtn.addEventListener("click", function () {
      saveRedirectTarget(redirectPath);
      closeSignupInviteModal();
      navigate(ROUTE_PREFIX + "/signup");
    });
    var laterBtn = el("button", "community-btn-secondary", t(COMMUNITY_AUTH.signupInviteLater));
    laterBtn.type = "button";
    laterBtn.addEventListener("click", function () { closeSignupInviteModal(); });

    actions.appendChild(signupBtn);
    actions.appendChild(laterBtn);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) closeSignupInviteModal(); });
    document.body.appendChild(overlay);
  }

  /* ---------------- 비회원(익명) 참여 — 기존 Firebase Anonymous Auth 재사용 ----------------
     회원가입 없이 글쓰기/댓글/저장/신고를 할 수 있도록, 참여 버튼을 처음
     누른 시점에만 조용히 signInAnonymously()로 로그인하고(화면 전체를
     가리는 안내창 없음), communityUsers 문서도 자동 생성합니다. 식별은
     UID로, 화면 표시는 자동 생성된 nickname으로만 합니다(UID 노출 없음).
     같은 브라우저에서는 Firebase Auth가 로그인 상태를 기억하므로, 다시
     방문해도 같은 UID·닉네임이 유지됩니다(로그아웃/데이터 삭제 전까지). */
  var GUEST_NICKNAME_ADJ = ["푸른", "노란", "구름", "민트", "캠퍼스", "은빛", "조용한", "포근한", "산뜻한", "초록", "따뜻한", "말랑", "느긋한", "상쾌한", "반짝"];
  var GUEST_NICKNAME_NOUN = ["고래", "별", "여행", "나무", "친구", "바람", "하늘", "강물", "숲", "달", "구름", "연필", "책상", "자전거", "토끼"];

  function generateGuestNickname() {
    var adj = GUEST_NICKNAME_ADJ[Math.floor(Math.random() * GUEST_NICKNAME_ADJ.length)];
    var noun = GUEST_NICKNAME_NOUN[Math.floor(Math.random() * GUEST_NICKNAME_NOUN.length)];
    var num = 10 + Math.floor(Math.random() * 90);
    return adj + noun + num;
  }

  /* ---------------- 가입회원 닉네임(2026-09-11 4단계 지시서) ----------------
     가입회원도 커뮤니티에서는 실명(profile.name, 회원가입 필수 항목)이
     아니라 닉네임(profile.nickname, 새 필드 하나만 추가)으로 활동합니다.
     닉네임을 직접 정하지 않은 회원은 커뮤니티를 처음 쓸 때 자동으로
     1회만 생성해 프로필에 저장합니다(강제 팝업 없음, 기존 회원도 이
     흐름을 그대로 타면 자동으로 채워짐). 기존 프로필 문서 구조·회원가입
     화면은 손대지 않고 필드 하나만 재사용 추가합니다. */
  function ensureMemberNickname(uid) {
    if (!profile || profile.isAnonymous || profile.nickname) return Promise.resolve(profile);
    var nickname = generateGuestNickname();
    var d = db();
    if (!d) { profile.nickname = nickname; return Promise.resolve(profile); }
    return d.collection("communityUsers").doc(uid).update({ nickname: nickname }).then(function () {
      profile.nickname = nickname;
      return profile;
    }).catch(function () { return profile; }); // 실패해도 글쓰기 자체를 막지 않음(다음 기회에 다시 시도)
  }

  // 게시글/댓글 작성 시 표시할 이름을 정합니다 — 비회원은 자동 닉네임
  // (profile.name, 3단계에서 만든 구조 재사용), 가입회원은 위에서 만든
  // profile.nickname을 사용합니다. 실명(profile.name)은 절대 쓰지 않음.
  function currentDisplayNickname() {
    if (!profile) return "";
    return profile.isAnonymous ? (profile.name || "") : (profile.nickname || "");
  }

  // profile.name을 그대로 재사용해(기존 게시글/댓글 작성 코드 무수정)
  // 닉네임을 저장합니다 — authorIsAnonymous만 함께 저장해 두어, 실명이
  // 아니라 닉네임이므로 화면에서 마스킹하지 않도록 구분합니다.
  function createAnonymousProfile(uid) {
    var d = db();
    if (!d) return Promise.resolve(null);
    var data = {
      name: generateGuestNickname(),
      nationality: "",
      role: "user",
      status: "active",
      isAnonymous: true,
      preferredLanguage: lang,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return d.collection("communityUsers").doc(uid).set(data).then(function () {
      profile = data;
      return profile;
    }).catch(function (err) { console.error("비회원 프로필 생성 오류:", err); return null; });
  }

  // ensureAuth()가 signInAnonymously()를 직접 트리거한 경우, 잠시 후
  // onAuthStateChanged 리스너도 같은 로그인 이벤트로 한 번 더 불립니다.
  // 그 중복 호출이 render()로 화면 전체를 다시 그리면, 참여 버튼(저장 등)
  // 클릭 핸들러가 이미 갱신해 둔 버튼 DOM이 통째로 새 버튼으로 바뀌어
  // 버려집니다(경쟁 상태) — 그 한 번의 리스너 호출에서만 render()를
  // 건너뛰어 호출자가 직접 한 UI 갱신이 그대로 남게 합니다.
  var suppressNextAuthRender = false;

  // 참여 버튼(글쓰기/댓글/저장/신고)에서 호출 — 이미 로그인(회원 또는
  // 비회원 익명 세션)돼 있으면 그대로 진행하고, 아니면 이번 한 번만
  // 조용히 익명 로그인 + 프로필 생성까지 마친 뒤에 진행합니다.
  function ensureAuth() {
    if (authUser && profile) return Promise.resolve(authUser);
    var a = auth();
    if (!a) return Promise.reject(new Error("auth unavailable"));
    if (authUser) return loadProfile(authUser.uid).then(function () { return authUser; });
    suppressNextAuthRender = true;
    return a.signInAnonymously().then(function (cred) {
      authUser = cred.user;
      return createAnonymousProfile(cred.user.uid);
    }).then(function () { return authUser; });
  }

  function route() {
    var path = location.pathname;
    var inCommunity = isCommunityPath(path);
    toggleStoreChrome(!inCommunity);
    if (els.communityTabBtn) {
      els.communityTabBtn.classList.toggle("active", inCommunity);
      els.communityTabBtn.setAttribute("aria-pressed", inCommunity ? "true" : "false");
    }
    if (!inCommunity) return;

    currentRoute = parseRoute(path);
    render();
  }

  /* 커뮤니티 화면일 때는 기존 매장 콘텐츠를 숨기고, 아닐 때는 되돌립니다.
     (기존 밥심/만권화밥/후루룩찹찹, 콜라 배너, 한국어 학습 카드, 하단
     "사장님께 말해요" 배너는 그대로 두고 손대지 않습니다 — 보이기/숨기기만) */
  function toggleStoreChrome(show) {
    var ids = ["colaBanner"];
    ids.forEach(function (id) {
      var node = qs(id);
      if (node) node.hidden = !show || node.hidden && !show ? node.hidden : node.hidden;
    });
    var cola = qs("colaBanner");
    if (cola && !show) cola.hidden = true;
    var hello = document.querySelector(".hellokorean-card");
    if (hello) hello.hidden = !show;
    var ownerBanner = document.querySelector(".owner-chat-banner");
    if (ownerBanner) ownerBanner.hidden = !show;
    var home = qs("homeView");
    if (!show) {
      // 커뮤니티로 들어갈 때는 홈 화면(있다면)과 매장 화면을 함께 숨깁니다.
      // 하단 내비게이션(모바일 UI 개선 8단계부터 항상 고정 표시)은
      // 그대로 두고, "홈" 활성 표시만 꺼 둡니다.
      if (home) home.hidden = true;
      if (window.AppHome && typeof window.AppHome.setHomeActive === "function") window.AppHome.setHomeActive(false);
      var mainIn = document.querySelector("main");
      if (mainIn) mainIn.hidden = true;
    } else if (window.AppHome && typeof window.AppHome.applyView === "function") {
      // 커뮤니티에서 나갈 때는 홈/매장 중 무엇을 보여줄지 app.js(모바일 UI
      // 개선 4단계에서 추가된 홈 화면)가 결정합니다.
      window.AppHome.applyView();
    } else {
      var mainOut = document.querySelector("main");
      if (mainOut) mainOut.hidden = false;
    }
    if (els.root) els.root.hidden = show;
  }

  /* ---------------- 이름 마스킹 / 표시 ---------------- */

  function maskName(name) {
    if (!name) return "";
    var trimmed = String(name).trim();
    var parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0) + "**";
    return parts[0] + " " + parts[1].charAt(0) + "**";
  }

  function formatDate(ts) {
    var d = null;
    if (ts && typeof ts.toDate === "function") d = ts.toDate();
    else if (ts instanceof Date) d = ts;
    else if (typeof ts === "string") { var parsed = new Date(ts); if (!isNaN(parsed.getTime())) d = parsed; }
    if (!d) return "";
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return y + "." + m + "." + day;
  }

  /* ---------------- 렌더 디스패처 ---------------- */

  function render() {
    if (!els.root) return;
    closeAuthGateModal();
    closeSignupInviteModal();
    els.root.innerHTML = "";
    els.root.hidden = false;

    if (currentRoute.name === "rules") { renderStaticDoc(COMMUNITY_CONSENT.rulesTitle, communityRulesBody()); return; }
    if (currentRoute.name === "privacy") { renderStaticDoc(COMMUNITY_CONSENT.privacyTitle, communityPrivacyBody()); return; }

    var user = authUser;

    if (currentRoute.name === "login") { renderLogin(); return; }
    if (currentRoute.name === "signup") { renderSignup(); return; }

    if (user) {
      // 소셜 로그인(Google) 첫 가입이거나, 어떤 이유로든 회원 정보 문서가
      // 아직 없는 계정은 국적·언어·약관 동의를 받는 화면부터 보여줍니다.
      if (pendingProfileUser) { renderCompleteProfile(); return; }
      if (profile && profile.status === "suspended") { renderSuspended(); return; }
    }

    // "내 정보"/"글쓰기"는 비회원도 회원가입 없이 쓸 수 있습니다 — 주소로
    // 직접 열면 일단 목록을 보여주면서 조용히 익명 로그인을 마친 뒤 실제
    // 화면으로 넘어갑니다(화면 전체를 로그인창으로 덮지 않음). 아주 드물게
    // 익명 로그인 자체가 실패하면(네트워크 등) 그때만 안내창을 띄웁니다.
    var AUTH_REQUIRED_ROUTES = ["write"]; // "my"는 가입 유도가 필요해 아래에서 따로 처리
    if (!user && AUTH_REQUIRED_ROUTES.indexOf(currentRoute.name) !== -1) {
      renderList();
      ensureAuth().then(function () {
        if (isCommunityPath(location.pathname)) render();
      }).catch(function () { showAuthGateModal(location.pathname); });
      return;
    }

    // MY는 "가입해야만 쓸 수 있는" 기능이 아니라 "가입하면 더 좋은"
    // 기능입니다(5단계 지시서) — 비회원도 그대로 볼 수 있게 하되, 계정이
    // 있으면 활동을 계속 보관할 수 있다는 가벼운 안내만 띄웁니다. [나중에]를
    // 누르면 안내만 닫히고 MY 화면은 비회원(익명) 상태로 계속 씁니다.
    if (currentRoute.name === "my") {
      if (!user) {
        // 아직 아무 활동도 없는 완전 신규 방문자는 MY에서 보여줄 것이
        // 없으므로, 굳이 익명 로그인까지 만들지 않고 목록 + 가입 유도
        // 안내만 보여줍니다(로그아웃 직후 등 일시적으로 user가 비어있는
        // 순간에 불필요한 익명 세션이 새로 생기는 것도 함께 막아줍니다).
        renderList();
        showSignupInviteModal(location.pathname);
        return;
      }
      renderMyPage();
      if (profile && profile.isAnonymous) showSignupInviteModal(location.pathname);
      return;
    }
    if (currentRoute.name === "write") { renderWrite(); return; }
    if (currentRoute.name === "post") { renderPostDetail(currentRoute.postId); return; }
    renderList();
  }

  function renderStaticDoc(titleDict, bodyHtml) {
    var wrap = el("div", "community-page community-doc");
    wrap.appendChild(el("h2", "community-page-title", t(titleDict)));
    var body = el("div", "community-doc-body");
    body.innerHTML = bodyHtml;
    wrap.appendChild(body);
    els.root.appendChild(wrap);
  }

  function communityRulesBody() {
    var items = {
      ko: ["서로 존중하며 예의를 지켜주세요.", "사기, 욕설, 괴롭힘, 불법 거래는 금지됩니다.", "개인정보(전화번호, 계좌 등)를 게시글에 직접 공개하지 마세요.", "신고가 누적된 게시물은 관리자 확인 후 처리됩니다."],
      zh: ["请互相尊重并遵守礼仪。", "禁止诈骗、辱骂、骚扰和非法交易。", "请勿在帖子中直接公开个人信息（电话号码、账户等）。", "被多次举报的帖子将由管理员审核处理。"],
      vi: ["Hãy tôn trọng lẫn nhau và giữ phép lịch sự.", "Nghiêm cấm lừa đảo, lăng mạ, quấy rối và giao dịch bất hợp pháp.", "Không công khai thông tin cá nhân (số điện thoại, tài khoản...) trong bài viết.", "Bài viết bị báo cáo nhiều lần sẽ được quản trị viên xem xét xử lý."],
      en: ["Please be respectful and courteous to others.", "Scams, abuse, harassment, and illegal trading are prohibited.", "Do not post personal information (phone numbers, bank accounts, etc.) directly in posts.", "Posts with multiple reports will be reviewed and handled by admins."],
      mn: ["Бие биенээ хүндэлж, зохистой харьцаарай.", "Залилан, доромжлол, дарамт, хууль бус худалдаа хориотой.", "Хувийн мэдээллийг (утасны дугаар, дансны дугаар гэх мэт) зурвасдаа шууд бүү оруулаарай.", "Олон удаа мэдээлэгдсэн зурвасыг админ шалгаж шийдвэрлэнэ."]
    };
    var list = items[lang] || items.ko;
    return "<ul>" + list.map(function (s) { return "<li>" + s.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>"; }).join("") + "</ul>";
  }

  function communityPrivacyBody() {
    var lines = [t(COMMUNITY_CONSENT.collectItems), t(COMMUNITY_CONSENT.purpose), t(COMMUNITY_CONSENT.retention)];
    return "<p>" + lines.map(function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }).join("</p><p>") + "</p>";
  }

  /* ---------------- 정지 안내 ---------------- */

  function renderSuspended() {
    var wrap = el("div", "community-page community-gate");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_AUTH.loginRequiredTitle)));
    wrap.appendChild(el("p", "community-gate-desc", t(COMMUNITY_AUTH.suspendedNotice)));
    els.root.appendChild(wrap);
  }

  /* ---------------- 로그인 / 회원가입 ---------------- */

  function formField(labelDict, inputEl) {
    var wrap = el("div", "community-field");
    var label = el("label", "community-label", t(labelDict));
    var id = "cf-" + Math.random().toString(36).slice(2, 9);
    label.setAttribute("for", id);
    inputEl.id = id;
    wrap.appendChild(label);
    wrap.appendChild(inputEl);
    return wrap;
  }

  function renderLogin() {
    var wrap = el("div", "community-page community-auth");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_AUTH.loginTitle)));

    var googleErrorP = el("p", "community-form-error");
    wrap.appendChild(buildGoogleButton(googleErrorP));
    wrap.appendChild(googleErrorP);
    wrap.appendChild(el("p", "community-or-divider", t(COMMUNITY_AUTH.orDivider)));

    var form = el("form", "community-form");
    var emailInput = el("input"); emailInput.type = "email"; emailInput.autocomplete = "username"; emailInput.required = true;
    var pwInput = el("input"); pwInput.type = "password"; pwInput.autocomplete = "current-password"; pwInput.required = true;
    form.appendChild(formField(COMMUNITY_AUTH.emailLabel, emailInput));
    form.appendChild(formField(COMMUNITY_AUTH.passwordLabel, pwInput));

    var keepWrap = el("label", "community-checkbox-row");
    var keepInput = el("input"); keepInput.type = "checkbox"; keepInput.checked = true;
    keepWrap.appendChild(keepInput);
    keepWrap.appendChild(document.createTextNode(" " + t(COMMUNITY_AUTH.keepLoggedIn)));
    form.appendChild(keepWrap);

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.submitLogin));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorP.textContent = "";
      var a = auth();
      if (!a) { errorP.textContent = t(COMMUNITY_MSG.errGeneric); return; }
      submitBtn.disabled = true;
      var persistence = keepInput.checked ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
      a.setPersistence(persistence).then(function () {
        return a.signInWithEmailAndPassword(emailInput.value.trim(), pwInput.value);
      }).then(function () {
        pendingProfileUser = null;
        navigateAfterAuth();
      }).catch(function () {
        errorP.textContent = t(COMMUNITY_MSG.errLogin);
      }).finally(function () { submitBtn.disabled = false; });
    });

    wrap.appendChild(form);

    var links = el("div", "community-auth-links");
    var forgotBtn = el("button", "community-link-btn", t(COMMUNITY_AUTH.forgotPassword));
    forgotBtn.type = "button";
    forgotBtn.addEventListener("click", function () { handleForgotPassword(emailInput.value.trim(), errorP); });
    var signupBtn = el("button", "community-link-btn", t(COMMUNITY_AUTH.goSignup));
    signupBtn.type = "button";
    signupBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/signup"); });
    links.appendChild(forgotBtn);
    links.appendChild(signupBtn);
    wrap.appendChild(links);

    els.root.appendChild(wrap);
  }

  function handleForgotPassword(email, errorP) {
    var a = auth();
    if (!a || !email) { errorP.textContent = t(COMMUNITY_MSG.errRequired); return; }
    a.sendPasswordResetEmail(email).then(function () {
      showToast(t(COMMUNITY_AUTH.resetSent));
    }).catch(function () {
      errorP.textContent = t(COMMUNITY_MSG.errGeneric);
    });
  }

  /* ---------------- Google 로그인 ---------------- */

  function buildGoogleButton(errorP) {
    var btn = el("button", "community-btn-secondary community-google-btn", t(COMMUNITY_AUTH.googleContinue));
    btn.type = "button";
    btn.addEventListener("click", function () { handleGoogleSignIn(btn, errorP); });
    return btn;
  }

  function handleGoogleSignIn(btn, errorP) {
    var a = auth();
    if (!a || typeof firebase === "undefined" || !firebase.auth || !firebase.auth.GoogleAuthProvider) {
      if (errorP) errorP.textContent = t(COMMUNITY_MSG.errGeneric);
      return;
    }
    if (btn) btn.disabled = true;
    var provider = new firebase.auth.GoogleAuthProvider();
    // 비회원(익명)으로 이미 활동 중이었다면 linkWithPopup으로 같은 UID에
    // Google 계정만 연결합니다(Anonymous Account Linking) — UID가 그대로라
    // 기존 게시글·댓글의 authorId가 바뀌지 않습니다. signInWithPopup처럼
    // 클릭 이벤트 처리 중 곧바로(비동기 대기 없이) 호출해야 팝업이 막히지
    // 않습니다(사파리/아이폰).
    var wasAnonymous = !!(a.currentUser && a.currentUser.isAnonymous);
    var popupPromise = wasAnonymous ? a.currentUser.linkWithPopup(provider) : a.signInWithPopup(provider);
    popupPromise.then(function (result) {
      return db().collection("communityUsers").doc(result.user.uid).get();
    }).then(function (doc) {
      // isAnonymous:true로 남아있는 문서(=아직 국적/약관 동의를 받기 전인
      // 익명 프로필)는 "가입 완료된 회원"으로 치지 않고 마저 정보를
      // 받습니다. 완전히 새 문서가 없는 경우도 마찬가지입니다.
      if (doc.exists && doc.data() && doc.data().isAnonymous !== true) {
        pendingProfileUser = null;
        navigateAfterAuth();
      } else {
        // 국적/언어/약관 동의를 마저 받아야 하므로 아직 리다이렉트를
        // 소비하지 않습니다(완료 후 renderCompleteProfile 쪽에서 처리).
        pendingProfileUser = a.currentUser;
        navigate(ROUTE_PREFIX);
      }
    }).catch(function (err) {
      if (errorP && err && err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        errorP.textContent = (err && err.code === "auth/credential-already-in-use")
          ? t(COMMUNITY_MSG.errEmailInUse) : t(COMMUNITY_MSG.errGeneric);
      }
    }).finally(function () { if (btn) btn.disabled = false; });
  }

  /* Google로 처음 로그인한 회원의 국적/언어/약관 동의를 받는 화면.
     이름은 Google 계정 이름을 기본값으로 채워주고 수정할 수 있게 합니다. */
  function renderCompleteProfile() {
    var user = pendingProfileUser;
    var wrap = el("div", "community-page community-auth");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_AUTH.completeProfileTitle)));
    wrap.appendChild(el("p", "community-gate-desc", t(COMMUNITY_AUTH.completeProfileDesc)));

    var form = el("form", "community-form");
    var nameInput = el("input"); nameInput.type = "text"; nameInput.required = true; nameInput.maxLength = 40;
    nameInput.value = (user && user.displayName) || "";
    var natInput = el("input"); natInput.type = "text"; natInput.setAttribute("list", "communityNationalityList3");
    natInput.placeholder = t(COMMUNITY_AUTH.nationalitySearchPlaceholder); natInput.required = true;
    var datalist = el("datalist"); datalist.id = "communityNationalityList3";
    COUNTRY_LIST.forEach(function (c) { var o = el("option"); o.value = c; datalist.appendChild(o); });

    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ" }[code]);
      opt.value = code;
      if (code === lang) opt.selected = true;
      langSelect.appendChild(opt);
    });

    form.appendChild(formField(COMMUNITY_AUTH.nameLabel, nameInput));
    form.appendChild(formField(COMMUNITY_AUTH.nationalityLabel, natInput));
    form.appendChild(datalist);
    form.appendChild(formField(COMMUNITY_AUTH.langLabel, langSelect));

    var privacyRow = el("label", "community-checkbox-row");
    var privacyInput = el("input"); privacyInput.type = "checkbox"; privacyInput.required = true;
    privacyRow.appendChild(privacyInput);
    privacyRow.appendChild(document.createTextNode(" " + t(COMMUNITY_AUTH.privacyAgree)));
    form.appendChild(privacyRow);

    var rulesRow = el("label", "community-checkbox-row");
    var rulesInput = el("input"); rulesInput.type = "checkbox"; rulesInput.required = true;
    rulesRow.appendChild(rulesInput);
    rulesRow.appendChild(document.createTextNode(" " + t(COMMUNITY_AUTH.rulesAgree)));
    form.appendChild(rulesRow);

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.submitSignup));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!nameInput.value.trim() || !natInput.value.trim()) { errorP.textContent = t(COMMUNITY_MSG.errRequired); return; }
      var d = db();
      if (!d || !user) { errorP.textContent = t(COMMUNITY_MSG.errGeneric); return; }
      submitBtn.disabled = true;
      var now = firebase.firestore.FieldValue.serverTimestamp();
      // 익명이었을 때의 닉네임은 name 필드에 있었습니다(3단계) — Google로
      // 승계 가입해도 그대로 새 nickname 필드로 옮겨 유지합니다.
      var wasAnonymous = !!(profile && profile.isAnonymous);
      var priorNickname = wasAnonymous ? currentDisplayNickname() : "";
      var profileData = {
        name: nameInput.value.trim(),
        nationality: natInput.value.trim(),
        email: user.email || "",
        preferredLanguage: langSelect.value,
        emailVerified: true, // Google 계정은 이미 검증된 이메일입니다
        role: "user",
        status: "active",
        isAnonymous: false,
        createdAt: now,
        lastLoginAt: now,
        termsAgreedAt: now,
        privacyAgreedAt: now
      };
      if (priorNickname) profileData.nickname = priorNickname;
      d.collection("communityUsers").doc(user.uid).set(profileData, { merge: true }).then(function () {
        return loadProfile(user.uid);
      }).then(function () {
        pendingProfileUser = null;
        setLang(langSelect.value);
        navigateAfterAuth();
      }).catch(function () {
        errorP.textContent = t(COMMUNITY_MSG.errGeneric);
        submitBtn.disabled = false;
      });
    });

    wrap.appendChild(form);
    els.root.appendChild(wrap);
  }

  function renderSignup() {
    var wrap = el("div", "community-page community-auth");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_AUTH.signupTitle)));

    var googleErrorP = el("p", "community-form-error");
    wrap.appendChild(buildGoogleButton(googleErrorP));
    wrap.appendChild(googleErrorP);
    wrap.appendChild(el("p", "community-or-divider", t(COMMUNITY_AUTH.orDivider)));

    var form = el("form", "community-form");
    var nameInput = el("input"); nameInput.type = "text"; nameInput.required = true; nameInput.maxLength = 40;
    var natInput = el("input"); natInput.type = "text"; natInput.setAttribute("list", "communityNationalityList");
    natInput.placeholder = t(COMMUNITY_AUTH.nationalitySearchPlaceholder); natInput.required = true;
    var emailInput = el("input"); emailInput.type = "email"; emailInput.autocomplete = "username"; emailInput.required = true;
    var pwInput = el("input"); pwInput.type = "password"; pwInput.autocomplete = "new-password"; pwInput.required = true; pwInput.minLength = 6;
    var pwConfirmInput = el("input"); pwConfirmInput.type = "password"; pwConfirmInput.autocomplete = "new-password"; pwConfirmInput.required = true;

    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ" }[code]);
      opt.value = code;
      if (code === lang) opt.selected = true;
      langSelect.appendChild(opt);
    });

    form.appendChild(formField(COMMUNITY_AUTH.nameLabel, nameInput));
    form.appendChild(formField(COMMUNITY_AUTH.nationalityLabel, natInput));
    var datalist = el("datalist"); datalist.id = "communityNationalityList";
    COUNTRY_LIST.forEach(function (c) { var o = el("option"); o.value = c; datalist.appendChild(o); });
    form.appendChild(datalist);
    form.appendChild(formField(COMMUNITY_AUTH.emailLabel, emailInput));
    form.appendChild(formField(COMMUNITY_AUTH.passwordLabel, pwInput));
    form.appendChild(formField(COMMUNITY_AUTH.passwordConfirmLabel, pwConfirmInput));
    form.appendChild(formField(COMMUNITY_AUTH.langLabel, langSelect));

    var privacyRow = el("label", "community-checkbox-row");
    var privacyInput = el("input"); privacyInput.type = "checkbox"; privacyInput.required = true;
    privacyRow.appendChild(privacyInput);
    privacyRow.appendChild(document.createTextNode(" " + t(COMMUNITY_AUTH.privacyAgree) + " "));
    var privacyViewBtn = el("button", "community-link-btn-inline", t(COMMUNITY_AUTH.viewText));
    privacyViewBtn.type = "button";
    privacyViewBtn.addEventListener("click", function (e) { e.preventDefault(); window.open(ROUTE_PREFIX + "/privacy", "_blank"); });
    privacyRow.appendChild(privacyViewBtn);
    form.appendChild(privacyRow);

    var rulesRow = el("label", "community-checkbox-row");
    var rulesInput = el("input"); rulesInput.type = "checkbox"; rulesInput.required = true;
    rulesRow.appendChild(rulesInput);
    rulesRow.appendChild(document.createTextNode(" " + t(COMMUNITY_AUTH.rulesAgree) + " "));
    var rulesViewBtn = el("button", "community-link-btn-inline", t(COMMUNITY_AUTH.viewText));
    rulesViewBtn.type = "button";
    rulesViewBtn.addEventListener("click", function (e) { e.preventDefault(); window.open(ROUTE_PREFIX + "/rules", "_blank"); });
    rulesRow.appendChild(rulesViewBtn);
    form.appendChild(rulesRow);

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.submitSignup));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorP.textContent = "";
      if (!nameInput.value.trim() || !natInput.value.trim() || !emailInput.value.trim() || !pwInput.value) {
        errorP.textContent = t(COMMUNITY_MSG.errRequired);
        return;
      }
      if (pwInput.value !== pwConfirmInput.value) {
        errorP.textContent = t(COMMUNITY_MSG.errPasswordMismatch);
        return;
      }
      var a = auth(), d = db();
      if (!a || !d) { errorP.textContent = t(COMMUNITY_MSG.errGeneric); return; }
      submitBtn.disabled = true;
      var now = firebase.firestore.FieldValue.serverTimestamp();
      // 비회원(익명)으로 이미 활동 중이었다면 새 계정을 만들지 않고
      // linkWithCredential로 같은 UID에 이메일/비밀번호만 연결합니다
      // (Anonymous Account Linking) — UID가 그대로라 기존 게시글·댓글의
      // authorId, 신고/차단 기록이 전혀 바뀌지 않습니다. 처음부터
      // 회원가입 화면으로 바로 들어온 경우(활동 이력 없음)에만 새 계정을
      // 만듭니다.
      var wasAnonymous = !!(a.currentUser && a.currentUser.isAnonymous);
      // 익명일 때의 닉네임은 name 필드에 있었습니다(3단계) — 승계 시
      // 그대로 새 nickname 필드로 옮겨 유지합니다(재생성 아님).
      var priorNickname = wasAnonymous ? currentDisplayNickname() : "";
      var authPromise = wasAnonymous
        ? a.currentUser.linkWithCredential(firebase.auth.EmailAuthProvider.credential(emailInput.value.trim(), pwInput.value))
        : a.createUserWithEmailAndPassword(emailInput.value.trim(), pwInput.value);
      authPromise.then(function (cred) {
        // 이메일 인증 절차 없이 바로 가입을 완료합니다(인증메일을 보내지
        // 않고, 이메일 인증 여부를 접근 조건으로 쓰지 않습니다).
        var profileData = {
          name: nameInput.value.trim(),
          nationality: natInput.value.trim(),
          email: emailInput.value.trim(),
          preferredLanguage: langSelect.value,
          emailVerified: true,
          role: "user",
          status: "active",
          isAnonymous: false,
          createdAt: now,
          lastLoginAt: now,
          termsAgreedAt: now,
          privacyAgreedAt: now
        };
        if (priorNickname) profileData.nickname = priorNickname;
        return d.collection("communityUsers").doc(cred.user.uid).set(profileData, { merge: true }).then(function () { return loadProfile(cred.user.uid); });
      }).then(function () {
        pendingProfileUser = null;
        setLang(langSelect.value);
        navigateAfterAuth();
      }).catch(function (err) {
        errorP.textContent = (err && (err.code === "auth/email-already-in-use" || err.code === "auth/credential-already-in-use"))
          ? t(COMMUNITY_MSG.errEmailInUse) : t(COMMUNITY_MSG.errGeneric);
      }).finally(function () { submitBtn.disabled = false; });
    });

    wrap.appendChild(form);

    var links = el("div", "community-auth-links");
    var loginBtn = el("button", "community-link-btn", t(COMMUNITY_AUTH.goLogin));
    loginBtn.type = "button";
    loginBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/login"); });
    links.appendChild(loginBtn);
    wrap.appendChild(links);

    els.root.appendChild(wrap);
  }

  /* ---------------- 내 정보 ---------------- */

  function renderMyPage() {
    var wrap = el("div", "community-page community-my");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_MY.myPageTitle)));

    var isAnon = !!(profile && profile.isAnonymous);
    var info = el("div", "community-my-info");
    info.appendChild(el("p", null, currentDisplayNickname()));
    if (!isAnon) info.appendChild(el("p", "community-my-sub", (profile && profile.nationality) || ""));
    info.appendChild(el("p", "community-my-sub", (authUser && authUser.email) || ""));
    wrap.appendChild(info);

    var editForm = el("form", "community-form");
    // 커뮤니티 게시글·댓글에는 이 닉네임만 표시됩니다(실명 비공개). 비회원
    // (익명)은 실명·국적 자체가 없으므로(3단계 자동 닉네임만 있음) 그
    // 입력칸은 아예 보여주지 않습니다.
    var nicknameInput = el("input"); nicknameInput.type = "text"; nicknameInput.maxLength = 20;
    nicknameInput.value = currentDisplayNickname();
    editForm.appendChild(formField(COMMUNITY_MY.editNickname, nicknameInput));

    var nameInput, natInput, datalist;
    if (!isAnon) {
      nameInput = el("input"); nameInput.type = "text"; nameInput.value = (profile && profile.name) || "";
      natInput = el("input"); natInput.type = "text"; natInput.setAttribute("list", "communityNationalityList2");
      natInput.value = (profile && profile.nationality) || "";
      datalist = el("datalist"); datalist.id = "communityNationalityList2";
      COUNTRY_LIST.forEach(function (c) { var o = el("option"); o.value = c; datalist.appendChild(o); });
      editForm.appendChild(formField(COMMUNITY_MY.editName, nameInput));
      editForm.appendChild(formField(COMMUNITY_MY.editNationality, natInput));
      editForm.appendChild(datalist);
    }
    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ" }[code]);
      opt.value = code;
      if (code === ((profile && profile.preferredLanguage) || lang)) opt.selected = true;
      langSelect.appendChild(opt);
    });
    editForm.appendChild(formField(COMMUNITY_MY.editLang, langSelect));
    var saveBtn = el("button", "community-btn-primary", t(COMMUNITY_MY.save));
    saveBtn.type = "submit";
    editForm.appendChild(saveBtn);
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = db();
      if (!d || !authUser) return;
      // 닉네임을 바꿔도 게시글/댓글의 authorId(작성자 UID)는 그대로라
      // 소유권·신고·차단 기록에는 영향이 없습니다(과거 글에 남은
      // 닉네임 표시만 예전 값 그대로 남고, 새 글부터 새 닉네임 적용).
      var newNickname = nicknameInput.value.trim() || currentDisplayNickname();
      // 비회원(익명)은 name 필드 자체가 화면에 쓰는 닉네임이므로 거기에
      // 저장하고, 가입회원은 별도 nickname 필드에 저장합니다(실명 필드는
      // 그대로 유지).
      var payload = { preferredLanguage: langSelect.value };
      if (isAnon) {
        payload.name = newNickname;
      } else {
        payload.nickname = newNickname;
        payload.name = nameInput.value.trim();
        payload.nationality = natInput.value.trim();
      }
      d.collection("communityUsers").doc(authUser.uid).update(payload).then(function () {
        if (isAnon) { profile.name = newNickname; } else { profile.nickname = newNickname; profile.name = nameInput.value.trim(); profile.nationality = natInput.value.trim(); }
        profile.preferredLanguage = langSelect.value;
        setLang(langSelect.value);
        showToast(t(COMMUNITY_MSG.doneSaved));
      }).catch(function () { showToast(t(COMMUNITY_MSG.errGeneric)); });
    });
    wrap.appendChild(editForm);

    var pwForm = el("form", "community-form");
    var newPw = el("input"); newPw.type = "password"; newPw.minLength = 6; newPw.autocomplete = "new-password";
    pwForm.appendChild(formField(COMMUNITY_MY.editPassword, newPw));
    var pwBtn = el("button", "community-btn-secondary", t(COMMUNITY_MY.save));
    pwBtn.type = "submit";
    pwForm.appendChild(pwBtn);
    pwForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!newPw.value || !authUser) return;
      authUser.updatePassword(newPw.value).then(function () {
        showToast(t(COMMUNITY_MSG.doneSaved));
        newPw.value = "";
      }).catch(function () { showToast(t(COMMUNITY_MSG.errGeneric)); });
    });
    wrap.appendChild(pwForm);

    var tabs = el("div", "community-my-tabs");
    var tabBtns = {};
    ["myPosts", "myComments", "savedPosts"].forEach(function (key, i) {
      var b = el("button", "community-my-tab" + (i === 0 ? " active" : ""), t(COMMUNITY_MY[key]));
      b.type = "button";
      b.addEventListener("click", function () {
        Object.keys(tabBtns).forEach(function (k) { tabBtns[k].classList.remove("active"); });
        b.classList.add("active");
        loadMyList(key, listArea);
      });
      tabBtns[key] = b;
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);
    var listArea = el("div", "community-my-list");
    wrap.appendChild(listArea);
    loadMyList("myPosts", listArea);

    var withdrawBtn = el("button", "community-btn-danger", t(COMMUNITY_MY.withdraw));
    withdrawBtn.type = "button";
    withdrawBtn.addEventListener("click", function () { handleWithdraw(); });
    wrap.appendChild(withdrawBtn);

    var logoutBtn = el("button", "community-btn-secondary", t(COMMUNITY_AUTH.logout));
    logoutBtn.type = "button";
    logoutBtn.setAttribute("data-action", "logout");
    logoutBtn.addEventListener("click", function () { auth() && auth().signOut(); navigate(ROUTE_PREFIX); });
    wrap.appendChild(logoutBtn);

    els.root.appendChild(wrap);
  }

  function loadMyList(kind, container) {
    container.innerHTML = "";
    container.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    var d = db();
    if (!d || !authUser) return;

    var query;
    if (kind === "myPosts") query = d.collection("communityPosts").where("authorId", "==", authUser.uid).orderBy("createdAt", "desc").limit(50);
    else if (kind === "myComments") query = d.collection("communityComments").where("authorId", "==", authUser.uid).orderBy("createdAt", "desc").limit(50);
    else query = d.collection("communitySaves").where("uid", "==", authUser.uid).orderBy("createdAt", "desc").limit(50);

    query.get().then(function (snap) {
      container.innerHTML = "";
      if (snap.empty) { container.appendChild(el("p", "community-empty", t(COMMUNITY_POST.noPosts))); return; }
      if (kind === "savedPosts") {
        var ids = snap.docs.map(function (doc) { return doc.data().postId; });
        Promise.all(ids.map(function (id) { return d.collection("communityPosts").doc(id).get(); })).then(function (docs) {
          container.innerHTML = "";
          docs.filter(function (doc) { return doc.exists; }).forEach(function (doc) {
            container.appendChild(buildPostListItem(Object.assign({ id: doc.id }, doc.data())));
          });
        });
        return;
      }
      snap.forEach(function (doc) {
        var data = doc.data();
        if (kind === "myPosts") {
          container.appendChild(buildPostListItem(Object.assign({ id: doc.id }, data)));
        } else {
          var row = el("div", "community-my-comment-row");
          row.appendChild(el("p", "community-my-comment-text", data.originalContent));
          row.appendChild(el("p", "community-my-sub", formatDate(data.createdAt)));
          row.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/post/" + data.postId); });
          container.appendChild(row);
        }
      });
    }).catch(function () {
      container.innerHTML = "";
      container.appendChild(el("p", "community-form-error", t(COMMUNITY_MSG.errGeneric)));
    });
  }

  function handleWithdraw() {
    if (!window.confirm(t(COMMUNITY_MY.withdrawConfirm))) return;
    var d = db();
    if (!d || !authUser) return;
    var uid = authUser.uid;
    var withdrawnLabel = { ko: "탈퇴회원", zh: "已注销会员", vi: "Thành viên đã xóa", en: "Withdrawn member", mn: "Гарсан гишүүн", bn: "প্রত্যাহারকৃত সদস্য", my: "ရပ်ဆိုင်းထားသောအဖွဲ့ဝင်" }[lang] || "탈퇴회원";

    function anonymizeCollection(collectionName, field) {
      return d.collection(collectionName).where(field, "==", uid).get().then(function (snap) {
        if (snap.empty) return;
        var batch = d.batch();
        snap.forEach(function (doc) { batch.update(doc.ref, { authorNameMasked: withdrawnLabel, authorNationality: "" }); });
        return batch.commit();
      });
    }

    Promise.all([anonymizeCollection("communityPosts", "authorId"), anonymizeCollection("communityComments", "authorId")])
      .then(function () { return d.collection("communityUsers").doc(uid).update({ status: "withdrawn", name: withdrawnLabel, nationality: "" }); })
      .then(function () { return authUser.delete().catch(function () { /* 재로그인 필요할 수 있음 — 상태는 이미 반영됨 */ }); })
      .then(function () { navigate(ROUTE_PREFIX); })
      .catch(function () { showToast(t(COMMUNITY_MSG.errGeneric)); });
  }

  /* ---------------- 게시글 목록 ---------------- */

  function renderList() {
    var wrap = el("div", "community-page community-list-page");

    // 첫 화면: 1.제목 2.짧은 소개 3.카테고리 4.최신 게시글 5.로그인·가입
    // 작은 버튼(비회원일 때만) — 화면 전체를 로그인창으로 덮지 않습니다
    // (2026-09-10 "회원가입 노출 방식 변경" 지시서).
    var homeHeader = el("div", "community-home-header");
    var titleRow = el("div", "community-home-title-row");
    titleRow.appendChild(el("h2", "community-page-title", t(COMMUNITY_HOME.title)));
    if (!authUser) {
      var authActions = el("div", "community-home-auth-actions");
      var loginSmallBtn = el("button", "community-link-btn", t(COMMUNITY_AUTH.loginTitle));
      loginSmallBtn.type = "button";
      loginSmallBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/login"); });
      var signupSmallBtn = el("button", "community-btn-secondary", t(COMMUNITY_AUTH.signupTitle));
      signupSmallBtn.type = "button";
      signupSmallBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/signup"); });
      authActions.appendChild(loginSmallBtn);
      authActions.appendChild(signupSmallBtn);
      titleRow.appendChild(authActions);
    }
    homeHeader.appendChild(titleRow);
    homeHeader.appendChild(el("p", "community-home-tagline", t(COMMUNITY_HOME.tagline)));
    wrap.appendChild(homeHeader);

    var catTabs = el("div", "community-category-tabs");
    COMMUNITY_TAB_ORDER.forEach(function (tabKey) {
      var b = el("button", "community-category-tab" + (state_category === tabKey ? " active" : ""), t(COMMUNITY_TABS[tabKey]));
      b.type = "button";
      b.addEventListener("click", function () { state_category = tabKey; render(); });
      catTabs.appendChild(b);
    });
    wrap.appendChild(catTabs);

    var toolbar = el("div", "community-toolbar");
    var searchInput = el("input", "community-search-input"); searchInput.type = "search"; searchInput.placeholder = t(COMMUNITY_POST.searchPlaceholder);
    searchInput.value = state_search;
    var sortSelect = el("select", "community-sort-select");
    ["latest", "comments"].forEach(function (v) {
      var o = el("option", null, v === "latest" ? t(COMMUNITY_POST.sortLatest) : t(COMMUNITY_POST.sortComments));
      o.value = v; if (v === state_sort) o.selected = true;
      sortSelect.appendChild(o);
    });
    toolbar.appendChild(searchInput);
    toolbar.appendChild(sortSelect);
    wrap.appendChild(toolbar);

    if (state_category === "lifeInfo") {
      var hideDoneRow = el("label", "community-checkbox-row");
      var hideDoneInput = el("input"); hideDoneInput.type = "checkbox"; hideDoneInput.checked = state_hideDone;
      hideDoneRow.appendChild(hideDoneInput);
      hideDoneRow.appendChild(document.createTextNode(" " + t(COMMUNITY_MARKET.hideDone)));
      hideDoneInput.addEventListener("change", function () { state_hideDone = hideDoneInput.checked; renderLoadedPosts(); });
      wrap.appendChild(hideDoneRow);
    }

    if (state_category === "job") {
      var jobFilterBar = el("div", "community-toolbar");
      var jobTypeFilter = el("select", "community-sort-select");
      [["all", COMMUNITY_JOB.filterAll], ["hiring", COMMUNITY_JOB.typeHiring], ["seeking", COMMUNITY_JOB.typeSeeking]].forEach(function (p) {
        var o = el("option", null, t(p[1])); o.value = p[0]; if (p[0] === state_jobType) o.selected = true;
        jobTypeFilter.appendChild(o);
      });
      jobTypeFilter.addEventListener("change", function () { state_jobType = jobTypeFilter.value; renderLoadedPosts(); });
      jobFilterBar.appendChild(jobTypeFilter);

      var industryFilter = el("input", "community-search-input"); industryFilter.type = "search";
      industryFilter.placeholder = t(COMMUNITY_JOB.industryFilterPlaceholder); industryFilter.value = state_jobIndustry;
      industryFilter.addEventListener("input", function () { state_jobIndustry = industryFilter.value; renderLoadedPosts(); });
      jobFilterBar.appendChild(industryFilter);

      var locationFilter = el("input", "community-search-input"); locationFilter.type = "search";
      locationFilter.placeholder = t(COMMUNITY_JOB.locationFilterPlaceholder); locationFilter.value = state_jobLocation;
      locationFilter.addEventListener("input", function () { state_jobLocation = locationFilter.value; renderLoadedPosts(); });
      jobFilterBar.appendChild(locationFilter);
      wrap.appendChild(jobFilterBar);

      var openOnlyRow = el("label", "community-checkbox-row");
      var openOnlyInput = el("input"); openOnlyInput.type = "checkbox"; openOnlyInput.checked = state_jobOpenOnly;
      openOnlyRow.appendChild(openOnlyInput);
      openOnlyRow.appendChild(document.createTextNode(" " + t(COMMUNITY_JOB.openOnlyLabel)));
      openOnlyInput.addEventListener("change", function () { state_jobOpenOnly = openOnlyInput.checked; renderLoadedPosts(); });
      wrap.appendChild(openOnlyRow);
    }

    var writeBtn = el("button", "community-btn-primary community-write-btn", t(COMMUNITY_POST.writeTitle));
    writeBtn.type = "button";
    writeBtn.addEventListener("click", function () {
      ensureAuth().then(function () {
        navigate(ROUTE_PREFIX + "/write");
      }).catch(function () { showAuthGateModal(ROUTE_PREFIX + "/write"); });
    });
    wrap.appendChild(writeBtn);

    var listArea = el("div", "community-post-list");
    wrap.appendChild(listArea);
    els.root.appendChild(wrap);

    var searchDebounce = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () { state_search = searchInput.value; renderLoadedPosts(); }, 250);
    });
    sortSelect.addEventListener("change", function () { state_sort = sortSelect.value; renderLoadedPosts(); });

    renderPostList(listArea);
  }

  var state_category = "all"; // 모바일 UI 개선 5단계: 목록 탭 키("all"/"job"/"schoolLife"/"lifeInfo"/"free")
  var state_search = "";
  var state_sort = "latest";
  var state_hideDone = false;
  var state_jobType = "all";
  var state_jobIndustry = "";
  var state_jobLocation = "";
  var state_jobOpenOnly = false;

  // 페이지네이션 상태 — 카테고리를 바꿀 때만 초기화하고, 검색/정렬/필터를
  // 바꿀 때는 새로 읽지 않고 "이미 불러온 페이지" 안에서만 다시 걸러
  // 보여줍니다(비용 최소화 지시서: 별도 전문검색 없이 현재 불러온 목록
  // 안에서만 클라이언트 검색을 하는 가장 저렴한 방식을 씁니다).
  var state_loadedPosts = [];
  var state_lastPostDoc = null;
  var state_hasMorePosts = true;
  var state_postListLoading = false;
  var state_postListContainer = null;

  function renderPostList(container) {
    state_postListContainer = container;
    state_loadedPosts = [];
    state_lastPostDoc = null;
    state_hasMorePosts = true;
    container.innerHTML = "";
    container.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    fetchPostPage(true);
  }

  function fetchPostPage(isFirstPage) {
    var container = state_postListContainer;
    var d = db();
    if (!d || !container || state_postListLoading || !state_hasMorePosts) return;
    state_postListLoading = true;
    // 모바일 UI 개선 5단계: "전체" 탭은 category 필터 없이 status+createdAt
    // 색인만 쓰고(별도 복합 색인 필요), 그 외 탭은 실제 글 category 값
    // 1개 이상을 in 연산자로 묶어 기존 category+status+createdAt 복합
    // 색인을 그대로 재사용합니다(Firestore in 연산자는 == 와 같은 색인을
    // 씁니다 — 새 색인 불필요).
    var tabCategories = COMMUNITY_TAB_CATEGORIES[state_category];
    var q = d.collection("communityPosts");
    if (tabCategories) q = q.where("category", "in", tabCategories);
    q = q.where("status", "==", "visible")
      .orderBy("createdAt", "desc")
      .limit(POST_PAGE_SIZE);
    if (state_lastPostDoc) q = q.startAfter(state_lastPostDoc);
    q.get()
      .then(function (snap) {
        state_postListLoading = false;
        if (snap.size < POST_PAGE_SIZE) state_hasMorePosts = false;
        if (snap.size) state_lastPostDoc = snap.docs[snap.docs.length - 1];
        snap.forEach(function (doc) { state_loadedPosts.push(Object.assign({ id: doc.id }, doc.data())); });
        renderLoadedPosts();
      })
      .catch(function (err) {
        state_postListLoading = false;
        // 원인을 화면에서 바로 알 수 있도록 콘솔에 그대로 남깁니다(예:
        // Firestore 복합 색인 누락은 "requires an index" 문구와 함께
        // 색인을 바로 만들 수 있는 링크가 여기 찍힙니다).
        console.error("게시글 목록 불러오기 실패:", err);
        if (isFirstPage && container) {
          container.innerHTML = "";
          container.appendChild(el("p", "community-form-error", t(COMMUNITY_MSG.errGeneric)));
        }
      });
  }

  function isPostExpired(p) {
    if (!p.expiresAt || typeof p.expiresAt.toDate !== "function") return false;
    return p.expiresAt.toDate().getTime() < Date.now();
  }

  function renderLoadedPosts() {
    var container = state_postListContainer;
    if (!container) return;
    var posts = state_loadedPosts.slice();

    // 만료된 글(30일 기본, 거래완료 후 7일 단축 등)은 별도 예약 함수 없이
    // 목록을 보여줄 때마다 걸러냅니다(비용 최소화 — cron 없음).
    posts = posts.filter(function (p) { return !isPostExpired(p); });

    if (state_search.trim()) {
      var q = state_search.trim().toLowerCase();
      posts = posts.filter(function (p) {
        var title = (p.originalTitle || "").toLowerCase();
        var content = (p.originalContent || "").toLowerCase();
        return title.indexOf(q) !== -1 || content.indexOf(q) !== -1;
      });
    }
    if (state_category === "lifeInfo" && state_hideDone) {
      posts = posts.filter(function (p) { return p.dealStatus !== "done"; });
    }
    if (state_category === "job") {
      // 기본 목록에서는 모집마감/지원기한 지남/구직완료 글을 항상 제외합니다
      // (별도 필터를 켜지 않아도 제외 — 비용 최소화 지시서 10번).
      posts = posts.filter(function (p) {
        if (p.jobType === "hiring") return p.jobStatus !== "closed" && !isJobDeadlinePassed(p);
        return p.jobStatus !== "done";
      });
      if (state_jobType !== "all") posts = posts.filter(function (p) { return p.jobType === state_jobType; });
      if (state_jobIndustry.trim()) {
        var iq = state_jobIndustry.trim().toLowerCase();
        posts = posts.filter(function (p) { return ((p.industry || p.desiredIndustry || "")).toLowerCase().indexOf(iq) !== -1; });
      }
      if (state_jobLocation.trim()) {
        var lq = state_jobLocation.trim().toLowerCase();
        posts = posts.filter(function (p) { return ((p.workLocation || p.desiredLocation || "")).toLowerCase().indexOf(lq) !== -1; });
      }
      if (state_jobOpenOnly) {
        posts = posts.filter(function (p) {
          if (p.jobType === "hiring") return p.jobStatus === "open" && !isJobDeadlinePassed(p);
          return p.jobStatus === "seeking";
        });
      }
    }
    if (state_sort === "comments") {
      posts.sort(function (a, b) { return (b.commentCount || 0) - (a.commentCount || 0); });
    }

    container.innerHTML = "";
    if (!posts.length) { container.appendChild(el("p", "community-empty", t(COMMUNITY_POST.noPosts))); }
    else { posts.forEach(function (p) { container.appendChild(buildPostListItem(p)); }); }

    if (state_hasMorePosts) {
      var moreBtn = el("button", "community-btn-secondary community-load-more", t(COMMUNITY_POST.loadMore));
      moreBtn.type = "button";
      moreBtn.addEventListener("click", function () { fetchPostPage(false); });
      container.appendChild(moreBtn);
    }
  }

  function localizedTitle(post) {
    if (post.originalLanguage === lang) return post.originalTitle;
    var tr = post.translations && post.translations[lang];
    return (tr && tr.title) || post.originalTitle;
  }

  function toMillisSafe(ts) {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === "string") { var t = new Date(ts).getTime(); return isNaN(t) ? 0 : t; }
    return 0;
  }

  /* 홈 화면의 "커뮤니티 최신 글" 미리보기용. 전체 카테고리를 한 번에
     최신순으로 가져오려면 별도의 복합 색인(status+createdAt)이 더
     필요해지므로, 이미 만들어져 있는 카테고리별 색인
     (category+status+createdAt)을 그대로 재사용해 카테고리마다 최근
     글을 조금씩 가져온 뒤 합쳐서 최신순으로 정렬합니다(Firebase 콘솔에
     새 색인을 추가로 만들 필요가 없습니다). */
  function fetchLatestPostsForHome(count) {
    var d = db();
    if (!d) return Promise.resolve([]);
    var perCategory = Math.min(count, 3);
    var queries = COMMUNITY_CATEGORY_ORDER.map(function (cat) {
      return d.collection("communityPosts")
        .where("category", "==", cat)
        .where("status", "==", "visible")
        .orderBy("createdAt", "desc")
        .limit(perCategory)
        .get()
        .then(function (snap) {
          return snap.docs.map(function (doc) { return Object.assign({ id: doc.id }, doc.data()); });
        })
        .catch(function () { return []; });
    });
    return Promise.all(queries).then(function (lists) {
      var all = [].concat.apply([], lists);
      all.sort(function (a, b) { return toMillisSafe(b.createdAt) - toMillisSafe(a.createdAt); });
      return all.slice(0, count).map(function (post) {
        return {
          id: post.id,
          title: localizedTitle(post),
          // 닉네임(비회원/가입회원)은 그대로, 이 필드가 생기기 전(구 게시글)의
          // 실명만 마스킹해서 홈 미리보기 카드로 내보냅니다.
          authorMasked: (post.authorIsAnonymous || post.authorNameIsNickname) ? (post.authorNameMasked || "") : maskName(post.authorNameMasked),
          nationality: post.authorNationality || "",
          dateText: formatDate(post.createdAt),
          category: post.category
        };
      });
    });
  }

  function localizedContent(post) {
    if (post.originalLanguage === lang) return post.originalContent || "";
    var tr = post.translations && post.translations[lang];
    return (tr && tr.content) || post.originalContent || "";
  }

  // 목록 카드·비회원 미리보기에 쓰는 본문 요약 — 최대 100자, 넘으면
  // 말줄임표 표시. 전화번호/이메일/계좌번호처럼 보이는 문자열은 미리
  // "***"로 가려서 요약에 개인정보가 그대로 노출되지 않게 합니다
  // (2026-09-10 "회원가입 노출 방식 변경" 지시서 5·6번).
  var PERSONAL_INFO_REDACT_PATTERNS = [
    /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g,
    /\b\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4}\b/g,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /\b\d{6}[-\s]?[1-4]\d{6}\b/g,
    /\b\d{10,16}\b/g
  ];

  function redactPersonalInfo(text) {
    var out = String(text || "");
    PERSONAL_INFO_REDACT_PATTERNS.forEach(function (re) { out = out.replace(re, "***"); });
    return out;
  }

  function summarize(post) {
    var text = redactPersonalInfo(localizedContent(post)).trim();
    if (text.length <= SUMMARY_MAX_LEN) return text;
    return text.slice(0, SUMMARY_MAX_LEN) + "…";
  }

  /* 모바일 UI 개선 5단계: 목록 카드에는 최소한의 정보만 표시합니다.
     표시 우선순위 1.카테고리 2.제목 3.핵심 정보(1줄) 4.선택적 썸네일 —
     긴 본문 미리보기·작성자/국적/댓글 수 같은 부가정보는 목록에서
     뺐습니다(상세 화면에서는 그대로 볼 수 있습니다). */
  function buildPostListItem(post) {
    var card = el("div", "community-post-card");
    card.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/post/" + post.id); });

    var catLine = el("span", "community-post-card-cat", t(COMMUNITY_TABS[COMMUNITY_CATEGORY_TO_TAB[post.category]] || COMMUNITY_TABS.free));
    card.appendChild(catLine);

    if (post.category === "market" && post.dealStatus) {
      var statusLabelMap = { selling: COMMUNITY_MARKET.statusSelling, reserved: COMMUNITY_MARKET.statusReserved, done: COMMUNITY_MARKET.statusDone, free: COMMUNITY_MARKET.statusFree };
      var badge = el("span", "community-badge community-badge-" + post.dealStatus, t(statusLabelMap[post.dealStatus]));
      card.appendChild(badge);
    }
    if (post.category === "help" && post.helpStatus) {
      var helpMap = { needed: COMMUNITY_HELP.statusNeeded, inProgress: COMMUNITY_HELP.statusInProgress, resolved: COMMUNITY_HELP.statusResolved };
      var hbadge = el("span", "community-badge community-badge-help-" + post.helpStatus, t(helpMap[post.helpStatus]));
      card.appendChild(hbadge);
    }
    if (post.category === "job") {
      var jTypeMap = { hiring: COMMUNITY_JOB.typeHiring, seeking: COMMUNITY_JOB.typeSeeking };
      card.appendChild(el("span", "community-badge community-badge-job-" + post.jobType, t(jTypeMap[post.jobType])));
      var jEffectiveStatus = post.jobStatus;
      if (post.jobType === "hiring" && isJobDeadlinePassed(post) && post.jobStatus === "open") jEffectiveStatus = "closed";
      var jStatusMap = { open: COMMUNITY_JOB.statusOpen, closed: COMMUNITY_JOB.statusClosed, seeking: COMMUNITY_JOB.statusSeeking, done: COMMUNITY_JOB.statusDone };
      if (jEffectiveStatus) card.appendChild(el("span", "community-badge community-badge-jobstatus-" + jEffectiveStatus, t(jStatusMap[jEffectiveStatus])));
    }

    card.appendChild(el("h3", "community-post-card-title", localizedTitle(post)));

    // 핵심 정보 1줄 — 구인·구직은 위치, 그 외에는 작성일만(부가정보 남발 금지).
    var keyInfo = post.category === "job" ? (post.workLocation || post.desiredLocation || "") : "";
    if (!keyInfo) keyInfo = formatDate(post.createdAt);
    if (keyInfo) card.appendChild(el("p", "community-post-card-meta", keyInfo));

    if (post.photos && post.photos.length) {
      var thumb = document.createElement("img");
      thumb.className = "community-post-card-photo";
      thumb.src = post.photos[0];
      thumb.alt = "";
      thumb.loading = "lazy";
      card.appendChild(thumb);
    }

    var detailBtn = el("button", "community-link-btn community-post-card-detail-btn", t(COMMUNITY_POST.detailBtn));
    detailBtn.type = "button";
    detailBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      navigate(ROUTE_PREFIX + "/post/" + post.id);
    });
    card.appendChild(detailBtn);

    return card;
  }

  /* ---------------- 게시글 상세 ---------------- */

  function renderPostDetail(postId) {
    var wrap = el("div", "community-page community-detail");
    wrap.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    els.root.appendChild(wrap);

    var d = db();
    if (!d) return;
    d.collection("communityPosts").doc(postId).get().then(function (doc) {
      if (!doc.exists || doc.data().status === "deleted") {
        wrap.innerHTML = "";
        wrap.appendChild(el("p", "community-empty", t(COMMUNITY_POST.noPosts)));
        return;
      }
      if (doc.data().status === "hidden") {
        // 신고 누적으로 자동 숨김된 게시글은 회원·비회원 모두 더 이상
        // 열람할 수 없습니다(작성자 본인도 예외 없음).
        wrap.innerHTML = "";
        wrap.appendChild(el("p", "community-empty", t(COMMUNITY_REPORT.hiddenNotice)));
        return;
      }
      var post = Object.assign({ id: doc.id }, doc.data());
      // 2026-09-13 "로그인/회원가입 동선" 지시서: 공개 게시글 상세는
      // 비회원도 그대로 볼 수 있습니다. 글쓰기·댓글 작성·번역·연락처
      // 등 참여 기능만 renderPostDetailBody 안에서 개별적으로
      // 로그인 안내창을 띄웁니다.
      postCache[postId] = post;
      renderPostDetailBody(wrap, post);
    }).catch(function (err) {
      console.error("게시글 상세 불러오기 실패:", err);
      wrap.innerHTML = "";
      wrap.appendChild(el("p", "community-form-error", t(COMMUNITY_MSG.errGeneric)));
    });
  }

  var detailShowOriginal = false;

  function renderPostDetailBody(wrap, post) {
    wrap.innerHTML = "";
    detailShowOriginal = false;

    var isOriginalLang = post.originalLanguage === lang;
    var head = el("div", "community-detail-head");
    head.appendChild(el("span", "community-post-card-cat", t(COMMUNITY_CATEGORIES[post.category])));
    var title = el("h2", "community-detail-title", "");
    head.appendChild(title);
    var meta = el("p", "community-post-card-meta", "");
    head.appendChild(meta);
    wrap.appendChild(head);

    var body = el("div", "community-detail-body");
    var bodyText = el("p", "community-detail-content", "");
    body.appendChild(bodyText);
    var aiNotice = el("p", "community-ai-notice", t(COMMUNITY_POST.aiNotice));
    aiNotice.hidden = true;
    body.appendChild(aiNotice);

    if (!isOriginalLang) {
      var trState = post.translations && post.translations[lang];
      if (trState && trState.content) {
        var toggleBtn = el("button", "community-link-btn", t(COMMUNITY_POST.viewOriginal));
        toggleBtn.type = "button";
        toggleBtn.setAttribute("data-action", "toggle-original");
        toggleBtn.addEventListener("click", function () {
          detailShowOriginal = !detailShowOriginal;
          toggleBtn.textContent = detailShowOriginal ? t(COMMUNITY_POST.viewTranslated) : t(COMMUNITY_POST.viewOriginal);
          fillDetailText(title, bodyText, aiNotice, post);
        });
        body.appendChild(toggleBtn);
      } else if (trState && trState.status === "translating") {
        body.appendChild(el("p", "community-ai-notice", t(COMMUNITY_POST.translating)));
      } else {
        var translateBtn = el("button", "community-btn-secondary", t(COMMUNITY_POST.translateBtn));
        translateBtn.type = "button";
        translateBtn.setAttribute("data-action", "translate-post");
        translateBtn.addEventListener("click", function () {
          if (!authUser) { showAuthGateModal(ROUTE_PREFIX + "/post/" + post.id); return; }
          translateBtn.disabled = true;
          translateBtn.textContent = t(COMMUNITY_POST.translating);
          requestPostTranslation(post).then(function (result) {
            if (result === "quota") {
              translateBtn.disabled = false;
              translateBtn.textContent = t(COMMUNITY_POST.translateBtn);
              showToast(t(COMMUNITY_POST.quotaExceeded));
            } else if (result) {
              renderPostDetailBody(wrap, postCache[post.id]);
            } else {
              translateBtn.disabled = false;
              translateBtn.textContent = t(COMMUNITY_POST.translateBtn);
              showToast(t(COMMUNITY_MSG.errGeneric));
            }
          });
        });
        body.appendChild(translateBtn);
      }
    }
    wrap.appendChild(body);
    fillDetailText(title, bodyText, aiNotice, post);

    if (post.photos && post.photos.length) {
      var gallery = el("div", "community-detail-gallery");
      post.photos.forEach(function (url) {
        var img = document.createElement("img");
        img.src = url; img.alt = ""; img.loading = "lazy";
        gallery.appendChild(img);
      });
      wrap.appendChild(gallery);
    }

    if (post.category === "market") wrap.appendChild(buildMarketPanel(post));
    if (post.category === "help") wrap.appendChild(buildHelpPanel(post));
    if (post.category === "job") wrap.appendChild(buildJobPanel(post));

    if (post.kakaoLink) {
      var kakaoWrap = el("div", "community-kakao-wrap");
      kakaoWrap.appendChild(el("p", "community-kakao-warn", t(COMMUNITY_POST.kakaoWarn)));
      var kakaoBtn = el("a", "community-btn-secondary", t(COMMUNITY_POST.kakaoBtn));
      kakaoBtn.href = post.kakaoLink; kakaoBtn.target = "_blank"; kakaoBtn.rel = "noopener noreferrer";
      // 작성자에게 연락(카카오톡 오픈채팅)은 참여 기능이라 로그인이
      // 필요합니다 — 비회원 클릭 시 실제 링크로 이동하지 않고 안내창만 뜹니다.
      kakaoBtn.addEventListener("click", function (e) {
        if (!authUser) { e.preventDefault(); showAuthGateModal(ROUTE_PREFIX + "/post/" + post.id); }
      });
      kakaoWrap.appendChild(kakaoBtn);
      wrap.appendChild(kakaoWrap);
    }

    var actions = el("div", "community-detail-actions");
    var saveBtn = el("button", "community-btn-secondary", t(COMMUNITY_POST.saveBtn));
    saveBtn.type = "button";
    if (authUser) {
      db().collection("communitySaves").doc(authUser.uid + "_" + post.id).get().then(function (doc) {
        if (doc.exists) saveBtn.textContent = t(COMMUNITY_POST.unsaveBtn);
      });
    }
    // "저장(좋아요류 참여 기능)"은 비회원도 가능합니다 — 처음 누를 때만
    // 조용히 익명 로그인을 마치고 바로 저장까지 진행합니다.
    saveBtn.addEventListener("click", function () {
      ensureAuth().then(function () {
        var ref = db().collection("communitySaves").doc(authUser.uid + "_" + post.id);
        return ref.get().then(function (doc) {
          if (doc.exists) return ref.delete().then(function () { saveBtn.textContent = t(COMMUNITY_POST.saveBtn); });
          return ref.set({ uid: authUser.uid, postId: post.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(function () { saveBtn.textContent = t(COMMUNITY_POST.unsaveBtn); });
        });
      }).catch(function () { showAuthGateModal(ROUTE_PREFIX + "/post/" + post.id); });
    });
    actions.appendChild(saveBtn);

    if (authUser && post.authorId === authUser.uid) {
      var editBtn = el("button", "community-btn-secondary", t(COMMUNITY_POST.editPost));
      editBtn.type = "button";
      editBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/write?edit=" + post.id); editPostId = post.id; render(); });
      actions.appendChild(editBtn);

      var delBtn = el("button", "community-btn-danger", t(COMMUNITY_POST.deletePost));
      delBtn.type = "button";
      delBtn.addEventListener("click", function () {
        if (!window.confirm(t(COMMUNITY_POST.deleteConfirm))) return;
        db().collection("communityPosts").doc(post.id).update({ status: "deleted" }).then(function () {
          navigate(ROUTE_PREFIX);
        });
      });
      actions.appendChild(delBtn);
    } else {
      // 신고는 비회원도 가능합니다(눌렀을 때 buildReportButton 내부에서
      // 필요하면 조용히 익명 로그인 후 제출).
      actions.appendChild(buildReportButton("post", post.id));
    }
    wrap.appendChild(actions);

    var commentsSection = el("div", "community-comments");
    wrap.appendChild(commentsSection);
    renderComments(commentsSection, post.id);
  }

  function fillDetailText(titleEl, bodyEl, aiNoticeEl, post) {
    var isOriginalLang = post.originalLanguage === lang;
    var useOriginal = isOriginalLang || detailShowOriginal;
    if (useOriginal) {
      titleEl.textContent = post.originalTitle;
      bodyEl.textContent = post.originalContent;
      aiNoticeEl.hidden = true;
    } else {
      var tr = post.translations && post.translations[lang];
      if (tr) {
        titleEl.textContent = tr.title;
        bodyEl.textContent = tr.content;
        aiNoticeEl.hidden = false;
      } else {
        titleEl.textContent = post.originalTitle;
        bodyEl.textContent = post.originalContent;
        aiNoticeEl.hidden = true;
      }
    }
  }

  function buildMarketPanel(post) {
    var panel = el("div", "community-market-panel");
    panel.appendChild(el("p", null, t(COMMUNITY_MARKET.priceLabel) + ": " + (post.isFree ? t(COMMUNITY_MARKET.freeShare) : (post.price || "-"))));
    if (post.dealLocation) panel.appendChild(el("p", null, t(COMMUNITY_MARKET.locationLabel) + ": " + post.dealLocation));
    if (post.itemCondition) panel.appendChild(el("p", null, t(COMMUNITY_MARKET.conditionLabel) + ": " + post.itemCondition));
    panel.appendChild(el("p", "community-safety-notice", t(COMMUNITY_MARKET.safetyNotice)));

    if (authUser && post.authorId === authUser.uid) {
      var statusSelect = el("select");
      [["selling", COMMUNITY_MARKET.statusSelling], ["reserved", COMMUNITY_MARKET.statusReserved], ["done", COMMUNITY_MARKET.statusDone], ["free", COMMUNITY_MARKET.statusFree]]
        .forEach(function (pair) {
          var o = el("option", null, t(pair[1])); o.value = pair[0];
          if (post.dealStatus === pair[0]) o.selected = true;
          statusSelect.appendChild(o);
        });
      statusSelect.addEventListener("change", function () {
        var update = { dealStatus: statusSelect.value };
        // 거래완료로 바꾸면 노출 기간을 7일로 단축합니다(비용 절감 —
        // 별도 예약 함수 없이 조회 시점에 만료된 글만 걸러냅니다).
        if (statusSelect.value === "done") {
          update.expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        }
        db().collection("communityPosts").doc(post.id).update(update);
      });
      panel.appendChild(statusSelect);

      var extendBtn = el("button", "community-btn-secondary", t(COMMUNITY_MARKET.extend));
      extendBtn.type = "button";
      extendBtn.addEventListener("click", function () {
        var newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        db().collection("communityPosts").doc(post.id).update({
          expiresAt: firebase.firestore.Timestamp.fromDate(newExpiry),
          extendedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () { showToast(t(COMMUNITY_MSG.doneSaved)); });
      });
      panel.appendChild(extendBtn);
    }
    return panel;
  }

  function buildHelpPanel(post) {
    var panel = el("div", "community-help-panel");
    var typeMap = { school: COMMUNITY_HELP.typeSchool, korean: COMMUNITY_HELP.typeKorean, hospital: COMMUNITY_HELP.typeHospital, transport: COMMUNITY_HELP.typeTransport, admin: COMMUNITY_HELP.typeAdmin, lost: COMMUNITY_HELP.typeLost, life: COMMUNITY_HELP.typeLife, etc: COMMUNITY_HELP.typeEtc };
    if (post.helpType) panel.appendChild(el("p", null, t(COMMUNITY_HELP.typeLabel) + ": " + t(typeMap[post.helpType])));
    panel.appendChild(el("p", "community-safety-notice", t(COMMUNITY_HELP.emergencyNotice)));

    if (authUser && post.authorId === authUser.uid) {
      var statusSelect = el("select");
      [["needed", COMMUNITY_HELP.statusNeeded], ["inProgress", COMMUNITY_HELP.statusInProgress], ["resolved", COMMUNITY_HELP.statusResolved]]
        .forEach(function (pair) {
          var o = el("option", null, t(pair[1])); o.value = pair[0];
          if (post.helpStatus === pair[0]) o.selected = true;
          statusSelect.appendChild(o);
        });
      statusSelect.addEventListener("change", function () {
        db().collection("communityPosts").doc(post.id).update({ helpStatus: statusSelect.value });
      });
      panel.appendChild(statusSelect);
    }
    return panel;
  }

  function isJobDeadlinePassed(post) {
    if (!post.deadline) return false;
    var today = new Date();
    var todayKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    return post.deadline < todayKey;
  }

  function buildJobPanel(post) {
    var panel = el("div", "community-help-panel");
    var isHiring = post.jobType === "hiring";
    panel.appendChild(el("p", null, t(COMMUNITY_JOB.typeLabel) + ": " + t(isHiring ? COMMUNITY_JOB.typeHiring : COMMUNITY_JOB.typeSeeking)));

    if (isHiring) {
      [[COMMUNITY_JOB.industryLabel, post.industry], [COMMUNITY_JOB.workLocationLabel, post.workLocation],
       [COMMUNITY_JOB.jobDescriptionLabel, post.jobDescription], [COMMUNITY_JOB.workDaysLabel, post.workDays],
       [COMMUNITY_JOB.workHoursLabel, post.workHours], [COMMUNITY_JOB.salaryLabel, post.salary],
       [COMMUNITY_JOB.deadlineLabel, post.deadline], [COMMUNITY_JOB.contactMethodLabel, post.contactMethod],
       [COMMUNITY_JOB.koreanLevelLabel, post.koreanLevel], [COMMUNITY_JOB.experienceLabel, post.experience]]
        .forEach(function (pair) { if (pair[1]) panel.appendChild(el("p", null, t(pair[0]) + ": " + pair[1])); });
    } else {
      [[COMMUNITY_JOB.desiredIndustryLabel, post.desiredIndustry], [COMMUNITY_JOB.availableDaysLabel, post.availableDays],
       [COMMUNITY_JOB.availableHoursLabel, post.availableHours], [COMMUNITY_JOB.desiredLocationLabel, post.desiredLocation],
       [COMMUNITY_JOB.availableLanguagesLabel, post.availableLanguages], [COMMUNITY_JOB.contactMethodLabel, post.contactMethod],
       [COMMUNITY_JOB.experienceLabel, post.experience], [COMMUNITY_JOB.koreanLevelLabel, post.koreanLevel]]
        .forEach(function (pair) { if (pair[1]) panel.appendChild(el("p", null, t(pair[0]) + ": " + pair[1])); });
    }

    var effectiveStatus = post.jobStatus;
    if (isHiring && isJobDeadlinePassed(post) && post.jobStatus === "open") effectiveStatus = "closed";
    var statusLabelMap = { open: COMMUNITY_JOB.statusOpen, closed: COMMUNITY_JOB.statusClosed, seeking: COMMUNITY_JOB.statusSeeking, done: COMMUNITY_JOB.statusDone };
    panel.appendChild(el("p", null, t(COMMUNITY_JOB.statusLabel) + ": " + t(statusLabelMap[effectiveStatus])));
    panel.appendChild(el("p", "community-safety-notice", t(COMMUNITY_JOB.safetyNotice)));

    if (authUser && post.authorId === authUser.uid) {
      var statusSelect = el("select");
      var options = isHiring
        ? [["open", COMMUNITY_JOB.statusOpen], ["closed", COMMUNITY_JOB.statusClosed]]
        : [["seeking", COMMUNITY_JOB.statusSeeking], ["done", COMMUNITY_JOB.statusDone]];
      options.forEach(function (pair) {
        var o = el("option", null, t(pair[1])); o.value = pair[0];
        if (post.jobStatus === pair[0]) o.selected = true;
        statusSelect.appendChild(o);
      });
      statusSelect.addEventListener("change", function () {
        db().collection("communityPosts").doc(post.id).update({ jobStatus: statusSelect.value });
      });
      panel.appendChild(statusSelect);

      var extendBtn = el("button", "community-btn-secondary", t(COMMUNITY_JOB.extend));
      extendBtn.type = "button";
      extendBtn.addEventListener("click", function () {
        var newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        db().collection("communityPosts").doc(post.id).update({
          expiresAt: firebase.firestore.Timestamp.fromDate(newExpiry),
          extendedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function () { showToast(t(COMMUNITY_MSG.doneSaved)); });
      });
      panel.appendChild(extendBtn);
    }
    return panel;
  }

  /* ---------------- 신고 ---------------- */

  function buildReportButton(targetType, targetId) {
    var btn = el("button", "community-btn-secondary", t(COMMUNITY_REPORT.reportBtn));
    btn.type = "button";
    btn.setAttribute("data-action", "report");
    btn.addEventListener("click", function () { openReportModal(targetType, targetId); });
    return btn;
  }

  function openReportModal(targetType, targetId) {
    var overlay = el("div", "modal-overlay");
    var modal = el("div", "modal");
    modal.appendChild(el("h3", "modal-title", t(COMMUNITY_REPORT.reportTitle)));

    var reasons = ["reasonScam", "reasonAbuse", "reasonPrivacy", "reasonIllegal", "reasonAd", "reasonMeet", "reasonEtc"];
    var selected = null;
    var reasonList = el("div", "community-reason-list");
    reasons.forEach(function (key) {
      var b = el("button", "community-reason-btn", t(COMMUNITY_REPORT[key]));
      b.type = "button";
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(reasonList.children, function (c) { c.classList.remove("active"); });
        b.classList.add("active");
        selected = key;
      });
      reasonList.appendChild(b);
    });
    modal.appendChild(reasonList);

    var errorP = el("p", "community-form-error");
    modal.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_REPORT.submitReport));
    submitBtn.type = "button";
    submitBtn.addEventListener("click", function () {
      if (!selected) { errorP.textContent = t(COMMUNITY_MSG.errRequired); return; }
      // 신고도 비회원 가능 — 처음 누를 때만 조용히 익명 로그인 후 제출합니다.
      ensureAuth().then(function () {
        return submitReport(targetType, targetId, selected);
      }).then(function (ok) {
        if (ok) { showToast(t(COMMUNITY_REPORT.reportDone)); overlay.remove(); }
        else errorP.textContent = t(COMMUNITY_REPORT.alreadyReported);
      }).catch(function () { errorP.textContent = t(COMMUNITY_MSG.errRequired); });
    });
    modal.appendChild(submitBtn);

    var closeBtn = el("button", "modal-close", "×");
    closeBtn.setAttribute("aria-label", "닫기");
    closeBtn.type = "button";
    closeBtn.addEventListener("click", function () { overlay.remove(); });
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  function submitReport(targetType, targetId, reason) {
    var d = db();
    if (!d || !authUser) return Promise.resolve(false);
    var collectionName = targetType === "post" ? "communityPosts" : "communityComments";
    var targetRef = d.collection(collectionName).doc(targetId);
    var reportRef = d.collection("communityReports").doc(targetType + "_" + targetId + "_" + authUser.uid);

    return d.runTransaction(function (tx) {
      return tx.get(reportRef).then(function (reportSnap) {
        if (reportSnap.exists) throw new Error("ALREADY_REPORTED");
        return tx.get(targetRef).then(function (targetSnap) {
          if (!targetSnap.exists) throw new Error("NOT_FOUND");
          var newCount = (targetSnap.data().reportCount || 0) + 1;
          tx.set(reportRef, {
            targetType: targetType, targetId: targetId, reporterId: authUser.uid,
            reason: reason, createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: "pending"
          });
          var updates = { reportCount: newCount };
          if (newCount >= 3 && targetSnap.data().status === "visible") updates.status = "hidden";
          tx.update(targetRef, updates);
        });
      });
    }).then(function () { return true; }).catch(function () { return false; });
  }

  /* ---------------- 댓글 ---------------- */

  function renderComments(container, postId) {
    container.innerHTML = "";
    container.appendChild(el("h3", "community-comments-title", t(COMMUNITY_COMMENT.writeLabel)));

    if (authUser) {
      var form = el("form", "community-comment-form");
      var textarea = el("textarea"); textarea.maxLength = COMMENT_MAX_LEN; textarea.required = true;
      form.appendChild(textarea);
      var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_COMMENT.submitComment));
      submitBtn.type = "submit";
      form.appendChild(submitBtn);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!textarea.value.trim()) return;
        submitBtn.disabled = true;
        postComment(postId, textarea.value.trim(), null).then(function () {
          textarea.value = "";
          loadCommentList(postId, listEl);
        }).catch(function (err) {
          showToast((err && err.message === "TOO_SOON") ? t(COMMUNITY_MSG.errTooSoon) : t(COMMUNITY_MSG.errGeneric));
        }).finally(function () { submitBtn.disabled = false; });
      });
      container.appendChild(form);
    } else {
      // 비회원도 댓글 작성 가능 — 처음 누를 때만 조용히 익명 로그인을
      // 마치고, 같은 자리에 바로 작성 폼을 보여줍니다.
      var guestCommentBtn = el("button", "community-btn-secondary", t(COMMUNITY_COMMENT.submitComment));
      guestCommentBtn.type = "button";
      guestCommentBtn.addEventListener("click", function () {
        guestCommentBtn.disabled = true;
        ensureAuth().then(function () {
          renderComments(container, postId);
        }).catch(function () {
          guestCommentBtn.disabled = false;
          showAuthGateModal(ROUTE_PREFIX + "/post/" + postId);
        });
      });
      container.appendChild(guestCommentBtn);
    }

    var listEl = el("div", "community-comment-list");
    container.appendChild(listEl);
    loadCommentList(postId, listEl);
  }

  /* ---------------- 하루 작성 한도(비용 최소화) ---------------- */

  function seoulDateKey() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }

  function rateLimitRef() {
    return db().collection("communityRateLimits").doc(authUser.uid + "_" + seoulDateKey());
  }

  // 짧은 시간 반복 글쓰기/댓글 도배 방지(2026-09-12 6단계 지시서) — 새
  // 보안 서비스 없이, 기존 하루 한도 카운터 문서(communityRateLimits)에
  // 마지막 작성 시각만 추가로 기록해 재사용합니다. UID별 문서라 닉네임을
  // 바꿔도 우회할 수 없습니다. 실제 차단은 Firestore 규칙에서도 같은
  // 간격을 다시 확인합니다(클라이언트만 믿지 않음).
  var POST_COOLDOWN_MS = 10 * 1000;
  var COMMENT_COOLDOWN_MS = 5 * 1000;

  /* 게시글/댓글을 실제로 쓰는 것과 "하루 작성 한도" 카운터를 같은
     트랜잭션으로 묶어서, 한도를 넘으면 카운터 문서 쓰기 자체가
     보안 규칙에서 거부되어 게시글/댓글 쓰기까지 함께 취소되도록
     합니다(클라이언트가 카운터 증가를 건너뛰고 글만 쓰는 것을 막음). */
  function withRateLimit(kind, writeFn) {
    var d = db();
    var rlRef = rateLimitRef();
    return d.runTransaction(function (tx) {
      return tx.get(rlRef).then(function (snap) {
        var cur = snap.exists ? snap.data() : { postCount: 0, commentCount: 0 };
        var next = { postCount: cur.postCount || 0, commentCount: cur.commentCount || 0 };
        if (kind === "post") {
          if (Date.now() - toMillisSafe(cur.lastPostAt) < POST_COOLDOWN_MS) throw new Error("TOO_SOON");
          next.postCount += 1;
          next.lastPostAt = firebase.firestore.FieldValue.serverTimestamp();
        } else {
          if (Date.now() - toMillisSafe(cur.lastCommentAt) < COMMENT_COOLDOWN_MS) throw new Error("TOO_SOON");
          next.commentCount += 1;
          next.lastCommentAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        tx.set(rlRef, next, { merge: true });
        return writeFn(tx);
      });
    });
  }

  function postComment(postId, content, parentId) {
    var d = db();
    var ref = d.collection("communityComments").doc();
    var postRef = d.collection("communityPosts").doc(postId);
    var payload = {
      postId: postId,
      parentCommentId: parentId || null,
      authorId: authUser.uid,
      authorNameMasked: currentDisplayNickname(),
      authorNameIsNickname: true, // 실명이 아니라 닉네임임을 표시(구 댓글과 구분해 마스킹 처리)
      authorNationality: (profile && profile.nationality) || "",
      authorIsAnonymous: !!(profile && profile.isAnonymous),
      originalLanguage: lang,
      originalContent: content,
      translations: {},
      reportCount: 0,
      status: "visible",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return withRateLimit("comment", function (tx) {
      tx.set(ref, payload);
      tx.update(postRef, { commentCount: firebase.firestore.FieldValue.increment(1) });
    });
  }

  // 댓글도 게시글 목록과 같은 방식으로 페이지네이션합니다 — 처음 20개만
  // 불러오고 "더보기"를 누를 때마다 20개씩 이어서 불러옵니다(비용 최소화
  // 지시서: 실시간 리스너 없음, 한 번에 다 불러오지 않음). 답글은 항상
  // 원댓글보다 나중에 작성되므로(createdAt 오름차순) 답글이 로드된
  // 시점에는 그 원댓글도 이미 같은 배치 안에(또는 이전 페이지에) 들어있어
  // 그룹핑이 깨지지 않습니다. 기존 쿼리(postId/status 동등조건 +
  // createdAt 정렬)를 그대로 재사용해 새 복합 인덱스가 필요 없습니다.
  var state_commentListPostId = null;
  var state_commentListContainer = null;
  var state_loadedComments = [];
  var state_lastCommentDoc = null;
  var state_hasMoreComments = true;
  var state_commentListLoading = false;

  function loadCommentList(postId, container) {
    state_commentListPostId = postId;
    state_commentListContainer = container;
    state_loadedComments = [];
    state_lastCommentDoc = null;
    state_hasMoreComments = true;
    container.innerHTML = "";
    container.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    fetchCommentPage(true);
  }

  function fetchCommentPage(isFirstPage) {
    var postId = state_commentListPostId;
    var container = state_commentListContainer;
    var d = db();
    if (!d || !container || state_commentListLoading || !state_hasMoreComments) return;
    state_commentListLoading = true;
    var q = d.collection("communityComments").where("postId", "==", postId).where("status", "==", "visible")
      .orderBy("createdAt", "asc").limit(COMMENT_PAGE_SIZE);
    if (state_lastCommentDoc) q = q.startAfter(state_lastCommentDoc);
    q.get().then(function (snap) {
      state_commentListLoading = false;
      if (snap.size < COMMENT_PAGE_SIZE) state_hasMoreComments = false;
      if (snap.size) state_lastCommentDoc = snap.docs[snap.docs.length - 1];
      snap.forEach(function (doc) { state_loadedComments.push(Object.assign({ id: doc.id }, doc.data())); });
      renderLoadedComments();
    }).catch(function (err) {
      state_commentListLoading = false;
      console.error("댓글 목록 불러오기 실패:", err);
      if (isFirstPage && container) {
        container.innerHTML = "";
        container.appendChild(el("p", "community-form-error", t(COMMUNITY_MSG.errGeneric)));
      }
    });
  }

  function renderLoadedComments() {
    var container = state_commentListContainer;
    var postId = state_commentListPostId;
    if (!container) return;
    container.innerHTML = "";
    var all = state_loadedComments;
    if (!all.length) {
      container.appendChild(el("p", "community-empty", t(COMMUNITY_COMMENT.noComments)));
    } else {
      var topLevel = all.filter(function (c) { return !c.parentCommentId; });
      var replies = all.filter(function (c) { return c.parentCommentId; });
      topLevel.forEach(function (c) {
        container.appendChild(buildCommentNode(c, postId, container));
        replies.filter(function (r) { return r.parentCommentId === c.id; }).forEach(function (r) {
          var node = buildCommentNode(r, postId, container);
          node.classList.add("community-comment-reply");
          container.appendChild(node);
        });
      });
    }
    if (state_hasMoreComments) {
      var moreBtn = el("button", "community-btn-secondary community-load-more", t(COMMUNITY_POST.loadMore));
      moreBtn.type = "button";
      moreBtn.addEventListener("click", function () { fetchCommentPage(false); });
      container.appendChild(moreBtn);
    }
  }

  function buildCommentNode(c, postId, listContainer) {
    var node = el("div", "community-comment");
    // 자동 생성된 비회원 닉네임은 실명이 아니므로 마스킹하지 않고 그대로 보여줍니다.
    // 닉네임(비회원 자동 닉네임/가입회원 닉네임)은 그대로 보여주고,
    // 이 필드가 생기기 전(구 댓글)에 저장된 실명만 마스킹합니다.
    var displayName = (c.authorIsAnonymous || c.authorNameIsNickname) ? (c.authorNameMasked || "") : maskName(c.authorNameMasked);
    var metaText = [displayName, c.authorNationality, formatDate(c.createdAt)].filter(Boolean).join(" · ");
    var meta = el("p", "community-comment-meta", metaText);
    node.appendChild(meta);
    var textEl = el("p", "community-comment-text", c.originalContent);
    node.appendChild(textEl);

    var showingTranslation = false;
    if (c.originalLanguage !== lang) {
      var toggleBtn = el("button", "community-link-btn", t(COMMUNITY_COMMENT.viewTranslated));
      toggleBtn.type = "button";
      toggleBtn.setAttribute("data-action", "translate-comment");
      toggleBtn.addEventListener("click", function () {
        if (showingTranslation) {
          textEl.textContent = c.originalContent;
          toggleBtn.textContent = t(COMMUNITY_COMMENT.viewTranslated);
          showingTranslation = false;
          return;
        }
        if (c.translations && c.translations[lang]) {
          textEl.textContent = c.translations[lang].content;
          toggleBtn.textContent = t(COMMUNITY_COMMENT.viewOriginal);
          showingTranslation = true;
          return;
        }
        toggleBtn.disabled = true;
        toggleBtn.textContent = t(COMMUNITY_COMMENT.translating);
        requestCommentTranslation(c).then(function (content) {
          toggleBtn.disabled = false;
          if (content) {
            c.translations = c.translations || {};
            c.translations[lang] = { content: content };
            textEl.textContent = content;
            toggleBtn.textContent = t(COMMUNITY_COMMENT.viewOriginal);
            showingTranslation = true;
          } else {
            toggleBtn.textContent = t(COMMUNITY_COMMENT.viewTranslated);
          }
        });
      });
      node.appendChild(toggleBtn);
    }

    var actions = el("div", "community-comment-actions");
    if (authUser && c.authorId === authUser.uid) {
      var delBtn = el("button", "community-link-btn", t(COMMUNITY_COMMENT.deleteComment));
      delBtn.type = "button";
      delBtn.addEventListener("click", function () {
        if (!window.confirm(t(COMMUNITY_POST.deleteConfirm))) return;
        db().collection("communityComments").doc(c.id).update({ status: "deleted" }).then(function () {
          loadCommentList(postId, listContainer);
        });
      });
      actions.appendChild(delBtn);
    } else if (!c.parentCommentId) {
      // 답글은 기존처럼 로그인(회원/비회원 익명 세션)한 뒤에만 보입니다
      // (이번 단계에서 새로 넓히는 범위가 아님). 신고는 비회원도 가능합니다.
      if (authUser) {
        var replyBtn = el("button", "community-link-btn", t(COMMUNITY_COMMENT.replyLabel));
        replyBtn.type = "button";
        replyBtn.addEventListener("click", function () {
          var content = window.prompt(t(COMMUNITY_COMMENT.replyLabel) + ":");
          if (content && content.trim()) {
            postComment(postId, content.trim(), c.id).then(function () { loadCommentList(postId, listContainer); }).catch(function (err) {
              showToast((err && err.message === "TOO_SOON") ? t(COMMUNITY_MSG.errTooSoon) : t(COMMUNITY_MSG.errGeneric));
            });
          }
        });
        actions.appendChild(replyBtn);
      }
      actions.appendChild(buildReportButton("comment", c.id));
    }
    node.appendChild(actions);
    return node;
  }

  function requestCommentTranslation(comment) {
    if (!authUser) return Promise.resolve(null);
    return authUser.getIdToken().then(function (idToken) {
      return fetch("/.netlify/functions/community-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translateComment", idToken: idToken,
          originalLanguage: comment.originalLanguage, content: comment.originalContent, targetLanguage: lang
        })
      }).then(function (res) {
        if (res.status === 429) return "quota";
        return res.json();
      }).then(function (data) {
        if (data === "quota") { showToast(t(COMMUNITY_POST.quotaExceeded)); return null; }
        if (!data || !data.content) return null;
        var update = {};
        update["translations." + lang] = { content: data.content };
        db().collection("communityComments").doc(comment.id).update(update)
          .catch(function () { /* 캐시 저장 실패해도 화면 표시는 이미 됨 */ });
        return data.content;
      }).catch(function () { return null; });
    }).catch(function () { return null; });
  }

  /* 게시글 번역(선택한 언어로 번역하기 버튼을 눌렀을 때만 호출).
     여러 사람이 거의 동시에 같은 글·같은 언어를 요청해도 API를 여러 번
     부르지 않도록, 호출 전에 먼저 Firestore에 "번역 중" 상태를 표시해
     둡니다(완벽한 잠금은 아니지만 정확히 동시에 누르는 경우가 아니면
     중복 호출을 막습니다). 반환값: true(성공)/false(실패)/"quota"(한도 초과). */
  function requestPostTranslation(post) {
    if (!authUser) return Promise.resolve(false);
    var d = db();
    var ref = d.collection("communityPosts").doc(post.id);
    var claimField = {};
    claimField["translations." + lang] = { status: "translating" };

    function setStatus(status, extra) {
      var field = {};
      field["translations." + lang] = Object.assign({ status: status }, extra || {});
      return ref.update(field).catch(function () { /* 표시 갱신 실패해도 번역 결과 자체는 유효 */ });
    }

    return ref.update(claimField).catch(function () {}).then(function () {
      return authUser.getIdToken();
    }).then(function (idToken) {
      return fetch("/.netlify/functions/community-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translatePost", idToken: idToken, originalLanguage: post.originalLanguage,
          title: post.originalTitle, content: post.originalContent, targetLanguages: [lang]
        })
      });
    }).then(function (res) {
      if (res.status === 429) {
        return setStatus("failed").then(function () { return "quota"; });
      }
      return res.json().then(function (data) {
        var tr = data && data.translations && data.translations[lang];
        if (tr && tr.title && tr.content) {
          return setStatus("done", { title: tr.title, content: tr.content }).then(function () {
            if (postCache[post.id]) {
              postCache[post.id].translations = postCache[post.id].translations || {};
              postCache[post.id].translations[lang] = { status: "done", title: tr.title, content: tr.content };
            }
            return true;
          });
        }
        return setStatus("failed").then(function () { return false; });
      });
    }).catch(function () {
      return setStatus("failed").then(function () { return false; });
    });
  }

  /* ---------------- 글쓰기 ---------------- */

  var editPostId = null;

  /* ---------------- 구인·구직 게시글 사전 검사(가벼운 키워드/패턴 검사만,
     AI 호출 없음 — 비용 절감을 위해 모든 게시글을 AI로 검사하지 않고
     의심스러운 게시물은 신고 기능으로 관리자가 확인합니다) ---------------- */

  var PERSONAL_INFO_PATTERNS = [
    /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/,        // 휴대폰 번호
    /\b\d{2,4}[-.\s]\d{3,4}[-.\s]\d{4}\b/,          // 일반 전화번호
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // 이메일
    /\b\d{6}[-\s]?[1-4]\d{6}\b/,                    // 주민등록번호/외국인등록번호 형식
    /\b[a-zA-Z]{1,2}\d{7,9}\b/,                     // 여권번호 형식
    /\d{2,6}동\s*\d{1,4}호/,                        // 상세주소(동·호수)
    /\d+\s*번지/,                                   // 상세주소(번지)
    /\b\d{10,16}\b/                                 // 긴 숫자열(계좌번호 등으로 추정)
  ];

  function containsPersonalInfo(text) {
    return PERSONAL_INFO_PATTERNS.some(function (re) { return re.test(text); });
  }

  var BANNED_JOB_KEYWORDS = [
    "선입금", "가입비", "교육비 선납", "보증금 먼저", "수수료 선입금",
    "통장 양도", "통장양도", "통장 판매", "신분증 양도", "체크카드 양도",
    "외국인등록증 사본", "등록증 보내", "여권 보관", "여권 맡기", "여권 제출",
    "고수익 보장", "단순업무 고소득", "조건만남", "성매매", "유흥업소 도우미", "룸싸롱", "노래방 도우미",
    "대리시험", "대리출석", "다단계", "피라미드", "밀수"
  ];

  function containsBannedJobContent(text) {
    var lower = text.toLowerCase();
    return BANNED_JOB_KEYWORDS.some(function (kw) { return lower.indexOf(kw.toLowerCase()) !== -1; });
  }

  function renderWrite() {
    var wrap = el("div", "community-page community-write");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_POST.writeTitle)));

    var form = el("form", "community-form");
    var catSelect = el("select");
    COMMUNITY_CATEGORY_ORDER.forEach(function (cat) {
      var o = el("option", null, t(COMMUNITY_CATEGORIES[cat])); o.value = cat;
      catSelect.appendChild(o);
    });
    form.appendChild(formField(COMMUNITY_POST.categoryLabel, catSelect));

    var titleInput = el("input"); titleInput.type = "text"; titleInput.maxLength = TITLE_MAX_LEN; titleInput.required = true;
    form.appendChild(formField(COMMUNITY_POST.titleLabel, titleInput));

    var contentArea = el("textarea"); contentArea.maxLength = CONTENT_MAX_LEN; contentArea.required = true;
    form.appendChild(formField(COMMUNITY_POST.contentLabel, contentArea));

    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол", bn: "বাংলা", my: "မြန်မာ" }[code]);
      opt.value = code; if (code === lang) opt.selected = true;
      langSelect.appendChild(opt);
    });
    form.appendChild(formField(COMMUNITY_POST.originalLangLabel, langSelect));

    var marketFields = el("div", "community-market-fields");
    var dealTypeSelect = el("select");
    [["sell", COMMUNITY_MARKET.dealTypeSell], ["buy", COMMUNITY_MARKET.dealTypeBuy]].forEach(function (p) {
      var o = el("option", null, t(p[1])); o.value = p[0]; dealTypeSelect.appendChild(o);
    });
    marketFields.appendChild(formField(COMMUNITY_POST.categoryLabel, dealTypeSelect));
    var priceInput = el("input"); priceInput.type = "number"; priceInput.min = "0";
    marketFields.appendChild(formField(COMMUNITY_MARKET.priceLabel, priceInput));
    var freeRow = el("label", "community-checkbox-row");
    var freeInput = el("input"); freeInput.type = "checkbox";
    freeRow.appendChild(freeInput); freeRow.appendChild(document.createTextNode(" " + t(COMMUNITY_MARKET.freeShare)));
    marketFields.appendChild(freeRow);
    var locationInput = el("input"); locationInput.type = "text";
    marketFields.appendChild(formField(COMMUNITY_MARKET.locationLabel, locationInput));
    var conditionInput = el("input"); conditionInput.type = "text";
    marketFields.appendChild(formField(COMMUNITY_MARKET.conditionLabel, conditionInput));
    form.appendChild(marketFields);

    var helpFields = el("div", "community-help-fields");
    var helpTypeSelect = el("select");
    [["school", COMMUNITY_HELP.typeSchool], ["korean", COMMUNITY_HELP.typeKorean], ["hospital", COMMUNITY_HELP.typeHospital],
     ["transport", COMMUNITY_HELP.typeTransport], ["admin", COMMUNITY_HELP.typeAdmin], ["lost", COMMUNITY_HELP.typeLost],
     ["life", COMMUNITY_HELP.typeLife], ["etc", COMMUNITY_HELP.typeEtc]].forEach(function (p) {
      var o = el("option", null, t(p[1])); o.value = p[0]; helpTypeSelect.appendChild(o);
    });
    helpFields.appendChild(formField(COMMUNITY_HELP.typeLabel, helpTypeSelect));
    helpFields.appendChild(el("p", "community-safety-notice", t(COMMUNITY_HELP.emergencyNotice)));
    form.appendChild(helpFields);

    /* 구인·구직 */
    var jobFields = el("div", "community-job-fields");
    var jobTypeSelect = el("select");
    [["hiring", COMMUNITY_JOB.typeHiring], ["seeking", COMMUNITY_JOB.typeSeeking]].forEach(function (p) {
      var o = el("option", null, t(p[1])); o.value = p[0]; jobTypeSelect.appendChild(o);
    });
    jobFields.appendChild(formField(COMMUNITY_JOB.typeLabel, jobTypeSelect));

    var jobHiringFields = el("div", "community-job-hiring-fields");
    var jIndustry = el("input"); jIndustry.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.industryLabel, jIndustry));
    var jWorkLocation = el("input"); jWorkLocation.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.workLocationLabel, jWorkLocation));
    var jJobDescription = el("textarea");
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.jobDescriptionLabel, jJobDescription));
    var jWorkDays = el("input"); jWorkDays.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.workDaysLabel, jWorkDays));
    var jWorkHours = el("input"); jWorkHours.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.workHoursLabel, jWorkHours));
    var jSalary = el("input"); jSalary.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.salaryLabel, jSalary));
    var jDeadline = el("input"); jDeadline.type = "date";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.deadlineLabel, jDeadline));
    var jHiringContact = el("input"); jHiringContact.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.contactMethodLabel, jHiringContact));
    var jHiringKorean = el("input"); jHiringKorean.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.koreanLevelLabel, jHiringKorean));
    var jHiringExperience = el("input"); jHiringExperience.type = "text";
    jobHiringFields.appendChild(formField(COMMUNITY_JOB.experienceLabel, jHiringExperience));
    jobFields.appendChild(jobHiringFields);

    var jobSeekingFields = el("div", "community-job-seeking-fields");
    var jDesiredIndustry = el("input"); jDesiredIndustry.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.desiredIndustryLabel, jDesiredIndustry));
    var jAvailableDays = el("input"); jAvailableDays.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.availableDaysLabel, jAvailableDays));
    var jAvailableHours = el("input"); jAvailableHours.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.availableHoursLabel, jAvailableHours));
    var jDesiredLocation = el("input"); jDesiredLocation.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.desiredLocationLabel, jDesiredLocation));
    var jAvailableLanguages = el("input"); jAvailableLanguages.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.availableLanguagesLabel, jAvailableLanguages));
    var jSeekingContact = el("input"); jSeekingContact.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.contactMethodLabel, jSeekingContact));
    var jSeekingExperience = el("input"); jSeekingExperience.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.experienceLabel, jSeekingExperience));
    var jSeekingKorean = el("input"); jSeekingKorean.type = "text";
    jobSeekingFields.appendChild(formField(COMMUNITY_JOB.koreanLevelLabel, jSeekingKorean));
    jobFields.appendChild(jobSeekingFields);

    jobFields.appendChild(el("p", "community-safety-notice", t(COMMUNITY_JOB.safetyNotice)));
    var jobWarningP = el("p", "community-form-error");
    jobFields.appendChild(jobWarningP);
    form.appendChild(jobFields);

    function updateContentMaxLength() {
      // 구직 게시글의 본문은 "간단한 자기소개"로 쓰이므로 1,000자,
      // 그 외에는 2,000자까지 허용합니다.
      var max = (catSelect.value === "job" && jobTypeSelect.value === "seeking") ? JOB_INTRO_MAX_LEN : CONTENT_MAX_LEN;
      contentArea.maxLength = max;
      if (contentArea.value.length > max) contentArea.value = contentArea.value.slice(0, max);
    }

    function toggleJobTypeFields() {
      jobHiringFields.hidden = jobTypeSelect.value !== "hiring";
      jobSeekingFields.hidden = jobTypeSelect.value !== "seeking";
      updateContentMaxLength();
    }
    jobTypeSelect.addEventListener("change", toggleJobTypeFields);
    toggleJobTypeFields();

    var kakaoInput = el("input"); kakaoInput.type = "url"; kakaoInput.placeholder = "https://open.kakao.com/...";
    form.appendChild(formField({ ko: "카카오톡 오픈채팅 링크(선택)", zh: "KakaoTalk 链接（可选）", vi: "Link KakaoTalk (không bắt buộc)", en: "KakaoTalk link (optional)", mn: "KakaoTalk холбоос (сонголт)", bn: "কাকাওটক ওপেন চ্যাট লিংক (ঐচ্ছিক)", my: "KakaoTalk Open Chat လင့်ခ် (ရွေးချယ်ခွင့်)" }, kakaoInput));

    var photoLabel = el("label", "community-label", t(COMMUNITY_POST.photoLabel));
    form.appendChild(photoLabel);
    var photoInput = el("input"); photoInput.type = "file"; photoInput.accept = "image/jpeg,image/jpg,image/png,image/webp"; photoInput.multiple = true;
    form.appendChild(photoInput);
    var photoPreview = el("div", "community-photo-preview");
    form.appendChild(photoPreview);
    var pendingFiles = [];
    photoInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(photoInput.files || []);
      var maxNow = currentMaxPhotos();
      if (pendingFiles.length + files.length > maxNow) {
        errorP.textContent = t(COMMUNITY_MSG.errPhotoLimit);
        files = files.slice(0, maxNow - pendingFiles.length);
      }
      files.forEach(function (f) {
        pendingFiles.push(f);
        var img = document.createElement("img");
        img.src = URL.createObjectURL(f);
        photoPreview.appendChild(img);
      });
      photoInput.value = "";
    });

    function currentMaxPhotos() { return MAX_PHOTOS; } // 모든 카테고리 사진 1장(비용 최소화)

    function toggleCategoryFields() {
      marketFields.hidden = catSelect.value !== "market";
      helpFields.hidden = catSelect.value !== "help";
      jobFields.hidden = catSelect.value !== "job";
      updateContentMaxLength();
      while (pendingFiles.length > currentMaxPhotos()) {
        pendingFiles.pop();
        if (photoPreview.lastChild) photoPreview.removeChild(photoPreview.lastChild);
      }
    }
    catSelect.addEventListener("change", toggleCategoryFields);
    toggleCategoryFields();

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_POST.submitPost));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorP.textContent = "";
      jobWarningP.textContent = "";
      if (!titleInput.value.trim() || !contentArea.value.trim()) { errorP.textContent = t(COMMUNITY_MSG.errRequired); return; }

      var extra = {};
      if (catSelect.value === "market") {
        extra = {
          dealType: dealTypeSelect.value, price: priceInput.value ? Number(priceInput.value) : null,
          isFree: freeInput.checked, dealLocation: locationInput.value.trim(), itemCondition: conditionInput.value.trim(),
          dealStatus: freeInput.checked ? "free" : "selling",
          expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        };
      } else if (catSelect.value === "help") {
        extra = { helpType: helpTypeSelect.value, helpStatus: "needed" };
      } else if (catSelect.value === "job") {
        if (jobTypeSelect.value === "hiring") {
          if (!jIndustry.value.trim() || !jWorkLocation.value.trim() || !jJobDescription.value.trim() ||
              !jWorkDays.value.trim() || !jWorkHours.value.trim() || !jSalary.value.trim() ||
              !jDeadline.value || !jHiringContact.value.trim()) {
            errorP.textContent = t(COMMUNITY_MSG.errRequired);
            return;
          }
          extra = {
            jobType: "hiring", jobStatus: "open",
            industry: jIndustry.value.trim(), workLocation: jWorkLocation.value.trim(),
            jobDescription: jJobDescription.value.trim(), workDays: jWorkDays.value.trim(),
            workHours: jWorkHours.value.trim(), salary: jSalary.value.trim(),
            deadline: jDeadline.value, contactMethod: jHiringContact.value.trim(),
            koreanLevel: jHiringKorean.value.trim() || null, experience: jHiringExperience.value.trim() || null,
            expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          };
        } else {
          if (!jDesiredIndustry.value.trim() || !jAvailableDays.value.trim() || !jAvailableHours.value.trim() ||
              !jDesiredLocation.value.trim() || !jAvailableLanguages.value.trim() || !jSeekingContact.value.trim()) {
            errorP.textContent = t(COMMUNITY_MSG.errRequired);
            return;
          }
          extra = {
            jobType: "seeking", jobStatus: "seeking",
            desiredIndustry: jDesiredIndustry.value.trim(), availableDays: jAvailableDays.value.trim(),
            availableHours: jAvailableHours.value.trim(), desiredLocation: jDesiredLocation.value.trim(),
            availableLanguages: jAvailableLanguages.value.trim(), contactMethod: jSeekingContact.value.trim(),
            experience: jSeekingExperience.value.trim() || null, koreanLevel: jSeekingKorean.value.trim() || null,
            expiresAt: firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
          };
        }

        var scanText = [titleInput.value, contentArea.value, jHiringContact.value, jSeekingContact.value].join(" ");
        if (containsBannedJobContent(scanText)) {
          jobWarningP.textContent = t(COMMUNITY_JOB.bannedContentError);
          return;
        }
        if (containsPersonalInfo(scanText) && !window.confirm(t(COMMUNITY_JOB.personalInfoWarning))) {
          return;
        }
      }

      submitBtn.disabled = true;
      createOrUpdatePost({
        category: catSelect.value, title: titleInput.value.trim(), content: contentArea.value.trim(),
        originalLanguage: langSelect.value, kakaoLink: kakaoInput.value.trim() || null, extra: extra,
        photoFiles: pendingFiles
      }).then(function (postId) {
        navigate(ROUTE_PREFIX + "/post/" + postId, true);
      }).catch(function (err) {
        errorP.textContent = (err && err.message === "PHOTO_TOO_LARGE") ? t(COMMUNITY_MSG.errPhotoTooLarge)
          : (err && err.message === "TOO_SOON") ? t(COMMUNITY_MSG.errTooSoon) : t(COMMUNITY_MSG.errGeneric);
      }).finally(function () { submitBtn.disabled = false; });
    });

    wrap.appendChild(form);
    els.root.appendChild(wrap);
  }

  /* 사진 압축(2026-09-11 비용 최소화 지시서) — 원본은 저장하지 않고
     압축된 WebP 한 장만 저장합니다. createImageBitmap의
     imageOrientation:"from-image" 옵션으로 방향을 자동 보정하고,
     캔버스로 다시 그리는 과정에서 EXIF·위치정보는 자동으로 사라집니다
     (메타데이터를 옮겨 담지 않으므로 별도 제거 코드가 필요 없습니다).
     기본 품질 65%로 압축하고, 200KB를 넘으면 크기·품질을 한 번 더
     낮춰 재시도하며, 그래도 넘으면 업로드를 거절합니다. 별도의
     썸네일 파일은 만들지 않고 목록·상세화면 모두 같은 파일을 씁니다. */
  function loadImageSource(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
        return loadImageViaTag(file);
      });
    }
    return loadImageViaTag(file);
  }

  function loadImageViaTag(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("IMAGE_LOAD_FAILED")); };
      img.src = url;
    });
  }

  function drawToCanvas(source, maxDim) {
    var srcW = source.width, srcH = source.height;
    var scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    var w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
    var canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(source, 0, 0, w, h);
    return canvas;
  }

  function canvasToWebp(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob); else reject(new Error("COMPRESS_FAILED"));
      }, "image/webp", quality);
    });
  }

  function compressImage(file) {
    return loadImageSource(file).then(function (source) {
      return canvasToWebp(drawToCanvas(source, MAX_PHOTO_DIMENSION), PHOTO_QUALITY_INITIAL).then(function (blob) {
        if (blob.size <= PHOTO_MAX_BYTES) { releaseImageSource(source); return blob; }
        return canvasToWebp(drawToCanvas(source, PHOTO_RETRY_DIMENSION), PHOTO_QUALITY_RETRY).then(function (blob2) {
          releaseImageSource(source);
          if (blob2.size <= PHOTO_MAX_BYTES) return blob2;
          throw new Error("PHOTO_TOO_LARGE");
        });
      }).catch(function (err) {
        releaseImageSource(source);
        throw err;
      });
    });
  }

  function releaseImageSource(source) {
    if (source && typeof source.close === "function") source.close();
  }

  function uploadPhotos(postId, files) {
    var st = storage();
    if (!st || !files.length) return Promise.resolve([]);
    return Promise.all(files.map(function (file, i) {
      return compressImage(file).then(function (blob) {
        var ref = st.ref().child("communityImages/" + postId + "/" + Date.now() + "-" + i + ".webp");
        return ref.put(blob).then(function () { return ref.getDownloadURL(); });
      });
    }));
  }

  function createOrUpdatePost(fields) {
    var d = db();
    var isEdit = !!editPostId;
    var ref = isEdit ? d.collection("communityPosts").doc(editPostId) : d.collection("communityPosts").doc();
    var postId = ref.id;

    return uploadPhotos(postId, fields.photoFiles).then(function (urls) {
      var base = {
        category: fields.category,
        originalLanguage: fields.originalLanguage,
        originalTitle: fields.title,
        originalContent: fields.content,
        kakaoLink: fields.kakaoLink,
        authorId: authUser.uid,
        authorNameMasked: currentDisplayNickname(),
        authorNameIsNickname: true, // 실명이 아니라 닉네임임을 표시(구 게시글과 구분해 마스킹 처리)
        authorNationality: (profile && profile.nationality) || "",
        authorIsAnonymous: !!(profile && profile.isAnonymous),
        status: "visible",
        reportCount: 0,
        commentCount: isEdit ? undefined : 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        // 번역은 등록 시점에 미리 하지 않고, 방문자가 "선택한 언어로
        // 번역하기"를 눌렀을 때만 합니다(비용 최소화). 원문을 수정하면
        // 예전 번역이 남아있지 않도록 비워서, 다음에 보는 사람이 새로
        // 번역하게 합니다(원문이 안 바뀌면 이 값은 그대로 유지됨).
        translations: {}
      };
      if (urls.length) base.photos = urls;
      if (!isEdit) base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      Object.keys(fields.extra || {}).forEach(function (k) { base[k] = fields.extra[k]; });
      Object.keys(base).forEach(function (k) { if (base[k] === undefined) delete base[k]; });

      var writeOp = isEdit ? ref.update(base) : withRateLimit("post", function (tx) { tx.set(ref, base); });
      return writeOp.then(function () {
        editPostId = null;
        return postId;
      });
    });
  }

  /* ---------------- 토스트 ---------------- */

  function showToast(msg) {
    var toast = el("div", "community-toast", msg);
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add("show"); }, 10);
    setTimeout(function () { toast.remove(); }, 2400);
  }

  /* ---------------- 초기화 / 인증 상태 감시 ---------------- */

  function loadProfile(uid) {
    var d = db();
    if (!d) return Promise.resolve(null);
    return d.collection("communityUsers").doc(uid).get().then(function (doc) {
      profile = doc.exists ? doc.data() : null;
      if (profile && profile.preferredLanguage && !document.__communityLangForced) {
        // 최초 진입 시 회원이 저장해둔 언어를 존중(이미 로컬에 언어가
        // 없을 때만) — 기존 저장방식(LANG_KEY)을 그대로 사용합니다.
      }
      return ensureMemberNickname(uid);
    }).catch(function () { profile = null; return null; });
  }

  function setLang(newLang) {
    if (SUPPORTED_LANGS.indexOf(newLang) === -1) return;
    lang = newLang;
    if (els.communityTabBtn) {
      els.communityTabBtn.querySelector(".community-tab-line1").textContent = t(COMMUNITY_NAV.line1);
      els.communityTabBtn.querySelector(".community-tab-line2").textContent = t(COMMUNITY_NAV.line2);
    }
    if (isCommunityPath(location.pathname)) render();
  }

  function init() {
    els.root = qs("communityRoot");
    els.communityTabBtn = qs("communityTabBtn");
    if (!els.root || !els.communityTabBtn) return;

    els.communityTabBtn.querySelector(".community-tab-line1").textContent = t(COMMUNITY_NAV.line1);
    els.communityTabBtn.querySelector(".community-tab-line2").textContent = t(COMMUNITY_NAV.line2);
    els.communityTabBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX); });

    var a = auth();
    if (a) {
      a.onAuthStateChanged(function (user) {
        // ensureAuth()가 이 호출을 직접 유발한 경우, 참여 버튼 핸들러가
        // 이미 스스로 화면을 갱신하므로 여기서는 render()를 건너뜁니다
        // (동시에 render()가 또 실행되어 방금 갱신한 DOM을 덮어쓰는 경쟁
        // 상태를 막기 위함 — authUser/profile 갱신 자체는 그대로 합니다).
        var shouldRender = !suppressNextAuthRender;
        suppressNextAuthRender = false;
        authUser = user;
        if (user) {
          loadProfile(user.uid).then(function () {
            // profile.isAnonymous인데 실제 Firebase Auth 사용자는 이미
            // isAnonymous가 아닌 경우 = 방금 linkWithPopup/linkWithCredential로
            // 계정을 연결(승계)했지만 국적/약관 동의는 아직 못 받은 상태
            // (5단계, Anonymous Account Linking) — 문서가 없는 것과 똑같이
            // 취급해 국적/약관 동의 화면(renderCompleteProfile)으로 보냅니다.
            var needsCompletion = !profile || (profile.isAnonymous && !user.isAnonymous);
            if (needsCompletion) {
              // 비회원(익명) 세션인데 아직 프로필 문서가 없으면 이름/국적
              // 입력 없이 자동 닉네임 프로필을 바로 만듭니다(가입 화면 없음).
              if (user.isAnonymous) {
                createAnonymousProfile(user.uid).then(function () {
                  if (shouldRender && isCommunityPath(location.pathname)) render();
                });
                return;
              }
              // 로그인은 되어 있지만 회원 정보 문서가 없는 계정입니다
              // (Google 첫 로그인, 또는 예전에 가입 도중 문제가 있었던
              // 계정) — 국적/언어/약관 동의부터 받는 화면으로 보냅니다.
              pendingProfileUser = user;
              if (shouldRender && isCommunityPath(location.pathname)) render();
              return;
            }
            pendingProfileUser = null;
            if (db()) db().collection("communityUsers").doc(user.uid).update({
              lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function () {});
            if (shouldRender && isCommunityPath(location.pathname)) render();
          });
        } else {
          profile = null;
          pendingProfileUser = null;
          if (isCommunityPath(location.pathname)) render();
        }
      });
    }

    route();
  }

  return {
    init: init,
    setLang: setLang,
    isCommunityPath: isCommunityPath,
    navigate: navigate,
    routePrefix: ROUTE_PREFIX,
    fetchLatestPosts: fetchLatestPostsForHome,
    showToast: showToast
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("communityRoot")) Community.init();
});

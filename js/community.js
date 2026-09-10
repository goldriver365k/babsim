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
  var SUPPORTED_LANGS = ["ko", "zh", "vi", "en", "mn"];
  var MAX_PHOTOS = 3;
  var MAX_PHOTO_DIMENSION = 1280;
  var PHOTO_QUALITY = 0.78;
  var POST_LIST_LIMIT = 200; // 1차 버전: 최근 N개 안에서 검색/정렬(유료 검색서비스 미사용)

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
    var main = document.querySelector("main");
    if (main) main.hidden = !show;
    var cola = qs("colaBanner");
    if (cola && !show) cola.hidden = true;
    var hello = document.querySelector(".hellokorean-card");
    if (hello) hello.hidden = !show;
    var ownerBanner = document.querySelector(".owner-chat-banner");
    if (ownerBanner) ownerBanner.hidden = !show;
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
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : (ts instanceof Date ? ts : null);
    if (!d) return "";
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return y + "." + m + "." + day;
  }

  /* ---------------- 렌더 디스패처 ---------------- */

  function render() {
    if (!els.root) return;
    els.root.innerHTML = "";
    els.root.hidden = false;

    if (currentRoute.name === "rules") { renderStaticDoc(COMMUNITY_CONSENT.rulesTitle, communityRulesBody()); return; }
    if (currentRoute.name === "privacy") { renderStaticDoc(COMMUNITY_CONSENT.privacyTitle, communityPrivacyBody()); return; }

    var user = authUser;

    if (currentRoute.name === "login") { renderLogin(); return; }
    if (currentRoute.name === "signup") { renderSignup(); return; }

    if (!user) {
      renderLoginGate();
      return;
    }
    // 소셜 로그인(Google) 첫 가입이거나, 어떤 이유로든 회원 정보 문서가
    // 아직 없는 계정은 국적·언어·약관 동의를 받는 화면부터 보여줍니다.
    if (pendingProfileUser) { renderCompleteProfile(); return; }
    if (profile && profile.status === "suspended") { renderSuspended(); return; }

    if (currentRoute.name === "my") { renderMyPage(); return; }
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

  /* ---------------- 로그인 필요 / 정지 안내 ---------------- */

  function renderLoginGate() {
    var wrap = el("div", "community-page community-gate");
    wrap.appendChild(el("h2", "community-page-title", t(COMMUNITY_AUTH.loginRequiredTitle)));
    wrap.appendChild(el("p", "community-gate-desc", t(COMMUNITY_AUTH.loginRequiredDesc)));

    var actions = el("div", "community-gate-actions");
    var loginBtn = el("button", "community-btn-primary", t(COMMUNITY_AUTH.loginTitle));
    loginBtn.type = "button";
    loginBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/login"); });
    var signupBtn = el("button", "community-btn-secondary", t(COMMUNITY_AUTH.signupTitle));
    signupBtn.type = "button";
    signupBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/signup"); });
    actions.appendChild(loginBtn);
    actions.appendChild(signupBtn);
    wrap.appendChild(actions);

    els.root.appendChild(wrap);
  }

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
        navigate(ROUTE_PREFIX);
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
    a.setPersistence(firebase.auth.Auth.Persistence.LOCAL).then(function () {
      return a.signInWithPopup(provider);
    }).then(function (result) {
      return db().collection("communityUsers").doc(result.user.uid).get();
    }).then(function (doc) {
      if (doc.exists) {
        pendingProfileUser = null;
        navigate(ROUTE_PREFIX);
      } else {
        pendingProfileUser = a.currentUser;
        navigate(ROUTE_PREFIX);
      }
    }).catch(function (err) {
      if (errorP && err && err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        errorP.textContent = t(COMMUNITY_MSG.errGeneric);
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
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол" }[code]);
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
      d.collection("communityUsers").doc(user.uid).set({
        name: nameInput.value.trim(),
        nationality: natInput.value.trim(),
        email: user.email || "",
        preferredLanguage: langSelect.value,
        emailVerified: true, // Google 계정은 이미 검증된 이메일입니다
        role: "user",
        status: "active",
        createdAt: now,
        lastLoginAt: now,
        termsAgreedAt: now,
        privacyAgreedAt: now
      }).then(function () {
        return loadProfile(user.uid);
      }).then(function () {
        pendingProfileUser = null;
        setLang(langSelect.value);
        navigate(ROUTE_PREFIX);
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
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол" }[code]);
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
      a.createUserWithEmailAndPassword(emailInput.value.trim(), pwInput.value).then(function (cred) {
        // 이메일 인증 절차 없이 바로 가입을 완료합니다(인증메일을 보내지
        // 않고, 이메일 인증 여부를 접근 조건으로 쓰지 않습니다).
        return d.collection("communityUsers").doc(cred.user.uid).set({
          name: nameInput.value.trim(),
          nationality: natInput.value.trim(),
          email: emailInput.value.trim(),
          preferredLanguage: langSelect.value,
          emailVerified: true,
          role: "user",
          status: "active",
          createdAt: now,
          lastLoginAt: now,
          termsAgreedAt: now,
          privacyAgreedAt: now
        }).then(function () { return loadProfile(cred.user.uid); });
      }).then(function () {
        pendingProfileUser = null;
        setLang(langSelect.value);
        navigate(ROUTE_PREFIX);
      }).catch(function (err) {
        errorP.textContent = (err && err.code === "auth/email-already-in-use")
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

    var info = el("div", "community-my-info");
    info.appendChild(el("p", null, (profile && profile.name) || ""));
    info.appendChild(el("p", "community-my-sub", (profile && profile.nationality) || ""));
    info.appendChild(el("p", "community-my-sub", (authUser && authUser.email) || ""));
    wrap.appendChild(info);

    var editForm = el("form", "community-form");
    var nameInput = el("input"); nameInput.type = "text"; nameInput.value = (profile && profile.name) || "";
    var natInput = el("input"); natInput.type = "text"; natInput.setAttribute("list", "communityNationalityList2");
    natInput.value = (profile && profile.nationality) || "";
    var datalist = el("datalist"); datalist.id = "communityNationalityList2";
    COUNTRY_LIST.forEach(function (c) { var o = el("option"); o.value = c; datalist.appendChild(o); });
    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол" }[code]);
      opt.value = code;
      if (code === ((profile && profile.preferredLanguage) || lang)) opt.selected = true;
      langSelect.appendChild(opt);
    });
    editForm.appendChild(formField(COMMUNITY_MY.editName, nameInput));
    editForm.appendChild(formField(COMMUNITY_MY.editNationality, natInput));
    editForm.appendChild(datalist);
    editForm.appendChild(formField(COMMUNITY_MY.editLang, langSelect));
    var saveBtn = el("button", "community-btn-primary", t(COMMUNITY_MY.save));
    saveBtn.type = "submit";
    editForm.appendChild(saveBtn);
    editForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = db();
      if (!d || !authUser) return;
      d.collection("communityUsers").doc(authUser.uid).update({
        name: nameInput.value.trim(),
        nationality: natInput.value.trim(),
        preferredLanguage: langSelect.value
      }).then(function () {
        profile.name = nameInput.value.trim();
        profile.nationality = natInput.value.trim();
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
    var withdrawnLabel = { ko: "탈퇴회원", zh: "已注销会员", vi: "Thành viên đã xóa", en: "Withdrawn member", mn: "Гарсан гишүүн" }[lang] || "탈퇴회원";

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

    var catTabs = el("div", "community-category-tabs");
    COMMUNITY_CATEGORY_ORDER.forEach(function (cat) {
      var b = el("button", "community-category-tab" + (state_category === cat ? " active" : ""), t(COMMUNITY_CATEGORIES[cat]));
      b.type = "button";
      b.addEventListener("click", function () { state_category = cat; render(); });
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

    if (state_category === "market") {
      var hideDoneRow = el("label", "community-checkbox-row");
      var hideDoneInput = el("input"); hideDoneInput.type = "checkbox"; hideDoneInput.checked = state_hideDone;
      hideDoneRow.appendChild(hideDoneInput);
      hideDoneRow.appendChild(document.createTextNode(" " + t(COMMUNITY_MARKET.hideDone)));
      hideDoneInput.addEventListener("change", function () { state_hideDone = hideDoneInput.checked; renderPostList(listArea); });
      wrap.appendChild(hideDoneRow);
    }

    var writeBtn = el("button", "community-btn-primary community-write-btn", t(COMMUNITY_POST.writeTitle));
    writeBtn.type = "button";
    writeBtn.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/write"); });
    wrap.appendChild(writeBtn);

    var listArea = el("div", "community-post-list");
    wrap.appendChild(listArea);
    els.root.appendChild(wrap);

    var searchDebounce = null;
    searchInput.addEventListener("input", function () {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(function () { state_search = searchInput.value; renderPostList(listArea); }, 250);
    });
    sortSelect.addEventListener("change", function () { state_sort = sortSelect.value; renderPostList(listArea); });

    renderPostList(listArea);
  }

  var state_category = "friends";
  var state_search = "";
  var state_sort = "latest";
  var state_hideDone = false;

  function renderPostList(container) {
    container.innerHTML = "";
    container.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    var d = db();
    if (!d) return;
    d.collection("communityPosts")
      .where("category", "==", state_category)
      .where("status", "==", "visible")
      .orderBy("createdAt", "desc")
      .limit(POST_LIST_LIMIT)
      .get()
      .then(function (snap) {
        var posts = [];
        snap.forEach(function (doc) { posts.push(Object.assign({ id: doc.id }, doc.data())); });

        if (state_search.trim()) {
          var q = state_search.trim().toLowerCase();
          posts = posts.filter(function (p) {
            var title = (p.originalTitle || "").toLowerCase();
            var content = (p.originalContent || "").toLowerCase();
            return title.indexOf(q) !== -1 || content.indexOf(q) !== -1;
          });
        }
        if (state_category === "market" && state_hideDone) {
          posts = posts.filter(function (p) { return p.dealStatus !== "done"; });
        }
        if (state_sort === "comments") {
          posts.sort(function (a, b) { return (b.commentCount || 0) - (a.commentCount || 0); });
        }

        container.innerHTML = "";
        if (!posts.length) { container.appendChild(el("p", "community-empty", t(COMMUNITY_POST.noPosts))); return; }
        posts.forEach(function (p) { container.appendChild(buildPostListItem(p)); });
      })
      .catch(function () {
        container.innerHTML = "";
        container.appendChild(el("p", "community-form-error", t(COMMUNITY_MSG.errGeneric)));
      });
  }

  function localizedTitle(post) {
    if (post.originalLanguage === lang) return post.originalTitle;
    var tr = post.translations && post.translations[lang];
    return (tr && tr.title) || post.originalTitle;
  }

  function buildPostListItem(post) {
    var card = el("div", "community-post-card");
    card.addEventListener("click", function () { navigate(ROUTE_PREFIX + "/post/" + post.id); });

    var catLine = el("span", "community-post-card-cat", t(COMMUNITY_CATEGORIES[post.category]));
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

    card.appendChild(el("h3", "community-post-card-title", localizedTitle(post)));
    var meta = el("p", "community-post-card-meta",
      maskName(post.authorNameMasked || post.authorName) + " · " + (post.authorNationality || "") + " · " + formatDate(post.createdAt) +
      (post.commentCount ? " · " + t(COMMUNITY_POST.commentCount) + " " + post.commentCount : ""));
    card.appendChild(meta);
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
      var post = Object.assign({ id: doc.id }, doc.data());
      postCache[postId] = post;
      renderPostDetailBody(wrap, post);
    }).catch(function () {
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
      var toggleBtn = el("button", "community-link-btn", t(COMMUNITY_POST.viewOriginal));
      toggleBtn.type = "button";
      toggleBtn.setAttribute("data-action", "toggle-original");
      toggleBtn.addEventListener("click", function () {
        detailShowOriginal = !detailShowOriginal;
        toggleBtn.textContent = detailShowOriginal ? t(COMMUNITY_POST.viewTranslated) : t(COMMUNITY_POST.viewOriginal);
        fillDetailText(title, bodyText, aiNotice, post);
      });
      body.appendChild(toggleBtn);
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

    if (post.kakaoLink) {
      var kakaoWrap = el("div", "community-kakao-wrap");
      kakaoWrap.appendChild(el("p", "community-kakao-warn", t(COMMUNITY_POST.kakaoWarn)));
      var kakaoBtn = el("a", "community-btn-secondary", t(COMMUNITY_POST.kakaoBtn));
      kakaoBtn.href = post.kakaoLink; kakaoBtn.target = "_blank"; kakaoBtn.rel = "noopener noreferrer";
      kakaoWrap.appendChild(kakaoBtn);
      wrap.appendChild(kakaoWrap);
    }

    var actions = el("div", "community-detail-actions");
    var saveBtn = el("button", "community-btn-secondary", t(COMMUNITY_POST.saveBtn));
    saveBtn.type = "button";
    var saveDocId = authUser ? (authUser.uid + "_" + post.id) : null;
    if (saveDocId) {
      db().collection("communitySaves").doc(saveDocId).get().then(function (doc) {
        if (doc.exists) saveBtn.textContent = t(COMMUNITY_POST.unsaveBtn);
      });
      saveBtn.addEventListener("click", function () {
        var ref = db().collection("communitySaves").doc(saveDocId);
        ref.get().then(function (doc) {
          if (doc.exists) return ref.delete().then(function () { saveBtn.textContent = t(COMMUNITY_POST.saveBtn); });
          return ref.set({ uid: authUser.uid, postId: post.id, createdAt: firebase.firestore.FieldValue.serverTimestamp() })
            .then(function () { saveBtn.textContent = t(COMMUNITY_POST.unsaveBtn); });
        });
      });
    }
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
    } else if (authUser) {
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
        db().collection("communityPosts").doc(post.id).update({ dealStatus: statusSelect.value });
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
      submitReport(targetType, targetId, selected).then(function (ok) {
        if (ok) { showToast(t(COMMUNITY_REPORT.reportDone)); overlay.remove(); }
        else errorP.textContent = t(COMMUNITY_REPORT.alreadyReported);
      });
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
      var textarea = el("textarea"); textarea.maxLength = 2000; textarea.required = true;
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
        }).finally(function () { submitBtn.disabled = false; });
      });
      container.appendChild(form);
    }

    var listEl = el("div", "community-comment-list");
    container.appendChild(listEl);
    loadCommentList(postId, listEl);
  }

  function postComment(postId, content, parentId) {
    var d = db();
    var ref = d.collection("communityComments").doc();
    var postRef = d.collection("communityPosts").doc(postId);
    var payload = {
      postId: postId,
      parentCommentId: parentId || null,
      authorId: authUser.uid,
      authorNameMasked: (profile && profile.name) || "",
      authorNationality: (profile && profile.nationality) || "",
      originalLanguage: lang,
      originalContent: content,
      translations: {},
      reportCount: 0,
      status: "visible",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return ref.set(payload).then(function () {
      return postRef.update({ commentCount: firebase.firestore.FieldValue.increment(1) });
    });
  }

  function loadCommentList(postId, container) {
    container.innerHTML = "";
    container.appendChild(el("p", "community-loading", t(COMMUNITY_POST.loading)));
    var d = db();
    d.collection("communityComments").where("postId", "==", postId).where("status", "==", "visible")
      .orderBy("createdAt", "asc").limit(300).get().then(function (snap) {
        container.innerHTML = "";
        var all = [];
        snap.forEach(function (doc) { all.push(Object.assign({ id: doc.id }, doc.data())); });
        if (!all.length) { container.appendChild(el("p", "community-empty", t(COMMUNITY_COMMENT.noComments))); return; }
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
      });
  }

  function buildCommentNode(c, postId, listContainer) {
    var node = el("div", "community-comment");
    var meta = el("p", "community-comment-meta", maskName(c.authorNameMasked) + " · " + (c.authorNationality || "") + " · " + formatDate(c.createdAt));
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
    } else if (authUser && !c.parentCommentId) {
      var replyBtn = el("button", "community-link-btn", t(COMMUNITY_COMMENT.replyLabel));
      replyBtn.type = "button";
      replyBtn.addEventListener("click", function () {
        var content = window.prompt(t(COMMUNITY_COMMENT.replyLabel) + ":");
        if (content && content.trim()) {
          postComment(postId, content.trim(), c.id).then(function () { loadCommentList(postId, listContainer); });
        }
      });
      actions.appendChild(replyBtn);
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
      }).then(function (res) { return res.json(); }).then(function (data) {
        if (!data || !data.content) return null;
        var update = {};
        update["translations." + lang] = { content: data.content };
        db().collection("communityComments").doc(comment.id).update(update)
          .catch(function () { /* 캐시 저장 실패해도 화면 표시는 이미 됨 */ });
        return data.content;
      }).catch(function () { return null; });
    }).catch(function () { return null; });
  }

  /* ---------------- 글쓰기 ---------------- */

  var editPostId = null;

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

    var titleInput = el("input"); titleInput.type = "text"; titleInput.maxLength = 100; titleInput.required = true;
    form.appendChild(formField(COMMUNITY_POST.titleLabel, titleInput));

    var contentArea = el("textarea"); contentArea.maxLength = 4000; contentArea.required = true;
    form.appendChild(formField(COMMUNITY_POST.contentLabel, contentArea));

    var langSelect = el("select");
    SUPPORTED_LANGS.forEach(function (code) {
      var opt = el("option", null, { ko: "한국어", zh: "中文", vi: "Tiếng Việt", en: "English", mn: "Монгол" }[code]);
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

    function toggleCategoryFields() {
      marketFields.hidden = catSelect.value !== "market";
      helpFields.hidden = catSelect.value !== "help";
    }
    catSelect.addEventListener("change", toggleCategoryFields);
    toggleCategoryFields();

    var kakaoInput = el("input"); kakaoInput.type = "url"; kakaoInput.placeholder = "https://open.kakao.com/...";
    form.appendChild(formField({ ko: "카카오톡 오픈채팅 링크(선택)", zh: "KakaoTalk 链接（可选）", vi: "Link KakaoTalk (không bắt buộc)", en: "KakaoTalk link (optional)", mn: "KakaoTalk холбоос (сонголт)" }, kakaoInput));

    var photoLabel = el("label", "community-label", t(COMMUNITY_POST.photoLabel));
    form.appendChild(photoLabel);
    var photoInput = el("input"); photoInput.type = "file"; photoInput.accept = "image/jpeg,image/jpg,image/png,image/webp"; photoInput.multiple = true;
    form.appendChild(photoInput);
    var photoPreview = el("div", "community-photo-preview");
    form.appendChild(photoPreview);
    var pendingFiles = [];
    photoInput.addEventListener("change", function () {
      var files = Array.prototype.slice.call(photoInput.files || []);
      if (pendingFiles.length + files.length > MAX_PHOTOS) {
        errorP.textContent = t(COMMUNITY_MSG.errPhotoLimit);
        files = files.slice(0, MAX_PHOTOS - pendingFiles.length);
      }
      files.forEach(function (f) {
        pendingFiles.push(f);
        var img = document.createElement("img");
        img.src = URL.createObjectURL(f);
        photoPreview.appendChild(img);
      });
      photoInput.value = "";
    });

    var errorP = el("p", "community-form-error");
    form.appendChild(errorP);

    var submitBtn = el("button", "community-btn-primary", t(COMMUNITY_POST.submitPost));
    submitBtn.type = "submit";
    form.appendChild(submitBtn);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorP.textContent = "";
      if (!titleInput.value.trim() || !contentArea.value.trim()) { errorP.textContent = t(COMMUNITY_MSG.errRequired); return; }
      submitBtn.disabled = true;

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
      }

      createOrUpdatePost({
        category: catSelect.value, title: titleInput.value.trim(), content: contentArea.value.trim(),
        originalLanguage: langSelect.value, kakaoLink: kakaoInput.value.trim() || null, extra: extra,
        photoFiles: pendingFiles
      }).then(function (postId) {
        navigate(ROUTE_PREFIX + "/post/" + postId, true);
      }).catch(function () {
        errorP.textContent = t(COMMUNITY_MSG.errGeneric);
      }).finally(function () { submitBtn.disabled = false; });
    });

    wrap.appendChild(form);
    els.root.appendChild(wrap);
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob); else reject(new Error("COMPRESS_FAILED"));
        }, "image/jpeg", PHOTO_QUALITY);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("IMAGE_LOAD_FAILED")); };
      img.src = url;
    });
  }

  function uploadPhotos(postId, files) {
    var st = storage();
    if (!st || !files.length) return Promise.resolve([]);
    return Promise.all(files.map(function (file, i) {
      return compressImage(file).then(function (blob) {
        var ref = st.ref().child("communityImages/" + postId + "/" + Date.now() + "-" + i + ".jpg");
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
        authorNameMasked: (profile && profile.name) || "",
        authorNationality: (profile && profile.nationality) || "",
        status: "visible",
        reportCount: 0,
        commentCount: isEdit ? undefined : 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        translationStatus: "pending"
      };
      if (urls.length) base.photos = urls;
      if (!isEdit) base.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      Object.keys(fields.extra || {}).forEach(function (k) { base[k] = fields.extra[k]; });
      Object.keys(base).forEach(function (k) { if (base[k] === undefined) delete base[k]; });

      var writeOp = isEdit ? ref.update(base) : ref.set(base);
      return writeOp.then(function () {
        editPostId = null;
        triggerPostTranslation(postId, fields.originalLanguage, fields.title, fields.content);
        return postId;
      });
    });
  }

  function triggerPostTranslation(postId, originalLanguage, title, content) {
    if (!authUser) return;
    var targets = SUPPORTED_LANGS.filter(function (l) { return l !== originalLanguage; });
    authUser.getIdToken().then(function (idToken) {
      return fetch("/.netlify/functions/community-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "translatePost", idToken: idToken, originalLanguage: originalLanguage, title: title, content: content, targetLanguages: targets })
      });
    }).then(function (res) { return res.json(); }).then(function (data) {
      var update = { translations: data.translations || {} };
      update.translationStatus = (data.failedLanguages && data.failedLanguages.length) ? "failed" : "done";
      return db().collection("communityPosts").doc(postId).update(update);
    }).catch(function () {
      db().collection("communityPosts").doc(postId).update({ translationStatus: "failed" }).catch(function () {});
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
      return profile;
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
        authUser = user;
        if (user) {
          loadProfile(user.uid).then(function () {
            if (!profile) {
              // 로그인은 되어 있지만 회원 정보 문서가 없는 계정입니다
              // (Google 첫 로그인, 또는 예전에 가입 도중 문제가 있었던
              // 계정) — 국적/언어/약관 동의부터 받는 화면으로 보냅니다.
              pendingProfileUser = user;
              if (isCommunityPath(location.pathname)) render();
              return;
            }
            pendingProfileUser = null;
            if (db()) db().collection("communityUsers").doc(user.uid).update({
              lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(function () {});
            if (isCommunityPath(location.pathname)) render();
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

  return { init: init, setLang: setLang, isCommunityPath: isCommunityPath };
})();

document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("communityRoot")) Community.init();
});

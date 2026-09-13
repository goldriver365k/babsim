/* ==========================================================================
   netlify/functions/community-translate.js
   - 유학생 커뮤니티 게시글/댓글 번역 전용 서버 함수입니다.
   - OpenAI API 키는 Netlify 환경변수 OPENAI_API_KEY에서만 읽습니다
     (브라우저에는 절대 전달되지 않습니다). 기존 parse-weekly-menu.js와
     같은 환경변수를 그대로 재사용하며, 새 환경변수를 추가하지 않습니다.
   - 로그인(이메일 인증 완료 + 정지 아님) 회원만 호출할 수 있도록
     Firebase ID 토큰을 검증합니다(parse-weekly-menu.js의 verifyAdmin과
     같은 방식 — Firebase Admin SDK 없이 REST 호출만 사용).
   - 실제 Firestore 저장은 이 함수가 아니라 클라이언트가 합니다(클라이언트
     는 자신이 쓴 글/댓글만 수정할 수 있으므로 보안 규칙으로 이미
     보호됩니다). 이 함수는 "번역 결과 문자열"만 돌려주는 순수 기능입니다.

   호출 방법 (모두 POST, JSON body):
     { action: "translatePost", idToken, originalLanguage, title, content, targetLanguages }
       -> 제목/본문을 요청된 언어들로 한 번의 AI 호출로 번역합니다.
          일부 언어만 실패해도 나머지는 정상 반환합니다(부분 성공).
     { action: "translateComment", idToken, originalLanguage, content, targetLanguage }
       -> 댓글 본문을 요청된 1개 언어로만 번역합니다("번역 보기" 클릭 시에만
          호출 — 등록 시점에는 절대 호출하지 않아 비용을 아낍니다. 이미
          번역된 결과는 클라이언트가 Firestore에 캐시해 재사용합니다).

   비용 절감 (작업지시서 15번 그대로 적용):
   - 원문 등록/수정 시에만 게시글을 번역하고, 댓글은 "번역 보기" 클릭 시
     필요한 언어 1개만 번역합니다(등록 시 5개 언어 전체 번역 안 함).
   - 짧은 번역용 저비용 모델(gpt-4o-mini)을 사용합니다.
   - 입력 글자 수에 상한을 둡니다(제목 200자, 본문 4000자) — 초과하면
     AI를 호출하지 않고 바로 오류를 돌려줍니다.
   - 재시도는 최대 1회로 제한합니다(무한 반복 호출 방지).
   - 사람 이름/브랜드명/학교명/건물명/가격/날짜/전화번호/이메일/URL/
     제품 모델명은 번역하지 말고 원문 그대로 두도록 프롬프트에 명시합니다.
   ========================================================================== */

// 클라이언트(js/firebase-config.js)와 동일한 값 — 공개되어도 안전한
// Firebase Web API 키입니다(비밀키가 아닙니다). ID 토큰 검증에만 씁니다.
const FIREBASE_API_KEY = "AIzaSyCSptfzh0RBVN1dPXLy9oIdE-Kg5vFZb3o";
const FIREBASE_PROJECT_ID = "babsim-46284";

const OPENAI_MODEL = "gpt-4o-mini"; // 번역 전용 저비용 모델
const AI_TIMEOUT_MS = 20000;
const AI_MAX_RETRIES = 1; // 최대 1회만 재시도(작업지시서 15번)
const AI_RETRY_DELAY_MS = 1500;
const RETRYABLE_STATUS = [429, 503];

const MAX_TITLE_CHARS = 200;
const MAX_CONTENT_CHARS = 4000;
// 구인·구직 게시글 상세정보(직접입력 필드) 번역용 — 제목/본문과 같은
// 호출에 묶어서 보내므로 개수·글자수를 짧게 제한합니다(비용 최소화).
const MAX_FIELD_KEYS = 12;
const MAX_FIELD_CHARS = 300;

const SUPPORTED_LANGS = ["ko", "zh", "vi", "en", "mn", "bn", "my"];
const LANG_NAMES = {
  ko: "Korean", zh: "Simplified Chinese", vi: "Vietnamese", en: "English", mn: "Mongolian",
  bn: "Bengali", my: "Burmese (Myanmar)"
};

// 하루 번역 한도 기본값 — communityConfig/limits 문서가 있으면 그 값을
// 우선 사용합니다(관리자가 Firestore 콘솔에서 직접 고칠 수 있음).
const DEFAULT_TRANSLATIONS_PER_DAY_USER = 20;
const DEFAULT_TRANSLATIONS_PER_DAY_SITE = 300;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, CORS_HEADERS),
    body: JSON.stringify(body)
  };
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

/* ---------------- 로그인 확인 (Firebase Admin SDK 없이, ID 토큰 검증만) ---------------- */

async function verifyUser(idToken) {
  if (!idToken || typeof idToken !== "string") return null;
  try {
    const res = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + FIREBASE_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: idToken })
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.users || !data.users.length) return null;
    return data.users[0]; // { localId, email, emailVerified, ... }
  } catch (e) {
    console.error("회원 인증 확인 오류:", e);
    return null;
  }
}

/* 정지 회원 여부 확인 — 본인 문서만 읽을 수 있는 보안 규칙을 그대로
   따르도록 호출자의 idToken을 Bearer 토큰으로 사용합니다(서버가 규칙을
   우회하지 않습니다). */
async function isSuspended(uid, idToken) {
  try {
    const url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID +
      "/databases/(default)/documents/communityUsers/" + uid;
    const res = await fetch(url, { headers: { Authorization: "Bearer " + idToken } });
    if (!res.ok) return false; // 문서가 아직 없는 등은 신규 회원 — 정지 아님으로 취급
    const data = await res.json();
    const status = data && data.fields && data.fields.status && data.fields.status.stringValue;
    return status === "suspended" || status === "withdrawn";
  } catch (e) {
    console.error("회원 상태 확인 오류:", e);
    return false;
  }
}

/* ---------------- 하루 번역 한도 확인/증가 (Firestore REST) ----------------
   - Firebase Admin SDK 없이, 호출자 본인의 idToken을 Bearer 토큰으로 사용해
     communityRateLimits(회원별)·communitySiteRateLimits(사이트 전체) 문서를
     읽고/늘립니다 — 보안 규칙이 한도를 다시 검증하므로 서버 코드가 규칙을
     우회하지 않습니다.
   - 원자적 증가(transform)가 아니라 "읽고 +1 해서 PATCH"하는 방식이라
     아주 드물게 동시 요청이 겹치면 한도가 1~2회 정도 느슨해질 수 있습니다.
     이 한도는 비용 관리용 소프트 한도이므로 이 정도 오차는 허용합니다
     (엄격한 보안 경계는 이미 보안 규칙의 상한선이 최종 방어선입니다). */

function seoulDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const map = {};
  parts.forEach(function (p) { map[p.type] = p.value; });
  return map.year + "-" + map.month + "-" + map.day;
}

function numField(doc, name, fallback) {
  const f = doc && doc.fields && doc.fields[name];
  if (!f) return fallback;
  const raw = f.integerValue !== undefined ? f.integerValue : f.doubleValue;
  const n = Number(raw);
  return isNaN(n) ? fallback : n;
}

async function firestoreGetDoc(path, idToken) {
  try {
    const url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID +
      "/databases/(default)/documents/" + path;
    const res = await fetch(url, { headers: { Authorization: "Bearer " + idToken } });
    if (!res.ok) return null; // 404(문서 없음) 등은 "아직 없음"으로 취급
    return await res.json();
  } catch (e) {
    console.error("Firestore 조회 오류(" + path + "):", e && e.message);
    return null;
  }
}

async function firestorePatchCount(path, fieldName, nextValue, idToken) {
  try {
    const url = "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID +
      "/databases/(default)/documents/" + path +
      "?updateMask.fieldPaths=" + encodeURIComponent(fieldName);
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({ fields: { [fieldName]: { integerValue: String(nextValue) } } })
    });
  } catch (e) {
    console.error("Firestore 카운터 갱신 오류(" + path + "):", e && e.message);
  }
}

async function getConfigLimits(idToken) {
  const doc = await firestoreGetDoc("communityConfig/limits", idToken);
  return {
    perUser: numField(doc, "translationsPerDayUser", DEFAULT_TRANSLATIONS_PER_DAY_USER),
    perSite: numField(doc, "translationsPerDaySite", DEFAULT_TRANSLATIONS_PER_DAY_SITE)
  };
}

/* 한도 확인 후, 실제로 번역이 성공했을 때만 호출할 수 있도록 commit()
   함수를 돌려줍니다(호출 실패/입력 오류 시에는 한도를 쓰지 않기 위함). */
async function checkTranslationQuota(uid, idToken) {
  const dateKey = seoulDateKey();
  const userPath = "communityRateLimits/" + uid + "_" + dateKey;
  const sitePath = "communitySiteRateLimits/" + dateKey;

  const limits = await getConfigLimits(idToken);
  const [userDoc, siteDoc] = await Promise.all([
    firestoreGetDoc(userPath, idToken),
    firestoreGetDoc(sitePath, idToken)
  ]);
  const userCount = numField(userDoc, "translationCount", 0);
  const siteCount = numField(siteDoc, "translationCount", 0);

  if (userCount >= limits.perUser || siteCount >= limits.perSite) {
    return { allowed: false };
  }
  return {
    allowed: true,
    commit: function () {
      return Promise.all([
        firestorePatchCount(userPath, "translationCount", userCount + 1, idToken),
        firestorePatchCount(sitePath, "translationCount", siteCount + 1, idToken)
      ]);
    }
  };
}

/* ---------------- AI 호출 공통 (20초 제한 + 최대 1회 재시도) ---------------- */

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

async function callWithRetry(makeRequest) {
  let lastErr = null;
  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const result = await makeRequest();
      if (result.res.ok && result.data) return result;
      lastErr = new Error("AI_REQUEST_FAILED");
      console.error("OpenAI 응답 오류(시도 " + (attempt + 1) + "):", result.res.status);
      if (RETRYABLE_STATUS.indexOf(result.res.status) === -1) break;
    } catch (e) {
      lastErr = new Error(e && e.name === "AbortError" ? "AI_TIMEOUT" : "AI_NETWORK_ERROR");
      console.error("OpenAI 호출 실패(시도 " + (attempt + 1) + "):", e && e.message);
    }
    if (attempt < AI_MAX_RETRIES) await sleep(AI_RETRY_DELAY_MS);
  }
  throw lastErr || new Error("AI_REQUEST_FAILED");
}

const PRESERVE_RULE = "Do not translate or alter: person names, brand names, school names, " +
  "building names, prices, dates, phone numbers, email addresses, URLs, or product model numbers " +
  "— keep them exactly as written in the original.";

async function callOpenAIJson(promptText) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw Object.assign(new Error("AI_API_KEY_MISSING"), { code: "AI_API_KEY_MISSING" });

  const body = {
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: promptText }],
    response_format: { type: "json_object" },
    temperature: 0.2
  };

  const result = await callWithRetry(async function () {
    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify(body)
    }, AI_TIMEOUT_MS);
    const data = await res.json().catch(function () { return null; });
    return { res: res, data: data };
  });

  const text = result.data && result.data.choices && result.data.choices[0] &&
    result.data.choices[0].message && result.data.choices[0].message.content;
  if (!text) throw new Error("AI_EMPTY_RESPONSE");
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("AI_INVALID_JSON");
  }
}

/* ---------------- 게시글 번역 ---------------- */

// 구인·구직 상세정보(사용자가 직접 입력한 텍스트 값만) — 제목/본문과
// 같은 요청에 묶어 보내 API 호출을 늘리지 않습니다. 알 수 없는 키/과도한
// 개수·길이는 서버에서 그대로 잘라내 프롬프트 비용을 방어합니다.
function sanitizeFields(rawFields) {
  if (!rawFields || typeof rawFields !== "object") return null;
  const keys = Object.keys(rawFields).slice(0, MAX_FIELD_KEYS);
  const out = {};
  keys.forEach(function (k) {
    const v = rawFields[k];
    if (typeof v === "string" && v.trim()) out[k] = v.slice(0, MAX_FIELD_CHARS);
  });
  return Object.keys(out).length ? out : null;
}

async function handleTranslatePost(payload) {
  const original = payload.originalLanguage;
  const title = (payload.title || "").toString().slice(0, MAX_TITLE_CHARS);
  const content = (payload.content || "").toString();
  const fields = sanitizeFields(payload.fields);

  if (!original || SUPPORTED_LANGS.indexOf(original) === -1) {
    return json(400, { error: "INVALID_LANGUAGE" });
  }
  if (!title || !content) return json(400, { error: "MISSING_FIELDS" });
  if (content.length > MAX_CONTENT_CHARS) return json(400, { error: "CONTENT_TOO_LONG" });

  const targets = (Array.isArray(payload.targetLanguages) ? payload.targetLanguages : SUPPORTED_LANGS)
    .filter(function (l) { return SUPPORTED_LANGS.indexOf(l) !== -1 && l !== original; });

  if (!targets.length) return json(200, { translations: {}, failedLanguages: [] });

  const targetNames = targets.map(function (l) { return l + " (" + LANG_NAMES[l] + ")"; }).join(", ");
  const fieldKeys = fields ? Object.keys(fields) : [];
  const shapeHint = fieldKeys.length
    ? '{"<langCode>":{"title":"...","content":"...","fields":{' +
      fieldKeys.map(function (k) { return '"' + k + '":"..."'; }).join(",") + "}}, ...}"
    : '{"<langCode>":{"title":"...","content":"..."}, ...}';
  const prompt =
    "Translate the following community board post from " + LANG_NAMES[original] +
    " into these languages: " + targetNames + ". " + PRESERVE_RULE +
    " Respond ONLY with a JSON object shaped like " + shapeHint +
    " using the exact language codes: " + targets.join(", ") + "." +
    (fieldKeys.length
      ? ' The "fields" object holds short structured detail values (job field, work location, work hours, etc.) from a job posting form — translate each value the same way as the content, keeping the same keys.'
      : "") +
    "\n\nTitle: " + title + "\n\nContent: " + content +
    (fieldKeys.length ? "\n\nFields: " + JSON.stringify(fields) : "");

  const translations = {};
  const failedLanguages = [];
  try {
    const parsed = await callOpenAIJson(prompt);
    targets.forEach(function (lang) {
      const entry = parsed && parsed[lang];
      if (entry && typeof entry.title === "string" && typeof entry.content === "string") {
        const out = { title: entry.title, content: entry.content };
        if (fieldKeys.length && entry.fields && typeof entry.fields === "object") {
          const outFields = {};
          fieldKeys.forEach(function (k) {
            if (typeof entry.fields[k] === "string") outFields[k] = entry.fields[k];
          });
          if (Object.keys(outFields).length) out.fields = outFields;
        }
        translations[lang] = out;
      } else {
        failedLanguages.push(lang);
      }
    });
  } catch (e) {
    console.error("게시글 번역 오류:", e && e.message);
    targets.forEach(function (lang) { failedLanguages.push(lang); });
  }

  return json(200, { translations: translations, failedLanguages: failedLanguages });
}

/* ---------------- 댓글 번역(요청 시 1개 언어만) ---------------- */

async function handleTranslateComment(payload) {
  const original = payload.originalLanguage;
  const target = payload.targetLanguage;
  const content = (payload.content || "").toString();

  if (!original || SUPPORTED_LANGS.indexOf(original) === -1) return json(400, { error: "INVALID_LANGUAGE" });
  if (!target || SUPPORTED_LANGS.indexOf(target) === -1) return json(400, { error: "INVALID_LANGUAGE" });
  if (!content) return json(400, { error: "MISSING_FIELDS" });
  if (content.length > MAX_CONTENT_CHARS) return json(400, { error: "CONTENT_TOO_LONG" });
  if (original === target) return json(200, { content: content });

  const prompt =
    "Translate the following community board comment from " + LANG_NAMES[original] +
    " into " + LANG_NAMES[target] + ". " + PRESERVE_RULE +
    ' Respond ONLY with a JSON object shaped like {"content":"..."}.' +
    "\n\nComment: " + content;

  try {
    const parsed = await callOpenAIJson(prompt);
    if (parsed && typeof parsed.content === "string") {
      return json(200, { content: parsed.content });
    }
    return json(502, { error: "AI_INVALID_JSON" });
  } catch (e) {
    console.error("댓글 번역 오류:", e && e.message);
    return json(502, { error: e && e.code === "AI_API_KEY_MISSING" ? "AI_API_KEY_MISSING" : "AI_REQUEST_FAILED" });
  }
}

/* ---------------- 진입점 ---------------- */

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") return json(200, {});
  if (event.httpMethod !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "INVALID_JSON" });
  }

  // 이메일 인증은 요구하지 않습니다(가입 시 인증메일을 보내지 않기로
  // 결정했으므로, 여기서 emailVerified를 확인하면 모든 이메일 가입
  // 회원의 번역 요청이 항상 막히게 됩니다). 로그인 여부와 정지 여부만
  // 확인합니다.
  if (payload.action !== "translatePost" && payload.action !== "translateComment") {
    return json(400, { error: "UNKNOWN_ACTION" });
  }

  const user = await verifyUser(payload.idToken);
  if (!user) return json(401, { error: "LOGIN_REQUIRED" });
  if (await isSuspended(user.localId, payload.idToken)) return json(403, { error: "ACCOUNT_SUSPENDED" });

  // 하루 번역 한도(회원 개인 + 사이트 전체) 확인 — 한도를 넘으면 AI를
  // 호출하지 않고 바로 429를 돌려줍니다(비용 절감의 핵심).
  const quota = await checkTranslationQuota(user.localId, payload.idToken);
  if (!quota.allowed) return json(429, { error: "TRANSLATION_QUOTA_EXCEEDED" });

  const result = payload.action === "translatePost"
    ? await handleTranslatePost(payload)
    : await handleTranslateComment(payload);

  // 실제로 번역 결과를 돌려준 경우에만 한도를 소모합니다(입력 오류 등으로
  // AI를 부르지 못한 경우는 한도에서 빼지 않습니다).
  if (result.statusCode === 200) {
    let body = null;
    try { body = JSON.parse(result.body); } catch (e) { /* ignore */ }
    const succeeded = payload.action === "translatePost"
      ? !!(body && body.translations && Object.keys(body.translations).length)
      : !!(body && typeof body.content === "string");
    if (succeeded) await quota.commit();
  }

  return result;
};

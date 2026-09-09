/* ==========================================================================
   netlify/functions/parse-weekly-menu.js
   - 주간메뉴 이미지 인식(OCR)과 메뉴 번역을 처리하는 서버 함수입니다.
   - Gemini API 키는 이 파일이 아니라 Netlify 환경변수(GEMINI_API_KEY)에서
     읽습니다. 브라우저 코드에는 이 키가 전혀 노출되지 않습니다.
   - 관리자 로그인 여부를 서버에서도 확인합니다(Firebase ID 토큰 검증).
     일반 방문자는 idToken이 없어 이 함수를 쓸 수 없습니다.
   - 새 npm 패키지를 추가하지 않고 Node 내장 fetch만 사용합니다.

   호출 방법 (모두 POST, JSON body):
     { action: "analyze", idToken, imageBase64, mimeType }
       -> 이미지에서 요일별 한글 메뉴만 인식해서 돌려줍니다(번역 없음).
     { action: "translate", idToken, terms: ["소불고기", ...] }
       -> 한글 메뉴명 목록을 5개 언어로 번역해서 돌려줍니다.
          (menuTranslations 컬렉션에 이미 있는 건 그대로 재사용하고,
           없는 것만 새로 번역합니다. 저장은 클라이언트가 합니다.)

   ⚠ Gemini 장애 대비 설계(2026-09-09 작업지시서 반영):
   - 이미지 분석(analyze)이 실패해도 관리자는 "직접 입력"(방식 2)으로
     100% 독립적으로 메뉴를 등록·게시할 수 있습니다(이 함수를 전혀
     호출하지 않는 경로).
   - 번역(translate)은 캐시(menuTranslations)를 먼저 조회하고, 새로
     번역해야 하는 항목만 Gemini를 호출합니다. Gemini가 완전히
     막혀 있어도 캐시로 찾은 번역은 그대로 돌려주고, 새로 번역하지
     못한 항목만 결과에서 빠집니다(요청 전체를 실패시키지 않음 —
     handleTranslate 참고). 그래야 관리자가 한글만이라도 게시할 수
     있습니다.
   - Gemini 호출 1회는 최대 20초까지 기다리고, 실패하면 2초 간격으로
     최대 2회까지만 재시도합니다(callGemini 참고). 원인 불명의 무한
     대기를 막기 위한 상한이며, Netlify 함수 자체의 실행 제한
     시간(계정/플랜마다 다름)을 넘길 수도 있다는 점을 감안해 넉넉하게
     기다리기보다는 "빨리 실패하고 관리자가 다시 시도하거나 직접
     입력으로 전환"하는 쪽을 기본값으로 삼았습니다.
   - AI_PROVIDER(현재는 "gemini" 고정)로 호출부를 감싸 둬서, 나중에
     예비 API를 추가하고 싶을 때 이 함수의 구조만 바꾸면 되도록
     분리해 뒀습니다(9번 항목 — 지금은 유료 API를 추가로 붙이지
     않습니다).
   ========================================================================== */

// 클라이언트(js/firebase-config.js)와 동일한 값 — 공개되어도 안전한
// Firebase Web API 키입니다(비밀키가 아닙니다). ID 토큰 검증에만 씁니다.
const FIREBASE_API_KEY = "AIzaSyCSptfzh0RBVN1dPXLy9oIdE-Kg5vFZb3o";
const FIREBASE_PROJECT_ID = "babsim-46284";
// gemini-2.0-flash는 단종되어(404 NOT_FOUND) gemini-3.6-flash로 교체함
// (2026-09-09, 실제 Netlify Functions 로그에서 구글이 안내한 대체 모델명).
const GEMINI_MODEL = "gemini-3.6-flash";

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

/* ---------------- 관리자 인증 확인 (Firebase Admin SDK 없이, ID 토큰 검증만) ---------------- */

async function verifyAdmin(idToken) {
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
    return data.users[0]; // { localId, email, ... }
  } catch (e) {
    console.error("관리자 인증 확인 오류:", e);
    return null;
  }
}

/* ---------------- Gemini 호출 (장애 대비: 20초 제한 + 최대 2회 재시도) ---------------- */

const GEMINI_TIMEOUT_MS = 20000; // 최대 대기시간 20초
const GEMINI_MAX_RETRIES = 2;    // 자동 재시도 최대 2회 (총 3회 시도)
const GEMINI_RETRY_DELAY_MS = 2000; // 재시도 간격 2초
const RETRYABLE_STATUS = [429, 503]; // 과부하/한도초과 — 재시도할 가치가 있음

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
  try {
    return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
  }
}

// 예비 AI API를 나중에 추가할 때는 이 객체에 provider를 하나 더 넣고
// AI_PROVIDER 값을 바꾸면 됩니다(지금은 gemini 고정, 9번 항목).
const AI_PROVIDER = "gemini";

async function callAiProvider(parts, wantJson) {
  if (AI_PROVIDER === "gemini") return callGemini(parts, wantJson);
  const err = new Error("UNKNOWN_AI_PROVIDER");
  err.code = "UNKNOWN_AI_PROVIDER";
  throw err;
}

async function callGemini(parts, wantJson) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY_MISSING");
    err.code = "GEMINI_API_KEY_MISSING";
    throw err;
  }
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + apiKey;
  const body = {
    contents: [{ parts: parts }],
    generationConfig: wantJson ? { responseMimeType: "application/json" } : {}
  };

  let lastErr = null;
  for (let attempt = 0; attempt <= GEMINI_MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }, GEMINI_TIMEOUT_MS);
      const data = await res.json().catch(function () { return null; });
      if (res.ok && data) {
        const text = data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts && data.candidates[0].content.parts[0] &&
          data.candidates[0].content.parts[0].text;
        if (text) return text;
        console.error("Gemini 응답에 텍스트 없음(시도 " + (attempt + 1) + "):", JSON.stringify(data).slice(0, 500));
        lastErr = makeGeminiError("GEMINI_EMPTY_RESPONSE", res.status);
      } else {
        console.error("Gemini 응답 오류(시도 " + (attempt + 1) + "/" + (GEMINI_MAX_RETRIES + 1) + "):", res.status, data);
        lastErr = makeGeminiError("GEMINI_REQUEST_FAILED", res.status);
        if (RETRYABLE_STATUS.indexOf(res.status) === -1) break; // 재시도해도 소용없는 오류(예: 400/404)
      }
    } catch (e) {
      const timedOut = e && e.name === "AbortError";
      console.error("Gemini 호출 실패(시도 " + (attempt + 1) + "/" + (GEMINI_MAX_RETRIES + 1) + "):", timedOut ? "20초 초과(타임아웃)" : e);
      lastErr = makeGeminiError(timedOut ? "GEMINI_TIMEOUT" : "GEMINI_NETWORK_ERROR", null);
    }
    if (attempt < GEMINI_MAX_RETRIES) await sleep(GEMINI_RETRY_DELAY_MS);
  }
  throw lastErr || makeGeminiError("GEMINI_REQUEST_FAILED", null);
}

function makeGeminiError(code, status) {
  const err = new Error(code);
  err.code = code;
  if (status) err.status = status;
  return err;
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // 가끔 코드블록(```json ... ```)으로 감싸서 응답하는 경우를 대비한 보정
    var match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (e2) { /* 아래에서 null 반환 */ }
    }
    return null;
  }
}

/* ---------------- action: analyze (이미지 -> 요일별 한글 메뉴) ---------------- */

const DAY_CODES = ["mon", "tue", "wed", "thu", "fri"];

function getSeoulDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit"
  }).format(new Date());
}

async function handleAnalyze(payload) {
  const imageBase64 = payload.imageBase64;
  const mimeType = payload.mimeType;
  if (!imageBase64 || !mimeType) {
    return json(400, { ok: false, error: "이미지 데이터가 없습니다." });
  }
  if (["image/jpeg", "image/jpg", "image/png", "image/webp"].indexOf(mimeType) === -1) {
    return json(400, { ok: false, error: "지원하지 않는 이미지 형식입니다." });
  }

  const todayKey = getSeoulDateKey();
  const prompt = [
    "당신은 한국 대학교 구내식당의 \"천원의 아침밥\" 주간 메뉴표 이미지를 읽어",
    "구조화된 데이터로 변환하는 도우미입니다.",
    "",
    "이미지에는 보통 월요일부터 금요일까지 5개 요일별로 \"일반식\"과 \"간편식\"",
    "두 종류의 메뉴가 표로 정리되어 있고, 각 칸에는 여러 줄의 메뉴명이 순서대로",
    "적혀 있습니다.",
    "",
    "반드시 지킬 것:",
    "1. 이미지에 실제로 적힌 한글 메뉴명만 그대로 옮겨 적으세요. 추측하거나",
    "   비슷한 음식 이름으로 바꾸지 마세요.",
    "2. 메뉴명 순서는 이미지에 적힌 순서 그대로 유지하세요.",
    "3. 글자가 흐릿하거나 확신이 서지 않으면, 최대한 그대로 옮기되",
    "   \"uncertain\": true 로 표시하세요. 확실하면 \"uncertain\": false 입니다.",
    "4. 요일 제목 옆에 날짜(예: \"09월 07일\")가 보이면 그 날짜를 쓰세요.",
    "   연도가 안 보이면 오늘(" + todayKey + ") 기준으로 가장 가까운 주간으로",
    "   추정하세요.",
    "5. 특정 요일이 휴무로 표시되어 있으면 \"isOpen\": false로 표시하고",
    "   메뉴 배열은 비워두세요.",
    "6. 아래 JSON 스키마로만 응답하세요. 다른 설명 문장은 절대 포함하지 마세요.",
    "",
    "{",
    "  \"weekStart\": \"YYYY-MM-DD\",",
    "  \"weekEnd\": \"YYYY-MM-DD\",",
    "  \"days\": {",
    "    \"YYYY-MM-DD\": {",
    "      \"day\": \"mon|tue|wed|thu|fri\",",
    "      \"isOpen\": true,",
    "      \"regular\": [ { \"ko\": \"메뉴명\", \"uncertain\": false } ],",
    "      \"simple\": [ { \"ko\": \"메뉴명\", \"uncertain\": false } ]",
    "    }",
    "  }",
    "}"
  ].join("\n");

  let text;
  try {
    text = await callAiProvider(
      [{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }],
      true
    );
  } catch (e) {
    if (e.code === "GEMINI_API_KEY_MISSING") {
      return json(500, {
        ok: false,
        error: "이미지 분석 기능이 아직 설정되지 않았습니다. 관리자에게 문의하세요.",
        code: "GEMINI_API_KEY_MISSING"
      });
    }
    // 작업지시서 3번 항목의 고정 문구 — 원인과 무관하게 관리자에게는
    // "다시 시도하거나 직접 입력하라"는 같은 안내를 보여줍니다.
    return json(502, {
      ok: false,
      error: "자동 메뉴 분석에 실패했습니다.\n잠시 후 다시 시도하거나 직접 입력해 주세요.",
      code: e.code || "GEMINI_REQUEST_FAILED"
    });
  }

  const parsed = safeParseJson(text);
  if (!parsed || !parsed.days) {
    return json(502, {
      ok: false,
      error: "자동 메뉴 분석에 실패했습니다.\n잠시 후 다시 시도하거나 직접 입력해 주세요.",
      code: "GEMINI_BAD_JSON"
    });
  }

  // 최소한의 형태 정리(요일 코드가 이상하면 보정, 값이 없으면 빈 배열로)
  Object.keys(parsed.days).forEach(function (dateKey) {
    var d = parsed.days[dateKey];
    if (DAY_CODES.indexOf(d.day) === -1) d.day = null;
    if (typeof d.isOpen !== "boolean") d.isOpen = true;
    if (!Array.isArray(d.regular)) d.regular = [];
    if (!Array.isArray(d.simple)) d.simple = [];
  });

  return json(200, { ok: true, weekStart: parsed.weekStart || null, weekEnd: parsed.weekEnd || null, days: parsed.days });
}

/* ---------------- action: translate (한글 메뉴명 -> 5개 언어) ---------------- */

async function fetchExistingTranslations(terms) {
  // menuTranslations 컬렉션은 누구나 읽을 수 있게 규칙이 열려 있어 REST로 바로 조회합니다.
  const results = {};
  await Promise.all(terms.map(async function (term) {
    try {
      const res = await fetch(
        "https://firestore.googleapis.com/v1/projects/" + FIREBASE_PROJECT_ID +
        "/databases/(default)/documents/menuTranslations/" + encodeURIComponent(term) +
        "?key=" + FIREBASE_API_KEY
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data.fields) return;
      results[term] = {
        zh: data.fields.zh && data.fields.zh.stringValue,
        vi: data.fields.vi && data.fields.vi.stringValue,
        en: data.fields.en && data.fields.en.stringValue,
        mn: data.fields.mn && data.fields.mn.stringValue
      };
    } catch (e) {
      // 캐시 조회 실패는 무시하고 새로 번역하도록 둡니다.
    }
  }));
  return results;
}

async function translateWithGemini(terms) {
  const prompt = [
    "다음은 한국 대학교 구내식당 메뉴명 목록입니다.",
    "각 메뉴명을 중국어(zh), 베트남어(vi), 영어(en), 몽골어(mn)로 번역하세요.",
    "음식 이름의 의미가 정확히 전달되도록 자연스럽게 번역하고,",
    "원문을 왜곡하거나 임의로 다른 음식으로 바꾸지 마세요.",
    "",
    "메뉴명 목록: " + JSON.stringify(terms),
    "",
    "아래 JSON 형식으로만 응답하세요 (키는 반드시 원래 한글 메뉴명 그대로):",
    "{",
    "  \"메뉴명1\": { \"zh\": \"...\", \"vi\": \"...\", \"en\": \"...\", \"mn\": \"...\" }",
    "}"
  ].join("\n");

  const text = await callAiProvider([{ text: prompt }], true);
  const parsed = safeParseJson(text);
  return parsed || {};
}

/* 작업지시서 7번 항목: Gemini가 완전히 막혀 있어도 게시를 막지 않습니다.
   캐시(cached)로 찾은 번역은 항상 돌려주고, 새로 번역이 필요한 항목이
   실패하면 그 항목만 translations에서 빠지고 failedTerms에 담깁니다.
   요청 전체를 실패(ok:false)로 만드는 건 "번역 결과를 아예 요청할 수
   없는" 극히 예외적인 경우(잘못된 입력 등)로만 한정합니다. */
async function handleTranslate(payload) {
  const terms = Array.isArray(payload.terms)
    ? payload.terms.map(function (t) { return String(t).trim(); }).filter(function (t) { return t.length > 0; })
    : [];
  const uniqueTerms = Array.from(new Set(terms));

  if (uniqueTerms.length === 0) {
    return json(200, { ok: true, translations: {}, failedTerms: [] });
  }
  if (uniqueTerms.length > 60) {
    return json(400, { ok: false, error: "한 번에 번역할 수 있는 메뉴 수를 초과했습니다." });
  }

  const cached = await fetchExistingTranslations(uniqueTerms);
  const missing = uniqueTerms.filter(function (t) { return !cached[t]; });

  let fresh = {};
  let translateError = null;
  if (missing.length > 0) {
    try {
      fresh = await translateWithGemini(missing);
    } catch (e) {
      // 여기서 응답을 실패시키지 않습니다 — cached에 있던 번역은 그대로
      // 돌려주고, missing 항목만 "번역 대기"로 남깁니다(클라이언트가
      // failedReason으로 안내 문구를 보여줌).
      translateError = e.code || "GEMINI_REQUEST_FAILED";
      console.error("번역 일부 실패(캐시된 항목은 정상 반환):", translateError, e);
    }
  }

  const translations = Object.assign({}, cached, fresh);
  const failedTerms = uniqueTerms.filter(function (t) { return !translations[t]; });

  const result = { ok: true, translations: translations, failedTerms: failedTerms };
  if (translateError) {
    result.failedReason = translateError === "GEMINI_API_KEY_MISSING"
      ? "번역 기능이 아직 설정되지 않았습니다."
      : "지금 번역 서버에 연결할 수 없어 일부 메뉴는 한글로만 게시됩니다.";
  }
  return json(200, result);
}

/* ---------------- 진입점 ---------------- */

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "허용되지 않은 요청입니다." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { ok: false, error: "요청 형식이 올바르지 않습니다." });
  }

  const admin = await verifyAdmin(payload.idToken);
  if (!admin) {
    return json(401, { ok: false, error: "관리자 로그인이 필요합니다." });
  }

  if (payload.action === "analyze") return handleAnalyze(payload);
  if (payload.action === "translate") return handleTranslate(payload);
  return json(400, { ok: false, error: "알 수 없는 요청입니다." });
};

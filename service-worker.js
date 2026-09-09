/* ==========================================================================
   service-worker.js — 모인관(인제대학교) PWA 서비스 워커
   - HTML/메뉴 화면은 network-first: 항상 최신 내용을 먼저 시도하고,
     네트워크가 안 될 때만 마지막으로 저장해 둔 화면을 보여줍니다.
     (천원의 아침밥 오늘·내일 메뉴가 날짜가 바뀌어도 오래된 내용으로
     굳어 보이는 일이 없도록 하기 위한 선택입니다.)
   - 아이콘처럼 거의 안 바뀌는 정적 이미지는 cache-first로 빠르게 보여줍니다.
   - 관리자 페이지(admin.html)와 Firebase/Netlify Functions/외부 AI API
     응답은 이 서비스 워커가 전혀 손대지 않습니다(가로채지 않음) — 항상
     네트워크로 직접 나가고, 캐시에 저장되지도 않습니다.
   - 새 배포로 이 파일 내용이 바뀌면(바이트 단위로 다름을 브라우저가
     감지) 브라우저가 새 서비스 워커를 "installed(대기 중)" 상태로
     만듭니다. js/pwa.js가 이 상태를 감지해 "지금 업데이트" 배너를
     띄우고, 사용자가 누르면 이 파일의 message 리스너로 SKIP_WAITING을
     보내 즉시 활성화합니다.

   ⚠ 캐시 강제 갱신이 필요할 만큼 큰 변경(아이콘 교체 등)을 배포할 때는
   아래 CACHE_VERSION 값을 올려주세요(예: "v1" -> "v2"). 이 값이 바뀌면
   activate 단계에서 예전 캐시를 전부 지우고 새로 시작합니다.
   ========================================================================== */

var CACHE_VERSION = "v1";
var STATIC_CACHE = "moingwan-static-" + CACHE_VERSION;
var PAGE_CACHE = "moingwan-pages-" + CACHE_VERSION;
var CURRENT_CACHES = [STATIC_CACHE, PAGE_CACHE];

// 관리자 페이지와 외부 API/DB 호출은 절대 가로채지 않습니다(항상 네트워크 직행,
// 캐시 저장 안 함). Firestore·Auth·Storage·Netlify Functions·AI API가 모두
// 여기 걸립니다.
var NEVER_INTERCEPT_PATTERNS = [
  /\/admin\.html$/,
  /\/\.netlify\/functions\//,
  /googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /firestore\.googleapis\.com/,
  /generativelanguage\.googleapis\.com/,
  /api\.openai\.com/,
  /firebasestorage\.googleapis\.com/,
  /gstatic\.com/
];

// 거의 안 바뀌는 정적 자산(아이콘 등) — cache-first
var STATIC_ASSET_PATTERN = /\/images\/icon\//;

function shouldNeverIntercept(url) {
  return NEVER_INTERCEPT_PATTERNS.some(function (re) { return re.test(url); });
}

self.addEventListener("install", function (event) {
  // 설치 단계에서는 미리 받아둘 필수 자산이 없어도 됩니다(전부 network-first
  // 이거나 처음 요청될 때 캐시되는 cache-first 자산이라서). 새 워커를
  // 곧바로 "waiting" 상태로 만들기 위해 별도 예열 없이 넘어갑니다.
  event.waitUntil(self.skipWaiting ? Promise.resolve() : Promise.resolve());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return CURRENT_CACHES.indexOf(name) === -1; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// 관리자 페이지에서 "지금 업데이트"를 누르면 이 메시지를 받아 대기 중인
// 워커를 즉시 활성화합니다.
self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function networkFirst(request, cacheName) {
  return fetch(request).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(cacheName).then(function (cache) { cache.put(request, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(request).then(function (cached) {
      return cached || Response.error();
    });
  });
}

function cacheFirst(request, cacheName) {
  return caches.match(request).then(function (cached) {
    if (cached) return cached;
    return fetch(request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(cacheName).then(function (cache) { cache.put(request, copy); });
      }
      return res;
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return; // 쓰기 요청은 그대로 네트워크로

  var url = request.url;
  if (shouldNeverIntercept(url)) return; // 가로채지 않음(관리자 페이지·API)

  if (STATIC_ASSET_PATTERN.test(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 페이지 이동(HTML)이나 이 origin의 나머지 요청(manifest 등)은
  // network-first + 오프라인 대비 캐시 저장.
  if (request.mode === "navigate" || request.destination === "document" ||
    url.indexOf(self.location.origin) === 0) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // 그 외(외부 도메인 등)는 서비스 워커가 관여하지 않습니다.
});

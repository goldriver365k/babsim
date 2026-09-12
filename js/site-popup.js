/* ==========================================================================
   babsim.store 홈 팝업 (js/site-popup.js) — 팝업 기능 2단계
   - 관리자 페이지 "팝업 관리"(js/admin-popup.js)에서 등록하고 사용
     ON으로 설정한 팝업(Firestore sitePopups 컬렉션, 팝업 1단계에서
     만든 데이터를 그대로 읽기만 함)을 화면 중앙에 띄웁니다.
   - 새 팝업 라이브러리 없이 기존 모달 스타일(.modal-overlay/.modal,
     커뮤니티 버튼 스타일)을 그대로 재사용합니다.
   - 천원의 아침밥 평가 팝업과 동시에 뜨지 않도록, 이 팝업을 먼저 보여주고
     닫힌 뒤에만(또는 띄울 팝업이 없으면 즉시) 콜백으로 평가 팝업 표시
     여부를 넘깁니다 — 호출은 app.js가 합니다(window.SitePopup.maybeShow).
   ========================================================================== */

var SitePopup = (function () {
  "use strict";

  var DISMISS_KEY_PREFIX = "popupDismissed_";

  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }

  // "브라우저/탭을 완전히 닫고 새 세션으로 들어오면 다시 표시" — 간단히
  // sessionStorage만 씁니다("오늘 하루 보지 않기"는 이번 단계에서 없음).
  function isDismissedThisSession(id) {
    try { return sessionStorage.getItem(DISMISS_KEY_PREFIX + id) === "true"; } catch (e) { return false; }
  }
  function markDismissedThisSession(id) {
    try { sessionStorage.setItem(DISMISS_KEY_PREFIX + id, "true"); } catch (e) { /* sessionStorage 미지원 시 무시 */ }
  }

  function toMillis(ts) {
    if (!ts) return null;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === "string") { var t = new Date(ts).getTime(); return isNaN(t) ? null : t; }
    return null;
  }

  // isActive=true && (시작일 없거나 지났음) && (종료일 없거나 안 지났음).
  function isEligible(p) {
    if (!p.isActive || !p.imageUrl) return false;
    var now = Date.now();
    var start = toMillis(p.startAt);
    var end = toMillis(p.endAt);
    if (start !== null && now < start) return false;
    if (end !== null && now > end) return false;
    return true;
  }

  // 활성 팝업이 여러 개면 가장 최근(createdAt desc로 이미 정렬됨) 1개만.
  function pickPopup(docs) {
    for (var i = 0; i < docs.length; i++) {
      if (isEligible(docs[i].data) && !isDismissedThisSession(docs[i].id)) return docs[i];
    }
    return null;
  }

  // GA4 팝업 이벤트(7단계) — 개인정보(팝업 제목·이미지·링크·id 등) 없이
  // 행동 여부만 기록합니다.
  function trackPopupEvent(eventName) {
    if (typeof gtag === "function") gtag("event", eventName);
  }

  function renderPopup(popup, onClosed) {
    var overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "sitePopupOverlay";

    var modal = document.createElement("div");
    modal.className = "modal";

    var img = document.createElement("img");
    img.className = "site-popup-image";
    img.src = popup.data.imageUrl;
    img.alt = popup.data.title || "";
    if (popup.data.linkUrl) {
      img.classList.add("site-popup-image-linked");
      img.addEventListener("click", function () {
        trackPopupEvent("popup_click");
        window.open(popup.data.linkUrl, "_blank", "noopener");
      });
    }
    modal.appendChild(img);

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "community-btn-secondary site-popup-close-btn";
    closeBtn.textContent = "닫기";
    closeBtn.addEventListener("click", function () {
      trackPopupEvent("popup_close");
      markDismissedThisSession(popup.id);
      overlay.remove();
      if (onClosed) onClosed();
    });
    modal.appendChild(closeBtn);

    overlay.appendChild(modal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) {
        trackPopupEvent("popup_close");
        markDismissedThisSession(popup.id);
        overlay.remove();
        if (onClosed) onClosed();
      }
    });
    document.body.appendChild(overlay);

    // 이 함수는 maybeShow()가 실제로 보여줄 팝업을 고른 경우에만(pickPopup이
    // null이 아닐 때) 딱 한 번 호출되므로, 여기서 한 번만 보내면
    // 재렌더링으로 인한 중복 전송이 생기지 않습니다.
    trackPopupEvent("popup_view");
  }

  // done은 반드시 호출됩니다(팝업을 안 띄우는 경우 즉시, 띄운 경우 닫힐
  // 때) — app.js가 이 콜백 다음에 천원의 아침밥 평가 팝업을 띄웁니다.
  function maybeShow(done) {
    var finish = typeof done === "function" ? done : function () {};
    var d = db();
    if (!d) { finish(); return; }
    // 커뮤니티 화면으로 바로 들어온 경우(딥링크)에는 홈 전용 팝업을
    // 띄우지 않습니다(천원의 아침밥 팝업과 동일한 원칙 재사용).
    if (window.Community && typeof window.Community.isCommunityPath === "function" && window.Community.isCommunityPath(location.pathname)) { finish(); return; }

    // isActive로 필터링하는 복합 색인을 새로 만들 필요가 없도록, 최근
    // 생성분만 적게 가져와 조건은 클라이언트에서 확인합니다(등록된
    // 팝업 수가 적다는 전제 — 비용 최소화).
    d.collection("sitePopups").orderBy("createdAt", "desc").limit(20).get().then(function (snap) {
      var docs = [];
      snap.forEach(function (doc) { docs.push({ id: doc.id, data: doc.data() }); });
      var chosen = pickPopup(docs);
      if (!chosen) { finish(); return; }
      renderPopup(chosen, finish);
    }).catch(function () { finish(); });
  }

  return { maybeShow: maybeShow };
})();

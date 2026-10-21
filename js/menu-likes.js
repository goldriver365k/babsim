/* ==========================================================================
   메뉴 좋아요 (js/menu-likes.js)
   - 메뉴명 옆 ♡/♥ + 누적 좋아요 숫자만 담당합니다(카드 디자인은 app.js가
     그대로 유지, 이 모듈은 상태/Firestore 연동만 제공).
   - Firestore 비용 최소화: 매장/메뉴별 실시간 listener나 반복 조회 없이,
     전체 메뉴 좋아요 수는 문서 1개(menuLikeCounts/all)를 페이지 로드 시
     한 번만 읽고, 내가 좋아요한 메뉴 목록도 내 uid로 한 번만 조회합니다.
     이 카운트는 이후 밥심 커뮤니티 "인기 메뉴"에서도 그대로 재사용할 수
     있도록 별도 집계를 새로 만들지 않습니다.
   - Anonymous Auth는 이미 있으면(js/community.js 등에서 이미 로그인된
     세션이면) 그대로 재사용하고, 없을 때만 좋아요를 처음 누르는 순간에
     새로 만듭니다(방문만 해도 계정이 생기지 않도록).
   ========================================================================== */

var MenuLikes = (function () {
  "use strict";

  var counts = {}; // menuId -> number
  var liked = {};   // menuId -> true
  var listeners = []; // 초기 데이터 로드 후 화면 갱신용(app.js의 renderGrid)

  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function auth() { return (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null; }

  function getCount(menuId) { return counts[menuId] || 0; }
  function isLiked(menuId) { return !!liked[menuId]; }
  function onChange(fn) { listeners.push(fn); }
  function notify() { listeners.forEach(function (fn) { try { fn(); } catch (e) { /* 개별 리스너 오류는 무시 */ } }); }

  function loadCounts() {
    var d = db();
    if (!d) return;
    d.collection("menuLikeCounts").doc("all").get().then(function (doc) {
      counts = (doc.exists && doc.data()) || {};
      notify();
    }).catch(function () { /* 실패 시 0으로 유지, 다음 방문 때 다시 시도 */ });
  }

  function loadMyLikes(uid) {
    var d = db();
    if (!d) return;
    d.collection("menuLikeUsers").where("uid", "==", uid).get().then(function (snap) {
      var next = {};
      snap.forEach(function (doc) {
        var data = doc.data();
        if (data && data.menuId) next[data.menuId] = true;
      });
      liked = next;
      notify();
    }).catch(function () { /* 실패해도 무시(하트는 기본 ♡ 유지) */ });
  }

  function ensureAuth() {
    var a = auth();
    if (!a) return Promise.reject(new Error("auth unavailable"));
    if (a.currentUser) return Promise.resolve(a.currentUser);
    return a.signInAnonymously().then(function (cred) { return cred.user; });
  }

  // 낙관적으로 먼저 화면 상태를 바꾸고, Firestore 트랜잭션으로 실제
  // 반영합니다. 트랜잭션 안에서 "이미 좋아요 표시가 있는지"를 다시
  // 확인해 같은 사용자가 같은 메뉴를 중복으로 증가시키지 못하게 막습니다.
  // 실패하면 호출한 쪽에서 이전 상태로 되돌릴 수 있도록 reject합니다.
  function toggle(menuId) {
    var wasLiked = isLiked(menuId);
    var prevCount = getCount(menuId);
    liked[menuId] = !wasLiked;
    counts[menuId] = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

    return ensureAuth().then(function (user) {
      var d = db();
      if (!d) throw new Error("db unavailable");
      var markerRef = d.collection("menuLikeUsers").doc(user.uid + "_" + menuId);
      var countsRef = d.collection("menuLikeCounts").doc("all");
      return d.runTransaction(function (tx) {
        return tx.get(markerRef).then(function (markerDoc) {
          var alreadyLiked = markerDoc.exists;
          if (wasLiked) {
            if (!alreadyLiked) return; // 이미 취소된 상태(중복 클릭 등) - 아무 것도 안 함
            tx.delete(markerRef);
            var dec = {}; dec[menuId] = firebase.firestore.FieldValue.increment(-1);
            tx.set(countsRef, dec, { merge: true });
          } else {
            if (alreadyLiked) return; // 이미 좋아요 되어 있음 - 중복 증가 방지
            tx.set(markerRef, { uid: user.uid, menuId: menuId, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            var inc = {}; inc[menuId] = firebase.firestore.FieldValue.increment(1);
            tx.set(countsRef, inc, { merge: true });
          }
        });
      });
    }).catch(function (err) {
      liked[menuId] = wasLiked;
      counts[menuId] = prevCount;
      throw err;
    });
  }

  // 페이지 로드 시 1회만 호출합니다(전체 카운트 1회 읽기 + 이미 로그인/
  // 익명 세션이 있으면 내 좋아요 목록 1회 조회 — 새 세션을 만들지 않음).
  function init() {
    loadCounts();
    var a = auth();
    if (!a) return;
    // 페이지 로드 시점의 로그인 상태만 딱 1번 확인합니다(불필요한
    // 재조회 금지). 이후 좋아요를 처음 눌러 익명 로그인이 새로 생겨도
    // 이미 낙관적으로 반영해 둔 상태와 경합하지 않도록 다시 조회하지
    // 않습니다 — onAuthStateChanged의 구독 해제 함수에 의존하지 않고
    // 콜백 내부 플래그로 "최초 1회"를 보장합니다.
    var initialAuthHandled = false;
    a.onAuthStateChanged(function (user) {
      if (initialAuthHandled) return;
      initialAuthHandled = true;
      if (user) loadMyLikes(user.uid);
    });
  }

  return { init: init, getCount: getCount, isLiked: isLiked, toggle: toggle, onChange: onChange };
})();

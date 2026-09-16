/* ==========================================================================
   관리자 페이지 - 매장 메뉴관리 (js/admin-menu.js)
   - 기존 admin.js 탭 구조("메뉴 관리")와 admin-popup.js의 등록/수정/이미지
     업로드/목록 패턴을 그대로 재사용합니다(새 관리자 사이트/디자인 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다. 이미지 업로드도 같은 Firebase Storage를 재사용하고 경로만
     storeMenuImages/로 새로 둡니다.
   - 매장 구분은 js/menu-data.js MENU_DATA가 이미 쓰는 store 값
     (hururuk/mangwon/bapsim)을 그대로 재사용합니다. 이 단계는 새
     Firestore 컬렉션(storeMenus)에 등록하는 메뉴만 관리하며, 기존 정적
     메뉴 데이터를 옮기거나 바꾸지 않습니다(사용자 메뉴판 연결은 다음
     단계).
   - 좋아요 숫자는 menuLikeCounts/all 문서(js/menu-likes.js가 이미 쓰는
     같은 문서)를 한 번만 읽어 표시만 합니다 — 새 좋아요 시스템이나
     메뉴별 listener를 만들지 않습니다.
   ========================================================================== */

var AdminMenu = (function () {
  "use strict";

  var els = {};
  var currentStore = "hururuk";
  var editingId = null;
  var editingImageUrl = "";
  var editingOriginalName = null; // 수정 중인 메뉴의 기존 name 객체(다국어 보존용)
  var pendingCompressPromise = null;
  var currentMenus = []; // 현재 매장의 메뉴 목록(순서대로) — 순서 이동 계산에 재사용
  var likeCounts = {};   // menuLikeCounts/all 문서 1회 캐시(menuId -> count)
  var likeCountsLoaded = false;

  var MENU_MAX_WIDTH = 800;
  var MENU_MAX_HEIGHT = 800;
  var MENU_PHOTO_QUALITY = 0.8;
  var MENU_WARN_BYTES = 500 * 1024;

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function storage() { return (typeof getFirebaseStorage === "function") ? getFirebaseStorage() : null; }
  function currentAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function setStatus(text, isError) {
    if (!els.formStatus) return;
    if (!text) { els.formStatus.hidden = true; return; }
    els.formStatus.hidden = false;
    els.formStatus.textContent = text;
    els.formStatus.className = "publish-status" + (isError ? " error" : " success");
  }

  function resetForm() {
    editingId = null;
    editingImageUrl = "";
    editingOriginalName = null;
    pendingCompressPromise = null;
    els.form.reset();
    els.imagePreviewWrap.hidden = true;
    els.imagePreviewImg.src = "";
    els.formTitle.textContent = "새 메뉴 등록";
    els.saveBtn.textContent = "등록";
    els.cancelEditBtn.hidden = true;
    setStatus("");
  }

  function startEdit(id, m) {
    editingId = id;
    editingImageUrl = m.image || "";
    editingOriginalName = m.name || null;
    pendingCompressPromise = null;
    els.nameInput.value = (m.name && m.name.ko) || "";
    els.priceInput.value = typeof m.price === "number" ? m.price : "";
    els.imageInput.value = "";
    if (editingImageUrl) {
      els.imagePreviewImg.src = editingImageUrl;
      els.imagePreviewWrap.hidden = false;
    } else {
      els.imagePreviewWrap.hidden = true;
    }
    els.formTitle.textContent = "메뉴 수정";
    els.saveBtn.textContent = "수정 저장";
    els.cancelEditBtn.hidden = false;
    setStatus("");
    els.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ---------------- 이미지 압축(팝업 이미지 업로드와 같은 Canvas 방식 재사용) ---------------- */

  function loadMenuImageSource(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: "from-image" }).catch(function () {
        return loadMenuImageViaTag(file);
      });
    }
    return loadMenuImageViaTag(file);
  }
  function loadMenuImageViaTag(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("IMAGE_LOAD_FAILED")); };
      img.src = url;
    });
  }
  function menuCanvasHasAlpha(canvas) {
    try {
      var data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (var i = 3; i < data.length; i += 4) { if (data[i] < 255) return true; }
      return false;
    } catch (e) { return true; }
  }
  function compressMenuImage(file) {
    return loadMenuImageSource(file).then(function (source) {
      var srcW = source.width, srcH = source.height;
      var scale = Math.min(1, MENU_MAX_WIDTH / srcW, MENU_MAX_HEIGHT / srcH);
      var w = Math.max(1, Math.round(srcW * scale));
      var h = Math.max(1, Math.round(srcH * scale));
      var canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(source, 0, 0, w, h);
      if (source && typeof source.close === "function") source.close();

      var keepPng = menuCanvasHasAlpha(canvas);
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (blob) resolve(blob); else reject(new Error("COMPRESS_FAILED"));
        }, keepPng ? "image/png" : "image/webp", keepPng ? undefined : MENU_PHOTO_QUALITY);
      });
    }).catch(function () { return null; });
  }
  function extFromBlob(blob, fallbackName) {
    if (blob) {
      if (blob.type === "image/webp") return "webp";
      if (blob.type === "image/png") return "png";
      if (blob.type === "image/jpeg") return "jpg";
    }
    return (fallbackName && fallbackName.split(".").pop()) || "jpg";
  }
  function uploadMenuImage(blob, fallbackName) {
    var st = storage();
    if (!st || !blob) return Promise.resolve(null);
    var ext = extFromBlob(blob, fallbackName);
    var ref = st.ref().child("storeMenuImages/menu_" + Date.now() + "." + ext);
    return ref.put(blob).then(function () { return ref.getDownloadURL(); });
  }
  function warnIfLarge(size) {
    els.imageError.textContent = (typeof size === "number" && size > MENU_WARN_BYTES)
      ? "이미지 용량이 커서 표시가 느려질 수 있습니다."
      : "";
  }
  function handleImagePick() {
    var file = els.imageInput.files[0];
    els.imageError.textContent = "";
    pendingCompressPromise = null;
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      els.imagePreviewImg.src = reader.result;
      els.imagePreviewWrap.hidden = false;
    };
    reader.readAsDataURL(file);

    pendingCompressPromise = compressMenuImage(file).then(function (blob) {
      warnIfLarge(blob ? blob.size : file.size);
      return blob;
    });
  }

  /* ---------------- 저장(등록/수정 — 같은 폼을 재사용) ---------------- */

  function handleSave(e) {
    e.preventDefault();
    var d = db();
    if (!d) { setStatus("Firebase가 연결되지 않았습니다.", true); return; }
    if (!currentAdminUser()) { setStatus("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.", true); return; }
    var name = els.nameInput.value.trim();
    if (!name) { setStatus("메뉴명을 입력해주세요.", true); return; }
    var priceNum = Number(els.priceInput.value);
    if (els.priceInput.value === "" || isNaN(priceNum) || priceNum < 0) { setStatus("가격을 올바르게 입력해주세요.", true); return; }

    els.saveBtn.disabled = true;
    setStatus("저장 중...", false);

    var file = els.imageInput.files[0];
    var uploadPromise = !file
      ? Promise.resolve(null)
      : Promise.resolve(pendingCompressPromise || compressMenuImage(file)).then(function (blob) {
          return uploadMenuImage(blob || file, file.name);
        });

    uploadPromise.then(function (newUrl) {
      var imageUrl = newUrl || editingImageUrl;
      if (!imageUrl) throw new Error("IMAGE_REQUIRED");
      // 수정: 기존 document를 UPDATE만 합니다(menuId/createdAt/좋아요 변경 없음).
      if (editingId) {
        // 기존(다국어 번역이 있을 수 있는) name 객체에 한국어만 덮어써서
        // 저장합니다 — 통째로 교체하면 기존 메뉴 연결로 들어온 다른
        // 언어 번역이 사라집니다.
        var nextName = Object.assign({}, editingOriginalName, { ko: name });
        return d.collection("storeMenus").doc(editingId).update({
          name: nextName,
          price: priceNum,
          image: imageUrl,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      // 새 등록: 이때만 새 menuId(Firestore 자동 문서 id)가 생성됩니다.
      var nextOrder = currentMenus.reduce(function (max, m) {
        return Math.max(max, typeof m.order === "number" ? m.order : 0);
      }, 0) + 1;
      return d.collection("storeMenus").add({
        store: currentStore,
        name: { ko: name },
        price: priceNum,
        image: imageUrl,
        soldOut: false,
        isActive: true,
        order: nextOrder,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }).then(function () {
      setStatus(editingId ? "수정되었습니다." : "등록되었습니다.", false);
      resetForm();
      loadMenus();
    }).catch(function (err) {
      setStatus(err && err.message === "IMAGE_REQUIRED" ? "메뉴 이미지를 선택해주세요." : "저장에 실패했습니다.", true);
    }).finally(function () { els.saveBtn.disabled = false; });
  }

  /* ---------------- 판매중 / 품절 ---------------- */

  function toggleSoldOut(id, next, btn) {
    var d = db();
    if (!d) return;
    if (btn) btn.disabled = true;
    d.collection("storeMenus").doc(id).update({
      soldOut: next,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      loadMenus();
    }).catch(function () {
      if (btn) btn.disabled = false;
    });
  }

  /* ---------------- 삭제(soft delete — isActive만 false로) ---------------- */

  function deleteMenu(id) {
    var d = db();
    if (!d || !window.confirm("이 메뉴를 삭제하시겠습니까?")) return;
    d.collection("storeMenus").doc(id).update({
      isActive: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function () {
      if (editingId === id) resetForm();
      loadMenus();
    });
  }

  /* ---------------- 순서 변경(인접한 두 document만 교환) ---------------- */

  function moveMenu(id, direction) {
    var idx = currentMenus.findIndex(function (m) { return m.id === id; });
    if (idx === -1) return;
    var targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= currentMenus.length) return;
    var d = db();
    if (!d) return;
    var a = currentMenus[idx];
    var b = currentMenus[targetIdx];
    var batch = d.batch();
    batch.update(d.collection("storeMenus").doc(a.id), { order: b.order, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    batch.update(d.collection("storeMenus").doc(b.id), { order: a.order, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    batch.commit().then(function () { loadMenus(); });
  }

  /* ---------------- 목록 ---------------- */

  // menuLikeCounts/all은 매장을 바꿔도 다시 읽지 않고 세션 동안 1번만
  // 읽습니다(js/menu-likes.js와 동일한 문서를 그대로 표시용으로만 재사용).
  function loadLikeCounts() {
    var d = db();
    if (!d || likeCountsLoaded) return Promise.resolve();
    return d.collection("menuLikeCounts").doc("all").get().then(function (doc) {
      likeCounts = (doc.exists && doc.data()) || {};
      likeCountsLoaded = true;
    }).catch(function () { /* 실패해도 좋아요 0으로 표시, 메뉴 관리 자체는 계속 동작 */ });
  }

  function renderMenuRow(tbody, m) {
    var tr = document.createElement("tr");

    var tdImg = document.createElement("td");
    if (m.image) {
      var thumb = document.createElement("img");
      thumb.src = m.image;
      thumb.alt = "";
      thumb.style.width = "48px";
      thumb.style.height = "48px";
      thumb.style.objectFit = "cover";
      thumb.style.borderRadius = "6px";
      tdImg.appendChild(thumb);
    }
    tr.appendChild(tdImg);

    var tdName = document.createElement("td");
    tdName.className = "menu-cell";
    tdName.textContent = (m.name && m.name.ko) || "";
    tr.appendChild(tdName);

    var tdPrice = document.createElement("td");
    tdPrice.textContent = typeof m.price === "number" ? m.price.toLocaleString("ko-KR") + "원" : "-";
    tr.appendChild(tdPrice);

    var tdLike = document.createElement("td");
    tdLike.textContent = "♥ " + (likeCounts[m.id] || 0);
    tr.appendChild(tdLike);

    var tdOrder = document.createElement("td");
    var upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.textContent = "↑";
    upBtn.disabled = currentMenus.indexOf(m) === 0;
    upBtn.addEventListener("click", function () { moveMenu(m.id, -1); });
    var downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.textContent = "↓";
    downBtn.disabled = currentMenus.indexOf(m) === currentMenus.length - 1;
    downBtn.addEventListener("click", function () { moveMenu(m.id, 1); });
    tdOrder.appendChild(upBtn);
    tdOrder.appendChild(downBtn);
    tr.appendChild(tdOrder);

    var tdSoldOut = document.createElement("td");
    var soldOutBtn = document.createElement("button");
    soldOutBtn.type = "button";
    soldOutBtn.textContent = m.soldOut ? "품절" : "판매중";
    soldOutBtn.addEventListener("click", function () { toggleSoldOut(m.id, !m.soldOut, soldOutBtn); });
    tdSoldOut.appendChild(soldOutBtn);
    tr.appendChild(tdSoldOut);

    var tdActions = document.createElement("td");
    var editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.textContent = "수정";
    editBtn.addEventListener("click", function () { startEdit(m.id, m); });
    tdActions.appendChild(editBtn);

    var delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "삭제";
    delBtn.addEventListener("click", function () { deleteMenu(m.id); });
    tdActions.appendChild(delBtn);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  }

  // 기존 정적 메뉴(js/menu-data.js MENU_DATA)를 storeMenus에 1회만
  // 안전하게 연결합니다. 문서 id는 기존 id를 그대로 써서(menuId 보존,
  // 좋아요 연결 유지) 이미 연결된 항목은 건너뛰므로(idempotent) 화면을
  // 다시 열어도 중복 생성되지 않습니다. 버튼 없이 목록 조회 시 조용히
  // 한 번만 확인·보완합니다 — admin.html에 함께 실려 있는 MENU_DATA를
  // 그대로 재사용하며 새 조회는 만들지 않습니다.
  // allExistingIds는 삭제(숨김, isActive=false)된 문서까지 포함한 "이미
  // storeMenus에 존재하는 모든 문서 id" 집합입니다 — 화면에 보이는 목록
  // (existingMenus, 삭제된 항목 제외)만 기준으로 판단하면 삭제한 기존
  // 메뉴가 "아직 연결 안 된 메뉴"로 오인되어 매번 되살아납니다.
  function backfillLegacyMenus(store, existingMenus, allExistingIds) {
    if (typeof MENU_DATA === "undefined") return Promise.resolve(existingMenus);
    var d = db();
    if (!d) return Promise.resolve(existingMenus);

    // 기존 화면(js/app.js)이 보여주던 순서(그룹 → 그룹 내 순서)를 그대로
    // 이어받아 sortOrder를 매깁니다.
    var legacyItems = MENU_DATA
      .filter(function (item) { return item.store === store && !allExistingIds[item.id]; })
      .sort(function (a, b) { return (a.group - b.group) || (a.order - b.order); });
    if (!legacyItems.length) return Promise.resolve(existingMenus);

    var nextOrder = existingMenus.reduce(function (max, m) {
      return Math.max(max, typeof m.order === "number" ? m.order : 0);
    }, 0);

    var batch = d.batch();
    var added = [];
    legacyItems.forEach(function (item) {
      nextOrder += 1;
      var data = {
        store: store,
        name: item.name, // 다국어 번역을 그대로 보존(한국어만 남기지 않음)
        price: typeof item.price === "number" ? item.price : null,
        image: item.image || null, // 기존 이미지 경로 그대로(재업로드 없음)
        soldOut: !!item.soldOut,
        isActive: true,
        order: nextOrder,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      batch.set(d.collection("storeMenus").doc(item.id), data);
      added.push(Object.assign({ id: item.id }, data));
    });
    return batch.commit().then(function () {
      return existingMenus.concat(added);
    }).catch(function () {
      return existingMenus; // 실패해도 기존 목록은 그대로 보여주고, 다음 방문 때 다시 시도
    });
  }

  // 매장 하나를 선택하면 그 매장의 메뉴 목록을 한 번의 조회로 모두
  // 가져옵니다(메뉴별 개별 조회/실시간 listener 없음).
  function loadMenus() {
    var d = db();
    var body = els.listBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    loadLikeCounts().then(function () {
      return d.collection("storeMenus").where("store", "==", currentStore).get();
    }).then(function (snap) {
      var menus = [];
      var allExistingIds = {}; // 삭제(숨김)된 문서까지 포함 — 백필이 되살리지 않도록
      snap.forEach(function (doc) {
        allExistingIds[doc.id] = true;
        var data = doc.data();
        if (data.isActive === false) return; // 삭제(숨김)된 메뉴는 관리 목록에도 표시하지 않음
        menus.push(Object.assign({ id: doc.id }, data));
      });
      return backfillLegacyMenus(currentStore, menus, allExistingIds);
    }).then(function (menus) {
      menus.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
      currentMenus = menus;

      body.innerHTML = "";
      if (!menus.length) { body.innerHTML = "<p class=\"empty-note\">등록된 메뉴가 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr><th>이미지</th><th>메뉴명</th><th>가격</th><th>좋아요</th><th>순서</th><th>상태</th><th>작업</th></tr></thead>";
      var tbody = document.createElement("tbody");
      menus.forEach(function (m) { renderMenuRow(tbody, m); });
      table.appendChild(tbody);
      body.appendChild(table);
    }).catch(function () {
      body.innerHTML = "<p class=\"empty-note\">불러오지 못했습니다.</p>";
    });
  }

  function selectStore(store) {
    if (currentStore === store) return;
    currentStore = store;
    Array.prototype.forEach.call(els.storeBtns, function (btn) {
      btn.classList.toggle("active", btn.dataset.store === store);
    });
    resetForm();
    loadMenus();
  }

  function init() {
    els.form = qs("menuForm");
    if (!els.form) return; // 메뉴 관리 탭 마크업이 없으면(구버전) 아무 것도 하지 않음

    els.formTitle = qs("menuFormTitle");
    els.nameInput = qs("menuNameInput");
    els.priceInput = qs("menuPriceInput");
    els.imageInput = qs("menuImageInput");
    els.imagePreviewWrap = qs("menuImagePreviewWrap");
    els.imagePreviewImg = qs("menuImagePreviewImg");
    els.imageError = qs("menuImageError");
    els.saveBtn = qs("menuSaveBtn");
    els.cancelEditBtn = qs("menuCancelEditBtn");
    els.formStatus = qs("menuFormStatus");
    els.listBody = qs("menuListBody");
    els.storeBtns = document.querySelectorAll("#menuStoreNav .admin-nav-btn");

    els.imageInput.addEventListener("change", handleImagePick);
    els.form.addEventListener("submit", handleSave);
    els.cancelEditBtn.addEventListener("click", resetForm);
    Array.prototype.forEach.call(els.storeBtns, function (btn) {
      btn.addEventListener("click", function () { selectStore(btn.dataset.store); });
    });

    loadMenus();
  }

  return { init: init };
})();

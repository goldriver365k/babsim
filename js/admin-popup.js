/* ==========================================================================
   관리자 페이지 - 팝업 관리 (js/admin-popup.js)
   - 기존 admin.js의 탭 구조(admin-nav-btn / admin-page)를 그대로 재사용해
     "팝업 관리" 탭 하나를 추가합니다(새 관리자 사이트 아님).
   - 로그인은 "주간메뉴 관리"에서 이미 로그인한 Firebase 계정을 그대로
     씁니다(별도 로그인 화면 없음). 이미지 업로드도 그 화면과 같은
     Firebase Storage를 그대로 재사용하고, 경로만 sitePopupImages/로
     새로 둡니다(새 스토리지 구조 아님).
   - 이 단계는 관리자가 팝업을 등록·수정·삭제·ON/OFF하는 화면까지만
     만듭니다. 실제 학생 화면에 팝업을 띄우는 기능은 다음 단계입니다.
   ========================================================================== */

var AdminPopup = (function () {
  "use strict";

  var els = {};
  var editingId = null;      // null=새로 등록, 값이 있으면 그 문서를 수정 중
  var editingImageUrl = "";  // 수정 중인 팝업의 기존 이미지(새 파일을 안 고르면 유지)

  function qs(id) { return document.getElementById(id); }
  function db() { return (typeof getFirestoreDb === "function") ? getFirestoreDb() : null; }
  function storage() { return (typeof getFirebaseStorage === "function") ? getFirebaseStorage() : null; }
  function currentAdminUser() {
    var auth = (typeof getFirebaseAuth === "function") ? getFirebaseAuth() : null;
    return auth && auth.currentUser ? auth.currentUser : null;
  }

  function fmtDateTime(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : (typeof ts === "string" ? new Date(ts) : null);
    if (!d || isNaN(d.getTime())) return "-";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  // <input type="datetime-local"> 값("YYYY-MM-DDTHH:mm", 로컬시간) <-> Date.
  function localInputToDate(value) {
    if (!value) return null;
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  function dateToLocalInputValue(ts) {
    var d = (ts && typeof ts.toDate === "function") ? ts.toDate() : null;
    if (!d) return "";
    var pad = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
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
    els.form.reset();
    els.activeInput.checked = true;
    els.imagePreviewWrap.hidden = true;
    els.imagePreviewImg.src = "";
    els.formTitle.textContent = "팝업 등록";
    els.saveBtn.textContent = "등록";
    els.cancelEditBtn.hidden = true;
    setStatus("");
  }

  function startEdit(id, p) {
    editingId = id;
    editingImageUrl = p.imageUrl || "";
    els.titleInput.value = p.title || "";
    els.linkInput.value = p.linkUrl || "";
    els.activeInput.checked = !!p.isActive;
    els.startInput.value = dateToLocalInputValue(p.startAt);
    els.endInput.value = dateToLocalInputValue(p.endAt);
    els.imageInput.value = "";
    if (editingImageUrl) {
      els.imagePreviewImg.src = editingImageUrl;
      els.imagePreviewWrap.hidden = false;
    } else {
      els.imagePreviewWrap.hidden = true;
    }
    els.formTitle.textContent = "팝업 수정";
    els.saveBtn.textContent = "수정 저장";
    els.cancelEditBtn.hidden = false;
    setStatus("");
    els.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function uploadPopupImage(file) {
    var st = storage();
    if (!st || !file) return Promise.resolve(null);
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var ref = st.ref().child("sitePopupImages/popup_" + Date.now() + "." + ext);
    return ref.put(file).then(function () { return ref.getDownloadURL(); });
  }

  function handleImagePick() {
    var file = els.imageInput.files[0];
    els.imageError.textContent = "";
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      els.imagePreviewImg.src = reader.result;
      els.imagePreviewWrap.hidden = false;
    };
    reader.readAsDataURL(file);
  }

  function handleSave(e) {
    e.preventDefault();
    var d = db();
    if (!d) { setStatus("Firebase가 연결되지 않았습니다.", true); return; }
    if (!currentAdminUser()) { setStatus("먼저 \"주간메뉴 관리\" 탭에서 관리자 계정으로 로그인해주세요.", true); return; }
    var title = els.titleInput.value.trim();
    if (!title) { setStatus("팝업 제목을 입력해주세요.", true); return; }

    els.saveBtn.disabled = true;
    setStatus("저장 중...", false);

    var file = els.imageInput.files[0];
    Promise.resolve(file ? uploadPopupImage(file) : null).then(function (newUrl) {
      var imageUrl = newUrl || editingImageUrl;
      if (!imageUrl) throw new Error("IMAGE_REQUIRED");
      var data = {
        title: title,
        imageUrl: imageUrl,
        linkUrl: els.linkInput.value.trim(),
        isActive: els.activeInput.checked,
        startAt: localInputToDate(els.startInput.value),
        endAt: localInputToDate(els.endInput.value)
      };
      if (editingId) return d.collection("sitePopups").doc(editingId).update(data);
      data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      return d.collection("sitePopups").add(data);
    }).then(function () {
      setStatus(editingId ? "수정되었습니다." : "등록되었습니다.", false);
      resetForm();
      loadPopups();
    }).catch(function (err) {
      setStatus(err && err.message === "IMAGE_REQUIRED" ? "팝업 이미지를 선택해주세요." : "저장에 실패했습니다.", true);
    }).finally(function () { els.saveBtn.disabled = false; });
  }

  function toggleActive(id, next, btn) {
    var d = db();
    if (!d) return;
    if (btn) btn.disabled = true;
    d.collection("sitePopups").doc(id).update({ isActive: next }).then(function () {
      loadPopups();
    }).catch(function () {
      if (btn) btn.disabled = false;
    });
  }

  function deletePopup(id) {
    var d = db();
    if (!d || !window.confirm("정말 삭제하시겠습니까?")) return;
    d.collection("sitePopups").doc(id).delete().then(function () {
      if (editingId === id) resetForm();
      loadPopups();
    });
  }

  function loadPopups() {
    var d = db();
    var body = els.listBody;
    if (!d || !body) return;
    body.innerHTML = "<p class=\"loading-note\">불러오는 중...</p>";

    d.collection("sitePopups").orderBy("createdAt", "desc").limit(200).get().then(function (snap) {
      body.innerHTML = "";
      if (snap.empty) { body.innerHTML = "<p class=\"empty-note\">등록된 팝업이 없습니다.</p>"; return; }

      var table = document.createElement("table");
      table.className = "results-table";
      table.innerHTML = "<thead><tr><th>이미지</th><th>제목</th><th>링크</th><th>시작</th><th>종료</th><th>사용</th><th>작업</th></tr></thead>";
      var tbody = document.createElement("tbody");

      snap.forEach(function (doc) {
        var p = doc.data();
        var tr = document.createElement("tr");

        var tdImg = document.createElement("td");
        if (p.imageUrl) {
          var thumb = document.createElement("img");
          thumb.src = p.imageUrl;
          thumb.alt = "";
          thumb.style.width = "48px";
          thumb.style.height = "48px";
          thumb.style.objectFit = "cover";
          thumb.style.borderRadius = "6px";
          tdImg.appendChild(thumb);
        }
        tr.appendChild(tdImg);

        var tdTitle = document.createElement("td");
        tdTitle.textContent = p.title || "";
        tr.appendChild(tdTitle);

        var tdLink = document.createElement("td");
        tdLink.className = "menu-cell";
        tdLink.textContent = p.linkUrl || "-";
        tr.appendChild(tdLink);

        var tdStart = document.createElement("td");
        tdStart.textContent = fmtDateTime(p.startAt);
        tr.appendChild(tdStart);

        var tdEnd = document.createElement("td");
        tdEnd.textContent = fmtDateTime(p.endAt);
        tr.appendChild(tdEnd);

        var tdActive = document.createElement("td");
        tdActive.textContent = p.isActive ? "ON" : "OFF";
        tr.appendChild(tdActive);

        var tdActions = document.createElement("td");
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.textContent = p.isActive ? "끄기" : "켜기";
        toggleBtn.addEventListener("click", function () { toggleActive(doc.id, !p.isActive, toggleBtn); });
        tdActions.appendChild(toggleBtn);

        var editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "수정";
        editBtn.addEventListener("click", function () { startEdit(doc.id, p); });
        tdActions.appendChild(editBtn);

        var delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "삭제";
        delBtn.addEventListener("click", function () { deletePopup(doc.id); });
        tdActions.appendChild(delBtn);

        tr.appendChild(tdActions);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    }).catch(function () {
      body.innerHTML = "<p class=\"empty-note\">불러오지 못했습니다.</p>";
    });
  }

  function init() {
    els.form = qs("popupForm");
    if (!els.form) return; // 팝업 관리 탭 마크업이 없으면(구버전) 아무 것도 하지 않음

    els.formTitle = qs("popupFormTitle");
    els.titleInput = qs("popupTitleInput");
    els.imageInput = qs("popupImageInput");
    els.imagePreviewWrap = qs("popupImagePreviewWrap");
    els.imagePreviewImg = qs("popupImagePreviewImg");
    els.imageError = qs("popupImageError");
    els.linkInput = qs("popupLinkInput");
    els.activeInput = qs("popupActiveInput");
    els.startInput = qs("popupStartInput");
    els.endInput = qs("popupEndInput");
    els.saveBtn = qs("popupSaveBtn");
    els.cancelEditBtn = qs("popupCancelEditBtn");
    els.formStatus = qs("popupFormStatus");
    els.listBody = qs("popupListBody");

    els.imageInput.addEventListener("change", handleImagePick);
    els.form.addEventListener("submit", handleSave);
    els.cancelEditBtn.addEventListener("click", resetForm);

    loadPopups();
  }

  return { init: init };
})();

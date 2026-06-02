/* ===============================================================
   admin/users.js — yetkili kullanici yonetimi (admin only)
   GET  /api/yonetim/yetkililer.php
   POST /api/yonetim/kullanici_ekle.php
   POST /api/yonetim/kullanici_guncelle.php
   POST /api/yonetim/kullanici_durum_degistir.php
   POST /api/yonetim/sifre_degistir.php
   =============================================================== */

var _kullaniciListesi  = [];
var _kullaniciDuzenleId = null;   /* null = ekle modu, number = guncelle modu */
var _sifreDegistirId   = null;
var _kullaniciSubmitting = false;
var _sifreSubmitting     = false;

document.addEventListener("adminLayoutReady", function () {
  /* layout.js zaten admin-only redirect yapiyor; burada sadece guard double-check */
  if (!window._adminUser || window._adminUser.rol !== "admin") return;
  _modallarEkle();
  _kullaniciSayfaKur();
});

/* ================================================================
   SAYFA ISKELET
   ================================================================ */
function _kullaniciSayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Kullanıcılar</h1>' +
        '<p class="page-header__subtitle">Sisteme giriş yapabilen yetkili hesapları yönetin.</p>' +
      '</div>' +
      '<div class="page-header__actions">' +
        '<button class="btn btn-primary" type="button"' +
          ' onclick="kullaniciModalAc(null)">+ Kullanıcı Ekle</button>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;" id="kullanici-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Kullanıcılar yükleniyor…</span>' +
      '</div>' +
    '</div>';

  _listeYukle();
}

/* ================================================================
   LISTE YUKLE
   ================================================================ */
async function _listeYukle() {
  var container = document.getElementById("kullanici-tablo");
  if (!container) return;

  var res = await apiGet("/api/yonetim/yetkililer.php");

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' + _ikon("alert", 16) + " Kullanıcılar yüklenemedi.</p>";
    return;
  }

  _kullaniciListesi = res.data || [];

  if (_kullaniciListesi.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon("user", 40) + "</span>" +
        '<p class="empty-state__title">Kayıtlı kullanıcı yok.</p>' +
      "</div>";
    return;
  }

  var mevcutId = window._adminUser ? window._adminUser.id : null;

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      "<th>Ad Soyad</th><th>E-posta</th><th>Rol</th>" +
      '<th style="text-align:center;">Durum</th><th>Son Giriş</th>' +
      '<th class="col-actions">İşlem</th>' +
    "</tr></thead><tbody>";

  _kullaniciListesi.forEach(function (u) {
    var durumBadge = u.durum
      ? '<span class="badge badge--success">Aktif</span>'
      : '<span class="badge badge--danger">Pasif</span>';

    var rolBadge =
      '<span class="badge ' + (u.rol === "admin" ? "badge--warning" : "badge--muted") + '">' +
      _esc(u.rol === "admin" ? "Admin" : "Personel") +
      "</span>";

    var sonGiris = u.son_giris_tarihi ? formatTarih(u.son_giris_tarihi) : "—";

    /* Kendi hesabinda durum degistirme butonu gizlenir */
    var benimHesabim = Number(u.kullanici_id) === Number(mevcutId);
    var toggleLabel  = u.durum ? "Pasif Yap" : "Aktif Yap";
    var toggleClass  = u.durum ? "btn-danger" : "btn-success";
    var yeniDurum    = u.durum ? 0 : 1;

    html +=
      "<tr>" +
        '<td style="font-weight:500;">' + _esc(u.ad_soyad || "-") + "</td>" +
        '<td style="font-size:var(--font-size-xs);">' + _esc(u.email || "-") + "</td>" +
        "<td>" + rolBadge + "</td>" +
        '<td style="text-align:center;">' + durumBadge + "</td>" +
        '<td style="font-size:var(--font-size-sm);">' + sonGiris + "</td>" +
        '<td class="col-actions">' +
          '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="kullaniciModalAc(' + u.kullanici_id + ')">Düzenle</button>' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="sifreModalAc(' + u.kullanici_id + ')">Şifre</button>' +
            (!benimHesabim
              ? '<button class="btn btn-sm ' + toggleClass + '" type="button"' +
                  ' onclick="kullaniciDurumDegistir(' + u.kullanici_id + ',' + yeniDurum + ')">' +
                  toggleLabel + "</button>" +
                '<button class="btn btn-sm btn-danger" type="button"' +
                  ' onclick="kullaniciSil(' + u.kullanici_id + ',\'' + _esc(u.ad_soyad) + '\')">Sil</button>'
              : "") +
          "</div>" +
        "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

/* ================================================================
   KULLANICI SİL
   ================================================================ */

/**
 * Kullanıcıyı kalıcı siler. Kendi hesabı ve son admin silinemez.
 * @param {number} kullaniciId
 * @param {string} adSoyad
 */
async function kullaniciSil(kullaniciId, adSoyad) {
  if (!confirm('"' + adSoyad + '" kullanıcısını kalıcı olarak silmek istediğinizden emin misiniz?')) return;

  var res = await apiPost("/api/yonetim/kullanici_sil.php", { kullanici_id: kullaniciId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Silinemedi.", "error"); return; }

  toast(adSoyad + " kalıcı olarak silindi.", "success");
  _listeYukle();
}

/* ================================================================
   KULLANICI EKLE / DUZENLE MODAL
   ================================================================ */

/**
 * Kullanıcı ekle/düzenle modalını açar.
 * @param {number|null} kullaniciId
 */
function kullaniciModalAc(kullaniciId) {
  _kullaniciDuzenleId  = kullaniciId;
  _kullaniciSubmitting = false;

  var titleEl = document.getElementById("kul-modal-title");
  if (titleEl) titleEl.textContent = kullaniciId ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle";

  /* Formu sifirla */
  ["kul-ad-soyad", "kul-email", "kul-sifre"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  _kulSetVal("kul-rol", "personel");
  _kulHataSil("kul-ad-soyad", "kul-ad-soyad-err");
  _kulHataSil("kul-email",    "kul-email-err");
  _kulHataSil("kul-sifre",    "kul-sifre-err");

  /* Sifre alani: ekle modunda zorunlu, duzenlemede gizle */
  var sifreGrp = document.getElementById("kul-sifre-grp");
  if (sifreGrp) sifreGrp.style.display = kullaniciId ? "none" : "";

  /* Duzenleme: alanlari doldur */
  if (kullaniciId) {
    var u = _kullaniciListesi.find(function (x) { return x.kullanici_id === kullaniciId; });
    if (u) {
      _kulSetVal("kul-ad-soyad", u.ad_soyad || "");
      _kulSetVal("kul-email",    u.email    || "");
      _kulSetVal("kul-rol",      u.rol      || "personel");
    }
  }

  var btnEl = document.getElementById("btn-kul-kaydet");
  if (btnEl) btnEl.textContent = kullaniciId ? "Güncelle" : "Ekle";

  acModal("modal-kullanici");
}

/**
 * Kullanıcı formunu doğrular ve ekle/güncelle isteği gönderir.
 */
async function kullaniciKaydet() {
  if (_kullaniciSubmitting) return;

  var adSoyad = _kulGetVal("kul-ad-soyad").trim();
  var email   = _kulGetVal("kul-email").trim();
  var sifre   = _kulGetVal("kul-sifre");
  var rol     = _kulGetVal("kul-rol");

  var hataMi = false;

  if (!gerekli(adSoyad) || adSoyad.length < 2) {
    _kulHataGoster("kul-ad-soyad", "kul-ad-soyad-err", "Ad Soyad en az 2 karakter olmalıdır.");
    hataMi = true;
  } else { _kulHataSil("kul-ad-soyad", "kul-ad-soyad-err"); }

  if (!emailGecerli(email)) {
    _kulHataGoster("kul-email", "kul-email-err", "Geçerli bir e-posta girin.");
    hataMi = true;
  } else { _kulHataSil("kul-email", "kul-email-err"); }

  /* Sifre yalnizca ekle modunda zorunlu */
  if (!_kullaniciDuzenleId) {
    if (!gerekli(sifre) || sifre.length < 6) {
      _kulHataGoster("kul-sifre", "kul-sifre-err", "Şifre en az 6 karakter olmalıdır.");
      hataMi = true;
    } else { _kulHataSil("kul-sifre", "kul-sifre-err"); }
  }

  if (hataMi) return;

  var btn  = document.getElementById("btn-kul-kaydet");
  var orig = btn ? btn.textContent : "";
  _kullaniciSubmitting = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var res;
  if (_kullaniciDuzenleId) {
    res = await apiPost("/api/yonetim/kullanici_guncelle.php", {
      kullanici_id: _kullaniciDuzenleId,
      ad_soyad:     adSoyad,
      email:        email,
      rol:          rol,
    });
  } else {
    res = await apiPost("/api/yonetim/kullanici_ekle.php", {
      ad_soyad: adSoyad,
      email:    email,
      sifre:    sifre,
      rol:      rol,
    });
  }

  _kullaniciSubmitting = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = orig; }
  if (!res) return;
  if (!res.success) {
    /* E-posta cakismasi gibi field-level hatalari goster */
    var err = res.errors || {};
    if (err.email) {
      _kulHataGoster("kul-email", "kul-email-err", err.email[0] || "E-posta geçersiz.");
    } else {
      toast(res.message || "Kaydedilemedi.", "error");
    }
    return;
  }

  kapatModal("modal-kullanici");
  toast(_kullaniciDuzenleId ? "Kullanıcı güncellendi." : "Kullanıcı eklendi.", "success");
  _listeYukle();
}

/* ================================================================
   SIFRE DEGISTIR MODAL
   ================================================================ */

/**
 * Şifre değiştirme modalını açar.
 * @param {number} kullaniciId
 */
function sifreModalAc(kullaniciId) {
  _sifreDegistirId = kullaniciId;
  _sifreSubmitting = false;

  var u = _kullaniciListesi.find(function (x) { return x.kullanici_id === kullaniciId; });
  var adEl = document.getElementById("sifre-modal-ad");
  if (adEl) adEl.textContent = u ? _esc(u.ad_soyad) : "";

  var sifreInput = document.getElementById("yeni-sifre-input");
  if (sifreInput) sifreInput.value = "";
  _kulHataSil("yeni-sifre-input", "yeni-sifre-err");

  var btnEl = document.getElementById("btn-sifre-kaydet");
  if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Kaydet"; }

  acModal("modal-sifre");
}

/**
 * Yeni şifreyi doğrular ve kaydeder.
 */
async function sifreKaydet() {
  if (_sifreSubmitting) return;

  var sifreInput = document.getElementById("yeni-sifre-input");
  var sifre = sifreInput ? sifreInput.value : "";

  if (!gerekli(sifre) || sifre.length < 6) {
    _kulHataGoster("yeni-sifre-input", "yeni-sifre-err", "Şifre en az 6 karakter olmalıdır.");
    return;
  }
  _kulHataSil("yeni-sifre-input", "yeni-sifre-err");

  var btn = document.getElementById("btn-sifre-kaydet");
  _sifreSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var res = await apiPost("/api/yonetim/sifre_degistir.php", {
    kullanici_id: _sifreDegistirId,
    yeni_sifre:   sifre,
  });

  _sifreSubmitting = false;
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Şifre değiştirilemedi.", "error"); return; }

  kapatModal("modal-sifre");
  toast("Şifre başarıyla güncellendi.", "success");
}

/* ================================================================
   DURUM TOGGLE
   ================================================================ */

/**
 * Kullanıcıyı aktif veya pasif yapar. Kendi hesabı görünmez.
 * @param {number} kullaniciId
 * @param {0|1}    yeniDurum
 */
async function kullaniciDurumDegistir(kullaniciId, yeniDurum) {
  var res = await apiPost("/api/yonetim/kullanici_durum_degistir.php", {
    kullanici_id: kullaniciId,
    durum:        yeniDurum,
  });
  if (!res) return;
  if (!res.success) { toast(res.message || "Durum değiştirilemedi.", "error"); return; }
  toast(yeniDurum === 1 ? "Kullanıcı aktif edildi." : "Kullanıcı pasif yapıldı.", "success");
  _listeYukle();
}

/* ================================================================
   MODAL HTML INJECT
   ================================================================ */
function _modallarEkle() {
  /* ---- Kullanici Ekle / Duzenle Modal ---- */
  var kulEl = document.createElement("div");
  kulEl.className = "modal-overlay";
  kulEl.id        = "modal-kullanici";
  kulEl.setAttribute("role",            "dialog");
  kulEl.setAttribute("aria-modal",      "true");
  kulEl.setAttribute("aria-labelledby", "kul-modal-title");
  kulEl.setAttribute("aria-hidden",     "true");
  kulEl.innerHTML =
    '<div class="modal">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="kul-modal-title">Kullanıcı Ekle</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-kullanici\')">' + _ikon("x", 16) + "</button>" +
      "</div>" +
      '<div class="modal__body">' +

        '<div class="form-group">' +
          '<label class="form-label" for="kul-ad-soyad">Ad Soyad' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="text" class="input" id="kul-ad-soyad"' +
            ' placeholder="Örn: Ahmet Yılmaz" autocomplete="off">' +
          '<span class="form-error" id="kul-ad-soyad-err"></span>' +
        "</div>" +

        '<div class="form-group">' +
          '<label class="form-label" for="kul-email">E-posta' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="email" class="input" id="kul-email"' +
            ' placeholder="ornek@domain.com" autocomplete="off">' +
          '<span class="form-error" id="kul-email-err"></span>' +
        "</div>" +

        '<div class="form-group" id="kul-sifre-grp">' +
          '<label class="form-label" for="kul-sifre">Şifre' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="password" class="input" id="kul-sifre"' +
            ' placeholder="En az 6 karakter" autocomplete="new-password">' +
          '<span class="form-error" id="kul-sifre-err"></span>' +
        "</div>" +

        '<div class="form-group">' +
          '<label class="form-label" for="kul-rol">Rol' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<select class="input" id="kul-rol">' +
            '<option value="personel">Personel</option>' +
            '<option value="admin">Admin</option>' +
          "</select>" +
        "</div>" +

      "</div>" +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-kullanici\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-kul-kaydet"' +
          ' onclick="kullaniciKaydet()">Ekle</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(kulEl);

  /* ---- Sifre Degistir Modal ---- */
  var sifreEl = document.createElement("div");
  sifreEl.className = "modal-overlay";
  sifreEl.id        = "modal-sifre";
  sifreEl.setAttribute("role",            "dialog");
  sifreEl.setAttribute("aria-modal",      "true");
  sifreEl.setAttribute("aria-labelledby", "sifre-modal-title");
  sifreEl.setAttribute("aria-hidden",     "true");
  sifreEl.innerHTML =
    '<div class="modal modal--sm">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="sifre-modal-title">Şifre Değiştir</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-sifre\')">' + _ikon("x", 16) + "</button>" +
      "</div>" +
      '<div class="modal__body">' +
        '<p style="font-size:var(--font-size-sm);color:var(--color-text-2);margin-bottom:var(--space-4);">' +
          'Kullanıcı: <strong id="sifre-modal-ad"></strong>' +
        "</p>" +
        '<div class="form-group">' +
          '<label class="form-label" for="yeni-sifre-input">Yeni Şifre' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="password" class="input" id="yeni-sifre-input"' +
            ' placeholder="En az 6 karakter" autocomplete="new-password">' +
          '<span class="form-error" id="yeni-sifre-err"></span>' +
        "</div>" +
      "</div>" +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-sifre\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-sifre-kaydet"' +
          ' onclick="sifreKaydet()">Kaydet</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(sifreEl);
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _kulSetVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}
function _kulGetVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}
function _kulHataGoster(inputId, errorId, msg) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}
function _kulHataSil(inputId, errorId) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.remove("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.remove("has-error");
  }
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
}
/* _esc() ui.js'de global olarak tanimlidir — A-13 */

/* ===============================================================
   admin/musteri-hesaplari.js — musteri hesap listesi + durum toggle
   GET  /api/yonetim/musteri_hesaplari.php
   POST /api/yonetim/musteri_hesap_durum.php  (admin only)
   =============================================================== */

var _hesapListesi       = [];
var _sifreSifirlaId     = null;
var _sifreSifirlaSubmit = false;

document.addEventListener("adminLayoutReady", function () {
  _sifreModalEkle();
  _sayfaKur();
});

/* ================================================================
   SAYFA ISKELET
   ================================================================ */
function _sayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Müşteri Hesapları</h1>' +
        '<p class="page-header__subtitle">Sisteme kayıtlı müşteri hesaplarını yönetin.</p>' +
      '</div>' +
    '</div>' +

    '<div class="filter-bar">' +
      '<div class="form-group" style="flex:1;max-width:360px;">' +
        '<label class="form-label" for="mh-ara">Ara</label>' +
        '<input type="search" class="input" id="mh-ara"' +
          ' placeholder="Ad, telefon veya e-posta…" autocomplete="off">' +
      '</div>' +
    '</div>' +

    '<div class="card" style="padding:0;overflow:hidden;" id="hesap-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Müşteri hesapları yükleniyor…</span>' +
      '</div>' +
    '</div>';

  _listeYukle();
}

/* ================================================================
   LISTE YUKLE
   ================================================================ */
async function _listeYukle() {
  var container = document.getElementById("hesap-tablo");
  if (!container) return;

  var res = await apiGet("/api/yonetim/musteri_hesaplari.php");

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' +
        _ikon("alert", 16) + " Müşteri hesapları yüklenemedi." +
      "</p>";
    return;
  }

  _hesapListesi = res.data || [];
  _tabloRender(container, _hesapListesi);

  /* Client-side arama */
  var araInput = document.getElementById("mh-ara");
  if (araInput) {
    araInput.oninput = function () {
      var q = araInput.value.trim().toLowerCase();
      var filtre = !q ? _hesapListesi : _hesapListesi.filter(function (h) {
        return (
          (h.ad_soyad || "").toLowerCase().includes(q) ||
          (h.telefon  || "").toLowerCase().includes(q) ||
          (h.email    || "").toLowerCase().includes(q)
        );
      });
      _tabloRender(container, filtre);
    };
  }
}

/* ================================================================
   TABLO RENDER
   ================================================================ */
function _tabloRender(container, liste) {
  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon("user", 40) + "</span>" +
        '<p class="empty-state__title">Kayıtlı müşteri hesabı yok.</p>' +
      "</div>";
    return;
  }

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      "<th>Ad Soyad</th>" +
      "<th>Telefon</th>" +
      "<th>E-posta</th>" +
      '<th style="text-align:center;">Randevu</th>' +
      "<th>Son Giriş</th>" +
      '<th style="text-align:center;">Durum</th>' +
      '<th class="col-actions">İşlem</th>' +
    "</tr></thead><tbody>";

  liste.forEach(function (h) {
    var durumBadge = h.durum
      ? '<span class="badge badge--success">Aktif</span>'
      : '<span class="badge badge--danger">Pasif</span>';

    var sonGiris = h.son_giris_tarihi ? formatTarih(h.son_giris_tarihi) : "—";

    var toggleLabel = h.durum ? "Pasif Yap" : "Aktif Yap";
    var toggleClass = h.durum ? "btn-danger"  : "btn-success";
    var yeniDurum   = h.durum ? 0 : 1;

    html +=
      "<tr>" +
        '<td style="font-weight:500;">' + _esc(h.ad_soyad || "-") + "</td>" +
        '<td class="font-mono" style="font-size:var(--font-size-xs);">' +
          _esc(h.telefon || "-") +
        "</td>" +
        '<td style="font-size:var(--font-size-xs);">' +
          _esc(h.email || "-") +
        "</td>" +
        '<td style="text-align:center;font-weight:600;">' +
          _esc(String(h.toplam_randevu)) +
        "</td>" +
        '<td style="font-size:var(--font-size-sm);">' + sonGiris + "</td>" +
        '<td style="text-align:center;">' + durumBadge + "</td>" +
        '<td class="col-actions">' +
          '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;">' +
            '<a class="btn btn-ghost btn-sm" href="randevular.html?musteri_hesap_id=' + h.hesap_id + '">Randevuları</a>' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="hesapSifreSifirlaAc(' + h.hesap_id + ')">Şifre Sıfırla</button>' +
            '<button class="btn btn-sm btn-danger" type="button"' +
              ' onclick="hesapSil(' + h.hesap_id + ',\'' + _esc(h.ad_soyad) + '\')">Sil</button>' +
            '<button class="btn btn-sm ' + toggleClass + '" type="button"' +
              ' onclick="hesapDurumDegistir(' + h.hesap_id + "," + yeniDurum + ')">' +
              toggleLabel +
            "</button>" +
          "</div>" +
        "</td>" +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

/* ================================================================
   AKSIYON FONKSIYONlARI
   ================================================================ */

/**
 * Hesap durumunu aktif/pasif yapar.
 * @param {number} hesapId
 * @param {0|1} yeniDurum
 */
async function hesapDurumDegistir(hesapId, yeniDurum) {
  var res = await apiPost("/api/yonetim/musteri_hesap_durum.php", {
    hesap_id: hesapId,
    durum:    yeniDurum
  });
  if (!res) return;
  if (!res.success) { toast(res.message || "Durum değiştirilemedi.", "error"); return; }
  toast(yeniDurum === 1 ? "Hesap aktif edildi." : "Hesap pasif yapıldı.", "success");
  _listeYukle();
}

/* ================================================================
   SIFRE SIFIRLA
   ================================================================ */

function hesapSifreSifirlaAc(hesapId) {
  _sifreSifirlaId     = hesapId;
  _sifreSifirlaSubmit = false;

  var h    = _hesapListesi.find(function (x) { return x.hesap_id === hesapId; });
  var adEl = document.getElementById("mh-sifre-modal-ad");
  if (adEl) adEl.textContent = h ? h.ad_soyad : "";

  var inp = document.getElementById("mh-yeni-sifre");
  if (inp) inp.value = "";
  var err = document.getElementById("mh-yeni-sifre-err");
  if (err) { err.textContent = ""; err.classList.remove("is-visible"); }

  var btn = document.getElementById("btn-mh-sifre-kaydet");
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }

  acModal("modal-mh-sifre");
}

async function hesapSifreKaydet() {
  if (_sifreSifirlaSubmit) return;

  var inp   = document.getElementById("mh-yeni-sifre");
  var sifre = inp ? inp.value : "";

  if (!sifre || sifre.length < 6) {
    var err = document.getElementById("mh-yeni-sifre-err");
    if (err) { err.textContent = "Şifre en az 6 karakter olmalıdır."; err.classList.add("is-visible"); }
    return;
  }

  var btn = document.getElementById("btn-mh-sifre-kaydet");
  _sifreSifirlaSubmit = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var res = await apiPost("/api/yonetim/musteri_hesap_sifre_sifirla.php", {
    hesap_id:   _sifreSifirlaId,
    yeni_sifre: sifre
  });

  _sifreSifirlaSubmit = false;
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Şifre sıfırlanamadı.", "error"); return; }

  kapatModal("modal-mh-sifre");
  toast("Müşteri şifresi güncellendi.", "success");
}

/* ================================================================
   HESAP SİL
   ================================================================ */

/**
 * Müşteri web hesabını siler. Randevu geçmişi korunur.
 * @param {number} hesapId
 * @param {string} adSoyad
 */
async function hesapSil(hesapId, adSoyad) {
  if (!confirm(
    '"' + adSoyad + '" müşteri hesabını silmek istediğinizden emin misiniz?\n' +
    'Randevu geçmişi korunur, sadece giriş erişimi kaldırılır.'
  )) return;

  var res = await apiPost("/api/yonetim/musteri_hesap_sil.php", { hesap_id: hesapId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Silinemedi.", "error"); return; }

  toast(adSoyad + " hesabı silindi.", "success");
  _listeYukle();
}

function _sifreModalEkle() {
  var el = document.createElement("div");
  el.className = "modal-overlay";
  el.id        = "modal-mh-sifre";
  el.setAttribute("role",            "dialog");
  el.setAttribute("aria-modal",      "true");
  el.setAttribute("aria-labelledby", "mh-sifre-modal-title");
  el.setAttribute("aria-hidden",     "true");
  el.innerHTML =
    '<div class="modal modal--sm">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="mh-sifre-modal-title">Şifre Sıfırla</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-mh-sifre\')">' + _ikon("x", 16) + "</button>" +
      "</div>" +
      '<div class="modal__body">' +
        '<p style="font-size:var(--font-size-sm);color:var(--color-text-2);margin-bottom:var(--space-4);">' +
          'Müşteri: <strong id="mh-sifre-modal-ad"></strong>' +
        "</p>" +
        '<div class="form-group">' +
          '<label class="form-label" for="mh-yeni-sifre">Yeni Şifre <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="password" class="input" id="mh-yeni-sifre" placeholder="En az 6 karakter" autocomplete="new-password">' +
          '<span class="form-error" id="mh-yeni-sifre-err"></span>' +
        "</div>" +
      "</div>" +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button" onclick="kapatModal(\'modal-mh-sifre\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-mh-sifre-kaydet" onclick="hesapSifreKaydet()">Kaydet</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(el);
}

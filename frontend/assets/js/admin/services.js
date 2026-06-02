/* ===============================================================
   admin/services.js — CRUD + populer/durum toggle
   DELETE butonu YOK; sadece durum toggle (aktif/pasif)
   =============================================================== */

var _hizmetListesi   = [];
var _hizmetDuzenleId = null;   /* null = ekle modu, number = guncelle modu */
var _hizmetSubmitting = false; /* cift-submit engeli */

document.addEventListener("adminLayoutReady", function () {
  _hizmetModalEkle();
  _hizmetSayfaKur();
});

/* ================================================================
   SAYFA ISKELET
   ================================================================ */
function _hizmetSayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Hizmetler</h1>' +
        '<p class="page-header__subtitle">Hizmetleri yönetin, fiyat ve süre bilgilerini güncelleyin.</p>' +
      '</div>' +
      '<div class="page-header__actions">' +
        '<button class="btn btn-primary" type="button"' +
          ' onclick="hizmetModalAc(null)">+ Hizmet Ekle</button>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;" id="hizmet-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Yükleniyor…</span>' +
      '</div>' +
    '</div>';

  _hizmetListeYukle();
}

/* ================================================================
   LISTE YUKLE
   ================================================================ */
async function _hizmetListeYukle() {
  var container = document.getElementById("hizmet-tablo");
  if (!container) return;

  var res = await apiGet("/api/yonetim/hizmetler.php");

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' + _ikon('alert',16) + ' Hizmetler yüklenemedi.</p>';
    return;
  }

  _hizmetListesi = res.data || [];

  if (_hizmetListesi.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon('scissors',40) + '</span>' +
        '<p class="empty-state__title">Henüz hizmet eklenmemiş.</p>' +
        '<p class="empty-state__desc">Sağ üstteki "Hizmet Ekle" butonunu kullanın.</p>' +
      '</div>';
    return;
  }

  _hizmetTabloRender(container, _hizmetListesi);
}

/* ================================================================
   TABLO RENDER
   ================================================================ */
function _hizmetTabloRender(container, liste) {
  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Hizmet Adı</th><th>Kategori</th><th>Süre</th>' +
      '<th>Fiyat</th><th>Popüler</th><th>Durum</th>' +
      '<th class="col-actions">İşlem</th>' +
    '</tr></thead><tbody>';

  liste.forEach(function (h) {
    var durumBadge = h.durum
      ? '<span class="badge badge--success">Aktif</span>'
      : '<span class="badge badge--muted">Pasif</span>';

    var populerBadge = h.populer_mi
      ? '<span class="badge badge--warning">' + _ikon('sparkles',12) + ' Popüler</span>'
      : '<span style="color:var(--color-text-3);font-size:var(--font-size-xs);">—</span>';

    var toggleDurumLabel = h.durum ? "Pasif Yap" : "Aktif Yap";
    var toggleDurumClass = h.durum ? "btn-danger"  : "btn-success";
    var yeniDurum        = h.durum ? 0 : 1;

    var populerLabel = h.populer_mi ? "Normal Yap" : "Popüler Yap";

    html +=
      '<tr>' +
        '<td style="font-weight:500;">' + _esc(h.hizmet_adi) + '</td>' +
        '<td style="font-size:var(--font-size-sm);color:var(--color-text-2);">' +
          _esc(h.kategori || "-") +
        '</td>' +
        '<td style="font-size:var(--font-size-sm);">' +
          _esc(String(h.sure_dakika)) + ' dk' +
        '</td>' +
        '<td class="font-mono" style="font-size:var(--font-size-sm);">' +
          formatTL(h.fiyat) +
        '</td>' +
        '<td>' + populerBadge + '</td>' +
        '<td>' + durumBadge   + '</td>' +
        '<td class="col-actions">' +
          '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="hizmetModalAc(' + h.hizmet_id + ')">Düzenle</button>' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="hizmetPopulerToggle(' + h.hizmet_id + ')">' + populerLabel + '</button>' +
            '<button class="btn btn-sm ' + toggleDurumClass + '" type="button"' +
              ' onclick="hizmetDurumDegistir(' + h.hizmet_id + ',' + yeniDurum + ')">' +
              toggleDurumLabel +
            '</button>' +
            '<button class="btn btn-sm btn-danger" type="button"' +
              ' onclick="hizmetKaliciSil(' + h.hizmet_id + ',\'' + _esc(h.hizmet_adi) + '\')" title="Kalıcı Sil">Sil</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

/* ================================================================
   HIZMET MODAL — EKLE / DUZENLE
   ================================================================ */

/**
 * Hizmet ekle/düzenle modalını açar.
 * @param {number|null} hizmetId - Düzenleme için hizmet ID; null ise ekleme modu
 */
function hizmetModalAc(hizmetId) {
  _hizmetDuzenleId  = hizmetId;
  _hizmetSubmitting = false; /* modal her acilisinda sifirla */

  var titleEl = document.getElementById("hizmet-modal-title");
  if (titleEl) titleEl.textContent = hizmetId ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle";

  /* Formu sifirla */
  ["hz-adi","hz-sure","hz-fiyat","hz-aciklama","hz-kategori","hz-siralama"]
    .forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ""; });

  var populerEl = document.getElementById("hz-populer");
  if (populerEl) populerEl.checked = false;
  _hzSetVal("hz-durum", "1");

  /* Hata temizle */
  ["hz-adi","hz-sure","hz-fiyat"].forEach(function (id) {
    _hzTemiz(id, id + "-err");
  });

  /* Duzenleme: alanlari doldur */
  if (hizmetId) {
    var h = _hizmetListesi.find(function (x) { return x.hizmet_id === hizmetId; });
    if (h) {
      _hzSetVal("hz-adi",      h.hizmet_adi  || "");
      _hzSetVal("hz-sure",     h.sure_dakika != null ? String(h.sure_dakika) : "");
      _hzSetVal("hz-fiyat",    h.fiyat       != null ? String(h.fiyat)       : "");
      _hzSetVal("hz-aciklama", h.aciklama    || "");
      _hzSetVal("hz-kategori", h.kategori    || "");
      _hzSetVal("hz-siralama", h.siralama    != null ? String(h.siralama)    : "");
      _hzSetVal("hz-durum",    h.durum       != null ? String(h.durum)       : "1");
      if (populerEl) populerEl.checked = !!h.populer_mi;
    }
  }

  var btnEl = document.getElementById("btn-hizmet-kaydet");
  if (btnEl) btnEl.textContent = hizmetId ? "Güncelle" : "Ekle";

  acModal("modal-hizmet-form");
}

/**
 * Form verilerini doğrular ve hizmeti kaydeder (ekle veya güncelle).
 * Çift-submit'i `_hizmetSubmitting` bayrağıyla engeller.
 */
async function hizmetKaydet() {
  if (_hizmetSubmitting) return;

  var adi      = _hzGetVal("hz-adi").trim();
  var sureSt   = _hzGetVal("hz-sure").trim();
  var fiyatSt  = _hzGetVal("hz-fiyat").trim();
  var aciklama = _hzGetVal("hz-aciklama").trim();
  var kategori = _hzGetVal("hz-kategori").trim();
  var siralama = _hzGetVal("hz-siralama").trim();
  var durum     = parseInt(_hzGetVal("hz-durum"), 10);
  var populerEl = document.getElementById("hz-populer");
  var populerMi = (populerEl && populerEl.checked) ? 1 : 0;

  var sure  = parseInt(sureSt,   10);
  var fiyat = parseFloat(fiyatSt);

  var hataMi = false;

  if (!gerekli(adi)) {
    _hzHata("hz-adi",  "hz-adi-err",  "Hizmet adı zorunludur.");
    hataMi = true;
  } else { _hzTemiz("hz-adi", "hz-adi-err"); }

  if (!sureSt || isNaN(sure) || sure <= 0) {
    _hzHata("hz-sure", "hz-sure-err", "Geçerli bir süre girin (dk).");
    hataMi = true;
  } else { _hzTemiz("hz-sure", "hz-sure-err"); }

  if (!fiyatSt || isNaN(fiyat) || fiyat < 0) {
    _hzHata("hz-fiyat","hz-fiyat-err","Geçerli bir fiyat girin.");
    hataMi = true;
  } else { _hzTemiz("hz-fiyat","hz-fiyat-err"); }

  if (hataMi) return;

  var btn  = document.getElementById("btn-hizmet-kaydet");
  var orig = btn ? btn.textContent : "";
  _hizmetSubmitting = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var body = {
    hizmet_adi:  adi,
    sure_dakika: sure,
    fiyat:       fiyat,
    populer_mi:  populerMi,
    durum:       durum
  };
  if (aciklama) body.aciklama = aciklama;
  if (kategori) body.kategori = kategori;
  if (siralama) body.siralama = parseInt(siralama, 10);

  var res;
  if (_hizmetDuzenleId) {
    body.hizmet_id = _hizmetDuzenleId;
    res = await apiPost("/api/yonetim/hizmet_guncelle.php", body);
  } else {
    res = await apiPost("/api/yonetim/hizmet_ekle.php", body);
  }

  _hizmetSubmitting = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = orig; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Kaydedilemedi.", "error"); return; }

  kapatModal("modal-hizmet-form");
  toast(_hizmetDuzenleId ? "Hizmet güncellendi." : "Hizmet eklendi.", "success");
  _hizmetListeYukle();
}

/* ================================================================
   POPULER TOGGLE — hizmet_guncelle.php ile (zorunlu alanlar dahil)
   ================================================================ */

/**
 * Hizmetin popüler rozetini açar veya kaldırır.
 * hizmet_guncelle.php tüm zorunlu alanları istediğinden mevcut değerler dahil gönderilir.
 * @param {number} hizmetId
 */
async function hizmetPopulerToggle(hizmetId) {
  var h = _hizmetListesi.find(function (x) { return x.hizmet_id === hizmetId; });
  if (!h) return;

  var body = {
    hizmet_id:   hizmetId,
    hizmet_adi:  h.hizmet_adi,
    sure_dakika: h.sure_dakika,
    fiyat:       h.fiyat,
    populer_mi:  h.populer_mi ? 0 : 1,
    durum:       h.durum
  };
  if (h.aciklama)        body.aciklama = h.aciklama;
  if (h.kategori)        body.kategori = h.kategori;
  if (h.siralama != null) body.siralama = h.siralama;

  var res = await apiPost("/api/yonetim/hizmet_guncelle.php", body);
  if (!res) return;
  if (!res.success) { toast(res.message || "Güncellenemedi.", "error"); return; }
  toast(h.populer_mi ? "Popüler rozeti kaldırıldı." : "Hizmet popüler yapıldı.", "success");
  _hizmetListeYukle();
}

/* ================================================================
   HİZMET KALICI SİL
   ================================================================ */

/**
 * Hizmeti kalıcı siler. Randevu geçmişinde kullanıldıysa backend reddeder.
 * @param {number} hizmetId
 * @param {string} hizmetAdi
 */
async function hizmetKaliciSil(hizmetId, hizmetAdi) {
  if (!confirm(
    '"' + hizmetAdi + '" hizmetini kalıcı olarak silmek istediğinizden emin misiniz?\n' +
    'Randevu geçmişinde kullanıldıysa silinemez — pasif yapmanız önerilir.'
  )) return;

  var res = await apiPost("/api/yonetim/hizmet_sil.php", { hizmet_id: hizmetId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Silinemedi.", "error"); return; }

  toast(hizmetAdi + " kalıcı olarak silindi.", "success");
  _hizmetListeYukle();
}

/* ================================================================
   DURUM TOGGLE
   ================================================================ */

/**
 * Hizmeti aktif veya pasif yapar. Silme işlemi yoktur; randevu bütünlüğü korunur.
 * @param {number} hizmetId
 * @param {0|1} yeniDurum - 1: aktif, 0: pasif
 */
async function hizmetDurumDegistir(hizmetId, yeniDurum) {
  var res = await apiPost("/api/yonetim/hizmet_durum_degistir.php", {
    hizmet_id: hizmetId,
    durum:     yeniDurum
  });
  if (!res) return;
  if (!res.success) { toast(res.message || "Durum değiştirilemedi.", "error"); return; }
  toast(yeniDurum === 1 ? "Hizmet aktif edildi." : "Hizmet pasif yapıldı.", "success");
  _hizmetListeYukle();
}

/* ================================================================
   MODAL HTML INJECT
   ================================================================ */
function _hizmetModalEkle() {
  if (document.getElementById("modal-hizmet-form")) return; /* cift-inject engeli */
  var el = document.createElement("div");
  el.className = "modal-overlay";
  el.id        = "modal-hizmet-form";
  el.setAttribute("role",            "dialog");
  el.setAttribute("aria-modal",      "true");
  el.setAttribute("aria-labelledby", "hizmet-modal-title");
  el.setAttribute("aria-hidden",     "true");
  el.innerHTML =
    '<div class="modal">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="hizmet-modal-title">Hizmet Ekle</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-hizmet-form\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body">' +

        '<div class="form-group">' +
          '<label class="form-label" for="hz-adi">Hizmet Adı' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="text" class="input" id="hz-adi"' +
            ' placeholder="Örn: Saç Kesimi" autocomplete="off">' +
          '<span class="form-error" id="hz-adi-err"></span>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="hz-sure">Süre (dk)' +
              ' <span class="required-mark" aria-hidden="true">*</span></label>' +
            '<input type="number" class="input" id="hz-sure"' +
              ' placeholder="30" min="1" step="1">' +
            '<span class="form-error" id="hz-sure-err"></span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="hz-fiyat">Fiyat (₺)' +
              ' <span class="required-mark" aria-hidden="true">*</span></label>' +
            '<input type="number" class="input" id="hz-fiyat"' +
              ' placeholder="150" min="0" step="0.01">' +
            '<span class="form-error" id="hz-fiyat-err"></span>' +
          '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="hz-aciklama">Açıklama</label>' +
          '<textarea class="input" id="hz-aciklama" rows="2"' +
            ' style="resize:vertical;" placeholder="Kısa hizmet açıklaması…"></textarea>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="hz-kategori">Kategori</label>' +
            '<input type="text" class="input" id="hz-kategori" placeholder="Örn: Saç">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="hz-siralama">Sıralama</label>' +
            '<input type="number" class="input" id="hz-siralama"' +
              ' placeholder="0" min="0" step="1">' +
          '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="hz-durum">Durum</label>' +
            '<select class="input" id="hz-durum">' +
              '<option value="1">Aktif</option>' +
              '<option value="0">Pasif</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:var(--space-1);">' +
            '<label style="display:flex;align-items:center;gap:var(--space-2);' +
              'font-size:var(--font-size-sm);cursor:pointer;">' +
              '<input type="checkbox" id="hz-populer"> Popüler olarak işaretle' +
            '</label>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-hizmet-form\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-hizmet-kaydet"' +
          ' onclick="hizmetKaydet()">Ekle</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _hzSetVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}
function _hzGetVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}
function _hzHata(inputId, errorId, msg) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}
function _hzTemiz(inputId, errorId) {
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

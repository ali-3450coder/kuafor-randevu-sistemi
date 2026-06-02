/* ===============================================================
   admin/payments.js — odeme listesi, filtreleme, guncelleme, iade
   GET  /api/yonetim/odemeler.php?durum=&date=
   POST /api/yonetim/odeme_guncelle.php   (admin + personel)
   POST /api/yonetim/odeme_iade.php       (admin + personel)
   A-05: Tekrar tanimlanan ODEME_* degiskenleri kaldirildi; config.js kullaniliyor.
   C-05: Guncelle ve Iade butonu admin ve personel'e gosterilir.
   D-07: Odendi odemeler icin admin'e Iade Et butonu eklendi.
   A-13: _escOd → global _esc() (ui.js)
   =============================================================== */

var _odemeListesi    = [];
var _odemeGuncelleId = null;
var _odemeSubmitting = false;

document.addEventListener("adminLayoutReady", function () {
  _odemeModalEkle();
  _odemeSayfaKur();
});

/* ================================================================
   MODAL HTML
   ================================================================ */
function _odemeModalEkle() {
  if (document.getElementById("modal-odeme-guncelle")) return;

  var el = document.createElement("div");
  el.innerHTML =
    '<div class="modal-overlay" id="modal-odeme-guncelle" role="dialog"' +
      ' aria-modal="true" aria-labelledby="modal-odeme-baslik" aria-hidden="true">' +
      '<div class="modal">' +
        '<div class="modal__header">' +
          '<h2 class="modal__title" id="modal-odeme-baslik">Ödeme Güncelle</h2>' +
          '<button class="modal__close" onclick="kapatModal(\'modal-odeme-guncelle\')"' +
            ' aria-label="Kapat">' + _ikon("x", 16) + "</button>" +
        "</div>" +
        '<div class="modal__body">' +

          '<div class="form-group">' +
            '<label class="form-label">Tutar (₺)</label>' +
            '<input type="text" class="input" id="od-tutar" disabled' +
              ' aria-label="Ödeme tutarı (değiştirilemez)">' +
          "</div>" +

          '<div class="form-group">' +
            '<label class="form-label" for="od-tip">Ödeme Tipi</label>' +
            '<select class="input" id="od-tip">' +
              '<option value="nakit">Nakit</option>' +
              '<option value="kart">Kart</option>' +
              '<option value="havale">Havale</option>' +
              '<option value="diger">Diğer</option>' +
            "</select>" +
          "</div>" +

          '<div class="form-group">' +
            '<label class="form-label" for="od-durum">Ödeme Durumu</label>' +
            '<select class="input" id="od-durum">' +
              '<option value="bekliyor">Bekliyor</option>' +
              '<option value="odendi">Ödendi</option>' +
              '<option value="iptal">İptal</option>' +
            "</select>" +
          "</div>" +

          '<div class="form-group">' +
            '<label class="form-label" for="od-aciklama">Açıklama</label>' +
            '<textarea class="input" id="od-aciklama" rows="3"' +
              ' placeholder="İsteğe bağlı açıklama…"></textarea>' +
          "</div>" +

        "</div>" +
        '<div class="modal__footer">' +
          '<button class="btn btn-ghost" onclick="kapatModal(\'modal-odeme-guncelle\')">Vazgeç</button>' +
          '<button class="btn btn-primary" id="btn-odeme-kaydet" onclick="odemeKaydet()">Kaydet</button>' +
        "</div>" +
      "</div>" +
    "</div>";

  document.body.appendChild(el.firstChild);
}

/* ================================================================
   SAYFA KURULUMU
   ================================================================ */
function _odemeSayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Ödemeler</h1>' +
        '<p class="page-header__subtitle">Onaylanmış ve tamamlanmış randevuların ödemelerini yönetin.</p>' +
      "</div>" +
    "</div>" +

    '<div class="filter-bar">' +
      '<div class="form-group">' +
        '<label class="form-label" for="f-od-durum">Durum</label>' +
        '<select class="input" id="f-od-durum">' +
          '<option value="">Tümü</option>' +
          '<option value="bekliyor">Bekliyor</option>' +
          '<option value="odendi">Ödendi</option>' +
          '<option value="iptal">İptal</option>' +
          '<option value="iade">İade</option>' +
        "</select>" +
      "</div>" +
      '<div class="form-group">' +
        '<label class="form-label" for="f-od-tarih">Ödeme Tarihi</label>' +
        '<input type="date" class="input" id="f-od-tarih">' +
      "</div>" +
      '<div class="form-group">' +
        '<label class="form-label" for="f-od-randevu-tarih">Randevu Tarihi</label>' +
        '<input type="date" class="input" id="f-od-randevu-tarih">' +
      "</div>" +
      '<div class="form-group" style="align-self:flex-end;">' +
        '<button class="btn btn-ghost" id="btn-od-sifirla">Sıfırla</button>' +
      "</div>" +
    "</div>" +

    '<div class="card" style="padding:0;overflow:hidden;" id="odeme-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Ödemeler yükleniyor…</span>' +
      "</div>" +
    "</div>";

  var elDurum       = document.getElementById("f-od-durum");
  var elTarih       = document.getElementById("f-od-tarih");
  var elRandevuTarih= document.getElementById("f-od-randevu-tarih");
  var elSifirla     = document.getElementById("btn-od-sifirla");

  function yukle() {
    _odemelerYukle(
      elDurum        ? elDurum.value        : "",
      elTarih        ? elTarih.value        : "",
      elRandevuTarih ? elRandevuTarih.value : ""
    );
  }

  if (elDurum)        elDurum.addEventListener("change", yukle);
  if (elTarih)        elTarih.addEventListener("change", yukle);
  if (elRandevuTarih) elRandevuTarih.addEventListener("change", yukle);
  if (elSifirla) {
    elSifirla.addEventListener("click", function () {
      if (elDurum)        elDurum.value = "";
      if (elTarih)        elTarih.value = "";
      if (elRandevuTarih) elRandevuTarih.value = "";
      yukle();
    });
  }

  yukle();
}

/* ================================================================
   VERI YUKLE
   ================================================================ */
async function _odemelerYukle(durum, tarih, randevuTarih) {
  var container = document.getElementById("odeme-tablo");
  if (!container) return;

  container.innerHTML =
    '<div class="loading-row" style="padding:var(--space-6);">' +
      '<span class="spinner"></span><span>Ödemeler yükleniyor…</span>' +
    "</div>";

  var params = [];
  if (durum)        params.push("durum="           + encodeURIComponent(durum));
  if (tarih)        params.push("date="            + encodeURIComponent(tarih));
  if (randevuTarih) params.push("randevu_tarihi="  + encodeURIComponent(randevuTarih));
  var qs = params.length ? "?" + params.join("&") : "";

  var res = await apiGet("/api/yonetim/odemeler.php" + qs);

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' +
        _ikon("alert", 16) + " Ödemeler yüklenemedi." +
      "</p>";
    return;
  }

  _odemeListesi = res.data || [];
  _odemeTabloRender(container, _odemeListesi);
}

/* ================================================================
   TABLO RENDER
   ================================================================ */
function _odemeTabloRender(container, liste) {
  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon("credit-card", 40) + "</span>" +
        '<p class="empty-state__title">Ödeme bulunamadı.</p>' +
        '<p class="empty-state__desc">Filtreyi değiştirmeyi deneyin.</p>' +
      "</div>";
    return;
  }

  /* C-05 / D-07: Butonlar admin ve personel'e gosterilir */
  var isAdmin = window._adminUser &&
    (window._adminUser.rol === "admin" || window._adminUser.rol === "personel");

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      "<th>Randevu Kodu</th>" +
      "<th>Müşteri</th>" +
      '<th style="text-align:right;">Tutar</th>' +
      "<th>Ödeme Tipi</th>" +
      "<th>Durum</th>" +
      "<th>Tarih</th>" +
      (isAdmin ? '<th style="text-align:center;">İşlem</th>' : "") +
    "</tr></thead><tbody>";

  liste.forEach(function (o) {
    var tipEtiket = ODEME_TIPI_ETIKET[o.odeme_tipi]   || o.odeme_tipi   || "-";
    var durSinif  = "badge--" + (ODEME_DURUM_BADGE[o.odeme_durumu] || "muted");
    var tarihGos  = o.odeme_tarihi ? formatTarih(o.odeme_tarihi) : "-";

    var islemHtml = "";
    if (isAdmin) {
      islemHtml = '<td style="text-align:center;white-space:nowrap;">';
      /* Guncelle: iade edilmis veya iptal edilmis odemeler guncellenmez */
      if (o.odeme_durumu !== "iade") {
        islemHtml +=
          '<button class="btn btn-ghost btn-sm"' +
            ' onclick="odemeGuncelleAc(' + Number(o.odeme_id) + ')">Güncelle</button>';
      }
      /* D-07: Sadece odendi ise Iade Et butonu gosterilir */
      if (o.odeme_durumu === "odendi") {
        islemHtml +=
          ' <button class="btn btn-sm" type="button"' +
            ' style="background:var(--color-muted-bg);color:var(--color-muted);border:1px solid var(--color-muted);"' +
            ' onclick="iadeEt(' + Number(o.odeme_id) + ')">İade Et</button>';
      }
      islemHtml += "</td>";
    }

    html +=
      "<tr>" +
        '<td><span class="font-mono" style="font-size:var(--font-size-xs);color:var(--color-gold);">' +
          _esc(o.randevu_kodu || "-") +
        "</span></td>" +
        '<td style="font-weight:500;">' + _esc(o.musteri_ad_soyad || "-") + "</td>" +
        '<td style="text-align:right;font-weight:600;font-family:var(--font-mono);">' +
          formatTL(o.tutar || 0) +
        "</td>" +
        "<td>" +
          '<span class="badge badge--muted">' + _esc(tipEtiket) + "</span>" +
        "</td>" +
        "<td>" +
          durumRozeti(o.odeme_durumu, "odeme") +
        "</td>" +
        '<td style="font-size:var(--font-size-sm);">' + tarihGos + "</td>" +
        islemHtml +
      "</tr>";
  });

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

/* ================================================================
   GUNCELLEME MODALI AC
   ================================================================ */
function odemeGuncelleAc(odemeId) {
  var odeme = null;
  for (var i = 0; i < _odemeListesi.length; i++) {
    if (Number(_odemeListesi[i].odeme_id) === odemeId) {
      odeme = _odemeListesi[i];
      break;
    }
  }
  if (!odeme) { toast("Ödeme bulunamadı.", "error"); return; }

  _odemeGuncelleId = odemeId;
  _odemeSubmitting = false;

  var elTutar    = document.getElementById("od-tutar");
  var elTip      = document.getElementById("od-tip");
  var elDurum    = document.getElementById("od-durum");
  var elAciklama = document.getElementById("od-aciklama");

  if (elTutar)    elTutar.value    = formatTL(odeme.tutar || 0);
  if (elTip)      elTip.value      = odeme.odeme_tipi   || "nakit";
  if (elDurum)    elDurum.value    = odeme.odeme_durumu || "bekliyor";
  if (elAciklama) elAciklama.value = odeme.aciklama     || "";

  var btn = document.getElementById("btn-odeme-kaydet");
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }

  acModal("modal-odeme-guncelle");
}

/* ================================================================
   KAYDET
   ================================================================ */
async function odemeKaydet() {
  if (_odemeSubmitting) return;

  var elTip      = document.getElementById("od-tip");
  var elDurum    = document.getElementById("od-durum");
  var elAciklama = document.getElementById("od-aciklama");
  var btn        = document.getElementById("btn-odeme-kaydet");

  var tip      = elTip      ? elTip.value.trim()     : "";
  var durum    = elDurum    ? elDurum.value.trim()    : "";
  var aciklama = elAciklama ? elAciklama.value.trim() : "";

  if (!tip || !durum) {
    toast("Ödeme tipi ve durum zorunludur.", "warning");
    return;
  }

  _odemeSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var payload = { odeme_id: _odemeGuncelleId, odeme_tipi: tip, odeme_durumu: durum };
  if (aciklama) payload.aciklama = aciklama;

  var res = await apiPost("/api/yonetim/odeme_guncelle.php", payload);

  _odemeSubmitting = false;
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }

  if (!res || !res.success) {
    toast((res && res.message) ? res.message : "Ödeme güncellenemedi.", "error");
    return;
  }

  toast("Ödeme güncellendi.", "success");
  kapatModal("modal-odeme-guncelle");

  var elFDurum  = document.getElementById("f-od-durum");
  var elFTarih  = document.getElementById("f-od-tarih");
  var elFRTarih = document.getElementById("f-od-randevu-tarih");
  _odemelerYukle(
    elFDurum  ? elFDurum.value  : "",
    elFTarih  ? elFTarih.value  : "",
    elFRTarih ? elFRTarih.value : ""
  );
}

/* ================================================================
   D-07: IADE ET
   ================================================================ */

/**
 * Odendi durumundaki odemeyi iade olarak isaretler. Admin only.
 * @param {number} odemeId
 */
async function iadeEt(odemeId) {
  if (!confirm("Bu ödemeyi iade olarak işaretlemek istediğinizden emin misiniz?")) return;

  var res = await apiPost("/api/yonetim/odeme_iade.php", { odeme_id: odemeId });

  if (!res || !res.success) {
    toast((res && res.message) || "İade işlemi başarısız.", "error");
    return;
  }

  toast("Ödeme iade olarak işaretlendi.", "success");

  var elFDurum  = document.getElementById("f-od-durum");
  var elFTarih  = document.getElementById("f-od-tarih");
  var elFRTarih = document.getElementById("f-od-randevu-tarih");
  _odemelerYukle(
    elFDurum  ? elFDurum.value  : "",
    elFTarih  ? elFTarih.value  : "",
    elFRTarih ? elFRTarih.value : ""
  );
}

/* _esc() ui.js'de global olarak tanimlidir — A-13 */

/* ===============================================================
   randevularim.js — Musteri kendi randevularini goruntular + iptal eder
   GET  /api/musteri/oturum.php
   GET  /api/musteri/randevularim.php
   POST /api/musteri/randevu_iptal.php
   =============================================================== */

var _tumListe   = [];   /* tüm randevular cache */
var _aktifFiltre = "tumu";

document.addEventListener("DOMContentLoaded", async function () {
  var oturumRes = await apiGet("/api/musteri/oturum.php");
  if (!oturumRes || !oturumRes.success) {
    window.location.href = "musteri-giris.html?sonra=" + encodeURIComponent("randevularim.html");
    return;
  }

  var hesap = oturumRes.data.hesap || {};

  var adEl = document.getElementById("nav-kullanici-ad");
  if (adEl) adEl.textContent = hesap.ad_soyad || "";

  var btnCikis = document.getElementById("btn-cikis");
  if (btnCikis) {
    btnCikis.addEventListener("click", async function () {
      await apiPost("/api/musteri/cikis.php", {});
      window.location.href = "index.html";
    });
  }

  _yukle();
});

async function _yukle() {
  var container = document.getElementById("randevu-listesi");
  if (!container) return;

  var res = await apiGet("/api/musteri/randevularim.php");

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="color:var(--color-danger);padding:var(--space-4);">Randevular yüklenemedi. Lütfen sayfayı yenileyin.</p>';
    return;
  }

  _tumListe = res.data || [];
  var liste = _filtrele(_tumListe, _aktifFiltre);

  if (_tumListe.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10) 0;">' +
        '<span class="empty-state__icon">' + _ikon("calendar", 40) + "</span>" +
        '<p class="empty-state__title">Henüz randevunuz yok.</p>' +
        '<p class="empty-state__desc">Yeni randevu almak için aşağıdaki butona tıklayın.</p>' +
        '<a href="randevu-al.html" class="btn btn-primary" style="margin-top:var(--space-5);">Randevu Al</a>' +
      "</div>";
    return;
  }

  _renderListe(container, liste);
}

function _renderListe(container, liste) {
  if (liste.length === 0 && _tumListe.length > 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-8) 0;">' +
        '<span class="empty-state__icon">' + _ikon("calendar", 32) + "</span>" +
        '<p class="empty-state__title">Bu filtrede randevu yok.</p>' +
      "</div>";
    return;
  }

  var html = "";

  liste.forEach(function (r) {
    var iptalVeyaGelmedi = r.durum === "iptal" || r.durum === "gelmedi";
    var karti = "";

    karti +=
      '<div class="randevu-karti' + (iptalVeyaGelmedi ? " randevu-karti--iptal" : "") + '">' +
        '<div class="randevu-karti__header">' +
          durumRozeti(r.durum) +
          /* B-07: randevu_kodu musteriye gosterilmiyor (admin icin yeterli) */
          (r.durum === "beklemede"
            ? '<button class="btn btn-sm btn-danger" type="button"' +
                ' onclick="randevuIptalEt(' + r.randevu_id + ')"' +
                ' style="margin-left:auto;">Randevumu İptal Et</button>'
            : "") +
        "</div>" +
        '<div class="randevu-karti__body">' +
          _alan("Tarih", formatTarih(r.randevu_tarihi)) +
          _alan("Saat",
            '<span class="font-mono">' +
              _esc(r.baslangic_saati ? r.baslangic_saati.slice(0,5) : "-") + " – " +
              _esc(r.bitis_saati ? r.bitis_saati.slice(0,5) : "-") +
            "</span>") +
          _alan("Personel",
            _esc(r.personel_ad) +
            (r.personel_unvan
              ? ' <small style="color:var(--color-gold);">' + _esc(r.personel_unvan) + "</small>"
              : "")) +
          _alan("Ödeme",
            durumRozeti(r.odeme_durumu, "odeme") +
            ' <span class="font-mono" style="font-size:var(--font-size-xs);margin-left:4px;">' +
              formatTL(r.toplam_tutar || 0) +
            "</span>") +
        "</div>";

    /* Hizmetler */
    if (r.hizmetler && r.hizmetler.length > 0) {
      karti +=
        '<div class="randevu-karti__hizmetler">' +
          '<div class="randevu-karti__hizmetler-baslik">Hizmetler</div>';
      r.hizmetler.forEach(function (h) {
        karti +=
          '<div class="randevu-karti__hizmet-item">' +
            '<span>' + _esc(h.hizmet_adi) + ' <small style="color:var(--color-text-3);">(' + h.sure_dakika + ' dk)</small></span>' +
            '<span class="font-mono">' + formatTL(h.fiyat) + "</span>" +
          "</div>";
      });
      karti += "</div>";
    }

    /* Notlar */
    if (r.notlar) {
      karti +=
        '<div class="randevu-karti__hizmetler">' +
          '<div class="randevu-karti__hizmetler-baslik">Not</div>' +
          '<div style="font-size:var(--font-size-xs);color:var(--color-text-2);">' + _esc(r.notlar) + "</div>" +
        "</div>";
    }

    /* Iptal nedeni */
    if (r.iptal_nedeni) {
      karti +=
        '<div class="randevu-karti__iptal-neden">İptal Nedeni: ' + _esc(r.iptal_nedeni) + "</div>";
    }

    karti += "</div>";
    html += karti;
  });

  html +=
    '<div style="text-align:center;margin-top:var(--space-6);">' +
      '<a href="randevu-al.html" class="btn btn-primary">+ Yeni Randevu Al</a>' +
    "</div>";

  container.innerHTML = html;
}

/* ================================================================
   FİLTRE — B-04
   ================================================================ */

var _AKTIF_DURUMLAR  = ["beklemede", "onaylandi"];
var _GECMIS_DURUMLAR = ["tamamlandi", "iptal", "gelmedi"];

function filtreUygula(filtre) {
  _aktifFiltre = filtre;

  /* Buton stillerini güncelle */
  ["tumu", "aktif", "gecmis"].forEach(function (k) {
    var btn = document.getElementById("f-" + k);
    if (!btn) return;
    btn.className = (k === filtre)
      ? "btn btn-primary btn-sm"
      : "btn btn-ghost btn-sm";
  });

  var liste = _filtrele(_tumListe, filtre);
  var container = document.getElementById("randevu-listesi");
  if (container) _renderListe(container, liste);
}

function _filtrele(liste, filtre) {
  if (filtre === "aktif")  return liste.filter(function (r) { return _AKTIF_DURUMLAR.indexOf(r.durum)  !== -1; });
  if (filtre === "gecmis") return liste.filter(function (r) { return _GECMIS_DURUMLAR.indexOf(r.durum) !== -1; });
  return liste;
}

/* ================================================================
   İPTAL — sadece beklemede randevu
   ================================================================ */
async function randevuIptalEt(randevuId) {
  if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?\nBu işlem geri alınamaz.")) return;

  var res = await apiPost("/api/musteri/randevu_iptal.php", { randevu_id: randevuId });
  if (!res) return;
  if (!res.success) {
    toast(res.message || "İptal işlemi başarısız.", "error");
    return;
  }

  toast("Randevunuz iptal edildi.", "success");
  /* Listeyi yenile, aktif filtreyi koru */
  await _yukle();
  filtreUygula(_aktifFiltre);
}

function _alan(label, deger) {
  return (
    '<div>' +
      '<div class="randevu-karti__alan-label">' + label + "</div>" +
      '<div class="randevu-karti__alan-deger">' + deger + "</div>" +
    "</div>"
  );
}

/* _esc() ui.js'de global — A-13 + C-01 */

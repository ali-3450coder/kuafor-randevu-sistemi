/* ===============================================================
   admin/dashboard.js — 10 metrik karti + bugunun randevulari
   GET /api/yonetim/yonetim_ozeti.php
   GET /api/yonetim/randevular.php?date=YYYY-MM-DD
   =============================================================== */

/* B-06: Aktif zaman periyodu */
var _aktifPeriod = "tumu";

/* 10 metrik — backend yonetim_ozeti.php ile birebir eslesir */
var _METRIK_KONFIG = [
  { key: "toplam_randevular",    label: "Toplam Randevular",  icon: "calendar",     variant: ""          },
  { key: "bekleyen_randevular",  label: "Bekleyen",           icon: "clock",        variant: "--warning"  },
  { key: "onaylanan_randevular", label: "Onaylanan",          icon: "check-circle", variant: ""           },
  { key: "tamamlanan_randevular",label: "Tamamlanan",         icon: "check-square", variant: "--success"  },
  { key: "iptal_randevular",     label: "İptal",              icon: "x-circle",     variant: "--danger"   },
  { key: "toplam_musteri",       label: "Toplam Müşteri",     icon: "users",        variant: ""           },
  { key: "aktif_personel",       label: "Aktif Personel",     icon: "user-check",   variant: "--success"  },
  { key: "aktif_hizmet",         label: "Aktif Hizmet",       icon: "scissors",     variant: ""           },
  { key: "bekleyen_odeme",       label: "Bekleyen Ödeme",     icon: "wallet",       variant: "--warning"  },
  { key: "toplam_gelir",         label: "Toplam Gelir",       icon: "trending-up",  variant: "--gold"     },
];

/* layout.js oturum dogrulamasini tamamlayip bu eventi firlatir */
document.addEventListener("adminLayoutReady", function () {
  _dashboardYukle();
});

/* ================================================================
   ANA YUKLEME
   ================================================================ */
function _dashboardYukle() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  /* Sayfa iskelet — metrik + randevu bolumlerini hemen olustur */
  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Dashboard</h1>' +
      '</div>' +
      '<div class="page-header__actions">' +
        '<div style="display:flex;gap:var(--space-1);">' +
          '<button class="btn btn-primary btn-sm"  id="pd-tumu"     onclick="periodDegistir(\'tumu\')">Tüm Zamanlar</button>' +
          '<button class="btn btn-ghost btn-sm"    id="pd-bu_ay"    onclick="periodDegistir(\'bu_ay\')">Bu Ay</button>' +
          '<button class="btn btn-ghost btn-sm"    id="pd-bu_hafta" onclick="periodDegistir(\'bu_hafta\')">Bu Hafta</button>' +
          '<button class="btn btn-ghost btn-sm"    id="pd-bugun"    onclick="periodDegistir(\'bugun\')">Bugün</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div id="metrics-section">' +
      '<div class="metrics-grid">' + _metrikSkeleton() + '</div>' +
    '</div>' +

    '<div id="randevular-section"></div>';

  /* Paralel yukle */
  _ozetYukle();
  _bugunRandevulariYukle();
}

/* ================================================================
   OZET METRIKLER
   ================================================================ */
/* B-06: Period buton güncellemesi */
function periodDegistir(period) {
  _aktifPeriod = period;
  ["tumu", "bu_ay", "bu_hafta", "bugun"].forEach(function (k) {
    var btn = document.getElementById("pd-" + k);
    if (!btn) return;
    btn.className = (k === period) ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm";
  });
  _ozetYukle();
}

async function _ozetYukle() {
  var section = document.getElementById("metrics-section");
  if (!section) return;

  var qs  = (_aktifPeriod !== "tumu") ? "?period=" + _aktifPeriod : "";
  var res = await apiGet("/api/yonetim/yonetim_ozeti.php" + qs);

  if (!res || !res.success) {
    section.innerHTML =
      '<div class="card" style="padding:var(--space-5);">' +
        '<p style="color:var(--color-danger);">' + _ikon('alert',16) + ' Metrikler yüklenemedi. Sayfayı yenileyin.</p>' +
      '</div>';
    return;
  }

  /* Backend: data.metrikler; yoksa data'nin kendisini kullan */
  var m = (res.data && res.data.metrikler) ? res.data.metrikler : (res.data || {});

  var html = '<div class="metrics-grid">';

  _METRIK_KONFIG.forEach(function (konfig) {
    var deger   = m[konfig.key];
    var gosterim;

    if (deger == null) {
      gosterim = "—";
    } else if (konfig.key === "toplam_gelir") {
      gosterim = formatTL(deger);
    } else {
      gosterim = String(deger);
    }

    /* variant: "--warning" → "warning" for card class */
    var variantSlug = konfig.variant ? konfig.variant.replace("--", "") : "";
    var cardClass   = "metric-card" + (variantSlug ? " metric-card--" + variantSlug : "");
    var valueClass  = "metric-card__value" + (konfig.variant ? " metric-card__value" + konfig.variant : "");

    html +=
      '<div class="' + cardClass + '">' +
        '<div class="metric-card__top">' +
          '<span class="metric-card__label">' + konfig.label + '</span>' +
          '<span class="metric-card__icon">' + _ikon(konfig.icon, 20) + '</span>' +
        '</div>' +
        '<div class="' + valueClass + '">' + gosterim + '</div>' +
      '</div>';
  });

  html += '</div>';
  section.innerHTML = html;
}

/* ================================================================
   BUGUNUN RANDEVULARI (ilk 5)
   ================================================================ */
async function _bugunRandevulariYukle() {
  var section = document.getElementById("randevular-section");
  if (!section) return;

  /* YYYY-MM-DD — yerel saat diliminde bugunun tarihi */
  var _bd = new Date();
  var bugun = _bd.getFullYear() + '-' +
    String(_bd.getMonth() + 1).padStart(2, '0') + '-' +
    String(_bd.getDate()).padStart(2, '0');

  /* Bolum basligini hemen goster */
  section.innerHTML =
    '<div class="page-header" style="margin-top:var(--space-8);margin-bottom:var(--space-4);">' +
      '<div class="page-header__left">' +
        '<h2 style="font-family:var(--font-heading);font-size:var(--font-size-xl);' +
          'font-weight:var(--font-weight-bold);color:var(--color-text);">Bugünkü Randevular</h2>' +
        '<p class="page-header__subtitle">' + _tarihUzun(bugun) + '</p>' +
      '</div>' +
      '<div class="page-header__actions">' +
        '<a href="randevular.html" class="btn btn-ghost btn-sm">Tümünü Gör →</a>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;">' +
      '<div id="bugun-tablo-icerik">' +
        '<div class="loading-row" style="padding:var(--space-6);">' +
          '<span class="spinner"></span><span>Randevular yükleniyor…</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  var res = await apiGet("/api/yonetim/randevular.php?date=" + bugun);

  var container = document.getElementById("bugun-tablo-icerik");
  if (!container) return;

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-5);color:var(--color-danger);">' + _ikon('alert',16) + ' Randevular yüklenemedi.</p>';
    return;
  }

  var liste = res.data || [];

  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon('calendar', 40) + '</span>' +
        '<p class="empty-state__title">Bugün randevu yok.</p>' +
        '<p class="empty-state__desc">Henüz bugüne ait randevu oluşturulmamış.</p>' +
      '</div>';
    return;
  }

  /* Ilk 5 kayit */
  var ilk5 = liste.slice(0, 5);

  var html =
    '<div class="table-wrapper">' +
    '<table class="table">' +
      '<thead><tr>' +
        '<th>Kod</th>' +
        '<th>Müşteri</th>' +
        '<th>Personel</th>' +
        '<th>Saat</th>' +
        '<th>Durum</th>' +
      '</tr></thead>' +
      '<tbody>';

  ilk5.forEach(function (r) {
    var saat =
      _esc(r.baslangic_saati ? r.baslangic_saati.slice(0, 5) : "-") +
      " – " +
      _esc(r.bitis_saati     ? r.bitis_saati.slice(0, 5)     : "-");

    html +=
      '<tr>' +
        '<td><span class="font-mono" style="font-size:var(--font-size-xs);color:var(--color-gold);">' +
          _esc(r.randevu_kodu) +
        '</span></td>' +
        '<td>' + _esc(r.musteri_ad_soyad)  + '</td>' +
        '<td>' + _esc(r.personel_ad_soyad) + '</td>' +
        '<td class="font-mono" style="font-size:var(--font-size-xs);">' + saat + '</td>' +
        '<td>' + durumRozeti(r.durum) + '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';

  /* "Daha fazla" notu */
  if (liste.length > 5) {
    html +=
      '<div style="padding:var(--space-4);text-align:center;' +
        'border-top:1px solid var(--color-border);' +
        'font-size:var(--font-size-sm);color:var(--color-text-3);">' +
        '+' + (liste.length - 5) + ' daha —' +
        ' <a href="randevular.html?date=' + bugun + '">Tümünü gör</a>' +
      '</div>';
  }

  container.innerHTML = html;
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _metrikSkeleton() {
  var html = "";
  for (var i = 0; i < 10; i++) {
    html += '<div class="skeleton" style="height:90px;border-radius:var(--radius-lg);"></div>';
  }
  return html;
}

function _tarihUzun(tarih) {
  var p = tarih.split("-");
  if (p.length !== 3) return tarih;
  var d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  return d.toLocaleDateString("tr-TR", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric"
  });
}

/* _esc() ui.js'de global olarak tanimlidir — A-13 */

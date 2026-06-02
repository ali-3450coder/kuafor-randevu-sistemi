/* ===============================================================
   main.js — index.html
   - Hizmetler: GET /api/genel/hizmetler.php + kategori sekmeleri
   - Personeller: GET /api/genel/personeller.php + kart listesi
   - Loading / empty / error state her liste icin
   =============================================================== */

var _hizmetListesi  = [];
var _aktifKategori  = "tumu";

document.addEventListener("DOMContentLoaded", function () {
  _hizmetleriYukle();
  _personelleriYukle();
  _navMobileKur();
});

/* ================================================================
   HIZMETLER
   ================================================================ */
async function _hizmetleriYukle() {
  var container    = document.getElementById("hizmetler-container");
  var tabContainer = document.getElementById("hizmet-tablar");
  if (!container) return;

  /* Loading */
  container.setAttribute("aria-busy", "true");
  container.innerHTML = _yuklemeHtmlGrid(6);

  var res = await apiGet("/api/genel/hizmetler.php");

  container.setAttribute("aria-busy", "false");

  if (!res || !res.success) {
    bosDurum(container, "Hizmetler yüklenemedi. Lütfen sayfayı yenileyin.", _ikon('alert', 40));
    return;
  }

  _hizmetListesi = res.data || [];

  if (_hizmetListesi.length === 0) {
    bosDurum(container, "Henüz hizmet eklenmemiş.", _ikon('scissors', 40));
    return;
  }

  /* Kategori sekmeleri */
  if (tabContainer) {
    var kategoriler = _benzersizKategoriler(_hizmetListesi);
    _kategorileriRender(tabContainer, kategoriler);
  }

  _hizmetleriRender(container, _hizmetListesi, _aktifKategori);
}

function _benzersizKategoriler(liste) {
  var gorulen = Object.create(null);
  var result  = [];
  liste.forEach(function (h) {
    if (h.kategori && !gorulen[h.kategori]) {
      gorulen[h.kategori] = true;
      result.push(h.kategori);
    }
  });
  return result;
}

function _kategorileriRender(tabContainer, kategoriler) {
  var html = '<button class="tab-btn is-active" data-kategori="tumu" role="tab" aria-selected="true">Tümü</button>';
  kategoriler.forEach(function (k) {
    html += '<button class="tab-btn" data-kategori="' + _esc(k) + '" role="tab" aria-selected="false">' + _esc(k) + '</button>';
  });
  tabContainer.innerHTML = html;

  tabContainer.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabContainer.querySelectorAll(".tab-btn").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      _aktifKategori = btn.getAttribute("data-kategori");
      var c = document.getElementById("hizmetler-container");
      if (c) _hizmetleriRender(c, _hizmetListesi, _aktifKategori);
    });
  });
}

function _hizmetleriRender(container, liste, kategori) {
  var filtered = (kategori === "tumu")
    ? liste.slice()
    : liste.filter(function (h) { return h.kategori === kategori; });

  /* Populer once, sonra siralama */
  filtered.sort(function (a, b) {
    var pa = a.populer_mi ? 1 : 0;
    var pb = b.populer_mi ? 1 : 0;
    if (pb !== pa) return pb - pa;
    return (parseInt(a.siralama, 10) || 999) - (parseInt(b.siralama, 10) || 999);
  });

  if (filtered.length === 0) {
    bosDurum(container, "Bu kategoride hizmet bulunamadı.", _ikon('scissors', 40));
    return;
  }

  var html = '<div class="hizmet-grid">';
  filtered.forEach(function (h, i) {
    html += _hizmetKartiHtml(h, i);
  });
  html += '</div>';
  container.innerHTML = html;
  _kartFadeIn(container);
}

var _KATEGORI_ICON = {
  "Erkek":          "scissors",
  "Kadın":          "droplet",
  "Renklendirme":   "palette",
  "Bakım":          "leaf",
  "Şekillendirme":  "wind"
};

function _hizmetKartiHtml(h, index) {
  var ikonAdi   = _KATEGORI_ICON[h.kategori] || "scissors";
  var ikon      = _ikon(ikonAdi, 24);
  var popBadge  = h.populer_mi ? '<span class="badge-populer">' + _ikon('sparkles', 12) + ' Popüler</span>' : '';
  var animDelay = (index || 0) * 60;
  return (
    '<div class="card card--hover hizmet-karti" style="animation-delay:' + animDelay + 'ms">' +
      popBadge +
      '<div class="hizmet-karti__icon" aria-hidden="true">' + ikon + '</div>' +
      '<h3 class="hizmet-karti__baslik">' + _esc(h.hizmet_adi) + '</h3>' +
      (h.aciklama
        ? '<p class="hizmet-karti__aciklama">' + _esc(h.aciklama) + '</p>'
        : '<p class="hizmet-karti__aciklama" style="opacity:0.4;">—</p>') +
      '<div class="hizmet-karti__meta">' +
        '<span class="hizmet-karti__sure">' + _ikon('clock', 13) + ' ' + _esc(String(h.sure_dakika)) + ' dk</span>' +
        '<span class="hizmet-karti__fiyat">' + formatTL(h.fiyat) + '</span>' +
      '</div>' +
    '</div>'
  );
}

/* ================================================================
   PERSONELLER
   ================================================================ */
async function _personelleriYukle() {
  var container = document.getElementById("personeller-container");
  if (!container) return;

  container.setAttribute("aria-busy", "true");
  container.innerHTML = _yuklemeHtmlGrid(4);

  var res = await apiGet("/api/genel/personeller.php");

  container.setAttribute("aria-busy", "false");

  if (!res || !res.success) {
    bosDurum(container, "Personel listesi yüklenemedi.", _ikon('alert', 40));
    return;
  }

  var liste = res.data || [];

  if (liste.length === 0) {
    bosDurum(container, "Henüz personel eklenmemiş.", _ikon('user', 40));
    return;
  }

  var html = '<div class="personel-grid">';
  liste.forEach(function (p, i) {
    html += _personelKartiHtml(p, i);
  });
  html += '</div>';
  container.innerHTML = html;
  _kartFadeIn(container);
}

function _personelKartiHtml(p, index) {
  var initials = (p.ad_soyad || "?")
    .split(" ")
    .map(function (w) { return w[0] || ""; })
    .join("")
    .slice(0, 2)
    .toUpperCase();

  var animDelay = (index || 0) * 80;

  return (
    '<div class="card card--hover personel-karti" style="animation-delay:' + animDelay + 'ms">' +
      '<div class="personel-karti__avatar-wrap">' +
        '<div class="personel-karti__ring" aria-hidden="true"></div>' +
        '<div class="avatar">' +
          '<span>' + _esc(initials) + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="personel-karti__ad">' + _esc(p.ad_soyad) + '</p>' +
      (p.unvan ? '<p class="personel-karti__unvan">' + _esc(p.unvan) + '</p>' : '') +
      (p.bio   ? '<p class="personel-karti__bio">' + _esc(p.bio) + '</p>' : '') +
      '<div class="personel-karti__deco" aria-hidden="true">' + _ikon('scissors', 28) + '</div>' +
    '</div>'
  );
}

/* ================================================================
   MOBILE NAV
   ================================================================ */
function _navMobileKur() {
  var toggle = document.getElementById("nav-toggle");
  var menu   = document.getElementById("nav-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.innerHTML = open ? _ikon('x', 20) : _ikon('menu', 20);
  });

  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = _ikon('menu', 20);
    });
  });
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _yuklemeHtmlGrid(count) {
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(272px,1fr));gap:var(--space-4);">';
  for (var i = 0; i < count; i++) {
    html += '<div class="skeleton skeleton--card"></div>';
  }
  return html + '</div>';
}

function _kartFadeIn(container) {
  var kartlar = container.querySelectorAll(".card");
  kartlar.forEach(function (k) {
    k.classList.add("kart-giris");
  });
}

function _esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

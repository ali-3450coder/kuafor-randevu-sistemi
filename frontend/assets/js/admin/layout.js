/* ===============================================================
   admin/layout.js — sidebar + topbar render + aktif menu + mobil drawer
   =============================================================== */

var _NAV_ITEMS_ADMIN = [
  { href: "panel.html",              icon: "panel",       label: "Dashboard"         },
  { href: "randevular.html",         icon: "calendar",    label: "Randevular"        },
  { href: "musteriler.html",         icon: "users",       label: "Müşteriler"        },
  { href: "musteri-hesaplari.html",  icon: "user-check",  label: "Müşteri Hesapları" },
  { href: "personeller.html",        icon: "user",        label: "Personeller"       },
  { href: "hizmetler.html",          icon: "scissors",    label: "Hizmetler"         },
  { href: "odemeler.html",           icon: "credit-card", label: "Ödemeler"          },
  { href: "yetkililer.html",         icon: "shield-check",label: "Yetkililer"        },
  { href: "raporlar.html",           icon: "trending-up", label: "Raporlar"          },
];

var _NAV_ITEMS_PERSONEL = [
  { href: "panel.html",       icon: "panel",       label: "Dashboard"   },
  { href: "randevular.html",  icon: "calendar",    label: "Randevular"  },
  { href: "musteriler.html",  icon: "users",       label: "Müşteriler"  },
  { href: "odemeler.html",    icon: "credit-card", label: "Ödemeler"    },
];

/* Admin yetkisi gerektiren sayfalar — personel giris yapinca panel.html'e yonlendirilir */
var _ADMIN_ONLY_PAGES = ["personeller.html", "hizmetler.html", "yetkililer.html", "musteri-hesaplari.html", "raporlar.html"];

document.addEventListener("DOMContentLoaded", async function () {
  var adminLayoutEl = document.getElementById("adminLayout");
  var adminMainEl   = document.getElementById("adminMain");
  if (!adminLayoutEl) return;

  /* Oturum kontrolu — basarisizsa redirect yapildi */
  var kullanici = await oturumKontrol();
  if (!kullanici) return;

  /* Sayfa erisim kontrolu: personel admin-only sayfalara giremez */
  var _sayfa = window.location.pathname.split("/").pop() || "panel.html";
  if (kullanici.rol !== "admin" && _ADMIN_ONLY_PAGES.indexOf(_sayfa) !== -1) {
    window.location.href = "panel.html";
    return;
  }

  /* #adminLayout → .admin-layout CSS grid container'i olarak kullan */
  adminLayoutEl.className = "admin-layout";
  adminLayoutEl.innerHTML = _sidebarHtml(kullanici.rol) + _topbarHtml(kullanici);

  /* #adminMain'i grid icine tasi (sidebar + topbar ile ayni parent) */
  if (adminMainEl) adminLayoutEl.appendChild(adminMainEl);

  /* Aktif link ve topbar baslik */
  _aktifLinkKur();

  /* Mobil drawer */
  _mobilDrawerKur();

  /* Cikis butonu */
  var btnCikis = document.getElementById("btn-admin-cikis");
  if (btnCikis) btnCikis.addEventListener("click", cikisYap);

  /* A-02: Sifre degistir butonu */
  var btnSifre = document.getElementById("btn-sifre-degistir");
  if (btnSifre) btnSifre.addEventListener("click", _sifreModalAc);
  _sifreModalEkle();

  /* Global kullanici verisi — diger sayfa scriptleri okuyabilir */
  window._adminUser = kullanici;

  /* Sayfa scriptlerine hazir sinyali */
  document.dispatchEvent(new CustomEvent("adminLayoutReady", { detail: kullanici }));
});

/* ================================================================
   SIDEBAR HTML
   ================================================================ */

/**
 * Admin sidebar HTML'ini üretir. Role göre farklı nav listesi kullanır.
 * @param {string} rol - 'admin' veya 'personel'
 * @returns {string} <aside> HTML string
 */
function _sidebarHtml(rol) {
  var pageName = window.location.pathname.split("/").pop() || "panel.html";
  var navItems = (rol === "admin") ? _NAV_ITEMS_ADMIN : _NAV_ITEMS_PERSONEL;

  var navLinks = navItems.map(function (item) {
    var isActive = (pageName === item.href);
    return (
      '<a href="' + item.href + '"' +
        ' class="sidebar-nav__link' + (isActive ? " is-active" : "") + '"' +
        (isActive ? ' aria-current="page"' : "") + '>' +
        '<span class="sidebar-nav__icon">' + _ikon(item.icon, 18) + '</span>' +
        _esc(item.label) +
      '</a>'
    );
  }).join("");

  return (
    '<aside class="admin-sidebar" id="adminSidebar"' +
      ' role="complementary" aria-label="Yönetim navigasyonu">' +
      '<button class="sidebar-close" id="sidebar-close"' +
        ' type="button" aria-label="Menüyü kapat">' + _ikon('x', 18) + '</button>' +
      '<a href="panel.html" class="sidebar-logo" aria-label="Dashboard">' +
        '<span class="sidebar-logo__icon">' + _ikon('scissors', 20) + '</span>' +
        '<span class="sidebar-logo__text">KuaförYönetim</span>' +
      '</a>' +
      '<nav class="sidebar-nav" aria-label="Ana menü">' +
        '<div class="sidebar-nav__label" aria-hidden="true">Yönetim</div>' +
        navLinks +
      '</nav>' +
    '</aside>'
  );
}

/* ================================================================
   TOPBAR HTML
   ================================================================ */

/**
 * Admin üst çubuk HTML'ini üretir. Kullanıcı adından baş harf avatar oluşturur.
 * @param {{ ad_soyad?: string, rol?: string }} kullanici - Oturum verisi
 * @returns {string} <header> HTML string
 */
function _topbarHtml(kullanici) {
  var ad  = (kullanici && kullanici.ad_soyad) ? kullanici.ad_soyad : "Yönetici";
  var rol = (kullanici && kullanici.rol)       ? kullanici.rol      : "";

  /* İsimden 2 harf baş harf */
  var initials = ad.split(" ")
    .map(function (w) { return w[0] || ""; })
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    '<header class="admin-topbar" role="banner">' +
      '<div class="topbar-left">' +
        '<button class="sidebar-toggle" id="sidebar-toggle" type="button"' +
          ' aria-label="Menüyü aç/kapat" aria-expanded="false"' +
          ' aria-controls="adminSidebar">' + _ikon('menu', 20) + '</button>' +
        '<span class="topbar-title" id="topbar-title"></span>' +
      '</div>' +
      '<div class="topbar-right">' +
        '<div class="topbar-user-group">' +
          '<span class="topbar-avatar" aria-hidden="true">' + _esc(initials) + '</span>' +
          '<span class="topbar-user">' + _esc(ad) + '</span>' +
          (rol ? '<span class="topbar-role">' + _esc(rol) + '</span>' : '') +
        '</div>' +
        '<button class="btn btn-ghost btn-sm" id="btn-sifre-degistir" type="button">Şifremi Değiştir</button>' +
        '<button class="btn btn-ghost btn-sm" id="btn-admin-cikis" type="button">Çıkış</button>' +
      '</div>' +
    '</header>'
  );
}

/* ================================================================
   AKTIF LINK + TOPBAR BASLIK
   ================================================================ */

/**
 * Mevcut sayfa URL'sine göre sidebar linkini ve topbar başlığını günceller.
 */
function _aktifLinkKur() {
  var pageName   = window.location.pathname.split("/").pop() || "panel.html";
  var rol        = (window._adminUser && window._adminUser.rol) ? window._adminUser.rol : "personel";
  var navItems   = (rol === "admin") ? _NAV_ITEMS_ADMIN : _NAV_ITEMS_PERSONEL;
  var activeItem = navItems.find(function (item) { return item.href === pageName; });
  var titleEl    = document.getElementById("topbar-title");

  if (titleEl && activeItem) titleEl.textContent = activeItem.label;

  document.querySelectorAll(".sidebar-nav__link").forEach(function (link) {
    var isActive = (link.getAttribute("href") === pageName);
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "page");
    else          link.removeAttribute("aria-current");
  });
}

/* ================================================================
   MOBIL DRAWER
   ================================================================ */

/**
 * Mobil görünümde hamburger menü / drawer davranışını kurar.
 * Sidebar toggle butonu, kapatma butonu ve overlay tıklaması dinlenir.
 */
function _mobilDrawerKur() {
  var toggle  = document.getElementById("sidebar-toggle");
  var sidebar = document.getElementById("adminSidebar");
  var closeBtn = document.getElementById("sidebar-close");

  /* Overlay'i body'e ekle (grid disinda kalsin) */
  var overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.id        = "sidebar-overlay";
  document.body.appendChild(overlay);

  function _ac() {
    if (!sidebar) return;
    sidebar.classList.add("is-open");
    overlay.classList.add("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
  }
  function _kapat() {
    if (!sidebar) return;
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle)  toggle.addEventListener("click", _ac);
  if (closeBtn) closeBtn.addEventListener("click", _kapat);
  overlay.addEventListener("click", _kapat);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && sidebar && sidebar.classList.contains("is-open")) _kapat();
  });
}

/* ================================================================
   A-02: KENDİ ŞİFRE DEĞİŞTİR
   ================================================================ */
var _sifreSubmitting = false;

function _sifreModalEkle() {
  if (document.getElementById("modal-kendi-sifre")) return;
  var el = document.createElement("div");
  el.className = "modal-overlay";
  el.id = "modal-kendi-sifre";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-labelledby", "kendi-sifre-title");
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    '<div class="modal modal--sm">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="kendi-sifre-title">Şifremi Değiştir</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat" onclick="kapatModal(\'modal-kendi-sifre\')">' + _esc("✕") + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="form-group">' +
          '<label class="form-label" for="ks-eski">Mevcut Şifre <span class="required-mark">*</span></label>' +
          '<input type="password" class="input" id="ks-eski" autocomplete="current-password">' +
          '<span class="form-error" id="ks-eski-err"></span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="ks-yeni">Yeni Şifre <span class="required-mark">*</span></label>' +
          '<input type="password" class="input" id="ks-yeni" placeholder="En az 6 karakter" autocomplete="new-password">' +
          '<span class="form-error" id="ks-yeni-err"></span>' +
        '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button" onclick="kapatModal(\'modal-kendi-sifre\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-ks-kaydet" onclick="_sifreKaydet()">Kaydet</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(el);
}

function _sifreModalAc() {
  _sifreSubmitting = false;
  var eskiEl = document.getElementById("ks-eski");
  var yeniEl = document.getElementById("ks-yeni");
  if (eskiEl) eskiEl.value = "";
  if (yeniEl) yeniEl.value = "";
  ["ks-eski-err","ks-yeni-err"].forEach(function(id) {
    var e = document.getElementById(id);
    if (e) { e.textContent = ""; e.classList.remove("is-visible"); }
  });
  var btn = document.getElementById("btn-ks-kaydet");
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }
  acModal("modal-kendi-sifre");
}

async function _sifreKaydet() {
  if (_sifreSubmitting) return;
  var eski = document.getElementById("ks-eski") ? document.getElementById("ks-eski").value : "";
  var yeni = document.getElementById("ks-yeni") ? document.getElementById("ks-yeni").value : "";
  var hataMi = false;

  var hata = function(id, msg) {
    var e = document.getElementById(id); if (e) { e.textContent = msg; e.classList.add("is-visible"); } hataMi = true;
  };
  var temiz = function(id) {
    var e = document.getElementById(id); if (e) { e.textContent = ""; e.classList.remove("is-visible"); }
  };

  if (!eski) hata("ks-eski-err", "Mevcut şifrenizi girin."); else temiz("ks-eski-err");
  if (!yeni || yeni.length < 6) hata("ks-yeni-err", "Yeni şifre en az 6 karakter olmalıdır."); else temiz("ks-yeni-err");
  if (hataMi) return;

  var btn = document.getElementById("btn-ks-kaydet");
  _sifreSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var res = await apiPost("/api/yonetim/kendi_sifre_degistir.php", { eski_sifre: eski, yeni_sifre: yeni });

  _sifreSubmitting = false;
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }
  if (!res) return;

  if (!res.success) {
    var err = (res.errors && res.errors.eski_sifre) ? res.errors.eski_sifre[0] : res.message;
    hata("ks-eski-err", err || "Hata oluştu."); return;
  }

  kapatModal("modal-kendi-sifre");
  toast("Şifreniz güncellendi.", "success");
}

/* _esc() ui.js'de global olarak tanimlidir — A-13 */

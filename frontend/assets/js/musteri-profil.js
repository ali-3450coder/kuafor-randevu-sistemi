/* ===============================================================
   musteri-profil.js — Profil goruntule + duzenle + sifre degistir
   GET  /api/musteri/oturum.php
   POST /api/musteri/profil_guncelle.php
   POST /api/musteri/sifre_guncelle.php
   =============================================================== */

var _hesap = null;

document.addEventListener("DOMContentLoaded", async function () {
  /* Oturum kontrolu */
  var res = await apiGet("/api/musteri/oturum.php");
  if (!res || !res.success) {
    window.location.href = "musteri-giris.html?sonra=" + encodeURIComponent("musteri-profil.html");
    return;
  }

  _hesap = res.data.hesap || {};

  /* Cikis */
  var btnCikis = document.getElementById("btn-cikis");
  if (btnCikis) btnCikis.addEventListener("click", async function () {
    await apiPost("/api/musteri/cikis.php", {});
    window.location.href = "index.html";
  });

  _profilGoster();

  document.getElementById("profil-form").addEventListener("submit", _profilKaydet);
  document.getElementById("sifre-form").addEventListener("submit", _sifreKaydet);
});

/* ================================================================
   PROFİL BİLGİ KUTUSU
   ================================================================ */
function _profilGoster() {
  /* Bilgi kutusunu goster */
  var kutu = document.getElementById("profil-bilgi");
  if (kutu) {
    kutu.innerHTML =
      _bilgiSatiri("Ad Soyad",     _hesap.ad_soyad                                  || "—") +
      _bilgiSatiri("Telefon",      _hesap.telefon                                   || "—") +
      _bilgiSatiri("E-posta",      _hesap.email                                     || "—") +
      _bilgiSatiri("Üyelik Tarihi", _hesap.kayit_tarihi ? _hesap.kayit_tarihi.slice(0, 10) : "—");
  }

  /* Formu doldur */
  var adEl    = document.getElementById("prf-ad");
  var emailEl = document.getElementById("prf-email");
  if (adEl)    adEl.value    = _hesap.ad_soyad || "";
  if (emailEl) emailEl.value = _hesap.email    || "";
}

function _bilgiSatiri(label, deger) {
  return (
    '<div class="info-row">' +
      '<span class="info-row__label">' + label + "</span>" +
      '<span class="info-row__val">' + _esc(deger) + "</span>" +
    "</div>"
  );
}

/* ================================================================
   PROFİL GÜNCELLE
   ================================================================ */
async function _profilKaydet(e) {
  e.preventDefault();

  var adSoyad = document.getElementById("prf-ad").value.trim();
  var email   = document.getElementById("prf-email").value.trim();
  var hataMi  = false;

  var adEl    = document.getElementById("prf-ad");
  var emailEl = document.getElementById("prf-email");

  if (!adSoyad || adSoyad.length < 2) {
    if (adEl) gosterFormHata(adEl, "Ad Soyad en az 2 karakter olmalıdır.");
    hataMi = true;
  } else if (adEl) temizFormHata(adEl);

  if (email && !emailGecerli(email)) {
    if (emailEl) gosterFormHata(emailEl, "Geçerli bir e-posta girin.");
    hataMi = true;
  } else if (emailEl) temizFormHata(emailEl);

  if (hataMi) return;

  var btn    = document.getElementById("btn-profil-kaydet");
  var geriAl = submitBasla(btn);
  var body   = { ad_soyad: adSoyad };
  if (email) body.email = email;

  var res = await apiPost("/api/musteri/profil_guncelle.php", body);
  geriAl();
  if (!res) return;

  if (!res.success) {
    var err = res.errors || {};
    var emailEl2 = document.getElementById("prf-email");
    if (err.email && emailEl2) gosterFormHata(emailEl2, err.email[0]);
    else toast(res.message || "Güncellenemedi.", "error");
    return;
  }

  _hesap.ad_soyad = adSoyad;
  _hesap.email    = email || null;
  _profilGoster();
  toast("Profil güncellendi.", "success");
}

/* ================================================================
   ŞİFRE GÜNCELLE
   ================================================================ */
async function _sifreKaydet(e) {
  e.preventDefault();

  var eskiSifre = document.getElementById("prf-eski-sifre").value;
  var yeniSifre = document.getElementById("prf-yeni-sifre").value;
  var hataMi    = false;

  var eskiEl = document.getElementById("prf-eski-sifre");
  var yeniEl = document.getElementById("prf-yeni-sifre");

  if (!eskiSifre) {
    if (eskiEl) gosterFormHata(eskiEl, "Mevcut şifrenizi girin.");
    hataMi = true;
  } else if (eskiEl) temizFormHata(eskiEl);

  if (!yeniSifre || yeniSifre.length < 6) {
    if (yeniEl) gosterFormHata(yeniEl, "Yeni şifre en az 6 karakter olmalıdır.");
    hataMi = true;
  } else if (yeniEl) temizFormHata(yeniEl);

  if (hataMi) return;

  var btn    = document.getElementById("btn-sifre-kaydet");
  var geriAl = submitBasla(btn);

  var res = await apiPost("/api/musteri/sifre_guncelle.php", {
    eski_sifre: eskiSifre,
    yeni_sifre: yeniSifre
  });
  geriAl();
  if (!res) return;

  if (!res.success) {
    var err2 = res.errors || {};
    if (err2.eski_sifre && eskiEl) gosterFormHata(eskiEl, err2.eski_sifre[0]);
    else toast(res.message || "Şifre değiştirilemedi.", "error");
    return;
  }

  document.getElementById("prf-eski-sifre").value = "";
  document.getElementById("prf-yeni-sifre").value = "";
  toast("Şifre güncellendi.", "success");
}

/* C-01/C-02: gosterFormHata, temizFormHata, submitBasla, _esc — ui.js globalleri kullaniliyor */

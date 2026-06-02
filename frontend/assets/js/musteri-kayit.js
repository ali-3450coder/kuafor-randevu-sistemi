/* ===============================================================
   musteri-kayit.js — Musteri kayit formu
   POST /api/musteri/kayit.php
   C-01: Yerel _hata/_temiz/_submitBasla kaldirildi; ui.js globalleri kullaniliyor.
   =============================================================== */

document.addEventListener("DOMContentLoaded", function () {
  telefonMaskeUygula(document.getElementById("k-telefon"));
  document.getElementById("kayit-form").addEventListener("submit", _kayitGonder);
});

async function _kayitGonder(e) {
  e.preventDefault();

  var adSoyad    = document.getElementById("k-ad-soyad").value.trim();
  var telefonHam = document.getElementById("k-telefon").value.replace(/\D/g, "");
  var email      = document.getElementById("k-email").value.trim();
  var sifre      = document.getElementById("k-sifre").value;
  var sifre2     = document.getElementById("k-sifre2").value;
  var hataMi     = false;

  /* ui.js: gosterFormHata(input, msg) / temizFormHata(input) */
  var inputs = {
    adSoyadEl: document.getElementById("k-ad-soyad"),
    telefonEl: document.getElementById("k-telefon"),
    emailEl:   document.getElementById("k-email"),
    sifreEl:   document.getElementById("k-sifre"),
    sifre2El:  document.getElementById("k-sifre2"),
  };

  if (!gerekli(adSoyad) || adSoyad.length < 2) {
    if (inputs.adSoyadEl) gosterFormHata(inputs.adSoyadEl, "Ad Soyad en az 2 karakter olmalıdır.");
    hataMi = true;
  } else if (inputs.adSoyadEl) temizFormHata(inputs.adSoyadEl);

  if (!telefonGecerli(telefonHam)) {
    if (inputs.telefonEl) gosterFormHata(inputs.telefonEl, "Geçerli bir telefon numarası girin.");
    hataMi = true;
  } else if (inputs.telefonEl) temizFormHata(inputs.telefonEl);

  if (email && !emailGecerli(email)) {
    if (inputs.emailEl) gosterFormHata(inputs.emailEl, "Geçerli bir e-posta adresi girin.");
    hataMi = true;
  } else if (inputs.emailEl) temizFormHata(inputs.emailEl);

  if (!gerekli(sifre) || sifre.length < 6) {
    if (inputs.sifreEl) gosterFormHata(inputs.sifreEl, "Şifre en az 6 karakter olmalıdır.");
    hataMi = true;
  } else if (inputs.sifreEl) temizFormHata(inputs.sifreEl);

  if (sifre !== sifre2) {
    if (inputs.sifre2El) gosterFormHata(inputs.sifre2El, "Şifreler eşleşmiyor.");
    hataMi = true;
  } else if (inputs.sifre2El) temizFormHata(inputs.sifre2El);

  if (hataMi) return;

  var btn    = document.getElementById("btn-kayit");
  var geriAl = submitBasla(btn);

  var body = { ad_soyad: adSoyad, telefon: telefonHam, sifre: sifre };
  if (email) body.email = email;

  var res = await apiPost("/api/musteri/kayit.php", body);

  geriAl();
  if (!res) return;

  if (!res.success) {
    var err = res.errors || {};
    if (err.telefon && inputs.telefonEl) gosterFormHata(inputs.telefonEl, err.telefon[0]);
    else if (err.email && inputs.emailEl) gosterFormHata(inputs.emailEl, err.email[0]);
    else toast(res.message || "Kayıt başarısız.", "error");
    return;
  }

  toast("Kayıt başarılı! Yönlendiriliyorsunuz…", "success");
  setTimeout(function () { window.location.href = "randevu-al.html"; }, 1000);
}

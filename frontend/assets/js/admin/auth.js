/* ===============================================================
   admin/auth.js — oturumKontrol() + cikisYap() + giris formu
   =============================================================== */

/**
 * Her admin sayfasinda (giris.html haric) layout.js tarafindan cagrilir.
 * GET /api/yonetim/oturum.php
 *   - Basari : yetkili objesini dondurur
 *   - 401    : apiGet zaten redirect eder; null doner
 *   - Diger hata: giris.html'e yonlendirir
 */
async function oturumKontrol() {
  var res = await apiGet("/api/yonetim/oturum.php");
  if (!res || !res.success) {
    window.location.href = "/kuafor-randevu-sistemi/frontend/admin/giris.html";
    return null;
  }
  /* Backend: data.yetkili — yoksa data kendisi doner */
  return (res.data && res.data.yetkili) ? res.data.yetkili : (res.data || {});
}

/**
 * POST /api/yonetim/cikis.php → giris.html yonlendirmesi
 */
async function cikisYap() {
  await apiPost("/api/yonetim/cikis.php", {});
  window.location.href = "/kuafor-randevu-sistemi/frontend/admin/giris.html";
}

/* ----------------------------------------------------------------
   Giris formu — yalnizca giris.html'de #giris-form varsa aktif
   ---------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  var girisForm = document.getElementById("giris-form");
  if (!girisForm) return;
  girisForm.addEventListener("submit", _girisGonder);
});

async function _girisGonder(e) {
  e.preventDefault();

  var emailInput = document.getElementById("giris-email");
  var sifreInput = document.getElementById("giris-sifre");

  var email = emailInput ? emailInput.value.trim() : "";
  var sifre = sifreInput ? sifreInput.value         : "";

  var hataMi = false;

  if (!emailGecerli(email)) {
    _girisHataGoster("giris-email", "giris-email-error", "Geçerli bir e-posta adresi girin.");
    hataMi = true;
  } else { _girisHataSil("giris-email", "giris-email-error"); }

  if (!gerekli(sifre)) {
    _girisHataGoster("giris-sifre", "giris-sifre-error", "Şifre zorunludur.");
    hataMi = true;
  } else { _girisHataSil("giris-sifre", "giris-sifre-error"); }

  if (hataMi) return;

  /* Cift-submit engeli */
  var btn    = document.getElementById("btn-giris");
  var geriAl = _girisSubmitBasla(btn);

  var res = await apiPost("/api/yonetim/giris.php", { email: email, sifre: sifre });

  geriAl();

  if (!res) return;

  if (!res.success) {
    toast(res.message || "Giriş başarısız. E-posta veya şifre hatalı.", "error");
    return;
  }

  /* Basarili giris → dashboard */
  window.location.href = "/kuafor-randevu-sistemi/frontend/admin/panel.html";
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _girisHataGoster(inputId, errorId, msg) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}

function _girisHataSil(inputId, errorId) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.remove("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.remove("has-error");
  }
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
}

function _girisSubmitBasla(btn) {
  if (!btn) return function () {};
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  var orig = btn.textContent;
  btn.textContent = "Giriş yapılıyor…";
  return function () {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.textContent = orig;
  };
}

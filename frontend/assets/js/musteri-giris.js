/* ===============================================================
   musteri-giris.js — Musteri giris formu
   POST /api/musteri/giris.php
   ?sonra= parametresi ile giris sonrasi yonlendirme desteklenir.
   =============================================================== */

document.addEventListener("DOMContentLoaded", function () {
  telefonMaskeUygula(document.getElementById("g-telefon"));
  document.getElementById("giris-form").addEventListener("submit", _girisGonder);
});

async function _girisGonder(e) {
  e.preventDefault();

  var telefonHam = document.getElementById("g-telefon").value.replace(/\D/g, "");
  var sifre      = document.getElementById("g-sifre").value;
  var hataMi     = false;

  if (!telefonGecerli(telefonHam)) {
    _hata("g-telefon", "g-telefon-err", "Geçerli bir telefon numarası girin.");
    hataMi = true;
  } else { _temiz("g-telefon", "g-telefon-err"); }

  if (!gerekli(sifre)) {
    _hata("g-sifre", "g-sifre-err", "Şifre zorunludur.");
    hataMi = true;
  } else { _temiz("g-sifre", "g-sifre-err"); }

  if (hataMi) return;

  var btn    = document.getElementById("btn-giris");
  var geriAl = submitBasla(btn);

  var res = await apiPost("/api/musteri/giris.php", {
    telefon: telefonHam,
    sifre:   sifre
  });

  geriAl();
  if (!res) return;

  if (!res.success) {
    toast(res.message || "Telefon veya şifre hatalı.", "error");
    return;
  }

  /* Giris basarili — ?sonra= parametresi varsa oraya, yoksa index'e */
  var sonra = new URLSearchParams(window.location.search).get("sonra");
  window.location.href = sonra ? decodeURIComponent(sonra) : "index.html";
}

/* C-04: submitBasla ui.js'de global — yerel kopya kaldirildi */

function _hata(inputId, errId, msg) {
  var el = document.getElementById(inputId);
  var er = document.getElementById(errId);
  if (el) { el.classList.add("is-invalid"); var g = el.closest(".form-group"); if (g) g.classList.add("has-error"); }
  if (er) { er.textContent = msg; er.classList.add("is-visible"); }
}
function _temiz(inputId, errId) {
  var el = document.getElementById(inputId);
  var er = document.getElementById(errId);
  if (el) { el.classList.remove("is-invalid"); var g = el.closest(".form-group"); if (g) g.classList.remove("has-error"); }
  if (er) { er.textContent = ""; er.classList.remove("is-visible"); }
}

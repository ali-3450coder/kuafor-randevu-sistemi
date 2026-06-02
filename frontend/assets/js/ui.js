/* ===============================================================
   ui.js — Ortak UI yardımcıları
   Dışa açılan global fonksiyonlar:
     toast(msg, type)
     acModal(id)
     kapatModal(id)
     durumRozeti(durum, tipi?)
     formatTL(tutar)
     formatTarih(tarih)
     iskeletGoster(container, count?)
     bosDurum(container, msg?, icon?)
     kopyala(text, btn?)
     slotGrupla(slots)
     gosterFormHata(input, msg)
     temizFormHata(input)
     submitBasla(btn)
   Bağımlılık: config.js (DURUM_ETIKET, DURUM_BADGE, vb.)
   =============================================================== */

/* ================================================================
   TOAST BİLDİRİMİ
   ================================================================ */

/**
 * Ekranın köşesinde kısa süreli bildirim gösterir, 4 saniye sonra kaybolur.
 * @param {string} msg  - Gösterilecek mesaj
 * @param {'success'|'error'|'info'|'warning'} [type='info'] - Bildirim türü
 */
function toast(msg, type) {
  if (!type) type = "info";

  var container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  var el = document.createElement("div");
  el.className = "toast toast--" + type;
  el.setAttribute("role", "alert");
  el.setAttribute("aria-live", "polite");
  el.textContent = msg;
  container.appendChild(el);

  /* 4 saniye sonra fade-out ile kaldır */
  setTimeout(function () {
    el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    el.style.opacity = "0";
    el.style.transform = "translateX(16px)";
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 320);
  }, 4000);
}

/* ================================================================
   MODAL — erişilebilirlik: focus trap + Esc kapatma
   ================================================================ */

/**
 * Verilen ID'li modal overlay'i açar.
 * Odağı modal içine taşır, Esc tuşu ve arka plan tıklamasıyla kapanır.
 * @param {string} id - Modal overlay elementinin ID'si
 */
function acModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;

  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");

  /* Önceki odak noktasını kaydet; kapanışta geri dön */
  overlay._prevFocus = document.activeElement;

  /* İlk odaklanabilir elemana odaklan */
  var focusable = _getFocusable(overlay);
  if (focusable.length) focusable[0].focus();

  /* Esc ile kapatma */
  overlay._escHandler = function (e) {
    if (e.key === "Escape") kapatModal(id);
  };
  document.addEventListener("keydown", overlay._escHandler);

  /* Focus trap: Tab döngüsünü modal içinde tut */
  overlay._trapHandler = function (e) {
    if (e.key !== "Tab") return;
    var els = _getFocusable(overlay);
    if (!els.length) { e.preventDefault(); return; }
    var first = els[0];
    var last  = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  };
  overlay.addEventListener("keydown", overlay._trapHandler);

  /* Arka plana tıklanırsa kapat */
  overlay._backdropHandler = function (e) {
    if (e.target === overlay) kapatModal(id);
  };
  overlay.addEventListener("click", overlay._backdropHandler);
}

/**
 * Verilen ID'li modali kapatır, olay dinleyicilerini temizler,
 * odağı açılmadan önceki elemana geri taşır.
 * @param {string} id - Modal overlay elementinin ID'si
 */
function kapatModal(id) {
  var overlay = document.getElementById(id);
  if (!overlay) return;

  overlay.classList.remove("is-open");
  overlay.setAttribute("aria-hidden", "true");

  if (overlay._escHandler) {
    document.removeEventListener("keydown", overlay._escHandler);
    overlay._escHandler = null;
  }
  if (overlay._trapHandler) {
    overlay.removeEventListener("keydown", overlay._trapHandler);
    overlay._trapHandler = null;
  }
  if (overlay._backdropHandler) {
    overlay.removeEventListener("click", overlay._backdropHandler);
    overlay._backdropHandler = null;
  }
  if (overlay._prevFocus && overlay._prevFocus.focus) {
    overlay._prevFocus.focus();
    overlay._prevFocus = null;
  }
}

/**
 * Belirtilen container içindeki odaklanabilir elemanları döndürür.
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function _getFocusable(container) {
  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), ' +
    'select:not([disabled]), textarea:not([disabled]), ' +
    '[tabindex]:not([tabindex="-1"])'
  ));
}

/* ================================================================
   DURUM ROZETİ
   ================================================================ */

/**
 * Verilen duruma karşılık gelen renkli badge HTML'i üretir.
 * @param {string} durum          - Durum değeri (örn. 'beklemede', 'odendi')
 * @param {'randevu'|'odeme'} [tipi='randevu'] - Etiket haritası seçici
 * @returns {string} <span class="badge badge--X">...</span> HTML string
 */
function durumRozeti(durum, tipi) {
  var etiketMap = (tipi === "odeme") ? ODEME_DURUM_ETIKET : DURUM_ETIKET;
  var badgeMap  = (tipi === "odeme") ? ODEME_DURUM_BADGE  : DURUM_BADGE;
  var etiket    = etiketMap[durum] || durum;
  var variant   = badgeMap[durum]  || "muted";
  return '<span class="badge badge--' + variant + '">' + etiket + '</span>';
}

/* ================================================================
   FORMAT YARDIMCILARI
   ================================================================ */

/**
 * Sayısal tutarı Türk Lirası formatında gösterir: "1.250,00 ₺"
 * @param {number|string} tutar
 * @returns {string}
 */
function formatTL(tutar) {
  var n = parseFloat(tutar);
  if (isNaN(n)) return "-";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + " ₺";
}

/**
 * "YYYY-MM-DD" string tarihini "6 Mayıs 2026" formatına dönüştürür.
 * Tarayıcı uyumsuzluğunu önlemek için Date constructor yerine manuel parse kullanır.
 * @param {string} tarih - "YYYY-MM-DD" formatında tarih
 * @returns {string}
 */
function formatTarih(tarih) {
  if (!tarih) return "-";
  var parts = String(tarih).split("-");
  if (parts.length === 3) {
    var d = new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", {
        day: "numeric", month: "long", year: "numeric"
      });
    }
  }
  return tarih;
}

/* ================================================================
   İSKELET (yükleme durumu)
   ================================================================ */

/**
 * Container içine yükleme iskelet kartları yerleştirir.
 * @param {HTMLElement} container
 * @param {number} [count=3] - Gösterilecek iskelet satırı sayısı
 */
function iskeletGoster(container, count) {
  if (!count) count = 3;
  var html = "";
  for (var i = 0; i < count; i++) {
    html += '<div class="skeleton skeleton--row"></div>';
  }
  container.innerHTML = html;
}

/* ================================================================
   BOŞ DURUM
   ================================================================ */

/**
 * Container içine "kayıt yok" mesajı ve ikonu yerleştirir.
 * @param {HTMLElement} container
 * @param {string} [msg='Kayıt bulunamadı.'] - Gösterilecek mesaj
 * @param {string} [icon]                    - SVG string; verilmezse makas ikonu kullanılır
 */
function bosDurum(container, msg, icon) {
  if (!msg)  msg  = "Kayıt bulunamadı.";
  if (!icon) icon = (typeof _ikon === "function") ? _ikon('scissors', 40) : "";
  container.innerHTML =
    '<div class="empty-state">' +
      '<span class="empty-state__icon">' + icon + '</span>' +
      '<p class="empty-state__title">' + msg + '</p>' +
    '</div>';
}

/* ================================================================
   PANO KOPYALAMA
   ================================================================ */

/**
 * Metni panoya kopyalar; modern API desteklenmiyorsa execCommand fallback'e düşer.
 * @param {string}      text - Kopyalanacak metin
 * @param {HTMLElement} [btn] - Tıklanan buton; geçici "Kopyalandı!" yazısı gösterilir
 */
function kopyala(text, btn) {
  var origText = btn ? btn.textContent : null;

  function _onSuccess() {
    if (btn) {
      btn.textContent = "Kopyalandı!";
      setTimeout(function () { btn.textContent = origText; }, 2000);
    }
    toast("Kopyalandı!", "success");
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(_onSuccess).catch(function () {
      _fallbackKopyala(text);
      _onSuccess();
    });
  } else {
    _fallbackKopyala(text);
    _onSuccess();
  }
}

/**
 * Clipboard API desteklenmediğinde textarea + execCommand ile kopyalar.
 * @param {string} text
 */
function _fallbackKopyala(text) {
  var el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;top:0;left:0;";
  document.body.appendChild(el);
  el.select();
  try { document.execCommand("copy"); } catch (e) { /* sessiz hata */ }
  document.body.removeChild(el);
}

/* ================================================================
   SLOT GRUPLAMA
   ================================================================ */

/**
 * Saat slotlarını gün dilimine göre gruplar.
 * @param {string[]} slots - ["09:00", "13:30", ...] formatında slot listesi
 * @returns {{ sabah: string[], oglen: string[], aksam: string[] }}
 *   sabah : 00:00 – 11:59
 *   oglen : 12:00 – 16:59
 *   aksam : 17:00 – 23:59
 */
function slotGrupla(slots) {
  var groups = { sabah: [], oglen: [], aksam: [] };
  if (!Array.isArray(slots)) return groups;

  slots.forEach(function (slot) {
    var hour = parseInt(String(slot).split(":")[0], 10);
    if (hour < 12)       groups.sabah.push(slot);
    else if (hour < 17)  groups.oglen.push(slot);
    else                 groups.aksam.push(slot);
  });

  return groups;
}

/* ================================================================
   FORM YARDIMCILARI
   ================================================================ */

/**
 * Input'a hata sınıfları ekler ve hata mesajını gösterir.
 * form-group > input + .form-error yapısını bekler.
 * @param {HTMLElement} input
 * @param {string}      msg   - Gösterilecek hata metni
 */
function gosterFormHata(input, msg) {
  var group = input.closest(".form-group");
  if (group) group.classList.add("has-error");
  input.classList.add("is-invalid");
  var errEl = group && group.querySelector(".form-error");
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}

/**
 * Input'tan hata sınıflarını ve mesajını temizler.
 * @param {HTMLElement} input
 */
function temizFormHata(input) {
  var group = input.closest(".form-group");
  if (group) group.classList.remove("has-error");
  input.classList.remove("is-invalid");
  var errEl = group && group.querySelector(".form-error");
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
}

/**
 * Submit butonunu devre dışı bırakır ve "Lütfen bekleyin..." yazar.
 * Dönen fonksiyon çağrıldığında butonu orijinal haline döndürür.
 * @param {HTMLButtonElement} btn
 * @returns {Function} Geri alma (restore) fonksiyonu
 */
function submitBasla(btn) {
  btn.disabled = true;
  btn.setAttribute("aria-busy", "true");
  var origText = btn.textContent;
  btn.textContent = "Lütfen bekleyin...";
  return function () {
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.textContent = origText;
  };
}

/* ================================================================
   GLOBAL XSS KORUMA — A-13
   Tum admin JS dosyalarindaki yerel _esc* kopyalari bu fonksiyona
   delege edildi; DRY ihlali giderildi.
   ================================================================ */

/**
 * HTML ozel karakterlerini escape eder. innerHTML'e kullanici verisi yazilirken kullanilir.
 * @param {*} s
 * @returns {string}
 */
function _esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ===============================================================
   mask.js — Telefon input mask: 0XXX XXX XX XX
   Kullanim:
     telefonMaskeUygula(document.getElementById("telefon"))
   Desteklenenler:
     - Klavye yazimi
     - Yapistirma (paste)
     - Alan terk etme (blur) — temizlik
   =============================================================== */

/**
 * @param {HTMLInputElement} input
 */
function telefonMaskeUygula(input) {
  if (!input) return;

  /* Ham degeri bicimle: "0XXX XXX XX XX" */
  function _bicimle(val) {
    /* Sadece rakamlar, maksimum 11 hane */
    var digits = val.replace(/\D/g, "").slice(0, 11);
    var result = "";

    if (digits.length === 0) return "";

    /* 0XXX */
    result += digits.slice(0, 4);
    /* XXX */
    if (digits.length > 4) result += " " + digits.slice(4, 7);
    /* XX */
    if (digits.length > 7) result += " " + digits.slice(7, 9);
    /* XX */
    if (digits.length > 9) result += " " + digits.slice(9, 11);

    return result;
  }

  /* Imleç pozisyonunu koruyarak bicimleme */
  function _uygula() {
    var caretPos = input.selectionStart;
    var prevLen  = input.value.length;

    var bicimli = _bicimle(input.value);
    input.value = bicimli;

    /* Yeni uzunluga gore imlecu ayarla */
    var diff = bicimli.length - prevLen;
    var newPos = Math.max(0, caretPos + diff);
    /* Imlecu iceriden tasimayalim */
    if (newPos > bicimli.length) newPos = bicimli.length;
    input.setSelectionRange(newPos, newPos);
  }

  input.addEventListener("input", _uygula);

  input.addEventListener("paste", function (e) {
    e.preventDefault();
    var pasted = (e.clipboardData || window.clipboardData).getData("text");
    input.value = _bicimle(pasted);
    /* Imlecu sona tasiyoruz */
    var len = input.value.length;
    input.setSelectionRange(len, len);
  });

  input.addEventListener("blur", function () {
    /* Blur'da da temizle/formatla */
    input.value = _bicimle(input.value);
  });

  /* Sayisal olmayan karakteri aninda engelle (keydown) */
  input.addEventListener("keydown", function (e) {
    var izinli = [
      "Backspace", "Delete", "ArrowLeft", "ArrowRight",
      "ArrowUp", "ArrowDown", "Tab", "Home", "End"
    ];
    if (izinli.indexOf(e.key) !== -1) return;
    if (e.ctrlKey || e.metaKey) return; /* kopyala/yapistir kisayol */
    if (!/^\d$/.test(e.key)) e.preventDefault();
  });
}

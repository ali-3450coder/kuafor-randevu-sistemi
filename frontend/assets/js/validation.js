/* ===============================================================
   validation.js — Form dogrulama yardimcilari
   =============================================================== */

/**
 * Alan bos mu?
 * @param {*} value
 * @returns {boolean} true = dolu (gecerli)
 */
function gerekli(value) {
  if (value === null || value === undefined) return false;
  return String(value).trim().length > 0;
}

/**
 * Turkiye cep telefonu formati: 0XXXXXXXXXX (11 hane, 05 ile baslar)
 * Maskelenmiş: "0555 555 55 55" ya da ham "05555555555" her ikisi gecerli
 * @param {string} value
 * @returns {boolean}
 */
function telefonGecerli(value) {
  var cleaned = String(value).replace(/\D/g, "");
  return /^0[5][0-9]{9}$/.test(cleaned);
}

/**
 * E-posta formati
 * @param {string} value
 * @returns {boolean}
 */
function emailGecerli(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value).trim());
}

/**
 * Tarih gecmis mi? (bugunun oncesi = gecmis)
 * @param {string} value  — "YYYY-MM-DD"
 * @returns {boolean} true = gecmis (gecersiz)
 */
function tarihGecmis(value) {
  if (!value) return true;
  var parts = String(value).split("-");
  if (parts.length !== 3) return true;
  var d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  var bugun = new Date();
  bugun.setHours(0, 0, 0, 0);
  return d < bugun;
}

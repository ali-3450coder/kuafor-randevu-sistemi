/* ===============================================================
   config.js — API temel URL + durum etiket / rozet eslestirmeleri
   =============================================================== */

var API_BASE_URL = "/kuafor-randevu-sistemi/backend";

/* Randevu durum etiketleri (kullaniciya gorunen) */
var DURUM_ETIKET = {
  beklemede:  "Beklemede",
  onaylandi:  "Onaylandı",
  iptal:      "İptal",
  tamamlandi: "Tamamlandı",
  gelmedi:    "Gelmedi"
};

/* Randevu durum → badge variant */
var DURUM_BADGE = {
  beklemede:  "warning",
  onaylandi:  "info",
  tamamlandi: "success",
  iptal:      "danger",
  gelmedi:    "muted"
};

/* Odeme durum etiketleri */
var ODEME_DURUM_ETIKET = {
  bekliyor: "Bekliyor",
  odendi:   "Ödendi",
  iptal:    "İptal",
  iade:     "İade"
};

/* Odeme durum → badge variant */
var ODEME_DURUM_BADGE = {
  bekliyor: "warning",
  odendi:   "success",
  iptal:    "danger",
  iade:     "muted"
};

/* Odeme tipi etiketleri */
var ODEME_TIPI_ETIKET = {
  nakit:   "Nakit",
  kart:    "Kart",
  havale:  "Havale",
  diger:   "Diğer"
};

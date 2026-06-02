/* ===============================================================
   admin/staff.js — CRUD + hizmet baglama + calisma saatleri grid
   DELETE butonu YOK; sadece durum toggle (aktif/pasif)
   =============================================================== */

var _personelListesi   = [];
var _tumHizmetler      = [];
var _duzenleId         = null;  /* null = ekle modu, number = guncelle modu */
var _hizmetPId         = null;  /* hizmet modal'i hangi personel icin acik */
var _saatPId           = null;  /* saat modal'i hangi personel icin acik */
var _personelSubmitting = false; /* cift-submit engeli — personel kaydet */
var _hizmetSaving      = false;  /* cift-submit engeli — hizmet kaydet */
var _saatSaving        = false;  /* cift-submit engeli — saat kaydet */

/* Calisma saatleri icin gun listesi — DB enum ile birebir (ASCII) */
var _GUNLER = [
  { gun: "pazartesi", label: "Pazartesi" },
  { gun: "sali",      label: "Salı"      },
  { gun: "carsamba",  label: "Çarşamba"  },
  { gun: "persembe",  label: "Perşembe"  },
  { gun: "cuma",      label: "Cuma"      },
  { gun: "cumartesi", label: "Cumartesi" },
  { gun: "pazar",     label: "Pazar"     },
];

document.addEventListener("adminLayoutReady", function () {
  _modallarEkle();
  _sayfaKur();
});

/* ================================================================
   SAYFA ISKELET
   ================================================================ */
function _sayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Personeller</h1>' +
        '<p class="page-header__subtitle">Personelleri yönetin; hizmet ve çalışma saatlerini düzenleyin.</p>' +
      '</div>' +
      '<div class="page-header__actions">' +
        '<button class="btn btn-primary" type="button"' +
          ' onclick="personelModalAc(null)">+ Personel Ekle</button>' +
      '</div>' +
    '</div>' +
    '<div class="card" style="padding:0;overflow:hidden;" id="personel-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Yükleniyor…</span>' +
      '</div>' +
    '</div>';

  _listeYukle();
}

/* ================================================================
   LISTE YUKLE
   ================================================================ */
async function _listeYukle() {
  var container = document.getElementById("personel-tablo");
  if (!container) return;

  var res = await apiGet("/api/yonetim/personeller.php");

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' + _ikon('alert',16) + ' Personeller yüklenemedi.</p>';
    return;
  }

  _personelListesi = res.data || [];

  if (_personelListesi.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon('user',40) + '</span>' +
        '<p class="empty-state__title">Henüz personel eklenmemiş.</p>' +
        '<p class="empty-state__desc">Sağ üstteki "Personel Ekle" butonunu kullanın.</p>' +
      '</div>';
    return;
  }

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Ad Soyad</th><th>Ünvan</th><th>Telefon</th>' +
      '<th>Durum</th><th class="col-actions">İşlem</th>' +
    '</tr></thead><tbody>';

  _personelListesi.forEach(function (p) {
    var durumBadge = p.durum
      ? '<span class="badge badge--success">Aktif</span>'
      : '<span class="badge badge--muted">Pasif</span>';

    var toggleLabel = p.durum ? "Pasif Yap" : "Aktif Yap";
    var toggleClass = p.durum ? "btn-danger" : "btn-success";
    var yeniDurum   = p.durum ? 0 : 1;

    html +=
      '<tr>' +
        '<td style="font-weight:500;">' + _esc(p.ad_soyad) + '</td>' +
        '<td style="font-size:var(--font-size-sm);color:var(--color-text-2);">' +
          _esc(p.unvan || "-") +
        '</td>' +
        '<td class="font-mono" style="font-size:var(--font-size-xs);">' +
          _esc(p.telefon) +
        '</td>' +
        '<td>' + durumBadge + '</td>' +
        '<td class="col-actions">' +
          '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;flex-wrap:wrap;">' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="personelModalAc(' + p.personel_id + ')">Düzenle</button>' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="hizmetModalAc(' + p.personel_id + ')">Hizmetler</button>' +
            '<button class="btn btn-ghost btn-sm" type="button"' +
              ' onclick="saatModalAc(' + p.personel_id + ')">Saatler</button>' +
            '<button class="btn btn-sm ' + toggleClass + '" type="button"' +
              ' onclick="durumDegistir(' + p.personel_id + ',' + yeniDurum + ')">' +
              toggleLabel +
            '</button>' +
            '<button class="btn btn-sm btn-danger" type="button"' +
              ' onclick="personelSil(' + p.personel_id + ',\'' + _esc(p.ad_soyad) + '\')" title="Kalıcı Sil">Sil</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

/* ================================================================
   PERSONEL MODAL — EKLE / DUZENLE
   ================================================================ */

/**
 * Personel ekle/düzenle modalını açar.
 * @param {number|null} personelId - Düzenleme için personel ID; null ise ekleme modu
 */
function panelGirisToggle() {
  var chk  = document.getElementById("p-panel-giris-chk");
  var form = document.getElementById("p-panel-giris-form");
  if (form) form.style.display = (chk && chk.checked) ? "" : "none";
}

function personelModalAc(personelId) {
  _duzenleId         = personelId;
  _personelSubmitting = false;

  var titleEl = document.getElementById("personel-modal-title");
  if (titleEl) titleEl.textContent = personelId ? "Personeli Düzenle" : "Yeni Personel Ekle";

  /* Formu sifirla */
  ["p-ad-soyad", "p-unvan", "p-telefon", "p-bio", "p-email", "p-sifre"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  _sfTemiz("p-ad-soyad", "p-ad-soyad-err");
  _sfTemiz("p-telefon",  "p-telefon-err");
  _sfTemiz("p-email",    "p-email-err");
  _sfTemiz("p-sifre",    "p-sifre-err");
  _setVal("p-durum", "1");

  /* Panel girisi — sadece ekle modunda gosterilir */
  var panelWrap = document.getElementById("p-panel-giris-wrap");
  var panelChk  = document.getElementById("p-panel-giris-chk");
  var panelForm = document.getElementById("p-panel-giris-form");
  if (panelWrap) panelWrap.style.display = personelId ? "none" : "";
  if (panelChk)  panelChk.checked = false;
  if (panelForm) panelForm.style.display = "none";

  /* Duzenleme: alanlari doldur */
  if (personelId) {
    var p = _personelListesi.find(function (x) { return x.personel_id === personelId; });
    if (p) {
      _setVal("p-ad-soyad", p.ad_soyad || "");
      _setVal("p-unvan",    p.unvan    || "");
      _setVal("p-telefon",  p.telefon  || "");
      _setVal("p-bio",      p.bio      || "");
      _setVal("p-durum",    p.durum != null ? String(p.durum) : "1");
    }
  }

  /* Telefon mask (yeniden uygula) */
  var telInput = document.getElementById("p-telefon");
  if (telInput) telefonMaskeUygula(telInput);

  var btnEl = document.getElementById("btn-personel-kaydet");
  if (btnEl) btnEl.textContent = personelId ? "Güncelle" : "Ekle";

  acModal("modal-personel");
}

/**
 * Personel formunu doğrular ve ekle/güncelle API çağrısını yapar.
 * Çift-submit'e karşı _personelSubmitting bayrağı kullanır.
 */
async function personelKaydet() {
  if (_personelSubmitting) return;

  var adSoyad    = _getVal("p-ad-soyad").trim();
  var telefonHam = _getVal("p-telefon").replace(/\D/g, "");
  var unvan      = _getVal("p-unvan").trim();
  var bio        = _getVal("p-bio").trim();
  var durum      = parseInt(_getVal("p-durum"), 10);

  var hataMi = false;

  if (!gerekli(adSoyad)) {
    _sfHata("p-ad-soyad", "p-ad-soyad-err", "Ad Soyad zorunludur.");
    hataMi = true;
  } else { _sfTemiz("p-ad-soyad", "p-ad-soyad-err"); }

  if (!telefonGecerli(telefonHam)) {
    _sfHata("p-telefon", "p-telefon-err", "Geçerli bir telefon numarası girin.");
    hataMi = true;
  } else { _sfTemiz("p-telefon", "p-telefon-err"); }

  if (hataMi) return;

  var btn  = document.getElementById("btn-personel-kaydet");
  var orig = btn ? btn.textContent : "";
  _personelSubmitting = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var body = { ad_soyad: adSoyad, telefon: telefonHam, durum: durum };
  if (unvan) body.unvan = unvan;
  if (bio)   body.bio   = bio;

  /* Panel girisi oluşturma (sadece ekle modunda) */
  var panelChk    = document.getElementById("p-panel-giris-chk");
  var panelGiris  = panelChk && panelChk.checked && !_duzenleId;
  var email       = panelGiris ? (_getVal("p-email").trim())  : "";
  var sifre       = panelGiris ? (_getVal("p-sifre"))          : "";

  if (panelGiris) {
    if (!emailGecerli(email)) {
      _sfHata("p-email", "p-email-err", "Geçerli bir e-posta girin.");
      _personelSubmitting = false;
      if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = orig; }
      return;
    }
    if (!sifre || sifre.length < 6) {
      _sfHata("p-sifre", "p-sifre-err", "Şifre en az 6 karakter olmalıdır.");
      _personelSubmitting = false;
      if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = orig; }
      return;
    }
    _sfTemiz("p-email", "p-email-err");
    _sfTemiz("p-sifre", "p-sifre-err");
  }

  var res;
  if (_duzenleId) {
    body.personel_id = _duzenleId;
    res = await apiPost("/api/yonetim/personel_guncelle.php", body);
  } else {
    res = await apiPost("/api/yonetim/personel_ekle.php", body);
  }

  _personelSubmitting = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); btn.textContent = orig; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Kaydedilemedi.", "error"); return; }

  /* Panel girisi hesabi olustur */
  if (panelGiris) {
    var kulRes = await apiPost("/api/yonetim/kullanici_ekle.php", {
      ad_soyad: adSoyad,
      email:    email,
      sifre:    sifre,
      rol:      "personel"
    });
    if (!kulRes || !kulRes.success) {
      var errMsg = kulRes && kulRes.errors && kulRes.errors.email
        ? kulRes.errors.email[0]
        : (kulRes && kulRes.message ? kulRes.message : "Panel hesabı oluşturulamadı.");
      toast("Personel eklendi ama panel hesabı oluşturulamadı: " + errMsg, "warning");
    } else {
      toast("Personel eklendi ve panel girişi oluşturuldu. E-posta: " + email, "success");
    }
  } else {
    toast(_duzenleId ? "Personel güncellendi." : "Personel eklendi.", "success");
  }

  kapatModal("modal-personel");
  _listeYukle();
}

/* ================================================================
   DURUM TOGGLE — DELETE yok
   ================================================================ */

/**
 * Personeli aktif veya pasif yapar. Silme işlemi yoktur; referans bütünlüğü korunur.
 * @param {number} personelId
 * @param {0|1}    yeniDurum  - 1: aktif, 0: pasif
 */
async function durumDegistir(personelId, yeniDurum) {
  var res = await apiPost("/api/yonetim/personel_durum_degistir.php", {
    personel_id: personelId,
    durum:       yeniDurum
  });
  if (!res) return;
  if (!res.success) { toast(res.message || "Durum değiştirilemedi.", "error"); return; }
  toast(yeniDurum === 1 ? "Personel aktif edildi." : "Personel pasif yapıldı.", "success");
  /* A-12: Pasif yapilirken bekleyen aktif randevu varsa uyari goster */
  if (yeniDurum === 0 && res.data && res.data.aktif_randevu_sayisi > 0) {
    toast(
      res.data.aktif_randevu_sayisi + " aktif/bekleyen randevusu var. Lütfen randevuları kontrol edin.",
      "warning"
    );
  }
  _listeYukle();
}

/* ================================================================
   PERSONEL SİL
   ================================================================ */

/**
 * Personeli kalıcı siler. Randevusu varsa backend hata döner.
 * @param {number} personelId
 * @param {string} adSoyad
 */
async function personelSil(personelId, adSoyad) {
  if (!confirm(
    '"' + adSoyad + '" personelini kalıcı olarak silmek istediğinizden emin misiniz?\n' +
    'Randevusu olan personel silinemez — pasif yapmanız önerilir.'
  )) return;

  var res = await apiPost("/api/yonetim/personel_sil.php", { personel_id: personelId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Silinemedi.", "error"); return; }

  toast(adSoyad + " kalıcı olarak silindi.", "success");
  _listeYukle();
}

/* ================================================================
   HIZMET BAGLAMA MODAL
   ================================================================ */

/**
 * Personele hizmet bağlama modalını açar. Aktif hizmetleri ve mevcut atamaları yükler.
 * @param {number} personelId
 */
async function hizmetModalAc(personelId) {
  _hizmetPId   = personelId;
  _hizmetSaving = false;
  var icerik = document.getElementById("hizmet-modal-icerik");
  if (icerik) {
    icerik.innerHTML =
      '<div class="loading-row" style="padding:var(--space-4);">' +
        '<span class="spinner"></span><span>Hizmetler yükleniyor…</span>' +
      '</div>';
  }
  acModal("modal-hizmet");

  /* Hizmet listesi + mevcut atamalar paralel cek */
  if (_tumHizmetler.length === 0) {
    var resH = await apiGet("/api/yonetim/hizmetler.php");
    if (resH && resH.success) _tumHizmetler = resH.data || [];
  }
  var mevcutRes  = await apiGet("/api/yonetim/personel_hizmetleri.php?personel_id=" + personelId);
  var mevcutIdler = (mevcutRes && mevcutRes.success) ? (mevcutRes.data.hizmet_idler || []) : [];

  if (!icerik) return;

  var aktifHizmetler = _tumHizmetler.filter(function (h) { return h.durum; });

  if (aktifHizmetler.length === 0) {
    icerik.innerHTML =
      '<p style="color:var(--color-text-2);">Aktif hizmet bulunamadı.</p>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:var(--space-2);">';

  aktifHizmetler.forEach(function (h) {
    var checked = mevcutIdler.indexOf(h.hizmet_id) !== -1 ? ' checked' : '';
    html +=
      '<label class="check-card' + (checked ? ' is-selected' : '') +
        '" style="cursor:pointer;display:flex;align-items:center;gap:var(--space-3);">' +
        '<input type="checkbox" class="hizmet-check" value="' + h.hizmet_id + '"' + checked + '>' +
        '<div>' +
          '<div style="font-weight:500;font-size:var(--font-size-sm);">' + _esc(h.hizmet_adi) + '</div>' +
          '<div style="font-size:var(--font-size-xs);color:var(--color-text-3);">' +
            _ikon('clock',12) + ' ' + _esc(String(h.sure_dakika)) + ' dk · ' + formatTL(h.fiyat) +
          '</div>' +
        '</div>' +
      '</label>';
  });
  html += '</div>';
  icerik.innerHTML = html;
}

/**
 * Seçili hizmetleri personele bağlar. En az 1 hizmet seçilmiş olmalıdır.
 */
async function hizmetKaydet() {
  if (_hizmetSaving) return;

  var checkboxlar = document.querySelectorAll(".hizmet-check:checked");
  var hizmetIdler = Array.from(checkboxlar).map(function (cb) {
    return parseInt(cb.value, 10);
  });

  /* En az 1 hizmet secilmeli */
  if (hizmetIdler.length === 0) {
    toast("En az bir hizmet seçmelisiniz.", "warning");
    return;
  }

  var btn = document.getElementById("btn-hizmet-kaydet");
  _hizmetSaving = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var res = await apiPost("/api/yonetim/personel_hizmetleri_guncelle.php", {
    personel_id:  _hizmetPId,
    hizmet_idler: hizmetIdler
  });

  _hizmetSaving = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  if (!res) return;
  if (!res.success) { toast(res.message || "Hizmetler kaydedilemedi.", "error"); return; }

  kapatModal("modal-hizmet");
  toast("Hizmet ataması güncellendi.", "success");
}

/* ================================================================
   CALISMA SAATLERI MODAL
   Body: { personel_id, saatler: [{gun, acilis, kapanis, durum}] }
   acilis/kapanis: frontend adı; DB sütunları baslangic_saati/bitis_saati — endpoint dönüştürür.
   ================================================================ */

/**
 * Çalışma saatleri modalını açar ve mevcut saatleri form alanlarına doldurur.
 * @param {number} personelId
 */
async function saatModalAc(personelId) {
  _saatPId    = personelId;
  _saatSaving = false;

  /* Varsayilanlara sifirla */
  _GUNLER.forEach(function (g) {
    _setVal("saat-ac-"  + g.gun, "09:00");
    _setVal("saat-kap-" + g.gun, "18:00");
    var cbEl = document.getElementById("saat-durum-" + g.gun);
    if (cbEl) cbEl.checked = false;
  });

  acModal("modal-saat");

  /* Mevcut saatleri cek ve formu doldur */
  var res = await apiGet("/api/yonetim/personel_calisma_saatleri.php?personel_id=" + personelId);
  if (res && res.success && res.data.saatler) {
    res.data.saatler.forEach(function (s) {
      _setVal("saat-ac-"  + s.gun, s.acilis  || "09:00");
      _setVal("saat-kap-" + s.gun, s.kapanis || "18:00");
      var cbEl = document.getElementById("saat-durum-" + s.gun);
      if (cbEl) cbEl.checked = s.durum === 1;
    });
  }
}

/**
 * Çalışma saatlerini kaydeder. En az 1 aktif gün seçilmiş olmalıdır.
 */
async function saatKaydet() {
  if (_saatSaving) return;

  var saatler = _GUNLER.map(function (g) {
    var acilis  = _getVal("saat-ac-"  + g.gun);
    var kapanis = _getVal("saat-kap-" + g.gun);
    var cbEl    = document.getElementById("saat-durum-" + g.gun);
    var durum   = (cbEl && cbEl.checked) ? 1 : 0;
    return { gun: g.gun, acilis: acilis, kapanis: kapanis, durum: durum };
  });

  /* En az 1 aktif gun olmali */
  var aktifSayisi = saatler.filter(function (s) { return s.durum === 1; }).length;
  if (aktifSayisi === 0) {
    toast("En az bir günü aktif olarak işaretlemelisiniz.", "warning");
    return;
  }

  var btn = document.getElementById("btn-saat-kaydet");
  _saatSaving = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var res = await apiPost("/api/yonetim/personel_calisma_saatleri_guncelle.php", {
    personel_id: _saatPId,
    saatler:     saatler
  });

  _saatSaving = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  if (!res) return;
  if (!res.success) { toast(res.message || "Saatler kaydedilemedi.", "error"); return; }

  kapatModal("modal-saat");
  toast("Çalışma saatleri güncellendi.", "success");
}

/* ================================================================
   MODAL HTML INJECT — body'e bir kez eklenir
   ================================================================ */
function _modallarEkle() {
  /* ---- Personel Modal (Ekle/Duzenle) ---- */
  var persEl = document.createElement("div");
  persEl.className = "modal-overlay";
  persEl.id        = "modal-personel";
  persEl.setAttribute("role",            "dialog");
  persEl.setAttribute("aria-modal",      "true");
  persEl.setAttribute("aria-labelledby", "personel-modal-title");
  persEl.setAttribute("aria-hidden",     "true");
  persEl.innerHTML =
    '<div class="modal">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="personel-modal-title">Personel Ekle</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-personel\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="form-group">' +
          '<label class="form-label" for="p-ad-soyad">Ad Soyad' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="text" class="input" id="p-ad-soyad"' +
            ' placeholder="Örn: Ahmet Yılmaz" autocomplete="off">' +
          '<span class="form-error" id="p-ad-soyad-err"></span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="p-telefon">Telefon' +
            ' <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="tel" class="input" id="p-telefon"' +
            ' placeholder="0555 555 55 55" inputmode="numeric">' +
          '<span class="form-error" id="p-telefon-err"></span>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="p-unvan">Ünvan</label>' +
          '<input type="text" class="input" id="p-unvan"' +
            ' placeholder="Örn: Kuaför Uzmanı">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="p-bio">Biyografi</label>' +
          '<textarea class="input" id="p-bio" rows="2"' +
            ' placeholder="Kısa tanıtım…" style="resize:vertical;"></textarea>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label" for="p-durum">Durum</label>' +
          '<select class="input" id="p-durum">' +
            '<option value="1">Aktif</option>' +
            '<option value="0">Pasif</option>' +
          '</select>' +
        '</div>' +

        /* Panel girisi bolumu — sadece ekle modunda gosterilir */
        '<div id="p-panel-giris-wrap" style="border-top:1px solid var(--color-border);margin-top:var(--space-4);padding-top:var(--space-4);">' +
          '<label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer;font-size:var(--font-size-sm);margin-bottom:var(--space-3);">' +
            '<input type="checkbox" id="p-panel-giris-chk" onchange="panelGirisToggle()"> ' +
            '<strong>Bu personele panel girişi oluştur</strong>' +
          '</label>' +
          '<div id="p-panel-giris-form" style="display:none;">' +
            '<p style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-bottom:var(--space-3);">' +
              'Personel bu bilgilerle yönetim paneline giriş yapabilecek.' +
            '</p>' +
            '<div class="form-group">' +
              '<label class="form-label" for="p-email">E-posta <span class="required-mark">*</span></label>' +
              '<input type="email" class="input" id="p-email" placeholder="ornek@domain.com" autocomplete="off">' +
              '<span class="form-error" id="p-email-err"></span>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="p-sifre">Şifre <span class="required-mark">*</span></label>' +
              '<input type="password" class="input" id="p-sifre" placeholder="En az 6 karakter" autocomplete="new-password">' +
              '<span class="form-error" id="p-sifre-err"></span>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-personel\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-personel-kaydet"' +
          ' onclick="personelKaydet()">Ekle</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(persEl);

  /* ---- Hizmet Baglama Modal ---- */
  var hizEl = document.createElement("div");
  hizEl.className = "modal-overlay";
  hizEl.id        = "modal-hizmet";
  hizEl.setAttribute("role",            "dialog");
  hizEl.setAttribute("aria-modal",      "true");
  hizEl.setAttribute("aria-labelledby", "hizmet-modal-title");
  hizEl.setAttribute("aria-hidden",     "true");
  hizEl.innerHTML =
    '<div class="modal">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="hizmet-modal-title">Hizmet Bağla</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-hizmet\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body" id="hizmet-modal-icerik"' +
        ' style="max-height:60vh;overflow-y:auto;"></div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-hizmet\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-hizmet-kaydet"' +
          ' onclick="hizmetKaydet()">Kaydet</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(hizEl);

  /* ---- Calisma Saatleri Modal ---- */
  var saatRows = _GUNLER.map(function (g) {
    return (
      '<div class="hours-grid__day">' + g.label + '</div>' +
      '<input type="time" class="input" id="saat-ac-'  + g.gun + '" value="09:00">' +
      '<input type="time" class="input" id="saat-kap-' + g.gun + '" value="18:00">' +
      '<label style="display:flex;align-items:center;justify-content:center;' +
        'gap:var(--space-1);font-size:var(--font-size-xs);cursor:pointer;">' +
        '<input type="checkbox" id="saat-durum-' + g.gun + '"> Aktif' +
      '</label>'
    );
  }).join("");

  var saatEl = document.createElement("div");
  saatEl.className = "modal-overlay";
  saatEl.id        = "modal-saat";
  saatEl.setAttribute("role",            "dialog");
  saatEl.setAttribute("aria-modal",      "true");
  saatEl.setAttribute("aria-labelledby", "saat-modal-title");
  saatEl.setAttribute("aria-hidden",     "true");
  saatEl.innerHTML =
    '<div class="modal modal--lg">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="saat-modal-title">Çalışma Saatleri</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-saat\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="hours-grid">' +
          '<div class="hours-grid__header">Gün</div>' +
          '<div class="hours-grid__header">Açılış</div>' +
          '<div class="hours-grid__header">Kapanış</div>' +
          '<div class="hours-grid__header" style="text-align:center;">Aktif</div>' +
          saatRows +
        '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-saat\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-saat-kaydet"' +
          ' onclick="saatKaydet()">Kaydet</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(saatEl);
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _setVal(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}
function _getVal(id) {
  var el = document.getElementById(id);
  return el ? el.value : "";
}
function _sfHata(inputId, errorId, msg) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}
function _sfTemiz(inputId, errorId) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.remove("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.remove("has-error");
  }
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
}
/* _esc() ui.js'de global olarak tanimlidir — A-13 */

/* ===============================================================
   appointment.js — Randevu Al: 4 adim wizard
   - Adim 1: Hizmet secimi (kategori sekmeleri + checkbox)
   - Adim 2: Personel secimi (POST hizmete_gore_personeller.php)
   - Adim 3: Tarih + saat (POST uygun_saatler.php + slotGrupla)
   - Adim 4: Kisisel bilgiler + submit (POST randevu_olustur.php)
   - Reset zinciri: hizmet → personel+tarih+saat; personel → tarih+saat; tarih → saat
   - Cift-submit engeli, loading/empty/error state
   =============================================================== */

/* ---- Global state ---- */
var _state = {
  hizmetIdler:  [],    /* [1, 2, ...] */
  hizmetler:    [],    /* [{hizmet_id, hizmet_adi, sure_dakika, fiyat}] */
  personelId:   null,
  personelAd:   "",
  personelUnvan:"",
  tarih:        "",    /* "YYYY-MM-DD" */
  saat:         "",    /* "HH:MM" */
  aktifAdim:    1
};

var _tumHizmetler = []; /* cache */

document.addEventListener("DOMContentLoaded", async function () {
  /* B-14: Musteri oturum kontrolu — giris yapilmamissa yonlendir */
  var _oturumRes = await apiGet("/api/musteri/oturum.php");
  if (!_oturumRes || !_oturumRes.success) {
    window.location.href = "musteri-giris.html?sonra=" + encodeURIComponent("randevu-al.html");
    return;
  }

  /* Adim 4 formunu oturum bilgisiyle on doldur */
  var _hesap = (_oturumRes.data && _oturumRes.data.hesap) ? _oturumRes.data.hesap : {};
  if (_hesap.ad_soyad) {
    var _adInput = document.getElementById("ad-soyad-input");
    if (_adInput) _adInput.value = _hesap.ad_soyad;
  }
  if (_hesap.telefon) {
    var _telInput = document.getElementById("telefon-input");
    if (_telInput) _telInput.value = _hesap.telefon;
  }

  _adim1Baslat();
  _butonlariKur();
  telefonMaskeUygula(document.getElementById("telefon-input"));

  /* A-11: Adim 1 ileri butonu baslangicta disabled — hizmet secilmeden ileri gidilemez */
  var btnIleri1 = document.getElementById("btn-adim1-ileri");
  if (btnIleri1) btnIleri1.disabled = true;

  /* Tarih min = bugun */
  var tarihInput = document.getElementById("tarih-input");
  if (tarihInput) {
    var bugun = new Date().toISOString().slice(0, 10);
    tarihInput.min = bugun;
    tarihInput.addEventListener("change", _tarihDegisti);
  }
});

/* ================================================================
   BUTONLAR
   ================================================================ */
function _butonlariKur() {
  _btn("btn-adim1-ileri", function () { _adim2Gec(); });
  _btn("btn-adim2-geri",  function () { _adimGit(1); });
  _btn("btn-adim2-ileri", function () { _adim3Gec(); });
  _btn("btn-adim3-geri",  function () { _adimGit(2); });
  _btn("btn-adim3-ileri", function () { _adim4Gec(); });
  _btn("btn-adim4-geri",  function () { _adimGit(3); });
  _btn("btn-randevu-al",  function () { _formuGonder(); });
}

function _btn(id, fn) {
  var el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

/* ================================================================
   ADIM NAVIGASYON
   ================================================================ */
function _adimGit(n) {
  _state.aktifAdim = n;

  /* Gizle/goster */
  for (var i = 1; i <= 4; i++) {
    var sec = document.getElementById("step-" + i);
    if (sec) sec.classList.toggle("is-active", i === n);
  }

  /* Progress guncelle */
  for (var j = 1; j <= 4; j++) {
    var prog = document.getElementById("prog-" + j);
    if (!prog) continue;
    prog.classList.remove("is-active", "is-done");
    if (j < n)      prog.classList.add("is-done");
    else if (j === n) prog.classList.add("is-active");

    /* Connector line */
    var line = document.getElementById("line-" + j);
    if (line) line.style.background = j < n ? "var(--color-success)" : "var(--color-border)";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ================================================================
   ADIM 1 — Hizmet secimi
   ================================================================ */
async function _adim1Baslat() {
  var container = document.getElementById("hizmet-sec-container");
  var tabContainer = document.getElementById("hizmet-tablar-sec");
  if (!container) return;

  container.innerHTML = '<div class="loading-row"><span class="spinner"></span><span>Hizmetler yükleniyor…</span></div>';

  var res = await apiGet("/api/genel/hizmetler.php");

  if (!res || !res.success) {
    bosDurum(container, "Hizmetler yüklenemedi. Sayfayı yenileyin.", _ikon('alert', 40));
    return;
  }

  _tumHizmetler = res.data || [];

  if (_tumHizmetler.length === 0) {
    bosDurum(container, "Şu an aktif hizmet bulunmuyor.", _ikon('scissors', 40));
    return;
  }

  /* Kategoriler */
  if (tabContainer) {
    var kategoriler = _benzersizKat(_tumHizmetler);
    _secTablarRender(tabContainer, kategoriler);
  }

  _hizmetSecListeRender(container, _tumHizmetler, "tumu");
}

function _benzersizKat(liste) {
  var gorulen = Object.create(null);
  var result  = [];
  liste.forEach(function (h) {
    if (h.kategori && !gorulen[h.kategori]) { gorulen[h.kategori] = true; result.push(h.kategori); }
  });
  return result;
}

function _secTablarRender(tabContainer, kategoriler) {
  var html = '<button class="tab-btn is-active" data-kat="tumu" role="tab">Tümü</button>';
  kategoriler.forEach(function (k) {
    html += '<button class="tab-btn" data-kat="' + _esc(k) + '" role="tab">' + _esc(k) + '</button>';
  });
  tabContainer.innerHTML = html;

  tabContainer.querySelectorAll(".tab-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabContainer.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var kat = btn.getAttribute("data-kat");
      var c = document.getElementById("hizmet-sec-container");
      if (c) _hizmetSecListeRender(c, _tumHizmetler, kat);
    });
  });
}

function _hizmetSecListeRender(container, liste, kat) {
  var filtered = (kat === "tumu") ? liste.slice() : liste.filter(function (h) { return h.kategori === kat; });

  /* Populer once */
  filtered.sort(function (a, b) {
    var pa = a.populer_mi ? 1 : 0;
    var pb = b.populer_mi ? 1 : 0;
    if (pb !== pa) return pb - pa;
    return (parseInt(a.siralama, 10) || 999) - (parseInt(b.siralama, 10) || 999);
  });

  if (filtered.length === 0) {
    bosDurum(container, "Bu kategoride hizmet bulunamadı.", _ikon('scissors', 40));
    return;
  }

  var html = '<div class="hizmet-sec-grid">';
  filtered.forEach(function (h) {
    var secili = _state.hizmetIdler.indexOf(h.hizmet_id) !== -1;
    var popBadge = h.populer_mi ? '<span class="badge badge--gold" style="margin-bottom:var(--space-2);">' + _ikon('sparkles',12) + ' Popüler</span><br>' : '';
    html += (
      '<label class="check-card' + (secili ? ' is-selected' : '') + '" data-hizmet-id="' + h.hizmet_id + '">' +
        '<input type="checkbox" ' + (secili ? 'checked' : '') + ' aria-label="' + _esc(h.hizmet_adi) + '" data-hizmet-id="' + h.hizmet_id + '">' +
        '<div class="check-card__body">' +
          popBadge +
          '<div class="check-card__title">' + _esc(h.hizmet_adi) + '</div>' +
          '<div class="check-card__meta">' +
            '<span>' + _ikon('clock',12) + ' ' + _esc(String(h.sure_dakika)) + ' dk</span>' +
            ' &nbsp; ' +
            '<span class="text-gold fw-semibold">' + formatTL(h.fiyat) + '</span>' +
          '</div>' +
        '</div>' +
      '</label>'
    );
  });
  html += '</div>';
  container.innerHTML = html;

  /* Event listener'lar */
  container.querySelectorAll('input[type="checkbox"]').forEach(function (chk) {
    chk.addEventListener("change", function () {
      _hizmetToggle(chk, parseInt(chk.getAttribute("data-hizmet-id"), 10));
    });
  });
}

function _hizmetToggle(chk, hizmetId) {
  var label = chk.closest(".check-card");
  if (chk.checked) {
    if (_state.hizmetIdler.indexOf(hizmetId) === -1) {
      _state.hizmetIdler.push(hizmetId);
      var hizmet = _tumHizmetler.filter(function (h) { return h.hizmet_id === hizmetId; })[0];
      if (hizmet) _state.hizmetler.push(hizmet);
    }
    if (label) label.classList.add("is-selected");
  } else {
    _state.hizmetIdler = _state.hizmetIdler.filter(function (id) { return id !== hizmetId; });
    _state.hizmetler   = _state.hizmetler.filter(function (h) { return h.hizmet_id !== hizmetId; });
    if (label) label.classList.remove("is-selected");
  }

  /* Reset zinciri: hizmet degisince personel/tarih/saat sifirla */
  _state.personelId    = null;
  _state.personelAd    = "";
  _state.personelUnvan = "";
  _state.tarih         = "";
  _state.saat          = "";

  _ozetGuncelle();

  var btnIleri = document.getElementById("btn-adim1-ileri");
  if (btnIleri) btnIleri.disabled = _state.hizmetIdler.length === 0;
}

/* ================================================================
   ADIM 2 — Personel secimi
   ================================================================ */
async function _adim2Gec() {
  if (_state.hizmetIdler.length === 0) return;
  _adimGit(2);

  var container = document.getElementById("personel-sec-container");
  if (!container) return;

  container.innerHTML = '<div class="loading-row"><span class="spinner"></span><span>Personeller yükleniyor…</span></div>';

  var res = await apiPost("/api/genel/hizmete_gore_personeller.php", {
    hizmet_idler: _state.hizmetIdler
  });

  if (!res || !res.success) {
    container.innerHTML = '<div class="info-box">Personel listesi alınamadı. Lütfen tekrar deneyin.</div>';
    return;
  }

  var liste = res.data || [];

  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<span class="empty-state__icon">🔍</span>' +
        '<p class="empty-state__title">Seçtiğiniz hizmetlerin tamamını veren personel yok.</p>' +
        '<p class="empty-state__desc">Lütfen hizmet seçiminizi azaltın ve tekrar deneyin.</p>' +
        '<button class="btn btn-ghost" onclick="_adimGit(1)" style="margin-top:var(--space-5);">← Hizmet Seçimine Dön</button>' +
      '</div>';
    return;
  }

  var html = '<div class="personel-sec-grid">';
  liste.forEach(function (p) {
    var initials = (p.ad_soyad || "?").split(" ").map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase();
    html += (
      '<button class="personel-sec-btn" type="button" data-personel-id="' + p.personel_id + '" aria-label="' + _esc(p.ad_soyad) + ' seç">' +
        '<div class="avatar"><span>' + _esc(initials) + '</span></div>' +
        '<div class="personel-sec-btn__ad">' + _esc(p.ad_soyad) + '</div>' +
        (p.unvan ? '<div class="personel-sec-btn__unvan">' + _esc(p.unvan) + '</div>' : '') +
      '</button>'
    );
  });
  html += '</div>';
  container.innerHTML = html;

  /* Onceden secili ise isaretla */
  container.querySelectorAll(".personel-sec-btn").forEach(function (btn) {
    var pid = parseInt(btn.getAttribute("data-personel-id"), 10);
    if (pid === _state.personelId) btn.classList.add("is-selected");

    btn.addEventListener("click", function () {
      container.querySelectorAll(".personel-sec-btn").forEach(function (b) { b.classList.remove("is-selected"); });
      btn.classList.add("is-selected");

      var p = liste.filter(function (x) { return x.personel_id === pid; })[0] || {};
      _state.personelId    = pid;
      _state.personelAd    = p.ad_soyad  || "";
      _state.personelUnvan = p.unvan     || "";

      /* Reset zinciri: personel degisince tarih+saat sifirla */
      _state.tarih = "";
      _state.saat  = "";
      _tarihInputSifirla();

      _ozetGuncelle();

      var btnIleri = document.getElementById("btn-adim2-ileri");
      if (btnIleri) btnIleri.disabled = false;
    });
  });

  /* Eger onceden secim yapilmissa ileri aktif */
  var btnIleri2 = document.getElementById("btn-adim2-ileri");
  if (btnIleri2) btnIleri2.disabled = (_state.personelId === null);
}

/* ================================================================
   ADIM 3 — Tarih + saat
   ================================================================ */
function _adim3Gec() {
  if (!_state.personelId) return;
  _adimGit(3);

  /* Onceki tarih secili ise saat listesini tekrar yukle */
  var tarihInput = document.getElementById("tarih-input");
  if (tarihInput) {
    tarihInput.value = _state.tarih || "";
    if (_state.tarih) _saatleriYukle(_state.tarih);
  }
}

async function _tarihDegisti() {
  var tarihInput = document.getElementById("tarih-input");
  if (!tarihInput) return;
  var tarih = tarihInput.value;

  if (!tarih) return;

  if (tarihGecmis(tarih)) {
    toast("Geçmiş tarih seçilemez.", "warning");
    tarihInput.value = "";
    return;
  }

  /* Reset: tarih degisince saat sifirla */
  _state.tarih = tarih;
  _state.saat  = "";
  _ozetGuncelle();

  var btnIleri = document.getElementById("btn-adim3-ileri");
  if (btnIleri) btnIleri.disabled = true;

  await _saatleriYukle(tarih);
}

async function _saatleriYukle(tarih) {
  var container = document.getElementById("slot-container");
  if (!container) return;

  container.innerHTML = '<div class="loading-row"><span class="spinner"></span><span>Müsait saatler yükleniyor…</span></div>';

  var res = await apiPost("/api/genel/uygun_saatler.php", {
    personel_id:    _state.personelId,
    hizmet_idler:   _state.hizmetIdler,
    randevu_tarihi: tarih
  });

  if (!res || !res.success) {
    container.innerHTML = '<div class="info-box">Saat bilgisi alınamadı. Lütfen tekrar deneyin.</div>';
    return;
  }

  var slots = (res.data && res.data.slots) ? res.data.slots : [];

  if (slots.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-8) 0;">' +
        '<span class="empty-state__icon">' + _ikon('calendar',40) + '</span>' +
        '<p class="empty-state__title">Bu günde uygun saat yok.</p>' +
        '<p class="empty-state__desc">Lütfen başka bir tarih seçin.</p>' +
      '</div>';
    return;
  }

  var gruplar = slotGrupla(slots);
  var html = "";
  var grupAdlar = { sabah: "Sabah", oglen: "Öğlen", aksam: "Akşam" };
  var gruplar2  = [
    { key: "sabah",  label: grupAdlar.sabah,  icon: "🌅" },
    { key: "oglen",  label: grupAdlar.oglen,  icon: "☀️" },
    { key: "aksam",  label: grupAdlar.aksam,  icon: "🌆" }
  ];

  gruplar2.forEach(function (g) {
    var listesi = gruplar[g.key];
    if (!listesi || listesi.length === 0) return;
    html += '<div class="slot-group-label">' + g.icon + ' ' + g.label + '</div>';
    html += '<div class="slot-grid">';
    listesi.forEach(function (s) {
      var secili = s === _state.saat;
      html += '<button class="slot-btn' + (secili ? ' is-selected' : '') + '" type="button" data-saat="' + _esc(s) + '" aria-pressed="' + (secili ? 'true' : 'false') + '">' + _esc(s) + '</button>';
    });
    html += '</div>';
  });

  container.innerHTML = html;

  container.querySelectorAll(".slot-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      container.querySelectorAll(".slot-btn").forEach(function (b) {
        b.classList.remove("is-selected");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-selected");
      btn.setAttribute("aria-pressed", "true");
      _state.saat = btn.getAttribute("data-saat");
      _ozetGuncelle();

      var btnIleri = document.getElementById("btn-adim3-ileri");
      if (btnIleri) btnIleri.disabled = false;
    });
  });
}

function _adim4Gec() {
  if (!_state.saat) return;
  _adimGit(4);
}

function _tarihInputSifirla() {
  var tarihInput = document.getElementById("tarih-input");
  if (tarihInput) tarihInput.value = "";
  var slotContainer = document.getElementById("slot-container");
  if (slotContainer) slotContainer.innerHTML = "";
  var btnIleri = document.getElementById("btn-adim3-ileri");
  if (btnIleri) btnIleri.disabled = true;
}

/* ================================================================
   ADIM 4 — Form submit
   ================================================================ */
async function _formuGonder() {
  /* Dogrulama */
  var adSoyadInput = document.getElementById("ad-soyad-input");
  var telefonInput = document.getElementById("telefon-input");
  var emailInput   = document.getElementById("email-input");
  var hataMi = false;

  /* ad_soyad */
  if (!gerekli(adSoyadInput.value)) {
    _formHataGoster("ad-soyad-input", "ad-soyad-error", "Ad Soyad zorunludur.");
    hataMi = true;
  } else { _formHataSil("ad-soyad-input", "ad-soyad-error"); }

  /* telefon */
  var telefonHam = telefonInput.value.replace(/\D/g, "");
  if (!telefonGecerli(telefonHam)) {
    _formHataGoster("telefon-input", "telefon-error", "Geçerli bir telefon numarası girin. (0555 555 55 55)");
    hataMi = true;
  } else { _formHataSil("telefon-input", "telefon-error"); }

  /* email (opsiyonel ama doluysa gecerli olmali) */
  var emailDeger = emailInput ? emailInput.value.trim() : "";
  if (emailDeger && !emailGecerli(emailDeger)) {
    _formHataGoster("email-input", "email-error", "Geçerli bir e-posta adresi girin.");
    hataMi = true;
  } else if (emailInput) { _formHataSil("email-input", "email-error"); }

  if (hataMi) return;

  /* Cift-submit engeli — A-14: ui.js'deki global submitBasla kullaniliyor */
  var btn = document.getElementById("btn-randevu-al");
  var geriAl = submitBasla(btn);

  var notlarInput = document.getElementById("notlar-input");
  var notlar = notlarInput ? notlarInput.value.trim() : "";

  var body = {
    ad_soyad:       adSoyadInput.value.trim(),
    telefon:        telefonHam,
    hizmet_idler:   _state.hizmetIdler,
    personel_id:    _state.personelId,
    randevu_tarihi: _state.tarih,
    baslangic_saati:_state.saat
  };
  if (emailDeger) body.email = emailDeger;
  if (notlar)     body.notlar = notlar;

  var res = await apiPost("/api/genel/randevu_olustur.php", body);

  geriAl();

  if (!res) return; /* 401 redirect oldu */

  if (!res.success) {
    /* 409/422: form hatasi */
    var err = res.errors || {};
    if (err.baslangic_saati || err.randevu_tarihi ||
        res.message.indexOf("çakış") !== -1 || res.message.indexOf("uygun") !== -1 ||
        res.message.indexOf("Secilen saat") !== -1 || res.message.indexOf("mevcut.") !== -1) {
      toast(res.message || "Seçilen saat uygun değil. Lütfen farklı bir saat deneyin.", "error");
      _adimGit(3);
    } else if (err.telefon) {
      _formHataGoster("telefon-input", "telefon-error", err.telefon[0] || "Geçersiz telefon.");
    } else if (err.ad_soyad) {
      _formHataGoster("ad-soyad-input", "ad-soyad-error", err.ad_soyad[0] || "Geçersiz ad soyad.");
    } else {
      toast(res.message || "Randevu oluşturulamadı.", "error");
    }
    return;
  }

  /* Basari */
  var data = res.data || {};
  _basariGoster(data);
}

/* ================================================================
   BASARI EKRANI
   ================================================================ */
function _basariGoster(data) {
  /* Wizard ve summary gizle */
  var layout = document.getElementById("apptLayout");
  var progressBar = document.getElementById("progressBar");
  if (layout) layout.style.display = "none";
  if (progressBar) progressBar.style.display = "none";

  var screen = document.getElementById("successScreen");
  if (!screen) return;

  var oz = data.ozet || {};

  /* Hizmet satırları */
  var hizmetSatirlari = "";
  if (oz.hizmetler && oz.hizmetler.length) {
    oz.hizmetler.forEach(function (h) {
      hizmetSatirlari +=
        '<div style="display:flex;justify-content:space-between;font-size:var(--font-size-xs);' +
          'color:var(--color-text-2);padding-block:2px;">' +
          '<span>' + _esc(h.hizmet_adi) + '</span>' +
          '<span class="font-mono">' + formatTL(h.fiyat) + '</span>' +
        '</div>';
    });
  }

  screen.innerHTML =
    '<div class="success-icon" aria-hidden="true">' + _ikon('check', 40) + '</div>' +
    '<h1 class="success-title">Randevunuz Oluşturuldu!</h1>' +

    /* Özet kutusu */
    (oz.randevu_tarihi
      ? '<div class="success-code-wrap" style="text-align:left;margin-bottom:var(--space-5);">' +
          '<div class="success-code-label" style="margin-bottom:var(--space-3);">Randevu Özeti</div>' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);font-size:var(--font-size-sm);">' +
            '<div><span style="color:var(--color-text-3);">Tarih</span><br>' +
              '<strong>' + formatTarih(oz.randevu_tarihi) + '</strong></div>' +
            '<div><span style="color:var(--color-text-3);">Saat</span><br>' +
              '<strong class="font-mono">' +
                _esc(oz.baslangic_saati ? oz.baslangic_saati.slice(0,5) : "") + ' – ' +
                _esc(oz.bitis_saati     ? oz.bitis_saati.slice(0,5)     : "") +
              '</strong></div>' +
            '<div style="grid-column:1/-1;"><span style="color:var(--color-text-3);">Personel</span><br>' +
              '<strong>' + _esc(oz.personel_ad) + '</strong>' +
              (oz.personel_unvan
                ? ' <small style="color:var(--color-gold);">' + _esc(oz.personel_unvan) + '</small>'
                : '') +
            '</div>' +
          '</div>' +
          (hizmetSatirlari
            ? '<div style="border-top:1px solid var(--color-border);margin-top:var(--space-3);padding-top:var(--space-3);">' +
                hizmetSatirlari +
                '<div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);' +
                  'font-weight:600;border-top:1px solid var(--color-border);margin-top:var(--space-2);padding-top:var(--space-2);">' +
                  '<span>Toplam</span>' +
                  '<span class="font-mono" style="color:var(--color-gold);">' + formatTL(oz.toplam_tutar) + '</span>' +
                '</div>' +
              '</div>'
            : '') +
        '</div>'
      : '') +

    durumRozeti(data.durum || "beklemede") +
    '<p style="color:var(--color-text-3);font-size:var(--font-size-sm);margin-top:var(--space-4);">' +
      'Randevunuzu "Randevularım" sayfasından takip edebilirsiniz.' +
    '</p>' +
    '<div class="success-actions">' +
      '<a href="randevularim.html" class="btn btn-primary">Randevularıma Git</a>' +
      '<a href="index.html" class="btn btn-ghost">Ana Sayfaya Dön</a>' +
    '</div>';

  screen.classList.add("is-visible");
  screen.scrollIntoView({ behavior: "smooth", block: "start" });

}

/* ================================================================
   OZET GUNCELLE
   ================================================================ */
function _ozetGuncelle() {
  var container = document.getElementById("ozet-icerik");
  if (!container) return;

  if (_state.hizmetIdler.length === 0) {
    container.innerHTML = '<div class="ozet-bos">Henüz seçim yapılmadı.</div>';
    return;
  }

  var toplamSure  = 0;
  var toplamTutar = 0;
  var hizmetListesi = '<ul class="ozet-hizmetler">';
  _state.hizmetler.forEach(function (h) {
    toplamSure  += parseInt(h.sure_dakika, 10) || 0;
    toplamTutar += parseFloat(h.fiyat)         || 0;
    hizmetListesi += '<li><span>' + _esc(h.hizmet_adi) + '</span><span>' + formatTL(h.fiyat) + '</span></li>';
  });
  hizmetListesi += '</ul>';

  var html = '<div class="ozet-satir">' +
    '<span class="ozet-satir__etiket">Hizmetler</span>' +
    '<div class="ozet-satir__deger">' + hizmetListesi + '<small style="color:var(--color-text-3);">Toplam ' + toplamSure + ' dk</small></div>' +
  '</div>';

  if (_state.personelAd) {
    html += '<div class="ozet-satir"><span class="ozet-satir__etiket">Personel</span><span class="ozet-satir__deger">' + _esc(_state.personelAd) + (_state.personelUnvan ? '<br><small class="text-gold">' + _esc(_state.personelUnvan) + '</small>' : '') + '</span></div>';
  }
  if (_state.tarih) {
    html += '<div class="ozet-satir"><span class="ozet-satir__etiket">Tarih</span><span class="ozet-satir__deger">' + formatTarih(_state.tarih) + '</span></div>';
  }
  if (_state.saat) {
    html += '<div class="ozet-satir"><span class="ozet-satir__etiket">Saat</span><span class="ozet-satir__deger font-mono">' + _esc(_state.saat) + '</span></div>';
  }

  html += '<div class="ozet-toplam"><span class="ozet-toplam__etiket">Toplam Tutar</span><span class="ozet-toplam__tutar">' + formatTL(toplamTutar) + '</span></div>';

  container.innerHTML = html;
}

/* ================================================================
   YARDIMCILAR
   ================================================================ */
function _formHataGoster(inputId, errorId, msg) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
}

function _formHataSil(inputId, errorId) {
  var input = document.getElementById(inputId);
  var errEl = document.getElementById(errorId);
  if (input) {
    input.classList.remove("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.remove("has-error");
  }
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
}

/* A-14: _submitBasla kaldirildi; ui.js'deki global submitBasla() kullaniliyor */
/* A-13: _esc kaldirildi; ui.js'deki global _esc() kullaniliyor */

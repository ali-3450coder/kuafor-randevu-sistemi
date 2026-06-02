/* ===============================================================
   admin/appointments.js — filtre + durum guncelleme + detay modali
   Client-side cakisma rozeti YOK (gorev kurali)
   =============================================================== */

var _randevuListesi  = [];
var _personelListesi = [];
var _iptalRandevuId  = null;
var _iptalSubmitting = false; /* cift-submit engeli */

/* A-03: URL'den musteri_hesap_id parametresi okunur */
var _musteriHesapId = new URLSearchParams(window.location.search).get("musteri_hesap_id") || "";

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
        '<h1 class="page-header__title">Randevular</h1>' +
        '<p class="page-header__subtitle">' +
          (_musteriHesapId
            ? 'Seçili müşterinin randevuları. <a href="randevular.html" style="color:var(--color-gold);">Tümünü göster →</a>'
            : 'Tüm randevuları görüntüleyin ve yönetin.') +
        '</p>' +
      '</div>' +
      /* A-01: Admin walk-in randevu oluşturma butonu */
      (window._adminUser && window._adminUser.rol === 'admin'
        ? '<div class="page-header__actions">' +
            '<button class="btn btn-primary" type="button" onclick="walkInRandevuAc()">+ Randevu Ekle</button>' +
          '</div>'
        : '') +
    '</div>' +

    '<div class="filter-bar">' +
      '<div class="form-group">' +
        '<label class="form-label" for="f-durum">Durum</label>' +
        '<select class="input" id="f-durum">' +
          '<option value="">Tümü</option>' +
          '<option value="beklemede">Beklemede</option>' +
          '<option value="onaylandi">Onaylandı</option>' +
          '<option value="tamamlandi">Tamamlandı</option>' +
          '<option value="iptal">İptal</option>' +
          '<option value="gelmedi">Gelmedi</option>' +
        '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label" for="f-tarih">Tarih</label>' +
        '<input type="date" class="input" id="f-tarih">' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label" for="f-personel">Personel</label>' +
        '<select class="input" id="f-personel">' +
          '<option value="">Tüm Personel</option>' +
        '</select>' +
      '</div>' +

      '<div class="form-group">' +
        '<label class="form-label" for="f-musteri">Müşteri Ara</label>' +
        '<input type="search" class="input" id="f-musteri" placeholder="Ad veya telefon…" autocomplete="off">' +
      '</div>' +

      '<div class="form-group" style="flex:0;">' +
        '<label class="form-label" style="visibility:hidden;">X</label>' +
        '<div style="display:flex;gap:var(--space-1);">' +
          '<button class="btn btn-ghost btn-sm" id="btn-f-bugun" type="button" onclick="_bugunFiltrele()">Bugün</button>' +
          '<button class="btn btn-ghost" id="btn-f-sifirla" type="button">Sıfırla</button>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="card" style="padding:0;overflow:hidden;" id="randevu-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Yükleniyor…</span>' +
      '</div>' +
    '</div>';

  _personelDropdownYukle();
  _listeYukle();

  document.getElementById("f-durum").addEventListener("change",   _listeYukle);
  document.getElementById("f-tarih").addEventListener("change",   _listeYukle);
  document.getElementById("f-personel").addEventListener("change",_listeYukle);
  document.getElementById("f-musteri").addEventListener("input",  _listeYukle);
  document.getElementById("btn-f-sifirla").addEventListener("click", _sifirla);
}

/* ================================================================
   PERSONEL DROPDOWN
   ================================================================ */
async function _personelDropdownYukle() {
  var res = await apiGet("/api/yonetim/personeller.php");
  if (!res || !res.success) return;
  _personelListesi = res.data || [];
  var sel = document.getElementById("f-personel");
  if (!sel) return;
  _personelListesi.forEach(function (p) {
    var opt = document.createElement("option");
    opt.value       = p.personel_id;
    opt.textContent = p.ad_soyad;
    sel.appendChild(opt);
  });
}

/* ================================================================
   LISTE YUKLE
   ================================================================ */
async function _listeYukle() {
  var container = document.getElementById("randevu-tablo");
  if (!container) return;

  container.innerHTML =
    '<div class="loading-row" style="padding:var(--space-6);">' +
      '<span class="spinner"></span><span>Yükleniyor…</span>' +
    '</div>';

  var durum      = document.getElementById("f-durum")    ? document.getElementById("f-durum").value    : "";
  var tarih      = document.getElementById("f-tarih")    ? document.getElementById("f-tarih").value    : "";
  var personelId = document.getElementById("f-personel") ? document.getElementById("f-personel").value : "";

  var musteriAra = document.getElementById("f-musteri") ? document.getElementById("f-musteri").value.trim() : "";

  var params = [];
  if (durum)           params.push("status="           + encodeURIComponent(durum));
  if (tarih)           params.push("date="             + encodeURIComponent(tarih));
  if (personelId)      params.push("personel_id="      + encodeURIComponent(personelId));
  if (_musteriHesapId) params.push("musteri_hesap_id=" + encodeURIComponent(_musteriHesapId));
  if (musteriAra)      params.push("musteri_ara="      + encodeURIComponent(musteriAra));

  var url = "/api/yonetim/randevular.php" + (params.length ? "?" + params.join("&") : "");
  var res = await apiGet(url);

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' + _ikon('alert',16) + ' Liste yüklenemedi.</p>';
    return;
  }

  _randevuListesi = res.data || [];
  _tabloRender(container, _randevuListesi);
}

/* ================================================================
   TABLO RENDER
   ================================================================ */
function _tabloRender(container, liste) {
  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon('calendar',40) + '</span>' +
        '<p class="empty-state__title">Randevu bulunamadı.</p>' +
        '<p class="empty-state__desc">Filtre kriterlerini değiştirmeyi deneyin.</p>' +
      '</div>';
    return;
  }

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Kod</th><th>Müşteri</th><th>Personel</th>' +
      '<th>Tarih / Saat</th><th>Hizmet</th><th>Tutar</th>' +
      '<th>Durum</th><th class="col-actions">İşlem</th>' +
    '</tr></thead><tbody>';

  liste.forEach(function (r) {
    var saat =
      _esc(r.baslangic_saati ? r.baslangic_saati.slice(0, 5) : "-") + " – " +
      _esc(r.bitis_saati     ? r.bitis_saati.slice(0, 5)     : "-");

    var kodSafe = (r.randevu_kodu || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

    html +=
      '<tr>' +
        '<td style="white-space:nowrap;">' +
          '<span class="font-mono" style="font-size:var(--font-size-xs);color:var(--color-gold);">' +
            _esc(r.randevu_kodu) +
          '</span>' +
          ' <button class="btn btn-ghost btn-sm" type="button"' +
            ' style="padding:1px 5px;font-size:10px;vertical-align:middle;"' +
            ' title="Kodu kopyala" onclick="kopyala(\'' + kodSafe + '\',this)">' + _ikon('clipboard',12) + '</button>' +
        '</td>' +
        '<td>' + _esc(r.musteri_ad_soyad)  + '</td>' +
        '<td>' + _esc(r.personel_ad_soyad) + '</td>' +
        '<td>' +
          '<div style="font-size:var(--font-size-sm);">' + formatTarih(r.randevu_tarihi) + '</div>' +
          '<div class="font-mono" style="font-size:var(--font-size-xs);color:var(--color-text-3);">' + saat + '</div>' +
        '</td>' +
        '<td style="font-size:var(--font-size-sm);">' + _esc(String(r.hizmet_sayisi || 0)) + ' hizmet</td>' +
        '<td class="font-mono" style="font-size:var(--font-size-sm);">' + formatTL(r.toplam_tutar) + '</td>' +
        '<td>' + durumRozeti(r.durum) + '</td>' +
        '<td class="col-actions">' + _aksiyonHtml(r) + '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function _aksiyonHtml(r) {
  var isAdmin = window._adminUser && window._adminUser.rol === "admin";
  var html =
    '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;flex-wrap:wrap;">';

  /* Detay her zaman gosterilir */
  html += '<button class="btn btn-ghost btn-sm" type="button"' +
    ' onclick="randevuDetayAc(' + r.randevu_id + ')">Detay</button>';

  if (r.durum === "beklemede") {
    html +=
      '<button class="btn btn-sm" type="button"' +
        ' style="background:var(--color-info-bg);color:var(--color-info);border:1px solid var(--color-info);"' +
        ' onclick="randevuDurumGuncelle(' + r.randevu_id + ',\'onaylandi\')">Onayla</button>';
    if (isAdmin) {
      html +=
        '<button class="btn btn-ghost btn-sm" type="button"' +
          ' onclick="randevuDuzenleAc(' + r.randevu_id + ')">Düzenle</button>' +
        '<button class="btn btn-sm btn-danger" type="button"' +
          ' onclick="randevuIptalAc(' + r.randevu_id + ')">İptal</button>' +
        '<button class="btn btn-sm btn-danger" type="button"' +
          ' onclick="randevuSil(' + r.randevu_id + ')" title="Kalıcı sil">' +
          _esc("Sil") + '</button>';
    }
  } else if (r.durum === "onaylandi") {
    html +=
      '<button class="btn btn-sm btn-success" type="button"' +
        ' onclick="randevuDurumGuncelle(' + r.randevu_id + ',\'tamamlandi\')">Tamamlandı</button>' +
      '<button class="btn btn-sm" type="button"' +
        ' style="background:var(--color-muted-bg);color:var(--color-muted);border:1px solid var(--color-muted);"' +
        ' onclick="randevuDurumGuncelle(' + r.randevu_id + ',\'gelmedi\')">Gelmedi</button>';
    if (isAdmin) {
      html +=
        '<button class="btn btn-ghost btn-sm" type="button"' +
          ' onclick="randevuDuzenleAc(' + r.randevu_id + ')">Düzenle</button>' +
        '<button class="btn btn-sm btn-danger" type="button"' +
          ' onclick="randevuIptalAc(' + r.randevu_id + ')">İptal</button>';
    }
  } else if (isAdmin) {
    /* Final state (tamamlandi/iptal/gelmedi) — admin sadece silmek isteyebilir */
    html +=
      '<button class="btn btn-sm btn-danger" type="button"' +
        ' onclick="randevuSil(' + r.randevu_id + ')" title="Kalıcı sil">Sil</button>';
  }

  html += '</div>';
  return html;
}

function _sifirla() {
  ["f-durum", "f-tarih", "f-personel", "f-musteri"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  _listeYukle();
}

/* B-04: Bugün kısa yolu */
function _bugunFiltrele() {
  var d = new Date();
  var bugun = d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
  var tarihEl = document.getElementById("f-tarih");
  if (tarihEl) tarihEl.value = bugun;
  _listeYukle();
}

/* ================================================================
   RANDEVU SIL (admin only — kalici)
   ================================================================ */

/**
 * Randevuyu kalıcı olarak siler. Confirm dialog ile onay alır.
 * @param {number} randevuId
 */
async function randevuSil(randevuId) {
  if (!confirm("Bu randevuyu kalıcı olarak silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz.")) return;

  var res = await apiPost("/api/yonetim/randevu_sil.php", { randevu_id: randevuId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Randevu silinemedi.", "error"); return; }
  toast("Randevu kalıcı olarak silindi.", "success");
  _listeYukle();
}

/* ================================================================
   RANDEVU DUZENLEME (admin only — tarih/saat/personel degistir)
   ================================================================ */

var _duzenleRandevuId  = null;
var _duzenleSubmitting = false;

/**
 * Randevu düzenleme modalını açar.
 * @param {number} randevuId
 */
function randevuDuzenleAc(randevuId) {
  _duzenleRandevuId  = randevuId;
  _duzenleSubmitting = false;

  var r = _randevuListesi.find(function (x) { return x.randevu_id === randevuId; });
  if (!r) { toast("Randevu bulunamadı.", "error"); return; }

  /* Tarih ve saati doldur */
  var tarihEl = document.getElementById("duz-tarih");
  var saatEl  = document.getElementById("duz-saat");
  var persEl  = document.getElementById("duz-personel");

  if (tarihEl) tarihEl.value = r.randevu_tarihi || "";
  if (saatEl)  saatEl.value  = r.baslangic_saati ? r.baslangic_saati.slice(0, 5) : "";

  /* Personel dropdown'u doldur */
  if (persEl) {
    persEl.innerHTML = "";
    _personelListesi.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value       = p.personel_id;
      opt.textContent = p.ad_soyad;
      if (p.personel_id === r.personel_id) opt.selected = true;
      persEl.appendChild(opt);
    });
  }

  var btnEl = document.getElementById("btn-duz-kaydet");
  if (btnEl) { btnEl.disabled = false; btnEl.textContent = "Kaydet"; }

  acModal("modal-duzenle");
}

/**
 * Düzenlenmiş randevu bilgilerini kaydeder.
 */
async function randevuDuzenleKaydet() {
  if (_duzenleSubmitting) return;

  var tarih  = document.getElementById("duz-tarih")    ? document.getElementById("duz-tarih").value    : "";
  var saat   = document.getElementById("duz-saat")     ? document.getElementById("duz-saat").value     : "";
  var persId = document.getElementById("duz-personel") ? document.getElementById("duz-personel").value : "";

  if (!tarih || !saat || !persId) {
    toast("Tüm alanları doldurun.", "warning");
    return;
  }

  var btn = document.getElementById("btn-duz-kaydet");
  _duzenleSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var res = await apiPost("/api/yonetim/randevu_guncelle.php", {
    randevu_id:      _duzenleRandevuId,
    randevu_tarihi:  tarih,
    baslangic_saati: saat,
    personel_id:     parseInt(persId, 10)
  });

  _duzenleSubmitting = false;
  if (btn) { btn.disabled = false; btn.textContent = "Kaydet"; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Güncelleme başarısız.", "error"); return; }

  kapatModal("modal-duzenle");
  toast("Randevu güncellendi.", "success");
  _listeYukle();
}

/* ================================================================
   GLOBAL AKSIYON FONKSIYONLARI (inline onclick'ten cagriliyor)
   ================================================================ */

/**
 * Randevu durumunu günceller. İptal dışı durum geçişleri için kullanılır.
 * @param {number} randevuId
 * @param {'onaylandi'|'tamamlandi'|'gelmedi'} durum
 */
async function randevuDurumGuncelle(randevuId, durum) {
  var res = await apiPost("/api/yonetim/randevu_durum_guncelle.php", {
    randevu_id: randevuId,
    durum:      durum
  });
  if (!res) return;
  if (!res.success) { toast(res.message || "Durum güncellenemedi.", "error"); return; }
  toast((DURUM_ETIKET[durum] || durum) + " olarak işaretlendi.", "success");
  _listeYukle();
}

/**
 * İptal onay modalını açar; neden alanını ve hata durumunu sıfırlar.
 * @param {number} randevuId
 */
function randevuIptalAc(randevuId) {
  _iptalRandevuId  = randevuId;
  _iptalSubmitting = false;
  var ta = document.getElementById("iptal-neden");
  if (ta) ta.value = "";
  _iptalHataSil();
  var btn = document.getElementById("btn-iptal-onayla");
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  acModal("modal-iptal");
}

/**
 * Randevu detay modalını açar; API'den müşteri, personel, hizmet ve ödeme bilgilerini çeker.
 * @param {number} randevuId
 */
async function randevuDetayAc(randevuId) {
  var icerik = document.getElementById("modal-detay-body");
  if (icerik) {
    icerik.innerHTML =
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Detaylar yükleniyor…</span>' +
      '</div>';
  }
  acModal("modal-detay");

  var res = await apiGet("/api/yonetim/randevu_detay.php?id=" + randevuId);
  if (!icerik) return;

  if (!res || !res.success) {
    icerik.innerHTML =
      '<p style="color:var(--color-danger);padding:var(--space-4);">' + _ikon('alert',16) + ' Detay yüklenemedi.</p>';
    return;
  }

  var d  = res.data    || {};
  var r  = d.randevu   || {};
  var hz = d.hizmetler || [];
  var o  = d.odeme     || {};

  var hzRows = hz.map(function (h) {
    return '<tr><td>' + _esc(h.hizmet_adi) + '</td>' +
      '<td>' + _esc(String(h.sure_dakika)) + ' dk</td>' +
      '<td class="font-mono">' + formatTL(h.fiyat) + '</td></tr>';
  }).join("");

  var detayKodSafe = (r.randevu_kodu || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  icerik.innerHTML =
    _dRow("Randevu Kodu",
      '<span class="font-mono" style="color:var(--color-gold);">' + _esc(r.randevu_kodu) + '</span>' +
      ' <button class="btn btn-ghost btn-sm" type="button"' +
        ' style="padding:1px 5px;font-size:10px;vertical-align:middle;" title="Kopyala"' +
        ' onclick="kopyala(\'' + detayKodSafe + '\',this)">' + _ikon('clipboard',12) + '</button>') +
    _dRow("Durum",    durumRozeti(r.durum)) +
    _dRow("Müşteri",  _esc(r.musteri_ad)) +
    _dRow("Telefon",  _esc(r.musteri_telefon)) +
    (r.musteri_email ? _dRow("E-posta", _esc(r.musteri_email)) : "") +
    _dRow("Personel",
      _esc(r.personel_ad) +
      (r.personel_unvan
        ? ' <small style="color:var(--color-gold);">' + _esc(r.personel_unvan) + '</small>' : "")) +
    _dRow("Tarih", formatTarih(r.randevu_tarihi)) +
    _dRow("Saat",
      '<span class="font-mono">' +
        _esc(r.baslangic_saati ? r.baslangic_saati.slice(0, 5) : "-") + " – " +
        _esc(r.bitis_saati     ? r.bitis_saati.slice(0, 5)     : "-") +
      '</span>') +
    (r.notlar ? _dRow("Not", _esc(r.notlar)) : "") +
    (r.iptal_nedeni
      ? '<div style="background:var(--color-danger-bg);border:1px solid rgba(224,84,84,.3);' +
          'border-radius:var(--radius-md);padding:var(--space-4);margin-block:var(--space-4);' +
          'font-size:var(--font-size-sm);color:var(--color-danger);">İptal Nedeni: ' +
          _esc(r.iptal_nedeni) + '</div>'
      : "") +

    '<div style="font-size:var(--font-size-xs);font-weight:600;color:var(--color-text-3);' +
      'text-transform:uppercase;letter-spacing:.07em;margin-top:var(--space-5);margin-bottom:var(--space-3);">Hizmetler</div>' +
    '<div class="table-wrapper" style="margin-bottom:var(--space-5);">' +
    '<table class="table"><thead><tr><th>Hizmet</th><th>Süre</th><th>Fiyat</th></tr></thead>' +
    '<tbody>' + hzRows + '</tbody></table></div>' +

    '<div style="font-size:var(--font-size-xs);font-weight:600;color:var(--color-text-3);' +
      'text-transform:uppercase;letter-spacing:.07em;margin-bottom:var(--space-3);">Ödeme</div>' +
    _dRow("Ödeme Durumu", durumRozeti(o.odeme_durumu, "odeme")) +
    _dRow("Yöntem", ODEME_TIPI_ETIKET[o.odeme_tipi] || (o.odeme_tipi || "-")) +
    _dRow("Tutar",
      '<span class="font-mono" style="color:var(--color-gold);font-weight:700;">' +
        formatTL(o.tutar || r.tutar) +
      '</span>');
}

function _dRow(label, value) {
  return (
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;' +
      'gap:var(--space-4);font-size:var(--font-size-sm);padding-block:var(--space-2);' +
      'border-bottom:1px solid var(--color-border);">' +
      '<span style="color:var(--color-text-3);flex-shrink:0;">' + label + '</span>' +
      '<span style="color:var(--color-text);font-weight:500;text-align:right;">' + value + '</span>' +
    '</div>'
  );
}

/* ================================================================
   IPTAL MODAL
   ================================================================ */
function _iptalHataGoster(msg) {
  var errEl = document.getElementById("iptal-neden-error");
  var input = document.getElementById("iptal-neden");
  if (errEl) { errEl.textContent = msg; errEl.classList.add("is-visible"); }
  if (input) {
    input.classList.add("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.add("has-error");
  }
}

function _iptalHataSil() {
  var errEl = document.getElementById("iptal-neden-error");
  var input = document.getElementById("iptal-neden");
  if (errEl) { errEl.textContent = ""; errEl.classList.remove("is-visible"); }
  if (input) {
    input.classList.remove("is-invalid");
    var grp = input.closest(".form-group");
    if (grp) grp.classList.remove("has-error");
  }
}

/**
 * İptal nedenini doğrular ve randevuyu iptal durumuna geçirir.
 * Çift-submit'i `_iptalSubmitting` bayrağıyla engeller.
 */
async function iptalKaydet() {
  if (_iptalSubmitting) return;

  var textarea = document.getElementById("iptal-neden");
  var neden    = textarea ? textarea.value.trim() : "";
  if (!gerekli(neden)) { _iptalHataGoster("İptal nedeni zorunludur."); return; }
  _iptalHataSil();

  var btn = document.getElementById("btn-iptal-onayla");
  _iptalSubmitting = true;
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }

  var res = await apiPost("/api/yonetim/randevu_durum_guncelle.php", {
    randevu_id:   _iptalRandevuId,
    durum:        "iptal",
    iptal_nedeni: neden
  });

  _iptalSubmitting = false;
  if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  if (!res) return;
  if (!res.success) { toast(res.message || "İptal işlemi başarısız.", "error"); return; }

  kapatModal("modal-iptal");
  toast("Randevu iptal edildi.", "success");
  _listeYukle();
}

/* ================================================================
   MODAL HTML INJECT — body'e bir kez eklenir
   ================================================================ */
function _modallarEkle() {
  /* ---- iptal-modal ---- */
  var iptalEl = document.createElement("div");
  iptalEl.className = "modal-overlay";
  iptalEl.id        = "modal-iptal";
  iptalEl.setAttribute("role",            "dialog");
  iptalEl.setAttribute("aria-modal",      "true");
  iptalEl.setAttribute("aria-labelledby", "iptal-modal-title");
  iptalEl.setAttribute("aria-hidden",     "true");
  iptalEl.innerHTML =
    '<div class="modal modal--sm">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="iptal-modal-title">Randevu İptal</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-iptal\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<p style="font-size:var(--font-size-sm);color:var(--color-text-2);margin-bottom:var(--space-4);">' +
          'Bu randevuyu iptal etmek istediğinizden emin misiniz?' +
        '</p>' +
        '<div class="form-group">' +
          '<label class="form-label" for="iptal-neden">' +
            'İptal Nedeni <span class="required-mark" aria-hidden="true">*</span>' +
          '</label>' +
          '<textarea class="input" id="iptal-neden" rows="3"' +
            ' placeholder="Lütfen iptal nedenini belirtin…" style="resize:vertical;"></textarea>' +
          '<span class="form-error" id="iptal-neden-error"></span>' +
        '</div>' +
      '</div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-iptal\')">Vazgeç</button>' +
        '<button class="btn btn-danger" type="button" id="btn-iptal-onayla"' +
          ' onclick="iptalKaydet()">İptal Et</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(iptalEl);

  /* ---- detay-modal ---- */
  var detayEl = document.createElement("div");
  detayEl.className = "modal-overlay";
  detayEl.id        = "modal-detay";
  detayEl.setAttribute("role",            "dialog");
  detayEl.setAttribute("aria-modal",      "true");
  detayEl.setAttribute("aria-labelledby", "detay-modal-title");
  detayEl.setAttribute("aria-hidden",     "true");
  detayEl.innerHTML =
    '<div class="modal" style="max-width:580px;">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="detay-modal-title">Randevu Detayı</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-detay\')">' + _ikon('x',16) + '</button>' +
      '</div>' +
      '<div class="modal__body" id="modal-detay-body"' +
        ' style="max-height:65vh;overflow-y:auto;"></div>' +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-detay\')">Kapat</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(detayEl);

  /* ---- Randevu Duzenleme Modal (admin only) ---- */
  var duzEl = document.createElement("div");
  duzEl.className = "modal-overlay";
  duzEl.id        = "modal-duzenle";
  duzEl.setAttribute("role",            "dialog");
  duzEl.setAttribute("aria-modal",      "true");
  duzEl.setAttribute("aria-labelledby", "duzenle-modal-title");
  duzEl.setAttribute("aria-hidden",     "true");
  duzEl.innerHTML =
    '<div class="modal modal--sm">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="duzenle-modal-title">Randevu Düzenle</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-duzenle\')">' + _ikon("x", 16) + "</button>" +
      "</div>" +
      '<div class="modal__body">' +
        '<div class="form-group">' +
          '<label class="form-label" for="duz-tarih">Yeni Tarih <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="date" class="input" id="duz-tarih">' +
        "</div>" +
        '<div class="form-group">' +
          '<label class="form-label" for="duz-saat">Yeni Başlangıç Saati <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<input type="time" class="input" id="duz-saat">' +
        "</div>" +
        '<div class="form-group">' +
          '<label class="form-label" for="duz-personel">Personel <span class="required-mark" aria-hidden="true">*</span></label>' +
          '<select class="input" id="duz-personel"></select>' +
        "</div>" +
        '<p style="font-size:var(--font-size-xs);color:var(--color-text-3);margin-top:var(--space-2);">' +
          'Bitiş saati mevcut hizmetlerin toplam süresinden otomatik hesaplanır.' +
        "</p>" +
      "</div>" +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button"' +
          ' onclick="kapatModal(\'modal-duzenle\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-duz-kaydet"' +
          ' onclick="randevuDuzenleKaydet()">Kaydet</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(duzEl);

  /* ---- Walk-in Randevu Modal (admin only) ---- */
  var wiEl = document.createElement("div");
  wiEl.className = "modal-overlay";
  wiEl.id        = "modal-walkin";
  wiEl.setAttribute("role",            "dialog");
  wiEl.setAttribute("aria-modal",      "true");
  wiEl.setAttribute("aria-labelledby", "walkin-modal-title");
  wiEl.setAttribute("aria-hidden",     "true");
  wiEl.innerHTML =
    '<div class="modal">' +
      '<div class="modal__header">' +
        '<h2 class="modal__title" id="walkin-modal-title">Randevu Ekle</h2>' +
        '<button class="modal__close" type="button" aria-label="Kapat"' +
          ' onclick="kapatModal(\'modal-walkin\')">' + _ikon("x", 16) + "</button>" +
      "</div>" +
      '<div class="modal__body">' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="wi-ad">Müşteri Adı <span class="required-mark">*</span></label>' +
            '<input type="text" class="input" id="wi-ad" placeholder="Ad Soyad" autocomplete="off">' +
            '<span class="form-error" id="wi-ad-err"></span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="wi-tel">Telefon <span class="required-mark">*</span></label>' +
            '<input type="tel" class="input" id="wi-tel" placeholder="05__ ___ __ __" inputmode="numeric">' +
            '<span class="form-error" id="wi-tel-err"></span>' +
          '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="wi-personel">Personel <span class="required-mark">*</span></label>' +
          '<select class="input" id="wi-personel"><option value="">Seçin…</option></select>' +
          '<span class="form-error" id="wi-personel-err"></span>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Hizmet(ler) <span class="required-mark">*</span></label>' +
          '<div id="wi-hizmetler" style="display:flex;flex-direction:column;gap:var(--space-1);max-height:160px;overflow-y:auto;"></div>' +
          '<span class="form-error" id="wi-hizmet-err"></span>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4);">' +
          '<div class="form-group">' +
            '<label class="form-label" for="wi-tarih">Tarih <span class="required-mark">*</span></label>' +
            '<input type="date" class="input" id="wi-tarih">' +
            '<span class="form-error" id="wi-tarih-err"></span>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label" for="wi-saat">Saat <span class="required-mark">*</span></label>' +
            '<input type="time" class="input" id="wi-saat">' +
            '<span class="form-error" id="wi-saat-err"></span>' +
          '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label" for="wi-not">Not</label>' +
          '<textarea class="input" id="wi-not" rows="2" placeholder="Opsiyonel…"></textarea>' +
        '</div>' +

      "</div>" +
      '<div class="modal__footer">' +
        '<button class="btn btn-ghost" type="button" onclick="kapatModal(\'modal-walkin\')">Vazgeç</button>' +
        '<button class="btn btn-primary" type="button" id="btn-walkin-kaydet" onclick="walkInKaydet()">Randevu Oluştur</button>' +
      "</div>" +
    "</div>";
  document.body.appendChild(wiEl);
}

/* ================================================================
   WALK-IN RANDEVU — A-01
   ================================================================ */
var _wiSubmitting = false;

async function walkInRandevuAc() {
  _wiSubmitting = false;

  /* Formu sıfırla */
  ["wi-ad", "wi-tel", "wi-tarih", "wi-saat", "wi-not"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["wi-ad-err","wi-tel-err","wi-personel-err","wi-hizmet-err","wi-tarih-err","wi-saat-err"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = ""; el.classList.remove("is-visible"); }
  });

  /* Telefon mask uygula */
  var telEl = document.getElementById("wi-tel");
  if (telEl && typeof telefonMaskeUygula === "function") telefonMaskeUygula(telEl);

  /* Tarih min = bugün */
  var tarihEl = document.getElementById("wi-tarih");
  if (tarihEl) tarihEl.min = new Date().toISOString().slice(0, 10);

  /* Personel listesini doldur */
  var persEl = document.getElementById("wi-personel");
  if (persEl) {
    persEl.innerHTML = '<option value="">Seçin…</option>';
    _personelListesi.forEach(function (p) {
      if (!p.durum) return;
      var opt = document.createElement("option");
      opt.value = p.personel_id;
      opt.textContent = p.ad_soyad + (p.unvan ? " — " + p.unvan : "");
      persEl.appendChild(opt);
    });
  }

  /* Hizmet listesini doldur (API'den çek) */
  var hizDiv = document.getElementById("wi-hizmetler");
  if (hizDiv) {
    hizDiv.innerHTML = '<span class="spinner" style="display:inline-block;"></span>';
    var hRes = await apiGet("/api/yonetim/hizmetler.php");
    var hizmetler = (hRes && hRes.success) ? (hRes.data || []).filter(function(h){ return h.durum; }) : [];
    hizDiv.innerHTML = hizmetler.map(function (h) {
      return '<label style="display:flex;align-items:center;gap:var(--space-2);font-size:var(--font-size-sm);cursor:pointer;padding:2px 0;">' +
        '<input type="checkbox" class="wi-hizmet-chk" value="' + h.hizmet_id + '"> ' +
        _esc(h.hizmet_adi) + ' <small style="color:var(--color-text-3);">(' + h.sure_dakika + ' dk · ' + formatTL(h.fiyat) + ')</small>' +
      '</label>';
    }).join("");
  }

  var btn = document.getElementById("btn-walkin-kaydet");
  if (btn) { btn.disabled = false; btn.textContent = "Randevu Oluştur"; }

  acModal("modal-walkin");
}

async function walkInKaydet() {
  if (_wiSubmitting) return;

  var ad      = (document.getElementById("wi-ad")  ? document.getElementById("wi-ad").value.trim() : "");
  var telRaw  = (document.getElementById("wi-tel") ? document.getElementById("wi-tel").value.replace(/\D/g, "") : "");
  var persId  = document.getElementById("wi-personel") ? parseInt(document.getElementById("wi-personel").value, 10) : 0;
  var tarih   = document.getElementById("wi-tarih") ? document.getElementById("wi-tarih").value : "";
  var saat    = document.getElementById("wi-saat")  ? document.getElementById("wi-saat").value  : "";
  var not     = document.getElementById("wi-not")   ? document.getElementById("wi-not").value.trim() : "";

  var chkler = document.querySelectorAll(".wi-hizmet-chk:checked");
  var hizmetIdler = Array.from(chkler).map(function (c) { return parseInt(c.value, 10); });

  var hataMi = false;
  var hataGoster = function(errId, msg) {
    var el = document.getElementById(errId);
    if (el) { el.textContent = msg; el.classList.add("is-visible"); }
    hataMi = true;
  };
  var hataSil = function(errId) {
    var el = document.getElementById(errId);
    if (el) { el.textContent = ""; el.classList.remove("is-visible"); }
  };

  if (!ad || ad.length < 2) hataGoster("wi-ad-err", "Ad Soyad zorunludur."); else hataSil("wi-ad-err");
  if (typeof telefonGecerli === "function" && !telefonGecerli(telRaw)) hataGoster("wi-tel-err", "Geçerli telefon girin."); else hataSil("wi-tel-err");
  if (!persId)                   hataGoster("wi-personel-err", "Personel seçin."); else hataSil("wi-personel-err");
  if (hizmetIdler.length === 0)  hataGoster("wi-hizmet-err", "En az bir hizmet seçin."); else hataSil("wi-hizmet-err");
  if (!tarih)                    hataGoster("wi-tarih-err", "Tarih seçin."); else hataSil("wi-tarih-err");
  if (!saat)                     hataGoster("wi-saat-err", "Saat seçin."); else hataSil("wi-saat-err");

  if (hataMi) return;

  var btn = document.getElementById("btn-walkin-kaydet");
  _wiSubmitting = true;
  if (btn) { btn.disabled = true; btn.textContent = "Kaydediliyor…"; }

  var body = {
    musteri_ad:      ad,
    musteri_telefon: telRaw,
    personel_id:     persId,
    hizmet_idler:    hizmetIdler,
    randevu_tarihi:  tarih,
    baslangic_saati: saat,
  };
  if (not) body.notlar = not;

  var res = await apiPost("/api/yonetim/randevu_olustur_admin.php", body);

  _wiSubmitting = false;
  if (btn) { btn.disabled = false; btn.textContent = "Randevu Oluştur"; }
  if (!res) return;
  if (!res.success) { toast(res.message || "Randevu oluşturulamadı.", "error"); return; }

  kapatModal("modal-walkin");
  toast("Randevu oluşturuldu.", "success");
  _listeYukle();
}

/* _esc() ui.js'de global olarak tanimlidir — A-13 */

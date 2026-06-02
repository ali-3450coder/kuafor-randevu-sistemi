/* ===============================================================
   admin/customers.js — liste + client-side arama
   GET /api/yonetim/musteriler.php
   Arama: ad_soyad, telefon, email (client-side)
   =============================================================== */

var _musteriListesiTumu = [];

document.addEventListener("adminLayoutReady", function () {
  _musterilerYukle();
});

/* ================================================================
   YUKLE
   ================================================================ */
async function _musterilerYukle() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Müşteriler</h1>' +
        '<p class="page-header__subtitle">Kayıtlı tüm müşterileri görüntüleyin ve arayın.</p>' +
      '</div>' +
    '</div>' +

    '<div class="filter-bar">' +
      '<div class="form-group" style="flex:1;max-width:400px;">' +
        '<label class="form-label" for="musteri-ara">Ara</label>' +
        '<input type="search" class="input" id="musteri-ara"' +
          ' placeholder="Ad, telefon veya e-posta…" autocomplete="off">' +
      '</div>' +
    '</div>' +

    '<div class="card" style="padding:0;overflow:hidden;" id="musteri-tablo">' +
      '<div class="loading-row" style="padding:var(--space-6);">' +
        '<span class="spinner"></span><span>Müşteriler yükleniyor…</span>' +
      '</div>' +
    '</div>';

  var res = await apiGet("/api/yonetim/musteriler.php");
  var container = document.getElementById("musteri-tablo");
  if (!container) return;

  if (!res || !res.success) {
    container.innerHTML =
      '<p style="padding:var(--space-6);color:var(--color-danger);">' + _ikon('alert',16) + ' Müşteriler yüklenemedi.</p>';
    return;
  }

  _musteriListesiTumu = res.data || [];
  _musteriTabloRender(container, _musteriListesiTumu);

  /* Client-side arama */
  var araInput = document.getElementById("musteri-ara");
  if (araInput) {
    araInput.addEventListener("input", function () {
      var q = araInput.value.trim().toLowerCase();
      var filtrelenmis = !q
        ? _musteriListesiTumu
        : _musteriListesiTumu.filter(function (m) {
            return (
              (m.ad_soyad || "").toLowerCase().includes(q) ||
              (m.telefon  || "").toLowerCase().includes(q) ||
              (m.email    || "").toLowerCase().includes(q)
            );
          });
      _musteriTabloRender(container, filtrelenmis);
    });
  }
}

/* ================================================================
   TABLO RENDER
   ================================================================ */
function _musteriTabloRender(container, liste) {
  if (liste.length === 0) {
    container.innerHTML =
      '<div class="empty-state" style="padding:var(--space-10);">' +
        '<span class="empty-state__icon">' + _ikon('users', 40) + '</span>' +
        '<p class="empty-state__title">Müşteri bulunamadı.</p>' +
        '<p class="empty-state__desc">Arama kriterini değiştirmeyi deneyin.</p>' +
      '</div>';
    return;
  }

  var html =
    '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Ad Soyad</th>' +
      '<th>Telefon</th>' +
      '<th>E-posta</th>' +
      '<th style="text-align:center;">Randevu</th>' +
      '<th>Son Randevu</th>' +
      '<th>Aldığı Hizmetler</th>' +
      '<th>Personeller</th>' +
      '<th class="col-actions">İşlem</th>' +
    '</tr></thead><tbody>';

  liste.forEach(function (m) {
    var hizmetler  = _truncate(m.aldigi_hizmetler   || "-", 60);
    var personeller = _truncate(m.sectigi_personeller || "-", 40);
    var sonTarih   = m.son_randevu_tarihi ? formatTarih(m.son_randevu_tarihi) : "-";

    html +=
      '<tr>' +
        '<td style="font-weight:500;">' + _esc(m.ad_soyad) + '</td>' +
        '<td class="font-mono" style="font-size:var(--font-size-xs);">' +
          _esc(m.telefon || "-") +
        '</td>' +
        '<td style="font-size:var(--font-size-xs);">' + _esc(m.email || "-") + '</td>' +
        '<td style="text-align:center;font-weight:600;">' +
          _esc(String(m.randevu_sayisi || 0)) +
        '</td>' +
        '<td style="font-size:var(--font-size-sm);">' + sonTarih + '</td>' +
        '<td style="font-size:var(--font-size-xs);color:var(--color-text-2);max-width:180px;">' +
          _esc(hizmetler) +
        '</td>' +
        '<td style="font-size:var(--font-size-xs);color:var(--color-text-2);">' +
          _esc(personeller) +
        '</td>' +
        '<td class="col-actions">' +
          '<div style="display:flex;gap:var(--space-1);justify-content:flex-end;">' +
            '<a class="btn btn-ghost btn-sm" href="randevular.html?musteri_ara=' + encodeURIComponent(m.telefon || "") + '">' +
              _esc(String(m.randevu_sayisi || 0)) + ' randevu →' +
            '</a>' +
            '<button class="btn btn-sm btn-danger" type="button"' +
              ' onclick="musteriSil(' + m.musteri_id + ',\'' + _esc(m.ad_soyad) + '\')">Sil</button>' +
          '</div>' +
        '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div>';
  container.innerHTML = html;
}

/* ================================================================
   MÜŞTERİ SİL
   ================================================================ */

/**
 * Müşteriyi ve bağlı tüm randevu geçmişini kalıcı siler.
 * @param {number} musteriId
 * @param {string} adSoyad
 */
async function musteriSil(musteriId, adSoyad) {
  if (!confirm(
    '"' + adSoyad + '" müşterisini ve tüm randevu geçmişini kalıcı olarak silmek istediğinizden emin misiniz?\n' +
    'Bu işlem GERİ ALINAMAZ.'
  )) return;

  var res = await apiPost("/api/yonetim/musteri_sil.php", { musteri_id: musteriId });
  if (!res) return;
  if (!res.success) { toast(res.message || "Silinemedi.", "error"); return; }

  var silinenRandevu = res.data && res.data.silinen_randevu ? res.data.silinen_randevu : 0;
  toast(
    adSoyad + " silindi." + (silinenRandevu > 0 ? " (" + silinenRandevu + " randevu da silindi)" : ""),
    "success"
  );
  _musterilerYukle();
}

/* ================================================================
   YARDIMCILAR (sadece bu dosya)
   ================================================================ */
function _truncate(s, len) {
  if (!s) return "-";
  return s.length > len ? s.slice(0, len) + "…" : s;
}

/* _esc() ui.js'de global olarak tanimlidir — A-13 */

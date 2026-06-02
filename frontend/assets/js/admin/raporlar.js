/* ===============================================================
   admin/raporlar.js — İstatistik raporları
   GET /api/yonetim/raporlar.php?tip=hizmet|personel|aylik
   =============================================================== */

var _aktifRaporTip = "hizmet";

document.addEventListener("adminLayoutReady", function () {
  _raporSayfaKur();
});

function _raporSayfaKur() {
  var main = document.getElementById("adminMain");
  if (!main) return;

  main.innerHTML =
    '<div class="page-header">' +
      '<div class="page-header__left">' +
        '<h1 class="page-header__title">Raporlar</h1>' +
        '<p class="page-header__subtitle">Hizmet, personel ve aylık gelir istatistikleri.</p>' +
      '</div>' +
    '</div>' +

    '<div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-6);">' +
      '<button class="btn btn-primary btn-sm"  id="r-hizmet"   onclick="raporYukle(\'hizmet\')">Hizmet İstatistiği</button>' +
      '<button class="btn btn-ghost btn-sm"    id="r-personel" onclick="raporYukle(\'personel\')">Personel Performansı</button>' +
      '<button class="btn btn-ghost btn-sm"    id="r-aylik"    onclick="raporYukle(\'aylik\')">Aylık Trend</button>' +
    '</div>' +

    '<div id="rapor-icerik">' +
      '<div class="loading-row" style="padding:var(--space-8) 0;"><span class="spinner"></span><span>Yükleniyor…</span></div>' +
    '</div>';

  raporYukle("hizmet");
}

async function raporYukle(tip) {
  _aktifRaporTip = tip;

  ["hizmet","personel","aylik"].forEach(function(k) {
    var btn = document.getElementById("r-" + k);
    if (!btn) return;
    btn.className = (k === tip) ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm";
  });

  var container = document.getElementById("rapor-icerik");
  if (!container) return;
  container.innerHTML = '<div class="loading-row" style="padding:var(--space-6) 0;"><span class="spinner"></span><span>Yükleniyor…</span></div>';

  var res = await apiGet("/api/yonetim/raporlar.php?tip=" + tip);
  if (!res || !res.success) {
    container.innerHTML = '<p style="color:var(--color-danger);">Rapor yüklenemedi.</p>';
    return;
  }

  var veriler = res.data.veriler || [];

  if (veriler.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:var(--space-10) 0;"><p class="empty-state__title">Henüz veri yok.</p></div>';
    return;
  }

  var html = "";

  if (tip === "hizmet") {
    html = '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Hizmet</th><th style="text-align:right;">Randevu</th>' +
      '<th style="text-align:right;">Toplam Gelir</th><th style="text-align:right;">Ort. Fiyat</th>' +
      '</tr></thead><tbody>';
    veriler.forEach(function(r) {
      html += '<tr>' +
        '<td style="font-weight:500;">' + _esc(r.hizmet_adi) + '</td>' +
        '<td style="text-align:right;">' + _esc(String(r.randevu_sayisi)) + '</td>' +
        '<td style="text-align:right;" class="font-mono">' + formatTL(r.toplam_gelir) + '</td>' +
        '<td style="text-align:right;" class="font-mono">' + formatTL(r.ortalama_fiyat) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';

  } else if (tip === "personel") {
    html = '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Personel</th><th style="text-align:right;">Toplam</th>' +
      '<th style="text-align:right;">Tamamlanan</th><th style="text-align:right;">İptal</th>' +
      '<th style="text-align:right;">Gelir (Ödendi)</th>' +
      '</tr></thead><tbody>';
    veriler.forEach(function(r) {
      html += '<tr>' +
        '<td style="font-weight:500;">' + _esc(r.personel_ad) + '</td>' +
        '<td style="text-align:right;">' + _esc(String(r.toplam_randevu)) + '</td>' +
        '<td style="text-align:right;color:var(--color-success);">' + _esc(String(r.tamamlanan)) + '</td>' +
        '<td style="text-align:right;color:var(--color-danger);">'  + _esc(String(r.iptal)) + '</td>' +
        '<td style="text-align:right;" class="font-mono">' + formatTL(r.toplam_gelir) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';

  } else if (tip === "aylik") {
    html = '<div class="table-wrapper"><table class="table"><thead><tr>' +
      '<th>Ay</th><th style="text-align:right;">Randevu</th>' +
      '<th style="text-align:right;">Tamamlanan</th><th style="text-align:right;">Gelir</th>' +
      '</tr></thead><tbody>';
    veriler.forEach(function(r) {
      html += '<tr>' +
        '<td class="font-mono">' + _esc(r.ay) + '</td>' +
        '<td style="text-align:right;">' + _esc(String(r.randevu_sayisi)) + '</td>' +
        '<td style="text-align:right;color:var(--color-success);">' + _esc(String(r.tamamlanan)) + '</td>' +
        '<td style="text-align:right;" class="font-mono">' + formatTL(r.gelir) + '</td>' +
      '</tr>';
    });
    html += '</tbody></table></div>';
  }

  container.innerHTML = html;
}

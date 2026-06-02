<?php
/**
 * Dosya   : api/yonetim/yonetim_ozeti.php
 * Gorev   : Dashboard metriklerini dondurur.
 *           ?period=bugun|bu_hafta|bu_ay ile randevu/gelir filtrelenebilir.
 *           period yoksa tum zamanlar icin hesaplanir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

// B-06: Zaman filtresi
$izinliPeriodlar = ['bugun', 'bu_hafta', 'bu_ay'];
$period = (!empty($_GET['period']) && in_array($_GET['period'], $izinliPeriodlar, true))
    ? $_GET['period']
    : 'tumü';

$tarihKosulu = '';
switch ($period) {
    case 'bugun':
        $tarihKosulu = "AND DATE(randevu_tarihi) = CURDATE()";
        break;
    case 'bu_hafta':
        $tarihKosulu = "AND YEARWEEK(randevu_tarihi, 1) = YEARWEEK(CURDATE(), 1)";
        break;
    case 'bu_ay':
        $tarihKosulu = "AND YEAR(randevu_tarihi) = YEAR(CURDATE()) AND MONTH(randevu_tarihi) = MONTH(CURDATE())";
        break;
}

$odemeKosulu = '';
switch ($period) {
    case 'bugun':
        $odemeKosulu = "AND DATE(o.olusturma_tarihi) = CURDATE()";
        break;
    case 'bu_hafta':
        $odemeKosulu = "AND YEARWEEK(o.olusturma_tarihi, 1) = YEARWEEK(CURDATE(), 1)";
        break;
    case 'bu_ay':
        $odemeKosulu = "AND YEAR(o.olusturma_tarihi) = YEAR(CURDATE()) AND MONTH(o.olusturma_tarihi) = MONTH(CURDATE())";
        break;
}

$pdo = getDb();

$sql = "SELECT
    (SELECT COUNT(*)                 FROM randevular        WHERE 1=1 $tarihKosulu)                                       AS toplam_randevular,
    (SELECT COUNT(*)                 FROM randevular        WHERE durum='beklemede' $tarihKosulu)                         AS bekleyen_randevular,
    (SELECT COUNT(*)                 FROM randevular        WHERE durum='onaylandi' $tarihKosulu)                         AS onaylanan_randevular,
    (SELECT COUNT(*)                 FROM randevular        WHERE durum='tamamlandi' $tarihKosulu)                        AS tamamlanan_randevular,
    (SELECT COUNT(*)                 FROM randevular        WHERE durum='iptal' $tarihKosulu)                             AS iptal_randevular,
    (SELECT COUNT(*)                 FROM musteriler)                                                                      AS toplam_musteri,
    (SELECT COUNT(*)                 FROM personeller       WHERE durum=1)                                                 AS aktif_personel,
    (SELECT COUNT(*)                 FROM hizmetler         WHERE durum=1)                                                 AS aktif_hizmet,
    (SELECT COUNT(*)                 FROM odemeler          WHERE odeme_durumu='bekliyor')                                 AS bekleyen_odeme,
    (SELECT COALESCE(SUM(o.tutar),0) FROM odemeler o       WHERE o.odeme_durumu='odendi' $odemeKosulu)                   AS toplam_gelir";

$row = $pdo->query($sql)->fetch();

Response::ok([
    'period'    => $period,
    'metrikler' => [
        'toplam_randevular'     => (int)$row['toplam_randevular'],
        'bekleyen_randevular'   => (int)$row['bekleyen_randevular'],
        'onaylanan_randevular'  => (int)$row['onaylanan_randevular'],
        'tamamlanan_randevular' => (int)$row['tamamlanan_randevular'],
        'iptal_randevular'      => (int)$row['iptal_randevular'],
        'toplam_musteri'        => (int)$row['toplam_musteri'],
        'aktif_personel'        => (int)$row['aktif_personel'],
        'aktif_hizmet'          => (int)$row['aktif_hizmet'],
        'bekleyen_odeme'        => (int)$row['bekleyen_odeme'],
        'toplam_gelir'          => (float)$row['toplam_gelir'],
    ],
]);

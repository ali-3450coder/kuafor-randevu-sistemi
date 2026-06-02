<?php
/**
 * Dosya   : api/yonetim/musteri_hesaplari.php
 * Gorev   : Kayitli musteri hesaplarini randevu sayisiyla birlikte listeler.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo  = getDb();
$stmt = $pdo->query(
    "SELECT mh.hesap_id, mh.ad_soyad, mh.telefon, mh.email,
            mh.durum, mh.kayit_tarihi, mh.son_giris_tarihi,
            COUNT(DISTINCT r.randevu_id) AS toplam_randevu
     FROM musteri_hesaplari mh
     LEFT JOIN musteriler m  ON m.hesap_id  = mh.hesap_id
     LEFT JOIN randevular r  ON r.musteri_id = m.musteri_id
     GROUP BY mh.hesap_id
     ORDER BY mh.kayit_tarihi DESC"
);

$rows = $stmt->fetchAll();
foreach ($rows as &$row) {
    $row['durum']          = (int)$row['durum'];
    $row['toplam_randevu'] = (int)$row['toplam_randevu'];
}
unset($row);

Response::list($rows);

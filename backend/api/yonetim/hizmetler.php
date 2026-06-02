<?php
/**
 * Dosya   : api/yonetim/hizmetler.php
 * Gorev   : Tum hizmetleri (aktif + pasif) listeler; durum alani cevapta yer alir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo  = getDb();

// Amac: yonetim paneli icin tum hizmetler; durum filtresi yok
$stmt = $pdo->query(
    'SELECT hizmet_id, hizmet_adi, aciklama, sure_dakika, fiyat,
            kategori, populer_mi, siralama, durum, olusturma_tarihi
     FROM hizmetler
     ORDER BY siralama ASC, hizmet_adi ASC'
);

Response::list($stmt->fetchAll());

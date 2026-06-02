<?php
/**
 * Dosya   : api/yonetim/personeller.php
 * Gorev   : Tum personelleri (aktif + pasif) listeler; durum alani cevapta yer alir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo  = getDb();

// Amac: yonetim paneli icin tum personeller; durum filtresi yok
$stmt = $pdo->query(
    'SELECT personel_id, ad_soyad, telefon, unvan, bio, durum, kayit_tarihi
     FROM personeller
     ORDER BY kayit_tarihi DESC'
);

Response::list($stmt->fetchAll());

<?php
/**
 * Dosya   : api/yonetim/personel_hizmetleri.php
 * Gorev   : Personele atanmis hizmet ID'lerini dondurur.
 * Query   : ?personel_id=X
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$personelId = isset($_GET['personel_id']) ? (int)$_GET['personel_id'] : 0;
if ($personelId <= 0) {
    Response::fail('Dogrulama hatasi.', ['personel_id' => ['Gecerli personel_id gereklidir.']], 422);
}

$pdo  = getDb();
$stmt = $pdo->prepare(
    'SELECT hizmet_id FROM personel_hizmetleri WHERE personel_id = ? AND durum = 1'
);
$stmt->execute([$personelId]);
$rows = $stmt->fetchAll();

$hizmetIdler = array_map(function ($r) { return (int)$r['hizmet_id']; }, $rows);

Response::ok(['hizmet_idler' => $hizmetIdler]);

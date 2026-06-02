<?php
/**
 * Dosya   : api/yonetim/personel_calisma_saatleri.php
 * Gorev   : Personele ait calisma saatlerini dondurur.
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
// A-10: TIME_FORMAT ile H:i donduruluyor; RandevuServisi::calismaSaatiGetir() ile tutarli
$stmt = $pdo->prepare(
    'SELECT gun,
            TIME_FORMAT(baslangic_saati, \'%H:%i\') AS acilis,
            TIME_FORMAT(bitis_saati,     \'%H:%i\') AS kapanis,
            durum
     FROM calisma_saatleri
     WHERE personel_id = ?
     ORDER BY FIELD(gun, "pazartesi","sali","carsamba","persembe","cuma","cumartesi","pazar")'
);
$stmt->execute([$personelId]);
$saatler = $stmt->fetchAll();

foreach ($saatler as &$s) {
    $s['durum'] = (int)$s['durum'];
}
unset($s);

Response::ok(['saatler' => $saatler]);

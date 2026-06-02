<?php
/**
 * Dosya   : api/yonetim/musteri_hesap_durum.php
 * Gorev   : Musteri hesabini aktif (1) veya pasif (0) yapar. Yalnizca admin yapabilir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hesap_id' => ['required', 'positive_int'],
    'durum'    => ['required', ['enum', [0, 1, '0', '1']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo  = getDb();
$stmt = $pdo->prepare(
    'UPDATE musteri_hesaplari SET durum = ? WHERE hesap_id = ?'
);
$stmt->execute([(int)$body['durum'], (int)$body['hesap_id']]);

if ($stmt->rowCount() === 0) {
    Response::fail('Musteri hesabi bulunamadi.', [], 404);
}

Response::ok([
    'hesap_id' => (int)$body['hesap_id'],
    'durum'    => (int)$body['durum'],
]);

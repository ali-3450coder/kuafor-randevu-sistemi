<?php
/**
 * Dosya   : api/yonetim/personel_guncelle.php
 * Gorev   : Mevcut personel bilgilerini gunceller.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'personel_id' => ['required', 'positive_int'],
    'ad_soyad'    => ['required', ['min_len', 2], ['max_len', 100]],
    'telefon'     => ['required', 'phone'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Personel mevcut mu?
$kontrol = $pdo->prepare('SELECT 1 FROM personeller WHERE personel_id = ? LIMIT 1');
$kontrol->execute([(int)$body['personel_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Personel bulunamadi.', [], 404);
}

$stmt = $pdo->prepare(
    'UPDATE personeller
     SET ad_soyad = ?, telefon = ?, unvan = ?, bio = ?, guncelleme_tarihi = NOW()
     WHERE personel_id = ?'
);
$stmt->execute([
    $body['ad_soyad'],
    $body['telefon'],
    $body['unvan'] ?? null,
    $body['bio']   ?? null,
    (int)$body['personel_id'],
]);

Response::ok(['personel_id' => (int)$body['personel_id']]);

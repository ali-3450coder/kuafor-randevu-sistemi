<?php
/**
 * Dosya   : api/yonetim/personel_ekle.php
 * Gorev   : Yeni personel kaydeder.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'ad_soyad' => ['required', ['min_len', 2], ['max_len', 100]],
    'telefon'  => ['required', 'phone'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo  = getDb();

$stmt = $pdo->prepare(
    'INSERT INTO personeller (ad_soyad, telefon, unvan, bio, durum)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([
    $body['ad_soyad'],
    $body['telefon'],
    $body['unvan'] ?? null,
    $body['bio']   ?? null,
    isset($body['durum']) ? (int)$body['durum'] : 1,
]);

Response::ok(['personel_id' => (int)$pdo->lastInsertId()]);

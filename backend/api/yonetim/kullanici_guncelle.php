<?php
/**
 * Dosya   : api/yonetim/kullanici_guncelle.php
 * Gorev   : Yetkili kullanicinin ad, email ve rolunu gunceller. Sifre bu endpoint'ten degismez.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'kullanici_id' => ['required', 'positive_int'],
    'ad_soyad'     => ['required', ['min_len', 2], ['max_len', 100]],
    'email'        => ['required', 'email'],
    'rol'          => ['required', ['enum', ['admin', 'personel']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Amac: email benzersizligini dogrula (kendi id'si haric)
$kontrol = $pdo->prepare(
    'SELECT 1 FROM kullanicilar WHERE email = ? AND kullanici_id != ? LIMIT 1'
);
$kontrol->execute([$body['email'], (int)$body['kullanici_id']]);
if ($kontrol->fetch()) {
    Response::fail('Dogrulama hatasi.', ['email' => ['Bu e-posta baska bir kullanici tarafindan kullaniliyor.']], 422);
}

$stmt = $pdo->prepare(
    'UPDATE kullanicilar
     SET ad_soyad = ?, email = ?, rol = ?, guncelleme_tarihi = NOW()
     WHERE kullanici_id = ?'
);
$stmt->execute([
    $body['ad_soyad'],
    $body['email'],
    $body['rol'],
    (int)$body['kullanici_id'],
]);

Response::ok(['kullanici_id' => (int)$body['kullanici_id']]);

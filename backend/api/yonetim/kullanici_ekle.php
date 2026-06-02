<?php
/**
 * Dosya   : api/yonetim/kullanici_ekle.php
 * Gorev   : Yeni yetkili kullanici ekler. Yalnizca admin yapabilir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'ad_soyad'  => ['required', ['min_len', 2], ['max_len', 100]],
    'email'     => ['required', 'email'],
    'sifre'     => ['required', ['min_len', 6]],
    'rol'       => ['required', ['enum', ['admin', 'personel']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Amac: email benzersizligini dogrula
$kontrol = $pdo->prepare('SELECT 1 FROM kullanicilar WHERE email = ? LIMIT 1');
$kontrol->execute([$body['email']]);
if ($kontrol->fetch()) {
    Response::fail('Dogrulama hatasi.', ['email' => ['Bu e-posta adresi zaten kullaniliyor.']], 422);
}

$hash = password_hash($body['sifre'], PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'INSERT INTO kullanicilar (ad_soyad, email, sifre_hash, rol)
     VALUES (?, ?, ?, ?)'
);
$stmt->execute([
    $body['ad_soyad'],
    $body['email'],
    $hash,
    $body['rol'],
]);

Response::ok(['kullanici_id' => (int)$pdo->lastInsertId()], 'Kullanici basariyla eklendi.');

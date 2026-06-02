<?php
/**
 * Dosya   : api/musteri/kayit.php
 * Gorev   : Yeni musteri hesabi olusturur.
 * Kural   : Telefon unique (musteri_hesaplari). Sifre min 6 karakter.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'ad_soyad' => ['required', ['min_len', 2], ['max_len', 100]],
    'telefon'  => ['required', 'phone'],
    'sifre'    => ['required', ['min_len', 6]],
]);
if (!empty($body['email'])) {
    $v2 = Validator::check($body, ['email' => ['email']]);
    if (!$v2['ok']) {
        $v['ok']     = false;
        $v['errors'] = array_merge($v['errors'], $v2['errors']);
    }
}

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Telefon benzersizligi kontrolu
$kontrol = $pdo->prepare('SELECT 1 FROM musteri_hesaplari WHERE telefon = ? LIMIT 1');
$kontrol->execute([$body['telefon']]);
if ($kontrol->fetch()) {
    Response::fail('Dogrulama hatasi.', ['telefon' => ['Bu telefon numarasi zaten kayitli.']], 422);
}

// Email benzersizligi (opsiyonel)
if (!empty($body['email'])) {
    $eKontrol = $pdo->prepare('SELECT 1 FROM musteri_hesaplari WHERE email = ? LIMIT 1');
    $eKontrol->execute([$body['email']]);
    if ($eKontrol->fetch()) {
        Response::fail('Dogrulama hatasi.', ['email' => ['Bu e-posta adresi zaten kayitli.']], 422);
    }
}

$hash  = password_hash($body['sifre'], PASSWORD_BCRYPT);
$email = (!empty($body['email'])) ? $body['email'] : null;

$stmt = $pdo->prepare(
    'INSERT INTO musteri_hesaplari (ad_soyad, telefon, email, sifre_hash)
     VALUES (?, ?, ?, ?)'
);
$stmt->execute([
    $body['ad_soyad'],
    $body['telefon'],
    $email,
    $hash,
]);

$hesapId = (int)$pdo->lastInsertId();

// Yeni kayidin kayit_tarihi'ni al
$kayitTarihi = $pdo->query('SELECT kayit_tarihi FROM musteri_hesaplari WHERE hesap_id = ' . $hesapId)->fetchColumn();

MusteriAuth::login([
    'hesap_id'     => $hesapId,
    'ad_soyad'     => $body['ad_soyad'],
    'telefon'      => $body['telefon'],
    'email'        => $email,
    'kayit_tarihi' => $kayitTarihi,
]);

Response::ok(['hesap' => MusteriAuth::user()], 'Kayit basarili.');

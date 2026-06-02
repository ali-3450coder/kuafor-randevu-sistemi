<?php
/**
 * Dosya   : api/musteri/giris.php
 * Gorev   : Musteri telefon + sifre ile giris yapar.
 * Guvenlik: Kullanici yok / sifre yanlis icin ayni 401 (bilgi sizintisi engeli).
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'telefon' => ['required', 'phone'],
    'sifre'   => ['required'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo  = getDb();
$stmt = $pdo->prepare(
    'SELECT hesap_id, ad_soyad, telefon, email, kayit_tarihi, sifre_hash
     FROM musteri_hesaplari
     WHERE telefon = ? AND durum = 1
     LIMIT 1'
);
$stmt->execute([$body['telefon']]);
$hesap = $stmt->fetch();

if (!$hesap || !password_verify($body['sifre'], $hesap['sifre_hash'])) {
    Response::fail('Telefon numarasi veya sifre hatali.', [], 401);
}

// Son giris zamanini guncelle
$pdo->prepare('UPDATE musteri_hesaplari SET son_giris_tarihi = NOW() WHERE hesap_id = ?')
    ->execute([$hesap['hesap_id']]);

MusteriAuth::login([
    'hesap_id'     => $hesap['hesap_id'],
    'ad_soyad'     => $hesap['ad_soyad'],
    'telefon'      => $hesap['telefon'],
    'email'        => $hesap['email'],
    'kayit_tarihi' => $hesap['kayit_tarihi'],
]);

Response::ok(['hesap' => MusteriAuth::user()]);

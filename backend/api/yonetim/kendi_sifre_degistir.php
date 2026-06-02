<?php
/**
 * Dosya   : api/yonetim/kendi_sifre_degistir.php
 * Gorev   : Giris yapan yonetici (admin veya personel) kendi sifresini degistirir.
 *           Eski sifre dogrulama zorunludur.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'eski_sifre' => ['required'],
    'yeni_sifre' => ['required', ['min_len', 6]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$kullaniciId = (int)Auth::user()['id'];
$pdo = getDb();

$stmt = $pdo->prepare('SELECT sifre_hash FROM kullanicilar WHERE kullanici_id = ? LIMIT 1');
$stmt->execute([$kullaniciId]);
$kullanici = $stmt->fetch();

if (!$kullanici || !password_verify($body['eski_sifre'], $kullanici['sifre_hash'])) {
    Response::fail('Mevcut sifre hatali.', ['eski_sifre' => ['Girilen sifre dogru degil.']], 422);
}

$hash = password_hash($body['yeni_sifre'], PASSWORD_BCRYPT);
$pdo->prepare('UPDATE kullanicilar SET sifre_hash = ?, guncelleme_tarihi = NOW() WHERE kullanici_id = ?')
    ->execute([$hash, $kullaniciId]);

Response::ok([], 'Sifre guncellendi.');

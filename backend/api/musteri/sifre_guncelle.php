<?php
/**
 * Dosya   : api/musteri/sifre_guncelle.php
 * Gorev   : Giris yapan musteri kendi sifresini degistirir. Eski sifre dogrulama zorunlu.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php, middleware/musteri_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';
require_once __DIR__ . '/../../middleware/musteri_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body    = Request::json();
$hesapId = (int)MusteriAuth::user()['hesap_id'];

$v = Validator::check($body, [
    'eski_sifre' => ['required'],
    'yeni_sifre' => ['required', ['min_len', 6]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo   = getDb();
$kayit = $pdo->prepare('SELECT sifre_hash FROM musteri_hesaplari WHERE hesap_id = ? LIMIT 1');
$kayit->execute([$hesapId]);
$hesap = $kayit->fetch();

if (!$hesap || !password_verify($body['eski_sifre'], $hesap['sifre_hash'])) {
    Response::fail('Mevcut sifre hatali.', ['eski_sifre' => ['Girilen sifre dogru degil.']], 422);
}

$hash = password_hash($body['yeni_sifre'], PASSWORD_BCRYPT);
$pdo->prepare('UPDATE musteri_hesaplari SET sifre_hash = ? WHERE hesap_id = ?')
    ->execute([$hash, $hesapId]);

Response::ok([], 'Sifre guncellendi.');

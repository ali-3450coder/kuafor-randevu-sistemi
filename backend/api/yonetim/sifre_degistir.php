<?php
/**
 * Dosya   : api/yonetim/sifre_degistir.php
 * Gorev   : Admin, herhangi bir kullanicinin sifresini degistirir.
 *           Eski sifre gerekmez; admin yetkisi yeterlidir.
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
    'yeni_sifre'   => ['required', ['min_len', 6]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Amac: kullanicinin var oldugunu dogrula
$kontrol = $pdo->prepare('SELECT 1 FROM kullanicilar WHERE kullanici_id = ? LIMIT 1');
$kontrol->execute([(int)$body['kullanici_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Kullanici bulunamadi.', [], 404);
}

$hash = password_hash($body['yeni_sifre'], PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    'UPDATE kullanicilar SET sifre_hash = ?, guncelleme_tarihi = NOW() WHERE kullanici_id = ?'
);
$stmt->execute([$hash, (int)$body['kullanici_id']]);

Response::ok(['kullanici_id' => (int)$body['kullanici_id']], 'Sifre basariyla guncellendi.');

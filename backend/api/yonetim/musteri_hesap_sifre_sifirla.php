<?php
/**
 * Dosya   : api/yonetim/musteri_hesap_sifre_sifirla.php
 * Gorev   : Admin, musteri hesabinin sifresini sifirlar. Yalnizca admin yapabilir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hesap_id'   => ['required', 'positive_int'],
    'yeni_sifre' => ['required', ['min_len', 6]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo     = getDb();
$kontrol = $pdo->prepare('SELECT 1 FROM musteri_hesaplari WHERE hesap_id = ? LIMIT 1');
$kontrol->execute([(int)$body['hesap_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Musteri hesabi bulunamadi.', [], 404);
}

$hash = password_hash($body['yeni_sifre'], PASSWORD_BCRYPT);
$pdo->prepare('UPDATE musteri_hesaplari SET sifre_hash = ? WHERE hesap_id = ?')
    ->execute([$hash, (int)$body['hesap_id']]);

Response::ok(['hesap_id' => (int)$body['hesap_id']], 'Musteri sifresi guncellendi.');

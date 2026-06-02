<?php
/**
 * Dosya   : api/yonetim/kullanici_durum_degistir.php
 * Gorev   : Yetkili kullanicinin aktif/pasif durumunu degistirir.
 *           Kural: Admin kendi hesabini devre disi birakamiyor.
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
    'durum'        => ['required', ['enum', [0, 1, '0', '1']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Kendi hesabini devre disi birakamaz
$mevcutUser = Auth::user();
if ((int)$body['kullanici_id'] === (int)$mevcutUser['id']) {
    Response::fail('Kendi hesabinizi devre disi birakamazsiniz.', [], 422);
}

$pdo  = getDb();
$stmt = $pdo->prepare(
    'UPDATE kullanicilar SET durum = ?, guncelleme_tarihi = NOW() WHERE kullanici_id = ?'
);
$stmt->execute([(int)$body['durum'], (int)$body['kullanici_id']]);

if ($stmt->rowCount() === 0) {
    Response::fail('Kullanici bulunamadi.', [], 404);
}

Response::ok([
    'kullanici_id' => (int)$body['kullanici_id'],
    'durum'        => (int)$body['durum'],
]);

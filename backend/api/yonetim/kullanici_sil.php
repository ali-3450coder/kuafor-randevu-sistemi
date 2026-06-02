<?php
/**
 * Dosya   : api/yonetim/kullanici_sil.php
 * Gorev   : Yetkili kullaniciyi kalici siler.
 *           Kural: Kendi hesabini silemez. Son admin silinemez.
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
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$mevcutUser = Auth::user();

// Kendi hesabini silemez
if ((int)$body['kullanici_id'] === (int)$mevcutUser['id']) {
    Response::fail('Kendi hesabinizi silemezsiniz.', [], 422);
}

$pdo = getDb();

// Kullanici var mi ve admin mi?
$kontrol = $pdo->prepare('SELECT kullanici_id, rol FROM kullanicilar WHERE kullanici_id = ? LIMIT 1');
$kontrol->execute([(int)$body['kullanici_id']]);
$kullanici = $kontrol->fetch();
if (!$kullanici) {
    Response::fail('Kullanici bulunamadi.', [], 404);
}

// Son admin silinemez
if ($kullanici['rol'] === 'admin') {
    $adminSayisi = (int)$pdo->query("SELECT COUNT(*) FROM kullanicilar WHERE rol='admin' AND durum=1")->fetchColumn();
    if ($adminSayisi <= 1) {
        Response::fail('Son aktif admin hesabi silinemez. Once baska bir admin hesabi olusturun.', [], 422);
    }
}

$pdo->prepare('DELETE FROM kullanicilar WHERE kullanici_id = ?')
    ->execute([(int)$body['kullanici_id']]);

Response::ok(['kullanici_id' => (int)$body['kullanici_id']], 'Kullanici kalici olarak silindi.');

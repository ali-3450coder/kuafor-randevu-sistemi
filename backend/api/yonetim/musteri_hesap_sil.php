<?php
/**
 * Dosya   : api/yonetim/musteri_hesap_sil.php
 * Gorev   : Musteri web hesabini kalici siler.
 *           musteriler.hesap_id = NULL yapilir (snapshot kayitlari korunur).
 *           Sonra musteri_hesaplari kaydı silinir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hesap_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

$kontrol = $pdo->prepare('SELECT 1 FROM musteri_hesaplari WHERE hesap_id = ? LIMIT 1');
$kontrol->execute([(int)$body['hesap_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Musteri hesabi bulunamadi.', [], 404);
}

$pdo->beginTransaction();
try {
    // Snapshot kayitlarinda hesap baglantisini kopar; randevu gecmisi korunur
    $pdo->prepare('UPDATE musteriler SET hesap_id = NULL WHERE hesap_id = ?')
        ->execute([(int)$body['hesap_id']]);

    // Hesabi sil
    $pdo->prepare('DELETE FROM musteri_hesaplari WHERE hesap_id = ?')
        ->execute([(int)$body['hesap_id']]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['hesap_id' => $body['hesap_id']]);
    Response::fail('Hesap silme sirasinda hata olustu.', [], 500);
}

Response::ok(['hesap_id' => (int)$body['hesap_id']], 'Musteri hesabi silindi. Randevu gecmisi korundu.');

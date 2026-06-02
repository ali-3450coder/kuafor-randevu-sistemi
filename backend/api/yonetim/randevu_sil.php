<?php
/**
 * Dosya   : api/yonetim/randevu_sil.php
 * Gorev   : Randevuyu ve bagli kayitlari (hizmetler, odeme) kalici olarak siler.
 *           Yalnizca admin yapabilir. Geri alinamaz islem.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'randevu_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Randevu var mi?
$kontrol = $pdo->prepare('SELECT randevu_id FROM randevular WHERE randevu_id = ? LIMIT 1');
$kontrol->execute([(int)$body['randevu_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Randevu bulunamadi.', [], 404);
}

// Transaction: bagli tum kayitlari atomik sil
$pdo->beginTransaction();
try {
    // Odeme kaydini sil
    $pdo->prepare('DELETE FROM odemeler WHERE randevu_id = ?')
        ->execute([(int)$body['randevu_id']]);

    // Hizmet snapshot'larini sil
    $pdo->prepare('DELETE FROM randevu_hizmetleri WHERE randevu_id = ?')
        ->execute([(int)$body['randevu_id']]);

    // Randevuyu sil
    $pdo->prepare('DELETE FROM randevular WHERE randevu_id = ?')
        ->execute([(int)$body['randevu_id']]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['randevu_id' => $body['randevu_id']]);
    Response::fail('Randevu silme sirasinda hata olustu.', [], 500);
}

Response::ok(['randevu_id' => (int)$body['randevu_id']], 'Randevu kalici olarak silindi.');

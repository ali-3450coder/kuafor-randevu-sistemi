<?php
/**
 * Dosya   : api/yonetim/hizmet_sil.php
 * Gorev   : Hizmeti kalici siler. Herhangi bir randevuda kullanildiysa silinemez (snapshot bütünlüğü).
 *           Kullanilmamissa: personel_hizmetleri + hizmetler silinir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hizmet_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Hizmet var mi?
$kontrol = $pdo->prepare('SELECT hizmet_id, hizmet_adi FROM hizmetler WHERE hizmet_id = ? LIMIT 1');
$kontrol->execute([(int)$body['hizmet_id']]);
$hizmet = $kontrol->fetch();
if (!$hizmet) {
    Response::fail('Hizmet bulunamadi.', [], 404);
}

// Randevu gecmisinde kullanildi mi?
$snStmt = $pdo->prepare('SELECT COUNT(*) FROM randevu_hizmetleri WHERE hizmet_id = ?');
$snStmt->execute([(int)$body['hizmet_id']]);
$kullanimSayisi = (int)$snStmt->fetchColumn();

if ($kullanimSayisi > 0) {
    Response::fail(
        '"' . $hizmet['hizmet_adi'] . '" hizmeti ' . $kullanimSayisi . ' randevu geçmişinde kullanıldığından kalıcı silinemez. ' .
        'Pasif yaparak gizleyebilirsiniz.',
        ['kullanim_sayisi' => $kullanimSayisi],
        422
    );
}

$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM personel_hizmetleri WHERE hizmet_id = ?')->execute([(int)$body['hizmet_id']]);
    $pdo->prepare('DELETE FROM hizmetler            WHERE hizmet_id = ?')->execute([(int)$body['hizmet_id']]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['hizmet_id' => $body['hizmet_id']]);
    Response::fail('Hizmet silme sirasinda hata olustu.', [], 500);
}

Response::ok(['hizmet_id' => (int)$body['hizmet_id']], 'Hizmet kalici olarak silindi.');

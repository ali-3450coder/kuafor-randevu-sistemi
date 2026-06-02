<?php
/**
 * Dosya   : api/yonetim/musteri_sil.php
 * Gorev   : Musteri snapshot kaydini ve bagli tum randevu verisini kalici siler.
 *           CASCADE: odemeler → randevu_hizmetleri → randevular → musteriler
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'musteri_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Musteri var mi?
$kontrol = $pdo->prepare('SELECT musteri_id FROM musteriler WHERE musteri_id = ? LIMIT 1');
$kontrol->execute([(int)$body['musteri_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Musteri bulunamadi.', [], 404);
}

// Bu musteriye ait randevu_id listesi
$rStmt = $pdo->prepare('SELECT randevu_id FROM randevular WHERE musteri_id = ?');
$rStmt->execute([(int)$body['musteri_id']]);
$randevuIds = $rStmt->fetchAll(PDO::FETCH_COLUMN);

$pdo->beginTransaction();
try {
    if (!empty($randevuIds)) {
        $placeholders = rtrim(str_repeat('?,', count($randevuIds)), ',');

        // Odemeleri sil
        $pdo->prepare("DELETE FROM odemeler WHERE randevu_id IN ({$placeholders})")
            ->execute($randevuIds);

        // Hizmet snapshotlarini sil
        $pdo->prepare("DELETE FROM randevu_hizmetleri WHERE randevu_id IN ({$placeholders})")
            ->execute($randevuIds);

        // Randevulari sil
        $pdo->prepare("DELETE FROM randevular WHERE musteri_id = ?")
            ->execute([(int)$body['musteri_id']]);
    }

    // Musteri kaydini sil
    $pdo->prepare('DELETE FROM musteriler WHERE musteri_id = ?')
        ->execute([(int)$body['musteri_id']]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['musteri_id' => $body['musteri_id']]);
    Response::fail('Musteri silme sirasinda hata olustu.', [], 500);
}

Response::ok([
    'musteri_id'       => (int)$body['musteri_id'],
    'silinen_randevu'  => count($randevuIds),
], 'Musteri ve iliskili tum veriler silindi.');

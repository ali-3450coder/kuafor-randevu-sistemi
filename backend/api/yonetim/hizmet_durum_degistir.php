<?php
/**
 * Dosya   : api/yonetim/hizmet_durum_degistir.php
 * Gorev   : Hizmeti aktif (1) veya pasif (0) yapar.
 *           DELETE yerine durum degistirme; eski randevu snapshot'lari sayesinde silmeye gerek yok.
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
    'durum'     => ['required', ['enum', [0, 1, '0', '1']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Amac: yalnizca durum kolonunu guncelle
$stmt = $pdo->prepare(
    'UPDATE hizmetler SET durum = ?, guncelleme_tarihi = NOW() WHERE hizmet_id = ?'
);
$stmt->execute([(int)$body['durum'], (int)$body['hizmet_id']]);

if ($stmt->rowCount() === 0) {
    Response::fail('Hizmet bulunamadi.', [], 404);
}

Response::ok(['hizmet_id' => (int)$body['hizmet_id'], 'durum' => (int)$body['durum']]);

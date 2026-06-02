<?php
/**
 * Dosya   : api/yonetim/odeme_iade.php
 * Gorev   : Odendi durumundaki odemeyi iade olarak isareter. Admin ve personel yapabilir.
 * Kural   : Yalnizca odeme_durumu='odendi' olan odeme iade edilebilir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'odeme_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Odeme kaydini dogrula
$kontrol = $pdo->prepare(
    'SELECT o.odeme_id, o.odeme_durumu
     FROM odemeler o
     WHERE o.odeme_id = ?
     LIMIT 1'
);
$kontrol->execute([(int)$body['odeme_id']]);
$odeme = $kontrol->fetch();

if (!$odeme) {
    Response::fail('Odeme bulunamadi.', [], 404);
}

// Yalnizca odendi durumundaki odeme iade edilebilir
if ($odeme['odeme_durumu'] !== 'odendi') {
    Response::fail(
        'Yalnizca "odendi" durumundaki odemeler iade edilebilir.',
        [],
        422
    );
}

// Amac: iade durumuna gec, odeme tarihini temizle
$stmt = $pdo->prepare(
    'UPDATE odemeler
     SET odeme_durumu = \'iade\', odeme_tarihi = NULL,
         aciklama = ?, guncelleme_tarihi = NOW()
     WHERE odeme_id = ?'
);
$stmt->execute([
    $body['iade_aciklama'] ?? null,
    (int)$body['odeme_id'],
]);

Response::ok(['odeme_id' => (int)$body['odeme_id'], 'odeme_durumu' => 'iade'], 'Odeme iade edildi.');

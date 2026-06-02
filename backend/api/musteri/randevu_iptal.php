<?php
/**
 * Dosya   : api/musteri/randevu_iptal.php
 * Gorev   : Giris yapan musterinin "beklemede" durumundaki randevusunu iptal eder.
 * Kural   : Sadece kendi randevusu (hesap_id uzerinden dogrulama).
 *           Sadece "beklemede" durumu iptal edilebilir; onaylananlar admin uzerinden iptal.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php, middleware/musteri_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';
require_once __DIR__ . '/../../middleware/musteri_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body    = Request::json();
$hesapId = (int)MusteriAuth::user()['hesap_id'];

$v = Validator::check($body, [
    'randevu_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Randevunun bu hesaba ait oldugunu ve durumunu dogrula
$stmt = $pdo->prepare(
    'SELECT r.randevu_id, r.durum
     FROM randevular r
     JOIN musteriler m ON m.musteri_id = r.musteri_id
     WHERE r.randevu_id = ? AND m.hesap_id = ?
     LIMIT 1'
);
$stmt->execute([(int)$body['randevu_id'], $hesapId]);
$randevu = $stmt->fetch();

if (!$randevu) {
    Response::fail('Randevu bulunamadi veya size ait degil.', [], 404);
}

if ($randevu['durum'] !== 'beklemede') {
    Response::fail(
        'Yalnizca onay bekleyen randevular iptal edilebilir. Onaylanmis randevular icin salon ile iletisime gecin.',
        [],
        422
    );
}

$pdo->prepare(
    'UPDATE randevular
     SET durum = \'iptal\', iptal_nedeni = \'Musteri talebi ile iptal edildi.\',
         guncelleme_tarihi = NOW()
     WHERE randevu_id = ?'
)->execute([(int)$body['randevu_id']]);

Response::ok(['randevu_id' => (int)$body['randevu_id']], 'Randevu iptal edildi.');

<?php
/**
 * Dosya   : api/yonetim/hizmet_guncelle.php
 * Gorev   : Mevcut hizmet bilgilerini gunceller.
 * Validasyon kurallari: hizmet_id required, hizmet_adi required, sure_dakika positive_int, fiyat >= 0.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hizmet_id'   => ['required', 'positive_int'],
    'hizmet_adi'  => ['required', ['min_len', 2], ['max_len', 100]],
    'sure_dakika' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Fiyat negatif olamaz
if (!isset($body['fiyat']) || !is_numeric($body['fiyat']) || (float)$body['fiyat'] < 0) {
    Response::fail('Dogrulama hatasi.', ['fiyat' => ['Fiyat 0 veya daha buyuk olmalidir.']], 422);
}

$pdo = getDb();

// Hizmet mevcut mu?
$kontrol = $pdo->prepare('SELECT 1 FROM hizmetler WHERE hizmet_id = ? LIMIT 1');
$kontrol->execute([(int)$body['hizmet_id']]);
if (!$kontrol->fetch()) {
    Response::fail('Hizmet bulunamadi.', [], 404);
}

try {
    $stmt = $pdo->prepare(
        'UPDATE hizmetler
         SET hizmet_adi = ?, aciklama = ?, sure_dakika = ?, fiyat = ?,
             kategori = ?, populer_mi = ?, siralama = ?,
             guncelleme_tarihi = NOW()
         WHERE hizmet_id = ?'
    );
    $stmt->execute([
        $body['hizmet_adi'],
        $body['aciklama'] ?? null,
        (int)$body['sure_dakika'],
        (float)$body['fiyat'],
        $body['kategori'] ?? null,
        isset($body['populer_mi']) ? (int)$body['populer_mi'] : 0,
        isset($body['siralama'])   ? (int)$body['siralama']   : 0,
        (int)$body['hizmet_id'],
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        Response::fail('Bu isimde bir hizmet zaten mevcut.', [], 409);
    }
    throw $e;
}

Response::ok(['hizmet_id' => (int)$body['hizmet_id']]);

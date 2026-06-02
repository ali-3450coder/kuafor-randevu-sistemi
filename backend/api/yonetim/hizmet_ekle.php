<?php
/**
 * Dosya   : api/yonetim/hizmet_ekle.php
 * Gorev   : Yeni hizmet kaydeder.
 * Validasyon kurallari: hizmet_adi required, sure_dakika positive_int, fiyat >= 0.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'hizmet_adi'  => ['required', ['min_len', 2], ['max_len', 100]],
    'sure_dakika' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Fiyat negatif olamaz; Validator'da float kurali yok, inline kontrol yapilir
if (!isset($body['fiyat']) || !is_numeric($body['fiyat']) || (float)$body['fiyat'] < 0) {
    Response::fail('Dogrulama hatasi.', ['fiyat' => ['Fiyat 0 veya daha buyuk olmalidir.']], 422);
}

$pdo = getDb();

try {
    $stmt = $pdo->prepare(
        'INSERT INTO hizmetler
            (hizmet_adi, aciklama, sure_dakika, fiyat, kategori, populer_mi, siralama, durum)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $body['hizmet_adi'],
        $body['aciklama'] ?? null,
        (int)$body['sure_dakika'],
        (float)$body['fiyat'],
        $body['kategori'] ?? null,
        isset($body['populer_mi']) ? (int)$body['populer_mi'] : 0,
        isset($body['siralama'])   ? (int)$body['siralama']   : 0,
        isset($body['durum'])      ? (int)$body['durum']      : 1,
    ]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') {
        Response::fail('Bu isimde bir hizmet zaten mevcut.', [], 409);
    }
    throw $e;
}

Response::ok(['hizmet_id' => (int)$pdo->lastInsertId()]);

<?php
/**
 * Dosya   : api/yonetim/personel_hizmetleri_guncelle.php
 * Gorev   : Personelin sunabilecegi hizmetleri atomik olarak yeniler.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'personel_id'  => ['required', 'positive_int'],
    'hizmet_idler' => ['required', 'array_of_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo        = getDb();
$personelId = (int)$body['personel_id'];
$hizmetIdler = array_map('intval', $body['hizmet_idler']);

// Transaction: atomik yenileme; manuel diff yerine tam yenileme tercih edildi.
$pdo->beginTransaction();
try {
    // Amac: mevcut tum eslesmeler temizle
    $del = $pdo->prepare('DELETE FROM personel_hizmetleri WHERE personel_id = ?');
    $del->execute([$personelId]);

    // Amac: gonderilen hizmetleri tek tek ekle
    $ins = $pdo->prepare(
        'INSERT INTO personel_hizmetleri (personel_id, hizmet_id, durum) VALUES (?, ?, 1)'
    );
    foreach ($hizmetIdler as $hizmetId) {
        $ins->execute([$personelId, $hizmetId]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['personel_id' => $personelId]);
    Response::fail('Hizmet guncelleme sirasinda hata olustu.', [], 500);
}

Response::ok(['personel_id' => $personelId, 'hizmet_sayisi' => count($hizmetIdler)]);

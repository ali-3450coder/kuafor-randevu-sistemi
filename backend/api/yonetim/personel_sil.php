<?php
/**
 * Dosya   : api/yonetim/personel_sil.php
 * Gorev   : Personeli kalici siler. Randevusu olan personel silinemez (FK bütünlüğü).
 *           Randevu yoksa: calisma_saatleri + personel_hizmetleri + personeller silinir.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'personel_id' => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Personel var mi?
$kontrol = $pdo->prepare('SELECT personel_id, ad_soyad FROM personeller WHERE personel_id = ? LIMIT 1');
$kontrol->execute([(int)$body['personel_id']]);
$personel = $kontrol->fetch();
if (!$personel) {
    Response::fail('Personel bulunamadi.', [], 404);
}

// Bagli randevu var mi? (herhangi bir durum)
$rKontrol = $pdo->prepare('SELECT COUNT(*) FROM randevular WHERE personel_id = ?');
$rKontrol->execute([(int)$body['personel_id']]);
$randevuSayisi = (int)$rKontrol->fetchColumn();

if ($randevuSayisi > 0) {
    Response::fail(
        $personel['ad_soyad'] . ' personeline ait ' . $randevuSayisi . ' randevu kaydı bulunduğundan kalıcı silinemez. ' .
        'Personeli pasif yaparak devre dışı bırakabilirsiniz.',
        ['randevu_sayisi' => $randevuSayisi],
        422
    );
}

$pdo->beginTransaction();
try {
    $pdo->prepare('DELETE FROM calisma_saatleri   WHERE personel_id = ?')->execute([(int)$body['personel_id']]);
    $pdo->prepare('DELETE FROM personel_hizmetleri WHERE personel_id = ?')->execute([(int)$body['personel_id']]);
    $pdo->prepare('DELETE FROM personeller          WHERE personel_id = ?')->execute([(int)$body['personel_id']]);
    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['personel_id' => $body['personel_id']]);
    Response::fail('Personel silme sirasinda hata olustu.', [], 500);
}

Response::ok(['personel_id' => (int)$body['personel_id']], 'Personel kalici olarak silindi.');

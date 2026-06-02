<?php
/**
 * Dosya   : api/yonetim/personel_durum_degistir.php
 * Gorev   : Personeli aktif (1) veya pasif (0) yapar.
 *           silmek yerine pasiflestirme; gecmis randevular ve referans butunlugu korunur.
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
    'durum'       => ['required', ['enum', [0, 1, '0', '1']]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// A-12: Pasif yapiliyorsa bekleyen aktif randevu sayisini say (engellemeden uyar)
$aktifRandevuSayisi = 0;
if ((int)$body['durum'] === 0) {
    $rKontrol = $pdo->prepare(
        "SELECT COUNT(*) FROM randevular
         WHERE personel_id = ? AND durum IN ('beklemede','onaylandi')"
    );
    $rKontrol->execute([(int)$body['personel_id']]);
    $aktifRandevuSayisi = (int)$rKontrol->fetchColumn();
}

// Amac: yalnizca durum kolonunu guncelle; diger alanlar degismez
$stmt = $pdo->prepare(
    'UPDATE personeller SET durum = ?, guncelleme_tarihi = NOW() WHERE personel_id = ?'
);
$stmt->execute([(int)$body['durum'], (int)$body['personel_id']]);

if ($stmt->rowCount() === 0) {
    Response::fail('Personel bulunamadi.', [], 404);
}

Response::ok([
    'personel_id'          => (int)$body['personel_id'],
    'durum'                => (int)$body['durum'],
    'aktif_randevu_sayisi' => $aktifRandevuSayisi,
]);

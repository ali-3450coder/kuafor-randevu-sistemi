<?php
/**
 * Dosya   : api/yonetim/randevu_guncelle.php
 * Gorev   : Admin randevunun tarih, saat ve personelini degistirir.
 *           Bitis saati mevcut hizmetlerin toplam suresinden hesaplanir.
 *           Cakisma kontrolu yapilir (kendisi haric).
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php, core/Yardimcilar.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'randevu_id'     => ['required', 'positive_int'],
    'randevu_tarihi' => ['required', 'date'],
    'baslangic_saati'=> ['required', 'time'],
    'personel_id'    => ['required', 'positive_int'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Mevcut randevuyu al
$randevu = $pdo->prepare(
    'SELECT randevu_id, personel_id FROM randevular WHERE randevu_id = ? LIMIT 1'
);
$randevu->execute([(int)$body['randevu_id']]);
$mevcut = $randevu->fetch();
if (!$mevcut) {
    Response::fail('Randevu bulunamadi.', [], 404);
}

// Mevcut hizmetlerin toplam suresini hesapla
$hStmt = $pdo->prepare(
    'SELECT COALESCE(SUM(sure_dakika),0) AS toplam_sure FROM randevu_hizmetleri WHERE randevu_id = ?'
);
$hStmt->execute([(int)$body['randevu_id']]);
$toplamSure = (int)$hStmt->fetchColumn();

if ($toplamSure <= 0) {
    Response::fail('Randevuya ait hizmet bulunamadi.', [], 422);
}

$baslangic = $body['baslangic_saati'];
$bitis     = Yardimcilar::dakikaEkle($baslangic, $toplamSure);

// Cakisma kontrolu (yeni personel, yeni tarih/saat, kendisi haric)
$cakisma = $pdo->prepare(
    'SELECT 1 FROM randevular
     WHERE personel_id    = ?
       AND randevu_tarihi = ?
       AND randevu_id    != ?
       AND durum IN (\'beklemede\', \'onaylandi\')
       AND ?  < bitis_saati
       AND ?  > baslangic_saati
     LIMIT 1'
);
$cakisma->execute([
    (int)$body['personel_id'],
    $body['randevu_tarihi'],
    (int)$body['randevu_id'],
    $baslangic,
    $bitis,
]);
if ($cakisma->fetch()) {
    Response::fail('Secilen saat ve personelde baska bir randevu mevcut.', [], 409);
}

$stmt = $pdo->prepare(
    'UPDATE randevular
     SET personel_id = ?, randevu_tarihi = ?, baslangic_saati = ?, bitis_saati = ?,
         guncelleme_tarihi = NOW()
     WHERE randevu_id = ?'
);
$stmt->execute([
    (int)$body['personel_id'],
    $body['randevu_tarihi'],
    $baslangic,
    $bitis,
    (int)$body['randevu_id'],
]);

Response::ok([
    'randevu_id'      => (int)$body['randevu_id'],
    'randevu_tarihi'  => $body['randevu_tarihi'],
    'baslangic_saati' => $baslangic,
    'bitis_saati'     => $bitis,
]);

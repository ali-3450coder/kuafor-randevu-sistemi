<?php
/**
 * Dosya   : api/musteri/randevularim.php
 * Gorev   : Giris yapan mustерinin hesabina bagli tum randevularini dondurur.
 *           musteriler.hesap_id → musteri_hesaplari.hesap_id uzerinden eslesir.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php, middleware/musteri_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';
require_once __DIR__ . '/../../middleware/musteri_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$hesapId = (int)MusteriAuth::user()['hesap_id'];
$pdo     = getDb();

// Amac: hesaba bagli tum randevulari personel ve odeme bilgisiyle getir
$stmt = $pdo->prepare(
    'SELECT r.randevu_id, r.randevu_kodu, r.randevu_tarihi,
            r.baslangic_saati, r.bitis_saati, r.durum,
            r.notlar, r.iptal_nedeni,
            p.ad_soyad  AS personel_ad,
            p.unvan     AS personel_unvan,
            o.tutar     AS toplam_tutar,
            o.odeme_durumu, o.odeme_tipi, o.odeme_tarihi
     FROM randevular r
     JOIN musteriler m  ON m.musteri_id  = r.musteri_id
     JOIN personeller p ON p.personel_id = r.personel_id
     LEFT JOIN odemeler o ON o.randevu_id = r.randevu_id
     WHERE m.hesap_id = ?
     ORDER BY r.randevu_tarihi DESC, r.baslangic_saati DESC'
);
$stmt->execute([$hesapId]);
$randevular = $stmt->fetchAll();

if (empty($randevular)) {
    Response::list([]);
}

// Hizmetleri N+1 olmadan toplu cek
$ids          = array_column($randevular, 'randevu_id');
$placeholders = rtrim(str_repeat('?,', count($ids)), ',');

$hStmt = $pdo->prepare(
    "SELECT randevu_id, hizmet_adi, sure_dakika, fiyat
     FROM randevu_hizmetleri
     WHERE randevu_id IN ({$placeholders})
     ORDER BY siralama"
);
$hStmt->execute($ids);

$hizmetMap = [];
foreach ($hStmt->fetchAll() as $h) {
    $hizmetMap[$h['randevu_id']][] = [
        'hizmet_adi'  => $h['hizmet_adi'],
        'sure_dakika' => (int)$h['sure_dakika'],
        'fiyat'       => (float)$h['fiyat'],
    ];
}

foreach ($randevular as &$r) {
    $r['hizmetler'] = $hizmetMap[$r['randevu_id']] ?? [];
}
unset($r);

Response::list($randevular);

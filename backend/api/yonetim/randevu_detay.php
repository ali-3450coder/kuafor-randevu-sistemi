<?php
/**
 * Dosya   : api/yonetim/randevu_detay.php
 * Gorev   : Tek randevunun tam detayini dondurur: musteri, personel, hizmet snapshot, odeme.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$id = (int)Request::param('id', 0);
if ($id < 1) {
    Response::fail('Gecerli bir randevu id gereklidir.', [], 422);
}

$pdo = getDb();

// Amac: randevu + musteri + personel + odeme tek sorguda
$stmt = $pdo->prepare(
    'SELECT r.randevu_id, r.randevu_kodu, r.randevu_tarihi,
            r.baslangic_saati, r.bitis_saati, r.durum, r.notlar, r.iptal_nedeni,
            m.musteri_id, m.ad_soyad AS musteri_ad,
            m.telefon   AS musteri_telefon, m.email AS musteri_email,
            p.personel_id, p.ad_soyad AS personel_ad, p.unvan AS personel_unvan,
            o.odeme_id, o.tutar, o.odeme_durumu, o.odeme_tipi, o.odeme_tarihi
     FROM randevular r
     JOIN musteriler m  ON m.musteri_id  = r.musteri_id
     JOIN personeller p ON p.personel_id = r.personel_id
     LEFT JOIN odemeler o ON o.randevu_id = r.randevu_id
     WHERE r.randevu_id = ?
     LIMIT 1'
);
$stmt->execute([$id]);
$randevu = $stmt->fetch();

if (!$randevu) {
    Response::fail('Randevu bulunamadi.', [], 404);
}

// Amac: hizmet snapshot'larini getir (hizmetler tablosundan degil)
$hStmt = $pdo->prepare(
    'SELECT hizmet_id, hizmet_adi, sure_dakika, fiyat
     FROM randevu_hizmetleri
     WHERE randevu_id = ?'
);
$hStmt->execute([$id]);
$hizmetler = $hStmt->fetchAll();

Response::ok([
    'randevu'   => $randevu,
    'hizmetler' => $hizmetler,
    'odeme'     => [
        'odeme_id'     => $randevu['odeme_id'],
        'tutar'        => $randevu['tutar'],
        'odeme_durumu' => $randevu['odeme_durumu'],
        'odeme_tipi'   => $randevu['odeme_tipi'],
        'odeme_tarihi' => $randevu['odeme_tarihi'],
    ],
]);

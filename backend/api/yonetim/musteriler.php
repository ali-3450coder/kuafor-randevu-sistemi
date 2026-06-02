<?php
/**
 * Dosya   : api/yonetim/musteriler.php
 * Gorev   : Musteri listesini randevu istatistikleriyle birlikte dondurur.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo = getDb();

// Amac: musteri basina randevu sayisi, son randevu tarihi, hizmet ve personel ozeti tek sorguda
// GROUP_CONCAT: musteri basina virgullu ozet; DISTINCT ile tekrarlayan deger gosterilmez
$stmt = $pdo->query(
    "SELECT m.musteri_id,
            m.ad_soyad,
            m.telefon,
            m.email,
            m.kayit_tarihi,
            COUNT(DISTINCT r.randevu_id)          AS randevu_sayisi,
            MAX(r.randevu_tarihi)                  AS son_randevu_tarihi,
            GROUP_CONCAT(DISTINCT rh.hizmet_adi
                         ORDER BY rh.hizmet_adi
                         SEPARATOR ', ')           AS aldigi_hizmetler,
            GROUP_CONCAT(DISTINCT p.ad_soyad
                         ORDER BY p.ad_soyad
                         SEPARATOR ', ')           AS sectigi_personeller
     FROM musteriler m
     LEFT JOIN randevular r      ON r.musteri_id  = m.musteri_id
     LEFT JOIN randevu_hizmetleri rh ON rh.randevu_id = r.randevu_id
     LEFT JOIN personeller p     ON p.personel_id = r.personel_id
     GROUP BY m.musteri_id
     ORDER BY m.kayit_tarihi DESC"
);

Response::list($stmt->fetchAll());

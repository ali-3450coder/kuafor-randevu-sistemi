<?php
/**
 * Dosya   : api/yonetim/yetkililer.php
 * Gorev   : Sisteme giris yapabilecek yetkili kullanici listesini dondurur.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo = getDb();

// Guvenlik: sifre_hash hicbir zaman istemciye sizdirilmaz; sutun listesi acik tutulur
$stmt = $pdo->query(
    'SELECT kullanici_id, ad_soyad, email, rol, durum, son_giris_tarihi,
            olusturma_tarihi, guncelleme_tarihi
     FROM kullanicilar
     ORDER BY olusturma_tarihi DESC'
);

Response::list($stmt->fetchAll());

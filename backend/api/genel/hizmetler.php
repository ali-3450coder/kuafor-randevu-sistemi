<?php
/**
 * Dosya   : api/genel/hizmetler.php
 * Gorev   : Aktif hizmetleri listeler. Herkese acik, auth gerektirmez.
 * Bagimli : config/bootstrap.php, core/Response.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// Sadece GET kabul edilir; diger metodlar anlamsiz olur
if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo  = getDb();

// Amac: durum=1 olan aktif hizmetleri populerlik ve siraya gore getir
$stmt = $pdo->prepare(
    'SELECT hizmet_id, hizmet_adi, aciklama, sure_dakika, fiyat,
            kategori, populer_mi, siralama
     FROM hizmetler
     WHERE durum = 1
     ORDER BY populer_mi DESC, siralama ASC, hizmet_adi ASC'
);
$stmt->execute();
$rows = $stmt->fetchAll();

Response::list($rows);

<?php
/**
 * Dosya   : api/genel/personeller.php
 * Gorev   : Aktif personel listesini dondurur. Herkese acik, auth gerektirmez.
 * Bagimli : config/bootstrap.php, core/Response.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// Sadece GET kabul edilir
if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo  = getDb();

// Amac: durum=1 olan aktif personelleri getir
$stmt = $pdo->prepare(
    'SELECT personel_id, ad_soyad, telefon, unvan, bio
     FROM personeller
     WHERE durum = 1'
);
$stmt->execute();
$rows = $stmt->fetchAll();

Response::list($rows);

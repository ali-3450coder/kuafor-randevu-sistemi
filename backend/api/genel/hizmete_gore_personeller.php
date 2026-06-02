<?php

/**
 * Dosya   : api/genel/hizmete_gore_personeller.php
 * Gorev   : Gonderilen hizmet ID listesinin TAMAMINI verebilen aktif personelleri dondurur.
 * Bagimli : config/bootstrap.php, core/Response.php, core/Request.php, core/Validator.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// Sadece POST kabul edilir; JSON body tasimak icin POST semantigi uygundur
if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

// hizmet_idler: zorunlu, tam sayi dizisi, en az 1 eleman
$validation = Validator::check($body, [
    'hizmet_idler' => [
        'required',
        'array_of_int',
        ['min_count', 1],
    ],
]);

if (!$validation['ok']) {
    Response::fail('Dogrulama hatasi.', $validation['errors'], 422);
}

// Guvenlik: ID'ler integer'a cast edilerek bind ediliyor, dizi SQL'e gomulmuyor
$ids   = array_map('intval', $body['hizmet_idler']);
$sayim = count($ids);

// Amac: secilen tum hizmetleri verebilen aktif personeller
// IN(...) icin dinamik placeholder uret: ?,?,?
$placeholders = rtrim(str_repeat('?,', $sayim), ',');

$sql = "SELECT p.personel_id, p.ad_soyad, p.unvan
        FROM personeller p
        JOIN personel_hizmetleri ph ON ph.personel_id = p.personel_id
        WHERE p.durum = 1
          AND ph.durum = 1
          AND ph.hizmet_id IN ({$placeholders})
        GROUP BY p.personel_id
        HAVING COUNT(DISTINCT ph.hizmet_id) = ?";

$pdo    = getDb();
$stmt   = $pdo->prepare($sql);

// ID listesini ve sayimi tek dizide birlestirir; named + positional karisimi yasak
$params = array_merge($ids, [$sayim]);
$stmt->execute($params);
$rows = $stmt->fetchAll();

Response::list($rows);

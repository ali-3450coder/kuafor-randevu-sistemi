<?php

/**
 * Dosya   : api/genel/uygun_saatler.php
 * Gorev   : Belirtilen personel, hizmetler ve tarih icin uygun randevu slotlarini dondurur.
 * Bagimli : config/bootstrap.php, core/RandevuServisi.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/RandevuServisi.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

// Zorunlu alan ve format dogrulamasi
$v = Validator::check($body, [
    'personel_id'     => ['required', 'positive_int'],
    'hizmet_idler'    => ['required', 'array_of_int', ['min_count', 1]],
    'randevu_tarihi'  => ['required', 'date'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Gecmis tarih kontrolu (servis de yapar ama erken yakala)
if ($body['randevu_tarihi'] < date('Y-m-d')) {
    Response::fail('Gecmis tarih icin sorgulama yapilamaz.', ['randevu_tarihi' => ['Gecmis tarih girilemez.']], 422);
}

try {
    $servis = new RandevuServisi();
    $slots  = $servis->uygunSaatler(
        (int)$body['personel_id'],
        $body['hizmet_idler'],
        $body['randevu_tarihi']
    );
    Response::ok(['slots' => $slots]);
} catch (RuntimeException $e) {
    $http = $e->getCode() >= 400 ? $e->getCode() : 422;
    Response::fail($e->getMessage(), [], $http);
}

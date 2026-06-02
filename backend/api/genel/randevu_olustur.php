<?php

/**
 * Dosya   : api/genel/randevu_olustur.php
 * Gorev   : Yeni randevu olusturma isteklerini karsilar; format dogrulama + servis cagrisini yapar.
 * Bagimli : config/bootstrap.php, core/RandevuServisi.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/RandevuServisi.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

// --- KATMAN A: Temel format dogrulamasi ---
$rules = [
    'ad_soyad'       => ['required', ['min_len', 2], ['max_len', 100]],
    'telefon'        => ['required', 'phone'],
    'hizmet_idler'   => ['required', 'array_of_int', ['min_count', 1]],
    'personel_id'    => ['required', 'positive_int'],
    'randevu_tarihi' => ['required', 'date'],
    'baslangic_saati' => ['required', 'time'],
];
// Email opsiyoneldir; yalnizca gonderildiyse format dogrulamasi yap
if (!empty($body['email'])) {
    $rules['email'] = ['email'];
}
$v = Validator::check($body, $rules);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Gecmis tarih formatca gecerli olsa da kabul edilmez
if ($body['randevu_tarihi'] < date('Y-m-d')) {
    Response::fail('Gecmis tarih icin randevu alinamaz.', ['randevu_tarihi' => ['Gecmis tarih girilemez.']], 422);
}

// Bugun icin gecmis saate randevu alinmaz
if ($body['randevu_tarihi'] === date('Y-m-d') && $body['baslangic_saati'] <= date('H:i')) {
    Response::fail('Gecmis saat icin randevu alinamaz.', ['baslangic_saati' => ['Secilen saat gecmiste kalmis.']], 422);
}

// Musteri giris yapmissa hesap_id'yi payload'a ekle; misafir randevusunda null kalir
$body['hesap_id'] = MusteriAuth::check() ? MusteriAuth::user()['hesap_id'] : null;

try {
    $servis = new RandevuServisi();
    $sonuc  = $servis->randevuOlustur($body);
    Response::ok($sonuc, 'Randevu basariyla olusturuldu.');
} catch (RuntimeException $e) {
    $http = $e->getCode() >= 400 ? $e->getCode() : 422;
    Response::fail($e->getMessage(), [], $http);
}

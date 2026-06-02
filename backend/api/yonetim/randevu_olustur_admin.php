<?php
/**
 * Dosya   : api/yonetim/randevu_olustur_admin.php
 * Gorev   : Admin adina walk-in musteri icin randevu olusturur.
 *           Musteri hesabi gerekmez; musteriler tablosuna snapshot acilir.
 *           Gecmis tarih/saat engellenMEZ (admin bilincli giris yapiyor).
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php, core/RandevuServisi.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';
require_once __DIR__ . '/../../core/RandevuServisi.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'musteri_ad'     => ['required', ['min_len', 2], ['max_len', 100]],
    'musteri_telefon'=> ['required', 'phone'],
    'hizmet_idler'   => ['required', 'array_of_int', ['min_count', 1]],
    'personel_id'    => ['required', 'positive_int'],
    'randevu_tarihi' => ['required', 'date'],
    'baslangic_saati'=> ['required', 'time'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// RandevuServisi payload formatina donustur
$payload = [
    'ad_soyad'       => $body['musteri_ad'],
    'telefon'        => $body['musteri_telefon'],
    'hizmet_idler'   => $body['hizmet_idler'],
    'personel_id'    => $body['personel_id'],
    'randevu_tarihi' => $body['randevu_tarihi'],
    'baslangic_saati'=> $body['baslangic_saati'],
    'notlar'         => $body['notlar'] ?? null,
    'hesap_id'       => null,  // Walk-in: hesap baglanmaz
];

try {
    $servis = new RandevuServisi();
    $sonuc  = $servis->randevuOlustur($payload);
    Response::ok($sonuc, 'Randevu basariyla olusturuldu.');
} catch (RuntimeException $e) {
    $http = $e->getCode() >= 400 ? $e->getCode() : 422;
    Response::fail($e->getMessage(), [], $http);
}

<?php
/**
 * Dosya   : api/musteri/profil_guncelle.php
 * Gorev   : Giris yapan musterinin ad_soyad ve email bilgilerini gunceller.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php, middleware/musteri_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';
require_once __DIR__ . '/../../middleware/musteri_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body    = Request::json();
$hesapId = (int)MusteriAuth::user()['hesap_id'];

$v = Validator::check($body, [
    'ad_soyad' => ['required', ['min_len', 2], ['max_len', 100]],
]);
if (!empty($body['email'])) {
    $v2 = Validator::check($body, ['email' => ['email']]);
    if (!$v2['ok']) {
        $v['ok']     = false;
        $v['errors'] = array_merge($v['errors'], $v2['errors']);
    }
}

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo   = getDb();
$email = (!empty($body['email'])) ? $body['email'] : null;

// Email baskasi tarafindan kullaniliyor mu?
if ($email) {
    $kontrol = $pdo->prepare(
        'SELECT 1 FROM musteri_hesaplari WHERE email = ? AND hesap_id != ? LIMIT 1'
    );
    $kontrol->execute([$email, $hesapId]);
    if ($kontrol->fetch()) {
        Response::fail('Dogrulama hatasi.', ['email' => ['Bu e-posta baska bir hesap tarafindan kullaniliyor.']], 422);
    }
}

$pdo->prepare(
    'UPDATE musteri_hesaplari SET ad_soyad = ?, email = ? WHERE hesap_id = ?'
)->execute([$body['ad_soyad'], $email, $hesapId]);

// Session verisini guncelle
$_SESSION['musteri_hesap']['ad_soyad'] = $body['ad_soyad'];
$_SESSION['musteri_hesap']['email']    = $email;

Response::ok(['hesap' => MusteriAuth::user()], 'Profil guncellendi.');

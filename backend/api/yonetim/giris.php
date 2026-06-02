<?php
/**
 * Dosya   : api/yonetim/giris.php
 * Gorev   : Yonetici giris endpoint'i.
 * Guvenlik: password_verify ile sifre_hash dogrulama, session_regenerate_id ile fixation onleme.
 *           Kullanici yok / sifre yanlis ayrimi sizdirmaz; her ikisinde de ayni 401 donulur.
 * Bagimli : config/bootstrap.php, core/Auth.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'email' => ['required', 'email'],
    'sifre' => ['required'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Amac: aktif kullanicinin hash bilgisini getir
$stmt = $pdo->prepare(
    'SELECT kullanici_id, ad_soyad, rol, sifre_hash
     FROM kullanicilar
     WHERE email = ? AND durum = 1
     LIMIT 1'
);
$stmt->execute([$body['email']]);
$kullanici = $stmt->fetch();

// duz sifre asla saklanmaz; yalniz hash ile karsilastirilir.
// Kullanici bulunamazsa veya hash eslesemezse ayni generic 401 don (bilgi sizintisi engeli)
if (!$kullanici || !password_verify($body['sifre'], $kullanici['sifre_hash'])) {
    Response::fail('E-posta veya sifre hatali.', [], 401);
}

// Amac: son giris zamanini guncelle
$upd = $pdo->prepare('UPDATE kullanicilar SET son_giris_tarihi = NOW() WHERE kullanici_id = ?');
$upd->execute([$kullanici['kullanici_id']]);

Auth::login([
    'id'       => $kullanici['kullanici_id'],
    'ad_soyad' => $kullanici['ad_soyad'],
    'rol'      => $kullanici['rol'],
]);

Response::ok(['yetkili' => Auth::user()]);

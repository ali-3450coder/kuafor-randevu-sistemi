<?php
/**
 * Dosya   : api/yonetim/odeme_guncelle.php
 * Gorev   : Odeme tip, durum ve aciklama alanlarini gunceller.
 *           Durum gecis mantigi: odendi -> odeme_tarihi=NOW(); diger -> odeme_tarihi=NULL.
 *           odendi disinda odeme_tarihi NULL'lanir; cunku tahsilat hala gerceklesmemis sayilir.
 *           Tutar bu endpoint uzerinden degistirilemez; randevu olusturma akisinda set edilir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$izinliTipler   = ['nakit', 'kart', 'havale', 'diger'];
$izinliDurumlar = ['bekliyor', 'odendi', 'iptal'];

$v = Validator::check($body, [
    'odeme_id'      => ['required', 'positive_int'],
    'odeme_tipi'    => ['required', ['enum', $izinliTipler]],
    'odeme_durumu'  => ['required', ['enum', $izinliDurumlar]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

$pdo = getDb();

// Odeme kaydini ve bagli randevunun durumunu dogrula
$kontrol = $pdo->prepare(
    'SELECT o.odeme_id, r.durum AS randevu_durum
     FROM odemeler o
     JOIN randevular r ON r.randevu_id = o.randevu_id
     WHERE o.odeme_id = ?
     LIMIT 1'
);
$kontrol->execute([(int)$body['odeme_id']]);
$odemeKaydi = $kontrol->fetch();

if (!$odemeKaydi) {
    Response::fail('Odeme bulunamadi.', [], 404);
}

// Kural: randevu onaylanmadan (beklemede iken) odeme alinamaz
if ($odemeKaydi['randevu_durum'] === 'beklemede') {
    Response::fail(
        'Randevu henuz onaylanmadi. Odeme yalnizca onaylanmis veya tamamlanmis randevular icin alinabilir.',
        [],
        422
    );
}

// odendi -> tahsilat tarihi setlenir; diger durumlarda NULL'lanir
$odemeTarihi = ($body['odeme_durumu'] === 'odendi') ? date('Y-m-d H:i:s') : null;

// Amac: odeme tip, durum, aciklama ve tarihi guncelle; tutar dokunamaz
$stmt = $pdo->prepare(
    'UPDATE odemeler
     SET odeme_tipi = ?, odeme_durumu = ?, aciklama = ?,
         odeme_tarihi = ?, guncelleme_tarihi = NOW()
     WHERE odeme_id = ?'
);
$stmt->execute([
    $body['odeme_tipi'],
    $body['odeme_durumu'],
    $body['aciklama'] ?? null,
    $odemeTarihi,
    (int)$body['odeme_id'],
]);

Response::ok([
    'odeme_id'     => (int)$body['odeme_id'],
    'odeme_durumu' => $body['odeme_durumu'],
    'odeme_tarihi' => $odemeTarihi,
]);

<?php
/**
 * Dosya   : api/yonetim/randevu_durum_guncelle.php
 * Gorev   : Randevu durumunu gunceller. Iptal durumunda iptal_nedeni zorunludur.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$izinliDurumlar = ['beklemede', 'onaylandi', 'iptal', 'tamamlandi', 'gelmedi'];

$v = Validator::check($body, [
    'randevu_id' => ['required', 'positive_int'],
    'durum'      => ['required', ['enum', $izinliDurumlar]],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

// Iptal durumunda iptal_nedeni zorunlu
if ($body['durum'] === 'iptal' && empty($body['iptal_nedeni'])) {
    Response::fail('Dogrulama hatasi.', ['iptal_nedeni' => ['Iptal durumunda iptal_nedeni zorunludur.']], 422);
}

$pdo = getDb();

// Mevcut randevu ve durumunu al
$kontrol = $pdo->prepare('SELECT randevu_id, durum FROM randevular WHERE randevu_id = ? LIMIT 1');
$kontrol->execute([(int)$body['randevu_id']]);
$randevu = $kontrol->fetch();
if (!$randevu) {
    Response::fail('Randevu bulunamadi.', [], 404);
}

// A-03: Durum gecis matrisi — final state'ler bos gecis listesine sahip
$gecisMatrix = [
    'beklemede'  => ['onaylandi', 'iptal'],
    'onaylandi'  => ['tamamlandi', 'gelmedi', 'iptal'],
    'tamamlandi' => [],
    'iptal'      => [],
    'gelmedi'    => [],
];
if (!in_array($body['durum'], $gecisMatrix[$randevu['durum']] ?? [], true)) {
    Response::fail(
        "'{$randevu['durum']}' durumundan '{$body['durum']}' durumuna gecis yapilamaz.",
        [],
        422
    );
}

// C-02: Iptal islemi yalnizca admin tarafindan yapilabilir
if ($body['durum'] === 'iptal' && (Auth::user()['rol'] ?? '') !== 'admin') {
    Response::fail('Iptal islemi yalnizca admin yetkisiyle yapilabilir.', [], 403);
}

// Iptal disinda iptal_nedeni NULL'lanir; gecmis bir iptal_nedeni temizlenir
$iptalNedeni = ($body['durum'] === 'iptal') ? ($body['iptal_nedeni'] ?? null) : null;

// Amac: durum ve (varsa) iptal nedeni guncelle
$stmt = $pdo->prepare(
    'UPDATE randevular
     SET durum = ?, iptal_nedeni = ?, guncelleme_tarihi = NOW()
     WHERE randevu_id = ?'
);
$stmt->execute([$body['durum'], $iptalNedeni, (int)$body['randevu_id']]);

Response::ok([
    'randevu_id' => (int)$body['randevu_id'],
    'durum'      => $body['durum'],
]);

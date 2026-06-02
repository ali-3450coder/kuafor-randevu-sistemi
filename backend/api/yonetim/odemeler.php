<?php
/**
 * Dosya   : api/yonetim/odemeler.php
 * Gorev   : Odeme listesini filtre destekli olarak dondurur.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo    = getDb();
// Onaylandi veya tamamlandi randevularin odemeleri gosterilir
$where  = ["r.durum IN ('onaylandi','tamamlandi')"];
$params = [];

// A-09: Filtre degerlerini enum'a karsi dogrula; gecersiz deger yoksayilir
$izinliOdemeDurumlari = ['bekliyor', 'odendi', 'iptal', 'iade'];
if (!empty($_GET['durum']) && in_array($_GET['durum'], $izinliOdemeDurumlari, true)) {
    $where[]  = 'o.odeme_durumu = ?';
    $params[] = $_GET['durum'];
}
if (!empty($_GET['date'])) {
    $d = DateTime::createFromFormat('Y-m-d', $_GET['date']);
    if ($d && $d->format('Y-m-d') === $_GET['date']) {
        $where[]  = 'DATE(o.odeme_tarihi) = ?';
        $params[] = $_GET['date'];
    }
}
// B-01: Randevu tarihine gore filtre
if (!empty($_GET['randevu_tarihi'])) {
    $d = DateTime::createFromFormat('Y-m-d', $_GET['randevu_tarihi']);
    if ($d && $d->format('Y-m-d') === $_GET['randevu_tarihi']) {
        $where[]  = 'r.randevu_tarihi = ?';
        $params[] = $_GET['randevu_tarihi'];
    }
}

$whereStr = 'WHERE ' . implode(' AND ', $where);

// Amac: odeme + randevu + musteri bilgisini tek sorguda getir
$sql = "SELECT o.odeme_id, r.randevu_kodu, m.ad_soyad AS musteri_ad_soyad,
               o.tutar, o.odeme_tipi, o.odeme_durumu, o.odeme_tarihi
        FROM odemeler o
        JOIN randevular r ON r.randevu_id = o.randevu_id
        JOIN musteriler m ON m.musteri_id = r.musteri_id
        {$whereStr}
        ORDER BY o.olusturma_tarihi DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

Response::list($stmt->fetchAll());

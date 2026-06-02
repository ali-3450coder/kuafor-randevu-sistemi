<?php
/**
 * Dosya   : api/yonetim/randevular.php
 * Gorev   : Filtrelenebilir randevu listesi dondurur. Hizmet ozeti N+1 olmadan toplu sorguyla eklenir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$pdo    = getDb();
// A-09: Filtre degerlerini enum'a karsi dogrula; gecersiz deger sessizce yoksayilir
$where  = [];
$params = [];

$izinliDurumlar = ['beklemede', 'onaylandi', 'tamamlandi', 'iptal', 'gelmedi'];
if (!empty($_GET['status']) && in_array($_GET['status'], $izinliDurumlar, true)) {
    $where[]  = 'r.durum = ?';
    $params[] = $_GET['status'];
}
if (!empty($_GET['date'])) {
    $d = DateTime::createFromFormat('Y-m-d', $_GET['date']);
    if ($d && $d->format('Y-m-d') === $_GET['date']) {
        $where[]  = 'r.randevu_tarihi = ?';
        $params[] = $_GET['date'];
    }
}
if (!empty($_GET['personel_id'])) {
    $where[]  = 'r.personel_id = ?';
    $params[] = (int)$_GET['personel_id'];
}
// A-03: Musteri hesabina gore filtre (musteri-hesaplari sayfasindan gelir)
if (!empty($_GET['musteri_hesap_id'])) {
    $where[]  = 'm.hesap_id = ?';
    $params[] = (int)$_GET['musteri_hesap_id'];
}
// B-05: Musteri ad veya telefon araması
if (!empty($_GET['musteri_ara'])) {
    $where[]  = '(m.ad_soyad LIKE ? OR m.telefon LIKE ?)';
    $aramaStr = '%' . $_GET['musteri_ara'] . '%';
    $params[] = $aramaStr;
    $params[] = $aramaStr;
}

$whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';

// Amac: randevu listesi; musteri, personel bilgisi ve odeme durumu tek sorguda
$sql = "SELECT r.randevu_id, r.randevu_kodu, r.randevu_tarihi,
               r.baslangic_saati, r.bitis_saati, r.durum,
               m.ad_soyad  AS musteri_ad_soyad,
               m.telefon   AS musteri_telefon,
               p.ad_soyad  AS personel_ad_soyad,
               o.tutar     AS toplam_tutar,
               o.odeme_durumu
        FROM randevular r
        JOIN musteriler m  ON m.musteri_id  = r.musteri_id
        JOIN personeller p ON p.personel_id = r.personel_id
        LEFT JOIN odemeler o ON o.randevu_id = r.randevu_id
        {$whereStr}
        ORDER BY r.randevu_tarihi DESC, r.baslangic_saati DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$randevular = $stmt->fetchAll();

if (empty($randevular)) {
    Response::list([]);
}

// Hizmet ozeti: N+1 yerine tek toplu sorgu; PHP'de randevu_id'ye gore grupla
$ids          = array_column($randevular, 'randevu_id');
$placeholders = rtrim(str_repeat('?,', count($ids)), ',');

// Amac: listelenen randevulara ait hizmet sayisini tek sorguda getir
$hStmt = $pdo->prepare(
    "SELECT randevu_id, COUNT(*) AS hizmet_sayisi
     FROM randevu_hizmetleri
     WHERE randevu_id IN ({$placeholders})
     GROUP BY randevu_id"
);
$hStmt->execute($ids);
$hizmetSayilari = [];
foreach ($hStmt->fetchAll() as $row) {
    $hizmetSayilari[$row['randevu_id']] = (int)$row['hizmet_sayisi'];
}

// Hizmet sayisini her randevu satirina ekle
foreach ($randevular as &$r) {
    $r['hizmet_sayisi'] = $hizmetSayilari[$r['randevu_id']] ?? 0;
}
unset($r);

Response::list($randevular);

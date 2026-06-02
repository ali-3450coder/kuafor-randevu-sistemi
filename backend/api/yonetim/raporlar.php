<?php
/**
 * Dosya   : api/yonetim/raporlar.php
 * Gorev   : Istatistik raporlari dondurur.
 *           ?tip=hizmet | personel | aylik
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

$tip = $_GET['tip'] ?? 'hizmet';
$pdo = getDb();

switch ($tip) {

    case 'hizmet':
        // En cok talep edilen hizmetler (randevu gecmisinden)
        $rows = $pdo->query(
            "SELECT rh.hizmet_adi,
                    COUNT(*)           AS randevu_sayisi,
                    SUM(rh.fiyat)      AS toplam_gelir,
                    AVG(rh.fiyat)      AS ortalama_fiyat,
                    SUM(rh.sure_dakika)AS toplam_sure_dakika
             FROM randevu_hizmetleri rh
             JOIN randevular r ON r.randevu_id = rh.randevu_id
             WHERE r.durum IN ('onaylandi','tamamlandi')
             GROUP BY rh.hizmet_adi
             ORDER BY randevu_sayisi DESC"
        )->fetchAll();
        Response::ok(['tip' => 'hizmet', 'veriler' => $rows]);
        break;

    case 'personel':
        // Personel bazli randevu ve gelir ozeti
        $rows = $pdo->query(
            "SELECT p.ad_soyad AS personel_ad,
                    COUNT(DISTINCT r.randevu_id)    AS toplam_randevu,
                    SUM(CASE WHEN r.durum='tamamlandi' THEN 1 ELSE 0 END) AS tamamlanan,
                    SUM(CASE WHEN r.durum='iptal'      THEN 1 ELSE 0 END) AS iptal,
                    COALESCE(SUM(o.tutar),0)         AS toplam_gelir
             FROM personeller p
             LEFT JOIN randevular r  ON r.personel_id = p.personel_id
             LEFT JOIN odemeler  o  ON o.randevu_id  = r.randevu_id
                                    AND o.odeme_durumu = 'odendi'
             GROUP BY p.personel_id
             ORDER BY toplam_randevu DESC"
        )->fetchAll();
        Response::ok(['tip' => 'personel', 'veriler' => $rows]);
        break;

    case 'aylik':
        // Son 12 ay gelir ve randevu trendi
        $rows = $pdo->query(
            "SELECT DATE_FORMAT(r.randevu_tarihi,'%Y-%m') AS ay,
                    COUNT(DISTINCT r.randevu_id)          AS randevu_sayisi,
                    SUM(CASE WHEN r.durum='tamamlandi' THEN 1 ELSE 0 END) AS tamamlanan,
                    COALESCE(SUM(o.tutar),0)              AS gelir
             FROM randevular r
             LEFT JOIN odemeler o ON o.randevu_id=r.randevu_id AND o.odeme_durumu='odendi'
             WHERE r.randevu_tarihi >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
             GROUP BY ay
             ORDER BY ay ASC"
        )->fetchAll();
        Response::ok(['tip' => 'aylik', 'veriler' => $rows]);
        break;

    default:
        Response::fail('Gecersiz rapor tipi. hizmet | personel | aylik', [], 422);
}

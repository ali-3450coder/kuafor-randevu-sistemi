<?php
/**
 * Dosya   : api/yonetim/personel_calisma_saatleri_guncelle.php
 * Gorev   : Personelin haftalik calisma saatlerini atomik olarak yeniler.
 * Bagimli : config/bootstrap.php, middleware/admin_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/admin_zorunlu.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

$body = Request::json();

$v = Validator::check($body, [
    'personel_id' => ['required', 'positive_int'],
    'saatler'     => ['required'],
]);

if (!$v['ok']) {
    Response::fail('Dogrulama hatasi.', $v['errors'], 422);
}

if (!is_array($body['saatler'])) {
    Response::fail('Dogrulama hatasi.', ['saatler' => ['saatler dizi olmalidir.']], 422);
}

$izinliGunler = ['pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi', 'pazar'];

// Her satiri dogrula: gun enum + saat formati
$satirHatalari = [];
foreach ($body['saatler'] as $idx => $satir) {
    if (!in_array($satir['gun'] ?? '', $izinliGunler, true)) {
        $satirHatalari["saatler.{$idx}.gun"] = ['Gecersiz gun adi.'];
    }
    $acilisGecerli  = !empty($satir['acilis'])  && DateTime::createFromFormat('H:i', $satir['acilis']);
    $karanisGecerli = !empty($satir['kapanis']) && DateTime::createFromFormat('H:i', $satir['kapanis']);

    if (!$acilisGecerli) {
        $satirHatalari["saatler.{$idx}.acilis"] = ['Gecerli acilis saati (H:i) gereklidir.'];
    }
    if (!$karanisGecerli) {
        $satirHatalari["saatler.{$idx}.kapanis"] = ['Gecerli kapanis saati (H:i) gereklidir.'];
    }
    if ($acilisGecerli && $karanisGecerli && $satir['acilis'] >= $satir['kapanis']) {
        $satirHatalari["saatler.{$idx}.kapanis"] = ['Kapanis saati acilis saatinden sonra olmalidir.'];
    }
}

if (!empty($satirHatalari)) {
    Response::fail('Calisma saati dogrulama hatasi.', $satirHatalari, 422);
}

$pdo        = getDb();
$personelId = (int)$body['personel_id'];

// Transaction: atomik yenileme; manuel diff yerine tam yenileme tercih edildi.
$pdo->beginTransaction();
try {
    // Amac: personele ait tum mevcut calisma saatlerini temizle
    $del = $pdo->prepare('DELETE FROM calisma_saatleri WHERE personel_id = ?');
    $del->execute([$personelId]);

    // Amac: gonderilen saat satirlarini ekle; acilis/kapanis -> baslangic_saati/bitis_saati
    $ins = $pdo->prepare(
        'INSERT INTO calisma_saatleri (personel_id, gun, baslangic_saati, bitis_saati, durum)
         VALUES (?, ?, ?, ?, ?)'
    );
    foreach ($body['saatler'] as $satir) {
        $ins->execute([
            $personelId,
            $satir['gun'],
            $satir['acilis'],
            $satir['kapanis'],
            isset($satir['durum']) ? (int)$satir['durum'] : 1,
        ]);
    }

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    Yardimcilar::hataLogla($e->getMessage(), ['personel_id' => $personelId]);
    Response::fail('Calisma saati guncelleme sirasinda hata olustu.', [], 500);
}

Response::ok(['personel_id' => $personelId, 'guncellenen_gun_sayisi' => count($body['saatler'])]);

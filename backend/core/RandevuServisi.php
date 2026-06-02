<?php
/**
 * Dosya   : core/RandevuServisi.php
 * Gorev   : Randevu is mantiginin tamamini barindirir.
 *           Uygun saat hesaplama, randevu olusturma ve yardimci sorgular bu sinifta.
 * Bagimli : config/database.php (getDb), core/Yardimcilar.php, config/app.php (SLOT_MIN, MAX_KOD_DENEME)
 */

class RandevuServisi
{
    private PDO $db;

    public function __construct()
    {
        $this->db = getDb();
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Uygun saatler
    // -------------------------------------------------------------------------

    /**
     * Bir personelin belirtilen tarihteki uygun randevu baslangic saatlerini dondurur.
     *
     * @param int    $personelId  Sorgulanacak personelin ID'si.
     * @param array  $hizmetIdler Istenen hizmetlerin ID dizisi.
     * @param string $tarih       Y-m-d formatinda randevu tarihi.
     * @return array Uygun "HH:MM" string slotlari.
     * @throws RuntimeException Personel/hizmet gecersizse veya DB hatasinda.
     */
    public function uygunSaatler(int $personelId, array $hizmetIdler, string $tarih): array
    {
        // Gecmis tarih kabul edilmez
        if ($tarih < date('Y-m-d')) {
            throw new RuntimeException('Gecmis tarih icin slot sorgulanamaz.', 422);
        }

        // Personel aktif mi?
        $this->personelAktifMi($personelId);

        // Hizmetleri dogrula ve toplam sureyi al
        $dogrulama    = $this->hizmetleriDogrula($personelId, $hizmetIdler);
        $toplamSure   = $dogrulama['toplam_sure'];

        // Personelin o gun calisma saatlerini getir
        $gunAdi       = Yardimcilar::gunAdiCevir($tarih);
        $calisma      = $this->calismaSaatiGetir($personelId, $gunAdi);
        if ($calisma === null) {
            // Personel o gun calismiyorsa bos liste dondur
            return [];
        }

        $slots = [];
        $bugun = date('Y-m-d');
        // Calisma araligini SLOT_MIN dakikalik baslangic noktalarina bol
        $mevcut = $calisma['baslangic_saati'];
        while (true) {
            $bitis = Yardimcilar::dakikaEkle($mevcut, $toplamSure);

            // Bitis calisma bitis saatini gecerse bu ve sonraki slotlar gecersiz
            if ($bitis > $calisma['bitis_saati']) {
                break;
            }

            // Bugun icin gecmis baslangic saatli slotlari gosterme
            $slotGecerli = ($tarih !== $bugun || $mevcut > date('H:i'));

            // Cakisma yoksa ve slot gecerliyse ekle
            if ($slotGecerli && !$this->cakismaVarMi($personelId, $tarih, $mevcut, $bitis)) {
                $slots[] = $mevcut;
            }

            // Sonraki slot baslangicina atla
            $mevcut = Yardimcilar::dakikaEkle($mevcut, SLOT_MIN);

            // Calisma bitisini gecmemeli (baslangic noktasi bile olamaz)
            if ($mevcut >= $calisma['bitis_saati']) {
                break;
            }
        }

        return $slots;
    }

    // -------------------------------------------------------------------------
    // PUBLIC: Randevu olustur
    // -------------------------------------------------------------------------

    /**
     * Yeni randevu olusturur; musteri upsert, slot dogrulama ve 3 tabloya atomik yazmayi kapsar.
     *
     * @param array $payload Dogrulanmis form verisi (ad_soyad, telefon, email, hizmet_idler, ...).
     * @return array ['randevu_id' => int, 'randevu_kodu' => string, 'durum' => string]
     * @throws RuntimeException Is kurali ihlalinde veya DB hatasinda.
     */
    public function randevuOlustur(array $payload): array
    {
        // --- KATMAN B: Is kurali dogrulamalari (transaction oncesi) ---

        // Personel aktif mi?
        $this->personelAktifMi((int)$payload['personel_id']);

        // Hizmetleri dogrula; toplam sure ve snapshot al
        $dogrulama  = $this->hizmetleriDogrula((int)$payload['personel_id'], $payload['hizmet_idler']);
        $toplamSure = $dogrulama['toplam_sure'];
        $hizmetler  = $dogrulama['hizmetler'];
        $toplamFiyat = array_sum(array_column($hizmetler, 'fiyat'));

        $baslangic  = $payload['baslangic_saati'];
        $bitis      = Yardimcilar::dakikaEkle($baslangic, $toplamSure);

        // Calisma saati uygun mu?
        if (!$this->calismaSaatiUygunMu((int)$payload['personel_id'], $payload['randevu_tarihi'], $baslangic, $bitis)) {
            throw new RuntimeException('Secilen saat personelin calisma saatleri disinda.', 409);
        }

        // Aralik cakismasi var mi? (beklemede veya onaylandi durumundaki randevularla)
        if ($this->cakismaVarMi((int)$payload['personel_id'], $payload['randevu_tarihi'], $baslangic, $bitis)) {
            throw new RuntimeException('Secilen saat araliginda baska bir randevu mevcut.', 409);
        }

        // --- KATMAN C: Atomik yazma ---
        // Transaction: randevular + randevu_hizmetleri + odemeler atomik; yarim kayit kabul edilemez.
        $this->db->beginTransaction();
        try {
            // Musteri upsert: telefon veya email ile var mi kontrol et
            $musteriId = $this->musteriEkle($payload);

            // Benzersiz randevu kodu uret ve UNIQUE kontrol et
            // 5 deneme yeterli; collision pratikte cok dusuk olasilik.
            $randevuKodu = null;
            for ($i = 0; $i < MAX_KOD_DENEME; $i++) {
                $aday = Yardimcilar::randevuKoduUret();

                // Amac: kod benzersizligini dogrula
                $kontrol = $this->db->prepare('SELECT 1 FROM randevular WHERE randevu_kodu = ? LIMIT 1');
                $kontrol->execute([$aday]);
                if (!$kontrol->fetch()) {
                    $randevuKodu = $aday;
                    break;
                }
            }
            if ($randevuKodu === null) {
                throw new RuntimeException('Randevu kodu uretimi basarisiz oldu.');
            }

            // Amac: yeni randevu satirini ekle
            $stmt = $this->db->prepare(
                'INSERT INTO randevular
                    (musteri_id, personel_id, randevu_tarihi, baslangic_saati, bitis_saati,
                     randevu_kodu, durum, notlar)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $musteriId,
                (int)$payload['personel_id'],
                $payload['randevu_tarihi'],
                $baslangic,
                $bitis,
                $randevuKodu,
                'beklemede',
                $payload['notlar'] ?? null,
            ]);
            $randevuId = (int)$this->db->lastInsertId();

            // Hizmet fiyat/sure sonradan degisirse gecmis randevu bozulmasin.
            foreach ($hizmetler as $h) {
                $ins = $this->db->prepare(
                    'INSERT INTO randevu_hizmetleri
                        (randevu_id, hizmet_id, hizmet_adi, sure_dakika, fiyat)
                     VALUES (?, ?, ?, ?, ?)'
                );
                $ins->execute([
                    $randevuId,
                    $h['hizmet_id'],
                    $h['hizmet_adi'],
                    $h['sure_dakika'],
                    $h['fiyat'],
                ]);
            }

            // Amac: odeme kaydini olustur
            $odeme = $this->db->prepare(
                'INSERT INTO odemeler (randevu_id, tutar, odeme_durumu)
                 VALUES (?, ?, ?)'
            );
            $odeme->execute([$randevuId, $toplamFiyat, 'bekliyor']);

            $this->db->commit();

            // Personel adini al (ozet icin)
            $pStmt = $this->db->prepare('SELECT ad_soyad, unvan FROM personeller WHERE personel_id = ? LIMIT 1');
            $pStmt->execute([(int)$payload['personel_id']]);
            $personel = $pStmt->fetch() ?: ['ad_soyad' => '', 'unvan' => ''];

            return [
                'randevu_id'    => $randevuId,
                'durum'         => 'beklemede',
                /* randevu_kodu admin panelinde kalir, musteri API'sinden gonderilmez */
                'ozet'          => [
                    'randevu_tarihi'  => $payload['randevu_tarihi'],
                    'baslangic_saati' => $baslangic,
                    'bitis_saati'     => $bitis,
                    'personel_ad'     => $personel['ad_soyad'],
                    'personel_unvan'  => $personel['unvan'] ?? '',
                    'hizmetler'       => array_map(function ($h) {
                        return ['hizmet_adi' => $h['hizmet_adi'], 'fiyat' => (float)$h['fiyat']];
                    }, $hizmetler),
                    'toplam_tutar'    => (float)$toplamFiyat,
                ],
            ];
        } catch (Throwable $e) {
            $this->db->rollBack();
            // Kisisel veri (ad_soyad, telefon, email, notlar, hesap_id) loglanmaz
            $guvenliPayload = array_diff_key($payload, array_flip(['ad_soyad', 'telefon', 'email', 'notlar', 'hesap_id']));
            Yardimcilar::hataLogla($e->getMessage(), ['payload' => $guvenliPayload]);
            throw $e;
        }
    }

    // -------------------------------------------------------------------------
    // PRIVATE: Yardimci metodlar
    // -------------------------------------------------------------------------

    /**
     * Yeni slot ile mevcut onaylanmis/beklemedeki randevularin cakisip cakismadığini kontrol eder.
     * Aralik cakismasi: yeni_baslangic < eski_bitis VE yeni_bitis > eski_baslangic. Esitlik dahil degil.
     *
     * @param int    $personelId Personel ID.
     * @param string $tarih      Y-m-d formatinda tarih.
     * @param string $baslangic  H:i formatinda yeni randevu baslangic saati.
     * @param string $bitis      H:i formatinda yeni randevu bitis saati.
     * @return bool Cakisma varsa true.
     */
    private function cakismaVarMi(int $personelId, string $tarih, string $baslangic, string $bitis): bool
    {
        // Amac: ayni personel icin cakisan aktif randevuyu bul
        $stmt = $this->db->prepare(
            'SELECT 1 FROM randevular
             WHERE personel_id = ?
               AND randevu_tarihi = ?
               AND durum IN (\'beklemede\', \'onaylandi\')
               AND ? < bitis_saati
               AND ? > baslangic_saati
             LIMIT 1'
        );
        // Parametre sirasi: personel_id, tarih, yeni_baslangic, yeni_bitis
        $stmt->execute([$personelId, $tarih, $baslangic, $bitis]);
        return (bool)$stmt->fetch();
    }

    /**
     * Personelin ilgili gun ve saat araliginda calisip calismadığini dogrular.
     *
     * @param int    $personelId Personel ID.
     * @param string $tarih      Y-m-d formatinda tarih.
     * @param string $baslangic  H:i formatinda baslangic saati.
     * @param string $bitis      H:i formatinda bitis saati.
     * @return bool Calisma saati uygunsa true.
     */
    private function calismaSaatiUygunMu(int $personelId, string $tarih, string $baslangic, string $bitis): bool
    {
        $gunAdi  = Yardimcilar::gunAdiCevir($tarih);
        $calisma = $this->calismaSaatiGetir($personelId, $gunAdi);
        if ($calisma === null) {
            return false;
        }
        // Baslangic calisma baslangicinda veya sonra; bitis bitis saatinde veya once olmali
        return $baslangic >= $calisma['baslangic_saati'] && $bitis <= $calisma['bitis_saati'];
    }

    /**
     * Personelin hizmetleri verebilecegini dogrular; toplam sure ve snapshot listesi dondurur.
     *
     * @param int   $personelId  Personel ID.
     * @param array $hizmetIdler Hizmet ID dizisi.
     * @return array ['toplam_sure' => int, 'hizmetler' => array]
     * @throws RuntimeException Hizmet eksikse veya personel veremiyor ise.
     */
    private function hizmetleriDogrula(int $personelId, array $hizmetIdler): array
    {
        $sayim        = count($hizmetIdler);
        $ids          = array_map('intval', $hizmetIdler);
        $placeholders = rtrim(str_repeat('?,', $sayim), ',');

        // Amac: secilen tum hizmetleri verebilen aktif personeli dogrula; sure ve fiyat snapshot al
        // Guvenlik: ID'ler bind ediliyor, SQL'e dogrudan gomulmuyor
        $sql = "SELECT h.hizmet_id, h.hizmet_adi, h.sure_dakika, h.fiyat
                FROM hizmetler h
                JOIN personel_hizmetleri ph ON ph.hizmet_id = h.hizmet_id
                WHERE h.durum = 1
                  AND ph.durum = 1
                  AND ph.personel_id = ?
                  AND h.hizmet_id IN ({$placeholders})
                GROUP BY h.hizmet_id";

        // Personel_id once, sonra hizmet ID'leri
        $params = array_merge([$personelId], $ids);
        $stmt   = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Donulen satir sayisi istenen hizmet sayisiyla eslesmelidir
        if (count($rows) !== $sayim) {
            throw new RuntimeException('Bir veya daha fazla hizmet personel tarafindan verilemiyor ya da mevcut degil.', 422);
        }

        $toplamSure = (int)array_sum(array_column($rows, 'sure_dakika'));
        return ['toplam_sure' => $toplamSure, 'hizmetler' => $rows];
    }

    /**
     * Personelin belirtilen gune ait aktif calisma saatlerini dondurur.
     *
     * @param int    $personelId Personel ID.
     * @param string $gunAdi     Kucuk harfli Turkce gun adi (pazartesi..pazar).
     * @return array|null ['acilis_saati'=>'HH:MM','kapanis_saati'=>'HH:MM'] veya null.
     */
    private function calismaSaatiGetir(int $personelId, string $gunAdi): ?array
    {
        // Amac: personelin gun bazli calisma araligini getir
        // TIME_FORMAT: MySQL TIME kolonu H:i:s dondurur; H:i olarak normalize et
        $stmt = $this->db->prepare(
            'SELECT TIME_FORMAT(baslangic_saati, \'%H:%i\') AS baslangic_saati,
                    TIME_FORMAT(bitis_saati, \'%H:%i\') AS bitis_saati
             FROM calisma_saatleri
             WHERE personel_id = ? AND gun = ? AND durum = 1
             LIMIT 1'
        );
        $stmt->execute([$personelId, $gunAdi]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Personelin aktif (durum=1) oldugunu dogrular.
     *
     * @param int $personelId Personel ID.
     * @throws RuntimeException Personel bulunamazsa veya pasifse.
     */
    private function personelAktifMi(int $personelId): void
    {
        // Amac: pasif veya olmayan personele randevu alinmasini engelle
        $stmt = $this->db->prepare('SELECT 1 FROM personeller WHERE personel_id = ? AND durum = 1 LIMIT 1');
        $stmt->execute([$personelId]);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Personel bulunamadi veya aktif degil.', 422);
        }
    }

    /**
     * Her randevu icin bagimsiz bir musteri satiri olusturur.
     * Ayni telefon/email daha once kullanilmis olsa bile yeni kayit acilir;
     * boylece her randevu kendi musteri snapshot'ina sahip olur ve randevular birbirini etkilemez.
     *
     * @param array $payload Form verisi.
     * @return int Yeni musteri ID.
     */
    private function musteriEkle(array $payload): int
    {
        $email    = (isset($payload['email']) && $payload['email'] !== '') ? $payload['email'] : null;
        // B-11: Giris yapmis mustерinin hesap_id'si snapshot'a yazilir; misafirde NULL kalir
        $hesapId  = isset($payload['hesap_id']) ? (int)$payload['hesap_id'] : null;

        $ins = $this->db->prepare(
            'INSERT INTO musteriler (hesap_id, ad_soyad, telefon, email) VALUES (?, ?, ?, ?)'
        );
        $ins->execute([$hesapId, $payload['ad_soyad'], $payload['telefon'], $email]);
        return (int)$this->db->lastInsertId();
    }
}

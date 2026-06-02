<?php
/**
 * Dosya   : core/Yardimcilar.php
 * Gorev   : Tarih/saat donusumu, randevu kodu uretimi ve hata loglama yardimcilari.
 * Bagimli : config/app.php (LOG_PATH sabiti)
 */

class Yardimcilar
{
    /**
     * Y-m-d formatindaki tarihin Turkce gun adini dondurur.
     *
     * @param string $tarih Y-m-d formatinda tarih.
     * @return string pazartesi|sali|carsamba|persembe|cuma|cumartesi|pazar
     */
    public static function gunAdiCevir(string $tarih): string
    {
        $gunler = [
            1 => 'pazartesi',
            2 => 'sali',
            3 => 'carsamba',
            4 => 'persembe',
            5 => 'cuma',
            6 => 'cumartesi',
            7 => 'pazar',
        ];

        // date('N') ISO-8601 gun numarasi: 1=Pazartesi, 7=Pazar
        $no = (int) date('N', strtotime($tarih));
        return $gunler[$no] ?? 'bilinmiyor';
    }

    /**
     * Benzersiz randevu kodu uretir: RND- + 6 karakter (A-Z0-9).
     *
     * @return string Ornek: RND-A3X9KQ
     */
    public static function randevuKoduUret(): string
    {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $kod   = '';
        for ($i = 0; $i < 6; $i++) {
            $kod .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return RND_PREFIX . $kod;
    }

    /**
     * H:i formatindaki saate dakika ekler ve sonucu H:i olarak dondurur.
     *
     * @param string $saat H:i formatinda baslangic saati.
     * @param int    $dak  Eklenecek dakika.
     * @return string H:i formatinda bitis saati.
     */
    public static function dakikaEkle(string $saat, int $dak): string
    {
        $dt = DateTime::createFromFormat('H:i', $saat);
        $dt->modify("+{$dak} minutes");
        return $dt->format('H:i');
    }

    /**
     * Hatayi gunluk log dosyasina JSON satiri olarak yazar.
     * Dosya yoksa olusturur; varsa sonuna ekler.
     *
     * @param string $mesaj Hata aciklamasi.
     * @param array  $baglam Ek baglam verisi (dosya, satir, vb.).
     * @return void
     */
    public static function hataLogla(string $mesaj, array $baglam = []): void
    {
        $dosya = LOG_PATH . 'hata-' . date('Y-m-d') . '.log';

        $satir = json_encode([
            'zaman'  => date('Y-m-d H:i:s'),
            'mesaj'  => $mesaj,
            'baglam' => $baglam,
        ], JSON_UNESCAPED_UNICODE);

        // FILE_APPEND ile mevcut loga ekle; LOCK_EX eş zamanli yazmayi onle
        file_put_contents($dosya, $satir . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

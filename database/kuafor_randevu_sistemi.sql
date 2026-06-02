-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Anamakine: 127.0.0.1:3307
-- Üretim Zamanı: 06 May 2026, 16:06:02
-- Sunucu sürümü: 10.4.32-MariaDB
-- PHP Sürümü: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Veritabanı: `kuafor_randevu_sistemi`
--

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `calisma_saatleri`
--

CREATE TABLE `calisma_saatleri` (
  `calisma_id` int(11) NOT NULL,
  `personel_id` int(11) NOT NULL,
  `gun` enum('pazartesi','sali','carsamba','persembe','cuma','cumartesi','pazar') NOT NULL,
  `baslangic_saati` time NOT NULL,
  `bitis_saati` time NOT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `calisma_saatleri`
--

INSERT INTO `calisma_saatleri` (`calisma_id`, `personel_id`, `gun`, `baslangic_saati`, `bitis_saati`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(2, 1, 'pazartesi', '09:00:00', '18:00:00', 1, '2026-05-05 22:03:05', '2026-05-05 22:03:05'),
(3, 1, 'carsamba', '09:00:00', '18:00:00', 1, '2026-05-05 22:03:05', '2026-05-05 22:03:05');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `hizmetler`
--

CREATE TABLE `hizmetler` (
  `hizmet_id` int(11) NOT NULL,
  `hizmet_adi` varchar(100) NOT NULL,
  `aciklama` text DEFAULT NULL,
  `sure_dakika` int(11) NOT NULL,
  `fiyat` decimal(10,2) NOT NULL DEFAULT 0.00,
  `kategori` varchar(100) DEFAULT NULL,
  `gorsel_url` varchar(255) DEFAULT NULL,
  `populer_mi` tinyint(1) NOT NULL DEFAULT 0,
  `siralama` int(11) NOT NULL DEFAULT 0,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `hizmetler`
--

INSERT INTO `hizmetler` (`hizmet_id`, `hizmet_adi`, `aciklama`, `sure_dakika`, `fiyat`, `kategori`, `gorsel_url`, `populer_mi`, `siralama`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(1, 'Sac Kesimi', NULL, 30, 150.00, NULL, NULL, 1, 1, 1, '2026-05-05 21:46:45', '2026-05-05 21:46:45'),
(2, 'Sac Boyama', NULL, 60, 300.00, NULL, NULL, 0, 0, 0, '2026-05-05 22:03:22', '2026-05-05 22:03:22');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `kullanicilar`
--

CREATE TABLE `kullanicilar` (
  `kullanici_id` int(11) NOT NULL,
  `ad_soyad` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `sifre_hash` varchar(255) NOT NULL,
  `rol` enum('admin','personel') NOT NULL DEFAULT 'admin',
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `son_giris_tarihi` datetime DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `kullanicilar`
--

INSERT INTO `kullanicilar` (`kullanici_id`, `ad_soyad`, `email`, `sifre_hash`, `rol`, `durum`, `son_giris_tarihi`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(1, 'Admin Test', 'admin@test.com', '$2y$10$4OAiria3fvT0FIQl999UhuJPFMqb.DSLL40LISYxaxpUBRnqFNBZy', 'admin', 1, '2026-05-05 22:03:37', '2026-05-05 21:52:00', '2026-05-05 22:03:37'),
(2, 'Sistem Yoneticisi', 'admin@kuafor.local', '$2y$10$fVkTQTOJJ31xYH7N3DE8bOX3i7KWMiGZczfQsA2hJmr0GiRmNOi1C', 'admin', 1, '2026-05-05 22:13:19', '2026-05-05 22:13:18', '2026-05-05 22:13:19');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `musteriler`
--

CREATE TABLE `musteriler` (
  `musteri_id` int(11) NOT NULL,
  `ad_soyad` varchar(100) NOT NULL,
  `telefon` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `notlar` text DEFAULT NULL,
  `kayit_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `musteriler`
--

INSERT INTO `musteriler` (`musteri_id`, `ad_soyad`, `telefon`, `email`, `notlar`, `kayit_tarihi`, `guncelleme_tarihi`) VALUES
(1, 'Ahmet Yilmaz', '05551234567', 'ahmet@test.com', NULL, '2026-05-05 21:47:58', '2026-05-05 21:47:58'),
(2, 'Ali Veli', '05551111111', 'ali@test.com', NULL, '2026-05-05 21:48:10', '2026-05-05 21:48:10');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `odemeler`
--

CREATE TABLE `odemeler` (
  `odeme_id` int(11) NOT NULL,
  `randevu_id` int(11) NOT NULL,
  `tutar` decimal(10,2) NOT NULL DEFAULT 0.00,
  `odeme_tipi` enum('nakit','kart','havale','diger') DEFAULT NULL,
  `odeme_durumu` enum('bekliyor','odendi','iptal','iade') NOT NULL DEFAULT 'bekliyor',
  `odeme_tarihi` datetime DEFAULT NULL,
  `aciklama` text DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `odemeler`
--

INSERT INTO `odemeler` (`odeme_id`, `randevu_id`, `tutar`, `odeme_tipi`, `odeme_durumu`, `odeme_tarihi`, `aciklama`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(1, 1, 150.00, 'nakit', 'iade', NULL, NULL, '2026-05-05 21:47:58', '2026-05-05 22:03:22'),
(2, 2, 150.00, NULL, 'bekliyor', NULL, NULL, '2026-05-05 21:48:10', '2026-05-05 21:48:10');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `personeller`
--

CREATE TABLE `personeller` (
  `personel_id` int(11) NOT NULL,
  `ad_soyad` varchar(100) NOT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `unvan` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `kayit_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `personeller`
--

INSERT INTO `personeller` (`personel_id`, `ad_soyad`, `telefon`, `unvan`, `bio`, `foto_url`, `durum`, `kayit_tarihi`, `guncelleme_tarihi`) VALUES
(1, 'Test Personel', '05001112233', 'Uzman', NULL, NULL, 1, '2026-05-05 21:46:45', '2026-05-05 21:46:45'),
(2, 'Yeni Personel', '05551112233', 'Kalfa', NULL, NULL, 0, '2026-05-05 22:03:05', '2026-05-05 22:03:05');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `personel_hizmetleri`
--

CREATE TABLE `personel_hizmetleri` (
  `personel_hizmet_id` int(11) NOT NULL,
  `personel_id` int(11) NOT NULL,
  `hizmet_id` int(11) NOT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `personel_hizmetleri`
--

INSERT INTO `personel_hizmetleri` (`personel_hizmet_id`, `personel_id`, `hizmet_id`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(2, 1, 1, 1, '2026-05-05 22:03:05', '2026-05-05 22:03:05');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `randevular`
--

CREATE TABLE `randevular` (
  `randevu_id` int(11) NOT NULL,
  `randevu_kodu` varchar(20) NOT NULL,
  `musteri_id` int(11) NOT NULL,
  `personel_id` int(11) NOT NULL,
  `randevu_tarihi` date NOT NULL,
  `baslangic_saati` time NOT NULL,
  `bitis_saati` time NOT NULL,
  `durum` enum('beklemede','onaylandi','iptal','tamamlandi','gelmedi') NOT NULL DEFAULT 'beklemede',
  `notlar` text DEFAULT NULL,
  `iptal_nedeni` text DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `randevular`
--

INSERT INTO `randevular` (`randevu_id`, `randevu_kodu`, `musteri_id`, `personel_id`, `randevu_tarihi`, `baslangic_saati`, `bitis_saati`, `durum`, `notlar`, `iptal_nedeni`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES
(1, 'RND-F2MVH9', 1, 1, '2026-05-06', '10:00:00', '10:30:00', 'iptal', NULL, 'Test iptali', '2026-05-05 21:47:58', '2026-05-05 21:54:06'),
(2, 'RND-8AM4T9', 2, 1, '2026-05-06', '10:30:00', '11:00:00', 'beklemede', NULL, NULL, '2026-05-05 21:48:10', '2026-05-05 21:48:10');

-- --------------------------------------------------------

--
-- Tablo için tablo yapısı `randevu_hizmetleri`
--

CREATE TABLE `randevu_hizmetleri` (
  `randevu_hizmet_id` int(11) NOT NULL,
  `randevu_id` int(11) NOT NULL,
  `hizmet_id` int(11) NOT NULL,
  `hizmet_adi` varchar(100) NOT NULL,
  `sure_dakika` int(11) NOT NULL,
  `fiyat` decimal(10,2) NOT NULL,
  `siralama` int(11) NOT NULL DEFAULT 0,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Tablo döküm verisi `randevu_hizmetleri`
--

INSERT INTO `randevu_hizmetleri` (`randevu_hizmet_id`, `randevu_id`, `hizmet_id`, `hizmet_adi`, `sure_dakika`, `fiyat`, `siralama`, `olusturma_tarihi`) VALUES
(1, 1, 1, 'Sac Kesimi', 30, 150.00, 0, '2026-05-05 21:47:58'),
(2, 2, 1, 'Sac Kesimi', 30, 150.00, 0, '2026-05-05 21:48:10');

--
-- Dökümü yapılmış tablolar için indeksler
--

--
-- Tablo için indeksler `calisma_saatleri`
--
ALTER TABLE `calisma_saatleri`
  ADD PRIMARY KEY (`calisma_id`),
  ADD UNIQUE KEY `uq_calisma_saatleri_personel_gun_saat` (`personel_id`,`gun`,`baslangic_saati`,`bitis_saati`),
  ADD KEY `idx_calisma_saatleri_personel_gun` (`personel_id`,`gun`),
  ADD KEY `idx_calisma_saatleri_durum` (`durum`);

--
-- Tablo için indeksler `hizmetler`
--
ALTER TABLE `hizmetler`
  ADD PRIMARY KEY (`hizmet_id`),
  ADD UNIQUE KEY `uq_hizmetler_hizmet_adi` (`hizmet_adi`),
  ADD KEY `idx_hizmetler_durum` (`durum`),
  ADD KEY `idx_hizmetler_populer` (`populer_mi`),
  ADD KEY `idx_hizmetler_kategori` (`kategori`);

--
-- Tablo için indeksler `kullanicilar`
--
ALTER TABLE `kullanicilar`
  ADD PRIMARY KEY (`kullanici_id`),
  ADD UNIQUE KEY `uq_kullanicilar_email` (`email`),
  ADD KEY `idx_kullanicilar_rol` (`rol`),
  ADD KEY `idx_kullanicilar_durum` (`durum`);

--
-- Tablo için indeksler `musteriler`
--
ALTER TABLE `musteriler`
  ADD PRIMARY KEY (`musteri_id`),
  ADD KEY `idx_musteriler_telefon` (`telefon`),
  ADD KEY `idx_musteriler_email` (`email`);

--
-- Tablo için indeksler `odemeler`
--
ALTER TABLE `odemeler`
  ADD PRIMARY KEY (`odeme_id`),
  ADD UNIQUE KEY `uq_odemeler_randevu` (`randevu_id`),
  ADD KEY `idx_odemeler_durum` (`odeme_durumu`),
  ADD KEY `idx_odemeler_tarih` (`odeme_tarihi`);

--
-- Tablo için indeksler `personeller`
--
ALTER TABLE `personeller`
  ADD PRIMARY KEY (`personel_id`),
  ADD KEY `idx_personeller_durum` (`durum`);

--
-- Tablo için indeksler `personel_hizmetleri`
--
ALTER TABLE `personel_hizmetleri`
  ADD PRIMARY KEY (`personel_hizmet_id`),
  ADD UNIQUE KEY `uq_personel_hizmetleri` (`personel_id`,`hizmet_id`),
  ADD KEY `idx_personel_hizmetleri_personel` (`personel_id`),
  ADD KEY `idx_personel_hizmetleri_hizmet` (`hizmet_id`),
  ADD KEY `idx_personel_hizmetleri_durum` (`durum`);

--
-- Tablo için indeksler `randevular`
--
ALTER TABLE `randevular`
  ADD PRIMARY KEY (`randevu_id`),
  ADD UNIQUE KEY `uq_randevular_randevu_kodu` (`randevu_kodu`),
  ADD KEY `idx_randevular_musteri` (`musteri_id`),
  ADD KEY `idx_randevular_personel_tarih` (`personel_id`,`randevu_tarihi`),
  ADD KEY `idx_randevular_durum` (`durum`),
  ADD KEY `idx_randevular_tarih_saat` (`randevu_tarihi`,`baslangic_saati`,`bitis_saati`);

--
-- Tablo için indeksler `randevu_hizmetleri`
--
ALTER TABLE `randevu_hizmetleri`
  ADD PRIMARY KEY (`randevu_hizmet_id`),
  ADD UNIQUE KEY `uq_randevu_hizmetleri` (`randevu_id`,`hizmet_id`),
  ADD KEY `idx_randevu_hizmetleri_randevu` (`randevu_id`),
  ADD KEY `idx_randevu_hizmetleri_hizmet` (`hizmet_id`);

--
-- Dökümü yapılmış tablolar için AUTO_INCREMENT değeri
--

--
-- Tablo için AUTO_INCREMENT değeri `calisma_saatleri`
--
ALTER TABLE `calisma_saatleri`
  MODIFY `calisma_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `hizmetler`
--
ALTER TABLE `hizmetler`
  MODIFY `hizmet_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `kullanicilar`
--
ALTER TABLE `kullanicilar`
  MODIFY `kullanici_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `musteriler`
--
ALTER TABLE `musteriler`
  MODIFY `musteri_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `odemeler`
--
ALTER TABLE `odemeler`
  MODIFY `odeme_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `personeller`
--
ALTER TABLE `personeller`
  MODIFY `personel_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `personel_hizmetleri`
--
ALTER TABLE `personel_hizmetleri`
  MODIFY `personel_hizmet_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tablo için AUTO_INCREMENT değeri `randevular`
--
ALTER TABLE `randevular`
  MODIFY `randevu_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Tablo için AUTO_INCREMENT değeri `randevu_hizmetleri`
--
ALTER TABLE `randevu_hizmetleri`
  MODIFY `randevu_hizmet_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Dökümü yapılmış tablolar için kısıtlamalar
--

--
-- Tablo kısıtlamaları `calisma_saatleri`
--
ALTER TABLE `calisma_saatleri`
  ADD CONSTRAINT `fk_calisma_saatleri_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `odemeler`
--
ALTER TABLE `odemeler`
  ADD CONSTRAINT `fk_odemeler_randevu` FOREIGN KEY (`randevu_id`) REFERENCES `randevular` (`randevu_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `personel_hizmetleri`
--
ALTER TABLE `personel_hizmetleri`
  ADD CONSTRAINT `fk_personel_hizmetleri_hizmet` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`hizmet_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_personel_hizmetleri_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `randevular`
--
ALTER TABLE `randevular`
  ADD CONSTRAINT `fk_randevular_musteri` FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`musteri_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_randevular_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON UPDATE CASCADE;

--
-- Tablo kısıtlamaları `randevu_hizmetleri`
--
ALTER TABLE `randevu_hizmetleri`
  ADD CONSTRAINT `fk_randevu_hizmetleri_hizmet` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`hizmet_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_randevu_hizmetleri_randevu` FOREIGN KEY (`randevu_id`) REFERENCES `randevular` (`randevu_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

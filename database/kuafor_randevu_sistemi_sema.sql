-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: kuafor_randevu_sistemi
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `calisma_saatleri`
--

DROP TABLE IF EXISTS `calisma_saatleri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calisma_saatleri` (
  `calisma_id` int(11) NOT NULL AUTO_INCREMENT,
  `personel_id` int(11) NOT NULL,
  `gun` enum('pazartesi','sali','carsamba','persembe','cuma','cumartesi','pazar') NOT NULL,
  `baslangic_saati` time NOT NULL,
  `bitis_saati` time NOT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`calisma_id`),
  UNIQUE KEY `uq_calisma_saatleri_personel_gun_saat` (`personel_id`,`gun`,`baslangic_saati`,`bitis_saati`),
  KEY `idx_calisma_saatleri_personel_gun` (`personel_id`,`gun`),
  KEY `idx_calisma_saatleri_durum` (`durum`),
  CONSTRAINT `fk_calisma_saatleri_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_calisma_saatleri_saat` CHECK (`bitis_saati` > `baslangic_saati`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hizmetler`
--

DROP TABLE IF EXISTS `hizmetler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `hizmetler` (
  `hizmet_id` int(11) NOT NULL AUTO_INCREMENT,
  `hizmet_adi` varchar(100) NOT NULL,
  `aciklama` text DEFAULT NULL,
  `sure_dakika` int(11) NOT NULL,
  `fiyat` decimal(10,2) NOT NULL DEFAULT 0.00,
  `kategori` varchar(100) DEFAULT NULL,
  `populer_mi` tinyint(1) NOT NULL DEFAULT 0,
  `siralama` int(11) NOT NULL DEFAULT 0,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`hizmet_id`),
  UNIQUE KEY `uq_hizmetler_hizmet_adi` (`hizmet_adi`),
  KEY `idx_hizmetler_durum` (`durum`),
  KEY `idx_hizmetler_populer` (`populer_mi`),
  KEY `idx_hizmetler_kategori` (`kategori`),
  CONSTRAINT `chk_hizmetler_sure` CHECK (`sure_dakika` > 0),
  CONSTRAINT `chk_hizmetler_fiyat` CHECK (`fiyat` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `kullanicilar`
--

DROP TABLE IF EXISTS `kullanicilar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kullanicilar` (
  `kullanici_id` int(11) NOT NULL AUTO_INCREMENT,
  `ad_soyad` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `sifre_hash` varchar(255) NOT NULL,
  `rol` enum('admin','personel') NOT NULL DEFAULT 'admin',
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `son_giris_tarihi` datetime DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`kullanici_id`),
  UNIQUE KEY `uq_kullanicilar_email` (`email`),
  KEY `idx_kullanicilar_rol` (`rol`),
  KEY `idx_kullanicilar_durum` (`durum`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `musteri_hesaplari`
--

DROP TABLE IF EXISTS `musteri_hesaplari`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `musteri_hesaplari` (
  `hesap_id` int(11) NOT NULL AUTO_INCREMENT,
  `ad_soyad` varchar(100) NOT NULL,
  `telefon` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `sifre_hash` varchar(255) NOT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `kayit_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `son_giris_tarihi` datetime DEFAULT NULL,
  PRIMARY KEY (`hesap_id`),
  UNIQUE KEY `telefon` (`telefon`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `musteriler`
--

DROP TABLE IF EXISTS `musteriler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `musteriler` (
  `musteri_id` int(11) NOT NULL AUTO_INCREMENT,
  `hesap_id` int(11) DEFAULT NULL,
  `ad_soyad` varchar(100) NOT NULL,
  `telefon` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `kayit_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`musteri_id`),
  KEY `idx_musteriler_telefon` (`telefon`),
  KEY `idx_musteriler_email` (`email`),
  KEY `fk_musteriler_hesap` (`hesap_id`),
  CONSTRAINT `fk_musteriler_hesap` FOREIGN KEY (`hesap_id`) REFERENCES `musteri_hesaplari` (`hesap_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `odemeler`
--

DROP TABLE IF EXISTS `odemeler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `odemeler` (
  `odeme_id` int(11) NOT NULL AUTO_INCREMENT,
  `randevu_id` int(11) NOT NULL,
  `tutar` decimal(10,2) NOT NULL DEFAULT 0.00,
  `odeme_tipi` enum('nakit','kart','havale','diger') DEFAULT NULL,
  `odeme_durumu` enum('bekliyor','odendi','iptal','iade') NOT NULL DEFAULT 'bekliyor',
  `odeme_tarihi` datetime DEFAULT NULL,
  `aciklama` text DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`odeme_id`),
  UNIQUE KEY `uq_odemeler_randevu` (`randevu_id`),
  KEY `idx_odemeler_durum` (`odeme_durumu`),
  KEY `idx_odemeler_tarih` (`odeme_tarihi`),
  CONSTRAINT `fk_odemeler_randevu` FOREIGN KEY (`randevu_id`) REFERENCES `randevular` (`randevu_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_odemeler_tutar` CHECK (`tutar` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personel_hizmetleri`
--

DROP TABLE IF EXISTS `personel_hizmetleri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personel_hizmetleri` (
  `personel_hizmet_id` int(11) NOT NULL AUTO_INCREMENT,
  `personel_id` int(11) NOT NULL,
  `hizmet_id` int(11) NOT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`personel_hizmet_id`),
  UNIQUE KEY `uq_personel_hizmetleri` (`personel_id`,`hizmet_id`),
  KEY `idx_personel_hizmetleri_personel` (`personel_id`),
  KEY `idx_personel_hizmetleri_hizmet` (`hizmet_id`),
  KEY `idx_personel_hizmetleri_durum` (`durum`),
  CONSTRAINT `fk_personel_hizmetleri_hizmet` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`hizmet_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_personel_hizmetleri_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personeller`
--

DROP TABLE IF EXISTS `personeller`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `personeller` (
  `personel_id` int(11) NOT NULL AUTO_INCREMENT,
  `ad_soyad` varchar(100) NOT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `unvan` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `durum` tinyint(1) NOT NULL DEFAULT 1,
  `kayit_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`personel_id`),
  KEY `idx_personeller_durum` (`durum`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `randevu_hizmetleri`
--

DROP TABLE IF EXISTS `randevu_hizmetleri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `randevu_hizmetleri` (
  `randevu_hizmet_id` int(11) NOT NULL AUTO_INCREMENT,
  `randevu_id` int(11) NOT NULL,
  `hizmet_id` int(11) NOT NULL,
  `hizmet_adi` varchar(100) NOT NULL,
  `sure_dakika` int(11) NOT NULL,
  `fiyat` decimal(10,2) NOT NULL,
  `siralama` int(11) NOT NULL DEFAULT 0,
  `olusturma_tarihi` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`randevu_hizmet_id`),
  UNIQUE KEY `uq_randevu_hizmetleri` (`randevu_id`,`hizmet_id`),
  KEY `idx_randevu_hizmetleri_randevu` (`randevu_id`),
  KEY `idx_randevu_hizmetleri_hizmet` (`hizmet_id`),
  CONSTRAINT `fk_randevu_hizmetleri_hizmet` FOREIGN KEY (`hizmet_id`) REFERENCES `hizmetler` (`hizmet_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_randevu_hizmetleri_randevu` FOREIGN KEY (`randevu_id`) REFERENCES `randevular` (`randevu_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_randevu_hizmetleri_sure` CHECK (`sure_dakika` > 0),
  CONSTRAINT `chk_randevu_hizmetleri_fiyat` CHECK (`fiyat` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `randevular`
--

DROP TABLE IF EXISTS `randevular`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `randevular` (
  `randevu_id` int(11) NOT NULL AUTO_INCREMENT,
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
  `guncelleme_tarihi` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`randevu_id`),
  UNIQUE KEY `uq_randevular_randevu_kodu` (`randevu_kodu`),
  KEY `idx_randevular_musteri` (`musteri_id`),
  KEY `idx_randevular_personel_tarih` (`personel_id`,`randevu_tarihi`),
  KEY `idx_randevular_durum` (`durum`),
  KEY `idx_randevular_tarih_saat` (`randevu_tarihi`,`baslangic_saati`,`bitis_saati`),
  CONSTRAINT `fk_randevular_musteri` FOREIGN KEY (`musteri_id`) REFERENCES `musteriler` (`musteri_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_randevular_personel` FOREIGN KEY (`personel_id`) REFERENCES `personeller` (`personel_id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_randevular_saat` CHECK (`bitis_saati` > `baslangic_saati`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:22:03
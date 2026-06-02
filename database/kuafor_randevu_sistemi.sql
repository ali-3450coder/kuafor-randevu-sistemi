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

-- Dump completed on 2026-06-03  2:16:59
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `kullanicilar`
--
-- WHERE:  rol='admin'

LOCK TABLES `kullanicilar` WRITE;
/*!40000 ALTER TABLE `kullanicilar` DISABLE KEYS */;
INSERT INTO `kullanicilar` (`kullanici_id`, `ad_soyad`, `email`, `sifre_hash`, `rol`, `durum`, `son_giris_tarihi`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (2,'Sistem Yoneticisi','admin@kuafor.local','$2y$10$I/KgxUymYbvUqOuLkOTS/.b2I4BtPI.PQbPP5i6u1K9urTNsM2aDi','admin',1,'2026-06-03 02:13:59','2026-05-05 22:13:18','2026-06-03 02:13:59');
/*!40000 ALTER TABLE `kullanicilar` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:16:59
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `personeller`
--

LOCK TABLES `personeller` WRITE;
/*!40000 ALTER TABLE `personeller` DISABLE KEYS */;
INSERT INTO `personeller` (`personel_id`, `ad_soyad`, `telefon`, `unvan`, `bio`, `durum`, `kayit_tarihi`, `guncelleme_tarihi`) VALUES (1,'Kaya ülgen','05321234501','Uzman Kuafor','Kadin ve erkek sac kesiminde 10 yil deneyimli.',1,'2026-06-01 00:54:05','2026-06-03 02:09:20'),(2,'Ayse Demir','05321234502','Saç Stil Uzmanı','Renklendirme ve bakim konusunda uzman.',1,'2026-06-01 00:55:34','2026-06-01 01:12:42'),(3,'Kemal Arslan','05321234503','Kalfa',NULL,1,'2026-06-01 00:56:07','2026-06-01 00:56:07'),(4,'Behçet orbay','05321234504','Uzman','Saç Şekillendirme ve fön konusunda deneyimli.',1,'2026-06-01 00:57:12','2026-06-03 02:10:31'),(5,'Turan kara','05321234505','Uzman',NULL,1,'2026-06-01 00:57:46','2026-06-03 02:08:34'),(6,'Asena Tümer','05321234501','Saç Stil Uzmanı',NULL,1,'2026-06-01 01:13:02','2026-06-03 02:10:07'),(7,'Alp Sungur','05321234503','Saç Bakım Uzmanı',NULL,1,'2026-06-01 01:14:32','2026-06-01 01:14:32'),(8,'Umay Belgin','05321234502','Saç Uzatma ve Protez Uzmanı',NULL,1,'2026-06-01 01:15:09','2026-06-01 01:15:09'),(9,'Gökçe Bengü','05321234505','Düğün & Özel Gün Saç Uzmanı',NULL,1,'2026-06-01 01:15:39','2026-06-01 03:45:41'),(10,'Ece Konçuy','05321234505','Saç Düzeltme ve Şekillendirme Uzmanı',NULL,1,'2026-06-01 01:16:16','2026-06-01 01:16:16'),(12,'Behçet orbay','05321234505','profesör',NULL,1,'2026-06-01 03:46:06','2026-06-03 02:07:58');
/*!40000 ALTER TABLE `personeller` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `hizmetler`
--

LOCK TABLES `hizmetler` WRITE;
/*!40000 ALTER TABLE `hizmetler` DISABLE KEYS */;
INSERT INTO `hizmetler` (`hizmet_id`, `hizmet_adi`, `aciklama`, `sure_dakika`, `fiyat`, `kategori`, `populer_mi`, `siralama`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (1,'Kadın Saç Kesimi','Profesyonel kesim ve şekillendirme',45,600.00,'Saç Kesim',0,1,1,'2026-06-01 01:18:27','2026-06-01 01:18:27'),(2,'Erkek Saç Kesimi (Fade & Klasik)','Modern ve klasik erkek saç kesimleri',30,400.00,'Saç Kesim',0,2,1,'2026-06-01 01:19:01','2026-06-01 01:19:01'),(3,'Çocuk Saç Kesimi','Çocuklar için özel kesim',30,300.00,'Saç Kesim',0,3,1,'2026-06-01 01:19:31','2026-06-01 01:19:31'),(4,'Saç Düzeltme ve Şekillendirme','Ece Konçuy uzmanlığında',60,400.00,'Saç Şekillendirme',0,4,1,'2026-06-01 01:20:13','2026-06-01 01:20:13'),(5,'Düğün & Gelin Saçı','Profesyonel gelin saçı tasarımı',90,900.00,'Özel Gün',0,5,1,'2026-06-01 01:20:54','2026-06-01 01:20:54'),(6,'Özel Gün / Abiye Saçı','Gökçe Bengü uzmanlığında',70,700.00,'Özel Gün',0,7,1,'2026-06-01 01:21:41','2026-06-01 01:22:51'),(7,'Saç Uzatma (Keratin Bonding)','Umay Belgin uzmanlığında',180,1800.00,'Saç Uzatma',0,6,1,'2026-06-01 01:22:12','2026-06-01 01:22:48'),(8,'Saç Uzatma (Mikro Halka)','Umay Belgin uzmanlığında',150,1600.00,'Saç Uzatma',0,8,1,'2026-06-01 01:23:31','2026-06-01 01:23:31'),(9,'Saç Protezi Uygulaması','Kalıcı protez uygulaması',120,950.00,'Saç Uzatma',0,9,1,'2026-06-01 01:24:01','2026-06-01 01:24:01'),(10,'Keratin Bakımı','Alp Sungur uzmanlığında',90,800.00,'Saç Bakım',0,10,1,'2026-06-01 01:24:38','2026-06-01 01:24:38'),(11,'Saç Botoksu','Derinlemesine onarım',80,700.00,'Saç Bakım',0,11,1,'2026-06-01 01:25:06','2026-06-01 01:25:06'),(12,'Kollajen Bakımı','Nem ve parlaklık terapisi',70,600.00,'Saç Bakım',0,12,1,'2026-06-01 01:25:30','2026-06-01 01:25:30'),(13,'Erkek Saç & Sakal Bakımı',NULL,60,600.00,'Saç Kesim',0,13,1,'2026-06-01 01:26:30','2026-06-01 01:26:46'),(14,'Perma (Kalıcı Kıvırma)','Kalıcı hacim ve kıvırma',120,950.00,'Saç Şekillendirme',0,14,1,'2026-06-01 01:27:41','2026-06-01 01:27:41'),(15,'Saç boyama','doğal boyalar ile kalıcı renk',180,2000.00,'Saç Bakım',0,15,1,'2026-06-01 01:28:40','2026-06-01 01:28:40');
/*!40000 ALTER TABLE `hizmetler` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `personel_hizmetleri`
--

LOCK TABLES `personel_hizmetleri` WRITE;
/*!40000 ALTER TABLE `personel_hizmetleri` DISABLE KEYS */;
INSERT INTO `personel_hizmetleri` (`personel_hizmet_id`, `personel_id`, `hizmet_id`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (1,10,2,1,'2026-06-01 01:42:40','2026-06-01 01:42:40'),(2,10,4,1,'2026-06-01 01:42:40','2026-06-01 01:42:40'),(3,10,7,1,'2026-06-01 01:42:40','2026-06-01 01:42:40'),(4,10,9,1,'2026-06-01 01:42:40','2026-06-01 01:42:40'),(5,9,1,1,'2026-06-01 01:43:07','2026-06-01 01:43:07'),(6,9,3,1,'2026-06-01 01:43:07','2026-06-01 01:43:07'),(7,9,5,1,'2026-06-01 01:43:07','2026-06-01 01:43:07'),(8,9,6,1,'2026-06-01 01:43:07','2026-06-01 01:43:07'),(9,8,4,1,'2026-06-01 01:43:30','2026-06-01 01:43:30'),(10,8,5,1,'2026-06-01 01:43:30','2026-06-01 01:43:30'),(11,8,7,1,'2026-06-01 01:43:30','2026-06-01 01:43:30'),(12,8,8,1,'2026-06-01 01:43:30','2026-06-01 01:43:30'),(13,8,9,1,'2026-06-01 01:43:30','2026-06-01 01:43:30'),(14,7,8,1,'2026-06-01 01:43:53','2026-06-01 01:43:53'),(15,7,9,1,'2026-06-01 01:43:53','2026-06-01 01:43:53'),(16,7,10,1,'2026-06-01 01:43:53','2026-06-01 01:43:53'),(17,7,11,1,'2026-06-01 01:43:53','2026-06-01 01:43:53'),(18,7,12,1,'2026-06-01 01:43:53','2026-06-01 01:43:53'),(19,6,1,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(20,6,2,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(21,6,3,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(22,6,4,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(23,6,7,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(24,6,13,1,'2026-06-01 01:44:18','2026-06-01 01:44:18'),(25,5,1,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(26,5,2,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(27,5,3,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(28,5,4,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(29,5,5,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(30,5,7,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(31,5,6,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(32,5,8,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(33,5,9,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(34,5,10,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(35,5,11,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(36,5,12,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(37,5,13,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(38,5,14,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(39,5,15,1,'2026-06-01 01:44:41','2026-06-01 01:44:41'),(40,3,3,1,'2026-06-01 01:44:59','2026-06-01 01:44:59'),(41,2,1,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(42,2,2,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(43,2,4,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(44,2,5,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(45,2,9,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(46,2,11,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(47,2,13,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(48,2,14,1,'2026-06-01 01:45:24','2026-06-01 01:45:24'),(49,1,1,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(50,1,2,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(51,1,3,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(52,1,4,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(53,1,5,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(54,1,7,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(55,1,6,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(56,1,8,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(57,1,9,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(58,1,10,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(59,1,11,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(60,1,12,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(61,1,13,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(62,1,14,1,'2026-06-01 01:45:37','2026-06-01 01:45:37'),(63,1,15,1,'2026-06-01 01:45:37','2026-06-01 01:45:37');
/*!40000 ALTER TABLE `personel_hizmetleri` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `calisma_saatleri`
--

LOCK TABLES `calisma_saatleri` WRITE;
/*!40000 ALTER TABLE `calisma_saatleri` DISABLE KEYS */;
INSERT INTO `calisma_saatleri` (`calisma_id`, `personel_id`, `gun`, `baslangic_saati`, `bitis_saati`, `durum`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (8,10,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(9,10,'sali','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(10,10,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(11,10,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(12,10,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(13,10,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(14,10,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:51:48','2026-06-01 01:51:48'),(15,9,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(16,9,'sali','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(17,9,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(18,9,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(19,9,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(20,9,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(21,9,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:51:55','2026-06-01 01:51:55'),(22,8,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(23,8,'sali','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(24,8,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(25,8,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(26,8,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(27,8,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(28,8,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:52:03','2026-06-01 01:52:03'),(29,7,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(30,7,'sali','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(31,7,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(32,7,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(33,7,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(34,7,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(35,7,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:52:10','2026-06-01 01:52:10'),(36,6,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(37,6,'sali','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(38,6,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(39,6,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(40,6,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(41,6,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(42,6,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:52:19','2026-06-01 01:52:19'),(43,5,'pazartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(44,5,'sali','09:00:00','18:00:00',0,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(45,5,'carsamba','09:00:00','18:00:00',0,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(46,5,'persembe','09:00:00','18:00:00',0,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(47,5,'cuma','09:00:00','18:00:00',0,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(48,5,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(49,5,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:52:31','2026-06-01 01:52:31'),(50,4,'pazartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(51,4,'sali','09:00:00','18:00:00',1,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(52,4,'carsamba','09:00:00','18:00:00',1,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(53,4,'persembe','09:00:00','18:00:00',1,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(54,4,'cuma','09:00:00','18:00:00',0,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(55,4,'cumartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(56,4,'pazar','09:00:00','18:00:00',0,'2026-06-01 01:52:39','2026-06-01 01:52:39'),(57,3,'pazartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(58,3,'sali','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(59,3,'carsamba','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(60,3,'persembe','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(61,3,'cuma','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(62,3,'cumartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(63,3,'pazar','09:00:00','18:00:00',1,'2026-06-01 01:52:45','2026-06-01 01:52:45'),(64,2,'pazartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(65,2,'sali','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(66,2,'carsamba','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(67,2,'persembe','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(68,2,'cuma','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(69,2,'cumartesi','09:00:00','18:00:00',1,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(70,2,'pazar','09:00:00','18:00:00',0,'2026-06-01 01:52:50','2026-06-01 01:52:50'),(71,1,'pazartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(72,1,'sali','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(73,1,'carsamba','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(74,1,'persembe','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(75,1,'cuma','09:00:00','18:00:00',1,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(76,1,'cumartesi','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57'),(77,1,'pazar','09:00:00','18:00:00',0,'2026-06-01 01:52:57','2026-06-01 01:52:57');
/*!40000 ALTER TABLE `calisma_saatleri` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `musteri_hesaplari`
--

LOCK TABLES `musteri_hesaplari` WRITE;
/*!40000 ALTER TABLE `musteri_hesaplari` DISABLE KEYS */;
INSERT INTO `musteri_hesaplari` (`hesap_id`, `ad_soyad`, `telefon`, `email`, `sifre_hash`, `durum`, `kayit_tarihi`, `son_giris_tarihi`) VALUES (1,'dede korkut','05365363636',NULL,'$2y$10$q92Hc.YGJ/4i/6EPQUwWoefr9bFGqPOBMToFS4MDheFDSbOLmt5J2',1,'2026-06-01 01:50:24','2026-06-01 17:06:46'),(2,'zencefil efendi','05365363635',NULL,'$2y$10$ooeylNlTbozdxqJO6SViyOp6OMghgYl0QCt90Q6y8ivE5dzuzkGdC',1,'2026-06-01 01:56:05',NULL),(3,'kemal boratav','05365363634',NULL,'$2y$10$J9aOXsjFMXSpa27bcFqR6Ocinv6qyerAwh146ITgheHkt/h4gcQgO',1,'2026-06-01 01:58:00',NULL),(4,'aslı begüm','05365363633','asli@gmail.com','$2y$10$.MKEhH4TCQ5/ywZyncGenumkVooazN7ZDeBBhDMxxBCEiPte6se5u',1,'2026-06-01 01:59:06','2026-06-01 02:11:54'),(5,'Turgut Boyar','05365363632',NULL,'$2y$10$Y.b0tI/qC7ocJ7zvKSuUWezM6uc6SM5s5vSJffBNgf2UUwZX5a6B2',1,'2026-06-01 02:01:00','2026-06-01 02:10:46'),(6,'Alp er tunga','05365363631',NULL,'$2y$10$DUmhnujBzc132fhqjgkfyuUl3K7ONvN4jpMfZnQ0CzsBOvsh8E2W.',1,'2026-06-01 02:02:36',NULL),(7,'Bolu Beyi','05365363630',NULL,'$2y$10$IYH13aOoJH6pwix/rHVEL.RXJqOE4B1Ek7zkiE87Pn75/KD8.3RtO',1,'2026-06-01 02:06:40',NULL),(8,'⠀⠀','05365363639',NULL,'$2y$10$mN2M8OdwFKn5vkPdISMDFuEThQjDFJH0rk/fNjMciSTfRtuEfuKMq',1,'2026-06-01 03:41:11',NULL);
/*!40000 ALTER TABLE `musteri_hesaplari` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `musteriler`
--

LOCK TABLES `musteriler` WRITE;
/*!40000 ALTER TABLE `musteriler` DISABLE KEYS */;
INSERT INTO `musteriler` (`musteri_id`, `hesap_id`, `ad_soyad`, `telefon`, `email`, `kayit_tarihi`, `guncelleme_tarihi`) VALUES (1,1,'dede korkut','05365363636',NULL,'2026-06-01 01:53:44','2026-06-01 01:53:44'),(2,1,'dede korkut','05365363636',NULL,'2026-06-01 01:54:12','2026-06-01 01:54:12'),(3,2,'zencefil efendi','05365363635',NULL,'2026-06-01 01:56:32','2026-06-01 01:56:32'),(4,2,'zencefil efendi','05365363635',NULL,'2026-06-01 01:56:57','2026-06-01 01:56:57'),(5,3,'kemal boratav','05365363634',NULL,'2026-06-01 01:58:36','2026-06-01 01:58:36'),(6,4,'aslı begüm','05365363633',NULL,'2026-06-01 01:59:32','2026-06-01 01:59:32'),(7,5,'Turgut Boyar','05365363632',NULL,'2026-06-01 02:01:47','2026-06-01 02:01:47'),(8,6,'Alp er tunga','05365363631',NULL,'2026-06-01 02:02:55','2026-06-01 02:02:55'),(9,7,'Bolu Beyi','05365363630',NULL,'2026-06-01 02:07:17','2026-06-01 02:07:17'),(10,7,'Bolu Beyi','05365363630',NULL,'2026-06-01 02:07:37','2026-06-01 02:07:37'),(11,5,'Turgut Boyar','05365363632',NULL,'2026-06-01 02:11:14','2026-06-01 02:11:14'),(12,4,'aslı begüm','05365363633',NULL,'2026-06-01 02:12:23','2026-06-01 02:12:23');
/*!40000 ALTER TABLE `musteriler` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `randevular`
--

LOCK TABLES `randevular` WRITE;
/*!40000 ALTER TABLE `randevular` DISABLE KEYS */;
INSERT INTO `randevular` (`randevu_id`, `randevu_kodu`, `musteri_id`, `personel_id`, `randevu_tarihi`, `baslangic_saati`, `bitis_saati`, `durum`, `notlar`, `iptal_nedeni`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (1,'RND-NOE37X',1,5,'2026-06-06','12:00:00','13:40:00','beklemede',NULL,NULL,'2026-06-01 01:53:44','2026-06-01 01:53:44'),(2,'RND-BZOWM5',2,9,'2026-06-01','09:00:00','09:30:00','onaylandi',NULL,NULL,'2026-06-01 01:54:12','2026-06-01 02:05:27'),(3,'RND-WDT7HE',3,8,'2026-06-02','14:15:00','15:45:00','onaylandi',NULL,NULL,'2026-06-01 01:56:32','2026-06-01 02:05:35'),(4,'RND-V9HTPB',4,5,'2026-06-14','15:00:00','18:00:00','beklemede',NULL,NULL,'2026-06-01 01:56:57','2026-06-01 01:56:57'),(5,'RND-HJ42QC',5,2,'2026-06-06','12:00:00','15:30:00','beklemede',NULL,NULL,'2026-06-01 01:58:36','2026-06-01 01:58:36'),(6,'RND-FDK18C',6,7,'2026-06-01','14:30:00','17:50:00','iptal',NULL,'gecikti','2026-06-01 01:59:32','2026-06-01 04:09:06'),(7,'RND-3MB77Q',7,2,'2026-06-06','15:30:00','17:30:00','beklemede',NULL,NULL,'2026-06-01 02:01:47','2026-06-01 02:01:47'),(8,'RND-X4PWKP',8,7,'2026-06-01','11:00:00','13:40:00','tamamlandi',NULL,NULL,'2026-06-01 02:02:55','2026-06-01 03:26:27'),(9,'RND-MMEV3D',9,1,'2026-06-05','12:00:00','16:00:00','beklemede',NULL,NULL,'2026-06-01 02:07:17','2026-06-01 02:07:17'),(10,'RND-M3KX5F',10,9,'2026-06-05','12:00:00','12:30:00','beklemede',NULL,NULL,'2026-06-01 02:07:37','2026-06-01 02:07:37'),(11,'RND-OV7615',11,10,'2026-06-01','09:00:00','10:00:00','tamamlandi',NULL,NULL,'2026-06-01 02:11:14','2026-06-01 03:20:50'),(12,'RND-VCGNH7',12,9,'2026-06-01','12:30:00','15:10:00','tamamlandi',NULL,NULL,'2026-06-01 02:12:23','2026-06-01 04:09:13');
/*!40000 ALTER TABLE `randevular` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `randevu_hizmetleri`
--

LOCK TABLES `randevu_hizmetleri` WRITE;
/*!40000 ALTER TABLE `randevu_hizmetleri` DISABLE KEYS */;
INSERT INTO `randevu_hizmetleri` (`randevu_hizmet_id`, `randevu_id`, `hizmet_id`, `hizmet_adi`, `sure_dakika`, `fiyat`, `siralama`, `olusturma_tarihi`) VALUES (1,1,2,'Erkek Saç Kesimi (Fade & Klasik)',30,400.00,0,'2026-06-01 01:53:44'),(2,1,12,'Kollajen Bakımı',70,600.00,0,'2026-06-01 01:53:44'),(3,2,3,'Çocuk Saç Kesimi',30,300.00,0,'2026-06-01 01:54:12'),(4,3,5,'Düğün & Gelin Saçı',90,900.00,0,'2026-06-01 01:56:32'),(5,4,15,'Saç boyama',180,2000.00,0,'2026-06-01 01:56:57'),(6,5,5,'Düğün & Gelin Saçı',90,900.00,0,'2026-06-01 01:58:36'),(7,5,14,'Perma (Kalıcı Kıvırma)',120,950.00,0,'2026-06-01 01:58:36'),(8,6,9,'Saç Protezi Uygulaması',120,950.00,0,'2026-06-01 01:59:32'),(9,6,11,'Saç Botoksu',80,700.00,0,'2026-06-01 01:59:32'),(10,7,4,'Saç Düzeltme ve Şekillendirme',60,400.00,0,'2026-06-01 02:01:47'),(11,7,13,'Erkek Saç & Sakal Bakımı',60,600.00,0,'2026-06-01 02:01:47'),(12,8,10,'Keratin Bakımı',90,800.00,0,'2026-06-01 02:02:55'),(13,8,12,'Kollajen Bakımı',70,600.00,0,'2026-06-01 02:02:55'),(14,9,8,'Saç Uzatma (Mikro Halka)',150,1600.00,0,'2026-06-01 02:07:17'),(15,9,10,'Keratin Bakımı',90,800.00,0,'2026-06-01 02:07:17'),(16,10,3,'Çocuk Saç Kesimi',30,300.00,0,'2026-06-01 02:07:37'),(17,11,4,'Saç Düzeltme ve Şekillendirme',60,400.00,0,'2026-06-01 02:11:14'),(18,12,5,'Düğün & Gelin Saçı',90,900.00,0,'2026-06-01 02:12:23'),(19,12,6,'Özel Gün / Abiye Saçı',70,700.00,0,'2026-06-01 02:12:23');
/*!40000 ALTER TABLE `randevu_hizmetleri` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
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
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `odemeler`
--

LOCK TABLES `odemeler` WRITE;
/*!40000 ALTER TABLE `odemeler` DISABLE KEYS */;
INSERT INTO `odemeler` (`odeme_id`, `randevu_id`, `tutar`, `odeme_tipi`, `odeme_durumu`, `odeme_tarihi`, `aciklama`, `olusturma_tarihi`, `guncelleme_tarihi`) VALUES (1,1,1000.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 01:53:44','2026-06-01 01:53:44'),(2,2,300.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 01:54:12','2026-06-01 01:54:12'),(3,3,900.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 01:56:32','2026-06-01 01:56:32'),(4,4,2000.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 01:56:57','2026-06-01 01:56:57'),(5,5,1850.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 01:58:36','2026-06-01 01:58:36'),(6,6,1650.00,'nakit','bekliyor',NULL,NULL,'2026-06-01 01:59:32','2026-06-01 04:07:54'),(7,7,1000.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 02:01:47','2026-06-01 02:01:47'),(8,8,1400.00,'diger','odendi','2026-06-01 03:27:12',NULL,'2026-06-01 02:02:55','2026-06-01 03:27:12'),(9,9,2400.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 02:07:17','2026-06-01 02:07:17'),(10,10,300.00,NULL,'bekliyor',NULL,NULL,'2026-06-01 02:07:37','2026-06-01 02:07:37'),(11,11,400.00,'kart','odendi','2026-06-01 03:25:57',NULL,'2026-06-01 02:11:14','2026-06-01 03:25:57'),(12,12,1600.00,'nakit','odendi','2026-06-01 04:09:32',NULL,'2026-06-01 02:12:23','2026-06-01 04:09:32');
/*!40000 ALTER TABLE `odemeler` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-03  2:17:00
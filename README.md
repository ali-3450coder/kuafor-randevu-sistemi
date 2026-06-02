# Kuaför Randevu Sistemi

Müşterilerin çevrimiçi randevu almasını ve kuaför yöneticilerinin tüm operasyonlarını tek panelden yönetmesini sağlayan tam kapsamlı web uygulaması.

## Teknoloji Yığını

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Apache](https://img.shields.io/badge/Apache-D22128?style=for-the-badge&logo=apache&logoColor=white)

## Kurulum

### 1. Gereksinimler
- XAMPP (PHP 8.2+, Apache, MySQL/MariaDB)

### 2. Veritabanı
phpMyAdmin üzerinden yeni bir veritabanı oluşturun:
```sql
CREATE DATABASE kuafor_randevu_sistemi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Ardından `database/kuafor_randevu_sistemi.sql` dosyasını import edin.

### 3. Veritabanı Bağlantısı
```bash
cp backend/config/database.example.php backend/config/database.php
```
`database.php` dosyasını açıp kendi bağlantı bilgilerinizi girin (`host`, `port`, `user`, `pass`).

### 4. Çalıştırma
Projeyi XAMPP'ın `htdocs` klasörüne koyun ve tarayıcıda açın:
```
http://localhost/kuafor-randevu-sistemi/
```

## Giriş Bilgileri (Demo)

SQL dump ile gelen demo hesaplar:

| Rol | URL | E-posta |
|-----|-----|---------|
| Admin | `/frontend/admin/giris.html` | `admin@kuafor.local` |
| Müşteri | `/frontend/musteri-giris.html` | Kayıt gerekli |

> Demo şifresi SQL dump içindedir. Kurulumdan sonra değiştirmeniz önerilir.

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|---------|
| **Admin** | Tam kontrol: tüm CRUD, raporlar, kullanıcı yönetimi |
| **Personel** | Randevular, müşteriler, ödemeler (yazma kısıtlı) |
| **Müşteri** | Randevu al, görüntüle, iptal et, profil yönet |

## Özellikler

- 4 adımlı randevu wizard (hizmet → personel → tarih/saat → bilgiler)
- Anlık slot hesaplama (15 dk aralık, çakışma kontrolü)
- Randevu durum yönetimi (beklemede → onaylandi → tamamlandi)
- Walk-in randevu (admin panelinden hesapsız müşteri)
- Ödeme takibi ve iade sistemi
- Müşteri web hesabı (kayıt / giriş / profil / şifre)
- Admin raporlama (hizmet, personel, aylık trend)
- Rol tabanlı erişim kontrolü (admin / personel / müşteri)

## Proje Yapısı

```
kuafor-randevu-sistemi/
├── backend/
│   ├── api/genel/          # Herkese açık endpoint'ler
│   ├── api/musteri/        # Müşteri hesabı endpoint'leri
│   ├── api/yonetim/        # Admin panel endpoint'leri
│   ├── config/             # Uygulama ve veritabanı ayarları
│   ├── core/               # Auth, Validator, RandevuServisi, ...
│   └── middleware/         # Yetki kontrol katmanları
├── frontend/
│   ├── index.html          # Ana sayfa
│   ├── randevu-al.html     # Randevu wizard
│   ├── admin/              # Admin panel sayfaları
│   └── assets/             # CSS + JS modülleri
└── database/
    └── kuafor_randevu_sistemi.sql
```

## Veritabanı Tabloları

`kullanicilar` · `musteri_hesaplari` · `personeller` · `hizmetler` · `personel_hizmetleri` · `calisma_saatleri` · `musteriler` · `randevular` · `randevu_hizmetleri` · `odemeler`

## Güvenlik

- PDO prepared statements (SQL injection koruması)
- Session tabanlı auth (HttpOnly + SameSite)
- 3 ayrı auth katmanı (genel / müşteri / admin)
- Input validation her endpoint'te
- XSS koruması (`_esc()` ile output encoding)

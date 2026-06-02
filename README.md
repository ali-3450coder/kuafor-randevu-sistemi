<div align="center">

# ✂️ Kuaför Randevu Sistemi

Müşterilerin çevrimiçi randevu almasını ve kuaför yöneticilerinin  
tüm operasyonlarını tek panelden yönetmesini sağlayan tam kapsamlı web uygulaması.

![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![Apache](https://img.shields.io/badge/Apache-D22128?style=for-the-badge&logo=apache&logoColor=white)

</div>

---

## İçindekiler

- [Özellikler](#özellikler)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Kurulum](#kurulum)
- [Kullanıcı Rolleri](#kullanıcı-rolleri)
- [Randevu Akışı](#randevu-akışı)
- [Proje Yapısı](#proje-yapısı)
- [Veritabanı](#veritabanı)
- [Güvenlik](#güvenlik)

---

## Özellikler

| | Özellik | Açıklama |
|---|---------|---------|
| 🗓️ | **4 Adımlı Randevu Wizard** | Hizmet → Personel → Tarih/Saat → Bilgiler |
| ⚡ | **Anlık Slot Hesaplama** | 15 dk aralıklı, çakışma kontrolü |
| 🔄 | **Durum Yönetimi** | Randevu state machine ile geçiş kuralları |
| 🚶 | **Walk-in Randevu** | Admin panelinden hesapsız müşteri girişi |
| 💳 | **Ödeme & İade** | Nakit / kart / havale, iade sistemi |
| 👤 | **Müşteri Hesabı** | Kayıt, giriş, profil ve şifre yönetimi |
| 📊 | **Admin Raporlama** | Hizmet, personel ve aylık trend raporları |
| 🔐 | **Rol Tabanlı Erişim** | Admin / Personel / Müşteri katmanları |

---

## Ekran Görüntüleri

<div align="center">

| Ana Sayfa | Randevu Wizard | Admin Panel |
|-----------|---------------|-------------|
| *(eklenecek)* | *(eklenecek)* | *(eklenecek)* |

</div>

---

## Kurulum

### Gereksinimler
- XAMPP (PHP 8.2+, Apache, MySQL/MariaDB)

### Adımlar

**1. Veritabanını oluşturun**
```sql
CREATE DATABASE kuafor_randevu_sistemi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Ardından ihtiyacınıza göre aşağıdaki SQL dosyalarından birini import edin:

| Dosya | İçerik | Ne zaman kullanılır? |
|-------|--------|----------------------|
| `kuafor_randevu_sistemi.sql` | Şema + demo veriler | Sistemi hazır veriyle görmek için |
| `kuafor_randevu_sistemi_sema.sql` | Yalnızca şema | Temiz kurulum, kendi verilerinizi girecekseniz |

**2. Veritabanı bağlantısını yapılandırın**
```bash
cp backend/config/database.example.php backend/config/database.php
```
`database.php` dosyasında `host`, `port`, `user`, `pass` değerlerini güncelleyin.

**3. Projeyi başlatın**

Klasörü XAMPP `htdocs` dizinine koyun ve tarayıcıda açın:
```
http://localhost/kuafor-randevu-sistemi/
```

### Demo Girişi

> ⚠️ Yalnızca demo verili SQL (`kuafor_randevu_sistemi.sql`) import edildiğinde geçerlidir.

| Rol | URL | E-posta | Şifre |
|-----|-----|---------|-------|
| Admin | `/frontend/admin/giris.html` | `admin@kuafor.local` | `Admin3450` |
| Müşteri | `/frontend/musteri-giris.html` | Kayıt gerekli | — |

> Kurulumdan sonra admin şifresini değiştirmeniz önerilir.

---

## Kullanıcı Rolleri

| Rol | Yetki Kapsamı |
|-----|--------------|
| 👑 **Admin** | Tam kontrol: tüm CRUD, raporlar, kullanıcı yönetimi |
| 💼 **Personel** | Randevular, müşteriler, ödemeler (yazma kısıtlı) |
| 🙍 **Müşteri** | Randevu al, görüntüle, iptal et, profil yönet |

---

## Randevu Akışı

### Müşteri Randevu Süreci
```
① Hizmet Seç  ──►  ② Personel Seç  ──►  ③ Tarih & Saat  ──►  ④ Bilgiler  ──►  ✅ Onay
```

### Randevu Durum Matrisi
```
             ┌──────────────┐
             │  beklemede   │
             └──────┬───────┘
            onaylandı│  iptal
       ┌─────────────▼──────────────┐
       │         onaylandi          │
       └──┬──────────┬──────────────┘
 tamamlandı│     gelmedi│       iptal│
           ▼           ▼            ▼
      tamamlandi    gelmedi        iptal
       (final)      (final)       (final)
```

### Ödeme Akışı
```
bekliyor  ──►  odendi  ──►  iade
    │
    └──►  iptal
```

---

## Proje Yapısı

```
kuafor-randevu-sistemi/
├── backend/
│   ├── api/
│   │   ├── genel/          # Herkese açık endpoint'ler (5)
│   │   ├── musteri/        # Müşteri hesabı endpoint'leri (8)
│   │   └── yonetim/        # Admin panel endpoint'leri (38+)
│   ├── config/             # Uygulama ve veritabanı ayarları
│   ├── core/               # Auth, Validator, RandevuServisi
│   └── middleware/         # Yetki kontrol katmanları
├── frontend/
│   ├── index.html          # Ana sayfa
│   ├── randevu-al.html     # Randevu wizard
│   ├── admin/              # Admin panel sayfaları (10)
│   └── assets/             # CSS token sistemi + JS modülleri
└── database/
    └── kuafor_randevu_sistemi.sql
```

---

## Veritabanı

**10 tablo · MariaDB 10.4 · utf8mb4**

| Tablo | Açıklama |
|-------|---------|
| `kullanicilar` | Admin / personel panel hesapları |
| `musteri_hesaplari` | Müşteri web oturum hesapları |
| `personeller` | Hizmet veren kuaför personeli |
| `hizmetler` | Hizmet kataloğu (fiyat, süre, kategori) |
| `personel_hizmetleri` | Personel–hizmet atamaları |
| `calisma_saatleri` | Haftalık çalışma programı |
| `musteriler` | Randevu snapshot müşteri verisi |
| `randevular` | Ana randevu kayıtları |
| `randevu_hizmetleri` | Hizmet fiyat/süre snapshot'ları |
| `odemeler` | Randevuya bağlı ödeme kayıtları |

> Snapshot mantığı: Her randevu için müşteri ve hizmet verisi ayrı saklanır.  
> Fiyat/bilgi değişikliği geçmiş randevuları etkilemez.

---

## Güvenlik

| Tedbir | Uygulama |
|--------|---------|
| SQL Injection | PDO prepared statements |
| XSS | `_esc()` ile output encoding |
| Session Fixation | `session_regenerate_id(true)` |
| Auth Katmanları | 3 ayrı middleware (genel / müşteri / admin) |
| Input Validation | `Validator::check()` her endpoint'te |
| CORS | Whitelist tabanlı origin kontrolü |

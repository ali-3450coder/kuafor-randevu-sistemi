<?php
/**
 * Dosya   : config/database.php  (ornek)
 * Gorev   : Bu dosyayi kopyalayip "database.php" olarak kaydedin,
 *           kendi baglanti bilgilerinizi girin.
 *
 * Komut   : cp backend/config/database.example.php backend/config/database.php
 */

function getDb(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $host   = 'localhost';
    $port   = 3306;          // XAMPP icin genellikle 3306 veya 3307
    $dbName = 'kuafor_randevu_sistemi';
    $user   = 'root';        // Veritabani kullanicisi
    $pass   = '';            // Veritabani sifresi

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $user, $pass, $options);

    return $pdo;
}

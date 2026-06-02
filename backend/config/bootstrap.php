<?php
/**
 * Dosya   : config/bootstrap.php
 * Gorev   : Her API dosyasinin basinda cagrilir; ortam, oturum ve hata yonetimini hazirlar.
 * Bagimli : config/app.php, config/cors.php, config/database.php, core/*
 */

require_once __DIR__ . '/app.php';
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/../core/Yardimcilar.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';

// Gelistirme sirasinda tum hatalari yakala; uretimde display_errors kapali kalir
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

date_default_timezone_set(APP_TIMEZONE);

// Oturum guvenligi: cookie calmaya karsi HttpOnly + SameSite + Secure (HTTPS'de)
session_name('KRS_SID');
ini_set('session.cookie_httponly', '1');
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', '1');
// localhost gelistirme: 0; HTTPS production: 1 olmali
ini_set('session.cookie_secure', (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? '1' : '0');
session_start();

// JSON cevap icin varsayilan Content-Type
header('Content-Type: application/json; charset=utf-8');

/**
 * Yakalanmamis exception'lari logla ve istemciye genel 500 don.
 * Ham hata mesajini disariya sizdirma.
 */
set_exception_handler(function (Throwable $e) {
    Yardimcilar::hataLogla($e->getMessage(), [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sunucu hatasi olustu.',
    ]);
    exit;
});

/**
 * PHP native hatalarini (E_WARNING, E_NOTICE vb.) ozel log sistemine yonlendir.
 * E_ERROR/E_PARSE zaten PHP tarafindan fatal olarak islenir; bunlar exception handler'a duser.
 */
set_error_handler(function (int $no, string $mesaj, string $dosya, int $satir): bool {
    if (!(error_reporting() & $no)) {
        return false; // @ operatoru ile susturulmus hatalar yoksayilir
    }
    Yardimcilar::hataLogla($mesaj, ['error_no' => $no, 'file' => $dosya, 'line' => $satir]);
    return true;
}, E_ALL);

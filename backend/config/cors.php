<?php
/**
 * Dosya   : config/cors.php
 * Gorev   : CORS basliklarini ayarlar ve OPTIONS preflight isteklerini karsilar.
 *           Same-origin istekler (Apache'den yuklenen frontend) CORS gerektirmez;
 *           Vite dev server (localhost:5173) icin izin verilir.
 * Bagimli : -
 */

$izinliOriginler = [
    'http://localhost',
    'http://localhost:80',
    'http://127.0.0.1',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $izinliOriginler, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// OPTIONS preflight: tarayici gercek istek oncesi izin sorar, 204 ile bitir
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

<?php
/**
 * Dosya   : api/musteri/oturum.php
 * Gorev   : Aktif musteri oturumunu dondurur. Oturum yoksa 401.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php, middleware/musteri_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';
require_once __DIR__ . '/../../middleware/musteri_zorunlu.php';

if (Request::method() !== 'GET') {
    Response::fail('Bu endpoint yalnizca GET metodunu kabul eder.', [], 405);
}

Response::ok(['hesap' => MusteriAuth::user()]);

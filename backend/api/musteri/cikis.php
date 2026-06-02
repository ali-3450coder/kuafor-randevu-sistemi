<?php
/**
 * Dosya   : api/musteri/cikis.php
 * Gorev   : Musteri oturumunu sonlandirir.
 * Bagimli : config/bootstrap.php, core/MusteriAuth.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../core/MusteriAuth.php';

if (Request::method() !== 'POST') {
    Response::fail('Bu endpoint yalnizca POST metodunu kabul eder.', [], 405);
}

MusteriAuth::logout();

Response::ok([], 'Cikis yapildi.');

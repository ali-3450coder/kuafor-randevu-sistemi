<?php
/**
 * Dosya   : api/yonetim/cikis.php
 * Gorev   : Yonetici oturumunu sonlandirir.
 * Bagimli : config/bootstrap.php, core/Auth.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';

// Giris yapmamis biri cikis istegi yapsa bile sessizce temizle; hata verme
Auth::logout();

Response::ok([], 'Cikis basarili.');

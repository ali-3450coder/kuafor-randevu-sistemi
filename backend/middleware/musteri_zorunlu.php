<?php
/**
 * Dosya   : middleware/musteri_zorunlu.php
 * Gorev   : Musteri oturumu zorunlu. Aktif musteri oturumu yoksa 401 doner.
 * Bagimli : config/bootstrap.php (session_start), core/MusteriAuth.php
 */

if (!MusteriAuth::check()) {
    Response::fail('Giris gerekli.', [], 401);
}

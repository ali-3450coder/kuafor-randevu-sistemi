<?php
/**
 * Dosya   : middleware/admin_zorunlu.php
 * Gorev   : Oturum kontrolu + admin rol kontrolu. Yalnizca admin rolundeki kullanicilar gecer.
 *           yetki_zorunlu.php yerine kullanilir; ikisini birden include etme.
 * Bagimli : config/bootstrap.php (Auth, Response)
 */

if (!Auth::check()) {
    Response::fail('Oturum acik degil.', [], 401);
}

if ((Auth::user()['rol'] ?? '') !== 'admin') {
    Response::fail('Bu islemi yapmak icin admin yetkisi gereklidir.', [], 403);
}

<?php

/**
 * Dosya   : middleware/yetki_zorunlu.php
 * Gorev   : Tum yonetim endpointlerinin ilk satirinda include edilmeli.
 * Bagimli : config/bootstrap.php (zaten include edilmis olmali), core/Auth.php
 */

if (!Auth::check()) {
    Response::fail('Yetki yok.', [], 401);
    die;
}

<?php
/**
 * Dosya   : api/yonetim/oturum.php
 * Gorev   : Aktif oturum bilgisini dondurur. Frontend oturum kontrolu icin kullanir.
 * Bagimli : config/bootstrap.php, middleware/yetki_zorunlu.php
 */

require_once __DIR__ . '/../../config/bootstrap.php';
require_once __DIR__ . '/../../middleware/yetki_zorunlu.php';

Response::ok(['yetkili' => Auth::user()]);

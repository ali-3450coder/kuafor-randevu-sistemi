<?php
/**
 * Dosya   : core/MusteriAuth.php
 * Gorev   : Oturum tabanli musteri kimlik dogrulama. Auth.php ile ayni pattern.
 * Bagimli : session_start() bootstrap.php tarafindan cagirilmis olmalidir.
 */

class MusteriAuth
{
    private const SESSION_KEY = 'musteri_hesap';

    /**
     * Musteri bilgilerini oturuma yazar.
     *
     * @param array $hesap ['hesap_id', 'ad_soyad', 'telefon', 'email'?, 'kayit_tarihi'?] icermelidir.
     */
    public static function login(array $hesap): void
    {
        session_regenerate_id(true);

        $_SESSION[self::SESSION_KEY] = [
            'hesap_id'      => $hesap['hesap_id'],
            'ad_soyad'      => $hesap['ad_soyad'],
            'telefon'       => $hesap['telefon'],
            'email'         => $hesap['email']         ?? null,
            'kayit_tarihi'  => $hesap['kayit_tarihi']  ?? null,
            'login_at'      => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Gecerli bir musteri oturumu var mi?
     */
    public static function check(): bool
    {
        return isset($_SESSION[self::SESSION_KEY]);
    }

    /**
     * Oturumdaki musteri verisini dondurur; oturum yoksa null.
     */
    public static function user(): ?array
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    /**
     * Oturumu sonlandirir ve cookie'yi temizler.
     */
    public static function logout(): void
    {
        unset($_SESSION[self::SESSION_KEY]);

        if (session_status() === PHP_SESSION_ACTIVE && empty($_SESSION)) {
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(
                    session_name(),
                    '',
                    time() - 42000,
                    $params['path'],
                    $params['domain'],
                    $params['secure'],
                    $params['httponly']
                );
            }
            session_destroy();
        }
    }
}

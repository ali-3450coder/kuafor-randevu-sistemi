<?php
/**
 * Dosya   : core/Auth.php
 * Gorev   : Oturum tabanli yonetici kimlik dogrulama islemleri.
 * Bagimli : session_start() bootstrap.php tarafindan cagirilmis olmalidir.
 */

class Auth
{
    /** Oturum anahtari; diger anahtarlarla catismayi onle */
    private const SESSION_KEY = 'yetkili';

    /**
     * Yetkili bilgilerini oturuma yazar.
     *
     * @param array $yetkili ['id', 'ad_soyad', 'rol'] icermelidir.
     * @return void
     */
    public static function login(array $yetkili): void
    {
        // Oturum sabitleme saldirilarini onlemek icin yeni ID uret
        session_regenerate_id(true);

        $_SESSION[self::SESSION_KEY] = [
            'id'       => $yetkili['id'],
            'ad_soyad' => $yetkili['ad_soyad'],
            'rol'      => $yetkili['rol'],
            'login_at' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Gecerli bir oturum var mi?
     *
     * @return bool
     */
    public static function check(): bool
    {
        return isset($_SESSION[self::SESSION_KEY]);
    }

    /**
     * Oturumdaki yetkili verisini dondurur; oturum yoksa null.
     *
     * @return array|null
     */
    public static function user(): ?array
    {
        return $_SESSION[self::SESSION_KEY] ?? null;
    }

    /**
     * Oturumu sonlandirir ve cookie'yi temizler.
     *
     * @return void
     */
    public static function logout(): void
    {
        $_SESSION = [];

        // Cookie tarayicidan da silinsin
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

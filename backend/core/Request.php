<?php
/**
 * Dosya   : core/Request.php
 * Gorev   : HTTP istek verilerine (method, JSON body, query param) erisim saglar.
 * Bagimli : -
 */

class Request
{
    /**
     * HTTP metodunu buyuk harfle dondurur (GET, POST, ...).
     *
     * @return string
     */
    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    /**
     * php://input icerigini JSON olarak cozumler.
     * Parse basarisiz olursa bos dizi doner; hata firlatmaz.
     *
     * @return array
     */
    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        // json_decode null donerse girdi gecersizdir
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * GET/POST parametresini dondurur; bulunamazsa $default.
     *
     * @param string $key
     * @param mixed  $default
     * @return mixed
     */
    public static function param(string $key, mixed $default = null): mixed
    {
        return $_REQUEST[$key] ?? $default;
    }
}

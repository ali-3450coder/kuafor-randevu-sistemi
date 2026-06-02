<?php
/**
 * Dosya   : core/Response.php
 * Gorev   : Tum API cevaplarini standart JSON zarfina sarar.
 * Bagimli : -
 */

class Response
{
    /**
     * Basarili tek-kayit veya genel islem cevabi.
     *
     * @param array  $data Donecek veri.
     * @param string $msg  Basari mesaji.
     * @return void
     */
    public static function ok(array $data = [], string $msg = 'Islem basarili.'): void
    {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $msg,
            'data'    => $data,
        ]);
        exit;
    }

    /**
     * Hata cevabi; HTTP kodu ayarlanabilir.
     *
     * @param string $msg    Hata aciklamasi.
     * @param array  $errors Alan bazli hata listesi.
     * @param int    $http   HTTP durum kodu.
     * @return void
     */
    public static function fail(string $msg, array $errors = [], int $http = 400): void
    {
        http_response_code($http);
        $body = [
            'success' => false,
            'message' => $msg,
        ];
        if (!empty($errors)) {
            $body['errors'] = $errors;
        }
        echo json_encode($body);
        exit;
    }

    /**
     * Liste cevabi; satir dizisi ve mesaj alir.
     *
     * @param array  $rows Kayit listesi.
     * @param string $msg  Basari mesaji.
     * @return void
     */
    public static function list(array $rows, string $msg = 'Kayitlar listelendi.'): void
    {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $msg,
            'data'    => $rows,
        ]);
        exit;
    }
}

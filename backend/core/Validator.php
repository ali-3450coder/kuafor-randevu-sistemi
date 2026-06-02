<?php
/**
 * Dosya   : core/Validator.php
 * Gorev   : Gelen veriyi kurallara gore dogrular; hata listesi dondurur.
 * Bagimli : -
 */

class Validator
{
    /**
     * Veriyi kural setine gore kontrol eder.
     *
     * @param array $data  Dogrulanacak veri (genellikle Request::json()).
     * @param array $rules Alan => kural dizisi eslemesi.
     * @return array ['ok' => bool, 'errors' => string[]]
     */
    public static function check(array $data, array $rules): array
    {
        $errors = [];

        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;

            foreach ($fieldRules as $rule) {
                $error = self::applyRule($field, $value, $rule, $data);
                if ($error !== null) {
                    $errors[$field][] = $error;
                    // Alan icin ilk hatayi bulduktan sonra sonraki kurallara gecme
                    break;
                }
            }
        }

        return ['ok' => empty($errors), 'errors' => $errors];
    }

    /**
     * Tek bir kurali uygular; hata varsa mesaj, yoksa null doner.
     *
     * @param string $field Alan adi.
     * @param mixed  $value Alan degeri.
     * @param mixed  $rule  Kural (string veya array).
     * @param array  $data  Tum veri (cross-field kontrol icin).
     * @return string|null
     */
    private static function applyRule(string $field, mixed $value, mixed $rule, array $data): ?string
    {
        // Parametreli kurallar dizi olarak gelir: ['enum', ['a','b']]
        $ruleName   = is_array($rule) ? $rule[0] : $rule;
        $ruleParam  = is_array($rule) ? ($rule[1] ?? null) : null;

        switch ($ruleName) {
            case 'required':
                if ($value === null || $value === '') {
                    return "{$field} zorunludur.";
                }
                break;

            case 'integer':
                // filter_var ile PHP'nin kendi tip donusumune guvenilmez; string '3' de kabul edilmeli
                if (!filter_var($value, FILTER_VALIDATE_INT) && $value !== 0 && $value !== '0') {
                    return "{$field} tam sayi olmalidir.";
                }
                break;

            case 'positive_int':
                if (!filter_var($value, FILTER_VALIDATE_INT) || (int)$value < 1) {
                    return "{$field} pozitif tam sayi olmalidir.";
                }
                break;

            case 'email':
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    return "{$field} gecerli bir e-posta olmalidir.";
                }
                break;

            case 'phone':
                // Basit Turkiye formatı: rakam, bosluk, tire; 10-15 karakter
                if (!preg_match('/^[0-9\s\-\+]{10,15}$/', (string)$value)) {
                    return "{$field} gecerli bir telefon olmalidir.";
                }
                break;

            case 'date':
                // Y-m-d formatini ve takvim gecerliligi kontrol et
                $d = DateTime::createFromFormat('Y-m-d', (string)$value);
                if (!$d || $d->format('Y-m-d') !== $value) {
                    return "{$field} Y-m-d formatinda tarih olmalidir.";
                }
                break;

            case 'time':
                // H:i formatini kontrol et
                $t = DateTime::createFromFormat('H:i', (string)$value);
                if (!$t || $t->format('H:i') !== $value) {
                    return "{$field} H:i formatinda saat olmalidir.";
                }
                break;

            case 'enum':
                // $ruleParam izin verilen deger listesidir
                if (!in_array($value, (array)$ruleParam, true)) {
                    $allowed = implode(', ', (array)$ruleParam);
                    return "{$field} su degerlerden biri olmalidir: {$allowed}.";
                }
                break;

            case 'array_of_int':
                if (!is_array($value)) {
                    return "{$field} dizi olmalidir.";
                }
                foreach ($value as $item) {
                    // filter_var(0,...) = 0 (falsy) oldugu icin 0/'0' ayrica kontrol edilir
                    if (!filter_var($item, FILTER_VALIDATE_INT) && $item !== 0 && $item !== '0') {
                        return "{$field} sadece tam sayi icermelidir.";
                    }
                }
                // En az 1 eleman zorunlulugu ayri bir kural olarak eklenir; burada tip kontrolu yeterli
                break;

            case 'min_len':
                if (mb_strlen((string)$value) < (int)$ruleParam) {
                    return "{$field} en az {$ruleParam} karakter olmalidir.";
                }
                break;

            case 'max_len':
                if (mb_strlen((string)$value) > (int)$ruleParam) {
                    return "{$field} en fazla {$ruleParam} karakter olmalidir.";
                }
                break;

            case 'min_count':
                // Dizi eleman sayisi kontrolu (array_of_int ile birlikte kullanilir)
                if (!is_array($value) || count($value) < (int)$ruleParam) {
                    return "{$field} en az {$ruleParam} eleman icermelidir.";
                }
                break;
        }

        return null;
    }
}

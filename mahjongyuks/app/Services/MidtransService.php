<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$isProduction = filter_var(config('services.midtrans.is_production'), FILTER_VALIDATE_BOOLEAN);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    public function createSnapToken(array $params): string
    {
        return Snap::getSnapToken($params);
    }

    /** Status transaksi dari Midtrans, atau null kalau belum ada / gagal. */
    public function status(string $orderId): ?object
    {
        try {
            $r = Transaction::status($orderId);
            return is_array($r) ? (object) $r : $r;
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function signatureValid(array $p): bool
    {
        $expected = hash(
            'sha512',
            ($p['order_id'] ?? '') . ($p['status_code'] ?? '') . ($p['gross_amount'] ?? '') . config('services.midtrans.server_key')
        );

        return hash_equals($expected, (string) ($p['signature_key'] ?? ''));
    }
}
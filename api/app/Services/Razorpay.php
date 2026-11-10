<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Thin Razorpay REST client. Never touches card data: the browser talks to Razorpay Checkout directly. */
class Razorpay
{
    public function configured(): bool
    {
        return filled(config('services.razorpay.key_id')) && filled(config('services.razorpay.key_secret'));
    }

    public function keyId(): string
    {
        return (string) config('services.razorpay.key_id');
    }

    public function createOrder(string $receipt, float $amountRupees, array $notes = []): array
    {
        $res = Http::withBasicAuth($this->keyId(), (string) config('services.razorpay.key_secret'))
            ->timeout(15)->acceptJson()
            ->post('https://api.razorpay.com/v1/orders', [
                'amount' => (int) round($amountRupees * 100), 'currency' => 'INR', 'receipt' => $receipt, 'notes' => $notes,
            ]);
        if (! $res->successful()) {
            throw new RuntimeException('Razorpay order creation failed: ' . ($res->json('error.description') ?? $res->status()));
        }
        return $res->json();
    }

    /** Full or partial refund of a captured payment. Returns the Razorpay refund entity. */
    public function refund(string $paymentId, float $amountRupees, array $notes = []): array
    {
        $res = Http::withBasicAuth($this->keyId(), (string) config('services.razorpay.key_secret'))
            ->timeout(20)->acceptJson()
            ->post("https://api.razorpay.com/v1/payments/{$paymentId}/refund", ['amount' => (int) round($amountRupees * 100), 'notes' => $notes]);
        if (! $res->successful()) {
            throw new RuntimeException('Razorpay refund failed: ' . ($res->json('error.description') ?? $res->status()));
        }
        return $res->json();
    }

    /** Checkout callback signature: HMAC_SHA256(order_id|payment_id, key_secret). */
    public function verifyPayment(string $orderId, string $paymentId, string $signature): bool
    {
        $expected = hash_hmac('sha256', $orderId . '|' . $paymentId, (string) config('services.razorpay.key_secret'));
        return hash_equals($expected, $signature);
    }

    /** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). */
    public function verifyWebhook(string $rawBody, string $signature): bool
    {
        $secret = (string) config('services.razorpay.webhook_secret');
        if ($secret === '') return false;
        return hash_equals(hash_hmac('sha256', $rawBody, $secret), $signature);
    }
}

<?php

namespace Tests\Feature;

use App\Models\{Order, Payment};
use Illuminate\Support\Facades\{Http, Mail};

class PaymentTest extends StoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['services.razorpay.key_id' => 'rzp_test_x', 'services.razorpay.key_secret' => 'secret123', 'services.razorpay.webhook_secret' => 'whsec']);
        Http::fake([
            'api.razorpay.com/v1/orders' => Http::response(['id' => 'order_TEST1', 'amount' => 57900, 'currency' => 'INR']),
        ]);
    }

    private function onlineOrder(int $qty = 1): array
    {
        $p = $this->product(['price' => 500, 'stock' => 5]);
        $res = $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => $qty]], ['payment_method' => 'upi']))->assertCreated();
        return [$p, $res->json('order.number'), $res->json('guest_token'), $res->json('razorpay')];
    }

    private function sig(string $orderId, string $paymentId): string
    {
        return hash_hmac('sha256', "$orderId|$paymentId", 'secret123');
    }

    public function test_online_order_stays_pending_and_reserves_stock_until_verified(): void
    {
        [$p, $num, , $rz] = $this->onlineOrder(2);
        $this->assertSame('rzp_test_x', $rz['key_id']);
        $this->assertSame('order_TEST1', $rz['order_id']);
        $o = Order::where('number', $num)->first();
        $this->assertSame('pending_payment', $o->status);
        $this->assertSame('pending', $o->payment_status);
        $this->assertEquals(3, $p->fresh()->stock);
        Mail::assertNothingSent(); // no confirmation email before payment
    }

    public function test_fake_signature_never_marks_an_order_paid(): void
    {
        [, $num, $token] = $this->onlineOrder();
        $this->postJson('/api/checkout/verify', ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'razorpay_payment_id' => 'pay_X', 'razorpay_signature' => 'forged'], ['X-Guest-Token' => $token])->assertStatus(422);
        $o = Order::where('number', $num)->first();
        $this->assertSame('payment_failed', $o->status);
        $this->assertNotSame('paid', $o->payment_status);
    }

    public function test_valid_signature_confirms_payment_once(): void
    {
        [, $num, $token] = $this->onlineOrder();
        $body = ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'razorpay_payment_id' => 'pay_OK', 'razorpay_signature' => $this->sig('order_TEST1', 'pay_OK')];
        $this->postJson('/api/checkout/verify', $body, ['X-Guest-Token' => $token])->assertOk()->assertJsonPath('order.status', 'payment_confirmed')->assertJsonPath('order.payment_status', 'paid');
        $this->postJson('/api/checkout/verify', $body, ['X-Guest-Token' => $token])->assertOk(); // idempotent
        $this->assertSame(1, Payment::where('status', 'captured')->count());
        Mail::assertSent(\App\Mail\StoreMail::class, 1);
    }

    public function test_verify_requires_ownership_of_the_order(): void
    {
        [, $num] = $this->onlineOrder();
        $body = ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'razorpay_payment_id' => 'pay_OK', 'razorpay_signature' => $this->sig('order_TEST1', 'pay_OK')];
        $this->postJson('/api/checkout/verify', $body)->assertNotFound();
        $this->postJson('/api/checkout/verify', $body, ['X-Guest-Token' => 'stolen'])->assertNotFound();
    }

    public function test_failed_payment_can_be_retried(): void
    {
        [, $num, $token] = $this->onlineOrder();
        $this->postJson('/api/checkout/failed', ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'reason' => 'cancelled'], ['X-Guest-Token' => $token])->assertOk()->assertJsonPath('order.status', 'payment_failed');
        $this->postJson("/api/checkout/$num/retry", [], ['X-Guest-Token' => $token])->assertOk()->assertJsonPath('razorpay.order_id', 'order_TEST1');
        $this->assertSame('pending_payment', Order::where('number', $num)->value('status'));
    }

    public function test_webhook_rejects_bad_signature_and_wrong_amount_and_accepts_good_one(): void
    {
        [, $num] = $this->onlineOrder();
        $event = fn (int $amount) => json_encode(['event' => 'payment.captured', 'payload' => ['payment' => ['entity' => ['id' => 'pay_W', 'order_id' => 'order_TEST1', 'amount' => $amount]]]]);

        $this->call('POST', '/api/webhooks/razorpay', [], [], [], ['HTTP_X-Razorpay-Signature' => 'bad', 'CONTENT_TYPE' => 'application/json'], $event(57900))->assertStatus(400);

        $wrong = $event(100);
        $this->call('POST', '/api/webhooks/razorpay', [], [], [], ['HTTP_X-Razorpay-Signature' => hash_hmac('sha256', $wrong, 'whsec'), 'CONTENT_TYPE' => 'application/json'], $wrong)->assertOk();
        $this->assertSame('pending_payment', Order::where('number', $num)->value('status')); // amount mismatch ignored

        $good = $event(57900);
        $this->call('POST', '/api/webhooks/razorpay', [], [], [], ['HTTP_X-Razorpay-Signature' => hash_hmac('sha256', $good, 'whsec'), 'CONTENT_TYPE' => 'application/json'], $good)->assertOk();
        $this->assertSame('payment_confirmed', Order::where('number', $num)->value('status'));
    }

    public function test_cancelling_a_paid_online_order_refunds_through_razorpay(): void
    {
        [$p, $num, $token] = $this->onlineOrder(2);
        $this->postJson('/api/checkout/verify', ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'razorpay_payment_id' => 'pay_OK', 'razorpay_signature' => $this->sig('order_TEST1', 'pay_OK')], ['X-Guest-Token' => $token])->assertOk();
        $o = Order::where('number', $num)->first();
        Http::fake(['api.razorpay.com/v1/payments/*/refund' => Http::response(['id' => 'rfnd_1', 'status' => 'processed'])]);
        app(\App\Services\OrderService::class)->cancel($o, 'test');
        $o = $o->fresh();
        $this->assertSame('cancelled', $o->status);
        $this->assertSame('refunded', $o->payment_status);
        $this->assertSame('rfnd_1', $o->refund_id);
        $this->assertEquals(5, $p->fresh()->stock);
        Http::assertSent(fn ($r) => str_contains($r->url(), '/payments/pay_OK/refund') && (int) $r['amount'] === (int) round($o->total * 100));
    }

    public function test_failed_refund_is_recorded_as_pending_not_lost(): void
    {
        [, $num, $token] = $this->onlineOrder();
        $this->postJson('/api/checkout/verify', ['order_number' => $num, 'razorpay_order_id' => 'order_TEST1', 'razorpay_payment_id' => 'pay_OK', 'razorpay_signature' => $this->sig('order_TEST1', 'pay_OK')], ['X-Guest-Token' => $token])->assertOk();
        Http::fake(['api.razorpay.com/v1/payments/*/refund' => Http::response(['error' => ['description' => 'boom']], 400)]);
        app(\App\Services\OrderService::class)->cancel(Order::where('number', $num)->first(), 'test');
        $this->assertSame('refund_pending', Order::where('number', $num)->value('payment_status'));
    }
}

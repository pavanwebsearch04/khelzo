<?php

namespace Tests\Feature;

use App\Mail\StoreMail;
use App\Models\{Order, Setting};
use Illuminate\Support\Facades\Mail;

class CheckoutTest extends StoreTestCase
{
    public function test_cod_checkout_creates_order_decrements_stock_and_emails(): void
    {
        Mail::fake();
        $p = $this->product(['price' => 500, 'stock' => 5]);
        $res = $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 2]]))->assertCreated();
        $this->assertSame('order_placed', $res->json('order.status'));
        $this->assertSame('cod_due', $res->json('order.payment_status'));
        $this->assertEquals(1000, $res->json('order.subtotal'));
        $this->assertEquals(3, $p->fresh()->stock);
        $this->assertNotEmpty($res->json('guest_token'));
        Mail::assertSent(StoreMail::class, fn ($m) => $m->hasTo('asha@example.com'));
    }

    public function test_client_cannot_set_prices(): void
    {
        $p = $this->product(['price' => 500]);
        $body = $this->payload([['id' => $p->id, 'qty' => 1, 'price' => 1, 'unit_price' => 1]]) + ['total' => 1, 'subtotal' => 1];
        $res = $this->postJson('/api/checkout', $body)->assertCreated();
        $this->assertEquals(579, $res->json('order.total')); // 500 + 79 shipping, below the free-shipping threshold
    }

    public function test_cannot_order_more_than_stock_and_last_unit_goes_to_first_buyer(): void
    {
        $p = $this->product(['stock' => 1]);
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 2]]))->assertStatus(422);
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]]))->assertCreated();
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]]))->assertStatus(422);
        $this->assertEquals(0, $p->fresh()->stock);
        $this->assertSame(1, Order::count());
    }

    public function test_validation_rejects_bad_phone_and_pin(): void
    {
        $p = $this->product();
        $bad = $this->payload([['id' => $p->id, 'qty' => 1]]);
        $bad['customer']['phone'] = '12345';
        $this->postJson('/api/checkout', $bad)->assertStatus(422);
        $bad = $this->payload([['id' => $p->id, 'qty' => 1]]);
        $bad['address']['pincode'] = '012345';
        $this->postJson('/api/checkout', $bad)->assertStatus(422);
    }

    public function test_online_payment_is_refused_when_razorpay_is_not_configured(): void
    {
        $p = $this->product();
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]], ['payment_method' => 'upi']))->assertStatus(503);
        $this->assertSame(0, Order::count());
    }

    public function test_blocked_pin_codes_are_rejected(): void
    {
        Setting::put('shipping', ['free_above' => 999, 'blocked_pins' => '7440', 'methods' => [['id' => 'standard', 'label' => 'S', 'fee' => 79, 'days_min' => 3, 'days_max' => 7]]]);
        $p = $this->product();
        $body = $this->payload([['id' => $p->id, 'qty' => 1]]);
        $body['address']['pincode'] = '744001';
        $this->postJson('/api/checkout', $body)->assertStatus(422)->assertJsonValidationErrors('address.pincode');
        $this->getJson('/api/pincode/744001')->assertOk()->assertJson(['serviceable' => false]);
        $this->getJson('/api/pincode/411001')->assertOk()->assertJson(['serviceable' => true]);
        $this->getJson('/api/pincode/12')->assertStatus(422);
    }

    public function test_free_shipping_above_threshold(): void
    {
        $p = $this->product(['price' => 600]);
        $q = $this->postJson('/api/cart/quote', ['items' => [['id' => $p->id, 'qty' => 2]]])->assertOk();
        $this->assertEquals(0, $q->json('shipping'));
        $q = $this->postJson('/api/cart/quote', ['items' => [['id' => $p->id, 'qty' => 1]]])->assertOk();
        $this->assertEquals(79, $q->json('shipping'));
    }

    public function test_variant_products_need_a_variant_and_use_variant_stock(): void
    {
        $p = $this->product(['price' => 500]);
        $v = $this->variant($p, ['price' => 650, 'mrp' => 800, 'stock' => 2]);
        $p->update(['stock' => 2]);
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]]))->assertStatus(422);
        $res = $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'variant_id' => $v->id, 'qty' => 2]]))->assertCreated();
        $this->assertEquals(1300, $res->json('order.subtotal'));
        $this->assertEquals(0, $v->fresh()->stock);
        $this->assertEquals(0, $p->fresh()->stock);
        $this->assertSame($v->label, $res->json('order.items.0.variant_label'));
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'variant_id' => $v->id, 'qty' => 1]]))->assertStatus(422);
    }

    public function test_cancelling_restocks_including_variants(): void
    {
        Mail::fake();
        $p = $this->product();
        $v = $this->variant($p, ['stock' => 4]);
        $p->update(['stock' => 4]);
        $this->actingAs($this->user(), 'sanctum');
        $num = $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'variant_id' => $v->id, 'qty' => 3]]))->assertCreated()->json('order.number');
        $this->assertEquals(1, $v->fresh()->stock);
        $this->postJson("/api/account/orders/$num/cancel")->assertOk();
        $this->assertEquals(4, $v->fresh()->stock);
        $this->assertEquals(4, $p->fresh()->stock);
        $this->assertSame('cancelled', Order::where('number', $num)->value('status'));
    }

    public function test_guest_can_track_only_with_the_token(): void
    {
        $p = $this->product();
        $r = $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]]))->assertCreated();
        $n = $r->json('order.number');
        $this->getJson("/api/orders/track/$n")->assertNotFound();
        $this->getJson("/api/orders/track/$n", ['X-Guest-Token' => 'wrong'])->assertNotFound();
        $this->getJson("/api/orders/track/$n", ['X-Guest-Token' => $r->json('guest_token')])->assertOk()->assertJsonPath('number', $n);
    }
}

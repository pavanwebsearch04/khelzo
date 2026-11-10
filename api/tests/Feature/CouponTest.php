<?php

namespace Tests\Feature;

use App\Models\{Category, Coupon, Order};

class CouponTest extends StoreTestCase
{
    private function coupon(array $o): Coupon
    {
        return Coupon::create($o + ['code' => 'CODE' . random_int(1000, 9999), 'type' => 'percent', 'value' => 10, 'active' => true]);
    }

    private function quote(int $pid, int $qty, string $code)
    {
        return $this->postJson('/api/cart/quote', ['items' => [['id' => $pid, 'qty' => $qty]], 'coupon' => $code]);
    }

    public function test_percent_coupon_with_cap(): void
    {
        $p = $this->product(['price' => 1000]);
        $this->coupon(['code' => 'TEN', 'value' => 10, 'max_discount' => 50]);
        $this->assertEquals(50, $this->quote($p->id, 1, 'ten')->assertOk()->json('discount'));
    }

    public function test_fixed_coupon_and_min_order(): void
    {
        $p = $this->product(['price' => 500]);
        $this->coupon(['code' => 'FLAT100', 'type' => 'fixed', 'value' => 100, 'min_order' => 999]);
        $this->quote($p->id, 1, 'FLAT100')->assertStatus(422)->assertJsonValidationErrors('coupon');
        $this->assertEquals(100, $this->quote($p->id, 2, 'FLAT100')->assertOk()->json('discount'));
    }

    public function test_expired_inactive_and_exhausted_coupons_fail(): void
    {
        $p = $this->product();
        $this->coupon(['code' => 'OLD', 'expires_at' => now()->subDay()]);
        $this->coupon(['code' => 'OFF', 'active' => false]);
        $this->coupon(['code' => 'FULL', 'usage_limit' => 1, 'used_count' => 1]);
        $this->coupon(['code' => 'SOON', 'starts_at' => now()->addDay()]);
        foreach (['OLD', 'OFF', 'FULL', 'SOON', 'NOPE'] as $code) $this->quote($p->id, 1, $code)->assertStatus(422);
    }

    public function test_first_order_coupon_needs_login_and_no_previous_order(): void
    {
        $p = $this->product();
        $this->coupon(['code' => 'WELCOME', 'first_order_only' => true]);
        $this->quote($p->id, 1, 'WELCOME')->assertStatus(422);
        $this->actingAs($this->user(), 'sanctum');
        $this->quote($p->id, 1, 'WELCOME')->assertOk();
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]], ['coupon' => 'WELCOME']))->assertCreated();
        $this->quote($p->id, 1, 'WELCOME')->assertStatus(422);
    }

    public function test_category_and_product_specific_coupons(): void
    {
        $a = $this->product(['price' => 1000]);
        $other = Category::create(['slug' => 'puzzles', 'name' => 'Puzzles', 'short' => 'Puzzles']);
        $b = $this->product(['price' => 1000, 'category_id' => $other->id]);
        $this->coupon(['code' => 'SOFT', 'category_id' => $this->cat->id, 'value' => 10]);
        $this->assertEquals(100, $this->quote($a->id, 1, 'SOFT')->assertOk()->json('discount'));
        $this->quote($b->id, 1, 'SOFT')->assertStatus(422);
        $this->coupon(['code' => 'ONLYB', 'product_id' => $b->id, 'value' => 20]);
        $this->assertEquals(200, $this->quote($b->id, 1, 'ONLYB')->assertOk()->json('discount'));
    }

    public function test_free_shipping_coupon_and_usage_counter(): void
    {
        $p = $this->product(['price' => 300]);
        $this->coupon(['code' => 'SHIPFREE', 'type' => 'free_shipping', 'value' => 0, 'usage_limit' => 5]);
        $this->assertEquals(0, $this->quote($p->id, 1, 'SHIPFREE')->assertOk()->json('shipping'));
        $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]], ['coupon' => 'SHIPFREE']))->assertCreated();
        $this->assertEquals(1, Coupon::where('code', 'SHIPFREE')->value('used_count'));
        $this->assertEquals(300, Order::first()->total);
    }
}

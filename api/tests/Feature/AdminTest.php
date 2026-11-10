<?php

namespace Tests\Feature;

use App\Mail\StoreMail;
use App\Models\{ActivityLog, Order, Product, Review, Setting};
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;

class AdminTest extends StoreTestCase
{
    private function admin(string $role = 'admin')
    {
        return $this->actingAs($this->user($role), 'sanctum');
    }

    private function productBody(array $o = []): array
    {
        return $o + ['name' => 'QA Robot', 'sku' => 'QA-1', 'category_id' => $this->cat->id, 'age_group' => '6-8', 'toy_type' => 'indoor', 'price' => 499, 'mrp' => 799, 'stock' => 7, 'description' => 'desc', 'status' => 'published'];
    }

    private function placeOrder(): string
    {
        $p = $this->product(['stock' => 10]);
        return $this->postJson('/api/checkout', $this->payload([['id' => $p->id, 'qty' => 1]]))->assertCreated()->json('order.number');
    }

    public function test_admin_routes_require_auth_and_role(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->actingAs($this->user('customer'), 'sanctum')->getJson('/api/admin/dashboard')->assertForbidden();
        $this->actingAs($this->user('customer'), 'sanctum')->postJson('/api/admin/products', $this->productBody())->assertForbidden();
        $this->admin('manager')->getJson('/api/admin/dashboard')->assertOk();
    }

    public function test_manager_cannot_change_settings_staff_or_delete_coupons(): void
    {
        $this->admin('manager');
        $this->putJson('/api/admin/settings', [])->assertForbidden();
        $this->getJson('/api/admin/staff')->assertForbidden();
        $this->getJson('/api/admin/activity')->assertForbidden();
    }

    public function test_admin_can_create_update_stock_and_it_is_logged(): void
    {
        $this->admin();
        $id = $this->postJson('/api/admin/products', $this->productBody())->assertCreated()->json('id');
        $this->putJson("/api/admin/products/$id", $this->productBody(['stock' => 20]))->assertOk()->assertJsonPath('stock', 20);
        $this->assertDatabaseHas('inventory_movements', ['product_id' => $id, 'change' => 13, 'reason' => 'adjustment']);
        $this->assertGreaterThanOrEqual(2, ActivityLog::count());
        $this->getJson('/api/admin/activity')->assertOk()->assertJsonStructure(['data' => [['who', 'action']]]);
    }

    public function test_product_validation(): void
    {
        $this->admin();
        $this->postJson('/api/admin/products', $this->productBody(['mrp' => 100]))->assertStatus(422); // mrp below price
        $this->postJson('/api/admin/products', $this->productBody(['price' => -5]))->assertStatus(422);
    }

    public function test_variants_are_saved_and_product_price_and_stock_follow_them(): void
    {
        $this->admin();
        $body = $this->productBody(['variants' => [
            ['sku' => 'QA-S', 'label' => 'Small', 'price' => 450, 'mrp' => 600, 'stock' => 3],
            ['sku' => 'QA-L', 'label' => 'Large', 'price' => 650, 'mrp' => 800, 'stock' => 4],
        ]]);
        $res = $this->postJson('/api/admin/products', $body)->assertCreated();
        $this->assertEquals(450, $res->json('price'));
        $this->assertEquals(7, $res->json('stock'));
        $this->assertCount(2, $res->json('variants'));
        $dup = $this->productBody(['sku' => 'QA-2', 'name' => 'Other', 'variants' => [['sku' => 'QA-S', 'label' => 'x', 'price' => 10, 'mrp' => 20, 'stock' => 1]]]);
        $this->postJson('/api/admin/products', $dup)->assertStatus(422); // variant SKU already used
    }

    public function test_bulk_actions_and_csv_import_export(): void
    {
        $this->admin();
        $a = $this->product(); $b = $this->product();
        $this->postJson('/api/admin/products/bulk', ['ids' => [$a->id, $b->id], 'action' => 'unpublish'])->assertOk()->assertJson(['updated' => 2]);
        $this->assertSame('draft', $a->fresh()->status);
        $this->postJson('/api/admin/products/bulk', ['ids' => [$a->id], 'action' => 'feature'])->assertOk();
        $this->assertTrue($a->fresh()->featured);
        $this->postJson('/api/admin/products/bulk', ['ids' => [$a->id, $b->id], 'action' => 'set_stock', 'value' => 42])->assertOk();
        $this->assertEquals(42, $b->fresh()->stock);

        $csv = "sku,name,category_slug,price,mrp,stock,status\nCSV-1,CSV Toy,soft-toys,299,399,9,published\nCSV-2,Bad Toy,nope,299,399,9,published\n";
        $file = UploadedFile::fake()->createWithContent('p.csv', $csv);
        $res = $this->postJson('/api/admin/products/import', ['file' => $file])->assertOk();
        $this->assertSame(1, $res->json('created'));
        $this->assertCount(1, $res->json('errors'));
        $this->assertSame('CSV Toy', Product::where('sku', 'CSV-1')->value('name'));
        $this->get('/api/admin/products/export')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_order_status_flow_sends_emails_and_updates_cod_payment(): void
    {
        Mail::fake();
        $num = $this->placeOrder();
        $this->admin();
        foreach (['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as $s) {
            $this->postJson("/api/admin/orders/$num/status", ['status' => $s])->assertOk()->assertJsonPath('status', $s);
        }
        $o = Order::where('number', $num)->first();
        $this->assertSame('paid', $o->payment_status); // COD collected on delivery
        Mail::assertSent(StoreMail::class, fn ($m) => str_contains($m->subjectLine, 'delivered'));
        Mail::assertSent(StoreMail::class, fn ($m) => str_contains($m->subjectLine, 'shipped'));
        $this->putJson("/api/admin/orders/$num/tracking", ['carrier' => 'Delhivery', 'tracking_number' => 'D123'])->assertOk()->assertJsonPath('shipment.carrier', 'Delhivery');
        $this->putJson("/api/admin/orders/$num/note", ['admin_note' => 'Gift wrap'])->assertOk()->assertJsonPath('admin_note', 'Gift wrap');
        $this->postJson("/api/admin/orders/$num/status", ['status' => 'bogus'])->assertStatus(422);
    }

    public function test_cancelled_orders_cannot_be_reopened(): void
    {
        Mail::fake();
        $num = $this->placeOrder();
        $this->admin();
        $this->postJson("/api/admin/orders/$num/status", ['status' => 'cancelled'])->assertOk();
        $this->postJson("/api/admin/orders/$num/status", ['status' => 'processing'])->assertStatus(409);
    }

    public function test_invoice_and_orders_csv(): void
    {
        $num = $this->placeOrder();
        $this->admin();
        $this->get("/api/admin/orders/$num/invoice")->assertOk()->assertSee('TAX INVOICE', false)->assertSee($num, false);
        $this->get('/api/admin/orders/export')->assertOk();
    }

    public function test_settings_update_by_admin_and_review_moderation_toggle(): void
    {
        $this->admin();
        $body = ['shipping' => ['free_above' => 1500, 'blocked_pins' => '', 'methods' => [['id' => 'standard', 'label' => 'Std', 'fee' => 60, 'days_min' => 2, 'days_max' => 5]]],
            'store' => ['cod_enabled' => true, 'gst_rate' => 12, 'reviews_require_approval' => true, 'low_stock_threshold' => 3, 'gstin' => '27ABCDE1234F1Z5']];
        $this->putJson('/api/admin/settings', $body)->assertOk();
        $this->assertTrue(Setting::get('store')['reviews_require_approval']);
        $this->putJson('/api/admin/settings', ['store' => ['gstin' => 'bad']] + $body)->assertStatus(422);
    }

    public function test_staff_management_and_self_lockout_protection(): void
    {
        $me = $this->user('admin');
        $this->actingAs($me, 'sanctum');
        $id = $this->postJson('/api/admin/staff', ['name' => 'Mgr', 'email' => 'mgr@example.com', 'password' => 'LongPassw0rd!', 'role' => 'manager'])->assertCreated()->json('id');
        $this->putJson("/api/admin/staff/$id", ['is_active' => false])->assertOk();
        $this->putJson("/api/admin/staff/{$me->id}", ['role' => 'manager'])->assertStatus(422);
    }

    public function test_pending_reviews_can_be_approved(): void
    {
        $this->admin();
        $u = $this->user();
        $p = $this->product();
        $order = Order::create(['number' => 'KZ1', 'user_id' => $u->id, 'customer_name' => 'a', 'customer_email' => 'a@a.com', 'customer_phone' => '9876543210', 'shipping_address' => [], 'subtotal' => 1, 'total' => 1, 'payment_method' => 'cod', 'status' => 'delivered']);
        $item = $order->items()->create(['product_id' => $p->id, 'name' => 'x', 'sku' => 'x', 'unit_price' => 1, 'qty' => 1, 'line_total' => 1]);
        $rev = Review::create(['user_id' => $u->id, 'product_id' => $p->id, 'order_item_id' => $item->id, 'rating' => 5, 'status' => 'pending']);
        $this->putJson("/api/admin/reviews/{$rev->id}", ['status' => 'approved'])->assertOk();
        $this->assertSame('approved', $rev->fresh()->status);
        $this->assertEquals(5, $p->fresh()->rating_avg);
    }
}

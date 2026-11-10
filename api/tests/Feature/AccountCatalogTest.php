<?php

namespace Tests\Feature;

use App\Mail\StoreMail;
use App\Models\{Order, Review};
use Illuminate\Support\Facades\{DB, Mail};

class AccountCatalogTest extends StoreTestCase
{
    public function test_register_login_me_and_role_cannot_be_forced(): void
    {
        $res = $this->postJson('/api/auth/register', ['name' => 'Zed', 'email' => 'zed@example.com', 'password' => 'Passw0rd!x', 'password_confirmation' => 'Passw0rd!x', 'role' => 'admin'])->assertCreated();
        $this->assertSame('customer', $res->json('user.role'));
        $this->postJson('/api/auth/login', ['email' => 'zed@example.com', 'password' => 'wrong'])->assertStatus(422);
        $tok = $this->postJson('/api/auth/login', ['email' => 'zed@example.com', 'password' => 'Passw0rd!x'])->assertOk()->json('token');
        $this->getJson('/api/auth/me', ['Authorization' => "Bearer $tok"])->assertOk()->assertJsonPath('user.email', 'zed@example.com');
        $this->postJson('/api/auth/register', ['name' => 'Weak', 'email' => 'w@example.com', 'password' => 'abc', 'password_confirmation' => 'abc'])->assertStatus(422);
    }

    public function test_forgot_password_answer_does_not_reveal_accounts(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
        $this->actingAs($this->user(), 'sanctum');
        $this->postJson('/api/auth/forgot-password', ['email' => 'u1@example.com'])->assertOk();
    }

    public function test_wishlist_sync_merges_guest_items(): void
    {
        $this->actingAs($this->user(), 'sanctum');
        $a = $this->product(); $b = $this->product();
        $this->postJson('/api/account/wishlist/sync', ['ids' => [$a->id, $b->id, 9999]])->assertOk()->assertJsonCount(2, 'ids');
        $this->postJson("/api/account/wishlist/{$a->id}")->assertOk()->assertJsonCount(1, 'ids');
    }

    public function test_saved_cart_keeps_variants(): void
    {
        $this->actingAs($this->user(), 'sanctum');
        $p = $this->product(); $v = $this->variant($p);
        $this->putJson('/api/account/cart', ['items' => [['id' => $p->id, 'variant_id' => $v->id, 'qty' => 2]]])->assertOk();
        $this->getJson('/api/account/cart')->assertOk()->assertJsonPath('items.0.variant_id', $v->id);
    }

    private function deliveredItem($user, $product)
    {
        $o = Order::create(['number' => 'KZ' . random_int(1000, 9999), 'user_id' => $user->id, 'customer_name' => 'a', 'customer_email' => 'a@a.com', 'customer_phone' => '9876543210', 'shipping_address' => [], 'subtotal' => 1, 'total' => 1, 'payment_method' => 'cod', 'status' => 'delivered']);
        return $o->items()->create(['product_id' => $product->id, 'name' => 'x', 'sku' => 'x', 'unit_price' => 1, 'qty' => 1, 'line_total' => 1]);
    }

    public function test_reviews_only_for_delivered_purchases_once_and_with_moderation(): void
    {
        $u = $this->user();
        $this->actingAs($u, 'sanctum');
        $p = $this->product();
        $pending = Order::create(['number' => 'KZP', 'user_id' => $u->id, 'customer_name' => 'a', 'customer_email' => 'a@a.com', 'customer_phone' => '9876543210', 'shipping_address' => [], 'subtotal' => 1, 'total' => 1, 'payment_method' => 'cod', 'status' => 'processing']);
        $undelivered = $pending->items()->create(['product_id' => $p->id, 'name' => 'x', 'sku' => 'x', 'unit_price' => 1, 'qty' => 1, 'line_total' => 1]);
        $this->postJson('/api/reviews', ['order_item_id' => $undelivered->id, 'rating' => 5])->assertForbidden();

        $item = $this->deliveredItem($u, $p);
        $this->postJson('/api/reviews', ['order_item_id' => $item->id, 'rating' => 4, 'body' => 'Loved it'])->assertCreated();
        $this->assertSame('approved', Review::first()->status);
        $this->postJson('/api/reviews', ['order_item_id' => $item->id, 'rating' => 4])->assertStatus(422); // duplicate

        $item2 = $this->deliveredItem($u, $this->product());
        $this->postJson('/api/reviews', ['order_item_id' => $item2->id, 'rating' => 1, 'body' => 'visit www.spam.com now'])->assertCreated();
        $this->assertSame('pending', Review::where('order_item_id', $item2->id)->value('status')); // links go to moderation
    }

    public function test_other_users_cannot_review_or_see_my_order(): void
    {
        $owner = $this->user();
        $p = $this->product();
        $item = $this->deliveredItem($owner, $p);
        $this->actingAs($this->user(), 'sanctum');
        $this->postJson('/api/reviews', ['order_item_id' => $item->id, 'rating' => 5])->assertForbidden();
        $this->getJson('/api/account/orders/' . $item->order->number)->assertNotFound();
        $this->getJson('/api/account/orders/' . $item->order->number . '/invoice')->assertNotFound();
    }

    public function test_return_window_and_single_request(): void
    {
        $u = $this->user();
        $this->actingAs($u, 'sanctum');
        $p = $this->product();
        $item = $this->deliveredItem($u, $p);
        $o = $item->order;
        $o->events()->create(['status' => 'delivered']);
        $this->postJson("/api/account/orders/{$o->number}/return", ['type' => 'return', 'reason' => 'Wrong colour'])->assertOk();
        $this->postJson("/api/account/orders/{$o->number}/return", ['type' => 'return', 'reason' => 'Wrong colour'])->assertStatus(409);
    }

    public function test_catalogue_filters_sorting_and_search(): void
    {
        $this->product(['name' => 'Teddy Bear', 'price' => 300, 'mrp' => 600, 'age_group' => '0-2', 'rating_avg' => 4.8]);
        $this->product(['name' => 'Robot Kit', 'price' => 900, 'mrp' => 1000, 'age_group' => '9-12', 'toy_type' => 'educational', 'rating_avg' => 3.5]);
        $this->product(['name' => 'Sold Out Car', 'price' => 500, 'mrp' => 500, 'stock' => 0]);
        $this->product(['name' => 'Hidden Draft', 'status' => 'draft']);
        $names = fn ($q) => collect($this->getJson("/api/products?$q")->assertOk()->json('data'))->pluck('name')->all();
        $this->assertCount(3, $names(''));                                  // draft hidden
        $this->assertSame(['Teddy Bear'], $names('age=0-2'));
        $this->assertSame(['Robot Kit'], $names('type=educational'));
        $this->assertSame(['Teddy Bear'], $names('min=250&max=350'));
        $this->assertSame(['Teddy Bear'], $names('rating=4.5'));
        $this->assertSame(['Teddy Bear'], $names('discount=40'));
        $this->assertNotContains('Sold Out Car', $names('availability=in_stock'));
        $this->assertSame(['Teddy Bear', 'Sold Out Car', 'Robot Kit'], $names('sort=price-asc'));
        $this->assertSame('Robot Kit', $names('sort=price-desc')[0]);
        $this->assertSame('Teddy Bear', $names('sort=discount')[0]);
        $this->assertSame(['Teddy Bear'], $names('q=teddy'));
        $this->assertSame(['Teddy Bear'], $names('q=tedy'));                 // typo-tolerant fallback
        $this->assertSame([], $names('q=zzzzqq'));
    }

    public function test_product_detail_suggest_home_and_sitemap(): void
    {
        $p = $this->product(['name' => 'Rocket Ship', 'featured' => true, 'tags' => ['bestseller']]);
        $this->variant($p);
        $this->getJson("/api/products/{$p->slug}")->assertOk()->assertJsonPath('product.has_variants', true)->assertJsonCount(1, 'product.variants');
        $this->getJson('/api/products/no-such-toy')->assertNotFound();
        $this->getJson('/api/search/suggest?q=rock')->assertOk()->assertJsonPath('products.0.name', 'Rocket Ship');
        $this->getJson('/api/home')->assertOk()->assertJsonPath('featured.0.name', 'Rocket Ship')->assertJsonPath('bestseller.0.name', 'Rocket Ship');
        $this->getJson('/api/sitemap')->assertOk()->assertJsonPath('products.0.slug', $p->slug);
    }

    public function test_newsletter_and_back_in_stock_alert(): void
    {
        Mail::fake();
        $this->postJson('/api/newsletter', ['email' => 'fan@example.com'])->assertOk();
        $this->postJson('/api/newsletter', ['email' => 'fan@example.com'])->assertOk(); // duplicate is harmless
        $this->assertSame(1, DB::table('newsletter_subscribers')->count());
        Mail::assertSent(StoreMail::class, 1);

        $p = $this->product(['stock' => 0]);
        $this->postJson("/api/products/{$p->id}/stock-alert", ['email' => 'fan@example.com'])->assertOk();
        $in = $this->product(['stock' => 3]);
        $this->postJson("/api/products/{$in->id}/stock-alert", ['email' => 'fan@example.com'])->assertStatus(422);

        $this->actingAs($this->user('admin'), 'sanctum');
        $this->putJson("/api/admin/products/{$p->id}", ['name' => $p->name, 'sku' => $p->sku, 'category_id' => $this->cat->id, 'age_group' => '3-5', 'toy_type' => 'indoor', 'price' => 500, 'mrp' => 700, 'stock' => 5, 'description' => 'A toy', 'status' => 'published'])->assertOk();
        Mail::assertSent(StoreMail::class, fn ($m) => str_contains($m->subjectLine, 'back in stock'));
    }

    public function test_abandoned_cart_reminder_command(): void
    {
        Mail::fake();
        $u = $this->user();
        $p = $this->product();
        $this->actingAs($u, 'sanctum');
        $this->putJson('/api/account/cart', ['items' => [['id' => $p->id, 'qty' => 1]]])->assertOk();
        DB::table('carts')->update(['updated_at' => now()->subHours(5)]);
        $this->artisan('carts:remind')->assertSuccessful();
        Mail::assertSent(StoreMail::class, fn ($m) => str_contains($m->subjectLine, 'cart'));
        $this->artisan('carts:remind')->assertSuccessful();
        Mail::assertSent(StoreMail::class, 1); // only once per cart
    }
}

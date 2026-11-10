<?php

namespace Tests\Feature;

use App\Models\{Category, Product, ProductVariant, Setting, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class StoreTestCase extends TestCase
{
    use RefreshDatabase;

    protected Category $cat;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cat = Category::create(['slug' => 'soft-toys', 'name' => 'Soft Toys', 'short' => 'Soft Toys']);
        Setting::put('shipping', ['free_above' => 999, 'blocked_pins' => '', 'methods' => [
            ['id' => 'standard', 'label' => 'Standard', 'fee' => 79, 'days_min' => 3, 'days_max' => 7],
            ['id' => 'express', 'label' => 'Express', 'fee' => 149, 'days_min' => 1, 'days_max' => 3],
        ]]);
        Setting::put('store', ['name' => 'KHELZO', 'cod_enabled' => true, 'gst_rate' => 12]);
        config(['services.razorpay.key_id' => '', 'services.razorpay.key_secret' => '', 'services.razorpay.webhook_secret' => '']);
    }

    protected function product(array $o = []): Product
    {
        static $n = 0;
        $n++;
        return Product::create($o + [
            'sku' => "T-$n", 'slug' => "toy-$n", 'name' => "Toy $n", 'category_id' => $this->cat->id, 'age_group' => '3-5', 'toy_type' => 'indoor',
            'price' => 500, 'mrp' => 700, 'tax_rate' => 12, 'stock' => 10, 'description' => 'A toy', 'status' => 'published', 'tags' => [],
        ]);
    }

    protected function variant(Product $p, array $o = []): ProductVariant
    {
        static $n = 0;
        $n++;
        return $p->variants()->create($o + ['sku' => "V-$n", 'label' => "Size $n", 'price' => 500, 'mrp' => 700, 'stock' => 5, 'sort' => $n]);
    }

    protected function user(string $role = 'customer'): User
    {
        static $n = 0;
        $n++;
        return User::create(['name' => "User $n", 'email' => "u$n@example.com", 'password' => 'Passw0rd!x', 'role' => $role, 'phone' => '9876543210', 'is_active' => true]);
    }

    protected function payload(array $items, array $over = []): array
    {
        return array_merge([
            'items' => $items, 'delivery_method' => 'standard', 'payment_method' => 'cod',
            'customer' => ['name' => 'Asha Rao', 'email' => 'asha@example.com', 'phone' => '9876543210'],
            'address' => ['full_name' => 'Asha Rao', 'phone' => '9876543210', 'line1' => '12 MG Road', 'city' => 'Pune', 'state' => 'Maharashtra', 'pincode' => '411001', 'type' => 'home'],
        ], $over);
    }
}

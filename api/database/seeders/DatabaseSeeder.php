<?php

namespace Database\Seeders;

use App\Models\{Brand, Category, Coupon, Product, Setting, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(__DIR__ . '/catalog.json'), true);

        foreach ($data['categories'] as $i => $c) {
            Category::updateOrCreate(['slug' => $c['slug']], [
                'name' => $c['name'], 'short' => $c['short'], 'blurb' => $c['blurb'], 'image' => $c['image'],
                'bg' => $c['bg'], 'ink' => $c['ink'], 'accent' => $c['accent'], 'sort' => $i,
            ]);
        }

        // In-house KHELZO labels only; third-party brands are added by the admin when real partnerships exist.
        $brands = collect(['KHELZO', 'KHELZO Wood Works', 'KHELZO Labs', 'KHELZO Plush', 'KHELZO Racers'])
            ->mapWithKeys(fn ($n) => [$n => Brand::updateOrCreate(['slug' => Str::slug($n)], ['name' => $n])]);

        $brandFor = fn (array $p) => match (true) {
            str_contains(strtolower($p['name']), 'wooden') => 'KHELZO Wood Works',
            $p['category'] === 'soft-toys' => 'KHELZO Plush',
            in_array($p['category'], ['stem', 'puzzles-games', 'arts-crafts'], true) => 'KHELZO Labs',
            in_array($p['category'], ['remote-control', 'vehicles', 'outdoor'], true) => 'KHELZO Racers',
            default => 'KHELZO',
        };
        $material = fn (array $p) => match (true) {
            str_contains(strtolower($p['name']), 'wooden') => 'Responsibly sourced wood, non-toxic paint',
            $p['category'] === 'soft-toys' => 'Plush polyester fabric, hypoallergenic filling',
            in_array($p['category'], ['building', 'remote-control', 'stem', 'baby-toddler'], true) => 'BPA-free ABS plastic',
            default => 'Tin plate, ABS plastic and safe water-based finishes',
        };

        foreach ($data['products'] as $i => $p) {
            $stock = match ($p['id']) { 'p06' => 0, 'p16' => 3, default => 8 + (($i * 7) % 45) };
            $outdoor = $p['category'] === 'outdoor';
            $edu = in_array($p['category'], ['stem', 'puzzles-games', 'arts-crafts', 'musical'], true) || in_array('learning', $p['tags'], true);
            $product = Product::updateOrCreate(['sku' => 'KZ-' . strtoupper($p['id'])], [
                'slug' => Str::slug($p['name']),
                'name' => $p['name'],
                'category_id' => Category::where('slug', $p['category'])->value('id'),
                'brand_id' => $brands[$brandFor($p)]->id,
                'age_group' => $p['age'],
                'toy_type' => $outdoor ? 'outdoor' : ($edu ? 'educational' : 'indoor'),
                'price' => $p['price'], 'mrp' => $p['mrp'], 'tax_rate' => 12, 'stock' => $stock,
                'sold_count' => $p['reviews'] * 3, 'rating_avg' => $p['rating'], 'rating_count' => $p['reviews'],
                'badge' => $p['badge'] ?? null, 'tags' => $p['tags'],
                'description' => $p['desc'],
                'features' => ['Quality-checked and child-safe', 'Age-labelled for confident gifting', 'Bright, durable finish built for play', '7-day easy returns'],
                'box_contents' => [$p['name'], 'Quick-start guide'],
                'material' => $material($p),
                'dimensions' => $outdoor ? '60 × 30 × 35 cm' : '24 × 18 × 14 cm',
                'weight' => $outdoor ? '3.2 kg' : '650 g',
                'safety' => 'Tested for small-part and sharp-edge safety. Use under adult supervision for children under the recommended age. Not suitable for children under 3 years where small parts are present.',
                'status' => 'published', 'featured' => in_array('bestseller', $p['tags'], true),
            ]);
            $product->images()->delete();
            foreach ($p['images'] as $n => $url) {
                $product->images()->create(['url' => $url, 'sort' => $n]);
            }
            $product->attributes()->delete();
            $product->attributes()->createMany([
                ['name' => 'Age', 'value' => str_replace('-plus', '+', $p['age']) . ' years'],
                ['name' => 'Type', 'value' => ucfirst($product->toy_type)],
            ]);
        }

        $cat = fn ($s) => Category::where('slug', $s)->value('id');
        $coupons = [
            ['code' => 'WELCOME10', 'description' => '10% off your first order (up to ₹300)', 'type' => 'percent', 'value' => 10, 'max_discount' => 300, 'first_order_only' => true],
            ['code' => 'PLAY100', 'description' => '₹100 off orders above ₹999', 'type' => 'fixed', 'value' => 100, 'min_order' => 999],
            ['code' => 'FREESHIP', 'description' => 'Free shipping on any order', 'type' => 'free_shipping', 'value' => 0],
            ['code' => 'BEARS15', 'description' => '15% off soft toys', 'type' => 'percent', 'value' => 15, 'category_id' => $cat('soft-toys')],
        ];
        foreach ($coupons as $c) {
            Coupon::updateOrCreate(['code' => $c['code']], $c + ['active' => true]);
        }

        Setting::put('shipping', [
            'free_above' => 999,
            'methods' => [
                ['id' => 'standard', 'label' => 'Standard delivery', 'fee' => 79, 'days_min' => 3, 'days_max' => 7],
                ['id' => 'express', 'label' => 'Express delivery', 'fee' => 149, 'days_min' => 1, 'days_max' => 3],
            ],
        ]);
        Setting::put('store', ['name' => 'KHELZO', 'cod_enabled' => true, 'cod_fee' => 0, 'gst_rate' => 12, 'support_email' => 'hello@khelzo.example']);

        $adminPass = env('ADMIN_PASSWORD', 'ChangeMe!2026');
        User::updateOrCreate(['email' => 'admin@khelzo.local'], ['name' => 'KHELZO Admin', 'password' => $adminPass, 'role' => 'admin', 'phone' => '9000000000']);
        User::updateOrCreate(['email' => 'demo@khelzo.local'], ['name' => 'Demo Parent', 'password' => 'DemoPass!2026', 'role' => 'customer', 'phone' => '9111111111']);
    }
}

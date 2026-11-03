<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('phone', 20)->nullable()->after('email');
            $t->string('role', 20)->default('customer')->index()->after('password'); // customer | admin | manager
            $t->boolean('is_active')->default(true);
        });

        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->string('name');
            $t->string('short');
            $t->string('blurb')->nullable();
            $t->string('image')->nullable();
            $t->string('bg', 9)->default('#7657F6');
            $t->string('ink', 9)->default('#FFFFFF');
            $t->string('accent', 9)->default('#FFD84D');
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });

        Schema::create('brands', function (Blueprint $t) {
            $t->id();
            $t->string('slug')->unique();
            $t->string('name');
            $t->timestamps();
        });

        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->string('sku')->unique();
            $t->string('slug')->unique();
            $t->string('name');
            $t->foreignId('category_id')->constrained()->restrictOnDelete();
            $t->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $t->string('age_group', 10)->index(); // 0-2 | 3-5 | 6-8 | 9-12 | 13-plus
            $t->string('toy_type', 20)->default('indoor')->index(); // indoor | outdoor | educational
            $t->decimal('price', 10, 2);
            $t->decimal('mrp', 10, 2);
            $t->decimal('tax_rate', 5, 2)->default(12); // GST %, listed prices are tax-inclusive
            $t->unsignedInteger('stock')->default(0);
            $t->unsignedInteger('sold_count')->default(0);
            $t->decimal('rating_avg', 3, 2)->default(0);
            $t->unsignedInteger('rating_count')->default(0);
            $t->string('badge', 20)->nullable();
            $t->json('tags')->nullable();
            $t->text('description');
            $t->json('features')->nullable();
            $t->json('box_contents')->nullable();
            $t->string('material')->nullable();
            $t->string('dimensions')->nullable();
            $t->string('weight')->nullable();
            $t->text('safety')->nullable();
            $t->string('video_url')->nullable();
            $t->string('status', 12)->default('published')->index(); // published | draft | archived
            $t->boolean('featured')->default(false);
            $t->timestamps();
        });

        Schema::create('product_images', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('url');
            $t->unsignedSmallInteger('sort')->default(0);
        });

        Schema::create('product_attributes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('name');
            $t->string('value');
        });

        Schema::create('inventory_movements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->integer('change');
            $t->string('reason', 40); // order | cancel | restock | adjustment
            $t->string('reference')->nullable();
            $t->timestamps();
        });

        Schema::create('banners', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('subtitle')->nullable();
            $t->string('image')->nullable();
            $t->string('link')->nullable();
            $t->boolean('active')->default(true);
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });

        Schema::create('settings', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->json('value');
        });
    }

    public function down(): void
    {
        foreach (['settings', 'banners', 'inventory_movements', 'product_attributes', 'product_images', 'products', 'brands', 'categories'] as $tbl) {
            Schema::dropIfExists($tbl);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['phone', 'role', 'is_active']));
    }
};

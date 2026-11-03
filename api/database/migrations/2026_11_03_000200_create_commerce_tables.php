<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->string('coupon_code')->nullable();
            $t->timestamps();
        });
        Schema::create('cart_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('qty');
            $t->unique(['cart_id', 'product_id']);
        });
        Schema::create('wishlists', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->timestamps();
            $t->unique(['user_id', 'product_id']);
        });
        Schema::create('addresses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('full_name');
            $t->string('phone', 20);
            $t->string('line1');
            $t->string('line2')->nullable();
            $t->string('landmark')->nullable();
            $t->string('city');
            $t->string('state');
            $t->string('pincode', 6);
            $t->string('type', 10)->default('home'); // home | work | other
            $t->boolean('is_default')->default(false);
            $t->timestamps();
        });
        Schema::create('coupons', function (Blueprint $t) {
            $t->id();
            $t->string('code')->unique();
            $t->string('description')->nullable();
            $t->string('type', 16); // percent | fixed | free_shipping
            $t->decimal('value', 10, 2)->default(0);
            $t->decimal('max_discount', 10, 2)->nullable();
            $t->decimal('min_order', 10, 2)->default(0);
            $t->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $t->boolean('first_order_only')->default(false);
            $t->unsignedInteger('usage_limit')->nullable();
            $t->unsignedInteger('used_count')->default(0);
            $t->timestamp('starts_at')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->string('number')->unique();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('guest_token', 64)->nullable()->index(); // lets a guest view their own order
            $t->string('customer_name');
            $t->string('customer_email');
            $t->string('customer_phone', 20);
            $t->string('whatsapp', 20)->nullable();
            $t->json('shipping_address');
            $t->decimal('subtotal', 10, 2);
            $t->decimal('discount', 10, 2)->default(0);
            $t->decimal('shipping', 10, 2)->default(0);
            $t->decimal('tax_included', 10, 2)->default(0);
            $t->decimal('total', 10, 2);
            $t->string('coupon_code')->nullable();
            $t->string('delivery_method', 20)->default('standard');
            $t->text('instructions')->nullable();
            $t->date('estimated_delivery')->nullable();
            $t->string('payment_method', 20); // upi | card | netbanking | wallet | cod
            $t->string('payment_status', 20)->default('pending'); // pending | paid | failed | refunded | cod_due
            $t->string('status', 24)->default('pending_payment')->index();
            $t->timestamp('cancelled_at')->nullable();
            $t->timestamps();
        });
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $t->string('name');
            $t->string('sku');
            $t->string('image')->nullable();
            $t->decimal('unit_price', 10, 2);
            $t->unsignedSmallInteger('qty');
            $t->decimal('line_total', 10, 2);
        });
        Schema::create('order_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('status', 24);
            $t->string('note')->nullable();
            $t->timestamps();
        });
        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('provider', 20)->default('razorpay');
            $t->string('provider_order_id')->nullable()->index();
            $t->string('provider_payment_id')->nullable()->unique();
            $t->decimal('amount', 10, 2);
            $t->string('status', 20)->default('created'); // created | captured | failed
            $t->string('failure_reason')->nullable();
            $t->json('payload')->nullable();
            $t->timestamps();
        });
        Schema::create('shipments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->string('carrier')->nullable();
            $t->string('tracking_number')->nullable();
            $t->string('tracking_url')->nullable();
            $t->timestamps();
        });
        Schema::create('reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->foreignId('order_item_id')->unique()->constrained()->cascadeOnDelete(); // one review per purchase
            $t->unsignedTinyInteger('rating');
            $t->string('title')->nullable();
            $t->text('body')->nullable();
            $t->json('photos')->nullable();
            $t->string('status', 12)->default('approved'); // approved | pending | rejected
            $t->timestamps();
        });
        Schema::create('order_returns', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 10); // return | refund
            $t->text('reason');
            $t->string('status', 12)->default('requested'); // requested | approved | rejected | received | refunded
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['order_returns', 'reviews', 'shipments', 'payments', 'order_events', 'order_items', 'orders', 'coupons', 'addresses', 'wishlists', 'cart_items', 'carts'] as $tbl) {
            Schema::dropIfExists($tbl);
        }
    }
};

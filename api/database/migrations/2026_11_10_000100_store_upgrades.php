<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('sku', 60)->unique();
            $t->string('label', 120);               // e.g. "Red / Large"
            $t->decimal('price', 10, 2);
            $t->decimal('mrp', 10, 2);
            $t->unsignedInteger('stock')->default(0);
            $t->string('image')->nullable();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });

        Schema::table('order_items', function (Blueprint $t) {
            $t->unsignedBigInteger('variant_id')->nullable()->after('product_id');
            $t->string('variant_label', 120)->nullable()->after('variant_id');
        });

        // Keep an index on cart_id for the FK before the composite unique key is replaced.
        Schema::table('cart_items', function (Blueprint $t) {
            $t->index('cart_id', 'cart_items_cart_id_idx');
        });
        Schema::table('cart_items', function (Blueprint $t) {
            $t->dropUnique(['cart_id', 'product_id']);
            $t->unsignedBigInteger('variant_id')->nullable()->after('product_id');
        });

        Schema::table('carts', function (Blueprint $t) {
            $t->timestamp('reminded_at')->nullable();
        });

        Schema::table('orders', function (Blueprint $t) {
            $t->text('admin_note')->nullable();
            $t->string('refund_id')->nullable();
        });

        Schema::table('order_returns', function (Blueprint $t) {
            $t->text('admin_note')->nullable();
        });

        Schema::create('activity_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action', 60);
            $t->string('subject', 120)->nullable();
            $t->json('meta')->nullable();
            $t->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $t) {
            $t->id();
            $t->string('email')->unique();
            $t->timestamps();
        });

        Schema::create('stock_alerts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->string('email');
            $t->timestamp('notified_at')->nullable();
            $t->timestamps();
            $t->unique(['product_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('activity_logs');
        Schema::table('order_returns', fn (Blueprint $t) => $t->dropColumn('admin_note'));
        Schema::table('orders', fn (Blueprint $t) => $t->dropColumn(['admin_note', 'refund_id']));
        Schema::table('carts', fn (Blueprint $t) => $t->dropColumn('reminded_at'));
        Schema::table('cart_items', fn (Blueprint $t) => $t->dropColumn('variant_id'));
        Schema::table('order_items', fn (Blueprint $t) => $t->dropColumn(['variant_id', 'variant_label']));
        Schema::dropIfExists('product_variants');
    }
};

<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Release stock held by online orders that were never paid within 30 minutes.
Illuminate\Support\Facades\Schedule::call(function () {
    $svc = app(App\Services\OrderService::class);
    App\Models\Order::with('items')->whereIn('status', ['pending_payment', 'payment_failed'])
        ->where('created_at', '<', now()->subMinutes(30))->each(fn ($o) => $svc->cancel($o, 'Payment not completed in time'));
})->everyFiveMinutes()->name('expire-unpaid-orders');

// Abandoned-cart reminder: a signed-in shopper's saved cart untouched for 3+ hours gets one email.
Artisan::command('carts:remind', function () {
    $sent = 0;
    App\Models\Cart::with(['items', 'user'])->whereNull('reminded_at')->where('updated_at', '<', now()->subHours(3))->where('updated_at', '>', now()->subDays(3))
        ->whereHas('items')->whereHas('user')->each(function ($cart) use (&$sent) {
            $recentOrder = App\Models\Order::where('user_id', $cart->user_id)->where('created_at', '>', $cart->updated_at)->exists();
            if (! $recentOrder) { app(App\Services\Notifier::class)->abandonedCart($cart->user->email, $cart->user->name, $cart->items->sum('qty')); $sent++; }
            $cart->forceFill(['reminded_at' => now()])->saveQuietly();
        });
    $this->info("Reminders sent: $sent");
})->purpose('Email shoppers who left items in their cart');
Illuminate\Support\Facades\Schedule::command('carts:remind')->hourly();

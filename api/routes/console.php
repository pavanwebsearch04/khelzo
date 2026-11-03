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

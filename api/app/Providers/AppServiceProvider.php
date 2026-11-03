<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Reset emails link to the Next.js storefront, not a Laravel view.
        ResetPassword::createUrlUsing(fn ($user, string $token) => rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:3000')), '/')
            . '/account/reset-password?token=' . $token . '&email=' . urlencode($user->getEmailForPasswordReset()));
    }
}

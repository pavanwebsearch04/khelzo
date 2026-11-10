<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * PIN-code serviceability. With Shiprocket credentials configured it asks Shiprocket (cached for a day);
 * otherwise it applies the admin-managed block list (Settings → Shipping → unserviceable PINs / prefixes).
 */
class Courier
{
    public function configured(): bool
    {
        return filled(config('services.shiprocket.email')) && filled(config('services.shiprocket.password')) && filled(config('services.shiprocket.pickup_pincode'));
    }

    /** @return array{serviceable: bool, source: string, eta_days: ?int} */
    public function check(string $pin): array
    {
        $ship = Setting::get('shipping', []);
        foreach (array_filter(array_map('trim', explode(',', (string) ($ship['blocked_pins'] ?? '')))) as $rule) {
            if ($rule !== '' && str_starts_with($pin, $rule)) return ['serviceable' => false, 'source' => 'store', 'eta_days' => null];
        }
        if ($this->configured()) {
            try {
                return Cache::remember("courier:pin:$pin", now()->addDay(), fn () => $this->shiprocket($pin));
            } catch (\Throwable $e) {
                report($e); // fall back to "serviceable" rather than blocking sales on a courier outage
            }
        }
        return ['serviceable' => true, 'source' => 'store', 'eta_days' => null];
    }

    private function token(): string
    {
        return Cache::remember('shiprocket:token', now()->addHours(200), function () {
            $r = Http::acceptJson()->timeout(15)->post('https://apiv2.shiprocket.in/v1/external/auth/login', ['email' => config('services.shiprocket.email'), 'password' => config('services.shiprocket.password')]);
            abort_unless($r->successful() && $r->json('token'), 502, 'Courier login failed');
            return $r->json('token');
        });
    }

    private function shiprocket(string $pin): array
    {
        $r = Http::withToken($this->token())->acceptJson()->timeout(15)->get('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', [
            'pickup_postcode' => config('services.shiprocket.pickup_pincode'), 'delivery_postcode' => $pin, 'weight' => 1, 'cod' => 1,
        ]);
        abort_unless($r->successful(), 502, 'Courier lookup failed');
        $companies = $r->json('data.available_courier_companies', []);
        $eta = collect($companies)->pluck('estimated_delivery_days')->filter()->map(fn ($d) => (int) $d)->min();
        return ['serviceable' => ! empty($companies), 'source' => 'shiprocket', 'eta_days' => $eta];
    }
}

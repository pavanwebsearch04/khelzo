<?php

namespace App\Services;

use App\Models\{Coupon, Order, Product, Setting, User};
use Illuminate\Validation\ValidationException;

/**
 * Single source of truth for money. The browser never sends prices or discounts;
 * it sends product ids, quantities, a coupon code and a delivery method, and this class prices them.
 */
class Pricing
{
    /** @param array<int,array{id:int|string,qty:int}> $items */
    public function quote(array $items, ?string $couponCode, ?User $user, string $deliveryMethod = 'standard', bool $strictStock = false): array
    {
        $ids = collect($items)->pluck('id')->unique();
        $products = Product::published()->with(['images', 'category', 'variants'])->whereIn('id', $ids)->get()->keyBy('id');

        $lines = [];
        $issues = [];
        foreach ($items as $it) {
            $p = $products->get((int) $it['id']);
            if (! $p) { $issues[] = ['id' => (int) $it['id'], 'issue' => 'unavailable']; continue; }
            $qty = max(1, (int) $it['qty']);
            $variant = null;
            $vid = isset($it['variant_id']) && $it['variant_id'] !== null ? (int) $it['variant_id'] : null;
            if ($p->variants->isNotEmpty()) {
                $variant = $vid ? $p->variants->firstWhere('id', $vid) : null;
                if (! $variant) { $issues[] = ['id' => $p->id, 'variant_id' => $vid, 'issue' => 'variant_required', 'name' => $p->name]; continue; }
            }
            $stock = $variant ? (int) $variant->stock : (int) $p->stock;
            $name = $p->name . ($variant ? " ({$variant->label})" : '');
            if ($stock < 1) { $issues[] = ['id' => $p->id, 'variant_id' => $variant?->id, 'issue' => 'out_of_stock', 'name' => $name]; $qty = 0; }
            elseif ($qty > $stock) { $issues[] = ['id' => $p->id, 'variant_id' => $variant?->id, 'issue' => 'stock_limited', 'name' => $name, 'available' => $stock]; $qty = $stock; }
            if ($qty < 1) continue;
            $unit = (float) ($variant?->price ?? $p->price);
            $mrp = (float) ($variant?->mrp ?? $p->mrp);
            $key = $p->id . ':' . ($variant?->id ?? 0);
            if (isset($lines[$key])) { // same product+variant listed twice: merge, still capped by stock
                $merged = min($stock, $lines[$key]['qty'] + $qty);
                $lines[$key]['qty'] = $merged;
                $lines[$key]['total'] = round($unit * $merged, 2);
                continue;
            }
            $lines[$key] = ['product' => $p, 'variant' => $variant, 'qty' => $qty, 'unit' => $unit, 'mrp' => $mrp, 'total' => round($unit * $qty, 2)];
        }
        $lines = array_values($lines);
        if ($strictStock && $issues) {
            throw ValidationException::withMessages(['items' => 'Some items are unavailable or exceed available stock.']);
        }

        $subtotal = round(array_sum(array_column($lines, 'total')), 2);
        $mrpTotal = round(array_sum(array_map(fn ($l) => $l['mrp'] * $l['qty'], $lines)), 2);

        [$discount, $freeShipping, $couponInfo] = $this->coupon($couponCode, $lines, $subtotal, $user);

        $ship = Setting::get('shipping', ['free_above' => 999, 'methods' => [['id' => 'standard', 'label' => 'Standard delivery', 'fee' => 79, 'days_min' => 3, 'days_max' => 7]]]);
        $method = collect($ship['methods'])->firstWhere('id', $deliveryMethod) ?? $ship['methods'][0];
        $afterDiscount = max(0, $subtotal - $discount);
        $shipping = ($freeShipping || $afterDiscount >= $ship['free_above'] || ! $lines) ? 0.0 : (float) $method['fee'];
        // Express always costs its fee unless coupon grants free shipping.
        if ($method['id'] !== 'standard' && ! $freeShipping && $lines) $shipping = (float) $method['fee'];

        $total = round($afterDiscount + $shipping, 2);
        // Listed prices are GST-inclusive; report the tax component for the invoice.
        $tax = round(array_sum(array_map(fn ($l) => $l['total'] * $l['product']->tax_rate / (100 + $l['product']->tax_rate), $lines)), 2);

        return [
            'lines' => $lines, 'issues' => $issues, 'subtotal' => $subtotal, 'mrp_total' => $mrpTotal,
            'savings' => round(max(0, $mrpTotal - $subtotal) + $discount, 2),
            'discount' => $discount, 'coupon' => $couponInfo, 'shipping' => $shipping, 'tax_included' => $tax, 'total' => $total,
            'free_above' => (float) $ship['free_above'], 'method' => $method,
            'estimated_delivery' => now()->addDays((int) $method['days_max'])->toDateString(),
            'qty' => array_sum(array_column($lines, 'qty')),
        ];
    }

    private function coupon(?string $code, array $lines, float $subtotal, ?User $user): array
    {
        if (! $code) return [0.0, false, null];
        $c = Coupon::where('code', strtoupper(trim($code)))->first();
        $fail = fn (string $m) => throw ValidationException::withMessages(['coupon' => $m]);
        if (! $c || ! $c->active) $fail('This coupon code is not valid.');
        if ($c->starts_at && $c->starts_at->isFuture()) $fail('This coupon is not active yet.');
        if ($c->expires_at && $c->expires_at->isPast()) $fail('This coupon has expired.');
        if ($c->usage_limit !== null && $c->used_count >= $c->usage_limit) $fail('This coupon has been fully redeemed.');
        if ($c->first_order_only) {
            if (! $user) $fail('Log in to use this first-order coupon.');
            if (Order::where('user_id', $user->id)->whereNotIn('status', ['cancelled', 'payment_failed', 'pending_payment'])->exists()) $fail('This coupon is only for your first order.');
        }

        $eligible = array_filter($lines, fn ($l) => (! $c->category_id || $l['product']->category_id === $c->category_id) && (! $c->product_id || $l['product']->id === $c->product_id));
        if (! $eligible) $fail('This coupon does not apply to the items in your cart.');
        $base = round(array_sum(array_column($eligible, 'total')), 2);
        if ($subtotal < $c->min_order) $fail('Add ₹' . number_format($c->min_order - $subtotal) . ' more to use this coupon.');

        $discount = match ($c->type) {
            'percent' => min($base * $c->value / 100, $c->max_discount ?? INF),
            'fixed' => min($c->value, $base),
            default => 0,
        };
        return [round($discount, 2), $c->type === 'free_shipping', ['code' => $c->code, 'description' => $c->description, 'type' => $c->type]];
    }
}

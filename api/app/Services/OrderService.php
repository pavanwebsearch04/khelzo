<?php

namespace App\Services;

use App\Models\{Coupon, Order, OrderItem, Payment, Product, Setting, User};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private Pricing $pricing, private Razorpay $razorpay) {}

    public const FLOW = ['order_placed', 'payment_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

    /**
     * Creates the order and reserves stock atomically. Online orders stay "pending_payment" until Razorpay is verified.
     * @return array{order: Order, razorpay: ?array}
     */
    public function place(array $d, ?User $user): array
    {
        $online = $d['payment_method'] !== 'cod';
        $store = Setting::get('store', ['cod_enabled' => true]);
        if (! $online && empty($store['cod_enabled'])) {
            throw ValidationException::withMessages(['payment_method' => 'Cash on Delivery is currently unavailable.']);
        }
        if ($online && ! $this->razorpay->configured()) {
            abort(503, 'Online payments are not configured yet. Please choose Cash on Delivery or try again later.');
        }

        return DB::transaction(function () use ($d, $user, $online) {
            // Lock the rows so two buyers cannot both take the last unit.
            Product::whereIn('id', collect($d['items'])->pluck('id'))->lockForUpdate()->get();
            $q = $this->pricing->quote($d['items'], $d['coupon'] ?? null, $user, $d['delivery_method'], true);
            if (! $q['lines']) throw ValidationException::withMessages(['items' => 'Your cart is empty.']);

            $order = Order::create([
                'number' => $this->number(),
                'user_id' => $user?->id,
                'guest_token' => $user ? null : Str::random(40),
                'customer_name' => $d['customer']['name'], 'customer_email' => $d['customer']['email'],
                'customer_phone' => $d['customer']['phone'], 'whatsapp' => $d['customer']['whatsapp'] ?? null,
                'shipping_address' => $d['address'],
                'subtotal' => $q['subtotal'], 'discount' => $q['discount'], 'shipping' => $q['shipping'],
                'tax_included' => $q['tax_included'], 'total' => $q['total'],
                'coupon_code' => $q['coupon']['code'] ?? null,
                'delivery_method' => $q['method']['id'], 'instructions' => $d['instructions'] ?? null,
                'estimated_delivery' => $q['estimated_delivery'],
                'payment_method' => $d['payment_method'],
                'payment_status' => $online ? 'pending' : 'cod_due',
                'status' => $online ? 'pending_payment' : 'order_placed',
            ]);

            foreach ($q['lines'] as $l) {
                /** @var Product $p */
                $p = $l['product'];
                OrderItem::create([
                    'order_id' => $order->id, 'product_id' => $p->id, 'name' => $p->name, 'sku' => $p->sku,
                    'image' => $p->images->first()?->url, 'unit_price' => $l['unit'], 'qty' => $l['qty'], 'line_total' => $l['total'],
                ]);
                $p->decrement('stock', $l['qty']);
                $p->increment('sold_count', $l['qty']);
                DB::table('inventory_movements')->insert(['product_id' => $p->id, 'change' => -$l['qty'], 'reason' => 'order', 'reference' => $order->number, 'created_at' => now(), 'updated_at' => now()]);
            }
            if ($order->coupon_code) Coupon::where('code', $order->coupon_code)->increment('used_count');

            $rz = null;
            if ($online) {
                $ro = $this->razorpay->createOrder($order->number, $order->total, ['order' => $order->number]);
                Payment::create(['order_id' => $order->id, 'provider_order_id' => $ro['id'], 'amount' => $order->total, 'status' => 'created']);
                $rz = ['key_id' => $this->razorpay->keyId(), 'order_id' => $ro['id'], 'amount' => $ro['amount'], 'currency' => 'INR'];
            } else {
                $this->event($order, 'order_placed', 'Order placed. Pay on delivery.');
            }
            return ['order' => $order->load(['items', 'events']), 'razorpay' => $rz];
        });
    }

    /** Idempotent: safe to call from both the browser callback and the webhook. */
    public function markPaid(Order $order, string $razorpayOrderId, string $paymentId, array $payload = []): Order
    {
        return DB::transaction(function () use ($order, $razorpayOrderId, $paymentId, $payload) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            $payment = Payment::where('order_id', $order->id)->where('provider_order_id', $razorpayOrderId)->first();
            if (! $payment) abort(422, 'Payment does not belong to this order.');
            if ($payment->status === 'captured') return $order; // already processed

            $payment->update(['status' => 'captured', 'provider_payment_id' => $paymentId, 'payload' => $payload, 'failure_reason' => null]);
            if (in_array($order->status, ['pending_payment', 'payment_failed'], true)) {
                $order->update(['payment_status' => 'paid', 'status' => 'payment_confirmed']);
                $this->event($order, 'order_placed', 'Order placed.');
                $this->event($order, 'payment_confirmed', 'Payment received via Razorpay.');
            }
            return $order;
        });
    }

    public function markFailed(Order $order, string $razorpayOrderId, string $reason): void
    {
        $payment = Payment::where('order_id', $order->id)->where('provider_order_id', $razorpayOrderId)->first();
        if (! $payment || $payment->status === 'captured') return;
        $payment->update(['status' => 'failed', 'failure_reason' => Str::limit($reason, 250)]);
        if ($order->status === 'pending_payment') {
            $order->update(['payment_status' => 'failed', 'status' => 'payment_failed']);
            $this->event($order, 'payment_failed', Str::limit($reason, 120));
        }
    }

    /** New Razorpay order for an unpaid order so the customer can retry. */
    public function retry(Order $order): array
    {
        if (! in_array($order->status, ['pending_payment', 'payment_failed'], true)) abort(409, 'This order is not awaiting payment.');
        if (! $this->razorpay->configured()) abort(503, 'Online payments are not configured yet.');
        $ro = $this->razorpay->createOrder($order->number, $order->total, ['order' => $order->number]);
        Payment::create(['order_id' => $order->id, 'provider_order_id' => $ro['id'], 'amount' => $order->total, 'status' => 'created']);
        $order->update(['status' => 'pending_payment', 'payment_status' => 'pending']);
        return ['key_id' => $this->razorpay->keyId(), 'order_id' => $ro['id'], 'amount' => $ro['amount'], 'currency' => 'INR'];
    }

    public function cancel(Order $order, string $note = 'Cancelled'): Order
    {
        return DB::transaction(function () use ($order, $note) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            if ($order->status === 'cancelled') return $order;
            foreach ($order->items as $i) {
                if (! $i->product_id) continue;
                Product::whereKey($i->product_id)->increment('stock', $i->qty);
                Product::whereKey($i->product_id)->decrement('sold_count', min($i->qty, Product::whereKey($i->product_id)->value('sold_count')));
                DB::table('inventory_movements')->insert(['product_id' => $i->product_id, 'change' => $i->qty, 'reason' => 'cancel', 'reference' => $order->number, 'created_at' => now(), 'updated_at' => now()]);
            }
            if ($order->coupon_code) Coupon::where('code', $order->coupon_code)->where('used_count', '>', 0)->decrement('used_count');
            $order->update(['status' => 'cancelled', 'cancelled_at' => now(), 'payment_status' => $order->payment_status === 'paid' ? 'refunded' : $order->payment_status]);
            $this->event($order, 'cancelled', $note);
            return $order;
        });
    }

    public function event(Order $order, string $status, ?string $note = null): void
    {
        $order->events()->create(['status' => $status, 'note' => $note]);
    }

    private function number(): string
    {
        do { $n = 'KZ' . now()->format('ymd') . strtoupper(Str::random(5)); } while (Order::where('number', $n)->exists());
        return $n;
    }
}

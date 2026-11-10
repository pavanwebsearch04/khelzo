<?php

namespace App\Services;

use App\Models\{Coupon, Order, OrderItem, Payment, Product, ProductVariant, Setting, User};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private Pricing $pricing, private Razorpay $razorpay, private Notifier $notifier, private Courier $courier) {}

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

        if (! ($this->courier->check($d['address']['pincode'])['serviceable'] ?? true)) {
            throw ValidationException::withMessages(['address.pincode' => 'Sorry, we do not deliver to this PIN code yet.']);
        }

        $result = DB::transaction(function () use ($d, $user, $online) {
            // Lock the rows so two buyers cannot both take the last unit.
            $ids = collect($d['items'])->pluck('id');
            Product::whereIn('id', $ids)->lockForUpdate()->get();
            ProductVariant::whereIn('product_id', $ids)->lockForUpdate()->get();
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
                $v = $l['variant'] ?? null;
                OrderItem::create([
                    'order_id' => $order->id, 'product_id' => $p->id, 'variant_id' => $v?->id, 'variant_label' => $v?->label,
                    'name' => $p->name, 'sku' => $v?->sku ?? $p->sku,
                    'image' => $v?->image ?? $p->images->first()?->url, 'unit_price' => $l['unit'], 'qty' => $l['qty'], 'line_total' => $l['total'],
                ]);
                $v?->decrement('stock', $l['qty']);
                $p->decrement('stock', $l['qty']); // product stock is the sum of its variants
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

        if (! $online) $this->notifier->orderPlaced($result['order']); // online orders are emailed once payment is confirmed
        return $result;
    }

    /** Idempotent: safe to call from both the browser callback and the webhook. */
    public function markPaid(Order $order, string $razorpayOrderId, string $paymentId, array $payload = []): Order
    {
        $newlyPaid = false;
        $order = DB::transaction(function () use ($order, $razorpayOrderId, $paymentId, $payload, &$newlyPaid) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            $payment = Payment::where('order_id', $order->id)->where('provider_order_id', $razorpayOrderId)->first();
            if (! $payment) abort(422, 'Payment does not belong to this order.');
            if ($payment->status === 'captured') return $order; // already processed

            $payment->update(['status' => 'captured', 'provider_payment_id' => $paymentId, 'payload' => $payload, 'failure_reason' => null]);
            if (in_array($order->status, ['pending_payment', 'payment_failed'], true)) {
                $order->update(['payment_status' => 'paid', 'status' => 'payment_confirmed']);
                $this->event($order, 'order_placed', 'Order placed.');
                $this->event($order, 'payment_confirmed', 'Payment received via Razorpay.');
                $newlyPaid = true;
            }
            return $order;
        });
        if ($newlyPaid) $this->notifier->orderPlaced($order);
        return $order;
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

    /**
     * Refunds a captured online payment through Razorpay. Returns a short status note.
     * Never throws: a failed refund is recorded so staff can retry it from the admin order page.
     */
    public function refundPayment(Order $order, ?float $amount = null, string $reason = 'Refund'): string
    {
        if ($order->payment_method === 'cod') return 'no-online-payment';
        $payment = Payment::where('order_id', $order->id)->where('status', 'captured')->latest('id')->first();
        if (! $payment) return 'no-captured-payment';
        if (! $this->razorpay->configured()) return 'razorpay-not-configured';
        try {
            $rf = $this->razorpay->refund($payment->provider_payment_id, $amount ?? (float) $payment->amount, ['order' => $order->number, 'reason' => $reason]);
            $order->update(['refund_id' => $rf['id'] ?? null, 'payment_status' => 'refunded']);
            return 'refunded';
        } catch (\Throwable $e) {
            report($e);
            $order->update(['payment_status' => 'refund_pending']);
            $this->event($order, $order->status, 'Refund could not be processed automatically; staff will retry.');
            return 'failed';
        }
    }

    /** Emails shoppers who asked to be told when this product is back. */
    public function notifyBackInStock(int $productId): void
    {
        $p = Product::find($productId);
        if (! $p || $p->stock < 1) return;
        DB::table('stock_alerts')->where('product_id', $productId)->whereNull('notified_at')->orderBy('id')->each(function ($a) use ($p) {
            $this->notifier->backInStock($a->email, $p);
            DB::table('stock_alerts')->where('id', $a->id)->update(['notified_at' => now()]);
        });
    }

    public function cancel(Order $order, string $note = 'Cancelled'): Order
    {
        $wasCancelled = $order->status === 'cancelled';
        $order = DB::transaction(function () use ($order, $note) {
            $order = Order::whereKey($order->id)->lockForUpdate()->first();
            if ($order->status === 'cancelled') return $order;
            foreach ($order->items as $i) {
                if (! $i->product_id) continue;
                if ($i->variant_id) ProductVariant::whereKey($i->variant_id)->increment('stock', $i->qty);
                Product::whereKey($i->product_id)->increment('stock', $i->qty);
                Product::whereKey($i->product_id)->decrement('sold_count', min($i->qty, Product::whereKey($i->product_id)->value('sold_count')));
                DB::table('inventory_movements')->insert(['product_id' => $i->product_id, 'change' => $i->qty, 'reason' => 'cancel', 'reference' => $order->number, 'created_at' => now(), 'updated_at' => now()]);
            }
            if ($order->coupon_code) Coupon::where('code', $order->coupon_code)->where('used_count', '>', 0)->decrement('used_count');
            $order->update(['status' => 'cancelled', 'cancelled_at' => now()]);
            $this->event($order, 'cancelled', $note);
            return $order;
        });
        if ($wasCancelled) return $order;

        if ($order->payment_status === 'paid') {
            $result = $this->refundPayment($order, null, 'Order cancelled');
            if ($result !== 'refunded' && $order->payment_method !== 'cod') {
                $order->update(['payment_status' => 'refund_pending']);
                if ($result !== 'failed') $this->event($order, 'cancelled', 'Refund pending — to be issued by staff.');
            }
        }
        $this->notifier->orderStatus($order->fresh('items'), 'cancelled', $note);
        foreach ($order->items as $i) if ($i->product_id) $this->notifyBackInStock($i->product_id);
        return $order;
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

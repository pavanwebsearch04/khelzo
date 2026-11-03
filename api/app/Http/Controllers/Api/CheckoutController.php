<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Order, Payment};
use App\Services\{OrderService, Pricing, Razorpay};
use App\Support\Present;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function __construct(private Pricing $pricing, private OrderService $orders, private Razorpay $razorpay) {}

    private function quoteBody(Request $r): array
    {
        return $r->validate([
            'items' => 'required|array|min:1|max:50',
            'items.*.id' => 'required|integer',
            'items.*.qty' => 'required|integer|min:1|max:10',
            'coupon' => 'nullable|string|max:40',
            'delivery_method' => 'nullable|string|in:standard,express',
        ]);
    }

    private function serialize(array $q): array
    {
        return [
            'lines' => collect($q['lines'])->map(fn ($l) => ['id' => $l['product']->id, 'name' => $l['product']->name, 'slug' => $l['product']->slug, 'image' => $l['product']->images->first()?->url, 'qty' => $l['qty'], 'unit_price' => $l['unit'], 'mrp' => $l['mrp'], 'line_total' => $l['total'], 'stock' => $l['product']->stock])->values(),
            'issues' => $q['issues'], 'qty' => $q['qty'], 'subtotal' => $q['subtotal'], 'discount' => $q['discount'], 'coupon' => $q['coupon'],
            'shipping' => $q['shipping'], 'tax_included' => $q['tax_included'], 'total' => $q['total'], 'savings' => $q['savings'],
            'free_above' => $q['free_above'], 'estimated_delivery' => $q['estimated_delivery'], 'method' => $q['method'],
        ];
    }

    /** Server-side pricing for the cart, drawer and checkout summary. */
    public function quote(Request $r)
    {
        $d = $this->quoteBody($r);
        return $this->serialize($this->pricing->quote($d['items'], $d['coupon'] ?? null, Auth::guard('sanctum')->user(), $d['delivery_method'] ?? 'standard'));
    }

    public function place(Request $r)
    {
        $d = $r->validate([
            'items' => 'required|array|min:1|max:50', 'items.*.id' => 'required|integer', 'items.*.qty' => 'required|integer|min:1|max:10',
            'coupon' => 'nullable|string|max:40',
            'delivery_method' => 'required|in:standard,express',
            'payment_method' => 'required|in:upi,card,netbanking,wallet,cod',
            'instructions' => 'nullable|string|max:300',
            'customer.name' => 'required|string|max:120', 'customer.email' => 'required|email:rfc', 'customer.phone' => ['required', 'regex:/^[6-9][0-9]{9}$/'],
            'customer.whatsapp' => ['nullable', 'regex:/^[6-9][0-9]{9}$/'],
            'address.full_name' => 'required|string|max:120', 'address.phone' => ['required', 'regex:/^[6-9][0-9]{9}$/'],
            'address.line1' => 'required|string|max:200', 'address.line2' => 'nullable|string|max:200', 'address.landmark' => 'nullable|string|max:120',
            'address.city' => 'required|string|max:80', 'address.state' => 'required|string|max:80', 'address.pincode' => ['required', 'regex:/^[1-9][0-9]{5}$/'],
            'address.type' => 'required|in:home,work,other',
        ]);
        $user = Auth::guard('sanctum')->user();
        $res = $this->orders->place($d, $user);
        return response()->json([
            'order' => Present::order($res['order']),
            'guest_token' => $res['order']->guest_token,
            'razorpay' => $res['razorpay'],
        ], 201);
    }

    private function authorizedOrder(Request $r, string $number): Order
    {
        $o = Order::with(['items', 'events', 'shipment'])->where('number', $number)->firstOrFail();
        $u = Auth::guard('sanctum')->user();
        $token = (string) ($r->header('X-Guest-Token') ?? $r->input('guest_token'));
        $ok = ($u && ($o->user_id === $u->id || $u->isAdmin())) || ($o->guest_token && $token !== '' && hash_equals($o->guest_token, $token));
        abort_unless($ok, 404);
        return $o;
    }

    /** Called by the browser after Razorpay Checkout succeeds. The signature is verified here, never trusted from the client. */
    public function verify(Request $r)
    {
        $d = $r->validate([
            'order_number' => 'required|string', 'razorpay_order_id' => 'required|string',
            'razorpay_payment_id' => 'required|string', 'razorpay_signature' => 'required|string',
        ]);
        $order = $this->authorizedOrder($r, $d['order_number']);
        if (! $this->razorpay->verifyPayment($d['razorpay_order_id'], $d['razorpay_payment_id'], $d['razorpay_signature'])) {
            $this->orders->markFailed($order, $d['razorpay_order_id'], 'Signature verification failed');
            abort(422, 'Payment could not be verified.');
        }
        $order = $this->orders->markPaid($order, $d['razorpay_order_id'], $d['razorpay_payment_id']);
        return ['order' => Present::order($order->fresh(['items', 'events', 'shipment']))];
    }

    public function failed(Request $r)
    {
        $d = $r->validate(['order_number' => 'required|string', 'razorpay_order_id' => 'required|string', 'reason' => 'nullable|string|max:250']);
        $order = $this->authorizedOrder($r, $d['order_number']);
        $this->orders->markFailed($order, $d['razorpay_order_id'], $d['reason'] ?? 'Payment cancelled or failed');
        return ['order' => Present::order($order->fresh(['items', 'events', 'shipment']))];
    }

    public function retry(Request $r, string $number)
    {
        return ['razorpay' => $this->orders->retry($this->authorizedOrder($r, $number))];
    }

    /** Razorpay -> server webhook (signature verified against the raw body). */
    public function webhook(Request $r)
    {
        $raw = $r->getContent();
        if (! $this->razorpay->verifyWebhook($raw, (string) $r->header('X-Razorpay-Signature'))) {
            Log::warning('Razorpay webhook with invalid signature');
            return response()->json(['message' => 'Invalid signature'], 400);
        }
        $event = $r->input('event');
        $entity = $r->input('payload.payment.entity', []);
        $rzOrderId = $entity['order_id'] ?? null;
        $payment = $rzOrderId ? Payment::where('provider_order_id', $rzOrderId)->first() : null;
        if (! $payment) return ['ok' => true];
        $order = Order::find($payment->order_id);

        if (in_array($event, ['payment.captured', 'order.paid'], true) && isset($entity['id']) && (int) ($entity['amount'] ?? 0) === (int) round($order->total * 100)) {
            $this->orders->markPaid($order, $rzOrderId, $entity['id'], $entity);
        } elseif ($event === 'payment.failed') {
            $this->orders->markFailed($order, $rzOrderId, $entity['error_description'] ?? 'Payment failed');
        }
        return ['ok' => true];
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Address, Cart, Order, OrderItem, OrderReturn, Product, Review};
use App\Services\OrderService;
use App\Support\Present;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AccountController extends Controller
{
    /* ---------- Orders ---------- */
    public function orders(Request $r)
    {
        $rows = Order::with('items')->where('user_id', $r->user()->id)->where('status', '!=', 'pending_payment')->latest()->paginate(10);
        return ['data' => collect($rows->items())->map(fn ($o) => Present::order($o, false)), 'meta' => ['total' => $rows->total(), 'last_page' => $rows->lastPage()]];
    }

    public function order(Request $r, string $number)
    {
        $o = Order::with(['items', 'events', 'shipment', 'returns'])->where('user_id', $r->user()->id)->where('number', $number)->firstOrFail();
        $reviewed = Review::where('user_id', $r->user()->id)->whereIn('order_item_id', $o->items->pluck('id'))->pluck('order_item_id')->all();
        return Present::order($o) + ['reviewed_item_ids' => $reviewed, 'can_cancel' => $this->cancellable($o), 'can_return' => $this->returnable($o)];
    }

    private function cancellable(Order $o): bool
    {
        return in_array($o->status, ['pending_payment', 'payment_failed', 'order_placed', 'payment_confirmed', 'processing'], true);
    }

    private function returnable(Order $o): bool
    {
        return $o->status === 'delivered' && $o->events->firstWhere('status', 'delivered')?->created_at?->gt(now()->subDays(7)) && ! $o->returns->count();
    }

    public function cancel(Request $r, OrderService $svc, string $number)
    {
        $o = Order::with('items')->where('user_id', $r->user()->id)->where('number', $number)->firstOrFail();
        if (! $this->cancellable($o)) abort(409, 'This order can no longer be cancelled.');
        $svc->cancel($o, 'Cancelled by customer');
        return ['ok' => true];
    }

    public function requestReturn(Request $r, OrderService $svc, string $number)
    {
        $d = $r->validate(['type' => 'required|in:return,refund', 'reason' => 'required|string|min:5|max:500']);
        $o = Order::with(['events', 'returns'])->where('user_id', $r->user()->id)->where('number', $number)->firstOrFail();
        if (! $this->returnable($o)) abort(409, 'Returns are available for 7 days after delivery, once per order.');
        OrderReturn::create(['order_id' => $o->id, 'user_id' => $r->user()->id] + $d);
        $o->update(['status' => 'return_requested']);
        $svc->event($o, 'return_requested', ucfirst($d['type']) . ' requested');
        return ['ok' => true];
    }

    /* ---------- Addresses ---------- */
    private function addressRules(): array
    {
        return [
            'full_name' => 'required|string|max:120', 'phone' => ['required', 'regex:/^[6-9][0-9]{9}$/'],
            'line1' => 'required|string|max:200', 'line2' => 'nullable|string|max:200', 'landmark' => 'nullable|string|max:120',
            'city' => 'required|string|max:80', 'state' => 'required|string|max:80', 'pincode' => ['required', 'regex:/^[1-9][0-9]{5}$/'],
            'type' => 'required|in:home,work,other', 'is_default' => 'boolean',
        ];
    }

    public function addresses(Request $r)
    {
        return ['data' => $r->user()->addresses()->orderByDesc('is_default')->latest()->get()];
    }

    public function addressStore(Request $r)
    {
        $d = $r->validate($this->addressRules());
        $u = $r->user();
        if (! empty($d['is_default']) || ! $u->addresses()->exists()) {
            $u->addresses()->update(['is_default' => false]);
            $d['is_default'] = true;
        }
        return response()->json($u->addresses()->create($d), 201);
    }

    public function addressUpdate(Request $r, Address $address)
    {
        abort_unless($address->user_id === $r->user()->id, 404);
        $d = $r->validate($this->addressRules());
        if (! empty($d['is_default'])) $r->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        $address->update($d);
        return $address;
    }

    public function addressDestroy(Request $r, Address $address)
    {
        abort_unless($address->user_id === $r->user()->id, 404);
        $address->delete();
        return ['ok' => true];
    }

    /* ---------- Wishlist (guest list lives in the browser and is merged here on login) ---------- */
    public function wishlist(Request $r)
    {
        return ['ids' => $r->user()->wishlist()->pluck('products.id')];
    }

    public function wishlistSync(Request $r)
    {
        $d = $r->validate(['ids' => 'present|array|max:200', 'ids.*' => 'integer']);
        $valid = Product::published()->whereIn('id', $d['ids'])->pluck('id')->all();
        $r->user()->wishlist()->syncWithoutDetaching($valid);
        return ['ids' => $r->user()->wishlist()->pluck('products.id')];
    }

    public function wishlistToggle(Request $r, Product $product)
    {
        $r->user()->wishlist()->toggle($product->id);
        return ['ids' => $r->user()->wishlist()->pluck('products.id')];
    }

    /* ---------- Saved cart ---------- */
    public function cart(Request $r)
    {
        $c = Cart::with('items')->where('user_id', $r->user()->id)->first();
        return ['items' => $c ? $c->items->map(fn ($i) => ['id' => $i->product_id, 'qty' => $i->qty]) : [], 'coupon' => $c?->coupon_code];
    }

    public function cartSave(Request $r)
    {
        $d = $r->validate(['items' => 'present|array|max:50', 'items.*.id' => 'required|integer|exists:products,id', 'items.*.qty' => 'required|integer|min:1|max:10', 'coupon' => 'nullable|string|max:40']);
        DB::transaction(function () use ($r, $d) {
            $c = Cart::updateOrCreate(['user_id' => $r->user()->id], ['coupon_code' => $d['coupon'] ?? null]);
            $c->items()->delete();
            foreach ($d['items'] as $i) $c->items()->create(['product_id' => $i['id'], 'qty' => $i['qty']]);
        });
        return ['ok' => true];
    }

    /* ---------- Reviews ---------- */
    public function productReviews(Request $r, Product $product)
    {
        $rows = $product->reviews()->with('user:id,name')->where('status', 'approved')->latest()->paginate(10);
        return ['data' => collect($rows->items())->map(fn ($v) => ['id' => $v->id, 'name' => $v->user->name, 'rating' => $v->rating, 'title' => $v->title, 'body' => $v->body, 'photos' => $v->photos ?? [], 'date' => $v->created_at->toDateString(), 'verified' => true]), 'meta' => ['total' => $rows->total(), 'last_page' => $rows->lastPage()]];
    }

    /** Only buyers whose order was delivered can review, once per purchased line. */
    public function reviewStore(Request $r)
    {
        $d = $r->validate(['order_item_id' => 'required|integer', 'rating' => 'required|integer|min:1|max:5', 'title' => 'nullable|string|max:120', 'body' => 'nullable|string|max:2000', 'photos' => 'nullable|array|max:3', 'photos.*' => 'image|max:3072']);
        $item = OrderItem::with('order')->findOrFail($d['order_item_id']);
        abort_unless($item->order->user_id === $r->user()->id && $item->order->status === 'delivered' && $item->product_id, 403, 'Only delivered purchases can be reviewed.');
        if (Review::where('order_item_id', $item->id)->exists()) throw ValidationException::withMessages(['order_item_id' => 'You have already reviewed this purchase.']);
        $photos = collect($r->file('photos', []))->map(fn ($f) => '/storage/' . $f->store('reviews', 'public'))->all();
        $rev = Review::create(['user_id' => $r->user()->id, 'product_id' => $item->product_id, 'order_item_id' => $item->id, 'rating' => $d['rating'], 'title' => $d['title'] ?? null, 'body' => $d['body'] ?? null, 'photos' => $photos, 'status' => 'approved']);
        $this->refreshRating($item->product_id);
        return response()->json($rev, 201);
    }

    public function reviewUpdate(Request $r, Review $review)
    {
        abort_unless($review->user_id === $r->user()->id, 404);
        $d = $r->validate(['rating' => 'required|integer|min:1|max:5', 'title' => 'nullable|string|max:120', 'body' => 'nullable|string|max:2000']);
        $review->update($d);
        $this->refreshRating($review->product_id);
        return $review;
    }

    public function reviewDestroy(Request $r, Review $review)
    {
        abort_unless($review->user_id === $r->user()->id, 404);
        $pid = $review->product_id;
        $review->delete();
        $this->refreshRating($pid);
        return ['ok' => true];
    }

    public static function refreshRating(int $productId): void
    {
        $agg = Review::where('product_id', $productId)->where('status', 'approved')->selectRaw('avg(rating) a, count(*) c')->first();
        if ((int) $agg->c > 0) Product::whereKey($productId)->update(['rating_avg' => round($agg->a, 2), 'rating_count' => $agg->c]);
    }

    /** Items the customer can still review (delivered, not yet reviewed). */
    public function reviewable(Request $r)
    {
        $done = Review::where('user_id', $r->user()->id)->pluck('order_item_id');
        $items = OrderItem::with('order:id,number')->whereHas('order', fn ($q) => $q->where('user_id', $r->user()->id)->where('status', 'delivered'))->whereNotIn('id', $done)->whereNotNull('product_id')->get();
        return ['data' => $items->map(fn ($i) => ['order_item_id' => $i->id, 'product_id' => $i->product_id, 'name' => $i->name, 'image' => $i->image, 'order_number' => $i->order->number])];
    }
}

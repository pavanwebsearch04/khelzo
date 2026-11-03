<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Controller;
use App\Models\{Banner, Brand, Category, Coupon, Order, OrderReturn, Product, Review, Setting, Shipment, User};
use App\Services\OrderService;
use App\Support\Present;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    /* ---------- Dashboard ---------- */
    public function dashboard()
    {
        $paid = Order::whereIn('payment_status', ['paid', 'cod_due'])->whereNotIn('status', ['cancelled', 'payment_failed', 'pending_payment']);
        $days = collect(range(13, 0))->map(fn ($i) => now()->subDays($i)->toDateString());
        $byDay = (clone $paid)->where('created_at', '>=', now()->subDays(13)->startOfDay())->selectRaw('date(created_at) d, sum(total) revenue, count(*) orders')->groupBy('d')->get()->keyBy('d');
        return [
            'revenue' => (float) (clone $paid)->sum('total'),
            'orders' => Order::where('status', '!=', 'pending_payment')->count(),
            'pending' => Order::whereIn('status', ['order_placed', 'payment_confirmed', 'processing', 'packed'])->count(),
            'completed' => Order::where('status', 'delivered')->count(),
            'customers' => User::where('role', 'customer')->count(),
            'products' => Product::where('status', '!=', 'archived')->count(),
            'low_stock' => Product::where('status', '!=', 'archived')->where('stock', '<=', 5)->orderBy('stock')->limit(10)->get(['id', 'name', 'sku', 'stock']),
            'bestsellers' => Product::orderByDesc('sold_count')->limit(5)->get(['id', 'name', 'sold_count', 'price']),
            'recent_orders' => Order::where('status', '!=', 'pending_payment')->latest()->limit(8)->get()->map(fn ($o) => Present::order($o, false) + ['customer' => $o->customer_name]),
            'sales' => $days->map(fn ($d) => ['date' => $d, 'revenue' => (float) ($byDay[$d]->revenue ?? 0), 'orders' => (int) ($byDay[$d]->orders ?? 0)]),
        ];
    }

    /* ---------- Products ---------- */
    private function productRules(?Product $p = null): array
    {
        return [
            'name' => 'required|string|max:190',
            'sku' => ['required', 'string', 'max:60', Rule::unique('products', 'sku')->ignore($p?->id)],
            'category_id' => 'required|exists:categories,id', 'brand_id' => 'nullable|exists:brands,id',
            'age_group' => 'required|in:0-2,3-5,6-8,9-12,13-plus', 'toy_type' => 'required|in:indoor,outdoor,educational',
            'price' => 'required|numeric|min:1|max:1000000', 'mrp' => 'required|numeric|gte:price', 'tax_rate' => 'nullable|numeric|min:0|max:28',
            'stock' => 'required|integer|min:0|max:100000', 'badge' => 'nullable|in:New,Bestseller,Hot',
            'tags' => 'nullable|array', 'tags.*' => 'string|max:30', 'description' => 'required|string|max:5000',
            'features' => 'nullable|array', 'features.*' => 'string|max:200', 'box_contents' => 'nullable|array', 'box_contents.*' => 'string|max:200',
            'material' => 'nullable|string|max:190', 'dimensions' => 'nullable|string|max:100', 'weight' => 'nullable|string|max:60', 'safety' => 'nullable|string|max:1000',
            'video_url' => 'nullable|url|max:300', 'status' => 'required|in:published,draft,archived', 'featured' => 'boolean',
            'images' => 'nullable|array|max:10', 'images.*' => 'string|max:300',
        ];
    }

    public function products(Request $r)
    {
        $q = Product::with(['images', 'category', 'brand']);
        if ($s = $r->query('q')) $q->where(fn ($x) => $x->where('name', 'like', "%$s%")->orWhere('sku', 'like', "%$s%"));
        if ($st = $r->query('status')) $q->where('status', $st);
        if ($r->boolean('low_stock')) $q->where('stock', '<=', 5);
        $p = $q->latest('id')->paginate(20);
        return ['data' => collect($p->items())->map(fn ($x) => Present::product($x, true) + ['status' => $x->status, 'featured' => $x->featured, 'sold' => $x->sold_count]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    public function productStore(Request $r)
    {
        $d = $r->validate($this->productRules());
        $p = DB::transaction(fn () => $this->saveProduct(new Product(), $d));
        return response()->json(Present::product($p->fresh(['images', 'category', 'brand', 'attributes']), true), 201);
    }

    public function productUpdate(Request $r, Product $product)
    {
        $d = $r->validate($this->productRules($product));
        $before = $product->stock;
        DB::transaction(fn () => $this->saveProduct($product, $d));
        if ((int) $d['stock'] !== $before) {
            DB::table('inventory_movements')->insert(['product_id' => $product->id, 'change' => (int) $d['stock'] - $before, 'reason' => 'adjustment', 'reference' => 'admin:' . $r->user()->id, 'created_at' => now(), 'updated_at' => now()]);
        }
        return Present::product($product->fresh(['images', 'category', 'brand', 'attributes']), true);
    }

    private function saveProduct(Product $p, array $d): Product
    {
        $images = $d['images'] ?? null;
        unset($d['images']);
        $d['slug'] = $p->exists && $p->name === $d['name'] ? $p->slug : $this->uniqueSlug($d['name'], $p->id);
        $d['tax_rate'] = $d['tax_rate'] ?? 12;
        $p->fill($d)->save();
        if ($images !== null) {
            $p->images()->delete();
            foreach (array_values($images) as $i => $url) $p->images()->create(['url' => $url, 'sort' => $i]);
        }
        return $p;
    }

    private function uniqueSlug(string $name, ?int $ignore): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        for ($n = 2; Product::where('slug', $slug)->when($ignore, fn ($q) => $q->where('id', '!=', $ignore))->exists(); $n++) $slug = "$base-$n";
        return $slug;
    }

    /** Archive instead of hard delete so past orders keep their history. */
    public function productDestroy(Product $product)
    {
        $product->update(['status' => 'archived']);
        return ['ok' => true];
    }

    public function upload(Request $r)
    {
        $r->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        return ['url' => '/storage/' . $r->file('image')->store('products', 'public')];
    }

    /* ---------- Orders ---------- */
    public function orders(Request $r)
    {
        $q = Order::with('items')->where('status', '!=', 'pending_payment');
        if ($s = $r->query('q')) $q->where(fn ($x) => $x->where('number', 'like', "%$s%")->orWhere('customer_name', 'like', "%$s%")->orWhere('customer_email', 'like', "%$s%")->orWhere('customer_phone', 'like', "%$s%"));
        if ($st = $r->query('status')) $q->where('status', $st);
        $p = $q->latest()->paginate(20);
        return ['data' => collect($p->items())->map(fn ($o) => Present::order($o, false) + ['customer' => $o->customer_name]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    public function order(string $number)
    {
        return Present::order(Order::with(['items', 'events', 'shipment', 'returns'])->where('number', $number)->firstOrFail());
    }

    private const STATUSES = ['order_placed', 'payment_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'];

    public function orderStatus(Request $r, OrderService $svc, string $number)
    {
        $d = $r->validate(['status' => ['required', Rule::in(self::STATUSES)], 'note' => 'nullable|string|max:200']);
        $o = Order::with('items')->where('number', $number)->firstOrFail();
        if ($d['status'] === 'cancelled') {
            $svc->cancel($o, $d['note'] ?? 'Cancelled by store');
        } else {
            if ($o->status === 'cancelled') abort(409, 'A cancelled order cannot be reopened.');
            $o->update(['status' => $d['status'], 'payment_status' => match (true) {
                $d['status'] === 'delivered' && $o->payment_method === 'cod' => 'paid',
                $d['status'] === 'refunded' => 'refunded',
                default => $o->payment_status,
            }]);
            $svc->event($o, $d['status'], $d['note'] ?? null);
        }
        return $this->order($number);
    }

    public function orderTracking(Request $r, string $number)
    {
        $d = $r->validate(['carrier' => 'required|string|max:80', 'tracking_number' => 'required|string|max:80', 'tracking_url' => 'nullable|url|max:300']);
        $o = Order::where('number', $number)->firstOrFail();
        Shipment::updateOrCreate(['order_id' => $o->id], $d);
        return $this->order($number);
    }

    public function returns()
    {
        return ['data' => OrderReturn::with('order:id,number,total,customer_name')->latest()->limit(100)->get()->map(fn ($x) => ['id' => $x->id, 'type' => $x->type, 'reason' => $x->reason, 'status' => $x->status, 'order' => $x->order->number, 'customer' => $x->order->customer_name, 'total' => $x->order->total])];
    }

    public function returnUpdate(Request $r, OrderService $svc, OrderReturn $return)
    {
        $d = $r->validate(['status' => 'required|in:approved,rejected,received,refunded']);
        $return->update($d);
        $o = $return->order;
        if ($d['status'] === 'refunded') {
            $o->update(['status' => 'refunded', 'payment_status' => 'refunded']);
            $svc->event($o, 'refunded', 'Refund processed. (Issue the Razorpay refund from the Razorpay dashboard.)');
        } elseif ($d['status'] === 'received') {
            $o->update(['status' => 'returned']);
            $svc->event($o, 'returned', 'Return received');
        }
        return ['ok' => true];
    }

    /* ---------- Customers ---------- */
    public function customers(Request $r)
    {
        $q = User::where('role', 'customer')->withCount('orders')->withSum(['orders as spent' => fn ($o) => $o->whereNotIn('status', ['cancelled', 'payment_failed', 'pending_payment'])], 'total');
        if ($s = $r->query('q')) $q->where(fn ($x) => $x->where('name', 'like', "%$s%")->orWhere('email', 'like', "%$s%")->orWhere('phone', 'like', "%$s%"));
        $p = $q->latest()->paginate(20);
        return ['data' => collect($p->items())->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'is_active' => $u->is_active, 'orders' => $u->orders_count, 'spent' => (float) $u->spent, 'joined' => $u->created_at->toDateString()]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    public function customer(User $user)
    {
        abort_if($user->isAdmin(), 404);
        return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'phone' => $user->phone, 'is_active' => $user->is_active, 'orders' => $user->orders()->latest()->limit(50)->get()->map(fn ($o) => Present::order($o, false))];
    }

    public function customerUpdate(Request $r, User $user)
    {
        abort_if($user->isAdmin(), 404);
        $d = $r->validate(['is_active' => 'required|boolean']);
        $user->update($d);
        if (! $d['is_active']) $user->tokens()->delete();
        return ['ok' => true];
    }

    /* ---------- Simple CRUD: categories, brands, coupons, banners ---------- */
    public function categories() { return ['data' => Category::orderBy('sort')->withCount('products')->get()]; }
    public function categoryStore(Request $r) { return response()->json($this->saveCategory(new Category(), $r), 201); }
    public function categoryUpdate(Request $r, Category $category) { return $this->saveCategory($category, $r); }

    private function saveCategory(Category $c, Request $r): Category
    {
        $d = $r->validate(['name' => 'required|string|max:120', 'short' => 'required|string|max:60', 'blurb' => 'nullable|string|max:200', 'image' => 'nullable|string|max:300', 'bg' => 'nullable|string|max:9', 'ink' => 'nullable|string|max:9', 'accent' => 'nullable|string|max:9', 'sort' => 'nullable|integer']);
        if (! $c->exists) $d['slug'] = Str::slug($d['name']);
        $c->fill($d)->save();
        return $c;
    }

    public function categoryDestroy(Category $category)
    {
        abort_if($category->products()->exists(), 409, 'Move or archive this category\'s products first.');
        $category->delete();
        return ['ok' => true];
    }

    public function brands() { return ['data' => Brand::orderBy('name')->withCount('products')->get()]; }
    public function brandStore(Request $r)
    {
        $d = $r->validate(['name' => 'required|string|max:120|unique:brands,name']);
        return response()->json(Brand::create($d + ['slug' => Str::slug($d['name'])]), 201);
    }
    public function brandUpdate(Request $r, Brand $brand)
    {
        $brand->update($r->validate(['name' => ['required', 'string', 'max:120', Rule::unique('brands', 'name')->ignore($brand->id)]]));
        return $brand;
    }
    public function brandDestroy(Brand $brand) { $brand->delete(); return ['ok' => true]; }

    private function couponRules(?Coupon $c = null): array
    {
        return [
            'code' => ['required', 'string', 'max:40', 'alpha_dash', Rule::unique('coupons', 'code')->ignore($c?->id)], 'description' => 'nullable|string|max:200',
            'type' => 'required|in:percent,fixed,free_shipping', 'value' => 'required_unless:type,free_shipping|nullable|numeric|min:0|max:100000',
            'max_discount' => 'nullable|numeric|min:0', 'min_order' => 'nullable|numeric|min:0',
            'category_id' => 'nullable|exists:categories,id', 'product_id' => 'nullable|exists:products,id', 'first_order_only' => 'boolean',
            'usage_limit' => 'nullable|integer|min:1', 'starts_at' => 'nullable|date', 'expires_at' => 'nullable|date|after:starts_at', 'active' => 'boolean',
        ];
    }
    public function coupons() { return ['data' => Coupon::latest()->get()]; }
    public function couponStore(Request $r)
    {
        $d = $r->validate($this->couponRules());
        if (($d['type'] ?? '') === 'percent' && ($d['value'] ?? 0) > 100) abort(422, 'Percentage cannot exceed 100.');
        $d['code'] = strtoupper($d['code']);
        return response()->json(Coupon::create($d), 201);
    }
    public function couponUpdate(Request $r, Coupon $coupon)
    {
        $d = $r->validate($this->couponRules($coupon));
        $d['code'] = strtoupper($d['code']);
        $coupon->update($d);
        return $coupon;
    }
    public function couponDestroy(Coupon $coupon) { $coupon->delete(); return ['ok' => true]; }

    public function banners() { return ['data' => Banner::orderBy('sort')->get()]; }
    public function bannerStore(Request $r) { return response()->json(Banner::create($this->bannerData($r)), 201); }
    public function bannerUpdate(Request $r, Banner $banner) { $banner->update($this->bannerData($r)); return $banner; }
    public function bannerDestroy(Banner $banner) { $banner->delete(); return ['ok' => true]; }
    private function bannerData(Request $r): array
    {
        return $r->validate(['title' => 'required|string|max:120', 'subtitle' => 'nullable|string|max:200', 'image' => 'nullable|string|max:300', 'link' => 'nullable|string|max:300', 'active' => 'boolean', 'sort' => 'nullable|integer']);
    }

    /* ---------- Reviews moderation ---------- */
    public function reviews()
    {
        return ['data' => Review::with(['user:id,name', 'product:id,name'])->latest()->limit(100)->get()->map(fn ($v) => ['id' => $v->id, 'product' => $v->product->name, 'customer' => $v->user->name, 'rating' => $v->rating, 'title' => $v->title, 'body' => $v->body, 'status' => $v->status, 'date' => $v->created_at->toDateString()])];
    }
    public function reviewUpdate(Request $r, Review $review)
    {
        $review->update($r->validate(['status' => 'required|in:approved,pending,rejected']));
        AccountController::refreshRating($review->product_id);
        return ['ok' => true];
    }
    public function reviewDestroy(Review $review)
    {
        $pid = $review->product_id;
        $review->delete();
        AccountController::refreshRating($pid);
        return ['ok' => true];
    }

    /* ---------- Settings (shipping, tax, store) ---------- */
    public function settings()
    {
        return ['shipping' => Setting::get('shipping'), 'store' => Setting::get('store')];
    }

    public function settingsUpdate(Request $r)
    {
        $d = $r->validate([
            'shipping.free_above' => 'required|numeric|min:0',
            'shipping.methods' => 'required|array|min:1', 'shipping.methods.*.id' => 'required|in:standard,express', 'shipping.methods.*.label' => 'required|string|max:60',
            'shipping.methods.*.fee' => 'required|numeric|min:0', 'shipping.methods.*.days_min' => 'required|integer|min:0', 'shipping.methods.*.days_max' => 'required|integer|min:1',
            'store.cod_enabled' => 'required|boolean', 'store.cod_fee' => 'nullable|numeric|min:0', 'store.gst_rate' => 'required|numeric|min:0|max:28', 'store.support_email' => 'nullable|email',
        ]);
        Setting::put('shipping', $d['shipping']);
        Setting::put('store', array_merge(Setting::get('store', []), $d['store']));
        return $this->settings();
    }
}

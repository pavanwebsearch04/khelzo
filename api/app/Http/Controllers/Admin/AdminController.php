<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Controller;
use App\Models\{ActivityLog, Banner, Brand, Category, Coupon, Order, OrderReturn, Product, ProductVariant, Review, Setting, Shipment, User};
use App\Services\{Notifier, OrderService};
use App\Support\Present;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /** Managers run the shop day to day; only admins change money, access and store-wide settings. */
    private function adminOnly(Request $r): void
    {
        abort_unless($r->user()->role === 'admin', 403, 'Only an admin can do this.');
    }

    private function log(Request $r, string $action, ?string $subject = null, array $meta = []): void
    {
        ActivityLog::record($r->user(), $action, $subject, $meta);
    }

    private function lowStockAt(): int
    {
        return (int) (Setting::get('store', [])['low_stock_threshold'] ?? 5);
    }

    /* ---------- Dashboard ---------- */
    public function dashboard()
    {
        $paid = Order::whereIn('payment_status', ['paid', 'cod_due'])->whereNotIn('status', ['cancelled', 'payment_failed', 'pending_payment']);
        $days = collect(range(13, 0))->map(fn ($i) => now()->subDays($i)->toDateString());
        $byDay = (clone $paid)->where('created_at', '>=', now()->subDays(13)->startOfDay())->selectRaw('date(created_at) d, sum(total) revenue, count(*) orders')->groupBy('d')->get()->keyBy('d');
        $byCategory = DB::table('order_items')->join('orders', 'orders.id', '=', 'order_items.order_id')->join('products', 'products.id', '=', 'order_items.product_id')->join('categories', 'categories.id', '=', 'products.category_id')
            ->whereNotIn('orders.status', ['cancelled', 'payment_failed', 'pending_payment'])
            ->selectRaw('categories.short as name, sum(order_items.line_total) as revenue, sum(order_items.qty) as units')->groupBy('categories.short')->orderByDesc('revenue')->limit(8)->get();
        $topCustomers = Order::whereNotIn('status', ['cancelled', 'payment_failed', 'pending_payment'])->whereNotNull('user_id')
            ->selectRaw('user_id, customer_name, sum(total) as spent, count(*) as orders')->groupBy('user_id', 'customer_name')->orderByDesc('spent')->limit(5)->get();
        $thr = $this->lowStockAt();
        return [
            'categories_sales' => $byCategory, 'top_customers' => $topCustomers,
            'pending_reviews' => Review::where('status', 'pending')->count(), 'pending_returns' => OrderReturn::where('status', 'requested')->count(),
            'refund_pending' => Order::where('payment_status', 'refund_pending')->count(),
            'revenue' => (float) (clone $paid)->sum('total'),
            'orders' => Order::where('status', '!=', 'pending_payment')->count(),
            'pending' => Order::whereIn('status', ['order_placed', 'payment_confirmed', 'processing', 'packed'])->count(),
            'completed' => Order::where('status', 'delivered')->count(),
            'customers' => User::where('role', 'customer')->count(),
            'products' => Product::where('status', '!=', 'archived')->count(),
            'low_stock_threshold' => $thr,
            'low_stock' => Product::where('status', '!=', 'archived')->where('stock', '<=', $thr)->orderBy('stock')->limit(10)->get(['id', 'name', 'sku', 'stock']),
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
            'variants' => 'nullable|array|max:40', 'variants.*.id' => 'nullable|integer',
            'variants.*.sku' => 'required|string|max:60', 'variants.*.label' => 'required|string|max:120',
            'variants.*.price' => 'required|numeric|min:1|max:1000000', 'variants.*.mrp' => 'required|numeric|gte:variants.*.price',
            'variants.*.stock' => 'required|integer|min:0|max:100000', 'variants.*.image' => 'nullable|string|max:300',
        ];
    }

    public function products(Request $r)
    {
        $q = Product::with(['images', 'category', 'brand', 'variants']);
        if ($s = $r->query('q')) $q->where(fn ($x) => $x->where('name', 'like', "%$s%")->orWhere('sku', 'like', "%$s%"));
        if ($st = $r->query('status')) $q->where('status', $st);
        if ($r->boolean('low_stock')) $q->where('stock', '<=', $this->lowStockAt());
        if ($r->boolean('featured')) $q->where('featured', true);
        $p = $q->latest('id')->paginate((int) min(100, max(1, (int) $r->query('per_page', 20))));
        return ['data' => collect($p->items())->map(fn ($x) => Present::product($x, true) + ['status' => $x->status, 'featured' => $x->featured, 'sold' => $x->sold_count, 'category_id' => $x->category_id, 'brand_id' => $x->brand_id]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    public function productStore(Request $r)
    {
        $d = $r->validate($this->productRules());
        $this->assertUniqueVariantSkus($d['variants'] ?? [], null);
        $p = DB::transaction(fn () => $this->saveProduct(new Product(), $d));
        $this->log($r, 'product.create', $p->sku);
        return response()->json(Present::product($p->fresh(['images', 'category', 'brand', 'attributes', 'variants']), true), 201);
    }

    public function productUpdate(Request $r, Product $product, OrderService $svc)
    {
        $d = $r->validate($this->productRules($product));
        $this->assertUniqueVariantSkus($d['variants'] ?? [], $product);
        $before = $product->stock;
        DB::transaction(fn () => $this->saveProduct($product, $d));
        $now = (int) $product->fresh()->stock;
        if ($now !== $before) {
            DB::table('inventory_movements')->insert(['product_id' => $product->id, 'change' => $now - $before, 'reason' => 'adjustment', 'reference' => 'admin:' . $r->user()->id, 'created_at' => now(), 'updated_at' => now()]);
            if ($before < 1 && $now > 0) $svc->notifyBackInStock($product->id);
        }
        $this->log($r, 'product.update', $product->sku);
        return Present::product($product->fresh(['images', 'category', 'brand', 'attributes', 'variants']), true);
    }

    private function assertUniqueVariantSkus(array $variants, ?Product $p): void
    {
        $skus = array_column($variants, 'sku');
        abort_if(count($skus) !== count(array_unique($skus)), 422, 'Variant SKUs must be unique.');
        foreach ($variants as $v) {
            $clash = ProductVariant::where('sku', $v['sku'])->when($p, fn ($q) => $q->where('product_id', '!=', $p->id))->exists()
                || Product::where('sku', $v['sku'])->when($p, fn ($q) => $q->where('id', '!=', $p->id))->exists();
            abort_if($clash, 422, "SKU {$v['sku']} is already used.");
        }
    }

    private function saveProduct(Product $p, array $d): Product
    {
        $images = $d['images'] ?? null;
        $variants = $d['variants'] ?? null;
        unset($d['images'], $d['variants']);
        $d['slug'] = $p->exists && $p->name === $d['name'] ? $p->slug : $this->uniqueSlug($d['name'], $p->id);
        $d['tax_rate'] = $d['tax_rate'] ?? 12;
        if (! empty($variants)) { // the product card shows the cheapest variant; stock is the sum of all variants
            $cheapest = collect($variants)->sortBy('price')->first();
            $d['price'] = $cheapest['price'];
            $d['mrp'] = $cheapest['mrp'];
            $d['stock'] = (int) collect($variants)->sum('stock');
        }
        $p->fill($d)->save();
        if ($images !== null) {
            $p->images()->delete();
            foreach (array_values($images) as $i => $url) $p->images()->create(['url' => $url, 'sort' => $i]);
        }
        if ($variants !== null) {
            $keep = [];
            foreach (array_values($variants) as $i => $v) {
                $row = ['sku' => $v['sku'], 'label' => $v['label'], 'price' => $v['price'], 'mrp' => $v['mrp'], 'stock' => $v['stock'], 'image' => $v['image'] ?? null, 'sort' => $i];
                $existing = ! empty($v['id']) ? $p->variants()->whereKey($v['id'])->first() : null;
                if ($existing) { $existing->update($row); $keep[] = $existing->id; } else { $keep[] = $p->variants()->create($row)->id; }
            }
            $p->variants()->whereNotIn('id', $keep)->delete();
        }
        return $p;
    }

    /** Publish / unpublish / archive / feature / set stock for many products at once. */
    public function productsBulk(Request $r)
    {
        $d = $r->validate(['ids' => 'required|array|min:1|max:200', 'ids.*' => 'integer', 'action' => 'required|in:publish,unpublish,archive,feature,unfeature,set_stock,set_category', 'value' => 'nullable|integer|min:0|max:100000']);
        $q = Product::whereIn('id', $d['ids']);
        $n = match ($d['action']) {
            'publish' => $q->update(['status' => 'published']),
            'unpublish' => $q->update(['status' => 'draft']),
            'archive' => $q->update(['status' => 'archived']),
            'feature' => $q->update(['featured' => true]),
            'unfeature' => $q->update(['featured' => false]),
            'set_category' => ($d['value'] ?? null) && Category::whereKey($d['value'])->exists() ? $q->update(['category_id' => $d['value']]) : abort(422, 'Pick a valid category.'),
            'set_stock' => (function () use ($d, $q) {
                abort_if(! isset($d['value']), 422, 'Enter the stock value.');
                $c = 0;
                foreach ($q->doesntHave('variants')->get() as $p) { // variant products are edited per variant
                    DB::table('inventory_movements')->insert(['product_id' => $p->id, 'change' => $d['value'] - $p->stock, 'reason' => 'adjustment', 'reference' => 'bulk', 'created_at' => now(), 'updated_at' => now()]);
                    $p->update(['stock' => $d['value']]); $c++;
                }
                return $c;
            })(),
        };
        $this->log($r, 'product.bulk', $d['action'], ['count' => $n, 'ids' => $d['ids']]);
        return ['updated' => $n];
    }

    public function productsExport(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['sku', 'name', 'category_slug', 'brand', 'age_group', 'toy_type', 'price', 'mrp', 'stock', 'tax_rate', 'status', 'tags', 'description']);
            Product::with(['category', 'brand'])->orderBy('id')->chunk(200, function ($rows) use ($out) {
                foreach ($rows as $p) fputcsv($out, [$p->sku, $p->name, $p->category?->slug, $p->brand?->name, $p->age_group, $p->toy_type, $p->price, $p->mrp, $p->stock, $p->tax_rate, $p->status, implode('|', $p->tags ?? []), $p->description]);
            });
            fclose($out);
        }, 'khelzo-products.csv', ['Content-Type' => 'text/csv']);
    }

    /** CSV columns: sku,name,category_slug,brand,age_group,toy_type,price,mrp,stock,tax_rate,status,tags,description. Existing SKUs are updated. */
    public function productsImport(Request $r)
    {
        $r->validate(['file' => 'required|file|mimes:csv,txt|max:2048']);
        $fh = fopen($r->file('file')->getRealPath(), 'r');
        $head = array_map(fn ($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h))), (array) fgetcsv($fh));
        foreach (['sku', 'name', 'category_slug', 'price', 'mrp', 'stock'] as $need) abort_unless(in_array($need, $head, true), 422, "CSV is missing the '$need' column.");
        $created = $updated = 0;
        $errors = [];
        $line = 1;
        while (($row = fgetcsv($fh)) !== false) {
            $line++;
            if (! array_filter($row)) continue;
            $x = array_combine($head, array_pad(array_slice($row, 0, count($head)), count($head), null));
            $x += ['brand' => null, 'age_group' => null, 'toy_type' => null, 'tax_rate' => null, 'status' => null, 'tags' => null, 'description' => null]; // optional columns
            $x['tax_rate'] = ($x['tax_rate'] === null || $x['tax_rate'] === '') ? null : $x['tax_rate'];
            $cat =Category::where('slug', $x['category_slug'] ?? '')->first();
            $brand = ! empty($x['brand']) ? Brand::firstOrCreate(['slug' => Str::slug($x['brand'])], ['name' => $x['brand']]) : null;
            $v = validator($x, ['sku' => 'required|max:60', 'name' => 'required|max:190', 'price' => 'required|numeric|min:1', 'mrp' => 'required|numeric|gte:price', 'stock' => 'required|integer|min:0',
                'age_group' => 'nullable|in:0-2,3-5,6-8,9-12,13-plus', 'toy_type' => 'nullable|in:indoor,outdoor,educational', 'status' => 'nullable|in:published,draft,archived']);
            if (! $cat || $v->fails()) { $errors[] = "Line $line: " . (! $cat ? 'unknown category_slug' : $v->errors()->first()); continue; }
            $p = Product::firstOrNew(['sku' => $x['sku']]);
            $isNew = ! $p->exists;
            $p->fill([
                'name' => $x['name'], 'category_id' => $cat->id, 'brand_id' => $brand?->id, 'age_group' => $x['age_group'] ?: ($p->age_group ?? '3-5'), 'toy_type' => $x['toy_type'] ?: ($p->toy_type ?? 'indoor'),
                'price' => $x['price'], 'mrp' => $x['mrp'], 'stock' => $x['stock'], 'tax_rate' => $x['tax_rate'] ?? ($p->tax_rate ?? 12), 'status' => $x['status'] ?: ($p->status ?? 'draft'),
                'tags' => ! empty($x['tags']) ? array_values(array_filter(explode('|', $x['tags']))) : ($p->tags ?? []), 'description' => $x['description'] ?: ($p->description ?? $x['name']),
            ]);
            $p->slug = $isNew ? $this->uniqueSlug($x['name'], null) : $p->slug;
            $p->save();
            $isNew ? $created++ : $updated++;
        }
        fclose($fh);
        $this->log($r, 'product.import', null, compact('created', 'updated'));
        return ['created' => $created, 'updated' => $updated, 'errors' => $errors];
    }

    public function inventory(Request $r)
    {
        $q = DB::table('inventory_movements')->join('products', 'products.id', '=', 'inventory_movements.product_id')
            ->select('inventory_movements.*', 'products.name', 'products.sku')->orderByDesc('inventory_movements.id');
        if ($pid = $r->query('product_id')) $q->where('inventory_movements.product_id', (int) $pid);
        $p = $q->paginate(30);
        return ['data' => $p->items(), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    private function uniqueSlug(string $name, ?int $ignore): string
    {
        $base = Str::slug($name) ?: 'product';
        $slug = $base;
        for ($n = 2; Product::where('slug', $slug)->when($ignore, fn ($q) => $q->where('id', '!=', $ignore))->exists(); $n++) $slug = "$base-$n";
        return $slug;
    }

    /** Archive instead of hard delete so past orders keep their history. */
    public function productDestroy(Request $r, Product $product)
    {
        $product->update(['status' => 'archived']);
        $this->log($r, 'product.archive', $product->sku);
        return ['ok' => true];
    }

    /** Stores to UPLOAD_DISK (default: local "public"; set to an S3-compatible disk such as s3/R2/Spaces for production). */
    public function upload(Request $r)
    {
        $r->validate(['image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        $disk = config('filesystems.upload_disk', 'public');
        $path = $r->file('image')->store('products', $disk);
        return ['url' => $disk === 'public' ? '/storage/' . $path : Storage::disk($disk)->url($path)];
    }

    /* ---------- Orders ---------- */
    private function orderQuery(Request $r)
    {
        $q = Order::with('items')->where('status', '!=', 'pending_payment');
        if ($s = $r->query('q')) $q->where(fn ($x) => $x->where('number', 'like', "%$s%")->orWhere('customer_name', 'like', "%$s%")->orWhere('customer_email', 'like', "%$s%")->orWhere('customer_phone', 'like', "%$s%"));
        if ($st = $r->query('status')) $q->where('status', $st);
        if ($ps = $r->query('payment_status')) $q->where('payment_status', $ps);
        if ($r->filled('from')) $q->whereDate('created_at', '>=', $r->query('from'));
        if ($r->filled('to')) $q->whereDate('created_at', '<=', $r->query('to'));
        return $q;
    }

    public function orders(Request $r)
    {
        $p = $this->orderQuery($r)->latest()->paginate(20);
        return ['data' => collect($p->items())->map(fn ($o) => Present::order($o, false) + ['customer' => $o->customer_name]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }

    public function ordersExport(Request $r): StreamedResponse
    {
        return response()->streamDownload(function () use ($r) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['order', 'date', 'customer', 'email', 'phone', 'city', 'state', 'pincode', 'items', 'subtotal', 'discount', 'shipping', 'gst_included', 'total', 'payment_method', 'payment_status', 'status', 'coupon']);
            $this->orderQuery($r)->orderBy('id')->chunk(200, function ($rows) use ($out) {
                foreach ($rows as $o) {
                    $a = $o->shipping_address;
                    fputcsv($out, [$o->number, $o->created_at->toDateTimeString(), $o->customer_name, $o->customer_email, $o->customer_phone, $a['city'] ?? '', $a['state'] ?? '', $a['pincode'] ?? '', $o->items->map(fn ($i) => "{$i->name} x{$i->qty}")->implode('; '), $o->subtotal, $o->discount, $o->shipping, $o->tax_included, $o->total, $o->payment_method, $o->payment_status, $o->status, $o->coupon_code]);
                }
            });
            fclose($out);
        }, 'khelzo-orders.csv', ['Content-Type' => 'text/csv']);
    }

    public function order(string $number)
    {
        $o = Order::with(['items', 'events', 'shipment', 'returns'])->where('number', $number)->firstOrFail();
        return Present::order($o) + ['admin_note' => $o->admin_note, 'user_id' => $o->user_id];
    }

    public function orderInvoice(string $number)
    {
        $o = Order::with(['items', 'shipment'])->where('number', $number)->whereNotIn('status', ['pending_payment'])->firstOrFail();
        return response(view('invoice.order', ['o' => $o, 'store' => Setting::get('store', [])])->render(), 200, ['Content-Type' => 'text/html; charset=utf-8']);
    }

    public function orderNote(Request $r, string $number)
    {
        $d = $r->validate(['admin_note' => 'nullable|string|max:2000']);
        Order::where('number', $number)->firstOrFail()->update($d);
        $this->log($r, 'order.note', $number);
        return $this->order($number);
    }

    private const STATUSES = ['order_placed', 'payment_confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'returned', 'refunded'];

    public function orderStatus(Request $r, OrderService $svc, Notifier $mail, string $number)
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
            $mail->orderStatus($o->fresh(['items', 'shipment']), $d['status'], $d['note'] ?? null);
        }
        $this->log($r, 'order.status', $number, ['status' => $d['status']]);
        return $this->order($number);
    }

    /** Retry or issue a refund through Razorpay for a paid online order. */
    public function orderRefund(Request $r, OrderService $svc, Notifier $mail, string $number)
    {
        $this->adminOnly($r);
        $d = $r->validate(['amount' => 'nullable|numeric|min:1']);
        $o = Order::with('items')->where('number', $number)->firstOrFail();
        abort_if($o->payment_method === 'cod', 422, 'This is a Cash on Delivery order — refund the customer manually.');
        abort_unless(in_array($o->payment_status, ['paid', 'refund_pending'], true), 422, 'This order has no payment to refund.');
        $result = $svc->refundPayment($o, isset($d['amount']) ? (float) $d['amount'] : null, 'Refund by store');
        abort_unless($result === 'refunded', 502, match ($result) { 'razorpay-not-configured' => 'Razorpay is not configured on the server.', 'no-captured-payment' => 'No captured payment found.', default => 'Razorpay rejected the refund. Check the Razorpay dashboard and try again.' });
        $svc->event($o, 'refunded', 'Refund issued via Razorpay.');
        $mail->orderStatus($o->fresh(), 'refunded');
        $this->log($r, 'order.refund', $number, ['amount' => $d['amount'] ?? $o->total]);
        return $this->order($number);
    }

    public function orderTracking(Request $r, Notifier $mail, string $number)
    {
        $d = $r->validate(['carrier' => 'required|string|max:80', 'tracking_number' => 'required|string|max:80', 'tracking_url' => 'nullable|url|max:300']);
        $o = Order::where('number', $number)->firstOrFail();
        Shipment::updateOrCreate(['order_id' => $o->id], $d);
        $this->log($r, 'order.tracking', $number);
        return $this->order($number);
    }

    public function returns()
    {
        return ['data' => OrderReturn::with('order:id,number,total,customer_name')->latest()->limit(100)->get()->map(fn ($x) => ['id' => $x->id, 'type' => $x->type, 'reason' => $x->reason, 'status' => $x->status, 'order' => $x->order->number, 'customer' => $x->order->customer_name, 'total' => $x->order->total])];
    }

    public function returnUpdate(Request $r, OrderService $svc, Notifier $mail, OrderReturn $return)
    {
        $d = $r->validate(['status' => 'required|in:approved,rejected,received,refunded', 'admin_note' => 'nullable|string|max:500']);
        $o = $return->order;
        if ($d['status'] === 'refunded') {
            $this->adminOnly($r);
            if ($o->payment_method === 'cod') {
                $o->update(['status' => 'refunded', 'payment_status' => 'refunded']);
                $svc->event($o, 'refunded', 'Refund processed (COD — paid back manually).');
            } else {
                $res = $svc->refundPayment($o, null, 'Return refund');
                abort_unless($res === 'refunded', 502, 'Razorpay refund did not go through (' . $res . '). The return was not marked refunded; try again.');
                $o->update(['status' => 'refunded']);
                $svc->event($o, 'refunded', 'Refund issued via Razorpay.');
            }
            $mail->orderStatus($o->fresh(), 'refunded');
        } elseif ($d['status'] === 'received') {
            $o->update(['status' => 'returned']);
            $svc->event($o, 'returned', 'Return received');
        }
        $return->update($d);
        $mail->returnUpdate($return->fresh('order'));
        $this->log($r, 'return.' . $d['status'], $o->number);
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
    public function couponDestroy(Request $r, Coupon $coupon) { $this->adminOnly($r); $coupon->delete(); $this->log($r, 'coupon.delete', $coupon->code); return ['ok' => true]; }

    public function banners() { return ['data' => Banner::orderBy('sort')->get()]; }
    public function bannerStore(Request $r) { return response()->json(Banner::create($this->bannerData($r)), 201); }
    public function bannerUpdate(Request $r, Banner $banner) { $banner->update($this->bannerData($r)); return $banner; }
    public function bannerDestroy(Banner $banner) { $banner->delete(); return ['ok' => true]; }
    private function bannerData(Request $r): array
    {
        return $r->validate(['title' => 'required|string|max:120', 'subtitle' => 'nullable|string|max:200', 'image' => 'nullable|string|max:300', 'link' => 'nullable|string|max:300', 'active' => 'boolean', 'sort' => 'nullable|integer']);
    }

    /* ---------- Reviews moderation ---------- */
    public function reviews(Request $r)
    {
        $q = Review::with(['user:id,name', 'product:id,name'])->latest();
        if ($st = $r->query('status')) $q->where('status', $st);
        return ['data' => $q->limit(100)->get()->map(fn ($v) => ['id' => $v->id, 'product' => $v->product->name, 'customer' => $v->user->name, 'rating' => $v->rating, 'title' => $v->title, 'body' => $v->body, 'photos' => $v->photos ?? [], 'status' => $v->status, 'date' => $v->created_at->toDateString()])];
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
        $this->adminOnly($r);
        $d = $r->validate([
            'shipping.free_above' => 'required|numeric|min:0', 'shipping.blocked_pins' => 'nullable|string|max:2000',
            'shipping.methods' => 'required|array|min:1', 'shipping.methods.*.id' => 'required|in:standard,express', 'shipping.methods.*.label' => 'required|string|max:60',
            'shipping.methods.*.fee' => 'required|numeric|min:0', 'shipping.methods.*.days_min' => 'required|integer|min:0', 'shipping.methods.*.days_max' => 'required|integer|min:1',
            'store.cod_enabled' => 'required|boolean', 'store.cod_fee' => 'nullable|numeric|min:0', 'store.gst_rate' => 'required|numeric|min:0|max:28', 'store.support_email' => 'nullable|email',
            'store.legal_name' => 'nullable|string|max:120', 'store.gstin' => ['nullable', 'regex:/^[0-9A-Z]{15}$/'], 'store.address' => 'nullable|string|max:300',
            'store.reviews_require_approval' => 'nullable|boolean', 'store.low_stock_threshold' => 'nullable|integer|min:0|max:1000',
        ]);
        Setting::put('shipping', $d['shipping']);
        Setting::put('store', array_merge(Setting::get('store', []), $d['store']));
        $this->log($r, 'settings.update');
        return $this->settings();
    }

    /* ---------- Staff accounts & activity (admin only) ---------- */
    public function staff(Request $r)
    {
        $this->adminOnly($r);
        return ['data' => User::whereIn('role', ['admin', 'manager'])->orderBy('id')->get(['id', 'name', 'email', 'role', 'is_active'])];
    }

    public function staffStore(Request $r)
    {
        $this->adminOnly($r);
        $d = $r->validate(['name' => 'required|string|max:120', 'email' => 'required|email:rfc|max:190|unique:users,email', 'password' => ['required', \Illuminate\Validation\Rules\Password::min(10)->letters()->numbers()], 'role' => 'required|in:admin,manager']);
        $u = User::create($d);
        $this->log($r, 'staff.create', $u->email, ['role' => $u->role]);
        return response()->json($u->only('id', 'name', 'email', 'role', 'is_active'), 201);
    }

    public function staffUpdate(Request $r, User $user)
    {
        $this->adminOnly($r);
        abort_unless($user->isAdmin(), 404);
        $d = $r->validate(['role' => 'sometimes|in:admin,manager', 'is_active' => 'sometimes|boolean']);
        abort_if($user->id === $r->user()->id, 422, 'You cannot change your own role or access.');
        $user->update($d);
        if (isset($d['is_active']) && ! $d['is_active']) $user->tokens()->delete();
        $this->log($r, 'staff.update', $user->email, $d);
        return $user->only('id', 'name', 'email', 'role', 'is_active');
    }

    public function activity(Request $r)
    {
        $this->adminOnly($r);
        $p = ActivityLog::with('user:id,name')->latest('id')->paginate(30);
        return ['data' => collect($p->items())->map(fn ($a) => ['id' => $a->id, 'who' => $a->user?->name ?? 'system', 'action' => $a->action, 'subject' => $a->subject, 'meta' => $a->meta, 'at' => $a->created_at->toIso8601String()]), 'meta' => ['total' => $p->total(), 'last_page' => $p->lastPage()]];
    }
}

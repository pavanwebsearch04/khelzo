<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Banner, Brand, Category, Product, Setting};
use App\Services\{Courier, Notifier};
use App\Support\Present;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    public function meta()
    {
        return [
            'categories' => Category::orderBy('sort')->get()->map(fn ($c) => $c->only('slug', 'name', 'short', 'blurb', 'image', 'bg', 'ink', 'accent') + ['count' => $c->products()->published()->count()]),
            'brands' => Brand::orderBy('name')->get(['slug', 'name']),
            'banners' => Banner::where('active', true)->orderBy('sort')->get(),
            'shipping' => $this->publicShipping(),
            'store' => collect(Setting::get('store', []))->only(['name', 'cod_enabled', 'cod_fee', 'support_email'])->all(),
        ];
    }

    private function publicShipping(): array
    {
        $s = Setting::get('shipping', []);
        return ['free_above' => $s['free_above'] ?? 999, 'methods' => $s['methods'] ?? []];
    }

    /** Everything the home page needs in one request (lists are driven by admin-set tags and the Featured flag). */
    public function home()
    {
        return Cache::remember('home-feed', 60, function () {
            $with = ['images', 'category', 'brand', 'variants'];
            $byTag = fn (string $tag, int $n = 12) => Product::published()->with($with)->whereJsonContains('tags', $tag)->orderByDesc('sold_count')->limit($n)->get()->map(fn ($p) => Present::product($p));
            return [
                'featured' => Product::published()->with($with)->where('featured', true)->orderByDesc('sold_count')->limit(12)->get()->map(fn ($p) => Present::product($p)),
                'bestseller' => $byTag('bestseller'), 'trending' => $byTag('trending'), 'new' => $byTag('new'), 'learning' => $byTag('learning'), 'gift' => $byTag('gift'),
                'category_counts' => Product::published()->join('categories', 'categories.id', '=', 'products.category_id')->groupBy('categories.slug')->selectRaw('categories.slug as k, count(*) as n')->pluck('n', 'k'),
                'age_counts' => Product::published()->groupBy('age_group')->selectRaw('age_group as k, count(*) as n')->pluck('n', 'k'),
                'brands' => Brand::whereHas('products', fn ($q) => $q->published())->orderBy('name')->pluck('name'),
                'reviews' => \App\Models\Review::with(['user:id,name', 'product:id,name,slug'])->where('status', 'approved')->where('rating', '>=', 4)->whereNotNull('body')->latest()->limit(6)->get()
                    ->map(fn ($r) => ['name' => $r->user->name, 'rating' => $r->rating, 'text' => $r->body, 'product' => $r->product->name, 'slug' => $r->product->slug, 'image' => \App\Models\ProductImage::where('product_id', $r->product_id)->orderBy('sort')->value('url')]),
                'banners' => Banner::where('active', true)->orderBy('sort')->get(),
            ];
        });
    }

    public function index(Request $r)
    {
        $r->validate(['per_page' => 'nullable|integer|min:1|max:60', 'page' => 'nullable|integer|min:1']);
        $q = Product::published()->with(['images', 'category', 'brand', 'variants']);

        if ($s = trim((string) $r->query('q'))) {
            $matches = fn () => Product::published()->where(function ($outer) use ($s) {
                foreach (preg_split('/\s+/', $s) as $w) {
                    $outer->where(fn ($qq) => $qq->where('name', 'like', "%$w%")->orWhere('description', 'like', "%$w%")
                        ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%$w%")));
                }
            })->exists();
            if ($matches()) {
                foreach (preg_split('/\s+/', $s) as $w) {
                    $q->where(fn ($qq) => $qq->where('name', 'like', "%$w%")->orWhere('description', 'like', "%$w%")
                        ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%$w%")));
                }
            } else {
                $q->whereIn('id', $this->fuzzyIds($s) ?: [0]); // typo-tolerant fallback ("teddi" → teddy)
            }
        }
        $csv = fn (string $k) => array_filter(explode(',', (string) $r->query($k)));
        if ($v = $csv('category')) $q->whereHas('category', fn ($c) => $c->whereIn('slug', $v));
        if ($v = $csv('age')) $q->whereIn('age_group', $v);
        if ($v = $csv('brand')) $q->whereHas('brand', fn ($c) => $c->whereIn('slug', $v));
        if ($v = $csv('type')) $q->whereIn('toy_type', $v);
        if ($r->filled('min')) $q->where('price', '>=', (float) $r->query('min'));
        if ($r->filled('max')) $q->where('price', '<=', (float) $r->query('max'));
        if ($r->filled('rating')) $q->where('rating_avg', '>=', (float) $r->query('rating'));
        if ($r->filled('discount')) $q->whereRaw(sprintf('(mrp - price) * 100.0 / mrp >= %F', (float) $r->query('discount'))); // float-cast literal: bound params compare as text on SQLite
        if ($r->query('availability') === 'in_stock') $q->where('stock', '>', 0);
        if ($t = $r->query('tag')) $q->whereJsonContains('tags', $t);

        match ($r->query('sort')) {
            'popularity' => $q->orderByDesc('sold_count'),
            'newest' => $q->orderByDesc('created_at')->orderByDesc('id'),
            'price-asc' => $q->orderBy('price'),
            'price-desc' => $q->orderByDesc('price'),
            'rating' => $q->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            'discount' => $q->orderByRaw('(mrp - price) * 1.0 / mrp DESC'),
            default => $q->orderByDesc('featured')->orderByDesc('sold_count'),
        };

        $page = $q->paginate((int) $r->query('per_page', 12));
        return [
            'data' => collect($page->items())->map(fn ($p) => Present::product($p)),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage()],
        ];
    }

    /** Products whose name or category words are within edit distance 2 of a searched word. */
    private function fuzzyIds(string $s): array
    {
        $words = array_filter(preg_split('/\s+/', mb_strtolower($s)), fn ($w) => mb_strlen($w) >= 3);
        if (! $words) return [];
        $rows = Cache::remember('search-index', 300, fn () => Product::published()->with('category:id,name')->get(['id', 'name', 'category_id'])
            ->map(fn ($p) => ['id' => $p->id, 'words' => array_values(array_unique(preg_split('/[^a-z0-9]+/', mb_strtolower($p->name . ' ' . ($p->category?->name ?? '')), -1, PREG_SPLIT_NO_EMPTY)))])->all());
        $ids = [];
        foreach ($rows as $row) {
            foreach ($words as $w) {
                $limit = mb_strlen($w) >= 6 ? 2 : 1;
                foreach ($row['words'] as $cand) {
                    if (levenshtein($w, $cand) <= $limit || str_starts_with($cand, $w)) { $ids[] = $row['id']; continue 3; }
                }
            }
        }
        return $ids;
    }

    /** Lightweight type-ahead for the header search box. */
    public function suggest(Request $r)
    {
        $s = trim((string) $r->query('q'));
        if (mb_strlen($s) < 2) return ['products' => [], 'categories' => []];
        $ids = Product::published()->where('name', 'like', "%$s%")->orderByDesc('sold_count')->limit(6)->pluck('id')->all();
        if (! $ids) $ids = array_slice($this->fuzzyIds($s), 0, 6);
        $products = Product::published()->with(['images', 'category', 'brand', 'variants'])->whereIn('id', $ids)->get()->map(fn ($p) => Present::product($p));
        return ['products' => $products, 'categories' => Category::where('name', 'like', "%$s%")->orWhere('short', 'like', "%$s%")->limit(3)->get(['slug', 'short'])];
    }

    public function show(string $slug)
    {
        $p = Product::published()->with(['images', 'category', 'brand', 'attributes', 'variants'])->where(fn ($q) => ctype_digit($slug) ? $q->where('id', (int) $slug) : $q->where('slug', $slug))->firstOrFail();
        $related = Product::published()->with(['images', 'category', 'brand', 'variants'])->where('id', '!=', $p->id)
            ->where(fn ($q) => $q->where('category_id', $p->category_id)->orWhere('age_group', $p->age_group))
            ->orderByRaw('category_id = ? DESC', [$p->category_id])->orderByDesc('sold_count')->limit(8)->get();
        $dist = $p->reviews()->where('status', 'approved')->selectRaw('rating, count(*) c')->groupBy('rating')->pluck('c', 'rating');
        return [
            'product' => Present::product($p, true),
            'related' => $related->map(fn ($x) => Present::product($x)),
            'rating_distribution' => collect([5, 4, 3, 2, 1])->mapWithKeys(fn ($s) => [$s => (int) ($dist[$s] ?? 0)]),
        ];
    }

    /** Hydrates product ids (recently viewed, comparison, wishlist) into full cards. */
    public function byIds(Request $r)
    {
        $ids = array_slice(array_filter(array_map('intval', explode(',', (string) $r->query('ids')))), 0, 24);
        $rows = Product::published()->with(['images', 'category', 'brand', 'attributes', 'variants'])->whereIn('id', $ids)->get()->keyBy('id');
        return ['data' => collect($ids)->map(fn ($id) => $rows->get($id))->filter()->values()->map(fn ($p) => Present::product($p, true))];
    }

    public function pincode(string $pin, Courier $courier)
    {
        if (! preg_match('/^[1-9][0-9]{5}$/', $pin)) {
            return response()->json(['message' => 'Enter a valid 6-digit PIN code.'], 422);
        }
        $c = $courier->check($pin);
        if (! $c['serviceable']) {
            return response()->json(['serviceable' => false, 'message' => 'Sorry, we do not deliver to this PIN code yet.', 'methods' => []]);
        }
        $m = collect($this->publicShipping()['methods']);
        return ['serviceable' => true, 'source' => $c['source'], 'methods' => $m->map(function ($x) use ($c) {
            $days = (int) $x['days_max'];
            if ($c['eta_days'] && $x['id'] === 'standard') $days = max((int) $x['days_min'], min($days, $c['eta_days'] + 1));
            return $x + ['eta' => now()->addDays($days)->toDateString()];
        })->values()];
    }

    /** Slugs for sitemap.xml. */
    public function sitemap()
    {
        return [
            'products' => Product::published()->orderBy('id')->get(['slug', 'updated_at'])->map(fn ($p) => ['slug' => $p->slug, 'updated' => $p->updated_at?->toDateString()]),
            'categories' => Category::orderBy('sort')->pluck('slug'),
        ];
    }

    public function newsletter(Request $r, Notifier $n)
    {
        $d = $r->validate(['email' => 'required|email:rfc|max:190']);
        $new = DB::table('newsletter_subscribers')->insertOrIgnore(['email' => strtolower($d['email']), 'created_at' => now(), 'updated_at' => now()]);
        if ($new) $n->welcomeNewsletter($d['email']);
        return ['message' => 'Thanks for subscribing!'];
    }

    public function stockAlert(Request $r, Product $product)
    {
        $d = $r->validate(['email' => 'required|email:rfc|max:190']);
        abort_if($product->status !== 'published', 404);
        abort_if($product->stock > 0, 422, 'This toy is already in stock.');
        DB::table('stock_alerts')->insertOrIgnore(['product_id' => $product->id, 'email' => strtolower($d['email']), 'created_at' => now(), 'updated_at' => now()]);
        return ['message' => "We'll email you when it's back."];
    }
}

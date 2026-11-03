<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Banner, Brand, Category, Product, Setting};
use App\Support\Present;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function meta()
    {
        return [
            'categories' => Category::orderBy('sort')->get()->map(fn ($c) => $c->only('slug', 'name', 'short', 'blurb', 'image', 'bg', 'ink', 'accent') + ['count' => $c->products()->published()->count()]),
            'brands' => Brand::orderBy('name')->get(['slug', 'name']),
            'banners' => Banner::where('active', true)->orderBy('sort')->get(),
            'shipping' => Setting::get('shipping'),
            'store' => Setting::get('store'),
        ];
    }

    public function index(Request $r)
    {
        $r->validate(['per_page' => 'nullable|integer|min:1|max:60', 'page' => 'nullable|integer|min:1']);
        $q = Product::published()->with(['images', 'category', 'brand']);

        if ($s = trim((string) $r->query('q'))) {
            foreach (preg_split('/\s+/', $s) as $w) {
                $q->where(fn ($qq) => $qq->where('name', 'like', "%$w%")->orWhere('description', 'like', "%$w%")
                    ->orWhereHas('category', fn ($c) => $c->where('name', 'like', "%$w%")));
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
        if ($r->filled('discount')) $q->whereRaw('(mrp - price) / mrp * 100 >= ?', [(float) $r->query('discount')]);
        if ($r->query('availability') === 'in_stock') $q->where('stock', '>', 0);
        if ($t = $r->query('tag')) $q->whereJsonContains('tags', $t);

        match ($r->query('sort')) {
            'popularity' => $q->orderByDesc('sold_count'),
            'newest' => $q->orderByDesc('created_at')->orderByDesc('id'),
            'price-asc' => $q->orderBy('price'),
            'price-desc' => $q->orderByDesc('price'),
            'rating' => $q->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            'discount' => $q->orderByRaw('(mrp - price) / mrp DESC'),
            default => $q->orderByDesc('featured')->orderByDesc('sold_count'),
        };

        $page = $q->paginate((int) $r->query('per_page', 12));
        return [
            'data' => collect($page->items())->map(fn ($p) => Present::product($p)),
            'meta' => ['total' => $page->total(), 'page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'per_page' => $page->perPage()],
        ];
    }

    public function show(string $slug)
    {
        $p = Product::published()->with(['images', 'category', 'brand', 'attributes'])->where(fn ($q) => ctype_digit($slug) ? $q->where('id', (int) $slug) : $q->where('slug', $slug))->firstOrFail();
        $related = Product::published()->with(['images', 'category', 'brand'])->where('id', '!=', $p->id)
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
        $rows = Product::published()->with(['images', 'category', 'brand', 'attributes'])->whereIn('id', $ids)->get()->keyBy('id');
        return ['data' => collect($ids)->map(fn ($id) => $rows->get($id))->filter()->values()->map(fn ($p) => Present::product($p, true))];
    }

    public function pincode(string $pin)
    {
        if (! preg_match('/^[1-9][0-9]{5}$/', $pin)) {
            return response()->json(['message' => 'Enter a valid 6-digit PIN code.'], 422);
        }
        $m = collect(Setting::get('shipping')['methods']);
        // Without a courier integration every PIN is treated as serviceable; swap in a courier API lookup here.
        return ['serviceable' => true, 'methods' => $m->map(fn ($x) => $x + ['eta' => now()->addDays((int) $x['days_max'])->toDateString()])->values()];
    }
}

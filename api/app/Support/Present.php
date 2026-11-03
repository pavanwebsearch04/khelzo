<?php

namespace App\Support;

use App\Models\{Order, Product};

class Present
{
    public static function product(Product $p, bool $full = false): array
    {
        $out = [
            'id' => $p->id, 'slug' => $p->slug, 'sku' => $p->sku, 'name' => $p->name,
            'category' => $p->category?->slug, 'category_name' => $p->category?->short,
            'brand' => $p->brand?->name, 'brand_slug' => $p->brand?->slug,
            'age' => $p->age_group, 'toy_type' => $p->toy_type,
            'price' => $p->price, 'mrp' => $p->mrp, 'discount' => $p->discount,
            'rating' => $p->rating_avg, 'reviews' => $p->rating_count,
            'images' => $p->images->pluck('url')->all(),
            'badge' => $p->badge, 'tags' => $p->tags ?? [],
            'stock' => $p->stock,
            'availability' => $p->stock < 1 ? 'out_of_stock' : ($p->stock <= 5 ? 'low_stock' : 'in_stock'),
            'desc' => $p->description,
            'created_at' => $p->created_at?->toIso8601String(),
        ];
        if ($full) {
            $out += [
                'features' => $p->features ?? [], 'box_contents' => $p->box_contents ?? [],
                'material' => $p->material, 'dimensions' => $p->dimensions, 'weight' => $p->weight, 'safety' => $p->safety,
                'video_url' => $p->video_url, 'tax_rate' => $p->tax_rate,
                'attributes' => $p->attributes->map(fn ($a) => ['name' => $a->name, 'value' => $a->value])->all(),
            ];
        }
        return $out;
    }

    public static function order(Order $o, bool $detail = true): array
    {
        $out = [
            'number' => $o->number, 'status' => $o->status, 'payment_status' => $o->payment_status, 'payment_method' => $o->payment_method,
            'total' => $o->total, 'subtotal' => $o->subtotal, 'discount' => $o->discount, 'shipping' => $o->shipping, 'tax_included' => $o->tax_included,
            'coupon_code' => $o->coupon_code, 'estimated_delivery' => $o->estimated_delivery?->toDateString(),
            'delivery_method' => $o->delivery_method, 'created_at' => $o->created_at->toIso8601String(),
            'items_count' => $o->relationLoaded('items') ? $o->items->sum('qty') : null,
        ];
        if (! $detail) {
            if ($o->relationLoaded('items')) $out['items'] = $o->items->map(fn ($i) => ['name' => $i->name, 'image' => $i->image, 'qty' => $i->qty])->all();
            return $out;
        }
        return $out + [
            'customer' => ['name' => $o->customer_name, 'email' => $o->customer_email, 'phone' => $o->customer_phone, 'whatsapp' => $o->whatsapp],
            'address' => $o->shipping_address, 'instructions' => $o->instructions,
            'items' => $o->items->map(fn ($i) => ['id' => $i->id, 'product_id' => $i->product_id, 'name' => $i->name, 'sku' => $i->sku, 'image' => $i->image, 'unit_price' => $i->unit_price, 'qty' => $i->qty, 'line_total' => $i->line_total])->all(),
            'timeline' => $o->events->map(fn ($e) => ['status' => $e->status, 'note' => $e->note, 'at' => $e->created_at->toIso8601String()])->all(),
            'shipment' => $o->shipment ? ['carrier' => $o->shipment->carrier, 'tracking_number' => $o->shipment->tracking_number, 'tracking_url' => $o->shipment->tracking_url] : null,
            'returns' => $o->relationLoaded('returns') ? $o->returns->map(fn ($r) => ['id' => $r->id, 'type' => $r->type, 'status' => $r->status, 'reason' => $r->reason])->all() : [],
        ];
    }
}

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Product extends Model {
    protected $guarded = [];
    protected $casts = ['tags' => 'array', 'features' => 'array', 'box_contents' => 'array', 'featured' => 'boolean', 'price' => 'float', 'mrp' => 'float', 'tax_rate' => 'float', 'rating_avg' => 'float'];
    public function category() { return $this->belongsTo(Category::class); }
    public function brand() { return $this->belongsTo(Brand::class); }
    public function images() { return $this->hasMany(ProductImage::class)->orderBy('sort'); }
    public function attributes() { return $this->hasMany(ProductAttribute::class); }
    public function variants() { return $this->hasMany(ProductVariant::class)->orderBy('sort')->orderBy('id'); }
    public function reviews() { return $this->hasMany(Review::class); }
    public function scopePublished($q) { return $q->where('status', 'published'); }
    public function getDiscountAttribute(): int { return $this->mrp > $this->price ? (int) round(($this->mrp - $this->price) / $this->mrp * 100) : 0; }
}

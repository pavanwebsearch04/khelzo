<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Coupon extends Model {
    protected $guarded = [];
    protected $casts = ['starts_at' => 'datetime', 'expires_at' => 'datetime', 'active' => 'boolean', 'first_order_only' => 'boolean', 'value' => 'float', 'min_order' => 'float', 'max_discount' => 'float'];
}

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Order extends Model {
    protected $guarded = [];
    protected $casts = ['shipping_address' => 'array', 'estimated_delivery' => 'date:Y-m-d', 'subtotal' => 'float', 'discount' => 'float', 'shipping' => 'float', 'tax_included' => 'float', 'total' => 'float', 'cancelled_at' => 'datetime'];
    public function items() { return $this->hasMany(OrderItem::class); }
    public function events() { return $this->hasMany(OrderEvent::class)->orderBy('id'); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function shipment() { return $this->hasOne(Shipment::class); }
    public function user() { return $this->belongsTo(User::class); }
    public function returns() { return $this->hasMany(OrderReturn::class); }
}

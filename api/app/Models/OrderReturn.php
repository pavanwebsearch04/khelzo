<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class OrderReturn extends Model { protected $table = 'order_returns'; protected $guarded = []; public function order() { return $this->belongsTo(Order::class); } }

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
class User extends Authenticatable {
    use HasApiTokens, HasFactory, Notifiable;
    protected $fillable = ['name', 'email', 'phone', 'password', 'role', 'is_active'];
    protected $hidden = ['password', 'remember_token'];
    protected function casts(): array { return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'is_active' => 'boolean']; }
    public function isAdmin(): bool { return in_array($this->role, ['admin', 'manager'], true); }
    public function addresses() { return $this->hasMany(Address::class); }
    public function orders() { return $this->hasMany(Order::class); }
    public function wishlist() { return $this->belongsToMany(Product::class, 'wishlists')->withTimestamps(); }
}

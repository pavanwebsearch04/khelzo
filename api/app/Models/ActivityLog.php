<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class ActivityLog extends Model {
    protected $guarded = [];
    protected $casts = ['meta' => 'array'];
    public function user() { return $this->belongsTo(User::class); }
    public static function record(?User $u, string $action, ?string $subject = null, array $meta = []): void {
        static::create(['user_id' => $u?->id, 'action' => $action, 'subject' => $subject, 'meta' => $meta ?: null]);
    }
}

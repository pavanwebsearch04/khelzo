<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $u = $request->user();
        if (! $u || ! $u->is_active || ! $u->isAdmin()) {
            return response()->json(['message' => 'Admin access required.'], 403);
        }
        return $next($request);
    }
}

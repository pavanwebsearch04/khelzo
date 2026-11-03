<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function session(User $u): array
    {
        return ['token' => $u->createToken('storefront')->plainTextToken, 'user' => $this->user($u)];
    }

    public static function user(User $u): array
    {
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'phone' => $u->phone, 'role' => $u->role];
    }

    public function register(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email:rfc|max:190|unique:users,email',
            'phone' => ['nullable', 'regex:/^[6-9][0-9]{9}$/'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);
        $u = User::create($d + ['role' => 'customer']); // role can never be set from the request
        return response()->json($this->session($u), 201);
    }

    public function login(Request $r)
    {
        $d = $r->validate(['email' => 'required|email', 'password' => 'required|string']);
        $u = User::where('email', $d['email'])->first();
        if (! $u || ! Hash::check($d['password'], $u->password) || ! $u->is_active) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }
        return $this->session($u);
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return ['ok' => true];
    }

    public function me(Request $r)
    {
        return ['user' => $this->user($r->user())];
    }

    public function update(Request $r)
    {
        $u = $r->user();
        $d = $r->validate([
            'name' => 'sometimes|string|max:120',
            'phone' => ['sometimes', 'nullable', 'regex:/^[6-9][0-9]{9}$/'],
            'current_password' => 'required_with:password|string',
            'password' => ['sometimes', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);
        if (isset($d['password']) && ! Hash::check($d['current_password'], $u->password)) {
            throw ValidationException::withMessages(['current_password' => 'Current password is incorrect.']);
        }
        $u->update(collect($d)->except('current_password')->all());
        return ['user' => $this->user($u->fresh())];
    }

    public function forgot(Request $r)
    {
        $r->validate(['email' => 'required|email']);
        Password::sendResetLink($r->only('email'));
        // Same answer whether or not the address exists, so accounts cannot be enumerated.
        return ['message' => 'If that email is registered, a reset link has been sent.'];
    }

    public function reset(Request $r)
    {
        $d = $r->validate([
            'token' => 'required', 'email' => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);
        $status = Password::reset($d, function (User $u, string $password) {
            $u->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $u->tokens()->delete();
        });
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => 'This reset link is invalid or has expired.']);
        }
        return ['message' => 'Password updated. You can log in now.'];
    }
}

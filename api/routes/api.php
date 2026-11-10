<?php

use App\Http\Controllers\Admin\AdminController as Admin;
use App\Http\Controllers\Api\{AccountController, AuthController, CatalogController, CheckoutController};
use Illuminate\Support\Facades\Route;

// ---- Public catalogue ----
Route::get('/meta', [CatalogController::class, 'meta']);
Route::get('/home', [CatalogController::class, 'home']);
Route::get('/sitemap', [CatalogController::class, 'sitemap']);
Route::get('/search/suggest', [CatalogController::class, 'suggest'])->middleware('throttle:60,1,suggest');
Route::post('/newsletter', [CatalogController::class, 'newsletter'])->middleware('throttle:5,1,newsletter');
Route::post('/products/{product}/stock-alert', [CatalogController::class, 'stockAlert'])->middleware('throttle:10,1,stockalert');
Route::get('/products', [CatalogController::class, 'index']);
Route::get('/products/by-ids', [CatalogController::class, 'byIds']);
Route::get('/products/{slug}', [CatalogController::class, 'show']);
Route::get('/products/{product:slug}/reviews', [AccountController::class, 'productReviews']);
Route::get('/pincode/{pin}', [CatalogController::class, 'pincode'])->middleware('throttle:30,1,pin');

// ---- Auth ----
Route::middleware('throttle:10,1,auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgot']);
    Route::post('/auth/reset-password', [AuthController::class, 'reset']);
});

// ---- Cart pricing + checkout (guests allowed; a bearer token, if sent, attaches the order to the account) ----
Route::post('/cart/quote', [CheckoutController::class, 'quote'])->middleware('throttle:60,1,quote');
Route::middleware('throttle:15,1,checkout')->group(function () {
    Route::post('/checkout', [CheckoutController::class, 'place']);
    Route::post('/checkout/verify', [CheckoutController::class, 'verify']);
    Route::post('/checkout/failed', [CheckoutController::class, 'failed']);
    Route::post('/checkout/{number}/retry', [CheckoutController::class, 'retry']);
});
Route::get('/orders/track/{number}', function (Illuminate\Http\Request $r, string $number) {
    $o = App\Models\Order::with(['items', 'events', 'shipment'])->where('number', $number)->firstOrFail();
    $u = Illuminate\Support\Facades\Auth::guard('sanctum')->user();
    $t = (string) $r->header('X-Guest-Token');
    abort_unless(($u && ($o->user_id === $u->id || $u->isAdmin())) || ($o->guest_token && $t !== '' && hash_equals($o->guest_token, $t)), 404);
    return App\Support\Present::order($o);
})->middleware('throttle:30,1,track');
Route::post('/webhooks/razorpay', [CheckoutController::class, 'webhook']);

// ---- Signed-in customer ----
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/me', [AuthController::class, 'update']);

    Route::get('/account/orders', [AccountController::class, 'orders']);
    Route::get('/account/orders/{number}', [AccountController::class, 'order']);
    Route::post('/account/orders/{number}/cancel', [AccountController::class, 'cancel']);
    Route::post('/account/orders/{number}/return', [AccountController::class, 'requestReturn']);
    Route::get('/account/orders/{number}/invoice', [AccountController::class, 'invoice']);

    Route::get('/account/addresses', [AccountController::class, 'addresses']);
    Route::post('/account/addresses', [AccountController::class, 'addressStore']);
    Route::put('/account/addresses/{address}', [AccountController::class, 'addressUpdate']);
    Route::delete('/account/addresses/{address}', [AccountController::class, 'addressDestroy']);

    Route::get('/account/wishlist', [AccountController::class, 'wishlist']);
    Route::post('/account/wishlist/sync', [AccountController::class, 'wishlistSync']);
    Route::post('/account/wishlist/{product}', [AccountController::class, 'wishlistToggle']);

    Route::get('/account/cart', [AccountController::class, 'cart']);
    Route::put('/account/cart', [AccountController::class, 'cartSave']);

    Route::get('/account/reviewable', [AccountController::class, 'reviewable']);
    Route::post('/reviews', [AccountController::class, 'reviewStore'])->middleware('throttle:20,1,reviews');
    Route::put('/reviews/{review}', [AccountController::class, 'reviewUpdate']);
    Route::delete('/reviews/{review}', [AccountController::class, 'reviewDestroy']);
});

// ---- Admin (token + role check on every route) ----
Route::prefix('admin')->middleware(['auth:sanctum', 'admin', 'throttle:120,1,admin'])->group(function () {
    Route::get('/dashboard', [Admin::class, 'dashboard']);
    Route::get('/products', [Admin::class, 'products']);
    Route::post('/products/bulk', [Admin::class, 'productsBulk']);
    Route::get('/products/export', [Admin::class, 'productsExport']);
    Route::post('/products/import', [Admin::class, 'productsImport']);
    Route::get('/inventory', [Admin::class, 'inventory']);
    Route::post('/products', [Admin::class, 'productStore']);
    Route::put('/products/{product}', [Admin::class, 'productUpdate']);
    Route::delete('/products/{product}', [Admin::class, 'productDestroy']);
    Route::post('/upload', [Admin::class, 'upload']);

    Route::get('/orders', [Admin::class, 'orders']);
    Route::get('/orders/export', [Admin::class, 'ordersExport']);
    Route::get('/orders/{number}', [Admin::class, 'order']);
    Route::get('/orders/{number}/invoice', [Admin::class, 'orderInvoice']);
    Route::put('/orders/{number}/note', [Admin::class, 'orderNote']);
    Route::post('/orders/{number}/refund', [Admin::class, 'orderRefund']);
    Route::post('/orders/{number}/status', [Admin::class, 'orderStatus']);
    Route::put('/orders/{number}/tracking', [Admin::class, 'orderTracking']);
    Route::get('/returns', [Admin::class, 'returns']);
    Route::put('/returns/{return}', [Admin::class, 'returnUpdate']);

    Route::get('/customers', [Admin::class, 'customers']);
    Route::get('/customers/{user}', [Admin::class, 'customer']);
    Route::put('/customers/{user}', [Admin::class, 'customerUpdate']);

    Route::get('/categories', [Admin::class, 'categories']);
    Route::post('/categories', [Admin::class, 'categoryStore']);
    Route::put('/categories/{category}', [Admin::class, 'categoryUpdate']);
    Route::delete('/categories/{category}', [Admin::class, 'categoryDestroy']);
    Route::get('/brands', [Admin::class, 'brands']);
    Route::post('/brands', [Admin::class, 'brandStore']);
    Route::put('/brands/{brand}', [Admin::class, 'brandUpdate']);
    Route::delete('/brands/{brand}', [Admin::class, 'brandDestroy']);
    Route::get('/coupons', [Admin::class, 'coupons']);
    Route::post('/coupons', [Admin::class, 'couponStore']);
    Route::put('/coupons/{coupon}', [Admin::class, 'couponUpdate']);
    Route::delete('/coupons/{coupon}', [Admin::class, 'couponDestroy']);
    Route::get('/banners', [Admin::class, 'banners']);
    Route::post('/banners', [Admin::class, 'bannerStore']);
    Route::put('/banners/{banner}', [Admin::class, 'bannerUpdate']);
    Route::delete('/banners/{banner}', [Admin::class, 'bannerDestroy']);
    Route::get('/reviews', [Admin::class, 'reviews']);
    Route::put('/reviews/{review}', [Admin::class, 'reviewUpdate']);
    Route::delete('/reviews/{review}', [Admin::class, 'reviewDestroy']);
    Route::get('/settings', [Admin::class, 'settings']);
    Route::put('/settings', [Admin::class, 'settingsUpdate']);
    Route::get('/staff', [Admin::class, 'staff']);
    Route::post('/staff', [Admin::class, 'staffStore']);
    Route::put('/staff/{user}', [Admin::class, 'staffUpdate']);
    Route::get('/activity', [Admin::class, 'activity']);
});

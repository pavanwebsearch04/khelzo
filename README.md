# KHELZO — Play Beyond Imagination.

Full-stack toy store for India (₹ INR).

- **Storefront + admin UI:** Next.js, React, TypeScript, Tailwind CSS v4 (`src/`)
- **API:** Laravel 12 REST API with Sanctum auth (`api/`)
- **Database:** MySQL
- **Payments:** Razorpay (test mode until live keys are set) and Cash on Delivery

## Run locally (XAMPP)

1. Start MySQL (XAMPP) and create a database named `khelzo`.
2. API:
   ```bash
   cd api
   cp .env.example .env        # then set DB_*, FRONTEND_URL, RAZORPAY_*, ADMIN_PASSWORD
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --port=8000
   ```
3. Storefront:
   ```bash
   npm install
   npm run dev                 # http://localhost:3000
   ```
   `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8000/api`.

Seeded accounts (local only, change before any deployment): `admin@khelzo.local` (password from `ADMIN_PASSWORD`, default `ChangeMe!2026`) and `demo@khelzo.local`. Seeded coupons: `WELCOME10` (first order, login required), `PLAY100` (₹100 off ₹999+), `FREESHIP`, `BEARS15`.

## Configuration still required

| Setting | Where | Notes |
| --- | --- | --- |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | `api/.env` | Without them online payment returns 503 and only COD works. Use test keys first. |
| `RAZORPAY_WEBHOOK_SECRET` | `api/.env` | Point the Razorpay webhook to `/api/webhooks/razorpay`. |
| `FRONTEND_URL` | `api/.env` | Comma-separated allowed CORS origins. |
| Mail driver | `api/.env` | No order or password-reset emails are sent until a real mailer is configured. |
| Image storage | — | Admin uploads go to local Laravel storage; swap the disk for Cloudinary or S3 in production. |
| Courier / PIN lookup | `CatalogController::pincode` | Currently treats every valid PIN as serviceable. |

## Structure

```
src/app/          storefront routes (shop, product, cart, checkout, account, order, track-order, compare) and /admin
src/components/   header, products, checkout, account, admin, home sections, providers
src/data/         site copy and the static catalogue used by home-page sections
src/lib/api.ts    API client
api/              Laravel app: controllers, models, services (Pricing, OrderService, Razorpay), migrations, seeders
```

Prices, coupons, stock and totals are always calculated on the server (`api/app/Services/Pricing.php`).

## Notes

- Product photos are open-licensed Wikimedia Commons images; replace them with your own photography before launch (credits in `src/data/image-credits.json`).
- "Brands we love" on the home page are text-only examples; no partnership is implied.

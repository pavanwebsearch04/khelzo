# KHELZO — Play Beyond Imagination.

Full-stack toy store for India (₹ INR).

- **Storefront + admin UI:** Next.js 16, React 19, TypeScript, Tailwind CSS v4 (`src/`)
- **API:** Laravel 12 REST API with Sanctum auth (`api/`)
- **Database:** MySQL
- **Payments:** Razorpay (UPI, cards, net banking, wallets) and Cash on Delivery — prices, coupons and stock are always calculated on the server

## What's in the box

**Customers:** catalogue with filters/sorting/typo-tolerant search, product options (size/colour…), quick view, wishlist, compare, cart drawer + page, 4-step checkout, guest or account orders, order tracking timeline, cancel / return requests, invoices, verified reviews with photos, back-in-stock alerts, newsletter.

**Admin (`/admin`):** dashboard (sales, categories, top customers, alerts), products (options, bulk actions, CSV import/export, featured flag), inventory log, orders (status, tracking, notes, invoice, Razorpay refunds, CSV export), customers, coupons, categories/brands/banners, review moderation, returns, settings (shipping, GST, PIN block-list, business details), staff roles (admin / manager) and an activity log.

**Platform:** transactional emails, abandoned-cart reminders, unpaid-order expiry, sitemap/robots/structured data, cookie-consent-gated analytics (GA4 / Meta Pixel), rate limiting, webhook signature verification.

## Run locally (XAMPP)

1. Start MySQL (XAMPP) and create a database named `khelzo`.
2. API:
   ```bash
   cd api
   cp .env.example .env        # then set DB_*, RAZORPAY_*, ADMIN_PASSWORD, MAIL_*
   composer install
   php artisan key:generate
   php artisan migrate --seed
   php artisan storage:link
   php artisan serve --port=8000
   ```
3. Storefront:
   ```bash
   cp .env.example .env.local  # optional; defaults work locally
   npm install
   npm run dev                 # http://localhost:3000
   ```

Seeded accounts (local only): `admin@khelzo.local` (password = `ADMIN_PASSWORD`, default `ChangeMe!2026`) and `demo@khelzo.local` / `DemoPass!2026`. Seeded coupons: `WELCOME10` (first order, login required), `PLAY100` (₹100 off ₹999+), `FREESHIP`, `BEARS15`. In production the seeder refuses to run without `ADMIN_PASSWORD`, never resets an existing admin password and never creates the demo user.

## Tests

```bash
cd api && php artisan test     # 47 feature tests: checkout, stock, coupons, payments/webhooks/refunds, admin authorization, catalogue
npx tsc --noEmit && npm run lint && npm run build
```

## Configuration you must provide

| What | Where | Notes |
| --- | --- | --- |
| Razorpay keys | `api/.env` `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Without them online payment returns 503 and only COD works. Start with **test** keys. |
| Razorpay webhook | Razorpay dashboard → Webhooks | URL `{API}/api/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`; put the secret in `RAZORPAY_WEBHOOK_SECRET`. |
| Email | `api/.env` `MAIL_*` | `MAIL_MAILER=log` only writes emails to `storage/logs`. Use SMTP/Resend/SES in production. |
| Scheduler | server cron | `* * * * * php /path/api/artisan schedule:run` — releases unpaid stock every 5 min and sends cart reminders hourly. |
| Image storage | `api/.env` `UPLOAD_DISK` | `public` = local disk. For S3/R2/Spaces: `composer require league/flysystem-aws-s3-v3`, set `UPLOAD_DISK=s3` + `AWS_*`, and add the host to `NEXT_PUBLIC_IMAGE_HOSTS`. |
| Courier (optional) | `api/.env` `SHIPROCKET_*` | Enables live PIN serviceability. Without it, only the admin PIN block-list applies. |
| Public URLs | `.env.local` `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_API_URL`; `api/.env` `FRONTEND_URL`, `APP_URL` | Used for canonical URLs, sitemap, CORS and email links. |
| Contact details | `.env.local` `NEXT_PUBLIC_SUPPORT_*` | Shown in footer and policy pages. |
| Analytics | `.env.local` `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Loaded only after the visitor accepts the cookie banner. |
| Business details | Admin → Settings | Legal name, GSTIN and address appear on invoices. |

## Going live checklist

- `APP_ENV=production`, `APP_DEBUG=false`, strong `ADMIN_PASSWORD`, HTTPS everywhere, `FRONTEND_URL` set to the real storefront origin.
- `php artisan migrate --force && php artisan config:cache && php artisan route:cache`; keep a `queue:work` / scheduler running.
- Switch Razorpay to live keys only after a successful test-mode payment, refund and webhook round-trip.
- Back up the MySQL database daily.
- Policy pages in `src/data/pages.ts` are drafts that match how the store works — have a legal professional review them and fill in your registered business details.
- Replace the open-licensed sample product photos (credits: `src/data/image-credits.json`) with your own photography.

## Structure

```
src/app/          routes: shop, product, cart, checkout, account, order, track-order, compare, /admin, sitemap, robots
src/components/   header, products, checkout, account, admin, home sections, providers
src/data/         editorial config (categories, ages, nav) and policy pages
src/lib/          api client, analytics, formatting
api/app/          Http/Controllers (Api, Admin), Models, Services (Pricing, OrderService, Razorpay, Courier, Notifier), Mail
api/database/     migrations + seeders
api/tests/        PHPUnit feature tests
```

## Known limits

- Loyalty points, gift cards, product Q&A and a Hindi translation are not built.
- Product search is database-backed (with typo tolerance); a hosted search service is not wired in.
- The S3 driver package must be installed on the server that uses object storage (see table above).

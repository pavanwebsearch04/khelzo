# KHELZO — Play Beyond Imagination.

A frontend-only toy ecommerce storefront for India (₹ INR), built with Next.js, React, TypeScript, Tailwind CSS v4, Framer Motion, GSAP + ScrollTrigger and Lucide icons.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure

```
src/
  app/                 layout, home, /shop (filters, sort, search), /pages/[slug] (info pages), icon.svg
  components/
    art/               Logo + original SVG toys (rocket, blocks, car, bear, balloons, gift box…)
    header/            announcement bar, sticky header, mega menus, search, cart / wishlist / mobile drawers
    home/              Hero, Categories, ShopByAge, Trending, Playroom, Learning, Bestsellers,
                       Story, AdventureZone, GiftFinder, NewArrivals, Brands/Reviews/Newsletter
    products/          ProductCard, QuickView, ShopClient
    providers/         StoreProvider (cart, wishlist, quick view), Preloader, Toast
    footer/ ui/
  data/                catalog.ts (products, categories, ages, gifts, brands, reviews), site.ts (announcements, nav, footer), pages.ts
  lib/                 search, formatting
public/images/         categories, age-groups, banners, products (optimised .webp)
```

Edit the announcement text, navigation, footer links and payment icons in `src/data/site.ts`. Edit products, categories, brands and reviews in `src/data/catalog.ts`.

## Demo limitations

- No backend: checkout, payments, accounts, order tracking and newsletter sign-up are UI demos. Cart and wishlist persist in `localStorage` only.
- Reviews are clearly marked sample content; no "verified purchase" badge is shown because there is no real data behind it.
- Brand names in "Brands we love" are text-only examples, with a disclaimer; no partnership is implied.
- Product photos are open-licensed images from Wikimedia Commons and vary in style. Replace them with your own studio photography before launch. Every credit is listed in `src/data/image-credits.json` and on `/pages/photo-credits`.
- Hero, Story and Adventure Zone art are original SVG illustrations (not photographs).

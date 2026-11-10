import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { API_URL, API_ORIGIN, type ApiProduct } from "@/lib/api";
import { ProductDetail } from "@/components/products/ProductDetail";
import { SITE_URL } from "@/lib/site-url";

interface Payload { product: ApiProduct; related: ApiProduct[]; rating_distribution: Record<string, number> }

async function load(slug: string): Promise<Payload | null> {
  try {
    const res = await fetch(`${API_URL}/products/${encodeURIComponent(slug)}`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("API error");
    return res.json();
  } catch (e) {
    if ((e as Error).message === "API error") throw e;
    throw new Error("The KHELZO server is unreachable. Start the API (php artisan serve) and refresh.");
  }
}

const abs = (u: string) => (u.startsWith("http") ? u : u.startsWith("/storage/") ? API_ORIGIN + u : u);

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug).catch(() => null);
  if (!d) return { title: "Toy not found" };
  const p = d.product;
  return {
    title: p.name,
    description: p.desc.slice(0, 160),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: `${p.name} | KHELZO`, description: p.desc.slice(0, 200), type: "website", images: [{ url: abs(p.images[0]) }] },
    twitter: { card: "summary_large_image", title: p.name, description: p.desc.slice(0, 200), images: [abs(p.images[0])] },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  const p = d.product;
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, description: p.desc,
    image: p.images.map((u) => (abs(u).startsWith("http") ? abs(u) : SITE_URL + abs(u))), brand: p.brand ? { "@type": "Brand", name: p.brand } : undefined, category: p.category_name,
    aggregateRating: p.reviews > 0 ? { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews } : undefined,
    offers: (p.variants?.length
      ? { "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: Math.min(...p.variants.map((v) => v.price)), highPrice: Math.max(...p.variants.map((v) => v.price)), offerCount: p.variants.length,
          availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" }
      : { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition", url: `${SITE_URL}/product/${p.slug}` }),
  };
  const crumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: p.category_name, item: `${SITE_URL}/shop?category=${p.category}` },
      { "@type": "ListItem", position: 4, name: p.name, item: `${SITE_URL}/product/${p.slug}` },
    ],
  };
  const json = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json(crumbs) }} />
      <ProductDetail product={p} related={d.related} distribution={d.rating_distribution} />
    </>
  );
}

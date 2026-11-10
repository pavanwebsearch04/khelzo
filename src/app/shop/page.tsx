import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopClient } from "@/components/products/ShopClient";
import { categories, ages } from "@/data/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const cat = categories.find((c) => c.slug === one("category"));
  const age = ages.find((a) => a.slug === one("age"));
  const q = one("q");
  if (cat) return { title: cat.name, description: `${cat.blurb} Shop ${cat.name.toLowerCase()} at KHELZO with free delivery above ₹999.`, alternates: { canonical: `/shop?category=${cat.slug}` }, openGraph: { title: `${cat.name} | KHELZO` } };
  if (age) return { title: `Toys for ages ${age.range}`, description: `${age.title}: ${age.blurb}`, alternates: { canonical: `/shop?age=${age.slug}` } };
  if (q) return { title: `Search: ${q.slice(0, 40)}`, robots: { index: false } }; // search result pages should not be indexed
  return { title: "Shop All Toys", description: "Browse every KHELZO toy by category, age and price.", alternates: { canonical: "/shop" } };
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-k py-24 text-center font-display text-2xl">Loading toys…</div>}>
      <ShopClient />
    </Suspense>
  );
}

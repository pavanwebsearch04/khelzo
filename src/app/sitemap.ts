import type { MetadataRoute } from "next";
import { API_URL } from "@/lib/api";
import { SITE_URL } from "@/lib/site-url";
import { pages } from "@/data/pages";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/track-order`, changeFrequency: "yearly", priority: 0.2 },
    ...Object.keys(pages).filter((s) => !["account", "track-order"].includes(s)).map((s) => ({ url: `${SITE_URL}/pages/${s}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
  try {
    const res = await fetch(`${API_URL}/sitemap`, { next: { revalidate: 3600 }, headers: { Accept: "application/json" } });
    if (res.ok) {
      const d: { products: { slug: string; updated: string | null }[]; categories: string[] } = await res.json();
      out.push(...d.categories.map((c) => ({ url: `${SITE_URL}/shop?category=${c}`, changeFrequency: "weekly" as const, priority: 0.7 })));
      out.push(...d.products.map((p) => ({ url: `${SITE_URL}/product/${p.slug}`, lastModified: p.updated ? new Date(p.updated) : now, changeFrequency: "weekly" as const, priority: 0.8 })));
    }
  } catch {
    // API unavailable at build time: the static URLs above are still valid.
  }
  return out;
}

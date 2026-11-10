"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, type ApiProduct } from "@/lib/api";

export interface HomeReview { name: string; rating: number; text: string; product: string; slug: string; image: string | null }
export interface HomeData {
  featured: ApiProduct[]; bestseller: ApiProduct[]; trending: ApiProduct[]; new: ApiProduct[]; learning: ApiProduct[]; gift: ApiProduct[];
  category_counts: Record<string, number>; age_counts: Record<string, number>; brands: string[]; reviews: HomeReview[];
  banners: { id: number; title: string; subtitle: string | null; image: string | null; link: string | null }[];
}

const Ctx = createContext<{ data: HomeData | null; loading: boolean }>({ data: null, loading: true });

/** Home-page lists come from the API (tags + the admin "Featured" flag). The server passes the first copy so the page paints with real data. */
export function HomeDataProvider({ initial, children }: { initial: HomeData | null; children: React.ReactNode }) {
  const [data, setData] = useState<HomeData | null>(initial);
  const [loading, setLoading] = useState(!initial);
  useEffect(() => {
    if (initial) return;
    api<HomeData>("/home").then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [initial]);
  return <Ctx.Provider value={{ data, loading }}>{children}</Ctx.Provider>;
}

export const useHome = () => useContext(Ctx);

import { Suspense } from "react";
import type { Metadata } from "next";
import { ShopClient } from "@/components/products/ShopClient";

export const metadata: Metadata = { title: "Shop All Toys", description: "Browse every KHELZO toy by category, age and price." };

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container-k py-24 text-center font-display text-2xl">Loading toys…</div>}>
      <ShopClient />
    </Suspense>
  );
}

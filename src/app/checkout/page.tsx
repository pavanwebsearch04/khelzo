import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-k py-24 text-center font-display text-2xl">Loading checkout…</div>}>
      <CheckoutClient />
    </Suspense>
  );
}

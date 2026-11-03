import { Suspense } from "react";
import type { Metadata } from "next";
import { AccountClient } from "@/components/account/AccountClient";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage() {
  return <Suspense fallback={<div className="container-k py-24 text-center font-display text-2xl">Loading…</div>}><AccountClient /></Suspense>;
}

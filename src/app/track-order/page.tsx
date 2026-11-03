"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { guestOrders } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";

export default function TrackOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [n, setN] = useState("");
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => { setMine(Object.keys(guestOrders.all()).reverse()); }, []);
  return (
    <div className="container-k max-w-2xl py-14">
      <h1 className="display-section">Track your order</h1>
      <p className="mt-3 text-ink-soft">Enter your order number (it starts with KZ). Guest orders can be tracked on the device they were placed from; logged-in customers see every order in their account.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (n.trim()) router.push(`/order/${n.trim().toUpperCase()}`); }} className="mt-6 flex gap-2">
        <input value={n} onChange={(e) => setN(e.target.value)} placeholder="e.g. KZ261102ABCDE" aria-label="Order number" className="h-12 min-w-0 flex-1 rounded-full border-2 border-ink px-5 font-bold uppercase" />
        <button className="btn btn-purple">Track</button>
      </form>
      {mine.length > 0 && <div className="mt-8"><h2 className="font-display text-xl font-bold">Orders on this device</h2><ul className="mt-3 space-y-2">{mine.map((m) => <li key={m}><Link href={`/order/${m}`} className="block rounded-2xl border-2 border-ink bg-white px-4 py-3 font-extrabold hover:bg-purple-soft">{m}</Link></li>)}</ul></div>}
      {user && <Link href="/account/orders" className="btn btn-white mt-8">See all my orders</Link>}
    </div>
  );
}

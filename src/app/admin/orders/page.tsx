"use client";

import Link from "next/link";
import { useState } from "react";
import { STATUS_LABEL } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, Th, fld, useAdminData } from "@/components/admin/ui";

interface Row { number: string; customer: string; status: string; payment_status: string; payment_method: string; total: number; created_at: string; items_count: number }

export default function AdminOrders() {
  const [q, setQ] = useState(""); const [status, setStatus] = useState("");
  const { data, error } = useAdminData<{ data: Row[]; meta: { total: number } }>(`/admin/orders?q=${encodeURIComponent(q)}&status=${status}`);
  return (
    <>
      <h1 className="display-section">Orders</h1>
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input className={`${fld} max-w-xs`} placeholder="Search order, name, email, phone" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className={`${fld} max-w-[220px]`} aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABEL).filter(([k]) => k !== "pending_payment").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </div>
        {!data ? <Loading error={error} /> : data.data.length === 0 ? <p className="font-bold text-ink-soft">No orders found.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm font-semibold"><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Date</Th><Th>Payment</Th><Th>Status</Th><Th>Total</Th></tr></thead>
            <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">{data.data.map((o) => (
              <tr key={o.number}><Td><Link href={`/admin/orders/${o.number}`} className="font-extrabold text-purple">{o.number}</Link></Td><Td>{o.customer}</Td><Td>{new Date(o.created_at).toLocaleDateString("en-IN")}</Td><Td>{o.payment_method.toUpperCase()} · {o.payment_status}</Td><Td><span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-black">{STATUS_LABEL[o.status] ?? o.status}</span></Td><Td className="font-black">{inr(o.total)}</Td></tr>))}</tbody></table></div>
        )}
      </Card>
    </>
  );
}

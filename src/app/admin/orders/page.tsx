"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STATUS_LABEL } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Pager, Th, Td, downloadFile, fld, useAdminData } from "@/components/admin/ui";

interface Row { number: string; customer: string; status: string; payment_status: string; payment_method: string; total: number; created_at: string; items_count: number }

export default function AdminOrders() {
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [pay, setPay] = useState("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { const p = new URLSearchParams(window.location.search).get("payment_status"); if (p) setPay(p); }, []);
  const filters = `q=${encodeURIComponent(q)}&status=${status}&payment_status=${pay}&from=${from}&to=${to}`;
  const { data, error } = useAdminData<{ data: Row[]; meta: { total: number; last_page: number } }>(`/admin/orders?${filters}&page=${page}`);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="display-section">Orders</h1>
        <button onClick={() => downloadFile(`/admin/orders/export?${filters}`, "khelzo-orders.csv").catch((e) => setMsg(e.message))} className="btn btn-sm btn-white">Export CSV</button></div>
      {msg && <p role="status" className="rounded-xl bg-sun/40 p-3 text-sm font-bold">{msg}</p>}
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <input className={`${fld} max-w-xs`} placeholder="Search order, name, email, phone" aria-label="Search orders" value={q} onChange={(e) => reset(setQ)(e.target.value)} />
          <select className={`${fld} max-w-[200px]`} aria-label="Filter by status" value={status} onChange={(e) => reset(setStatus)(e.target.value)}><option value="">All statuses</option>{Object.entries(STATUS_LABEL).filter(([k]) => k !== "pending_payment").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className={`${fld} max-w-[180px]`} aria-label="Filter by payment" value={pay} onChange={(e) => reset(setPay)(e.target.value)}><option value="">Any payment</option>{["paid", "cod_due", "refunded", "refund_pending", "failed"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select>
          <label className="flex items-center gap-2 text-xs font-black uppercase text-ink-soft">From<input type="date" className={`${fld} max-w-[160px]`} value={from} onChange={(e) => reset(setFrom)(e.target.value)} /></label>
          <label className="flex items-center gap-2 text-xs font-black uppercase text-ink-soft">To<input type="date" className={`${fld} max-w-[160px]`} value={to} onChange={(e) => reset(setTo)(e.target.value)} /></label>
        </div>
        {!data ? <Loading error={error} /> : data.data.length === 0 ? <p className="font-bold text-ink-soft">No orders found.</p> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm font-semibold"><thead><tr><Th>Order</Th><Th>Customer</Th><Th>Date</Th><Th>Payment</Th><Th>Status</Th><Th>Total</Th></tr></thead>
            <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">{data.data.map((o) => (
              <tr key={o.number}><Td><Link href={`/admin/orders/${o.number}`} className="font-extrabold text-purple">{o.number}</Link></Td><Td>{o.customer}</Td><Td>{new Date(o.created_at).toLocaleDateString("en-IN")}</Td><Td>{o.payment_method.toUpperCase()} · {o.payment_status.replace("_", " ")}</Td><Td><span className="rounded-full bg-sun px-2.5 py-0.5 text-xs font-black">{STATUS_LABEL[o.status] ?? o.status}</span></Td><Td className="font-black">{inr(o.total)}</Td></tr>))}</tbody></table></div>
        )}
        <Pager page={page} last={data?.meta.last_page ?? 1} onPage={setPage} />
      </Card>
    </>
  );
}

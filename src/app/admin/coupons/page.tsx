"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Card, Loading, Table, Td, fld, useAdminData } from "@/components/admin/ui";

interface Coupon { id: number; code: string; description: string | null; type: string; value: number; min_order: number; max_discount: number | null; first_order_only: boolean; used_count: number; usage_limit: number | null; expires_at: string | null; active: boolean }
const blank = { code: "", description: "", type: "percent", value: "10", min_order: "0", max_discount: "", usage_limit: "", expires_at: "", first_order_only: false };

export default function Coupons() {
  const { data, error, reload } = useAdminData<{ data: Coupon[] }>("/admin/coupons");
  const [f, setF] = useState(blank);
  const [err, setErr] = useState<string | null>(null);
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      await api("/admin/coupons", { body: { code: f.code, description: f.description || null, type: f.type, value: Number(f.value) || 0, min_order: Number(f.min_order) || 0, max_discount: f.max_discount ? Number(f.max_discount) : null, usage_limit: f.usage_limit ? Number(f.usage_limit) : null, expires_at: f.expires_at || null, first_order_only: f.first_order_only, active: true } });
      setF(blank); await reload();
    } catch (x) { setErr(x instanceof ApiError ? x.message : "Failed"); }
  };
  return (
    <>
      <h1 className="display-section">Coupons</h1>
      <Card title="New coupon">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-3">
          <input required className={fld} placeholder="CODE" aria-label="Code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
          <select className={fld} aria-label="Type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Percentage</option><option value="fixed">Fixed amount (₹)</option><option value="free_shipping">Free shipping</option></select>
          <input className={fld} type="number" placeholder="Value" aria-label="Value" disabled={f.type === "free_shipping"} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
          <input className={fld} type="number" placeholder="Min order ₹" aria-label="Minimum order" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} />
          <input className={fld} type="number" placeholder="Max discount ₹" aria-label="Maximum discount" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} />
          <input className={fld} type="number" placeholder="Usage limit" aria-label="Usage limit" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} />
          <input className={fld} type="date" aria-label="Expiry date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} />
          <input className={fld} placeholder="Description" aria-label="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={f.first_order_only} onChange={(e) => setF({ ...f, first_order_only: e.target.checked })} /> First order only</label>
          {err && <p role="alert" className="text-sm font-bold text-berry sm:col-span-3">{err}</p>}
          <button className="btn btn-sm btn-purple w-fit">Create coupon</button>
        </form>
      </Card>
      <Card>{!data ? <Loading error={error} /> : <Table>{data.data.map((c) => (
        <tr key={c.id}><Td><b>{c.code}</b><br /><span className="text-xs text-ink-soft">{c.description}</span></Td><Td>{c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? `₹${c.value}` : "Free shipping"}</Td><Td>Min ₹{c.min_order}</Td><Td>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""} used</Td><Td>{c.expires_at ? c.expires_at.slice(0, 10) : "No expiry"}</Td>
          <Td className="text-right"><button onClick={() => api(`/admin/coupons/${c.id}`, { method: "PUT", body: { ...c, active: !c.active, expires_at: c.expires_at?.slice(0, 10) ?? null } }).then(reload)} className={`font-extrabold ${c.active ? "text-mint-deep" : "text-ink-soft"}`}>{c.active ? "Active" : "Inactive"}</button><button onClick={() => confirm(`Delete ${c.code}?`) && api(`/admin/coupons/${c.id}`, { method: "DELETE" }).then(reload)} className="ml-3 font-extrabold text-berry">Delete</button></Td></tr>))}</Table>}</Card>
    </>
  );
}

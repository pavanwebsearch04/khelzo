"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, useAdminData } from "@/components/admin/ui";

interface R { id: number; type: string; reason: string; status: string; order: string; customer: string; total: number }

export default function Returns() {
  const { data, error, reload } = useAdminData<{ data: R[] }>("/admin/returns");
  const [msg, setMsg] = useState<string | null>(null);
  const update = async (r: R, status: string) => {
    const note = status === "rejected" ? prompt("Reason shown to the customer (optional):") ?? undefined : undefined;
    if (status === "refunded" && !confirm(`Refund ${inr(r.total)} for order ${r.order}? Online payments are refunded through Razorpay.`)) return;
    setMsg(null);
    try { await api(`/admin/returns/${r.id}`, { method: "PUT", body: { status, admin_note: note } }); setMsg(`Return ${status}.`); } catch (e) { setMsg(e instanceof ApiError ? e.message : "Failed"); }
    await reload();
  };
  return (
    <>
      <h1 className="display-section">Returns &amp; refunds</h1>
      <p className="text-sm font-semibold text-ink-soft">Marking a return &quot;Refunded&quot; sends the money back through Razorpay for online orders (admins only). For Cash on Delivery orders, pay the customer manually first. The customer is emailed on every update.</p>
      {msg && <p role="status" className="rounded-xl bg-sun/40 p-3 text-sm font-bold">{msg}</p>}
      <Card>{!data ? <Loading error={error} /> : data.data.length === 0 ? <p className="font-bold text-ink-soft">No return requests.</p> : <Table>{data.data.map((r) => (
        <tr key={r.id}><Td><b>{r.order}</b><br /><span className="text-xs text-ink-soft">{r.customer} · {inr(r.total)}</span></Td><Td className="capitalize">{r.type}</Td><Td className="max-w-xs">{r.reason}</Td>
          <Td className="text-right"><select aria-label="Return status" value={r.status} onChange={(e) => void update(r, e.target.value)} className="rounded-lg border-2 border-ink px-2 py-1 text-xs font-bold">{["requested", "approved", "rejected", "received", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}</select></Td></tr>))}</Table>}</Card>
    </>
  );
}

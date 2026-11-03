"use client";

import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, useAdminData } from "@/components/admin/ui";

interface R { id: number; type: string; reason: string; status: string; order: string; customer: string; total: number }

export default function Returns() {
  const { data, error, reload } = useAdminData<{ data: R[] }>("/admin/returns");
  return (
    <>
      <h1 className="display-section">Returns &amp; refunds</h1>
      <p className="text-sm font-semibold text-ink-soft">Marking a return &quot;Refunded&quot; updates the order record. Issue the actual money refund from your Razorpay dashboard.</p>
      <Card>{!data ? <Loading error={error} /> : data.data.length === 0 ? <p className="font-bold text-ink-soft">No return requests.</p> : <Table>{data.data.map((r) => (
        <tr key={r.id}><Td><b>{r.order}</b><br /><span className="text-xs text-ink-soft">{r.customer} · {inr(r.total)}</span></Td><Td className="capitalize">{r.type}</Td><Td className="max-w-xs">{r.reason}</Td>
          <Td className="text-right"><select aria-label="Return status" value={r.status} onChange={(e) => api(`/admin/returns/${r.id}`, { method: "PUT", body: { status: e.target.value } }).then(reload)} className="rounded-lg border-2 border-ink px-2 py-1 text-xs font-bold">{["requested", "approved", "rejected", "received", "refunded"].map((s) => <option key={s} value={s} disabled={s === "requested"}>{s}</option>)}</select></Td></tr>))}</Table>}</Card>
    </>
  );
}

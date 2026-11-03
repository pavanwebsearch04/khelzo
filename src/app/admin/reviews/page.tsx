"use client";

import { api } from "@/lib/api";
import { Card, Loading, Table, Td, useAdminData } from "@/components/admin/ui";

interface R { id: number; product: string; customer: string; rating: number; title: string | null; body: string | null; status: string; date: string }

export default function AdminReviews() {
  const { data, error, reload } = useAdminData<{ data: R[] }>("/admin/reviews");
  return (
    <>
      <h1 className="display-section">Review moderation</h1>
      <Card>{!data ? <Loading error={error} /> : data.data.length === 0 ? <p className="font-bold text-ink-soft">No reviews yet. They appear when verified buyers post them.</p> : <Table>{data.data.map((r) => (
        <tr key={r.id}><Td><b>{r.product}</b><br /><span className="text-xs text-ink-soft">{r.customer} · {r.date}</span></Td><Td>{"★".repeat(r.rating)}</Td><Td className="max-w-xs">{r.title && <b>{r.title}. </b>}{r.body}</Td>
          <Td className="text-right"><select aria-label="Status" value={r.status} onChange={(e) => api(`/admin/reviews/${r.id}`, { method: "PUT", body: { status: e.target.value } }).then(reload)} className="rounded-lg border-2 border-ink px-2 py-1 text-xs font-bold"><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select>
            <button onClick={() => confirm("Delete review?") && api(`/admin/reviews/${r.id}`, { method: "DELETE" }).then(reload)} className="ml-2 font-extrabold text-berry">Delete</button></Td></tr>))}</Table>}</Card>
    </>
  );
}

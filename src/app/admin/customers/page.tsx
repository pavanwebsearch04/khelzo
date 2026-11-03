"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, fld, useAdminData } from "@/components/admin/ui";

interface C { id: number; name: string; email: string; phone: string | null; is_active: boolean; orders: number; spent: number; joined: string }
interface Detail { name: string; orders: { number: string; status: string; total: number; created_at: string }[] }

export default function Customers() {
  const [q, setQ] = useState("");
  const { data, error, reload } = useAdminData<{ data: C[] }>(`/admin/customers?q=${encodeURIComponent(q)}`);
  const [open, setOpen] = useState<Detail | null>(null);
  return (
    <>
      <h1 className="display-section">Customers</h1>
      <Card>
        <input className={`${fld} mb-4 max-w-xs`} placeholder="Search name, email, phone" aria-label="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
        {!data ? <Loading error={error} /> : <Table>{data.data.map((c) => (
          <tr key={c.id}><Td><b>{c.name}</b><br /><span className="text-xs text-ink-soft">{c.email} {c.phone && `· ${c.phone}`}</span></Td><Td>{c.orders} orders</Td><Td>{inr(c.spent)}</Td><Td>{c.joined}</Td>
            <Td className="text-right"><button onClick={() => api<Detail>(`/admin/customers/${c.id}`).then(setOpen)} className="font-extrabold text-purple">Orders</button>
              <button onClick={() => api(`/admin/customers/${c.id}`, { method: "PUT", body: { is_active: !c.is_active } }).then(reload)} className={`ml-3 font-extrabold ${c.is_active ? "text-berry" : "text-mint-deep"}`}>{c.is_active ? "Disable" : "Enable"}</button></Td></tr>))}</Table>}
      </Card>
      {open && <Card title={`${open.name}'s orders`} action={<button onClick={() => setOpen(null)} className="text-sm font-extrabold">Close</button>}>{open.orders.length === 0 ? <p className="font-bold text-ink-soft">No orders yet.</p> : <Table>{open.orders.map((o) => <tr key={o.number}><Td>{o.number}</Td><Td>{o.status}</Td><Td>{inr(o.total)}</Td></tr>)}</Table>}</Card>}
    </>
  );
}

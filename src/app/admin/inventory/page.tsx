"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Loading, Pager, Table, Td, Th, useAdminData } from "@/components/admin/ui";

interface Move { id: number; name: string; sku: string; change: number; reason: string; reference: string | null; created_at: string }
interface Prod { id: number; name: string; sku: string; stock: number; category_name: string }

export default function Inventory() {
  const [page, setPage] = useState(1);
  const low = useAdminData<{ data: Prod[] }>("/admin/products?low_stock=1&per_page=50");
  const moves = useAdminData<{ data: Move[]; meta: { last_page: number } }>(`/admin/inventory?page=${page}`);
  return (
    <>
      <h1 className="display-section">Inventory</h1>
      <Card title="Low & out of stock" action={<Link href="/admin/products" className="text-sm font-extrabold text-purple">Edit products →</Link>}>
        {!low.data ? <Loading error={low.error} /> : low.data.data.length === 0 ? <p className="font-bold text-ink-soft">Everything is well stocked.</p> : (
          <Table>{low.data.data.map((p) => <tr key={p.id}><Td><b>{p.name}</b><br /><span className="text-xs text-ink-soft">{p.sku} · {p.category_name}</span></Td><Td className={`text-right font-black ${p.stock === 0 ? "text-berry" : "text-tangerine-deep"}`}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</Td></tr>)}</Table>
        )}
      </Card>
      <Card title="Stock movements">
        {!moves.data ? <Loading error={moves.error} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm font-semibold"><thead><tr><Th>When</Th><Th>Product</Th><Th>Change</Th><Th>Reason</Th><Th>Reference</Th></tr></thead>
            <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">{moves.data.data.map((m) => (
              <tr key={m.id}><Td>{new Date(m.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</Td><Td>{m.name}<br /><span className="text-xs text-ink-soft">{m.sku}</span></Td>
                <Td className={`font-black ${m.change < 0 ? "text-berry" : "text-mint-deep"}`}>{m.change > 0 ? "+" : ""}{m.change}</Td><Td>{m.reason}</Td><Td className="text-ink-soft">{m.reference}</Td></tr>))}</tbody></table></div>
        )}
        <Pager page={page} last={moves.data?.meta.last_page ?? 1} onPage={setPage} />
      </Card>
    </>
  );
}

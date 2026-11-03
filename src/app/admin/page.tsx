"use client";

import Link from "next/link";
import { STATUS_LABEL } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, useAdminData } from "@/components/admin/ui";

interface Dash {
  revenue: number; orders: number; pending: number; completed: number; customers: number; products: number;
  low_stock: { id: number; name: string; sku: string; stock: number }[]; bestsellers: { id: number; name: string; sold_count: number; price: number }[];
  recent_orders: { number: string; customer: string; status: string; total: number }[]; sales: { date: string; revenue: number; orders: number }[];
}

export default function Dashboard() {
  const { data: d, error } = useAdminData<Dash>("/admin/dashboard");
  if (!d) return <Loading error={error} />;
  const max = Math.max(1, ...d.sales.map((s) => s.revenue));
  const stats = [["Revenue", inr(d.revenue)], ["Orders", d.orders], ["Pending", d.pending], ["Completed", d.completed], ["Customers", d.customers], ["Products", d.products]] as const;
  return (
    <>
      <h1 className="display-section">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{stats.map(([k, v]) => <div key={k} className="rounded-2xl border-2 border-ink bg-white p-4"><div className="text-xs font-black uppercase tracking-wider text-ink-soft">{k}</div><div className="mt-1 font-display text-2xl font-bold">{v}</div></div>)}</div>
      <Card title="Sales, last 14 days">
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Daily revenue chart">
          {d.sales.map((s) => <div key={s.date} className="group relative flex-1"><div className="rounded-t-md bg-purple transition-colors group-hover:bg-tangerine" style={{ height: `${Math.max(3, (s.revenue / max) * 100)}%` }} /><span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-bold text-white group-hover:block">{s.date.slice(5)} · {inr(s.revenue)} · {s.orders} orders</span></div>)}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-extrabold text-purple">All orders →</Link>}>
          <Table>{d.recent_orders.map((o) => <tr key={o.number}><Td><Link href={`/admin/orders/${o.number}`} className="font-extrabold text-purple">{o.number}</Link></Td><Td>{o.customer}</Td><Td>{STATUS_LABEL[o.status] ?? o.status}</Td><Td className="text-right font-black">{inr(o.total)}</Td></tr>)}</Table>
        </Card>
        <Card title="Low stock" action={<Link href="/admin/products?low=1" className="text-sm font-extrabold text-purple">Manage →</Link>}>
          {d.low_stock.length === 0 ? <p className="font-bold text-ink-soft">All products are well stocked.</p> : <Table>{d.low_stock.map((p) => <tr key={p.id}><Td>{p.name}</Td><Td>{p.sku}</Td><Td className={`text-right font-black ${p.stock === 0 ? "text-berry" : "text-tangerine-deep"}`}>{p.stock} left</Td></tr>)}</Table>}
        </Card>
        <Card title="Bestsellers"><Table>{d.bestsellers.map((p) => <tr key={p.id}><Td>{p.name}</Td><Td className="text-right">{p.sold_count} sold</Td></tr>)}</Table></Card>
      </div>
    </>
  );
}

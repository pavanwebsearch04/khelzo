"use client";

import Link from "next/link";
import { STATUS_LABEL } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Table, Td, useAdminData } from "@/components/admin/ui";

interface Dash {
  revenue: number; orders: number; pending: number; completed: number; customers: number; products: number;
  pending_reviews: number; pending_returns: number; refund_pending: number; low_stock_threshold: number;
  categories_sales: { name: string; revenue: number; units: number }[]; top_customers: { user_id: number; customer_name: string; spent: number; orders: number }[];
  low_stock: { id: number; name: string; sku: string; stock: number }[]; bestsellers: { id: number; name: string; sold_count: number; price: number }[];
  recent_orders: { number: string; customer: string; status: string; total: number }[]; sales: { date: string; revenue: number; orders: number }[];
}

export default function Dashboard() {
  const { data: d, error } = useAdminData<Dash>("/admin/dashboard");
  if (!d) return <Loading error={error} />;
  const max = Math.max(1, ...d.sales.map((s) => s.revenue));
  const catMax = Math.max(1, ...d.categories_sales.map((c) => Number(c.revenue)));
  const stats = [["Revenue", inr(d.revenue)], ["Orders", d.orders], ["Pending", d.pending], ["Completed", d.completed], ["Customers", d.customers], ["Products", d.products]] as const;
  const alerts = [
    d.pending_returns > 0 && { t: `${d.pending_returns} return request${d.pending_returns > 1 ? "s" : ""} waiting`, href: "/admin/returns" },
    d.pending_reviews > 0 && { t: `${d.pending_reviews} review${d.pending_reviews > 1 ? "s" : ""} to moderate`, href: "/admin/reviews" },
    d.refund_pending > 0 && { t: `${d.refund_pending} refund${d.refund_pending > 1 ? "s" : ""} need attention`, href: "/admin/orders?payment_status=refund_pending" },
    d.low_stock.length > 0 && { t: `${d.low_stock.length} product${d.low_stock.length > 1 ? "s" : ""} low on stock (≤ ${d.low_stock_threshold})`, href: "/admin/inventory" },
  ].filter(Boolean) as { t: string; href: string }[];
  return (
    <>
      <h1 className="display-section">Dashboard</h1>
      {alerts.length > 0 && <ul className="flex flex-wrap gap-2">{alerts.map((a) => <li key={a.t}><Link href={a.href} className="inline-flex rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-extrabold hover:bg-tangerine hover:text-white">⚠ {a.t}</Link></li>)}</ul>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{stats.map(([k, v]) => <div key={k} className="rounded-2xl border-2 border-ink bg-white p-4"><div className="text-xs font-black uppercase tracking-wider text-ink-soft">{k}</div><div className="mt-1 font-display text-2xl font-bold">{v}</div></div>)}</div>
      <Card title="Sales, last 14 days">
        <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Daily revenue chart">
          {d.sales.map((s) => <div key={s.date} className="group relative flex-1"><div className="rounded-t-md bg-purple transition-colors group-hover:bg-tangerine" style={{ height: `${Math.max(3, (s.revenue / max) * 100)}%` }} /><span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-bold text-white group-hover:block">{s.date.slice(5)} · {inr(s.revenue)} · {s.orders} orders</span></div>)}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Sales by category">
          {d.categories_sales.length === 0 ? <p className="font-bold text-ink-soft">No sales yet.</p> : (
            <ul className="space-y-2">{d.categories_sales.map((c) => (
              <li key={c.name} className="text-sm font-bold"><div className="flex justify-between"><span>{c.name}</span><span>{inr(Number(c.revenue))} · {c.units} units</span></div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-cream-deep"><div className="h-full rounded-full bg-mint-deep" style={{ width: `${(Number(c.revenue) / catMax) * 100}%` }} /></div></li>))}</ul>
          )}
        </Card>
        <Card title="Top customers">
          {d.top_customers.length === 0 ? <p className="font-bold text-ink-soft">No customer orders yet.</p> : <Table>{d.top_customers.map((c) => <tr key={c.user_id}><Td><Link href={`/admin/customers?q=${encodeURIComponent(c.customer_name)}`} className="font-extrabold text-purple">{c.customer_name}</Link></Td><Td>{c.orders} orders</Td><Td className="text-right font-black">{inr(Number(c.spent))}</Td></tr>)}</Table>}
        </Card>
        <Card title="Recent orders" action={<Link href="/admin/orders" className="text-sm font-extrabold text-purple">All orders →</Link>}>
          <Table>{d.recent_orders.map((o) => <tr key={o.number}><Td><Link href={`/admin/orders/${o.number}`} className="font-extrabold text-purple">{o.number}</Link></Td><Td>{o.customer}</Td><Td>{STATUS_LABEL[o.status] ?? o.status}</Td><Td className="text-right font-black">{inr(o.total)}</Td></tr>)}</Table>
        </Card>
        <Card title="Low stock" action={<Link href="/admin/inventory" className="text-sm font-extrabold text-purple">Inventory →</Link>}>
          {d.low_stock.length === 0 ? <p className="font-bold text-ink-soft">All products are well stocked.</p> : <Table>{d.low_stock.map((p) => <tr key={p.id}><Td>{p.name}</Td><Td>{p.sku}</Td><Td className={`text-right font-black ${p.stock === 0 ? "text-berry" : "text-tangerine-deep"}`}>{p.stock} left</Td></tr>)}</Table>}
        </Card>
        <Card title="Bestsellers"><Table>{d.bestsellers.map((p) => <tr key={p.id}><Td>{p.name}</Td><Td className="text-right">{p.sold_count} sold</Td></tr>)}</Table></Card>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { use, useState } from "react";
import { STATUS_LABEL, api, type ApiOrder } from "@/lib/api";
import { inr } from "@/lib/format";
import { Timeline } from "@/components/orders/OrderView";
import { Card, Loading, fld, openHtml, useAdminData } from "@/components/admin/ui";
import { useAuth } from "@/components/providers/AuthProvider";

const STATUSES = ["order_placed", "payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned", "refunded"];

export default function AdminOrder({ params }: { params: Promise<{ number: string }> }) {
  const { number } = use(params);
  const { data: o, error, reload } = useAdminData<ApiOrder>(`/admin/orders/${number}`);
  const [status, setStatus] = useState(""); const [note, setNote] = useState("");
  const [t, setT] = useState({ carrier: "", tracking_number: "", tracking_url: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState<string | null>(null);
  const [refundAmt, setRefundAmt] = useState("");
  const { user } = useAuth();
  if (!o) return <Loading error={error} />;
  const canRefund = user?.role === "admin" && o.payment_method !== "cod" && (o.payment_status === "paid" || o.payment_status === "refund_pending");
  const run = async (fn: () => Promise<unknown>, ok: string) => { setMsg(null); try { await fn(); await reload(); setMsg(ok); } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } };
  return (
    <>
      <Link href="/admin/orders" className="text-sm font-extrabold text-purple">← All orders</Link>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="display-section">Order {o.number}</h1>
        <button onClick={() => openHtml(`/admin/orders/${o.number}/invoice`).catch((e) => setMsg(e.message))} className="btn btn-sm btn-white">Invoice / Print</button></div>
      {msg && <p role="status" className="rounded-xl bg-sun/40 p-3 text-sm font-bold">{msg}</p>}
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Items"><ul className="divide-y-2 divide-ink/10">{o.items.map((i, n) => <li key={n} className="flex justify-between gap-3 py-2 text-sm font-semibold"><span>{i.name}{i.variant_label ? ` — ${i.variant_label}` : ""} <span className="text-ink-soft">({i.sku}) × {i.qty}</span></span><b>{i.line_total != null ? inr(i.line_total) : ""}</b></li>)}</ul>
            <dl className="mt-3 space-y-1 text-sm font-bold"><div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>{o.discount > 0 && <div className="flex justify-between"><dt>Discount {o.coupon_code}</dt><dd>-{inr(o.discount)}</dd></div>}<div className="flex justify-between"><dt>Shipping</dt><dd>{inr(o.shipping)}</dd></div><div className="flex justify-between text-lg font-black"><dt>Total</dt><dd>{inr(o.total)}</dd></div></dl></Card>
          <Card title="Timeline"><Timeline order={o} /></Card>
        </div>
        <div className="space-y-6">
          <Card title="Update status">
            <div className="space-y-3">
              <select className={fld} aria-label="New status" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Choose status (now: {STATUS_LABEL[o.status] ?? o.status})</option>{STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
              <input className={fld} placeholder="Note (optional)" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
              <button disabled={!status} onClick={() => run(() => api(`/admin/orders/${o.number}/status`, { body: { status, note: note || undefined } }), "Status updated.").then(() => { setStatus(""); setNote(""); })} className="btn btn-sm btn-purple disabled:opacity-50">Update</button>
            </div>
          </Card>
          <Card title="Tracking">
            <form onSubmit={(e) => { e.preventDefault(); void run(() => api(`/admin/orders/${o.number}/tracking`, { method: "PUT", body: { ...t, tracking_url: t.tracking_url || undefined } }), "Tracking saved."); }} className="space-y-3">
              <input className={fld} required placeholder={o.shipment?.carrier ?? "Carrier"} aria-label="Carrier" value={t.carrier} onChange={(e) => setT({ ...t, carrier: e.target.value })} />
              <input className={fld} required placeholder={o.shipment?.tracking_number ?? "Tracking number"} aria-label="Tracking number" value={t.tracking_number} onChange={(e) => setT({ ...t, tracking_number: e.target.value })} />
              <input className={fld} type="url" placeholder="Tracking URL (optional)" aria-label="Tracking URL" value={t.tracking_url} onChange={(e) => setT({ ...t, tracking_url: e.target.value })} />
              <button className="btn btn-sm btn-white">Save tracking</button>
            </form>
          </Card>
          <Card title="Customer"><p className="text-sm font-semibold">{o.customer?.name}<br />{o.customer?.email}<br />{o.customer?.phone}{o.customer?.whatsapp ? ` · WhatsApp ${o.customer.whatsapp}` : ""}</p>
            <p className="mt-3 text-sm font-semibold text-ink-soft">{o.address?.line1}, {o.address?.line2}<br />{o.address?.city}, {o.address?.state} {o.address?.pincode}</p>
            <p className="mt-3 text-sm font-bold">Payment: {o.payment_method.toUpperCase()} · {o.payment_status.replace("_", " ")}{o.refund_id ? ` · refund ${o.refund_id}` : ""}</p>
            {o.instructions && <p className="mt-2 rounded-lg bg-cream p-2 text-sm font-semibold">Customer note: {o.instructions}</p>}</Card>
          {canRefund && (
            <Card title="Refund (Razorpay)">
              <p className="text-sm font-semibold text-ink-soft">Refunds the captured payment to the customer&apos;s original method. Leave the amount empty for a full refund.</p>
              <div className="mt-3 flex gap-2"><input type="number" min={1} className={fld} placeholder={`Full ${inr(o.total)}`} aria-label="Refund amount" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
                <button onClick={() => confirm("Issue this refund through Razorpay? This cannot be undone.") && run(() => api(`/admin/orders/${o.number}/refund`, { body: refundAmt ? { amount: Number(refundAmt) } : {} }), "Refund issued.")} className="btn btn-sm btn-orange">Refund</button></div>
            </Card>
          )}
          <Card title="Internal note">
            <textarea rows={3} aria-label="Internal note" className="w-full rounded-xl border-2 border-ink p-3 text-sm font-semibold" placeholder="Only staff can see this" value={adminNote ?? o.admin_note ?? ""} onChange={(e) => setAdminNote(e.target.value)} />
            <button onClick={() => run(() => api(`/admin/orders/${o.number}/note`, { method: "PUT", body: { admin_note: adminNote ?? o.admin_note ?? "" } }), "Note saved.")} className="btn btn-sm btn-white mt-2">Save note</button>
          </Card>
        </div>
      </div>
    </>
  );
}

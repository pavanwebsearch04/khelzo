"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, PackageCheck, Truck, XCircle } from "lucide-react";
import { ApiError, STATUS_LABEL, api, imgUrl, type ApiOrder } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAuth } from "@/components/providers/AuthProvider";

const FLOW = ["order_placed", "payment_confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];
const BAD = ["cancelled", "payment_failed", "return_requested", "returned", "refunded"];
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function Timeline({ order }: { order: ApiOrder }) {
  const done = new Map((order.timeline ?? []).map((e) => [e.status, e]));
  const idx = FLOW.reduce((n, s, i) => (done.has(s) ? i : n), -1);
  const extras = (order.timeline ?? []).filter((e) => BAD.includes(e.status));
  return (
    <div>
      <ol className="relative space-y-0">
        {FLOW.map((s, i) => {
          const ev = done.get(s);
          const state = ev ? "done" : i === idx + 1 && !extras.some((e) => e.status === "cancelled") ? "next" : "todo";
          return (
            <li key={s} className="relative flex gap-4 pb-6 last:pb-0">
              {i < FLOW.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-0.5 ${i < idx ? "bg-mint-deep" : "bg-ink/15"}`} aria-hidden="true" />}
              <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 ${state === "done" ? "border-mint-deep bg-mint text-ink" : state === "next" ? "border-purple bg-white text-purple" : "border-ink/20 bg-white text-ink/30"}`}>
                {state === "done" ? <CheckCircle2 size={18} /> : s === "shipped" || s === "out_for_delivery" ? <Truck size={16} /> : s === "delivered" ? <PackageCheck size={16} /> : <Circle size={14} />}
              </span>
              <div className="pt-0.5">
                <p className={`font-extrabold ${state === "todo" ? "text-ink/40" : ""}`}>{STATUS_LABEL[s]}</p>
                {ev && <p className="text-sm font-semibold text-ink-soft">{when(ev.at)}{ev.note ? ` · ${ev.note}` : ""}</p>}
                {state === "next" && <p className="text-sm font-semibold text-purple">Up next</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {extras.length > 0 && (
        <ul className="mt-5 space-y-2">{extras.map((e) => <li key={e.status + e.at} className="flex items-start gap-2 rounded-xl bg-berry/10 p-3 text-sm font-bold text-berry"><XCircle size={18} className="mt-0.5 shrink-0" />{STATUS_LABEL[e.status]} · {when(e.at)}{e.note ? ` · ${e.note}` : ""}</li>)}</ul>
      )}
    </div>
  );
}

export function OrderView({ number, fresh = false }: { number: string; fresh?: boolean }) {
  const { user, ready } = useAuth();
  const [o, setO] = useState<ApiOrder | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [rtype, setRtype] = useState<"return" | "refund">("return");
  const [showRet, setShowRet] = useState(false);

  const load = useCallback(async () => {
    try {
      const mine = user ? await api<ApiOrder>(`/account/orders/${number}`).catch(() => null) : null;
      setO(mine ?? (await api<ApiOrder>(`/orders/track/${number}`, { guestOrder: number })));
    } catch (e) { setErr(e instanceof ApiError && e.status === 404 ? "We couldn't find that order. If you ordered as a guest, open it on the device you used to order, or log in." : e instanceof Error ? e.message : "Could not load order"); }
  }, [number, user]);
  useEffect(() => { if (ready) void load(); }, [ready, load]);

  if (err) return <div className="container-k py-20 text-center"><h1 className="font-display text-3xl font-bold">Order not found</h1><p className="mx-auto mt-2 max-w-md text-ink-soft">{err}</p><Link href="/account" className="btn btn-purple mt-5">Log in</Link></div>;
  if (!o) return <div className="container-k py-24 text-center font-display text-2xl">Loading your order…</div>;

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); await load(); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } setBusy(false); };
  const placed = o.status !== "payment_failed" && o.status !== "pending_payment";
  const payLabel = o.payment_status === "paid" ? "Paid" : o.payment_status === "cod_due" ? "Pay on delivery" : o.payment_status === "refunded" ? "Refunded" : o.payment_status === "failed" ? "Payment failed" : "Awaiting payment";

  return (
    <div className="container-k max-w-5xl py-10">
      {fresh && placed && (
        <div className="mb-8 rounded-[32px] border-2 border-ink bg-mint p-6 text-center shadow-[0_8px_0_0_var(--color-ink)] md:p-10">
          <CheckCircle2 size={48} className="mx-auto" />
          <h1 className="mt-3 font-display text-4xl font-bold">Thank you! Your order is placed.</h1>
          <p className="mt-2 font-bold">Order <span className="rounded-lg bg-white px-2 py-0.5">{o.number}</span> · Keep this number to track your order</p>
        </div>
      )}
      {!fresh && <h1 className="display-section">Order {o.number}</h1>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border-2 border-ink bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-display text-2xl font-bold">Order tracking</h2><span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-sm font-black">{STATUS_LABEL[o.status] ?? o.status}</span></div>
            <div className="mt-5"><Timeline order={o} /></div>
            {o.shipment && <p className="mt-5 rounded-xl bg-cream p-3 text-sm font-bold">Shipped with {o.shipment.carrier} · Tracking no. {o.shipment.tracking_number} {o.shipment.tracking_url && <a href={o.shipment.tracking_url} target="_blank" rel="noopener noreferrer" className="text-purple underline">Track on carrier site</a>}</p>}
            {o.status === "payment_failed" || o.status === "pending_payment" ? <p className="mt-4 rounded-xl bg-berry/10 p-3 text-sm font-bold text-berry">This order is waiting for payment. Unpaid orders are released after 30 minutes. <Link href="/shop" className="underline">Back to shop</Link></p> : null}
          </section>

          <section className="rounded-[28px] border-2 border-ink bg-white p-6">
            <h2 className="font-display text-2xl font-bold">Items</h2>
            <ul className="mt-4 divide-y-2 divide-ink/10">
              {o.items.map((i, n) => (
                <li key={n} className="flex items-center gap-4 py-3">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-xl border-2 border-ink">{i.image && <Image src={imgUrl(i.image)} alt="" fill sizes="64px" className="object-cover" />}</span>
                  <span className="min-w-0 flex-1"><b className="block leading-snug">{i.name}</b><span className="text-sm font-semibold text-ink-soft">Qty {i.qty} × {i.unit_price != null ? inr(i.unit_price) : ""}</span>
                    {o.status === "delivered" && i.id && !o.reviewed_item_ids?.includes(i.id) && i.product_id && <Link href={`/product/${i.product_id}#reviews`} className="ml-3 text-sm font-extrabold text-purple underline">Write a review</Link>}</span>
                  <b>{i.line_total != null ? inr(i.line_total) : ""}</b>
                </li>
              ))}
            </ul>
          </section>

          {user && (o.can_cancel || o.can_return) && (
            <section className="rounded-[28px] border-2 border-ink bg-white p-6">
              <h2 className="font-display text-2xl font-bold">Need help with this order?</h2>
              {o.can_cancel && <button disabled={busy} onClick={() => confirm("Cancel this order?") && act(() => api(`/account/orders/${o.number}/cancel`, { method: "POST", body: {} }))} className="btn btn-white mt-3">Cancel order</button>}
              {o.can_return && !showRet && <button onClick={() => setShowRet(true)} className="btn btn-white mt-3">Return or refund</button>}
              {showRet && (
                <form onSubmit={(e) => { e.preventDefault(); void act(() => api(`/account/orders/${o.number}/return`, { body: { type: rtype, reason } })).then(() => setShowRet(false)); }} className="mt-3 space-y-3">
                  <div className="flex gap-2">{(["return", "refund"] as const).map((t) => <label key={t} className={`cursor-pointer rounded-full border-2 border-ink px-4 py-1.5 text-sm font-extrabold capitalize ${rtype === t ? "bg-purple text-white" : ""}`}><input type="radio" className="sr-only" checked={rtype === t} onChange={() => setRtype(t)} />{t}</label>)}</div>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={5} rows={3} placeholder="Tell us what went wrong" className="w-full rounded-2xl border-2 border-ink p-3 font-semibold" />
                  <button disabled={busy} className="btn btn-purple">Submit request</button>
                </form>
              )}
              {o.returns?.map((r) => <p key={r.id} className="mt-3 text-sm font-bold">Return request: {r.type} · {r.status}</p>)}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="rounded-[28px] border-2 border-ink bg-white p-6">
            <h2 className="font-display text-xl font-bold">Summary</h2>
            <dl className="mt-3 space-y-1.5 text-sm font-bold">
              <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between text-mint-deep"><dt>Discount {o.coupon_code}</dt><dd>-{inr(o.discount)}</dd></div>}
              <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between border-t-2 border-ink pt-2 text-lg font-black"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
              <div className="flex justify-between"><dt>Payment</dt><dd>{o.payment_method.toUpperCase()} · {payLabel}</dd></div>
              {o.estimated_delivery && o.status !== "delivered" && o.status !== "cancelled" && <div className="flex justify-between"><dt>Estimated delivery</dt><dd>{new Date(o.estimated_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</dd></div>}
            </dl>
          </section>
          {o.address && (
            <section className="rounded-[28px] border-2 border-ink bg-white p-6 text-sm font-semibold">
              <h2 className="font-display text-xl font-bold">Delivering to</h2>
              <p className="mt-2">{o.address.full_name}<br />{o.address.line1}, {o.address.line2}{o.address.landmark ? `, ${o.address.landmark}` : ""}<br />{o.address.city}, {o.address.state} {o.address.pincode}<br />{o.address.phone}</p>
            </section>
          )}
          <div className="flex flex-col gap-3"><Link href="/shop" className="btn btn-orange">Continue shopping</Link>{user && <Link href="/account/orders" className="btn btn-white">All my orders</Link>}</div>
        </aside>
      </div>
    </div>
  );
}

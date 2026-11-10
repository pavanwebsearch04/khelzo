"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Card, Loading, fld, useAdminData } from "@/components/admin/ui";

interface Method { id: string; label: string; fee: number; days_min: number; days_max: number }
interface Store { cod_enabled: boolean; cod_fee?: number; gst_rate: number; support_email?: string; legal_name?: string; gstin?: string; address?: string; reviews_require_approval?: boolean; low_stock_threshold?: number }
interface S { shipping: { free_above: number; blocked_pins?: string; methods: Method[] }; store: Store }

export default function Settings() {
  const { data, error } = useAdminData<S>("/admin/settings");
  const [s, setS] = useState<S | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return <Loading error={error} />;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    try { await api("/admin/settings", { method: "PUT", body: { ...s, store: { ...s.store, gstin: s.store.gstin || null, legal_name: s.store.legal_name || null, address: s.store.address || null } } }); setMsg({ ok: true, t: "Settings saved." }); }
    catch (x) { setMsg({ ok: false, t: x instanceof ApiError ? x.message : "Failed" }); }
  };
  const num = (v: string) => Number(v) || 0;
  const st = (patch: Partial<Store>) => setS({ ...s, store: { ...s.store, ...patch } });
  const lbl = "block text-xs font-black uppercase tracking-wider text-ink-soft";
  return (
    <>
      <h1 className="display-section">Store settings</h1>
      <form onSubmit={save} className="space-y-6">
        <Card title="Shipping">
          <label className={lbl}>Free shipping above (₹)<input type="number" className={`${fld} mt-1 max-w-xs`} value={s.shipping.free_above} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, free_above: num(e.target.value) } })} /></label>
          {s.shipping.methods.map((m, i) => (
            <div key={m.id} className="mt-4 grid gap-3 sm:grid-cols-4">
              <input className={fld} aria-label="Label" value={m.label} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, label: e.target.value }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} fee`} value={m.fee} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, fee: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} min days`} value={m.days_min} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, days_min: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} max days`} value={m.days_max} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, days_max: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
            </div>
          ))}
          <p className="mt-2 text-xs font-semibold text-ink-soft">Columns: label, fee (₹), minimum days, maximum days.</p>
          <label className={`${lbl} mt-5`}>Do not deliver to these PIN codes / prefixes<textarea rows={2} className="mt-1 w-full rounded-xl border-2 border-ink p-3 text-sm font-semibold normal-case tracking-normal" placeholder="Comma separated, e.g. 744101, 7440 (a prefix blocks every PIN starting with it)" value={s.shipping.blocked_pins ?? ""} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, blocked_pins: e.target.value } })} /></label>
          <p className="mt-1 text-xs font-semibold text-ink-soft">With Shiprocket credentials in the server .env, live courier serviceability is also checked.</p>
        </Card>
        <Card title="Tax & payments">
          <label className={lbl}>Default GST rate (%)<input type="number" className={`${fld} mt-1 max-w-xs`} value={s.store.gst_rate} onChange={(e) => st({ gst_rate: num(e.target.value) })} /></label>
          <label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={s.store.cod_enabled} onChange={(e) => st({ cod_enabled: e.target.checked })} /> Enable Cash on Delivery</label>
        </Card>
        <Card title="Business details (shown on invoices)">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={lbl}>Legal / trade name<input className={`${fld} mt-1`} value={s.store.legal_name ?? ""} onChange={(e) => st({ legal_name: e.target.value })} /></label>
            <label className={lbl}>GSTIN (15 characters)<input maxLength={15} className={`${fld} mt-1 uppercase`} value={s.store.gstin ?? ""} onChange={(e) => st({ gstin: e.target.value.toUpperCase() })} /></label>
            <label className={`${lbl} sm:col-span-2`}>Registered address<textarea rows={2} className="mt-1 w-full rounded-xl border-2 border-ink p-3 text-sm font-semibold normal-case tracking-normal" value={s.store.address ?? ""} onChange={(e) => st({ address: e.target.value })} /></label>
            <label className={lbl}>Support email<input type="email" className={`${fld} mt-1`} value={s.store.support_email ?? ""} onChange={(e) => st({ support_email: e.target.value })} /></label>
          </div>
        </Card>
        <Card title="Operations">
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={!!s.store.reviews_require_approval} onChange={(e) => st({ reviews_require_approval: e.target.checked })} /> Hold every new review for approval (otherwise only reviews with links or abusive words are held)</label>
          <label className={`${lbl} mt-4`}>Low-stock alert at (units)<input type="number" min={0} className={`${fld} mt-1 max-w-xs`} value={s.store.low_stock_threshold ?? 5} onChange={(e) => st({ low_stock_threshold: num(e.target.value) })} /></label>
        </Card>
        {msg && <p role="status" className={`text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t}</p>}
        <button className="btn btn-purple">Save settings</button>
      </form>
    </>
  );
}

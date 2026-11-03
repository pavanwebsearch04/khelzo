"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, Loading, fld, useAdminData } from "@/components/admin/ui";

interface Method { id: string; label: string; fee: number; days_min: number; days_max: number }
interface S { shipping: { free_above: number; methods: Method[] }; store: { cod_enabled: boolean; cod_fee?: number; gst_rate: number; support_email?: string } }

export default function Settings() {
  const { data, error } = useAdminData<S>("/admin/settings");
  const [s, setS] = useState<S | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  useEffect(() => { if (data) setS(data); }, [data]);
  if (!s) return <Loading error={error} />;
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    try { await api("/admin/settings", { method: "PUT", body: s }); setMsg({ ok: true, t: "Settings saved." }); } catch (x) { setMsg({ ok: false, t: x instanceof Error ? x.message : "Failed" }); }
  };
  const num = (v: string) => Number(v) || 0;
  return (
    <>
      <h1 className="display-section">Store settings</h1>
      <form onSubmit={save} className="space-y-6">
        <Card title="Shipping">
          <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Free shipping above (₹)<input type="number" className={`${fld} mt-1 max-w-xs`} value={s.shipping.free_above} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, free_above: num(e.target.value) } })} /></label>
          {s.shipping.methods.map((m, i) => (
            <div key={m.id} className="mt-4 grid gap-3 sm:grid-cols-4">
              <input className={fld} aria-label="Label" value={m.label} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, label: e.target.value }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} fee`} value={m.fee} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, fee: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} min days`} value={m.days_min} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, days_min: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
              <input type="number" className={fld} aria-label={`${m.label} max days`} value={m.days_max} onChange={(e) => { const ms = [...s.shipping.methods]; ms[i] = { ...m, days_max: num(e.target.value) }; setS({ ...s, shipping: { ...s.shipping, methods: ms } }); }} />
            </div>
          ))}
          <p className="mt-2 text-xs font-semibold text-ink-soft">Columns: label, fee (₹), minimum days, maximum days.</p>
        </Card>
        <Card title="Tax & payments">
          <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Default GST rate (%)<input type="number" className={`${fld} mt-1 max-w-xs`} value={s.store.gst_rate} onChange={(e) => setS({ ...s, store: { ...s.store, gst_rate: num(e.target.value) } })} /></label>
          <label className="mt-4 flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={s.store.cod_enabled} onChange={(e) => setS({ ...s, store: { ...s.store, cod_enabled: e.target.checked } })} /> Enable Cash on Delivery</label>
          <label className="mt-4 block text-xs font-black uppercase tracking-wider text-ink-soft">Support email<input type="email" className={`${fld} mt-1 max-w-sm`} value={s.store.support_email ?? ""} onChange={(e) => setS({ ...s, store: { ...s.store, support_email: e.target.value } })} /></label>
        </Card>
        {msg && <p role="status" className={`text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t}</p>}
        <button className="btn btn-purple">Save settings</button>
      </form>
    </>
  );
}

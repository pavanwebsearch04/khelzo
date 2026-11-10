"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Banknote, Building2, Check, CreditCard, Lock, Smartphone, Wallet } from "lucide-react";
import { ApiError, api, guestOrders, imgUrl, type ApiOrder, type Quote } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { track } from "@/lib/analytics";
import { STATES } from "@/data/states";

interface Saved { id: number; full_name: string; phone: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; pincode: string; type: string; is_default: boolean }
interface RzResp { key_id: string; order_id: string; amount: number; currency: string }
declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: { error?: { description?: string } }) => void) => void } } }

const steps = ["Your details", "Address", "Delivery", "Payment"];
const pays = [
  { id: "upi", label: "UPI", sub: "GPay, PhonePe, Paytm", icon: Smartphone },
  { id: "card", label: "Debit / Credit card", sub: "Visa, Mastercard, RuPay", icon: CreditCard },
  { id: "netbanking", label: "Net banking", sub: "All major banks", icon: Building2 },
  { id: "wallet", label: "Wallets", sub: "Where supported", icon: Wallet },
  { id: "cod", label: "Cash on Delivery", sub: "Pay when it arrives", icon: Banknote },
] as const;

const mobileOk = (v: string) => /^[6-9][0-9]{9}$/.test(v);
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function loadRazorpay(): Promise<boolean> {
  return new Promise((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true); s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

export function CheckoutClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user } = useAuth();
  const { cart, coupon, clearCart, say } = useStore();
  const buy = sp.get("buy"); // "id:qty" or "id:qty:variantId" = buy-now mode, cart untouched
  const items = useMemo(() => {
    if (buy) { const [id, q, v] = buy.split(":").map(Number); return id ? [{ id, variant_id: v || null, qty: Math.min(10, Math.max(1, q || 1)) }] : []; }
    return cart.map((l) => ({ id: l.id, variant_id: l.variant_id ?? null, qty: l.qty }));
  }, [buy, cart]);

  const [step, setStep] = useState(0);
  const [c, setC] = useState({ name: "", email: "", phone: "", whatsapp: "" });
  const [a, setA] = useState({ full_name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", type: "home" });
  const [saved, setSaved] = useState<Saved[]>([]);
  const [pickId, setPickId] = useState<number | "new">("new");
  const [saveAddr, setSaveAddr] = useState(true);
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [note, setNote] = useState("");
  const [pay, setPay] = useState<(typeof pays)[number]["id"]>("upi");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [cod, setCod] = useState(true);
  const [pending, setPending] = useState<{ number: string; rz: RzResp } | null>(null);

  const fill = (s: Saved) => setA({ full_name: s.full_name, phone: s.phone, line1: s.line1, line2: s.line2 ?? "", landmark: s.landmark ?? "", city: s.city, state: s.state, pincode: s.pincode, type: s.type });

  useEffect(() => { api<{ store: { cod_enabled: boolean } }>("/meta").then((m) => { setCod(!!m.store?.cod_enabled); if (!m.store?.cod_enabled) setPay((p) => (p === "cod" ? "upi" : p)); }).catch(() => {}); }, []);
  useEffect(() => {
    if (!user) return;
    setC((x) => ({ ...x, name: x.name || user.name, email: x.email || user.email, phone: x.phone || user.phone || "" }));
    api<{ data: Saved[] }>("/account/addresses").then((r) => { setSaved(r.data); const d = r.data.find((s) => s.is_default) ?? r.data[0]; if (d) { setPickId(d.id); fill(d); } }).catch(() => {});
  }, [user]);
  useEffect(() => {
    if (!items.length) return setQuote(null);
    api<Quote>("/cart/quote", { body: { items, coupon, delivery_method: method } }).then((q) => { setQuote(q); if (step === 0) track("begin_checkout", { value: q.total, currency: "INR" }); }).catch((e) => setFail(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, coupon, method]);

  const validate = (n: number) => {
    const e: Record<string, string> = {};
    if (n === 0) {
      if (c.name.trim().length < 2) e.name = "Enter your full name";
      if (!emailOk(c.email)) e.email = "Enter a valid email";
      if (!mobileOk(c.phone)) e.phone = "Enter a 10-digit Indian mobile number";
      if (c.whatsapp && !mobileOk(c.whatsapp)) e.whatsapp = "Enter a valid 10-digit WhatsApp number";
    }
    if (n === 1) {
      if (a.full_name.trim().length < 2) e.full_name = "Enter the receiver's name";
      if (!mobileOk(a.phone)) e.a_phone = "Enter a 10-digit mobile number";
      if (!a.line1.trim()) e.line1 = "House / flat number is required";
      if (!a.line2.trim()) e.line2 = "Street / area is required";
      if (!a.city.trim()) e.city = "City is required";
      if (!a.state) e.state = "Choose a state";
      if (!/^[1-9][0-9]{5}$/.test(a.pincode)) e.pincode = "Enter a valid 6-digit PIN code";
    }
    setErrs(e);
    return !Object.keys(e).length;
  };
  const next = () => { if (validate(step)) setStep(step + 1); };

  const body = () => ({
    items, coupon, delivery_method: method, payment_method: pay, instructions: note || undefined,
    customer: { name: c.name, email: c.email, phone: c.phone, whatsapp: c.whatsapp || undefined },
    address: { ...a, line2: a.line2 || undefined, landmark: a.landmark || undefined },
  });

  const finish = (number: string) => {
    track("purchase", { transaction_id: number, value: quote?.total, currency: "INR", payment_type: pay });
    if (!buy) clearCart();
    router.push(`/order/${number}`);
  };

  const openRazorpay = async (number: string, rz: RzResp) => {
    if (!(await loadRazorpay()) || !window.Razorpay) { setFail("Could not load the payment window. Check your connection and retry."); setPending({ number, rz }); return; }
    const inst = new window.Razorpay({
      key: rz.key_id, order_id: rz.order_id, amount: rz.amount, currency: rz.currency, name: "KHELZO", description: `Order ${number}`,
      prefill: { name: c.name, email: c.email, contact: c.phone, method: pay }, theme: { color: "#7657F6" },
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try { await api("/checkout/verify", { body: { order_number: number, ...r }, guestOrder: number }); finish(number); }
        catch (e) { setFail(e instanceof Error ? e.message : "We could not verify your payment."); setPending({ number, rz }); setBusy(false); }
      },
      modal: { ondismiss: () => { api("/checkout/failed", { body: { order_number: number, razorpay_order_id: rz.order_id, reason: "Payment window closed" }, guestOrder: number }).catch(() => {}); setFail("Payment was cancelled. Your order is saved. You can retry payment."); setPending({ number, rz }); setBusy(false); } },
    });
    inst.on("payment.failed", (r) => { api("/checkout/failed", { body: { order_number: number, razorpay_order_id: rz.order_id, reason: r.error?.description ?? "Payment failed" }, guestOrder: number }).catch(() => {}); setFail(r.error?.description ?? "Payment failed. Please try again."); setPending({ number, rz }); setBusy(false); });
    inst.open();
  };

  const retry = async () => {
    if (!pending) return;
    setBusy(true); setFail(null);
    try { const r = await api<{ razorpay: RzResp }>(`/checkout/${pending.number}/retry`, { method: "POST", body: {}, guestOrder: pending.number }); await openRazorpay(pending.number, r.razorpay); }
    catch (e) { setFail(e instanceof Error ? e.message : "Retry failed"); setBusy(false); }
  };

  const place = async () => {
    setBusy(true); setFail(null);
    try {
      const r = await api<{ order: ApiOrder; guest_token: string | null; razorpay: RzResp | null }>("/checkout", { body: body() });
      if (r.guest_token) guestOrders.set(r.order.number, r.guest_token);
      if (user && saveAddr && pickId === "new") api("/account/addresses", { body: { ...a, is_default: saved.length === 0 } }).catch(() => {});
      if (pay === "cod" || !r.razorpay) return finish(r.order.number);
      await openRazorpay(r.order.number, r.razorpay);
    } catch (e) {
      const m = e instanceof ApiError ? e.message : "Something went wrong placing your order.";
      setFail(m); setBusy(false); say(m);
    }
  };

  const field = (k: string, label: string, v: string, set: (s: string) => void, o: { type?: string; ph?: string; inputMode?: "numeric" | "tel" | "email"; max?: number; auto?: string; err?: string } = {}) => (
    <div>
      <label htmlFor={k} className="mb-1 block text-sm font-extrabold">{label}</label>
      <input id={k} type={o.type ?? "text"} value={v} onChange={(e) => set(o.inputMode === "numeric" || o.inputMode === "tel" ? e.target.value.replace(/\D/g, "").slice(0, o.max ?? 10) : e.target.value)} placeholder={o.ph} inputMode={o.inputMode} autoComplete={o.auto}
        aria-invalid={!!errs[o.err ?? k]} aria-describedby={errs[o.err ?? k] ? `${k}-e` : undefined}
        className={`h-12 w-full rounded-2xl border-2 bg-white px-4 font-bold outline-none ${errs[o.err ?? k] ? "border-berry" : "border-ink"}`} />
      {errs[o.err ?? k] && <p id={`${k}-e`} className="mt-1 text-xs font-bold text-berry">{errs[o.err ?? k]}</p>}
    </div>
  );

  if (!items.length) return (
    <div className="container-k grid min-h-[50vh] place-items-center py-20 text-center"><div><h1 className="font-display text-4xl font-bold">Nothing to check out</h1><Link href="/shop" className="btn btn-orange mt-6">Explore Toys</Link></div></div>
  );

  return (
    <div className="container-k py-8 md:py-10">
      <div className="flex items-center justify-between"><h1 className="display-section">Checkout</h1><span className="inline-flex items-center gap-1.5 text-sm font-extrabold text-ink-soft"><Lock size={16} className="text-mint-deep" /> Secure checkout</span></div>
      <ol className="mt-6 flex gap-2 overflow-x-auto" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li key={s} className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold ${i === step ? "bg-purple text-white" : i < step ? "bg-mint/50" : "bg-white text-ink-soft"}`} aria-current={i === step ? "step" : undefined}>
            <span className="grid size-6 place-items-center rounded-full bg-white text-xs text-ink">{i < step ? <Check size={14} strokeWidth={3} /> : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[28px] border-2 border-ink bg-white p-5 md:p-8">
          {step === 0 && (
            <section className="grid gap-4 sm:grid-cols-2">
              <h2 className="font-display text-2xl font-bold sm:col-span-2">Your details</h2>
              {!user && <p className="rounded-xl bg-sun/40 p-3 text-sm font-bold sm:col-span-2">Have an account? <Link href={`/account?next=/checkout${buy ? `?buy=${buy}` : ""}`} className="underline">Log in</Link> for saved addresses, or continue as guest.</p>}
              <div className="sm:col-span-2">{field("name", "Full name", c.name, (v) => setC({ ...c, name: v }), { auto: "name" })}</div>
              {field("email", "Email", c.email, (v) => setC({ ...c, email: v }), { type: "email", auto: "email", inputMode: "email" })}
              {field("phone", "Mobile number", c.phone, (v) => setC({ ...c, phone: v }), { inputMode: "tel", ph: "10-digit number", auto: "tel" })}
              {field("whatsapp", "WhatsApp number (optional)", c.whatsapp, (v) => setC({ ...c, whatsapp: v }), { inputMode: "tel" })}
              <label className="flex items-center gap-2 self-end pb-3 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" onChange={(e) => setC({ ...c, whatsapp: e.target.checked ? c.phone : "" })} /> WhatsApp is the same as mobile</label>
            </section>
          )}

          {step === 1 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Delivery address</h2>
              {saved.length > 0 && (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {saved.map((s) => (
                    <li key={s.id}><label className={`block cursor-pointer rounded-2xl border-2 p-4 text-sm font-semibold ${pickId === s.id ? "border-purple bg-purple-soft" : "border-ink/20"}`}>
                      <input type="radio" name="addr" className="sr-only" checked={pickId === s.id} onChange={() => { setPickId(s.id); fill(s); }} />
                      <b className="block">{s.full_name} <span className="ml-1 rounded-full bg-white px-2 py-0.5 text-[11px] uppercase">{s.type}</span></b>{s.line1}, {s.line2}<br />{s.city}, {s.state} {s.pincode}</label></li>
                  ))}
                  <li><label className={`grid h-full cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-4 text-sm font-extrabold ${pickId === "new" ? "border-purple bg-purple-soft" : "border-ink/30"}`}>
                    <input type="radio" name="addr" className="sr-only" checked={pickId === "new"} onChange={() => { setPickId("new"); setA({ full_name: c.name, phone: c.phone, line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", type: "home" }); }} />+ Add a new address</label></li>
                </ul>
              )}
              {(pickId === "new" || !saved.length) && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {field("full_name", "Receiver's name", a.full_name, (v) => setA({ ...a, full_name: v }), { auto: "name" })}
                  {field("a_phone", "Receiver's mobile", a.phone, (v) => setA({ ...a, phone: v }), { inputMode: "tel", err: "a_phone" })}
                  {field("line1", "House / Flat number", a.line1, (v) => setA({ ...a, line1: v }), { auto: "address-line1" })}
                  {field("line2", "Street / Area", a.line2, (v) => setA({ ...a, line2: v }), { auto: "address-line2" })}
                  {field("landmark", "Landmark (optional)", a.landmark, (v) => setA({ ...a, landmark: v }))}
                  {field("city", "City", a.city, (v) => setA({ ...a, city: v }), { auto: "address-level2" })}
                  <div>
                    <label htmlFor="state" className="mb-1 block text-sm font-extrabold">State</label>
                    <select id="state" value={a.state} onChange={(e) => setA({ ...a, state: e.target.value })} aria-invalid={!!errs.state} className={`h-12 w-full rounded-2xl border-2 bg-white px-4 font-bold ${errs.state ? "border-berry" : "border-ink"}`}><option value="">Select state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
                    {errs.state && <p className="mt-1 text-xs font-bold text-berry">{errs.state}</p>}
                  </div>
                  {field("pincode", "PIN code", a.pincode, (v) => setA({ ...a, pincode: v }), { inputMode: "numeric", max: 6, auto: "postal-code" })}
                  <fieldset className="sm:col-span-2"><legend className="mb-1 text-sm font-extrabold">Address type</legend>
                    <div className="flex gap-2">{(["home", "work", "other"] as const).map((t) => <label key={t} className={`cursor-pointer rounded-full border-2 border-ink px-5 py-2 text-sm font-extrabold capitalize ${a.type === t ? "bg-purple text-white" : "bg-white"}`}><input type="radio" name="atype" className="sr-only" checked={a.type === t} onChange={() => setA({ ...a, type: t })} />{t}</label>)}</div></fieldset>
                  {user && <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="size-4 accent-purple" /> Save this address to my account</label>}
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Delivery method</h2>
              <ul className="mt-4 space-y-3">
                {([{ id: "standard", t: "Standard delivery", d: "3–7 working days" }, { id: "express", t: "Express delivery", d: "1–3 working days" }] as const).map((m) => (
                  <li key={m.id}><label className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 p-4 ${method === m.id ? "border-purple bg-purple-soft" : "border-ink/20"}`}>
                    <span className="flex items-center gap-3"><input type="radio" name="dm" checked={method === m.id} onChange={() => setMethod(m.id)} className="size-4 accent-purple" /><span><b className="block">{m.t}</b><span className="text-sm font-semibold text-ink-soft">{m.d}{method === m.id && quote ? ` · arrives by ${new Date(quote.estimated_delivery).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</span></span></span>
                    <span className="font-black">{m.id === "standard" ? (quote && quote.method.id === "standard" ? (quote.shipping ? inr(quote.shipping) : "FREE") : "₹79 or free") : "₹149"}</span></label></li>
                ))}
              </ul>
              <label htmlFor="note" className="mt-5 block text-sm font-extrabold">Delivery instructions (optional)</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={3} placeholder="E.g. leave with security, call before arrival" className="mt-1 w-full rounded-2xl border-2 border-ink p-3 font-semibold" />
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="font-display text-2xl font-bold">Payment</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {pays.filter((p) => p.id !== "cod" || cod).map((p) => (
                  <li key={p.id}><label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 ${pay === p.id ? "border-purple bg-purple-soft" : "border-ink/20"}`}>
                    <input type="radio" name="pay" checked={pay === p.id} onChange={() => setPay(p.id)} className="size-4 accent-purple" /><p.icon size={22} className="text-purple" /><span><b className="block">{p.label}</b><span className="text-xs font-semibold text-ink-soft">{p.sub}</span></span></label></li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-ink-soft"><Lock size={16} className="mt-0.5 shrink-0 text-mint-deep" /> Online payments are processed by Razorpay. KHELZO never sees or stores your card details.</p>
              <div className="mt-5 rounded-2xl bg-cream p-4 text-sm font-semibold"><b>Deliver to:</b> {a.full_name}, {a.line1}, {a.line2}, {a.city}, {a.state} {a.pincode}<br /><b>Contact:</b> {c.name} · {c.phone} · {c.email}</div>
              {fail && <div role="alert" className="mt-4 rounded-2xl border-2 border-berry bg-berry/10 p-4 text-sm font-bold text-berry">{fail}{pending && <button onClick={retry} disabled={busy} className="btn btn-sm btn-orange ml-3">Retry payment</button>}</div>}
            </section>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button onClick={() => (step ? setStep(step - 1) : router.push("/cart"))} className="btn btn-white">{step ? "Back" : "Back to cart"}</button>
            {step < 3 ? <button onClick={next} className="btn btn-purple">Continue</button> : <button onClick={place} disabled={busy || !quote || !!quote.issues.length} className="btn btn-orange !min-h-14 disabled:opacity-50">{busy ? "Processing…" : pay === "cod" ? `Place order · ${quote ? inr(quote.total) : ""}` : `Pay ${quote ? inr(quote.total) : ""}`}</button>}
          </div>
        </div>

        <aside className="h-fit rounded-[28px] border-2 border-ink bg-white p-5 lg:sticky lg:top-[130px]">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <ul className="mt-3 space-y-3">
            {quote?.lines.map((l) => <li key={`${l.id}:${l.variant_id ?? 0}`} className="flex gap-3"><span className="relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink">{l.image && <Image src={imgUrl(l.image)} alt="" fill sizes="56px" className="object-cover" />}<span className="absolute -right-0 -top-0 grid min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[11px] font-black text-white">{l.qty}</span></span><span className="min-w-0 flex-1 text-sm font-extrabold leading-snug line-clamp-2">{l.name}{l.variant_label && <span className="block text-xs font-bold text-ink-soft">{l.variant_label}</span>}</span><span className="text-sm font-black">{inr(l.line_total)}</span></li>)}
          </ul>
          {quote && (
            <dl className="mt-4 space-y-1.5 border-t-2 border-ink/10 pt-4 text-sm font-bold">
              <div className="flex justify-between text-ink-soft"><dt>Subtotal</dt><dd>{inr(quote.subtotal)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-mint-deep"><dt>Discount {quote.coupon?.code}</dt><dd>-{inr(quote.discount)}</dd></div>}
              <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>{quote.shipping ? inr(quote.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between text-xs text-ink-soft"><dt>GST included</dt><dd>{inr(quote.tax_included)}</dd></div>
              <div className="flex justify-between border-t-2 border-ink pt-3 text-xl font-black"><dt>Total</dt><dd>{inr(quote.total)}</dd></div>
            </dl>
          )}
          {quote?.issues.map((i) => <p key={`${i.id}:${i.variant_id ?? 0}:${i.issue}`} className="mt-3 rounded-xl bg-berry/10 p-3 text-sm font-bold text-berry">{i.name}: {i.issue === "out_of_stock" ? "out of stock." : i.issue === "variant_required" ? "choose an option first." : `only ${i.available} available.`} <Link href="/cart" className="underline">Update cart</Link></p>)}
        </aside>
      </div>
    </div>
  );
}

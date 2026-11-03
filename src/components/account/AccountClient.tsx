"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heart, LogOut, MapPin, Package, Trash2, User as UserIcon, Clock } from "lucide-react";
import { ApiError, STATUS_LABEL, api, imgUrl, type ApiOrder, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";
import { useAuth } from "@/components/providers/AuthProvider";
import { useStore } from "@/components/providers/StoreProvider";
import { STATES } from "@/data/states";
import { ProductCard } from "@/components/products/ProductCard";

const input = "h-12 w-full rounded-2xl border-2 border-ink bg-white px-4 font-bold outline-none";

function AuthForms() {
  const { login, register } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", password_confirmation: "" });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const next = sp.get("next");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      if (mode === "forgot") { const r = await api<{ message: string }>("/auth/forgot-password", { body: { email: f.email }, token: null }); setMsg({ ok: true, t: r.message }); }
      else {
        const u = mode === "login" ? await login(f.email, f.password) : await register({ ...f, phone: f.phone || undefined });
        router.push(next && next.startsWith("/") ? next : u.role === "admin" || u.role === "manager" ? "/admin" : "/account");
      }
    } catch (err) { setMsg({ ok: false, t: err instanceof ApiError ? err.message : "Something went wrong" }); }
    setBusy(false);
  };

  return (
    <div className="container-k grid max-w-md py-14">
      <div className="rounded-[32px] border-2 border-ink bg-white p-7 shadow-[0_8px_0_0_var(--color-ink)]">
        <h1 className="font-display text-3xl font-bold">{mode === "login" ? "Welcome back" : mode === "register" ? "Join KHELZO" : "Reset your password"}</h1>
        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === "register" && <><input className={input} placeholder="Full name" aria-label="Full name" required value={f.name} onChange={set("name")} autoComplete="name" />
            <input className={input} placeholder="Mobile (optional)" aria-label="Mobile number" inputMode="numeric" maxLength={10} value={f.phone} onChange={set("phone")} autoComplete="tel" /></>}
          <input className={input} type="email" placeholder="Email" aria-label="Email" required value={f.email} onChange={set("email")} autoComplete="email" />
          {mode !== "forgot" && <input className={input} type="password" placeholder="Password" aria-label="Password" required value={f.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} />}
          {mode === "register" && <><input className={input} type="password" placeholder="Confirm password" aria-label="Confirm password" required value={f.password_confirmation} onChange={set("password_confirmation")} autoComplete="new-password" /><p className="text-xs font-semibold text-ink-soft">At least 8 characters with letters and numbers.</p></>}
          {msg && <p role="alert" className={`text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t}</p>}
          <button disabled={busy} className="btn btn-purple w-full">{busy ? "Please wait…" : mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Send reset link"}</button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm font-extrabold text-purple">
          {mode !== "login" && <button onClick={() => { setMode("login"); setMsg(null); }}>Log in</button>}
          {mode !== "register" && <button onClick={() => { setMode("register"); setMsg(null); }}>Create account</button>}
          {mode === "login" && <button onClick={() => { setMode("forgot"); setMsg(null); }}>Forgot password?</button>}
        </div>
      </div>
    </div>
  );
}

interface Addr { id: number; full_name: string; phone: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; pincode: string; type: string; is_default: boolean }
const blank = { full_name: "", phone: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", type: "home", is_default: false };

function Addresses() {
  const [list, setList] = useState<Addr[]>([]);
  const [form, setForm] = useState<(typeof blank & { id?: number }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const load = useCallback(() => api<{ data: Addr[] }>("/account/addresses").then((r) => setList(r.data)), []);
  useEffect(() => { void load(); }, [load]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try { form?.id ? await api(`/account/addresses/${form.id}`, { method: "PUT", body: form }) : await api("/account/addresses", { body: form }); setForm(null); await load(); }
    catch (x) { setErr(x instanceof Error ? x.message : "Failed"); }
  };
  const f = (k: keyof typeof blank, ph: string) => <input className={input} placeholder={ph} aria-label={ph} value={String(form?.[k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} />;
  return (
    <div>
      <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Saved addresses</h2>{!form && <button onClick={() => setForm({ ...blank })} className="btn btn-sm btn-purple">Add address</button>}</div>
      {form ? (
        <form onSubmit={save} className="mt-4 grid gap-3 sm:grid-cols-2">
          {f("full_name", "Receiver name")}{f("phone", "Mobile (10 digits)")}{f("line1", "House / Flat")}{f("line2", "Street / Area")}{f("landmark", "Landmark (optional)")}{f("city", "City")}
          <select aria-label="State" required className={input} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}><option value="">State</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
          {f("pincode", "PIN code")}
          <select aria-label="Type" className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Make default</label>
          {err && <p className="text-sm font-bold text-berry sm:col-span-2">{err}</p>}
          <div className="flex gap-2 sm:col-span-2"><button className="btn btn-purple">Save</button><button type="button" onClick={() => setForm(null)} className="btn btn-white">Cancel</button></div>
        </form>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {list.length === 0 && <li className="font-bold text-ink-soft">No saved addresses yet.</li>}
          {list.map((a) => (
            <li key={a.id} className="rounded-2xl border-2 border-ink bg-white p-4 text-sm font-semibold">
              <b className="block">{a.full_name} <span className="ml-1 rounded-full bg-sun/50 px-2 py-0.5 text-[11px] uppercase">{a.type}</span>{a.is_default && <span className="ml-1 rounded-full bg-mint/50 px-2 py-0.5 text-[11px] uppercase">Default</span>}</b>
              {a.line1}, {a.line2}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}
              <div className="mt-2 flex gap-3 font-extrabold text-purple"><button onClick={() => setForm({ ...a, line2: a.line2 ?? "", landmark: a.landmark ?? "" })}>Edit</button><button onClick={() => api(`/account/addresses/${a.id}`, { method: "DELETE" }).then(load)} className="text-berry">Delete</button></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Orders() {
  const [rows, setRows] = useState<ApiOrder[] | null>(null);
  useEffect(() => { api<{ data: ApiOrder[] }>("/account/orders").then((r) => setRows(r.data)).catch(() => setRows([])); }, []);
  if (!rows) return <p className="font-bold text-ink-soft">Loading orders…</p>;
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">My orders</h2>
      {rows.length === 0 ? <p className="mt-3 font-bold text-ink-soft">You haven&apos;t placed an order yet. <Link href="/shop" className="text-purple underline">Start shopping</Link></p> : (
        <ul className="mt-4 space-y-3">
          {rows.map((o) => (
            <li key={o.number}><Link href={`/order/${o.number}`} className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-ink bg-white p-4 hover:bg-purple-soft">
              <span className="flex -space-x-3">{o.items.slice(0, 3).map((i, n) => <span key={n} className="relative size-12 overflow-hidden rounded-xl border-2 border-ink bg-cream">{i.image && <Image src={imgUrl(i.image)} alt="" fill sizes="48px" className="object-cover" />}</span>)}</span>
              <span className="min-w-0 flex-1"><b className="block">{o.number}</b><span className="text-sm font-semibold text-ink-soft">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {o.items_count} items</span></span>
              <span className="rounded-full border-2 border-ink bg-sun px-3 py-1 text-xs font-black">{STATUS_LABEL[o.status] ?? o.status}</span><b>{inr(o.total)}</b>
            </Link></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductGrid({ ids, empty }: { ids: number[]; empty: string }) {
  const [items, setItems] = useState<ApiProduct[] | null>(null);
  useEffect(() => { if (!ids.length) { setItems([]); return; } api<{ data: ApiProduct[] }>(`/products/by-ids?ids=${ids.join(",")}`).then((r) => setItems(r.data)).catch(() => setItems([])); }, [ids]);
  if (!items) return <p className="font-bold text-ink-soft">Loading…</p>;
  if (!items.length) return <p className="font-bold text-ink-soft">{empty} <Link href="/shop" className="text-purple underline">Browse toys</Link></p>;
  return <ul className="grid grid-cols-2 gap-4 xl:grid-cols-3">{items.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>;
}

function Profile() {
  const { user, refresh } = useAuth();
  const [f, setF] = useState({ name: user?.name ?? "", phone: user?.phone ?? "", current_password: "", password: "", password_confirmation: "" });
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(null);
    const body: Record<string, string> = { name: f.name, phone: f.phone };
    if (f.password) Object.assign(body, { current_password: f.current_password, password: f.password, password_confirmation: f.password_confirmation });
    try { await api("/auth/me", { method: "PATCH", body }); await refresh(); setMsg({ ok: true, t: "Profile updated." }); } catch (x) { setMsg({ ok: false, t: x instanceof Error ? x.message : "Failed" }); }
  };
  return (
    <form onSubmit={save} className="max-w-md space-y-3">
      <h2 className="font-display text-2xl font-bold">Profile</h2>
      <input className={input} aria-label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={`${input} opacity-60`} aria-label="Email" value={user?.email} readOnly />
      <input className={input} aria-label="Mobile" placeholder="Mobile" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })} />
      <p className="pt-2 font-extrabold">Change password (optional)</p>
      <input className={input} type="password" aria-label="Current password" placeholder="Current password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} />
      <input className={input} type="password" aria-label="New password" placeholder="New password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
      <input className={input} type="password" aria-label="Confirm new password" placeholder="Confirm new password" value={f.password_confirmation} onChange={(e) => setF({ ...f, password_confirmation: e.target.value })} />
      {msg && <p role="status" className={`text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t}</p>}
      <button className="btn btn-purple">Save changes</button>
    </form>
  );
}

const tabs = [
  { id: "orders", label: "My orders", icon: Package }, { id: "wishlist", label: "Wishlist", icon: Heart }, { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "recent", label: "Recently viewed", icon: Clock }, { id: "profile", label: "Profile", icon: UserIcon },
] as const;

export function AccountClient() {
  const { user, ready, logout } = useAuth();
  const { wishlist, recent } = useStore();
  const sp = useSearchParams();
  const router = useRouter();
  const tab = sp.get("tab") ?? "orders";
  if (!ready) return <div className="container-k py-24 text-center font-display text-2xl">Loading…</div>;
  if (!user) return <AuthForms />;
  return (
    <div className="container-k py-10">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="display-section">Hi, {user.name.split(" ")[0]}!</h1><p className="text-ink-soft">{user.email}</p></div>
        <div className="flex gap-2">{user.role !== "customer" && <Link href="/admin" className="btn btn-sm btn-sun">Admin dashboard</Link>}<button onClick={async () => { await logout(); router.push("/"); }} className="btn btn-sm btn-white"><LogOut size={16} /> Log out</button></div></div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Account" className="flex gap-2 overflow-x-auto lg:flex-col">
          {tabs.map((t) => <Link key={t.id} href={`/account?tab=${t.id}`} aria-current={tab === t.id ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-ink px-4 py-2.5 text-sm font-extrabold ${tab === t.id ? "bg-purple text-white" : "bg-white hover:bg-purple-soft"}`}><t.icon size={17} />{t.label}</Link>)}
        </nav>
        <div className="min-w-0 rounded-[28px] border-2 border-ink bg-cream-deep/40 p-5 md:p-7">
          {tab === "orders" && <Orders />}
          {tab === "wishlist" && <div><h2 className="mb-4 font-display text-2xl font-bold">Wishlist</h2><ProductGrid ids={wishlist} empty="Your wishlist is empty." /></div>}
          {tab === "addresses" && <Addresses />}
          {tab === "recent" && <div><h2 className="mb-4 font-display text-2xl font-bold">Recently viewed</h2><ProductGrid ids={recent} empty="Nothing viewed yet." /></div>}
          {tab === "profile" && <Profile />}
        </div>
      </div>
    </div>
  );
}

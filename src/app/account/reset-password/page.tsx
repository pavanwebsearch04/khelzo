"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

function Form() {
  const sp = useSearchParams();
  const [p, setP] = useState(""); const [c, setC] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api<{ message: string }>("/auth/reset-password", { body: { token: sp.get("token"), email: sp.get("email"), password: p, password_confirmation: c }, token: null }); setMsg({ ok: true, t: r.message }); }
    catch (x) { setMsg({ ok: false, t: x instanceof Error ? x.message : "Failed" }); }
  };
  return (
    <div className="container-k max-w-md py-14"><form onSubmit={submit} className="space-y-4 rounded-[32px] border-2 border-ink bg-white p-7">
      <h1 className="font-display text-3xl font-bold">Choose a new password</h1>
      <input type="password" required aria-label="New password" placeholder="New password" value={p} onChange={(e) => setP(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-ink px-4 font-bold" />
      <input type="password" required aria-label="Confirm password" placeholder="Confirm password" value={c} onChange={(e) => setC(e.target.value)} className="h-12 w-full rounded-2xl border-2 border-ink px-4 font-bold" />
      {msg && <p role="status" className={`text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t} {msg.ok && <Link href="/account" className="underline">Log in</Link>}</p>}
      <button className="btn btn-purple w-full">Update password</button>
    </form></div>
  );
}
export default function ResetPage() { return <Suspense><Form /></Suspense>; }

"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Card, Loading, Pager, Table, Td, Th, fld, useAdminData } from "@/components/admin/ui";
import { useAuth } from "@/components/providers/AuthProvider";

interface Staff { id: number; name: string; email: string; role: string; is_active: boolean }
interface Log { id: number; who: string; action: string; subject: string | null; at: string }

export default function StaffPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const staff = useAdminData<{ data: Staff[] }>("/admin/staff");
  const log = useAdminData<{ data: Log[]; meta: { last_page: number } }>(`/admin/activity?page=${page}`);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "manager" });
  const [msg, setMsg] = useState<string | null>(null);
  if (user && user.role !== "admin") return <p className="font-bold text-berry">Only admins can manage staff.</p>;
  const run = async (fn: () => Promise<unknown>, ok: string) => { setMsg(null); try { await fn(); await staff.reload(); await log.reload(); setMsg(ok); } catch (e) { setMsg(e instanceof ApiError ? e.message : "Failed"); } };
  return (
    <>
      <h1 className="display-section">Staff &amp; activity</h1>
      {msg && <p role="status" className="rounded-xl bg-sun/40 p-3 text-sm font-bold">{msg}</p>}
      <Card title="Staff accounts">
        {!staff.data ? <Loading error={staff.error} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm font-semibold"><thead><tr><Th>Name</Th><Th>Email</Th><Th>Role</Th><Th>Access</Th></tr></thead>
            <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">{staff.data.data.map((s) => (
              <tr key={s.id}><Td><b>{s.name}</b></Td><Td>{s.email}</Td>
                <Td>{s.id === user?.id ? s.role : <select aria-label={`Role for ${s.name}`} className={`${fld} !h-9 max-w-[130px]`} value={s.role} onChange={(e) => run(() => api(`/admin/staff/${s.id}`, { method: "PUT", body: { role: e.target.value } }), "Role updated.")}><option value="manager">manager</option><option value="admin">admin</option></select>}</Td>
                <Td>{s.id === user?.id ? "You" : <button onClick={() => run(() => api(`/admin/staff/${s.id}`, { method: "PUT", body: { is_active: !s.is_active } }), s.is_active ? "Access removed." : "Access restored.")} className={`font-extrabold ${s.is_active ? "text-berry" : "text-mint-deep"}`}>{s.is_active ? "Disable" : "Enable"}</button>}</Td></tr>))}</tbody></table></div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); void run(() => api("/admin/staff", { body: f }), "Staff account created.").then(() => setF({ name: "", email: "", password: "", role: "manager" })); }} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_130px_auto]">
          <input required aria-label="Name" placeholder="Name" className={fld} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input required type="email" aria-label="Email" placeholder="Email" className={fld} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <input required type="password" minLength={10} aria-label="Password" placeholder="Password (10+ chars, letters & numbers)" className={fld} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <select aria-label="Role" className={fld} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="manager">manager</option><option value="admin">admin</option></select>
          <button className="btn btn-sm btn-purple">Add staff</button>
        </form>
        <p className="mt-2 text-xs font-semibold text-ink-soft">Managers handle products, orders, customers, reviews and returns. Only admins can change settings, delete coupons, issue refunds and manage staff.</p>
      </Card>
      <Card title="Recent activity">
        {!log.data ? <Loading error={log.error} /> : (
          <Table>{log.data.data.map((a) => <tr key={a.id}><Td className="whitespace-nowrap text-ink-soft">{new Date(a.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</Td><Td><b>{a.who}</b></Td><Td>{a.action}</Td><Td className="text-ink-soft">{a.subject}</Td></tr>)}</Table>
        )}
        <Pager page={page} last={log.data?.meta.last_page ?? 1} onPage={setPage} />
      </Card>
    </>
  );
}

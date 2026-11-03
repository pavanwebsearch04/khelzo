"use client";

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Card, Loading, Table, Td, fld, useAdminData } from "@/components/admin/ui";

interface Item { id: number; name: string; short?: string; products_count: number }
interface Banner { id: number; title: string; subtitle: string | null; link: string | null; active: boolean }

function Simple({ title, path, label }: { title: string; path: "categories" | "brands"; label: string }) {
  const { data, error, reload } = useAdminData<{ data: Item[] }>(`/admin/${path}`);
  const [name, setName] = useState(""); const [err, setErr] = useState<string | null>(null);
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try { await api(`/admin/${path}`, { body: path === "categories" ? { name, short: name } : { name } }); setName(""); await reload(); } catch (x) { setErr(x instanceof ApiError ? x.message : "Failed"); }
  };
  return (
    <Card title={title}>
      <form onSubmit={add} className="mb-3 flex gap-2"><input required className={fld} placeholder={label} aria-label={label} value={name} onChange={(e) => setName(e.target.value)} /><button className="btn btn-sm btn-purple">Add</button></form>
      {err && <p role="alert" className="mb-2 text-sm font-bold text-berry">{err}</p>}
      {!data ? <Loading error={error} /> : <Table>{data.data.map((i) => <tr key={i.id}><Td>{i.name}</Td><Td>{i.products_count} products</Td><Td className="text-right"><button onClick={() => api(`/admin/${path}/${i.id}`, { method: "DELETE" }).then(reload).catch((x) => setErr(x.message))} className="font-extrabold text-berry">Delete</button></Td></tr>)}</Table>}
    </Card>
  );
}

function Banners() {
  const { data, error, reload } = useAdminData<{ data: Banner[] }>("/admin/banners");
  const [f, setF] = useState({ title: "", subtitle: "", link: "" });
  return (
    <Card title="Homepage banners">
      <form onSubmit={async (e) => { e.preventDefault(); await api("/admin/banners", { body: { title: f.title, subtitle: f.subtitle || null, link: f.link || null, active: true } }); setF({ title: "", subtitle: "", link: "" }); await reload(); }} className="mb-3 grid gap-2 sm:grid-cols-4">
        <input required className={fld} placeholder="Title" aria-label="Banner title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /><input className={fld} placeholder="Subtitle" aria-label="Subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /><input className={fld} placeholder="Link, e.g. /shop?tag=new" aria-label="Link" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} /><button className="btn btn-sm btn-purple">Add banner</button>
      </form>
      {!data ? <Loading error={error} /> : <Table>{data.data.map((b) => <tr key={b.id}><Td><b>{b.title}</b><br /><span className="text-xs text-ink-soft">{b.subtitle}</span></Td><Td>{b.link}</Td><Td className="text-right"><button onClick={() => api(`/admin/banners/${b.id}`, { method: "PUT", body: { ...b, active: !b.active } }).then(reload)} className="font-extrabold text-purple">{b.active ? "Active" : "Hidden"}</button><button onClick={() => api(`/admin/banners/${b.id}`, { method: "DELETE" }).then(reload)} className="ml-3 font-extrabold text-berry">Delete</button></Td></tr>)}</Table>}
    </Card>
  );
}

export default function Catalogue() {
  return (<><h1 className="display-section">Categories, brands &amp; banners</h1><div className="grid gap-6 xl:grid-cols-2"><Simple title="Categories" path="categories" label="New category name" /><Simple title="Brands" path="brands" label="New brand name" /></div><Banners /></>);
}

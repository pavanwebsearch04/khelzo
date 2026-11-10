"use client";

import Image from "next/image";
import { useState } from "react";
import { ApiError, api, imgUrl, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";
import { Card, Loading, Pager, downloadFile, fld, useAdminData } from "@/components/admin/ui";

type Row = ApiProduct & { status: string; featured: boolean; sold: number; category_id: number; brand_id: number | null };
interface Cat { id: number; slug: string; short: string }
interface Brand { id: number; name: string }
interface VarForm { id?: number; sku: string; label: string; price: string; mrp: string; stock: string; image: string }

const empty = { id: 0, name: "", sku: "", category_id: "", brand_id: "", age_group: "3-5", toy_type: "indoor", price: "", mrp: "", stock: "0", description: "", material: "", dimensions: "", weight: "", safety: "", features: "", box_contents: "", images: [] as string[], status: "published", featured: false, tax_rate: "12", tags: "", video_url: "", variants: [] as VarForm[] };
type Form = typeof empty;

export default function AdminProducts() {
  const [q, setQ] = useState(""); const [low, setLow] = useState(false); const [status, setStatus] = useState(""); const [featured, setFeatured] = useState(false); const [page, setPage] = useState(1);
  const qs = `/admin/products?page=${page}&q=${encodeURIComponent(q)}${low ? "&low_stock=1" : ""}${featured ? "&featured=1" : ""}${status ? `&status=${status}` : ""}`;
  const { data, error, reload } = useAdminData<{ data: Row[]; meta: { total: number; last_page: number } }>(qs);
  const cats = useAdminData<{ data: Cat[] }>("/admin/categories").data?.data ?? [];
  const brands = useAdminData<{ data: Brand[] }>("/admin/brands").data?.data ?? [];
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sel, setSel] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [bulkVal, setBulkVal] = useState("");

  const edit = (p: Row) => setForm({
    ...empty, id: p.id, name: p.name, sku: p.sku, category_id: String(p.category_id ?? ""), brand_id: String(p.brand_id ?? ""), age_group: p.age, toy_type: p.toy_type,
    price: String(p.price), mrp: String(p.mrp), stock: String(p.stock), description: p.desc, material: p.material ?? "", dimensions: p.dimensions ?? "", weight: p.weight ?? "", safety: p.safety ?? "",
    features: (p.features ?? []).join("\n"), box_contents: (p.box_contents ?? []).join("\n"), images: p.images, status: p.status, featured: p.featured, tax_rate: String(p.tax_rate ?? 12),
    tags: (p.tags ?? []).join(", "), video_url: p.video_url ?? "",
    variants: (p.variants ?? []).map((v) => ({ id: v.id, sku: v.sku, label: v.label, price: String(v.price), mrp: String(v.mrp), stock: String(v.stock), image: v.image ?? "" })),
  });

  const upload = async (files: FileList | null) => {
    if (!files || !form) return;
    for (const f of Array.from(files)) { const fd = new FormData(); fd.set("image", f); const r = await api<{ url: string }>("/admin/upload", { form: fd }); setForm((x) => x && { ...x, images: [...x.images, r.url] }); }
  };

  const hasVars = (form?.variants.length ?? 0) > 0;
  const setVar = (i: number, k: keyof VarForm, v: string) => setForm((x) => x && { ...x, variants: x.variants.map((r, n) => (n === i ? { ...r, [k]: v } : r)) });

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form) return; setErr(null);
    const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
    const variants = form.variants.map((v) => ({ id: v.id, sku: v.sku, label: v.label, price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock), image: v.image || null }));
    const cheapest = variants.length ? [...variants].sort((a, b) => a.price - b.price)[0] : null;
    const body = {
      ...form, category_id: Number(form.category_id), brand_id: form.brand_id ? Number(form.brand_id) : null,
      price: cheapest ? cheapest.price : Number(form.price), mrp: cheapest ? cheapest.mrp : Number(form.mrp), stock: variants.length ? variants.reduce((n, v) => n + v.stock, 0) : Number(form.stock),
      tax_rate: Number(form.tax_rate), features: lines(form.features), box_contents: lines(form.box_contents), tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      video_url: form.video_url || null, material: form.material || null, dimensions: form.dimensions || null, weight: form.weight || null, safety: form.safety || null, variants,
    };
    try { form.id ? await api(`/admin/products/${form.id}`, { method: "PUT", body }) : await api("/admin/products", { body }); setForm(null); await reload(); }
    catch (x) { setErr(x instanceof ApiError ? x.message : "Failed to save"); }
  };

  const bulk = async (action: string, value?: number) => {
    if (!sel.length) return;
    try { const r = await api<{ updated: number }>("/admin/products/bulk", { body: { ids: sel, action, value } }); setMsg(`${r.updated} product(s) updated.`); setSel([]); await reload(); }
    catch (x) { setMsg(x instanceof ApiError ? x.message : "Bulk action failed"); }
  };

  const importCsv = async (f: File | null) => {
    if (!f) return;
    const fd = new FormData(); fd.set("file", f);
    try {
      const r = await api<{ created: number; updated: number; errors: string[] }>("/admin/products/import", { form: fd });
      setMsg(`Imported: ${r.created} created, ${r.updated} updated.${r.errors.length ? ` ${r.errors.length} row(s) skipped: ${r.errors.slice(0, 3).join("; ")}` : ""}`); await reload();
    } catch (x) { setMsg(x instanceof ApiError ? x.message : "Import failed"); }
  };

  const text = (k: keyof Form, label: string, type = "text", disabled = false) => <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">{label}<input type={type} disabled={disabled} className={`${fld} mt-1 normal-case tracking-normal disabled:opacity-50`} value={String(form![k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} /></label>;
  const area = (k: "description" | "features" | "box_contents", label: string, rows: number) => <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">{label}<textarea rows={rows} className="mt-1 w-full rounded-xl border-2 border-ink p-3 text-sm font-semibold normal-case tracking-normal" value={form![k]} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} /></label>;

  if (form) return (
    <>
      <h1 className="display-section">{form.id ? "Edit product" : "Add product"}</h1>
      <form onSubmit={save} className="grid gap-4 rounded-[24px] border-2 border-ink bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">{text("name", "Name")}</div>
        {text("sku", "SKU")}
        <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Category<select required className={`${fld} mt-1`} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Select</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.short}</option>)}</select></label>
        <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Brand<select className={`${fld} mt-1`} value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}><option value="">None</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
        <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Age group<select className={`${fld} mt-1`} value={form.age_group} onChange={(e) => setForm({ ...form, age_group: e.target.value })}>{["0-2", "3-5", "6-8", "9-12", "13-plus"].map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Toy type<select className={`${fld} mt-1`} value={form.toy_type} onChange={(e) => setForm({ ...form, toy_type: e.target.value })}>{["indoor", "outdoor", "educational"].map((a) => <option key={a}>{a}</option>)}</select></label>
        {text("price", "Selling price (₹)", "number", hasVars)}{text("mrp", "Original price / MRP (₹)", "number", hasVars)}{text("stock", "Stock", "number", hasVars)}{text("tax_rate", "GST %", "number")}
        {hasVars && <p className="text-xs font-bold text-ink-soft sm:col-span-2">Price, MRP and stock come from the options below (the cheapest option is shown on cards; stock is the total).</p>}

        <div className="sm:col-span-2 rounded-2xl border-2 border-dashed border-ink/30 p-4">
          <div className="flex items-center justify-between"><p className="text-xs font-black uppercase tracking-wider text-ink-soft">Options (size, colour, pack…)</p>
            <button type="button" onClick={() => setForm({ ...form, variants: [...form.variants, { sku: `${form.sku || "SKU"}-${form.variants.length + 1}`, label: "", price: form.price, mrp: form.mrp, stock: "0", image: "" }] })} className="btn btn-sm btn-white">+ Add option</button></div>
          {form.variants.length === 0 && <p className="mt-2 text-sm font-semibold text-ink-soft">No options — this product is sold as a single item.</p>}
          <div className="mt-3 space-y-2">
            {form.variants.map((v, i) => (
              <div key={v.id ?? `n${i}`} className="grid gap-2 rounded-xl bg-cream p-3 sm:grid-cols-[1.2fr_1fr_.8fr_.8fr_.6fr_auto]">
                <input required aria-label="Option label" placeholder="Label e.g. Red / Large" className={fld} value={v.label} onChange={(e) => setVar(i, "label", e.target.value)} />
                <input required aria-label="Option SKU" placeholder="SKU" className={fld} value={v.sku} onChange={(e) => setVar(i, "sku", e.target.value)} />
                <input required type="number" aria-label="Option price" placeholder="Price" className={fld} value={v.price} onChange={(e) => setVar(i, "price", e.target.value)} />
                <input required type="number" aria-label="Option MRP" placeholder="MRP" className={fld} value={v.mrp} onChange={(e) => setVar(i, "mrp", e.target.value)} />
                <input required type="number" min={0} aria-label="Option stock" placeholder="Stock" className={fld} value={v.stock} onChange={(e) => setVar(i, "stock", e.target.value)} />
                <button type="button" aria-label="Remove option" onClick={() => setForm({ ...form, variants: form.variants.filter((_, n) => n !== i) })} className="font-black text-berry">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">{area("description", "Description", 3)}</div>
        {area("features", "Key features (one per line)", 4)}
        {area("box_contents", "In the box (one per line)", 4)}
        {text("material", "Material")}{text("dimensions", "Dimensions")}{text("weight", "Weight")}{text("safety", "Safety information")}
        {text("tags", "Tags (comma separated: bestseller, trending, new, learning, gift)")}{text("video_url", "Demo video URL (YouTube embed link)", "url")}
        <label className="block text-xs font-black uppercase tracking-wider text-ink-soft">Status<select className={`${fld} mt-1`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="published">Published</option><option value="draft">Draft (hidden)</option><option value="archived">Archived</option></select></label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured on homepage</label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-black uppercase tracking-wider text-ink-soft">Images (first is the main image)</p>
          <div className="flex flex-wrap gap-2">{form.images.map((u, i) => <span key={u} className="relative size-20 overflow-hidden rounded-xl border-2 border-ink"><Image src={imgUrl(u)} alt="" fill sizes="80px" className="object-cover" /><button type="button" aria-label="Remove image" onClick={() => setForm({ ...form, images: form.images.filter((_, n) => n !== i) })} className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-ink text-xs text-white">×</button></span>)}</div>
          <input type="file" accept="image/*" multiple aria-label="Upload images" className="mt-2 text-sm" onChange={(e) => upload(e.target.files).catch((x) => setErr(x.message))} />
        </div>
        {err && <p role="alert" className="text-sm font-bold text-berry sm:col-span-2">{err}</p>}
        <div className="flex gap-2 sm:col-span-2"><button className="btn btn-purple">Save product</button><button type="button" onClick={() => setForm(null)} className="btn btn-white">Cancel</button></div>
      </form>
    </>
  );

  const rows = data?.data ?? [];
  const allOn = rows.length > 0 && rows.every((r) => sel.includes(r.id));
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="display-section">Products</h1>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => downloadFile("/admin/products/export", "khelzo-products.csv").catch((x) => setMsg(x.message))} className="btn btn-sm btn-white">Export CSV</button>
          <label className="btn btn-sm btn-white cursor-pointer">Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { void importCsv(e.target.files?.[0] ?? null); e.target.value = ""; }} /></label>
          <button onClick={() => setForm({ ...empty })} className="btn btn-purple">Add product</button></div></div>
      {msg && <p role="status" className="rounded-xl bg-sun/40 p-3 text-sm font-bold">{msg}</p>}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input className={`${fld} max-w-xs`} placeholder="Search name or SKU" aria-label="Search products" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <select aria-label="Status filter" className={`${fld} max-w-[150px]`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={low} onChange={(e) => { setLow(e.target.checked); setPage(1); }} /> Low stock only</label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" className="size-4 accent-purple" checked={featured} onChange={(e) => { setFeatured(e.target.checked); setPage(1); }} /> Featured only</label>
        </div>
        {sel.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-purple-soft p-3 text-sm font-extrabold">
            <span>{sel.length} selected</span>
            <button onClick={() => bulk("publish")} className="btn btn-sm btn-white">Publish</button>
            <button onClick={() => bulk("unpublish")} className="btn btn-sm btn-white">Unpublish</button>
            <button onClick={() => bulk("feature")} className="btn btn-sm btn-white">Feature</button>
            <button onClick={() => bulk("unfeature")} className="btn btn-sm btn-white">Unfeature</button>
            <input type="number" min={0} aria-label="Stock value" placeholder="Stock" value={bulkVal} onChange={(e) => setBulkVal(e.target.value)} className="h-9 w-24 rounded-lg border-2 border-ink px-2" />
            <button disabled={bulkVal === ""} onClick={() => bulk("set_stock", Number(bulkVal))} className="btn btn-sm btn-white disabled:opacity-40">Set stock</button>
            <button onClick={() => confirm(`Archive ${sel.length} products?`) && bulk("archive")} className="btn btn-sm btn-white text-berry">Archive</button>
          </div>
        )}
        {!data ? <Loading error={error} /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm font-semibold">
            <thead><tr className="text-left text-xs font-black uppercase tracking-wider text-ink-soft"><th className="p-2"><input type="checkbox" aria-label="Select all" className="size-4 accent-purple" checked={allOn} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} /></th><th className="p-2" /><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">Stock</th><th className="p-2">Status</th><th className="p-2" /></tr></thead>
            <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">
              {rows.map((p) => (
                <tr key={p.id}><td className="p-2"><input type="checkbox" aria-label={`Select ${p.name}`} className="size-4 accent-purple" checked={sel.includes(p.id)} onChange={(e) => setSel(e.target.checked ? [...sel, p.id] : sel.filter((x) => x !== p.id))} /></td>
                  <td className="p-2"><span className="relative block size-12 overflow-hidden rounded-lg border-2 border-ink">{p.images[0] && <Image src={imgUrl(p.images[0])} alt="" fill sizes="48px" className="object-cover" />}</span></td>
                  <td className="p-2"><b>{p.name}</b> {p.featured && <span className="ml-1 rounded-full bg-sun px-2 py-0.5 text-[10px] font-black">FEATURED</span>}<br /><span className="text-xs text-ink-soft">{p.sku} · {p.category_name}{p.variants && p.variants.length > 0 ? ` · ${p.variants.length} options` : ""}</span></td>
                  <td className="p-2">{inr(p.price)}{p.variants && p.variants.length > 1 ? "+" : ""}</td>
                  <td className={`p-2 font-black ${p.stock <= 5 ? "text-tangerine-deep" : ""}`}>{p.stock}</td>
                  <td className="p-2"><span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${p.status === "published" ? "bg-mint/50" : "bg-ink/10"}`}>{p.status}</span></td>
                  <td className="p-2 text-right"><button onClick={() => edit(p)} className="font-extrabold text-purple">Edit</button><button onClick={() => confirm(`Archive ${p.name}?`) && api(`/admin/products/${p.id}`, { method: "DELETE" }).then(reload)} className="ml-3 font-extrabold text-berry">Archive</button></td></tr>))}
            </tbody></table></div>
        )}
        <Pager page={page} last={data?.meta.last_page ?? 1} onPage={setPage} />
      </Card>
    </>
  );
}

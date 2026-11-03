"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { ages } from "@/data/catalog";
import { api, type ApiProduct } from "@/lib/api";
import { ProductCard } from "./ProductCard";
import { useStore } from "@/components/providers/StoreProvider";
import { inr } from "@/lib/format";

interface Meta { categories: { slug: string; short: string; name: string; blurb: string; bg: string; ink: string; count: number }[]; brands: { slug: string; name: string }[] }
interface Page { data: ApiProduct[]; meta: { total: number; page: number; last_page: number } }

const sorts = [
  { v: "", l: "Featured" }, { v: "popularity", l: "Popularity" }, { v: "newest", l: "Newest first" }, { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" }, { v: "rating", l: "Top rated" }, { v: "discount", l: "Biggest discount" },
];
const types = [{ v: "indoor", l: "Indoor" }, { v: "outdoor", l: "Outdoor" }, { v: "educational", l: "Educational" }];
const tagChips = [{ v: "new", l: "New arrivals" }, { v: "bestseller", l: "Bestsellers" }, { v: "trending", l: "Trending" }, { v: "gift", l: "Gift ideas" }, { v: "learning", l: "Learning" }];
const PER_PAGE = 12;

export function ShopClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const { compare } = useStore();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [items, setItems] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [last, setLast] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const qs = sp.toString();
  const req = useRef(0);

  useEffect(() => { api<Meta>("/meta").then(setMeta).catch(() => {}); }, []);

  const csv = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const set = useCallback((k: string, v: string | null) => {
    const n = new URLSearchParams(qs);
    if (!v) n.delete(k); else n.set(k, v);
    router.replace(`${path}?${n.toString()}`, { scroll: false });
  }, [qs, router, path]);
  const toggle = (k: string, v: string) => {
    const cur = csv(k);
    set(k, (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(",") || null);
  };

  // Every filter lives in the URL, so results are shareable and survive refresh.
  useEffect(() => {
    const id = ++req.current;
    setLoading(true); setError(null);
    api<Page>(`/products?${qs}${qs ? "&" : ""}per_page=${PER_PAGE}&page=1`)
      .then((r) => { if (id !== req.current) return; setItems(r.data); setTotal(r.meta.total); setPage(1); setLast(r.meta.last_page); })
      .catch((e) => id === req.current && setError(e.message))
      .finally(() => id === req.current && setLoading(false));
  }, [qs]);

  const loadMore = async () => {
    setMore(true);
    try {
      const r = await api<Page>(`/products?${qs}${qs ? "&" : ""}per_page=${PER_PAGE}&page=${page + 1}`);
      setItems((x) => [...x, ...r.data]); setPage(page + 1); setLast(r.meta.last_page);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load more"); }
    setMore(false);
  };

  const [min, setMin] = useState(sp.get("min") ?? "");
  const [max, setMax] = useState(sp.get("max") ?? "");
  useEffect(() => { setMin(sp.get("min") ?? ""); setMax(sp.get("max") ?? ""); }, [sp]);

  const cats = csv("category");
  const activeCat = meta?.categories.find((c) => c.slug === cats[0]);
  const age = ages.find((a) => a.slug === csv("age")[0]);
  const q = sp.get("q");
  const title = cats.length === 1 && activeCat ? activeCat.name : csv("age").length === 1 && age ? `Toys for ages ${age.range}` : q ? `Results for “${q}”` : "Shop All Toys";
  const active = useMemo(() => [...sp.keys()].filter((k) => k !== "sort").length, [sp]);

  const Check = ({ on, onChange, children }: { on: boolean; onChange: () => void; children: React.ReactNode }) => (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-[14.5px] font-bold">
      <input type="checkbox" checked={on} onChange={onChange} className="size-4 accent-purple" /> {children}
    </label>
  );
  const Group = ({ title: t, children }: { title: string; children: React.ReactNode }) => (
    <fieldset className="border-b-2 border-ink/10 py-4 first:pt-0"><legend className="mb-2 font-display text-lg font-bold">{t}</legend>{children}</fieldset>
  );

  const filters = (
    <div>
      <Group title="Category">{meta?.categories.map((c) => <Check key={c.slug} on={cats.includes(c.slug)} onChange={() => toggle("category", c.slug)}>{c.short} <span className="text-ink-soft">({c.count})</span></Check>)}</Group>
      <Group title="Price range (₹)">
        <form onSubmit={(e) => { e.preventDefault(); const n = new URLSearchParams(qs); min ? n.set("min", min) : n.delete("min"); max ? n.set("max", max) : n.delete("max"); router.replace(`${path}?${n.toString()}`, { scroll: false }); }} className="flex items-center gap-2">
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} placeholder="Min" aria-label="Minimum price" className="h-10 w-full rounded-full border-2 border-ink px-3 text-sm font-bold" />
          <span>–</span>
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} placeholder="Max" aria-label="Maximum price" className="h-10 w-full rounded-full border-2 border-ink px-3 text-sm font-bold" />
          <button className="btn btn-sm btn-purple !px-3">Go</button>
        </form>
        <div className="mt-2 flex flex-wrap gap-2">{[499, 999, 1999].map((v) => <button key={v} onClick={() => { const n = new URLSearchParams(qs); n.delete("min"); n.set("max", String(v)); router.replace(`${path}?${n.toString()}`, { scroll: false }); }} className={`rounded-full border-2 border-ink px-3 py-1 text-xs font-extrabold ${sp.get("max") === String(v) ? "bg-purple text-white" : "bg-white"}`}>Under {inr(v)}</button>)}</div>
      </Group>
      <Group title="Age group">{ages.map((a) => <Check key={a.slug} on={csv("age").includes(a.slug)} onChange={() => toggle("age", a.slug)}>{a.range} years · {a.title}</Check>)}</Group>
      <Group title="Brand">{meta?.brands.map((b) => <Check key={b.slug} on={csv("brand").includes(b.slug)} onChange={() => toggle("brand", b.slug)}>{b.name}</Check>)}</Group>
      <Group title="Toy type">{types.map((t) => <Check key={t.v} on={csv("type").includes(t.v)} onChange={() => toggle("type", t.v)}>{t.l}</Check>)}</Group>
      <Group title="Customer rating">{[4, 3, 2].map((r) => <Check key={r} on={sp.get("rating") === String(r)} onChange={() => set("rating", sp.get("rating") === String(r) ? null : String(r))}>{r}★ &amp; up</Check>)}</Group>
      <Group title="Discount">{[10, 20, 30].map((d) => <Check key={d} on={sp.get("discount") === String(d)} onChange={() => set("discount", sp.get("discount") === String(d) ? null : String(d))}>{d}% or more</Check>)}</Group>
      <Group title="Availability"><Check on={sp.get("availability") === "in_stock"} onChange={() => set("availability", sp.get("availability") === "in_stock" ? null : "in_stock")}>In stock only</Check></Group>
      <Group title="Collections">{tagChips.map((t) => <Check key={t.v} on={sp.get("tag") === t.v} onChange={() => set("tag", sp.get("tag") === t.v ? null : t.v)}>{t.l}</Check>)}</Group>
    </div>
  );

  return (
    <div className="pb-24">
      <section className="relative overflow-hidden border-b-2 border-ink" style={{ background: activeCat?.bg ?? age?.bg ?? "#7657F6", color: activeCat?.ink ?? age?.ink ?? "#fff" }}>
        <div className="container-k py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-3 text-sm font-bold opacity-80"><Link href="/" className="hover:underline">Home</Link> / <span>Shop</span></nav>
          <h1 className="display-section">{title}</h1>
          <p className="mt-3 max-w-xl text-lg opacity-90">{activeCat?.blurb ?? age?.blurb ?? "Every toy is quality-checked, age-labelled and ready to ship."}</p>
        </div>
      </section>

      <div className="container-k mt-8 grid gap-8 lg:grid-cols-[270px_1fr]">
        <aside className="hidden lg:block"><div className="sticky top-[130px] max-h-[calc(100vh-150px)] overflow-y-auto rounded-[28px] border-2 border-ink bg-white p-5">{filters}</div></aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold text-ink-soft"><b className="text-ink">{total}</b> {total === 1 ? "toy" : "toys"} found
              {active > 0 && <button onClick={() => router.replace(path, { scroll: false })} className="ml-3 text-purple underline underline-offset-4">Clear all filters</button>}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="btn btn-sm btn-white lg:hidden"><SlidersHorizontal size={16} /> Filters{active ? ` (${active})` : ""}</button>
              <label className="flex items-center gap-2 text-sm font-bold"><span className="hidden sm:inline">Sort by</span>
                <select value={sp.get("sort") ?? ""} onChange={(e) => set("sort", e.target.value || null)} className="rounded-full border-2 border-ink bg-white px-4 py-2 font-extrabold">{sorts.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select></label>
            </div>
          </div>

          {error ? (
            <div className="mt-8 rounded-[28px] border-2 border-berry bg-berry/10 p-8 text-center"><p className="font-display text-xl font-bold">We couldn&apos;t load the toys</p><p className="mt-1 text-ink-soft">{error}</p><button onClick={() => router.refresh()} className="btn btn-orange mt-4">Try again</button></div>
          ) : loading ? (
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <li key={i} className="aspect-[3/4] animate-pulse rounded-[26px] border-2 border-ink/10 bg-cream-deep" />)}</ul>
          ) : items.length === 0 ? (
            <div className="mt-8 grid place-items-center rounded-[32px] border-2 border-dashed border-ink/30 py-20 text-center">
              <SearchX size={48} className="text-purple" /><p className="mt-3 font-display text-2xl font-bold">No toys match those filters</p>
              <p className="mt-1 text-ink-soft">Try removing a filter or searching for something else.</p>
              <button onClick={() => router.replace(path)} className="btn btn-orange mt-5">Show all toys</button>
            </div>
          ) : (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {items.map((p, i) => <li key={p.id}><ProductCard product={p} showCompare priority={i < 3} sizes="(max-width:768px) 50vw, (max-width:1280px) 33vw, 28vw" /></li>)}
              </ul>
              <div className="mt-10 text-center">
                <p className="mb-3 text-sm font-bold text-ink-soft">Showing {items.length} of {total}</p>
                {page < last && <button onClick={loadMore} disabled={more} className="btn btn-purple">{more ? "Loading…" : "Load more toys"}</button>}
              </div>
            </>
          )}
        </div>
      </div>

      {compare.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <Link href="/compare" className="btn btn-ink shadow-xl">Compare {compare.length} {compare.length === 1 ? "toy" : "toys"} →</Link>
        </div>
      )}

      {drawer && (
        <div className="fixed inset-0 z-[85] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/55" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-[32px] border-2 border-ink bg-cream">
            <div className="flex items-center justify-between border-b-2 border-ink px-5 py-3"><h2 className="font-display text-2xl font-bold">Filters</h2><button onClick={() => setDrawer(false)} aria-label="Close filters" className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white"><X size={20} /></button></div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{filters}</div>
            <div className="border-t-2 border-ink bg-white p-4"><button onClick={() => setDrawer(false)} className="btn btn-purple w-full">Show {total} toys</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

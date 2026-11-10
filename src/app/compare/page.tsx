"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, imgUrl, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import { Stars } from "@/components/ui/bits";
import { AddButton } from "@/components/products/ProductCard";

export default function ComparePage() {
  const { compare, toggleCompare } = useStore();
  const [items, setItems] = useState<ApiProduct[] | null>(null);
  useEffect(() => {
    if (!compare.length) { setItems([]); return; }
    api<{ data: ApiProduct[] }>(`/products/by-ids?ids=${compare.join(",")}`).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [compare]);

  if (!items) return <div className="container-k py-24 text-center font-display text-2xl">Loading…</div>;
  if (!items.length) return <div className="container-k py-24 text-center"><h1 className="display-section">Compare toys</h1><p className="mt-3 text-ink-soft">Tap the compare icon on up to 4 toys to see them side by side.</p><Link href="/shop" className="btn btn-orange mt-6">Browse toys</Link></div>;

  const rows: [string, (p: ApiProduct) => React.ReactNode][] = [
    ["Price", (p) => <><b className="text-lg">{inr(p.price)}</b>{p.discount > 0 && <span className="ml-2 text-sm text-ink-soft line-through">{inr(p.mrp)}</span>}</>],
    ["Brand", (p) => p.brand ?? "—"], ["Rating", (p) => <span className="inline-flex items-center gap-1.5"><Stars value={p.rating} size={14} /> {p.rating.toFixed(1)} ({p.reviews})</span>],
    ["Age suitability", (p) => `${p.age.replace("-plus", "+")} years`], ["Toy type", (p) => p.toy_type], ["Material", (p) => p.material ?? "—"],
    ["Dimensions", (p) => p.dimensions ?? "—"], ["Weight", (p) => p.weight ?? "—"],
    ["Availability", (p) => (p.availability === "out_of_stock" ? "Out of stock" : p.availability === "low_stock" ? `Only ${p.stock} left` : "In stock")],
    ["Key features", (p) => <ul className="list-disc space-y-1 pl-4">{p.features?.map((f) => <li key={f}>{f}</li>)}</ul>],
  ];
  return (
    <div className="container-k py-10">
      <h1 className="display-section">Compare toys</h1>
      <div className="mt-8 overflow-x-auto rounded-[28px] border-2 border-ink bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14.5px] font-semibold">
          <thead><tr><th className="w-36 p-4" />{items.map((p) => (
            <th key={p.id} className="relative min-w-[200px] border-l-2 border-ink/10 p-4 align-top">
              <button onClick={() => toggleCompare(p.id)} aria-label={`Remove ${p.name}`} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full border-2 border-ink bg-white"><X size={14} /></button>
              <Link href={`/product/${p.slug}`} className="block"><span className="relative mx-auto block aspect-square w-32 overflow-hidden rounded-2xl border-2 border-ink"><Image src={imgUrl(p.images[0])} alt="" fill sizes="128px" className="object-cover" /></span><span className="mt-2 block font-extrabold hover:text-purple">{p.name}</span></Link>
            </th>))}</tr></thead>
          <tbody>
            {rows.map(([k, fn]) => <tr key={k} className="border-t-2 border-ink/10"><th scope="row" className="p-4 font-extrabold text-ink-soft">{k}</th>{items.map((p) => <td key={p.id} className="border-l-2 border-ink/10 p-4 align-top">{fn(p)}</td>)}</tr>)}
            <tr className="border-t-2 border-ink/10"><th className="p-4" />{items.map((p) => <td key={p.id} className="border-l-2 border-ink/10 p-4"><div className="flex"><AddButton id={p.id} name={p.name} disabled={p.availability === "out_of_stock"} slug={p.slug} hasVariants={!!p.has_variants} /></div></td>)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

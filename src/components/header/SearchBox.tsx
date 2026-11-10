"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { api, imgUrl, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";

interface Suggest { products: ApiProduct[]; categories: { slug: string; short: string }[] }

export function SearchBox({ onDone }: { onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [res, setRes] = useState<Suggest | null>(null);
  const box = useRef<HTMLFormElement>(null);
  const term = q.trim();

  // Type-ahead from the API (typo-tolerant on the server), debounced.
  useEffect(() => {
    if (term.length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => {
      api<Suggest>(`/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctl.signal }).then(setRes).catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [term]);

  useEffect(() => {
    const off = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setFocus(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, []);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) return;
    setFocus(false);
    router.push(`/shop?q=${encodeURIComponent(term)}`);
    onDone?.();
  };

  const results = term.length > 1 ? res?.products ?? [] : [];
  const cats = term.length > 1 ? res?.categories ?? [] : [];

  return (
    <form ref={box} onSubmit={go} role="search" className="relative w-full">
      <div className="flex items-center rounded-full border-2 border-ink bg-white pl-4 pr-1.5 shadow-[0_4px_0_0_var(--color-ink)] transition-shadow focus-within:shadow-[0_4px_0_0_var(--color-purple)]">
        <Search size={19} className="shrink-0 text-ink-soft" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)}
          placeholder="Search toys, e.g. teddy, robot, puzzle…"
          aria-label="Search toys"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] font-semibold outline-none placeholder:font-semibold placeholder:text-ink/40 focus-visible:!outline-none"
        />
        {q && <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setRes(null); }} className="grid size-8 place-items-center rounded-full hover:bg-cream-deep"><X size={16} /></button>}
        <button type="submit" className="btn btn-purple btn-sm !min-h-[34px] !shadow-none !border-0 !px-4">Search</button>
      </div>
      {focus && term.length > 1 && res && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-3xl border-2 border-ink bg-white p-2 shadow-[0_20px_40px_-16px_rgba(41,36,59,.5)]">
          {results.length === 0 && cats.length === 0 ? (
            <p className="p-4 text-sm font-semibold text-ink-soft">No toys found for “{q}”. Try “bear”, “car” or “puzzle”.</p>
          ) : (
            <>
              {cats.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2">
                  {cats.map((c) => <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => { setFocus(false); onDone?.(); }} className="rounded-full bg-purple-soft px-3 py-1 text-xs font-extrabold text-purple hover:bg-purple hover:text-white">{c.short}</Link>)}
                </div>
              )}
              {results.map((p) => (
                <Link key={p.id} href={`/product/${p.slug}`} onClick={() => { setFocus(false); onDone?.(); }} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-cream">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border-2 border-ink"><Image src={imgUrl(p.images[0])} alt="" fill sizes="48px" className="object-cover" /></span>
                  <span className="min-w-0 flex-1 truncate text-sm font-extrabold">{p.name}</span>
                  <span className="text-sm font-black">{inr(p.price)}</span>
                </Link>
              ))}
              <button type="submit" className="mt-1 w-full rounded-2xl bg-purple-soft py-2.5 text-sm font-extrabold text-purple hover:bg-purple hover:text-white">See all results for “{q}”</button>
            </>
          )}
        </div>
      )}
    </form>
  );
}

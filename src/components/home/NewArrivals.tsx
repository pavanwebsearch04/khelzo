"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, Plus } from "lucide-react";
import { imgUrl } from "@/lib/api";
import { inr } from "@/lib/format";
import { useHome } from "./HomeData";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/bits";
import { useStore } from "@/components/providers/StoreProvider";
import { WishButton } from "@/components/products/ProductCard";

export function NewArrivals() {
  const { openQuickView, addToCart } = useStore();
  const reduce = useReducedMotion();
  const { data } = useHome();
  const list = useMemo(() => (data?.new ?? []).slice(0, 7), [data]);
  if (!list.length) return null;
  // Editorial rhythm: tall / short cards alternate in a masonry-ish three-column flow
  const tall = [true, false, false, true, true, false, false];
  return (
    <section id="new-arrivals" className="relative py-16 md:py-24" aria-labelledby="new-title">
      <div className="container-k">
        <Reveal><SectionHead eyebrow="Just landed" title={<span id="new-title">Fresh From the Toy Box</span>} sub="New arrivals, unboxed this week." action={{ label: "View all new arrivals", href: "/shop?tag=new" }} /></Reveal>
        <ul className="mt-10 columns-2 gap-4 md:columns-3 md:gap-6 lg:columns-4 [&>li]:mb-4 md:[&>li]:mb-6">
          {list.map((p, i) => (
            <Reveal as="li" key={p.id} kind="up" delay={(i % 4) * 0.08} className="break-inside-avoid">
              <motion.article whileHover={reduce ? undefined : { y: -6 }} className="group relative overflow-hidden rounded-[28px] border-2 border-ink bg-white shadow-[0_5px_0_0_var(--color-ink)]">
                <div className={`relative overflow-hidden bg-cream-deep ${tall[i] ? "aspect-[3/4]" : "aspect-square"}`}>
                  <Image src={imgUrl(p.images[0])} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  <button type="button" onClick={() => openQuickView(p.id)} className="absolute inset-0" aria-label={`Quick view ${p.name}`} />
                  <span className="pointer-events-none absolute left-3 top-3 -rotate-3 rounded-lg border-2 border-ink bg-mint px-2.5 py-1 text-[11px] font-black uppercase tracking-wider">New Arrival</span>
                  <div className="absolute right-3 top-3"><WishButton id={p.id} /></div>
                  <button type="button" onClick={() => openQuickView(p.id)} className="absolute bottom-3 left-3 hidden size-10 place-items-center rounded-full border-2 border-ink bg-white opacity-0 transition-opacity group-hover:opacity-100 md:grid" aria-label="Quick view"><Eye size={17} /></button>
                  <button type="button" onClick={() => (p.has_variants ? openQuickView(p.id) : addToCart(p.id, 1, p.name))} className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full border-2 border-ink bg-tangerine text-white shadow-[0_3px_0_0_var(--color-ink)] transition-transform hover:scale-110 active:translate-y-0.5 active:shadow-none" aria-label={p.has_variants ? `Choose options for ${p.name}` : `Quick add ${p.name} to cart`}><Plus size={22} strokeWidth={3} /></button>
                </div>
                <div className="p-4">
                  <h3 className="font-sans text-[16.5px] font-extrabold leading-snug line-clamp-2">{p.name}</h3>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-xl font-black">{inr(p.price)}</span>
                    {p.discount > 0 && <span className="text-sm text-ink-soft line-through">{inr(p.mrp)}</span>}
                  </div>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

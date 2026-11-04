"use client";

import Image from "next/image";
import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Eye } from "lucide-react";
import { byTag, discount } from "@/data/catalog";
import { inr } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, Stars } from "@/components/ui/bits";
import { useStore } from "@/components/providers/StoreProvider";
import { AddButton, WishButton } from "@/components/products/ProductCard";
import { Star } from "@/components/art/toys";

export function Bestsellers() {
  const { openQuickView } = useStore();
  const reduce = useReducedMotion();
  const list = useMemo(() => [...byTag("bestseller")].sort((a, b) => b.reviews - a.reviews), []);
  const [hero, ...rest] = list;
  const small = rest.slice(0, 4);

  return (
    <section id="bestsellers" className="relative overflow-x-clip py-16 md:py-24" aria-labelledby="best-title">
      <div className="container-k">
        <Reveal><SectionHead eyebrow="Bestsellers" title={<span id="best-title">Little Stars, Big Favourites</span>} sub="Ranked by real-world love: reviews, ratings and repeat gifting." action={{ label: "All bestsellers", href: "/shop?tag=bestseller" }} /></Reveal>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_1fr]">
          {/* Spotlight */}
          <Reveal kind="left">
            <article className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[40px] border-2 border-ink bg-purple p-5 text-white shadow-[0_8px_0_0_var(--color-ink)] md:p-7">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-black text-ink"><Award size={17} /> No. 1 Bestseller</span>
                <WishButton id={hero.id} />
              </div>
              <motion.div className="relative mx-auto mt-5 w-full max-w-[420px] flex-1" whileHover={reduce ? undefined : { rotate: -2, scale: 1.03 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}>
                <div className="relative mx-auto aspect-square min-h-[260px] w-full overflow-hidden rounded-[32px] border-2 border-ink bg-white">
                  <Image src={hero.images[0]} alt={hero.name} fill sizes="(max-width:1024px) 90vw, 440px" className="object-cover" priority={false} />
                  <button onClick={() => openQuickView(hero.id)} className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full border-2 border-ink bg-white text-ink transition-transform hover:scale-110" aria-label={`Quick view ${hero.name}`}><Eye size={19} /></button>
                </div>
                <Star className="k-float absolute -right-5 -top-5 w-14" />
                <div className="absolute -left-4 top-6 grid size-20 rotate-[-12deg] place-items-center rounded-full border-2 border-ink bg-tangerine text-center font-display text-xl font-bold leading-none shadow-[0_4px_0_0_var(--color-ink)]">{discount(hero)}%<br /><span className="text-xs">OFF</span></div>
              </motion.div>
              <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h3 className="font-display text-3xl font-bold leading-tight">{hero.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm text-white/85"><Stars value={hero.rating} size={16} /> <b>{hero.rating}</b> · {hero.reviews.toLocaleString("en-IN")} reviews</div>
                  <p className="mt-2 max-w-sm text-white/80">{hero.desc}</p>
                </div>
                <div className="text-right"><div className="text-3xl font-black">{inr(hero.price)}</div><div className="text-white/70 line-through">{inr(hero.mrp)}</div></div>
              </div>
              <div className="mt-5 flex max-w-sm"><AddButton id={hero.id} tone="sun" /></div>
            </article>
          </Reveal>

          {/* Ranked list */}
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-4">
            {small.map((p, i) => (
              <Reveal as="li" key={p.id} kind="right" delay={0.08 * i}>
                <article className="group relative flex h-full gap-4 overflow-hidden rounded-[28px] border-2 border-ink bg-white p-3 shadow-[0_5px_0_0_var(--color-ink)] transition-all hover:-translate-y-1 hover:shadow-[0_10px_0_0_var(--color-ink)] sm:flex-col lg:flex-row">
                  <span className="absolute -bottom-3 right-3 font-display text-[88px] font-bold leading-none text-purple-soft select-none" aria-hidden="true">{i + 2}</span>
                  <WishButton id={p.id} className="absolute right-2.5 top-2.5 z-10 !size-9 shrink-0" />
                  <button onClick={() => openQuickView(p.id)} className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-ink sm:w-full lg:w-32" aria-label={`Quick view ${p.name}`}>
                    <Image src={p.images[0]} alt={p.name} fill sizes="(max-width:640px) 112px, (max-width:1024px) 30vw, 128px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </button>
                  <div className="relative flex min-w-0 flex-1 flex-col justify-center gap-1 pr-9">
                    <span className="w-fit rounded-full bg-sun px-2.5 py-0.5 text-[10.5px] font-black uppercase tracking-wider">Bestseller</span>
                    <h3 className="font-sans text-[16.5px] font-extrabold leading-snug line-clamp-2">{p.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-ink-soft"><Stars value={p.rating} size={13} /> {p.rating} ({p.reviews.toLocaleString("en-IN")})</div>
                    <div className="mt-1 flex items-center gap-3">
                      <span className="text-xl font-black">{inr(p.price)}</span>
                      <AddButton id={p.id} compact />
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

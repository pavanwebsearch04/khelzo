"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { byTag, categoryBySlug, type CategorySlug } from "@/data/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/bits";
import { ProductCard } from "@/components/products/ProductCard";
import { Block, Sparkle } from "@/components/art/toys";

const tabs: { label: string; cat: CategorySlug | "all" }[] = [
  { label: "All Favourites", cat: "all" },
  { label: "Soft Toys", cat: "soft-toys" },
  { label: "Remote Control", cat: "remote-control" },
  { label: "Vehicles", cat: "vehicles" },
  { label: "Building", cat: "building" },
  { label: "Pretend Play", cat: "pretend-play" },
];

export function Trending() {
  const [tab, setTab] = useState<(typeof tabs)[number]["cat"]>("all");
  const all = useMemo(() => byTag("trending"), []);
  const list = useMemo(() => (tab === "all" ? all : all.filter((p) => p.category === tab)).slice(0, 8), [tab, all]);
  const viewAll = tab === "all" ? "/shop?tag=trending" : `/shop?tag=trending&category=${tab}`;

  return (
    <section id="trending" className="relative overflow-hidden py-16 md:py-24" aria-labelledby="trend-title">
      <div className="pointer-events-none absolute -right-40 top-10 size-[460px] rounded-full bg-purple-soft" aria-hidden="true" />
      <Block color="yellow" className="k-float pointer-events-none absolute -left-8 bottom-24 hidden w-36 rotate-12 opacity-90 lg:block" />
      <Sparkle className="k-twinkle pointer-events-none absolute right-[12%] top-20 hidden w-8 md:block" fill="#FF8748" />
      <div className="container-k relative">
        <Reveal><SectionHead eyebrow="Trending now" title={<span id="trend-title">Everyone&apos;s Favourite Toys</span>} sub="The toys kids can't stop asking for, loved by parents for quality and value." action={{ label: "View All", href: viewAll }} /></Reveal>

        <Reveal delay={0.1}>
          <div role="tablist" aria-label="Filter trending toys" className="no-scrollbar -mx-4 mt-8 flex gap-2.5 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:px-0">
            {tabs.map((t) => {
              const on = tab === t.cat;
              return (
                <button key={t.cat} role="tab" aria-selected={on} onClick={() => setTab(t.cat)} className={`relative shrink-0 rounded-full border-2 border-ink px-5 py-2.5 text-[15px] font-extrabold transition-transform hover:-translate-y-0.5 ${on ? "text-white" : "bg-white"}`}>
                  {on && <motion.span layoutId="trend-pill" className="absolute inset-0 rounded-full bg-purple shadow-[0_4px_0_0_var(--color-ink)]" transition={{ type: "spring", stiffness: 380, damping: 30 }} />}
                  <span className="relative">{t.cat === "all" ? t.label : categoryBySlug(t.cat)?.short ?? t.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div role="tabpanel" className="mt-8">
          <AnimatePresence mode="popLayout">
            <motion.ul
              key={tab}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4 }}
              className="grid grid-cols-2 gap-3 pb-4 pt-1 sm:gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4"
            >
              {list.map((p, i) => (
                <motion.li key={p.id} className="min-w-0" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProductCard product={p} />
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

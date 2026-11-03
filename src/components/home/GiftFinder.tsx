"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { gifts } from "@/data/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, Scallop } from "@/components/ui/bits";
import { GiftBox, Sparkle, Star } from "@/components/art/toys";

const confetti = [
  [4, 12, "#7657F6", 14], [12, 70, "#FFD84D", 10], [22, 24, "#43D6C0", 12], [36, 84, "#FF8748", 12], [52, 6, "#76C9FF", 12],
  [66, 78, "#7657F6", 10], [78, 14, "#FF8748", 14], [90, 60, "#43D6C0", 12], [96, 20, "#FFD84D", 10],
] as const;

export function GiftFinder() {
  const reduce = useReducedMotion();
  return (
    <section id="gift-finder" className="relative bg-[#FFE0EC] pb-24 pt-6" aria-labelledby="gift-title">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]"><Scallop color="#FFE0EC" /></div>
      {confetti.map(([l, t, c, s], i) => (
        <span key={i} className="k-float pointer-events-none absolute rounded-sm" style={{ left: `${l}%`, top: `${t}%`, width: s, height: s * 0.55, background: c, ["--r" as string]: `${i * 37}deg`, ["--fd" as string]: `${5 + (i % 3)}s`, ["--fdl" as string]: `${i * 0.3}s` }} aria-hidden="true" />
      ))}
      <div className="container-k relative">
        <Reveal><SectionHead eyebrow="Gift finder" title={<span id="gift-title">Make Their Day Magical</span>} sub="Pick an occasion or a budget and we'll point you to toys worth unwrapping." align="center" /></Reveal>

        <ul className="mt-14 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-8">
          {gifts.map((g, i) => (
            <Reveal as="li" key={g.slug} kind="drop" delay={i * 0.08}>
              <Link href={g.href} className="group relative block pt-10 outline-offset-8">
                {/* stacked paper layers */}
                <span className="absolute inset-x-1 bottom-0 top-14 rotate-[-3deg] rounded-[28px] border-2 border-ink bg-white/70 transition-transform duration-300 group-hover:-rotate-6" aria-hidden="true" />
                <span className="absolute inset-x-1 bottom-0 top-14 rotate-[2.5deg] rounded-[28px] border-2 border-ink bg-white/80 transition-transform duration-300 group-hover:rotate-6" aria-hidden="true" />
                <span className="relative block rounded-[28px] border-2 border-ink px-4 pb-6 pt-16 text-center text-white shadow-[0_6px_0_0_var(--color-ink)] transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_14px_0_0_var(--color-ink)]" style={{ background: g.color }}>
                  <motion.span className="absolute -top-14 left-1/2 block w-28 -translate-x-1/2 md:w-32" whileHover={reduce ? undefined : { rotate: [0, -8, 8, -4, 0], y: -10 }} transition={{ duration: 0.5 }}>
                    <GiftBox color={g.color} ribbon={g.ribbon} className="w-full drop-shadow-[0_8px_0_rgba(41,36,59,.22)]" />
                    <Sparkle className="k-twinkle absolute -right-3 top-2 w-6 opacity-0 transition-opacity group-hover:opacity-100" fill="#fff" />
                  </motion.span>
                  <span className="block font-display text-[22px] font-bold leading-tight text-white [text-shadow:0_2px_0_rgba(41,36,59,.35)] md:text-[26px]">{g.title}</span>
                  <span className="mt-1 block text-sm font-bold text-white/90">{g.sub}</span>
                  <span className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-extrabold text-ink transition-colors group-hover:bg-sun">Find gifts <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
        <Star className="k-twinkle pointer-events-none absolute bottom-10 left-[6%] hidden w-10 md:block" />
      </div>
      <div className="absolute inset-x-0 bottom-0"><Scallop color="#FFF8ED" /></div>
    </section>
  );
}

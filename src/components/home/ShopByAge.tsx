"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ages } from "@/data/catalog";
import { useHome } from "./HomeData";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, Scallop } from "@/components/ui/bits";
import { Cloud, Star } from "@/components/art/toys";

export function ShopByAge() {
  const { data } = useHome();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const draw = useTransform(scrollYProgress, [0, 0.85], [0, 1]);

  return (
    <section id="shop-by-age" ref={ref} className="relative bg-[#DDF2FF] pb-20 pt-6 md:pb-28" aria-labelledby="age-title">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] text-[#DDF2FF]"><Scallop color="#DDF2FF" /></div>
      <Cloud className="k-float absolute right-[6%] top-10 hidden w-44 opacity-80 md:block" style={{ ["--fd" as string]: "9s" }} />
      <Star className="k-twinkle absolute left-[4%] top-16 hidden w-10 md:block" />

      <div className="container-k relative">
        <Reveal><SectionHead eyebrow="Shop by age" title={<span id="age-title">The Perfect Toy for Every Age</span>} sub="Follow the journey from first rattles to robotics. Each stop shows what suits your child right now." /></Reveal>

        <div className="relative mt-14">
          {/* Journey path */}
          <svg className="pointer-events-none absolute inset-x-0 top-[28%] hidden h-40 w-full lg:block" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 90C140 10 220 10 300 80S460 150 600 80 800 10 900 80s190 70 280 0" fill="none" stroke="#29243B" strokeOpacity=".15" strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" />
            <motion.path d="M20 90C140 10 220 10 300 80S460 150 600 80 800 10 900 80s190 70 280 0" fill="none" stroke="#7657F6" strokeWidth="6" strokeDasharray="2 16" strokeLinecap="round" style={{ pathLength: draw }} />
          </svg>

          <ul className="grid grid-cols-2 gap-x-3 gap-y-9 pt-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5 lg:pt-0">
            {ages.map((a, i) => {
              const n = data?.age_counts?.[a.slug] ?? 0;
              return (
                <Reveal as="li" key={a.slug} kind="up" delay={i * 0.09} className={`min-w-0 ${i === 4 ? "col-span-2 sm:col-span-1" : ""} ${i % 2 ? "lg:mt-14" : ""}`}>
                  <Link href={`/shop?age=${a.slug}`} className="group relative block rounded-[30px] border-2 border-ink p-3 pb-5 shadow-[0_6px_0_0_var(--color-ink)] transition-all duration-300 hover:-translate-y-2 hover:rotate-[-1.5deg] hover:shadow-[0_14px_0_0_var(--color-ink)]" style={{ background: a.bg, color: a.ink }}>
                    <div className={`relative aspect-[4/4.4] overflow-hidden rounded-[22px] border-2 border-ink ${i === 4 ? "max-sm:aspect-[16/9]" : ""}`}>
                      <Image src={a.image} alt={`Toys for ages ${a.range}`} fill sizes="(max-width:1024px) 70vw, 20vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                    <div className="absolute -top-5 left-5 grid min-w-[74px] place-items-center rounded-2xl border-2 border-ink bg-white px-3 py-1.5 font-display text-[26px] font-bold leading-none text-ink shadow-[0_4px_0_0_var(--color-ink)] transition-transform group-hover:-rotate-6 group-hover:scale-110" style={{ color: a.bg === "#FFD84D" || a.bg === "#9ED8FF" ? "#29243B" : a.bg }}>
                      {a.range}<span className="text-[10px] font-black uppercase tracking-wider text-ink-soft">years</span>
                    </div>
                    <div className="px-2 pt-4">
                      <h3 className="font-display text-[19px] font-bold leading-tight sm:text-[24px]">{a.title}</h3>
                      <p className="mt-1.5 hidden text-[14.5px] font-semibold leading-snug opacity-90 sm:block">{a.blurb}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider opacity-80">{n} toys</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3.5 py-1.5 text-sm font-extrabold text-ink transition-colors group-hover:bg-ink group-hover:text-white">Explore <ArrowRight size={15} /></span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0"><Scallop color="#FFF8ED" flip={false} /></div>
    </section>
  );
}

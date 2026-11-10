"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Quote, Star as StarIcon } from "lucide-react";
import { imgUrl } from "@/lib/api";
import { useHome } from "./HomeData";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, Stars } from "@/components/ui/bits";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { Block, Cloud, Sparkle, Star } from "@/components/art/toys";

export function Brands() {
  const reduce = useReducedMotion();
  const { data } = useHome();
  const brands = data?.brands ?? [];
  const row = [...brands, ...brands, ...brands];
  if (!brands.length) return null;
  return (
    <section className="relative border-y-2 border-ink bg-white py-12 md:py-16" aria-labelledby="brand-title">
      <div className="container-k">
        <Reveal><SectionHead eyebrow="Our toy labels" title={<span id="brand-title">Made With Play in Mind</span>} align="center" /></Reveal>
      </div>
      <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        <ul className={`flex gap-4 py-2 ${reduce ? "flex-wrap justify-center px-4" : "k-marquee"}`} style={{ ["--md" as string]: "46s" }}>
          {(reduce ? brands : row).map((b, i) => (
            <li key={b + i} className="shrink-0 rounded-2xl border-2 border-ink bg-cream px-7 py-4 font-display text-2xl font-bold tracking-tight text-ink/80 transition-colors hover:bg-sun" aria-hidden={!reduce && i >= brands.length}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Reviews() {
  const scroller = useRef<HTMLUListElement>(null);
  const { data } = useHome();
  const reviews = data?.reviews ?? [];
  const avg = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  if (!reviews.length) return null; // shown only once real customers have reviewed
  const colors = ["#FFD84D", "#43D6C0", "#FFB86B", "#B79BFF", "#76C9FF"];
  return (
    <section className="relative py-16 md:py-24" aria-labelledby="rev-title">
      <Cloud className="k-float pointer-events-none absolute right-[4%] top-8 hidden w-40 opacity-70 md:block" tone="#fff" />
      <div className="container-k">
        <div className="grid gap-8 lg:grid-cols-[360px_1fr] lg:gap-12">
          <Reveal kind="left">
            <div className="relative overflow-hidden rounded-[36px] border-2 border-ink bg-purple p-7 text-white shadow-[0_8px_0_0_var(--color-ink)]">
              <span className="eyebrow text-sun">Happy parents</span>
              <h2 id="rev-title" className="display-section mt-3 text-white">Loved by Little Ones &amp; Their Grown-Ups</h2>
              <div className="mt-6 flex items-end gap-3"><span className="font-display text-7xl font-bold leading-none">{avg.toFixed(1)}</span><div className="pb-2"><Stars value={avg} size={20} /><p className="mt-1 text-sm text-white/80">from {reviews.length} verified buyer reviews</p></div></div>
              <p className="mt-5 rounded-2xl bg-white/15 p-3 text-xs font-semibold text-white/90">Every review here comes from a customer who bought and received the toy.</p>
              <Block color="yellow" className="k-float absolute -bottom-6 -right-6 w-32 opacity-90" />
              <Star className="k-twinkle absolute right-6 top-6 w-9" />
            </div>
          </Reveal>

          <ul ref={scroller} className="grid gap-4 pt-2 sm:grid-cols-2">
            {reviews.map((r, i) => {
              return (
                <Reveal as="li" key={`${r.name}-${r.slug}-${i}`} kind="pop" delay={i * 0.07} className={`min-w-0 ${i === 0 ? "sm:col-span-2" : ""}`}>
                  <motion.figure whileHover={{ y: -5, rotate: i % 2 ? 0.8 : -0.8 }} className="relative flex h-full flex-col gap-4 rounded-[28px] border-2 border-ink bg-white p-6 shadow-[0_5px_0_0_var(--color-ink)]">
                    <Quote size={34} className="absolute right-5 top-5" style={{ color: colors[i % 5] }} fill={colors[i % 5]} />
                    <Stars value={r.rating} size={17} />
                    <blockquote className="text-[16.5px] font-semibold leading-relaxed">“{r.text}”</blockquote>
                    <figcaption className="mt-auto flex items-center gap-3">
                      <span className="grid size-11 place-items-center rounded-full border-2 border-ink font-display text-lg font-bold" style={{ background: colors[i % 5] }}>{r.name[0]}</span>
                      <span className="min-w-0 flex-1 text-sm"><b className="block font-extrabold">{r.name}</b><span className="text-ink-soft">Verified buyer · {r.product}</span></span>
                      {r.image && <span className="relative size-12 shrink-0 overflow-hidden rounded-xl border-2 border-ink"><Image src={imgUrl(r.image)} alt={r.product} fill sizes="48px" className="object-cover" /></span>}
                    </figcaption>
                  </motion.figure>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Newsletter() {
  return (
    <section className="relative px-0 pb-4 pt-4" aria-labelledby="club-title">
      <div className="container-k">
        <div className="relative overflow-hidden rounded-[44px] border-2 border-ink bg-tangerine p-7 text-white shadow-[0_10px_0_0_var(--color-ink)] md:p-14">
          <Block color="purple" className="k-float absolute -left-6 bottom-0 hidden w-36 rotate-[-10deg] md:block" />
          <Block color="yellow" letter="K" className="k-float absolute bottom-6 right-4 hidden w-28 rotate-[10deg] md:block" style={{ ["--fdl" as string]: "1.2s" }} />
          <Sparkle className="k-twinkle absolute left-[18%] top-8 w-8" fill="#fff" />
          <Sparkle className="k-twinkle absolute right-[22%] top-10 w-6" fill="#FFD84D" style={{ ["--tdl" as string]: ".5s" }} />
          <StarIcon className="absolute hidden" />
          <div className="relative mx-auto max-w-2xl text-center">
            <Reveal><span className="eyebrow text-ink">The KHELZO Club</span></Reveal>
            <Reveal delay={0.08}><h2 id="club-title" className="display-section mt-3 text-white [text-shadow:0_3px_0_rgba(41,36,59,.3)]">Join the KHELZO Club!</h2></Reveal>
            <Reveal delay={0.16}><p className="mx-auto mt-3 max-w-lg text-lg text-white/95">Be first to hear about new toys, creative play ideas and members-only offers. No spam, only fun.</p></Reveal>
            <Reveal delay={0.24}><div className="mx-auto mt-7 max-w-xl text-left"><NewsletterForm id="nl-home" /></div></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

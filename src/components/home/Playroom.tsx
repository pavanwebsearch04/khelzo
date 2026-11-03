"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { productById } from "@/data/catalog";
import { inr } from "@/lib/format";
import { Reveal } from "@/components/ui/Reveal";
import { Sparkle } from "@/components/art/toys";

const picks = ["p01", "p12", "p03", "p17"].map((id) => productById(id)!);

export function Playroom() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const frameR = useTransform(scrollYProgress, [0, 0.5, 1], [-3, 0, 3]);

  return (
    <section ref={ref} className="relative py-12 md:py-20" aria-labelledby="playroom-title">
      <div className="container-k">
        <div className="relative grid overflow-hidden rounded-[44px] border-2 border-ink bg-ink text-white shadow-[0_10px_0_0_var(--color-purple)] lg:grid-cols-[1.05fr_1fr]">
          <Reveal kind="mask" className="relative min-h-[360px] lg:min-h-[620px]">
            <motion.div className="absolute inset-0 overflow-hidden" style={{ rotate: frameR }}>
              <motion.div className="absolute -inset-[10%]" style={{ y: imgY }}>
                <Image src="/images/banners/playroom.webp" alt="A colourful playroom floor covered in building bricks and toy vehicles" fill sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" />
              </motion.div>
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ink/50" />
            <span className="absolute left-5 top-5 rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-xs font-black uppercase tracking-wider text-ink">The Playroom Edit</span>
          </Reveal>

          <div className="relative flex flex-col justify-center gap-6 p-7 md:p-12">
            <Sparkle className="k-twinkle absolute right-8 top-8 w-9" fill="#FFD84D" />
            <Sparkle className="k-twinkle absolute bottom-10 right-16 w-6" fill="#43D6C0" style={{ ["--tdl" as string]: ".7s" }} />
            <Reveal><span className="eyebrow text-mint">Featured collection</span></Reveal>
            <Reveal delay={0.08}><h2 id="playroom-title" className="display-section text-white">Make Every <span className="text-sun">Playtime</span> Extraordinary</h2></Reveal>
            <Reveal delay={0.16}><p className="max-w-md text-[17px] text-white/80">Blocks to build, trains to chug and bears to hug. Our Playroom Edit brings together the toys families reach for again and again.</p></Reveal>

            <Reveal delay={0.24}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {picks.map((p) => (
                  <li key={p.id}>
                    <Link href={`/shop?q=${encodeURIComponent(p.name)}`} className="group block rounded-2xl border-2 border-white/20 bg-white/5 p-2 transition-all hover:-translate-y-1 hover:border-sun">
                      <div className="relative aspect-square overflow-hidden rounded-xl"><Image src={p.images[0]} alt={p.name} fill sizes="140px" className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                      <div className="mt-2 px-1 text-[12.5px] font-extrabold leading-tight line-clamp-1">{p.name}</div>
                      <div className="px-1 text-sm font-black text-sun">{inr(p.price)}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.32}><Link href="/shop?tag=gift" className="btn btn-orange w-fit !border-white !shadow-[0_5px_0_0_#fff]">Shop the Playroom <ArrowRight size={18} /></Link></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

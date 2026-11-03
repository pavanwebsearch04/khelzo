"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { categories, products, type Category } from "@/data/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead } from "@/components/ui/bits";
import { Star } from "@/components/art/toys";

const spans: Record<string, string> = {
  building: "col-span-2 md:row-span-2", "remote-control": "", vehicles: "", dolls: "",
  "soft-toys": "md:row-span-2", "puzzles-games": "md:col-span-2", stem: "", outdoor: "",
  "arts-crafts": "md:col-span-2", musical: "", "pretend-play": "md:col-span-2", "baby-toddler": "md:col-span-2",
};

function TiltCard({ c, index }: { c: Category; index: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 200, damping: 18 });
  const sy = useSpring(py, { stiffness: 200, damping: 18 });
  const rotY = useTransform(sx, [-0.5, 0.5], [-9, 9]);
  const rotX = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const imgX = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const imgY = useTransform(sy, [-0.5, 0.5], [14, -14]);
  const shapeX = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const count = products.filter((p) => p.category === c.slug).length;
  const big = (spans[c.slug] ?? "").includes("row-span-2") || (spans[c.slug] ?? "").includes("col-span-2");

  return (
    <Reveal kind="pop" delay={(index % 4) * 0.07} className={`${spans[c.slug] ?? ""} [perspective:900px]`}>
      <motion.div className="h-full" style={reduce ? undefined : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}>
        <Link
          ref={ref} href={`/shop?category=${c.slug}`}
          onPointerMove={(e) => {
            if (reduce || e.pointerType === "touch") return;
            const r = e.currentTarget.getBoundingClientRect();
            px.set((e.clientX - r.left) / r.width - 0.5); py.set((e.clientY - r.top) / r.height - 0.5);
          }}
          onPointerLeave={() => { px.set(0); py.set(0); }}
          className="group relative block h-full min-h-[210px] overflow-hidden rounded-[28px] border-2 border-ink shadow-[0_6px_0_0_var(--color-ink)] transition-shadow hover:shadow-[0_12px_0_0_var(--color-ink)] md:min-h-[230px]"
          style={{ background: c.bg, color: c.ink }}
          aria-label={`${c.name}: ${count} toys`}
        >
          <motion.div className="absolute inset-0" style={reduce ? undefined : { x: imgX, y: imgY, scale: 1.12 }}>
            <Image src={c.image} alt="" fill sizes={big ? "(max-width:768px) 100vw, 50vw" : "(max-width:768px) 50vw, 25vw"} className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          </motion.div>
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${c.bg} 0%, ${c.bg}d9 24%, ${c.bg}00 62%)` }} />
          <motion.div className="pointer-events-none absolute -right-3 -top-3" style={reduce ? undefined : { x: shapeX }} aria-hidden="true">
            <Star className="k-float size-14 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-125" fill={c.accent} />
          </motion.div>
          <span className="absolute left-4 top-4 rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-black text-ink">{count} {count === 1 ? "toy" : "toys"}</span>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-5" style={{ transform: "translateZ(40px)" }}>
            <div>
              <h3 className={`font-display font-bold leading-[1.05] ${big ? "text-[24px] md:text-[32px]" : "text-[18px] sm:text-[21px] md:text-[24px]"}`}>{c.short}</h3>
              <p className={`mt-1 text-[13.5px] font-bold opacity-90 line-clamp-2 ${big ? "" : "hidden sm:block"}`}>{c.blurb}</p>
            </div>
            <span className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-white text-ink transition-all md:size-11 duration-300 group-hover:-translate-y-1 group-hover:rotate-12 group-hover:bg-sun"><ArrowUpRight size={20} /></span>
          </div>
        </Link>
      </motion.div>
    </Reveal>
  );
}

export function Categories() {
  return (
    <section id="categories" className="relative py-16 md:py-24" aria-labelledby="cat-title">
      <div className="container-k">
        <Reveal><SectionHead eyebrow="Shop by category" title={<span id="cat-title">Explore the Toy Universe</span>} sub="Twelve colourful worlds of play. Pick a planet and start the adventure." action={{ label: "All toys", href: "/shop" }} /></Reveal>
        <div className="mt-10 grid auto-rows-[210px] grid-cols-2 gap-3 [grid-auto-flow:dense] sm:gap-4 md:auto-rows-[230px] md:grid-cols-4 md:gap-5">
          {categories.map((c, i) => <TiltCard key={c.slug} c={c} index={i} />)}
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Sparkles } from "lucide-react";
import { Balloon, Bear, Block, Car, Cloud, Planet, Rocket, Sparkle, Star } from "@/components/art/toys";
import { Scallop } from "@/components/ui/bits";
import { useIntroDone } from "@/lib/intro";

gsap.registerPlugin(ScrollTrigger);

function Layer({ x, y, depth, className, children, delay = 0 }: { x: MotionValue<number>; y: MotionValue<number>; depth: number; className: string; children: React.ReactNode; delay?: number }) {
  const tx = useTransform(x, (v) => v * depth);
  const ty = useTransform(y, (v) => v * depth);
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ x: tx, y: ty }}
      initial={{ opacity: 0, scale: 0.4, y: 60 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.25 + delay, type: "spring", stiffness: 120, damping: 14 }}
    >
      {children}
    </motion.div>
  );
}

const words1 = ["A", "Little", "World", "of"];

export function Hero() {
  const reduce = useReducedMotion();
  const ready = useIntroDone();
  const root = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });

  useEffect(() => {
    if (reduce || !ready || !root.current) return;
    const ctx = gsap.context(() => {
      // Scroll-out: copy lifts and fades, scene sinks and scales, background clouds drift at their own pace.
      gsap.to(copy.current, { yPercent: -18, opacity: 0.2, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(scene.current, { yPercent: 12, scale: 0.92, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        gsap.to(el, { y: () => -Number(el.dataset.speed) * 120, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, [reduce, ready]);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };

  return (
    <section ref={root} onPointerMove={onMove} className="relative isolate overflow-hidden bg-gradient-to-b from-[#4b2fc4] via-purple to-[#9a85ff] text-white" aria-labelledby="hero-title">
      {/* Backdrop: twinkling stars, drifting clouds */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        {[[8, 14, 22], [22, 8, 14], [38, 22, 18], [58, 10, 12], [74, 18, 20], [90, 8, 14], [14, 52, 12], [46, 60, 14], [86, 46, 16]].map(([l, t, s], i) => (
          <Sparkle key={i} className="k-twinkle absolute" style={{ left: `${l}%`, top: `${t}%`, width: s, ["--td" as string]: `${2 + (i % 4) * 0.7}s`, ["--tdl" as string]: `${i * 0.35}s` }} fill={i % 3 ? "#fff" : "#FFD84D"} />
        ))}
        <div data-speed="0.6" className="absolute inset-x-0 top-[14%]"><Cloud className="k-drift w-40 opacity-50 md:w-60" style={{ ["--dd" as string]: "70s", ["--ddl" as string]: "-18s" }} tone="#fff" /></div>
        <div data-speed="0.3" className="absolute inset-x-0 top-[62%]"><Cloud className="k-drift w-32 opacity-80 md:w-48" style={{ ["--dd" as string]: "95s", ["--ddl" as string]: "-60s" }} tone="#ece7ff" /></div>
        <div className="absolute -left-40 top-20 size-[520px] rounded-full bg-[#8d73ff] opacity-50 blur-3xl" />
      </div>

      {ready && <div className="container-k grid min-h-[calc(100svh-112px)] items-center gap-6 pb-24 pt-10 lg:grid-cols-[1.02fr_1fr] lg:pt-6">
        <div ref={copy} className="relative z-10 max-w-[640px]">
          <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="eyebrow rounded-full border-2 border-white/30 bg-white/10 px-4 py-1.5 text-sun">
            <Sparkles size={15} /> Play Beyond Imagination
          </motion.span>
          <h1 id="hero-title" className="display-hero mt-5 text-white [text-shadow:0_4px_0_rgba(41,36,59,.35)]">
            <span className="sr-only">A Little World of BIG Adventures!</span>
            <span aria-hidden="true" className="block">
              {words1.map((w, i) => (
                <motion.span key={w} className="mr-[0.22em] inline-block" initial={{ y: 70, opacity: 0, rotate: 4 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.15 + i * 0.09, type: "spring", stiffness: 140, damping: 14 }}>{w}</motion.span>
              ))}
            </span>
            <motion.span aria-hidden="true" className="relative mt-1 inline-block" initial={{ y: 80, opacity: 0, scale: 0.7 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.55, type: "spring", stiffness: 170, damping: 11 }}>
              <span className="relative z-10 text-sun">BIG</span>
              <svg viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full" aria-hidden="true"><path d="M4 12c30-10 60 8 96-2s70-4 96-2" stroke="#FF8748" strokeWidth="7" strokeLinecap="round" fill="none" /></svg>
            </motion.span>{" "}
            <motion.span aria-hidden="true" className="inline-block" initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, type: "spring", stiffness: 140, damping: 14 }}>Adventures!</motion.span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.7 }} className="mt-6 max-w-[520px] text-lg text-white/90 md:text-xl">
            Discover exciting toys, creative play, and little moments that make childhood magical.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.7 }} className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/shop" className="btn btn-orange !min-h-14 !px-8 !text-[17px]">Explore Toys <ArrowRight size={20} /></Link>
            <Link href="/#shop-by-age" className="btn btn-white !min-h-14 !px-8 !text-[17px]">Shop by Age</Link>
          </motion.div>
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-white/85">
            <li>✓ Child-safe picks</li><li>✓ Free delivery ₹999+</li><li>✓ 7-day easy returns</li>
          </motion.ul>
        </div>

        {/* Toy universe */}
        <div ref={scene} className="relative mx-auto aspect-[1/1.02] w-full max-w-[600px] lg:max-w-none" aria-hidden="true">
          <Layer x={mx} y={my} depth={-8} delay={0} className="left-[8%] top-[8%] w-[80%]">
            <div className="aspect-square rounded-full bg-gradient-to-br from-sun to-tangerine opacity-95 shadow-[0_0_120px_30px_rgba(255,216,77,.35)]" />
          </Layer>
          <Layer x={mx} y={my} depth={-14} delay={0.1} className="right-[2%] top-[2%] w-[30%]"><Planet className="k-float w-full" style={{ ["--fd" as string]: "9s", ["--r" as string]: "-8deg" }} /></Layer>
          <Layer x={mx} y={my} depth={14} delay={0.2} className="left-[30%] top-[2%] w-[26%]"><div className="k-float" style={{ ["--fd" as string]: "7s", ["--r" as string]: "14deg", ["--fr" as string]: "5deg" }}><Rocket className="w-full drop-shadow-[0_20px_20px_rgba(41,36,59,.3)]" /></div></Layer>
          <Layer x={mx} y={my} depth={-18} delay={0.3} className="left-[2%] top-[34%] w-[16%]"><div className="k-float" style={{ ["--fd" as string]: "8s", ["--fdl" as string]: "1s" }}><Balloon color="#FF5D8F" className="w-full" /></div></Layer>
          <Layer x={mx} y={my} depth={-22} delay={0.35} className="right-[6%] top-[38%] w-[14%]"><div className="k-float" style={{ ["--fd" as string]: "6s", ["--fdl" as string]: ".4s" }}><Balloon color="#43D6C0" className="w-full" /></div></Layer>
          <Layer x={mx} y={my} depth={22} delay={0.4} className="bottom-[26%] left-[5%] w-[30%]">
            <div className="relative">
              <Block color="mint" letter="K" className="relative w-[78%] translate-x-[14%] k-float" style={{ ["--fd" as string]: "5.5s", ["--r" as string]: "-4deg" }} />
              <Block color="pink" className="absolute -top-[52%] left-[0%] w-[70%] k-float" style={{ ["--fd" as string]: "6.5s", ["--r" as string]: "6deg", ["--fdl" as string]: ".6s" }} />
            </div>
          </Layer>
          <Layer x={mx} y={my} depth={30} delay={0.5} className="bottom-[2%] left-[18%] w-[56%]"><Car className="w-full drop-shadow-[0_18px_14px_rgba(41,36,59,.3)]" /></Layer>
          <Layer x={mx} y={my} depth={26} delay={0.55} className="bottom-[18%] right-[0%] w-[30%]"><div className="k-float" style={{ ["--fd" as string]: "7s", ["--fy" as string]: "-8px" }}><Bear className="w-full drop-shadow-[0_16px_14px_rgba(41,36,59,.3)]" /></div></Layer>
          <Layer x={mx} y={my} depth={-6} delay={0.6} className="right-[26%] top-[26%] w-[8%]"><Star className="k-twinkle w-full" /></Layer>
          <Layer x={mx} y={my} depth={-10} delay={0.65} className="left-[22%] top-[44%] w-[6%]"><Star className="k-twinkle w-full" style={{ ["--tdl" as string]: ".8s" }} fill="#fff" /></Layer>
        </div>
      </div>}
      {!ready && <div className="min-h-[calc(100svh-112px)]" aria-hidden="true" />}

      <div className="absolute inset-x-0 bottom-0 text-cream"><Scallop color="#FFF8ED" /></div>
    </section>
  );
}

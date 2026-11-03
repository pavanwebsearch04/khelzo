"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Balloon, Bear, Block, Car, Cloud, GiftBox, Rocket, Sparkle, Star } from "@/components/art/toys";
import { Reveal } from "@/components/ui/Reveal";
import { Scallop } from "@/components/ui/bits";

function Move({ target, from, to, className, children }: { target: React.RefObject<HTMLElement | null>; from: number; to: number; className: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);
  return <motion.div className={`absolute ${className}`} style={reduce ? undefined : { y }}>{children}</motion.div>;
}

type Scene = (t: React.RefObject<HTMLElement | null>) => React.ReactNode;

const chapters: { n: string; title: string; text: string; bg: string; scene: Scene }[] = [
  {
    n: "01", title: "A little box arrives", bg: "#FFD84D",
    text: "It starts with a knock on the door and a box that rattles just enough to be interesting. Every KHELZO toy is wrapped like a tiny promise.",
    scene: (t) => (<>
      <Move target={t} from={40} to={-40} className="left-[6%] top-[8%] w-[22%]"><Cloud className="w-full" /></Move>
      <Move target={t} from={-20} to={50} className="bottom-[10%] left-[24%] w-[52%]"><div className="k-float" style={{ ["--fd" as string]: "4s" }}><GiftBox color="#7657F6" ribbon="#FF8748" className="w-full drop-shadow-[0_18px_0_rgba(41,36,59,.18)]" /></div></Move>
      <Move target={t} from={60} to={-60} className="right-[10%] top-[16%] w-[14%]"><Sparkle className="k-twinkle w-full" fill="#fff" /></Move>
      <Move target={t} from={30} to={-30} className="left-[12%] bottom-[26%] w-[10%]"><Star className="k-twinkle w-full" /></Move>
    </>),
  },
  {
    n: "02", title: "Imagination switches on", bg: "#43D6C0",
    text: "Lid off. Blocks tumble out, a rocket finds its launch pad and suddenly the living-room floor is a whole new planet.",
    scene: (t) => (<>
      <Move target={t} from={70} to={-90} className="left-[38%] top-[0%] w-[24%]"><div className="k-float" style={{ ["--r" as string]: "10deg" }}><Rocket className="w-full drop-shadow-[0_16px_0_rgba(41,36,59,.15)]" /></div></Move>
      <Move target={t} from={20} to={-20} className="bottom-[8%] left-[8%] w-[34%]"><Block color="yellow" className="w-full" /></Move>
      <Move target={t} from={30} to={-40} className="bottom-[10%] right-[8%] w-[30%]"><Block color="pink" letter="Z" className="w-full" /></Move>
      <Move target={t} from={50} to={-50} className="right-[16%] top-[14%] w-[10%]"><Star className="k-twinkle w-full" /></Move>
      <Move target={t} from={40} to={-70} className="left-[12%] top-[16%] w-[12%]"><Sparkle className="k-twinkle w-full" fill="#fff" /></Move>
    </>),
  },
  {
    n: "03", title: "The adventure begins", bg: "#76C9FF",
    text: "Cars race, bears cheer and balloons drift past the window. One toy, a thousand stories, and the best part is that they are never the same twice.",
    scene: (t) => (<>
      <Move target={t} from={30} to={-30} className="left-[4%] top-[10%] w-[26%]"><Cloud className="w-full" /></Move>
      <Move target={t} from={60} to={-60} className="right-[8%] top-[6%] w-[11%]"><div className="k-float"><Balloon color="#FF5D8F" className="w-full" /></div></Move>
      <Move target={t} from={40} to={-40} className="right-[26%] top-[22%] w-[9%]"><div className="k-float" style={{ ["--fdl" as string]: "1s" }}><Balloon color="#FFD84D" className="w-full" /></div></Move>
      <Move target={t} from={10} to={10} className="bottom-[8%] left-[6%] w-[62%]"><Car className="w-full drop-shadow-[0_14px_0_rgba(41,36,59,.15)]" color="#FF5D8F" /></Move>
      <Move target={t} from={-10} to={30} className="bottom-[10%] right-[6%] w-[24%]"><Bear className="w-full" /></Move>
    </>),
  },
];

function Chapter({ c, i }: { c: (typeof chapters)[number]; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const flip = i % 2 === 1;
  return (
    <div ref={ref} className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-16 ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
      <Reveal kind={flip ? "left" : "right"}>
        <div className="relative aspect-[5/4] overflow-hidden rounded-[40px] border-2 border-white/80 shadow-[0_12px_0_0_rgba(255,255,255,.18)]" style={{ background: c.bg }}>
          {c.scene(ref)}
          <span className="absolute left-5 top-5 rounded-full border-2 border-ink bg-white px-3.5 py-1 font-display text-lg font-bold text-ink">Chapter {c.n}</span>
        </div>
      </Reveal>
      <div>
        <Reveal><span className="font-display text-[88px] font-bold leading-none text-white/15 md:text-[120px]">{c.n}</span></Reveal>
        <Reveal delay={0.08}><h3 className="-mt-6 font-display text-[34px] font-bold leading-tight text-white md:-mt-10 md:text-5xl">{c.title}</h3></Reveal>
        <Reveal delay={0.16}><p className="mt-4 max-w-md text-lg text-white/80">{c.text}</p></Reveal>
      </div>
    </div>
  );
}

export function Story() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 40%"] });
  return (
    <section ref={ref} id="story" className="relative overflow-hidden bg-[#2b1f63] pb-28 pt-6 text-white" aria-labelledby="story-title">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]"><Scallop color="#2b1f63" /></div>
      {[[6, 8], [18, 30], [34, 12], [52, 6], [68, 24], [82, 10], [92, 36], [10, 60], [28, 78], [60, 70], [88, 82], [74, 52]].map(([l, t], i) => (
        <Sparkle key={i} className="k-twinkle pointer-events-none absolute w-3 md:w-4" style={{ left: `${l}%`, top: `${t}%`, ["--tdl" as string]: `${i * 0.4}s` }} fill={i % 2 ? "#fff" : "#FFD84D"} />
      ))}
      <svg className="pointer-events-none absolute left-1/2 top-[18%] hidden h-[74%] w-24 -translate-x-1/2 lg:block" viewBox="0 0 100 800" preserveAspectRatio="none" aria-hidden="true">
        <path d="M50 0C10 120 90 220 50 330S10 540 50 650s0 100 0 150" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" />
        <motion.path d="M50 0C10 120 90 220 50 330S10 540 50 650s0 100 0 150" fill="none" stroke="#FFD84D" strokeWidth="4" strokeDasharray="2 14" strokeLinecap="round" style={{ pathLength: scrollYProgress }} />
      </svg>
      <div className="container-k relative">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal><span className="eyebrow text-sun">The KHELZO story</span></Reveal>
          <Reveal delay={0.08}><h2 id="story-title" className="display-section mt-3 text-white">Every Toy Begins a <span className="text-sun">New Adventure.</span></h2></Reveal>
          <Reveal delay={0.16}><p className="mt-4 text-lg text-white/75">Scroll through a tiny storybook of what happens when a toy meets a child.</p></Reveal>
        </div>
        <div className="mt-16 space-y-20 md:space-y-28">
          {chapters.map((c, i) => <Chapter key={c.n} c={c} i={i} />)}
        </div>
        <Reveal className="mt-16 text-center"><Link href="/shop" className="btn btn-sun !min-h-14 !px-9 !text-[17px]">Start your own adventure <ArrowRight size={20} /></Link></Reveal>
      </div>
      <div className="absolute inset-x-0 bottom-0"><Scallop color="#FFF8ED" /></div>
    </section>
  );
}

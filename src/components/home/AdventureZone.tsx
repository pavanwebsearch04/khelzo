"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Balloon, Bear, Block, Car, Cloud, Rocket, Slide, Sparkle, Star } from "@/components/art/toys";

/** Each stop on the road is a real shopping destination. `at` is the position in the ground layer (% of its width). */
const stops = [
  { at: 15, label: "Block Tower", sub: "Building toys", href: "/shop?category=building", color: "#7657F6" },
  { at: 32, label: "Teddy Hill", sub: "Soft toys", href: "/shop?category=soft-toys", color: "#FF8748" },
  { at: 49, label: "Rocket Pad", sub: "STEM & pretend play", href: "/shop?category=stem", color: "#43D6C0" },
  { at: 66, label: "Slide Park", sub: "Outdoor toys", href: "/shop?category=outdoor", color: "#FF5D8F" },
  { at: 83, label: "Toy Garage", sub: "Cars & vehicles", href: "/shop?category=vehicles", color: "#FFD84D" },
];

const GROUND_W = 340; // % of the viewport
const CAR_SCREEN_X = 24; // % of viewport

function Layer({ p, w, className = "", children }: { p: MotionValue<number>; w: number; className?: string; children: React.ReactNode }) {
  const x = useTransform(p, [0, 1], ["0%", `${-((w - 100) / w) * 100}%`]);
  return (
    <motion.div className={`absolute inset-y-0 left-0 ${className}`} style={{ width: `${w}%`, x }} aria-hidden="true">
      {children}
    </motion.div>
  );
}

function Mountains() {
  const cones = [
    [60, "#9b83ff", 330], [260, "#43D6C0", 250], [430, "#FF8748", 360], [650, "#76C9FF", 280], [820, "#FF5D8F", 340], [1020, "#FFD84D", 260], [1180, "#7657F6", 350],
  ] as const;
  return (
    <svg viewBox="0 0 1400 420" preserveAspectRatio="none" className="absolute bottom-[26%] h-[48%] w-full">
      {cones.map(([x, c, h], i) => (
        <g key={i}>
          <path d={`M${x} 420 Q${x + 20} ${420 - h} ${x + 110} ${420 - h} Q${x + 200} ${420 - h} ${x + 220} 420z`} fill={c} stroke="#29243B" strokeWidth="4" />
          <path d={`M${x + 70} ${420 - h + 40} Q${x + 60} ${420 - h / 2} ${x + 50} 400`} stroke="#fff" strokeOpacity=".35" strokeWidth="9" strokeLinecap="round" fill="none" />
          <circle cx={x + 110} cy={420 - h + 4} r="12" fill="#fff" stroke="#29243B" strokeWidth="3" />
        </g>
      ))}
    </svg>
  );
}

function Hills() {
  return (
    <>
      <svg viewBox="0 0 1600 300" preserveAspectRatio="none" className="absolute bottom-[14%] h-[44%] w-full" aria-hidden="true">
        <path d="M0 300V150C120 60 240 60 360 130S600 210 760 120 1040 40 1200 120s240 70 400 -10V300z" fill="#7be3d2" stroke="#29243B" strokeWidth="4" />
        <path d="M0 300V210C140 150 280 160 420 210s300 40 460 -20 360 -40 720 30V300z" fill="#43D6C0" stroke="#29243B" strokeWidth="4" />
        {[120, 380, 640, 900, 1180, 1440].map((x, i) => <circle key={i} cx={x} cy={230 + (i % 2) * 20} r="9" fill="#fff" opacity=".6" />)}
      </svg>
    </>
  );
}

function Prop({ s, active, children }: { s: (typeof stops)[number]; active: boolean; children: React.ReactNode }) {
  return (
    <div className="absolute bottom-[19%]" style={{ left: `${(s.at / 100) * 100}%` }}>
      <Link
        href={s.href}
        className="group relative block -translate-x-1/2 outline-none"
        aria-label={`${s.label}: ${s.sub}`}
        tabIndex={0}
      >
        <div className="transition-transform duration-300 group-hover:-translate-y-2 group-focus-visible:-translate-y-2" style={{ transform: active ? "translateY(-10px) scale(1.06)" : undefined }}>{children}</div>
        <span
          className={`absolute -top-14 left-1/2 w-max -translate-x-1/2 rounded-2xl border-2 border-ink bg-white px-4 py-2 text-center shadow-[0_4px_0_0_var(--color-ink)] transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 ${active ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
        >
          <b className="block font-display text-lg leading-none text-ink">{s.label}</b>
          <span className="text-xs font-extrabold" style={{ color: s.color === "#FFD84D" ? "#b88a00" : s.color }}>{s.sub} →</span>
        </span>
      </Link>
    </div>
  );
}

export function AdventureZone() {
  const reduce = useReducedMotion();
  const outer = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const manual = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: outer, offset: ["start start", "end end"] });
  const raw = useTransform([scrollYProgress, manual], ([s, m]: number[]) => Math.min(1, Math.max(0, (reduce ? 0 : s) + m)));
  const p = useSpring(raw, { stiffness: 90, damping: 24, mass: 0.6 });
  const vel = useVelocity(p);
  const tilt = useTransform(vel, [-1.2, 0, 1.2], [-5, 0, 5]);
  const skyShift = useTransform(p, [0, 1], ["0%", "-20%"]);
  const [active, setActive] = useState(-1);

  useMotionValueEvent(p, "change", (v) => {
    const carWorld = v * (GROUND_W - 100) + CAR_SCREEN_X; // in vw% of ground layer coordinates
    let idx = -1;
    stops.forEach((s, i) => { if (Math.abs((s.at / 100) * GROUND_W - carWorld) < 9) idx = i; });
    setActive((a) => (a === idx ? a : idx));
  });

  const nudge = (d: number) => {
    const t = Math.min(0.5, Math.max(-0.5, manual.get() + d));
    animate(manual, t, { duration: 0.45, ease: "easeOut" });
  };

  const drag = useRef<{ x: number; m: number } | null>(null);

  return (
    <section id="adventure" aria-labelledby="adv-title" className="relative">
      <div ref={outer} className={reduce ? "" : "h-[230vh] md:h-[260vh]"}>
        <div className={reduce ? "py-16" : "sticky top-[96px] flex h-[calc(100svh-104px)] min-h-[560px] items-center py-3 md:top-[112px] md:h-[calc(100svh-120px)]"}>
          <div className="container-k w-full">
            <div
              ref={world}
              tabIndex={0}
              role="group"
              aria-label="Interactive KHELZO Adventure Zone. Use the arrow keys, the arrow buttons or scroll to drive the car along the road."
              onKeyDown={(e) => { if (e.key === "ArrowRight") { e.preventDefault(); nudge(0.06); } if (e.key === "ArrowLeft") { e.preventDefault(); nudge(-0.06); } }}
              onPointerDown={(e) => { drag.current = { x: e.clientX, m: manual.get() }; }}
              onPointerMove={(e) => {
                if (!drag.current || !world.current) return;
                const dx = e.clientX - drag.current.x;
                manual.set(Math.min(0.5, Math.max(-0.5, drag.current.m - (dx / world.current.clientWidth) * 0.6)));
              }}
              onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}
              className="relative h-full min-h-[540px] touch-pan-y select-none overflow-hidden rounded-[40px] border-2 border-ink bg-gradient-to-b from-[#59b9ff] via-[#9ad8ff] to-[#d9f1ff] shadow-[0_10px_0_0_var(--color-ink)] md:h-[min(640px,calc(100svh-150px))]"
            >
              {/* sky */}
              <motion.div className="absolute inset-0" style={{ x: skyShift }} aria-hidden="true">
                <div className="absolute right-[10%] top-[8%] size-24 rounded-full bg-sun shadow-[0_0_90px_30px_rgba(255,216,77,.6)] md:size-32" />
                <Cloud className="k-float absolute left-[8%] top-[16%] w-28 md:w-44" style={{ ["--fd" as string]: "10s" }} />
                <Cloud className="k-float absolute left-[46%] top-[8%] w-24 md:w-36" style={{ ["--fd" as string]: "12s", ["--fdl" as string]: "2s" }} />
                <Cloud className="k-float absolute left-[78%] top-[20%] w-28 md:w-40" style={{ ["--fd" as string]: "9s", ["--fdl" as string]: "1s" }} />
                <div className="k-float absolute left-[30%] top-[22%] w-12 md:w-16" style={{ ["--fd" as string]: "7s" }}><Balloon color="#FF5D8F" className="w-full" /></div>
                <div className="k-float absolute left-[64%] top-[30%] w-10 md:w-14" style={{ ["--fd" as string]: "8s", ["--fdl" as string]: "1s" }}><Balloon color="#7657F6" className="w-full" /></div>
                {[12, 24, 40, 58, 72, 88].map((l, i) => <Sparkle key={i} className="k-twinkle absolute w-4" style={{ left: `${l}%`, top: `${6 + (i % 3) * 10}%`, ["--tdl" as string]: `${i * 0.3}s` }} fill="#fff" />)}
              </motion.div>

              <Layer p={p} w={140}><Mountains /></Layer>
              <Layer p={p} w={210}><Hills /></Layer>

              {/* ground, road and stops */}
              <Layer p={p} w={GROUND_W}>
                <div className="absolute inset-x-0 bottom-0 h-[24%] border-t-[3px] border-ink bg-[#37d08a]" />
                <div className="absolute inset-x-0 bottom-[3%] h-[13%] border-y-[3px] border-ink bg-ink">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#FFD84D_0_36px,transparent_36px_72px)]" />
                </div>
                <Prop s={stops[0]} active={active === 0}>
                  <div className="relative h-[170px] w-[130px] md:h-[250px] md:w-[190px]">
                    <Block color="mint" className="absolute bottom-0 left-0 w-[70%]" />
                    <Block color="pink" letter="K" className="absolute bottom-[26%] left-[18%] w-[66%]" />
                    <Block color="yellow" className="absolute bottom-[52%] left-[6%] w-[62%] rotate-6" />
                    <Block color="purple" className="absolute bottom-0 right-0 w-[50%]" />
                  </div>
                </Prop>
                <Prop s={stops[1]} active={active === 1}>
                  <div className="relative h-[170px] w-[150px] md:h-[240px] md:w-[210px]">
                    <div className="absolute inset-x-0 bottom-[-10%] h-[40%] rounded-[50%] border-[3px] border-ink bg-[#7be3d2]" />
                    <Bear className="absolute bottom-[6%] left-[14%] w-[68%]" />
                  </div>
                </Prop>
                <Prop s={stops[2]} active={active === 2}>
                  <div className="relative h-[220px] w-[110px] md:h-[300px] md:w-[150px]">
                    <Rocket className="absolute bottom-[8%] left-[10%] w-[80%]" />
                    <div className="absolute inset-x-0 bottom-0 h-[10%] rounded-xl border-[3px] border-ink bg-sun" />
                  </div>
                </Prop>
                <Prop s={stops[3]} active={active === 3}>
                  <div className="h-[170px] w-[170px] md:h-[250px] md:w-[250px]"><Slide className="h-full w-full" /></div>
                </Prop>
                <Prop s={stops[4]} active={active === 4}>
                  <div className="relative h-[130px] w-[220px] md:h-[190px] md:w-[300px]">
                    <div className="absolute inset-x-0 bottom-0 h-[84%] rounded-t-[26px] border-[3px] border-ink bg-purple" />
                    <div className="absolute inset-x-[10%] bottom-0 h-[60%] rounded-t-2xl border-[3px] border-b-0 border-ink bg-ink/80" />
                    <div className="absolute inset-x-0 -top-0 h-[22%] rounded-t-[26px] border-[3px] border-ink bg-sun" />
                    <Car className="absolute bottom-[2%] left-[16%] w-[66%]" color="#43D6C0" />
                  </div>
                </Prop>
                <div className="absolute bottom-[19%] right-[2.5%] w-[10%] md:w-[7%]" aria-hidden="true">
                  <div className="absolute bottom-0 left-1/2 h-[190px] w-1.5 -translate-x-1/2 bg-ink" />
                  <Star className="k-float absolute bottom-[150px] left-1/2 w-20 -translate-x-1/2" />
                </div>
              </Layer>

              {/* the car (fixed on screen, camera moves around it) */}
              <motion.div className="absolute bottom-[6.5%] z-10 w-[26%] min-w-[120px] max-w-[250px]" style={{ left: `${CAR_SCREEN_X - 8}%`, rotate: reduce ? 0 : tilt, transformOrigin: "50% 100%" }} aria-hidden="true">
                <div className="relative" style={{ animation: reduce ? undefined : "k-float 0.9s ease-in-out infinite", ["--fy" as string]: "-3px" }}>
                  <Car className="w-full drop-shadow-[0_10px_0_rgba(41,36,59,.25)]" color="#FF8748" />
                </div>
              </motion.div>

              {/* UI overlay */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 p-5 md:p-8">
                <span className="eyebrow w-fit rounded-full border-2 border-ink bg-white px-4 py-1.5 text-purple shadow-[0_3px_0_0_var(--color-ink)]">The KHELZO Adventure Zone</span>
                <h2 id="adv-title" className="display-section max-w-[17ch] text-ink [text-shadow:0_3px_0_#fff]">Ready for Your Next <span className="text-tangerine-deep">Big Adventure?</span></h2>
                <Link href="/shop" className="btn btn-purple pointer-events-auto mt-1 w-fit !min-h-12">Explore the Adventure <ArrowRight size={18} /></Link>
              </div>

              <div className="pointer-events-auto absolute inset-x-0 bottom-3 z-20 flex items-center justify-center gap-3 px-4">
                <button onClick={() => nudge(-0.07)} aria-label="Drive left" className="grid size-11 place-items-center rounded-full border-2 border-ink bg-white shadow-[0_4px_0_0_var(--color-ink)] active:translate-y-1 active:shadow-none"><ChevronLeft size={22} /></button>
                <div className="hidden min-w-[220px] items-center gap-2 rounded-full border-2 border-ink bg-white/95 px-4 py-2.5 text-xs font-extrabold sm:flex">
                  <span className="whitespace-nowrap">Scroll, drag or tap arrows</span>
                  <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-cream-deep"><motion.span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-tangerine" style={{ scaleX: p }} /></span>
                </div>
                <button onClick={() => nudge(0.07)} aria-label="Drive right" className="grid size-11 place-items-center rounded-full border-2 border-ink bg-white shadow-[0_4px_0_0_var(--color-ink)] active:translate-y-1 active:shadow-none"><ChevronRight size={22} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

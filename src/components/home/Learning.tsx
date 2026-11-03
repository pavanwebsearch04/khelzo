"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Brain, Hand, Lightbulb } from "lucide-react";
import { learning } from "@/data/catalog";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHead, Scallop } from "@/components/ui/bits";
import { Sparkle } from "@/components/art/toys";

const perks = [
  { icon: Brain, t: "Builds focus", d: "Puzzles and kits stretch attention spans." },
  { icon: Hand, t: "Hands-on skills", d: "Fine motor control through making." },
  { icon: Lightbulb, t: "Sparks curiosity", d: "Open-ended play beats screens." },
];

export function Learning() {
  return (
    <section id="learning" className="relative overflow-x-clip bg-[#FFF0C2] pb-24 pt-6" aria-labelledby="learn-title">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)]"><Scallop color="#FFF0C2" /></div>
      <Sparkle className="k-twinkle absolute right-[8%] top-12 hidden w-10 md:block" fill="#FF8748" />
      <div className="container-k relative">
        <Reveal><SectionHead eyebrow="Learning through play" title={<span id="learn-title">Little Learners, Big Skills</span>} sub="Every learning toy is picked for how it helps children grow: curiosity, patience, logic and creativity." action={{ label: "All learning toys", href: "/shop?tag=learning" }} /></Reveal>

        <div className="mt-6 flex flex-wrap gap-3">
          {perks.map((p) => (
            <Reveal key={p.t}><div className="flex items-center gap-3 rounded-full border-2 border-ink bg-white py-2 pl-2 pr-5">
              <span className="grid size-10 place-items-center rounded-full bg-purple text-white"><p.icon size={20} /></span>
              <span className="text-sm leading-tight"><b className="block font-extrabold">{p.t}</b><span className="text-ink-soft">{p.d}</span></span>
            </div></Reveal>
          ))}
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
          {learning.map((l, i) => (
            <Reveal as="li" key={l.title} kind={i % 2 ? "right" : "left"} delay={0.05 * i} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
              <Link href={l.href} className="group relative flex h-full min-h-[300px] flex-col justify-end overflow-hidden rounded-[30px] border-2 border-ink p-5 text-ink shadow-[0_6px_0_0_var(--color-ink)] transition-all hover:-translate-y-1.5 hover:shadow-[0_12px_0_0_var(--color-ink)]" style={{ background: l.bg }}>
                <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[22px] border-2 border-ink md:absolute md:inset-3 md:bottom-[42%] md:mb-0 md:aspect-auto md:w-auto">
                  <Image src={l.image} alt="" fill sizes="(max-width:768px) 100vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                </div>
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-[26px] font-bold leading-[1.05]">{l.title}</h3>
                    <span className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-white transition-transform group-hover:rotate-45"><ArrowUpRight size={18} /></span>
                  </div>
                  <p className="mt-1 text-[14.5px] font-semibold">{l.blurb}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {l.skills.map((s) => <span key={s} className="rounded-full border-2 border-ink bg-white/80 px-2.5 py-0.5 text-xs font-black">{s}</span>)}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
      <div className="absolute inset-x-0 bottom-0"><Scallop color="#FFF8ED" /></div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ages, categories, gifts, learning } from "@/data/catalog";

function Promo({ title, sub, href, image, bg }: { title: string; sub: string; href: string; image: string; bg: string }) {
  return (
    <Link href={href} className="group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-[24px] border-2 border-ink p-5 text-white" style={{ background: bg }}>
      <Image src={image} alt="" fill sizes="320px" className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      <div className="relative">
        <div className="font-display text-2xl font-bold leading-tight">{title}</div>
        <p className="mt-1 text-sm text-white/85">{sub}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-extrabold">Shop now <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></span>
      </div>
    </Link>
  );
}

function CatTile({ href, label, image, bg, onClick }: { href: string; label: string; image: string; bg: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="group flex items-center gap-3 rounded-2xl p-2 pr-3 transition-colors hover:bg-cream">
      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl border-2 border-ink" style={{ background: bg }}>
        <Image src={image} alt="" fill sizes="56px" className="object-cover transition-transform duration-500 group-hover:scale-125" />
      </span>
      <span className="text-[14.5px] font-extrabold leading-tight">{label}</span>
    </Link>
  );
}

export function MegaMenu({ kind, onNavigate }: { kind: string; onNavigate: () => void }) {
  if (kind === "Shop All Toys" || kind === "Categories") {
    const list = kind === "Categories" ? categories : categories.slice(0, 8);
    return (
      <div className="grid grid-cols-[1fr_300px] gap-8 p-8">
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="eyebrow text-purple">{kind === "Categories" ? "All 12 toy worlds" : "Popular worlds"}</span>
            <Link href="/shop" onClick={onNavigate} className="text-sm font-extrabold text-purple hover:underline">View every toy →</Link>
          </div>
          <div className="grid grid-cols-3 gap-x-4 gap-y-1">
            {list.map((c) => <CatTile key={c.slug} href={`/shop?category=${c.slug}`} label={c.short} image={c.image} bg={c.bg} onClick={onNavigate} />)}
          </div>
        </div>
        <Promo title="Big adventures start here" sub="Fresh toys landing every week." href="/shop?tag=new" image="/images/banners/playroom.webp" bg="#7657F6" />
      </div>
    );
  }
  if (kind === "Shop by Age") {
    return (
      <div className="grid grid-cols-[1fr_300px] gap-8 p-8">
        <div>
          <span className="eyebrow text-purple">Find the perfect fit</span>
          <div className="mt-3 grid grid-cols-5 gap-3">
            {ages.map((a) => (
              <Link key={a.slug} href={`/shop?age=${a.slug}`} onClick={onNavigate} className="group overflow-hidden rounded-2xl border-2 border-ink transition-transform hover:-translate-y-1" style={{ background: a.bg, color: a.ink }}>
                <div className="relative aspect-[4/3]"><Image src={a.image} alt="" fill sizes="160px" className="object-cover transition-transform duration-500 group-hover:scale-110" /></div>
                <div className="p-3">
                  <div className="font-display text-2xl font-bold leading-none">{a.range}</div>
                  <div className="mt-1 text-[13px] font-extrabold opacity-90">{a.title}</div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">Every KHELZO toy is labelled with a recommended age so you can shop with confidence.</p>
        </div>
        <Promo title="Toys that grow with them" sub="Smart picks by age and stage." href="/shop?tag=learning" image="/images/banners/learn-stem.webp" bg="#43D6C0" />
      </div>
    );
  }
  if (kind === "Learning & Educational") {
    return (
      <div className="grid grid-cols-[1fr_300px] gap-8 p-8">
        <div>
          <span className="eyebrow text-purple">Learning through play</span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {learning.map((l) => (
              <CatTile key={l.title} href={l.href} label={l.title} image={l.image} bg={l.bg} onClick={onNavigate} />
            ))}
          </div>
        </div>
        <Promo title="STEM kits that wow" sub="Build a robotic arm with water power." href="/shop?category=stem" image="/images/banners/learn-stem.webp" bg="#29243B" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[1fr_300px] gap-8 p-8">
      <div>
        <span className="eyebrow text-purple">Gifts & offers</span>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {gifts.map((g) => (
            <Link key={g.slug} href={g.href} onClick={onNavigate} className="group rounded-2xl border-2 border-ink p-4 transition-transform hover:-translate-y-1" style={{ background: g.color }}>
              <div className="font-display text-xl font-bold leading-tight text-white drop-shadow-[0_2px_0_rgba(41,36,59,.4)]">{g.title}</div>
              <div className="mt-1 text-[13px] font-bold text-white/90">{g.sub}</div>
            </Link>
          ))}
        </div>
        <Link href="/shop?sort=discount" onClick={onNavigate} className="mt-4 inline-flex text-sm font-extrabold text-purple hover:underline">See today&apos;s biggest discounts →</Link>
      </div>
      <Promo title="Make their day magical" sub="Gift-wrap any toy for ₹49." href="/shop?tag=gift" image="/images/banners/wooden-tracks.webp" bg="#FF8748" />
    </div>
  );
}

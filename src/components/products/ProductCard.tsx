"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Eye, GitCompareArrows, Heart, ShoppingBag } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { inr } from "@/lib/format";
import { imgUrl } from "@/lib/api";
import { toId, useStore, type Pid } from "@/components/providers/StoreProvider";
import { Stars } from "@/components/ui/bits";

/** Minimal shape shared by the static homepage data and API products. */
export interface CardProduct {
  id: Pid; name: string; price: number; mrp: number; rating: number; reviews: number; images: string[];
  badge?: string | null; slug?: string; stock?: number; availability?: "in_stock" | "low_stock" | "out_of_stock"; tags?: string[];
}

const off = (p: { price: number; mrp: number }) => (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
export const productHref = (p: CardProduct) => `/product/${p.slug ?? toId(p.id)}`;

export function WishButton({ id, className = "" }: { id: Pid; className?: string }) {
  const { isWished, toggleWish } = useStore();
  const on = isWished(id);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); toggleWish(id); }}
      aria-pressed={on}
      aria-label={on ? "Remove from wishlist" : "Add to wishlist"}
      className={`grid size-8 place-items-center rounded-full border-2 border-ink sm:size-10 bg-white transition-colors hover:bg-[#ffe3ec] ${className}`}
    >
      <Heart key={String(on)} size={18} className={`${on ? "k-pop fill-berry text-berry" : "text-ink"}`} />
    </button>
  );
}

export function CompareButton({ id, className = "" }: { id: Pid; className?: string }) {
  const { compare, toggleCompare } = useStore();
  const on = compare.includes(toId(id));
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); toggleCompare(id); }} aria-pressed={on} aria-label={on ? "Remove from comparison" : "Add to comparison"}
      className={`grid size-8 place-items-center rounded-full border-2 border-ink sm:size-10 transition-colors ${on ? "bg-mint" : "bg-white hover:bg-mint/40"} ${className}`}>
      <GitCompareArrows size={17} />
    </button>
  );
}

export function AddButton({ id, name, compact = false, tone = "orange", disabled = false, qty = 1 }: { id: Pid; name?: string; compact?: boolean; tone?: "orange" | "purple" | "sun"; disabled?: boolean; qty?: number }) {
  const { addToCart } = useStore();
  const [done, setDone] = useState(false);
  const bg = tone === "orange" ? "btn-orange" : tone === "purple" ? "btn-purple" : "btn-sun";
  return (
    <button
      type="button"
      disabled={disabled}
      className={`btn btn-sm ${bg} ${compact ? "!px-3" : "min-w-0 flex-1 max-[360px]:!gap-1 max-[360px]:!px-2"} disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={() => { addToCart(id, qty, name); setDone(true); setTimeout(() => setDone(false), 1400); }}
      aria-label={compact ? "Add to cart" : undefined}
    >
      {done ? <Check size={17} strokeWidth={3} /> : <ShoppingBag size={17} />}
      {!compact && (disabled ? "Out of stock" : done ? "Added!" : <><span className="max-[360px]:hidden">Add to Cart</span><span className="hidden max-[360px]:inline">Add</span></>)}
    </button>
  );
}

const badgeColor: Record<string, string> = { New: "bg-mint text-ink", Bestseller: "bg-sun text-ink", Hot: "bg-berry text-white" };

export function ProductCard({
  product, variant = "standard", priority = false, sizes = "(max-width:640px) 70vw, (max-width:1024px) 33vw, 22vw", showCompare = false,
}: {
  product: CardProduct; variant?: "standard" | "tall"; priority?: boolean; sizes?: string; showCompare?: boolean;
}) {
  const { openQuickView } = useStore();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);
  const d = off(product);
  const second = product.images[1];
  const out = product.availability === "out_of_stock" || product.stock === 0;
  const low = product.availability === "low_stock";
  const sale = d >= 20;
  return (
    <motion.article
      whileHover={reduce ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative flex h-full flex-col overflow-hidden rounded-[26px] border-2 border-ink bg-white shadow-[0_6px_0_0_var(--color-ink)] transition-shadow hover:shadow-[0_14px_0_0_var(--color-ink)]"
    >
      <div className={`relative overflow-hidden bg-cream-deep ${variant === "tall" ? "aspect-[4/5]" : "aspect-square"}`}>
        <Link href={productHref(product)} className="absolute inset-0 z-[1]" aria-label={`View ${product.name}`} />
        <Image
          src={imgUrl(product.images[0])} alt={product.name} fill sizes={sizes} priority={priority}
          className={`object-cover transition-all duration-700 ease-out group-hover:scale-110 ${second && hover ? "opacity-0" : "opacity-100"} ${out ? "grayscale-[.6]" : ""}`}
        />
        {second && <Image src={imgUrl(second)} alt="" fill sizes={sizes} className={`object-cover transition-all duration-700 ease-out ${hover ? "scale-105 opacity-100" : "scale-100 opacity-0"}`} />}
        <div className="pointer-events-none absolute left-2 top-2 z-[2] flex max-w-[calc(100%-3.25rem)] flex-col items-start gap-1 sm:left-3 sm:top-3 sm:max-w-none sm:gap-1.5">
          {product.badge && <span className={`rounded-full border-2 border-ink px-2 py-0.5 text-[10px] font-black sm:px-2.5 sm:text-[11px] uppercase tracking-wider ${badgeColor[product.badge] ?? "bg-white"}`}>{product.badge}</span>}
          {product.tags?.includes("trending") && !product.badge && <span className="rounded-full border-2 border-ink bg-purple px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-white">Trending</span>}
          {d > 0 && <span className="rounded-full border-2 border-ink bg-white px-2.5 py-0.5 text-[11px] font-black text-tangerine-deep">{sale && <span className="max-[360px]:hidden">SALE </span>}{d}% OFF</span>}
        </div>
        <div className="absolute right-2 top-2 z-[2] flex flex-col gap-2 sm:right-3 sm:top-3">
          <WishButton id={product.id} />
          {showCompare && <CompareButton id={product.id} />}
        </div>
        {out && <span className="absolute inset-x-3 bottom-3 z-[2] rounded-full border-2 border-ink bg-white py-1.5 text-center text-sm font-black">Out of stock</span>}
        {!out && (
          <button type="button" onClick={() => openQuickView(product.id)} className="absolute inset-x-3 bottom-3 z-[2] hidden translate-y-4 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white/95 py-2 text-sm font-extrabold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:flex">
            <Eye size={16} /> Quick View
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        <h3 className="font-sans font-extrabold leading-snug tracking-normal text-ink line-clamp-2 min-h-[2.6em] text-[15px] sm:text-[17px]"><Link href={productHref(product)} className="hover:text-purple">{product.name}</Link></h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-soft sm:text-[13px]">
          <Stars value={product.rating} />
          <span className="font-bold">{product.rating.toFixed(1)}</span>
          <span>({product.reviews.toLocaleString("en-IN")})</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="leading-none">
            <div className="text-[19px] font-black text-ink sm:text-[22px]">{inr(product.price)}</div>
            {d > 0 && <div className="mt-1 text-[13px] text-ink-soft line-through">{inr(product.mrp)}</div>}
          </div>
          {low && <span className="rounded-full bg-berry/15 px-2 py-0.5 text-[11px] font-black text-berry">Only {product.stock} left</span>}
        </div>
        <div className="mt-1 flex gap-2"><AddButton id={product.id} name={product.name} disabled={out} /></div>
      </div>
    </motion.article>
  );
}

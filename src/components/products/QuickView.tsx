"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { imgUrl, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";
import { Stars } from "@/components/ui/bits";
import { AddButton, WishButton } from "./ProductCard";

export function QuickView() {
  const { quickView, closeQuickView } = useStore();
  return (
    <AnimatePresence>
      {quickView && <Panel key={quickView.id} product={quickView} onClose={closeQuickView} />}
    </AnimatePresence>
  );
}

function Panel({ product, onClose }: { product: ApiProduct; onClose: () => void }) {
  const [active, setActive] = useState(0);
  const out = product.availability === "out_of_stock";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-ink/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog" aria-modal="true" aria-label={product.name} onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, scale: 0.92, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative grid w-full max-w-4xl overflow-hidden rounded-[32px] border-2 border-ink bg-cream shadow-[0_10px_0_0_var(--color-ink)] md:grid-cols-2"
      >
        <button onClick={onClose} aria-label="Close quick view" autoFocus className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full border-2 border-ink bg-white transition-transform hover:rotate-90"><X size={20} /></button>
        <div className="bg-cream-deep p-4 md:p-6">
          <div className="relative aspect-square overflow-hidden rounded-[22px] border-2 border-ink bg-white">
            <AnimatePresence mode="wait">
              <motion.div key={active} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                <Image src={imgUrl(product.images[active])} alt={product.name} fill sizes="(max-width:768px) 90vw, 440px" className="object-cover" />
              </motion.div>
            </AnimatePresence>
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button key={src} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active} className={`relative size-16 overflow-hidden rounded-xl border-2 ${i === active ? "border-purple" : "border-ink/20"}`}>
                  <Image src={imgUrl(src)} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <div className="flex flex-wrap gap-2 text-xs font-black uppercase tracking-wider">
            <span className="rounded-full bg-purple-soft px-3 py-1 text-purple">{product.category_name}</span>
            <span className="rounded-full bg-sun/60 px-3 py-1">Ages {product.age.replace("-plus", "+")}</span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-tight">{product.name}</h2>
          <div className="flex items-center gap-2 text-sm text-ink-soft"><Stars value={product.rating} size={16} /> <b className="text-ink">{product.rating.toFixed(1)}</b> ({product.reviews.toLocaleString("en-IN")} reviews)</div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black">{inr(product.price)}</span>
            {product.discount > 0 && (<><span className="text-ink-soft line-through">{inr(product.mrp)}</span><span className="rounded-full bg-tangerine px-2.5 py-0.5 text-xs font-black text-white">{product.discount}% OFF</span></>)}
          </div>
          <p className={`text-sm font-extrabold ${out ? "text-berry" : product.availability === "low_stock" ? "text-tangerine-deep" : "text-mint-deep"}`}>
            {out ? "Out of stock" : product.availability === "low_stock" ? `Only ${product.stock} left` : "In stock"}
          </p>
          <p className="text-ink-soft">{product.desc}</p>
          <div className="flex gap-2"><AddButton id={product.id} name={product.name} disabled={out} slug={product.slug} hasVariants={!!product.has_variants} /><WishButton id={product.id} className="!size-12" /></div>
          <ul className="grid gap-2 text-sm font-semibold text-ink-soft">
            <li className="flex items-center gap-2"><Truck size={18} className="text-mint-deep" /> Free delivery above ₹999</li>
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-mint-deep" /> Child-safe, quality-checked toys</li>
            <li className="flex items-center gap-2"><RotateCcw size={18} className="text-mint-deep" /> 7-day easy returns</li>
          </ul>
          <Link href={`/product/${product.slug}`} onClick={onClose} className="mt-auto text-sm font-extrabold text-purple underline-offset-4 hover:underline">View full details →</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

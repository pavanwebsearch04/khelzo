"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Minus, Plus, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { Logo } from "@/components/art/Logo";
import { ages, categories } from "@/data/catalog";
import { api, imgUrl, type ApiProduct } from "@/lib/api";
import { mainNav, site } from "@/data/site";
import { inr } from "@/lib/format";
import { Block, Star } from "@/components/art/toys";

function Shell({ title, side, onClose, children, icon }: { title: string; side: "left" | "right"; onClose: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  const x = side === "right" ? "100%" : "-100%";
  return (
    <div className="fixed inset-0 z-[80]">
      <motion.div className="absolute inset-0 bg-ink/55" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.aside
        role="dialog" aria-modal="true" aria-label={title}
        className={`absolute top-0 flex h-full w-[min(430px,92vw)] flex-col border-ink bg-cream ${side === "right" ? "right-0 border-l-2" : "left-0 border-r-2"}`}
        initial={{ x }} animate={{ x: 0 }} exit={{ x }}
        transition={{ type: "spring", stiffness: 280, damping: 32 }}
      >
        <div className="flex items-center justify-between border-b-2 border-ink bg-white px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">{icon}{title}</h2>
          <button onClick={onClose} aria-label="Close" autoFocus className="grid size-10 place-items-center rounded-full border-2 border-ink bg-cream transition-transform hover:rotate-90"><X size={20} /></button>
        </div>
        {children}
      </motion.aside>
    </div>
  );
}

function Empty({ text, cta, href, onClose }: { text: string; cta: string; href: string; onClose: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div>
        <div className="relative mx-auto h-28 w-28">
          <Block color="purple" className="k-float absolute inset-0" />
          <Star className="k-twinkle absolute -right-3 -top-2 size-9" />
        </div>
        <p className="mt-4 font-display text-2xl font-bold">{text}</p>
        <Link href={href} onClick={onClose} className="btn btn-orange mt-5">{cta}</Link>
      </div>
    </div>
  );
}

export function Drawers() {
  const s = useStore();
  const close = () => s.openPanel(null);
  return (
    <AnimatePresence>
      {s.panel === "cart" && <CartDrawer key="cart" onClose={close} />}
      {s.panel === "wishlist" && <WishlistDrawer key="wish" onClose={close} />}
      {s.panel === "menu" && <MobileMenu key="menu" onClose={close} />}
    </AnimatePresence>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, quote, quoting, setQty, removeFromCart, clearCart, cartCount, coupon, couponError, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState("");
  const pct = quote ? Math.min(100, ((quote.subtotal - quote.discount) / quote.free_above) * 100) : 0;
  const left = quote ? Math.max(0, quote.free_above - (quote.subtotal - quote.discount)) : 0;
  const blocked = !!quote?.issues.length;
  return (
    <Shell title="Your KHELZO Cart" side="right" onClose={onClose} icon={<ShoppingBag size={24} className="text-tangerine" />}>
      {cart.length === 0 ? (
        <Empty text="Your cart is empty. Let's fill it with fun!" cta="Explore Toys" href="/shop" onClose={onClose} />
      ) : (
        <>
          <div className="border-b-2 border-ink/10 bg-white px-5 py-3">
            <p className="text-sm font-bold">
              {left > 0 ? <>Add <b className="text-tangerine-deep">{inr(left)}</b> more for free delivery</> : <>🎉 You&apos;ve unlocked <b className="text-mint-deep">free delivery!</b></>}
            </p>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream-deep">
              <motion.div className="h-full bg-gradient-to-r from-tangerine to-sun" animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
            </div>
          </div>
          <ul className="flex-1 space-y-3 overflow-y-auto p-5">
            {!quote && <li className="text-sm font-bold text-ink-soft">Updating prices…</li>}
            <AnimatePresence initial={false}>
              {quote?.lines.map((p) => (
                <motion.li key={p.id} layout initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }} className="flex gap-3 rounded-2xl border-2 border-ink bg-white p-3">
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-ink">{p.image && <Image src={imgUrl(p.image)} alt={p.name} fill sizes="80px" className="object-cover" />}</Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[15px] font-extrabold leading-snug line-clamp-2">{p.name}</p>
                      <button onClick={() => removeFromCart(p.id)} aria-label={`Remove ${p.name}`} className="text-ink-soft hover:text-berry"><Trash2 size={17} /></button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border-2 border-ink">
                        <button onClick={() => setQty(p.id, p.qty - 1)} aria-label="Decrease quantity" className="grid size-8 place-items-center rounded-full hover:bg-cream-deep"><Minus size={15} /></button>
                        <span className="w-7 text-center text-sm font-black" aria-live="polite">{p.qty}</span>
                        <button onClick={() => setQty(p.id, p.qty + 1)} disabled={p.qty >= Math.min(10, p.stock)} aria-label="Increase quantity" className="grid size-8 place-items-center rounded-full hover:bg-cream-deep disabled:opacity-30"><Plus size={15} /></button>
                      </div>
                      <span className="font-black">{inr(p.line_total)}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
            {quote?.issues.map((i) => <li key={i.id} className="rounded-xl bg-berry/10 p-3 text-sm font-bold text-berry">{i.name}: {i.issue === "out_of_stock" ? "now out of stock and removed." : `only ${i.available} available.`}</li>)}
          </ul>
          <div className="space-y-3 border-t-2 border-ink bg-white p-5">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-mint/25 px-3 py-2 text-sm font-extrabold"><span className="inline-flex items-center gap-2"><Tag size={16} /> {coupon} applied</span><button onClick={removeCoupon} className="text-ink-soft underline">Remove</button></div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); void applyCoupon(code).then((ok) => ok && setCode("")); }} className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="h-10 min-w-0 flex-1 rounded-full border-2 border-ink px-4 text-sm font-bold uppercase outline-none" />
                <button className="btn btn-sm btn-white">Apply</button>
              </form>
            )}
            {couponError && <p className="text-xs font-bold text-berry">{couponError}</p>}
            {quote && (
              <dl className="space-y-1 text-sm font-bold">
                <div className="flex justify-between text-ink-soft"><dt>Subtotal ({cartCount})</dt><dd>{inr(quote.subtotal)}</dd></div>
                {quote.discount > 0 && <div className="flex justify-between text-mint-deep"><dt>Coupon discount</dt><dd>-{inr(quote.discount)}</dd></div>}
                <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>{quote.shipping ? inr(quote.shipping) : "FREE"}</dd></div>
                <div className="flex justify-between text-lg font-black"><dt>Total</dt><dd>{inr(quote.total)}</dd></div>
              </dl>
            )}
            <Link href="/checkout" onClick={onClose} aria-disabled={blocked || quoting} className={`btn btn-purple w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>Checkout</Link>
            <div className="flex justify-between text-sm font-bold">
              <Link href="/cart" onClick={onClose} className="text-purple underline-offset-4 hover:underline">View full cart</Link>
              <button onClick={clearCart} className="text-ink-soft underline-offset-4 hover:underline">Clear cart</button>
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}

function WishlistDrawer({ onClose }: { onClose: () => void }) {
  const { wishlist, toggleWish, addToCart } = useStore();
  const [items, setItems] = useState<ApiProduct[] | null>(null);
  useEffect(() => {
    if (!wishlist.length) { setItems([]); return; }
    let live = true;
    api<{ data: ApiProduct[] }>(`/products/by-ids?ids=${wishlist.join(",")}`).then((r) => live && setItems(r.data)).catch(() => live && setItems([]));
    return () => { live = false; };
  }, [wishlist]);
  return (
    <Shell title="KHELZO Wishlist" side="right" onClose={onClose} icon={<Heart size={24} className="fill-berry text-berry" />}>
      {items && items.length === 0 ? (
        <Empty text="No favourites yet. Tap a heart to save toys!" cta="Browse Toys" href="/shop" onClose={onClose} />
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto p-5">
          {!items && <li className="text-sm font-bold text-ink-soft">Loading…</li>}
          {items?.map((p) => (
            <li key={p.id} className="flex gap-3 rounded-2xl border-2 border-ink bg-white p-3">
              <Link href={`/product/${p.slug}`} onClick={onClose} className="relative size-20 shrink-0 overflow-hidden rounded-xl border-2 border-ink"><Image src={imgUrl(p.images[0])} alt={p.name} fill sizes="80px" className="object-cover" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-[15px] font-extrabold leading-snug line-clamp-2">{p.name}</p>
                <p className="font-black">{inr(p.price)}</p>
                <div className="mt-auto flex gap-2 pt-2">
                  <button onClick={() => { addToCart(p.id, 1, p.name); toggleWish(p.id); }} disabled={p.availability === "out_of_stock"} className="btn btn-sm btn-orange !min-h-9 flex-1 disabled:opacity-50"><ShoppingBag size={15} /> {p.availability === "out_of_stock" ? "Sold out" : "Move to cart"}</button>
                  <button onClick={() => toggleWish(p.id)} aria-label={`Remove ${p.name} from wishlist`} className="grid size-9 place-items-center rounded-full border-2 border-ink hover:bg-[#ffe3ec]"><Trash2 size={15} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const groups: Record<string, { label: string; href: string }[]> = {
    "Shop All Toys": categories.slice(0, 8).map((c) => ({ label: c.short, href: `/shop?category=${c.slug}` })),
    Categories: categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
    "Shop by Age": ages.map((a) => ({ label: `${a.range} yrs · ${a.title}`, href: `/shop?age=${a.slug}` })),
    "Learning & Educational": [
      { label: "STEM & Science", href: "/shop?category=stem" }, { label: "Building & Engineering", href: "/shop?category=building" },
      { label: "Puzzles & Brain Games", href: "/shop?category=puzzles-games" }, { label: "Creativity & Art", href: "/shop?category=arts-crafts" },
      { label: "All learning toys", href: "/shop?tag=learning" },
    ],
    "Gifts & Offers": [
      { label: "Birthday Gifts", href: "/shop?tag=gift" }, { label: "Under ₹499", href: "/shop?max=499" },
      { label: "Under ₹999", href: "/shop?max=999" }, { label: "Under ₹1,999", href: "/shop?max=1999" }, { label: "Biggest discounts", href: "/shop?sort=discount" },
    ],
  };
  return (
    <Shell title="Menu" side="left" onClose={onClose}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-purple p-3 text-white"><Logo light size={36} /><span className="text-xs font-bold">{site.tagline}</span></div>
        <ul className="space-y-1">
          {mainNav.map((item) => {
            const g = groups[item.label];
            return (
              <li key={item.label}>
                {g ? (
                  <>
                    <button onClick={() => setOpen(open === item.label ? null : item.label)} aria-expanded={open === item.label} className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-[17px] font-extrabold hover:bg-purple-soft">
                      {item.label}<ChevronDown size={18} className={`transition-transform ${open === item.label ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open === item.label && (
                        <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pl-4">
                          {g.map((l) => (
                            <li key={l.href + l.label}><Link href={l.href} onClick={onClose} className="block rounded-xl px-4 py-2.5 text-[15px] font-bold text-ink-soft hover:bg-cream-deep hover:text-ink">{l.label}</Link></li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href={item.href} onClick={onClose} className="block rounded-2xl px-4 py-3.5 text-[17px] font-extrabold hover:bg-purple-soft">{item.label}</Link>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-5 grid gap-2">
          <Link href="/account" onClick={onClose} className="btn btn-white">My account / Login</Link>
          <Link href="/track-order" onClick={onClose} className="btn btn-white">Track your order</Link>
        </div>
      </div>
    </Shell>
  );
}

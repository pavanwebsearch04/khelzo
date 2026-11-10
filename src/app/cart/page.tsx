"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, Tag, Trash2, Truck } from "lucide-react";
import { useStore } from "@/components/providers/StoreProvider";
import { imgUrl } from "@/lib/api";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { cart, quote, quoting, setQty, removeFromCart, clearCart, coupon, couponError, applyCoupon, removeCoupon, cartCount } = useStore();
  const [code, setCode] = useState("");
  const blocked = !!quote?.issues.length;
  const left = quote ? Math.max(0, quote.free_above - (quote.subtotal - quote.discount)) : 0;

  if (cart.length === 0) {
    return (
      <div className="container-k grid min-h-[50vh] place-items-center py-20 text-center">
        <div><ShoppingBag size={56} className="mx-auto text-purple" /><h1 className="mt-4 font-display text-4xl font-bold">Your cart is empty</h1><p className="mt-2 text-ink-soft">Let&apos;s fill it with fun!</p><Link href="/shop" className="btn btn-orange mt-6">Explore Toys</Link></div>
      </div>
    );
  }

  return (
    <div className="container-k py-10">
      <h1 className="display-section">Shopping cart <span className="text-ink-soft">({cartCount})</span></h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {quote && (
            <div className="mb-4 rounded-2xl border-2 border-ink bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-extrabold"><Truck size={18} className="text-mint-deep" />{left > 0 ? <>Add <b className="text-tangerine-deep">{inr(left)}</b> more for free delivery</> : <>You&apos;ve unlocked free delivery 🎉</>}</p>
              <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream-deep"><div className="h-full bg-gradient-to-r from-tangerine to-sun transition-all" style={{ width: `${Math.min(100, ((quote.subtotal - quote.discount) / quote.free_above) * 100)}%` }} /></div>
            </div>
          )}
          {quote?.issues.map((i) => <p key={`${i.id}:${i.variant_id ?? 0}:${i.issue}`} className="mb-2 rounded-xl bg-berry/10 p-3 text-sm font-bold text-berry">{i.name}: {i.issue === "out_of_stock" ? "now out of stock, so it was removed." : i.issue === "variant_required" ? "please choose an option on the product page." : `only ${i.available} left, so the quantity was reduced.`}</p>)}
          <ul className="space-y-3">
            {!quote && <li className="rounded-2xl border-2 border-ink/10 bg-white p-6 font-bold text-ink-soft">Updating prices…</li>}
            {quote?.lines.map((l) => (
              <li key={`${l.id}:${l.variant_id ?? 0}`} className="flex gap-4 rounded-[24px] border-2 border-ink bg-white p-4">
                <Link href={`/product/${l.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl border-2 border-ink sm:size-28">{l.image && <Image src={imgUrl(l.image)} alt={l.name} fill sizes="112px" className="object-cover" />}</Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-3">
                    <Link href={`/product/${l.slug}`} className="font-extrabold leading-snug hover:text-purple">{l.name}{l.variant_label && <span className="block text-sm font-bold text-ink-soft">{l.variant_label}</span>}</Link>
                    <button onClick={() => removeFromCart(l.id, l.variant_id)} aria-label={`Remove ${l.name}`} className="text-ink-soft hover:text-berry"><Trash2 size={19} /></button>
                  </div>
                  <p className="text-sm font-bold text-ink-soft">{inr(l.unit_price)} each {l.mrp > l.unit_price && <span className="line-through">{inr(l.mrp)}</span>}</p>
                  {l.stock <= 5 && <p className="text-xs font-extrabold text-tangerine-deep">Only {l.stock} left</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border-2 border-ink">
                      <button onClick={() => setQty(l.id, l.qty - 1, l.variant_id)} aria-label="Decrease quantity" className="grid size-10 place-items-center rounded-full hover:bg-cream-deep"><Minus size={16} /></button>
                      <span className="w-9 text-center font-black" aria-live="polite">{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1, l.variant_id)} disabled={l.qty >= Math.min(10, l.stock)} aria-label="Increase quantity" className="grid size-10 place-items-center rounded-full hover:bg-cream-deep disabled:opacity-30"><Plus size={16} /></button>
                    </div>
                    <span className="text-xl font-black">{inr(l.line_total)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between text-sm font-bold"><Link href="/shop" className="text-purple underline-offset-4 hover:underline">← Continue shopping</Link><button onClick={clearCart} className="text-ink-soft underline-offset-4 hover:underline">Clear cart</button></div>
        </div>

        <aside className="h-fit rounded-[28px] border-2 border-ink bg-white p-6 lg:sticky lg:top-[130px]">
          <h2 className="font-display text-2xl font-bold">Order summary</h2>
          <div className="mt-4">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-mint/25 px-3 py-2.5 text-sm font-extrabold"><span className="inline-flex items-center gap-2"><Tag size={16} /> {coupon} applied</span><button onClick={removeCoupon} className="underline">Remove</button></div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); void applyCoupon(code).then((ok) => ok && setCode("")); }} className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="h-11 min-w-0 flex-1 rounded-full border-2 border-ink px-4 text-sm font-bold uppercase" />
                <button className="btn btn-sm btn-white">Apply</button>
              </form>
            )}
            {couponError && <p className="mt-2 text-xs font-bold text-berry">{couponError}</p>}
            <p className="mt-2 text-xs font-semibold text-ink-soft">Try WELCOME10, PLAY100, FREESHIP or BEARS15.</p>
          </div>
          {quote && (
            <dl className="mt-5 space-y-2 text-[15px] font-bold">
              <div className="flex justify-between text-ink-soft"><dt>Items ({quote.qty})</dt><dd>{inr(quote.subtotal)}</dd></div>
              {quote.discount > 0 && <div className="flex justify-between text-mint-deep"><dt>Coupon discount</dt><dd>-{inr(quote.discount)}</dd></div>}
              <div className="flex justify-between text-ink-soft"><dt>Shipping</dt><dd>{quote.shipping ? inr(quote.shipping) : "FREE"}</dd></div>
              <div className="flex justify-between text-xs text-ink-soft"><dt>Includes GST</dt><dd>{inr(quote.tax_included)}</dd></div>
              <div className="flex justify-between border-t-2 border-ink pt-3 text-2xl font-black"><dt>Total</dt><dd>{inr(quote.total)}</dd></div>
              {quote.savings > 0 && <p className="rounded-xl bg-sun/40 px-3 py-2 text-center text-sm font-extrabold">You&apos;re saving {inr(quote.savings)} on this order 🎉</p>}
            </dl>
          )}
          <Link href="/checkout" aria-disabled={blocked || quoting || !quote} className={`btn btn-purple mt-5 w-full ${blocked || !quote ? "pointer-events-none opacity-50" : ""}`}>Proceed to checkout</Link>
        </aside>
      </div>
    </div>
  );
}

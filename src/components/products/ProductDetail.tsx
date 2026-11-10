"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Check, GitCompareArrows, Heart, Maximize2, Minus, Plus, RotateCcw, Share2, ShieldCheck, Truck, X, Lock, ZoomIn } from "lucide-react";
import { ApiError, api, imgUrl, type ApiProduct } from "@/lib/api";
import { inr } from "@/lib/format";
import { useStore } from "@/components/providers/StoreProvider";
import { track } from "@/lib/analytics";
import { Stars } from "@/components/ui/bits";
import { ProductCard } from "./ProductCard";
import { ReviewsPanel } from "./ReviewsPanel";

const MAX = 10;
const Spec = ({ k, v }: { k: string; v?: string | null }) => v ? <div className="grid grid-cols-[130px_1fr] gap-3 border-b border-ink/10 py-2.5 text-[14.5px]"><dt className="font-extrabold text-ink-soft">{k}</dt><dd className="font-semibold">{v}</dd></div> : null;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const go = (d: number) => setI((n) => (n + d + images.length) % images.length);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  });
  return (
    <div className="grid gap-3 md:grid-cols-[84px_1fr]">
      <ul className="order-2 flex gap-2 md:order-1 md:flex-col" aria-label="Product images">
        {images.map((src, n) => (
          <li key={src}><button onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-current={n === i} className={`relative size-16 overflow-hidden rounded-xl border-2 md:size-[84px] ${n === i ? "border-purple shadow-[0_3px_0_0_var(--color-purple)]" : "border-ink/20"}`}>
            <Image src={imgUrl(src)} alt="" fill sizes="84px" className="object-cover" /></button></li>
        ))}
      </ul>
      <div className="order-1 md:order-2">
        <div
          className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-[28px] border-2 border-ink bg-white"
          onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
          onMouseLeave={() => setZoom(null)} onClick={() => setFull(true)}
        >
          <Image src={imgUrl(images[i])} alt={name} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition-transform duration-200"
            style={zoom ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
          <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full border-2 border-ink bg-white/90"><Maximize2 size={17} /></span>
          <span className="pointer-events-none absolute left-3 top-3 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold md:inline-flex"><ZoomIn size={14} /> Hover to zoom</span>
          {images.length > 1 && (<>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white/90"><ChevronLeft size={20} /></button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border-2 border-ink bg-white/90"><ChevronRight size={20} /></button>
          </>)}
        </div>
      </div>
      {full && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-ink/90 p-4" role="dialog" aria-modal="true" aria-label="Full-screen image viewer" onClick={() => setFull(false)}>
          <button onClick={() => setFull(false)} aria-label="Close" autoFocus className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border-2 border-white bg-white/10 text-white"><X size={22} /></button>
          <div className="relative h-[80vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}><Image src={imgUrl(images[i])} alt={name} fill sizes="90vw" className="object-contain" /></div>
          {images.length > 1 && (<>
            <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className="absolute left-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-white/10 text-white"><ChevronLeft size={24} /></button>
            <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next image" className="absolute right-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-white/10 text-white"><ChevronRight size={24} /></button>
          </>)}
        </div>
      )}
    </div>
  );
}

export function ProductDetail({ product: p, related, distribution }: { product: ApiProduct; related: ApiProduct[]; distribution: Record<string, number> }) {
  const router = useRouter();
  const { addToCart, isWished, toggleWish, compare, toggleCompare, pushRecent, recent, qtyOf, say } = useStore();
  const variants = p.variants ?? [];
  const [vId, setVId] = useState<number | null>(() => (variants.find((x) => x.stock > 0) ?? variants[0])?.id ?? null);
  const v = variants.find((x) => x.id === vId) ?? null;
  const price = v?.price ?? p.price;
  const mrp = v?.mrp ?? p.mrp;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const stock = v ? v.stock : p.stock;
  const out = stock < 1;
  const lowStock = !out && stock <= 5;
  const gallery = v?.image && !p.images.includes(v.image) ? [v.image, ...p.images] : p.images;
  const cap = Math.min(MAX, stock);
  const [qty, setQty] = useState(1);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [pinRes, setPinRes] = useState<{ ok: boolean; msg: string; eta?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [recentItems, setRecentItems] = useState<ApiProduct[]>([]);
  const [added, setAdded] = useState(false);
  const buyRef = useRef<HTMLDivElement>(null);
  const [stickyOn, setStickyOn] = useState(false);

  useEffect(() => { pushRecent(p.id); track("view_item", { item_id: p.id, item_name: p.name, value: p.price, currency: "INR" }); }, [p.id, p.name, p.price, pushRecent]);
  useEffect(() => { setQty(1); }, [p.id, vId]);
  useEffect(() => {
    const ids = recent.filter((x) => x !== p.id).slice(0, 6);
    if (!ids.length) { setRecentItems([]); return; }
    api<{ data: ApiProduct[] }>(`/products/by-ids?ids=${ids.join(",")}`).then((r) => setRecentItems(r.data)).catch(() => {});
  }, [recent, p.id]);
  useEffect(() => {
    const el = buyRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setStickyOn(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, []);

  const inCart = qtyOf(p.id, v?.id);
  const room = Math.max(0, cap - inCart); // cannot exceed available stock including what is already in the cart
  const setQ = (n: number) => setQty(Math.max(1, Math.min(n, Math.max(1, room || cap))));

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    try {
      const r = await api<{ serviceable: boolean; methods: { id: string; label: string; eta: string }[] }>(`/pincode/${pin}`);
      const m = r.methods[0];
      setPinRes(r.serviceable ? { ok: true, msg: `Delivering to ${pin}`, eta: m.eta } : { ok: false, msg: "Sorry, we don't deliver to this PIN code yet." });
    } catch (err) { setPinRes({ ok: false, msg: err instanceof ApiError ? err.message : "Could not check this PIN code." }); }
    setChecking(false);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: `${p.name} on KHELZO`, url });
      else { await navigator.clipboard.writeText(url); say("Link copied to clipboard"); }
    } catch {}
  };
  const add = () => { addToCart(p.id, qty, v ? `${p.name} (${v.label})` : p.name, v?.id); setAdded(true); setTimeout(() => setAdded(false), 1400); };
  const buyNow = () => router.push(`/checkout?buy=${p.id}:${qty}${v ? `:${v.id}` : ""}`);
  const notifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    try { const r = await api<{ message: string }>(`/products/${p.id}/stock-alert`, { body: { email: alertEmail } }); setAlertMsg(r.message); }
    catch (err) { setAlertMsg(err instanceof ApiError ? err.message : "Could not save your request."); }
  };

  const stockMsg = out ? { t: "Out of stock", c: "text-berry" } : lowStock ? { t: `Hurry, only ${stock} left`, c: "text-tangerine-deep" } : { t: "In stock", c: "text-mint-deep" };

  return (
    <div className="pb-28 md:pb-16">
      <div className="container-k pt-6">
        <nav aria-label="Breadcrumb" className="text-sm font-bold text-ink-soft">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/shop" className="hover:underline">Shop</Link> / <Link href={`/shop?category=${p.category}`} className="hover:underline">{p.category_name}</Link> / <span className="text-ink">{p.name}</span>
        </nav>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <Gallery key={v?.id ?? 0} images={gallery} name={p.name} />

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider">
              {p.badge && <span className="rounded-full border-2 border-ink bg-sun px-3 py-1">{p.badge}</span>}
              <span className="rounded-full bg-purple-soft px-3 py-1 text-purple">{p.category_name}</span>
              <span className="rounded-full bg-mint/40 px-3 py-1">Ages {p.age.replace("-plus", "+")}</span>
            </div>
            <h1 className="mt-3 font-display text-[clamp(1.9rem,3vw+0.5rem,2.8rem)] font-bold leading-tight">{p.name}</h1>
            <p className="mt-2 text-sm font-bold text-ink-soft">Brand: <Link href={`/shop?brand=${p.brand_slug}`} className="text-purple hover:underline">{p.brand}</Link> · SKU: {p.sku}</p>
            <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm"><Stars value={p.rating} size={18} /> <b>{p.rating.toFixed(1)}</b> <span className="text-ink-soft underline">{p.reviews.toLocaleString("en-IN")} reviews</span></a>

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="text-4xl font-black">{inr(price)}</span>
              {discount > 0 && <><span className="text-lg text-ink-soft line-through">{inr(mrp)}</span><span className="rounded-full bg-tangerine px-3 py-1 text-sm font-black text-white">{discount}% OFF</span></>}
            </div>
            <p className="mt-1 text-sm font-semibold text-ink-soft">Inclusive of all taxes (GST {p.tax_rate}%). You save {inr(mrp - price)}.</p>
            <p className={`mt-3 text-[15px] font-extrabold ${stockMsg.c}`}>{stockMsg.t}</p>

            <p className="mt-4 leading-relaxed text-ink-soft">{p.desc}</p>

            <div ref={buyRef} className="mt-6 rounded-[24px] border-2 border-ink bg-white p-5">
              {variants.length > 0 && (
                <fieldset className="mb-4">
                  <legend className="mb-2 text-xs font-black uppercase tracking-wider text-ink-soft">Choose option{v ? `: ${v.label}` : ""}</legend>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Product options">
                    {variants.map((x) => (
                      <button key={x.id} type="button" role="radio" aria-checked={x.id === vId} onClick={() => setVId(x.id)}
                        className={`rounded-full border-2 px-4 py-2 text-sm font-extrabold ${x.id === vId ? "border-purple bg-purple-soft text-purple shadow-[0_3px_0_0_var(--color-purple)]" : "border-ink/25 bg-white"} ${x.stock < 1 ? "opacity-50 line-through" : ""}`}>
                        {x.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label htmlFor="qty" className="mb-1 block text-xs font-black uppercase tracking-wider text-ink-soft">Quantity</label>
                  <div className="flex items-center rounded-full border-2 border-ink">
                    <button onClick={() => setQ(qty - 1)} disabled={out || qty <= 1} aria-label="Decrease quantity" className="grid size-11 place-items-center rounded-full hover:bg-cream-deep disabled:opacity-30"><Minus size={17} /></button>
                    <input id="qty" inputMode="numeric" value={qty} disabled={out} onChange={(e) => setQ(parseInt(e.target.value.replace(/\D/g, ""), 10) || 1)} className="w-12 bg-transparent text-center text-lg font-black outline-none" aria-label="Quantity" />
                    <button onClick={() => setQ(qty + 1)} disabled={out || qty >= (room || cap)} aria-label="Increase quantity" className="grid size-11 place-items-center rounded-full hover:bg-cream-deep disabled:opacity-30"><Plus size={17} /></button>
                  </div>
                </div>
                <div className="ml-auto text-right"><div className="text-xs font-black uppercase tracking-wider text-ink-soft">Subtotal</div><div className="text-2xl font-black">{inr(price * qty)}</div></div>
              </div>
              {!out && room < 1 && <p className="mt-3 text-sm font-bold text-tangerine-deep">You already have the maximum available ({inCart} units) in your cart.</p>}
              {out && (
                <form onSubmit={notifyMe} className="mt-4 rounded-2xl bg-cream-deep p-3">
                  <label htmlFor="alert-email" className="text-sm font-extrabold">Get an email when it&apos;s back in stock</label>
                  <div className="mt-2 flex gap-2">
                    <input id="alert-email" type="email" required value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="you@example.com" className="h-11 min-w-0 flex-1 rounded-full border-2 border-ink px-4 font-bold outline-none" />
                    <button className="btn btn-sm btn-purple">Notify me</button>
                  </div>
                  {alertMsg && <p role="status" className="mt-2 text-sm font-bold text-ink-soft">{alertMsg}</p>}
                </form>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={add} disabled={out || room < 1} className="btn btn-orange !min-h-14 disabled:cursor-not-allowed disabled:opacity-50">{added ? <><Check size={20} strokeWidth={3} /> Added!</> : out ? "Out of stock" : "Add to Cart"}</button>
                <button onClick={buyNow} disabled={out} className="btn btn-purple !min-h-14 disabled:cursor-not-allowed disabled:opacity-50">Buy Now</button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => toggleWish(p.id)} aria-pressed={isWished(p.id)} className="btn btn-sm btn-white"><Heart size={16} className={isWished(p.id) ? "fill-berry text-berry" : ""} /> {isWished(p.id) ? "Wishlisted" : "Add to Wishlist"}</button>
                <button onClick={() => toggleCompare(p.id)} aria-pressed={compare.includes(p.id)} className="btn btn-sm btn-white"><GitCompareArrows size={16} /> {compare.includes(p.id) ? "In comparison" : "Compare"}</button>
                <button onClick={share} className="btn btn-sm btn-white"><Share2 size={16} /> Share</button>
              </div>
            </div>

            <form onSubmit={check} className="mt-4 rounded-[24px] border-2 border-ink/15 bg-white p-4">
              <label htmlFor="pin" className="flex items-center gap-2 text-sm font-extrabold"><Truck size={18} className="text-mint-deep" /> Check delivery</label>
              <div className="mt-2 flex gap-2">
                <input id="pin" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinRes(null); }} placeholder="Enter 6-digit PIN code" className="h-11 min-w-0 flex-1 rounded-full border-2 border-ink px-4 font-bold outline-none" />
                <button disabled={pin.length !== 6 || checking} className="btn btn-sm btn-purple disabled:opacity-50">{checking ? "…" : "Check"}</button>
              </div>
              {pinRes && <p role="status" className={`mt-2 text-sm font-bold ${pinRes.ok ? "text-mint-deep" : "text-berry"}`}>{pinRes.msg}{pinRes.eta && <> · Estimated delivery by <b>{fmtDate(pinRes.eta)}</b></>}</p>}
              {!pinRes && <p className="mt-2 text-sm font-semibold text-ink-soft">Free delivery on orders above ₹999. Cash on Delivery available.</p>}
            </form>

            <ul className="mt-4 grid gap-2.5 text-sm font-bold text-ink-soft sm:grid-cols-3">
              <li className="flex items-start gap-2"><RotateCcw size={18} className="mt-0.5 shrink-0 text-purple" /> 7-day return &amp; replacement for damaged or wrong items</li>
              <li className="flex items-start gap-2"><Lock size={18} className="mt-0.5 shrink-0 text-purple" /> Secure payments via Razorpay (UPI, cards, net banking)</li>
              <li className="flex items-start gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-purple" /> Child-safe, quality-checked toys</li>
            </ul>
          </div>
        </div>

        {/* Details */}
        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <section className="rounded-[28px] border-2 border-ink bg-white p-6">
            <h2 className="font-display text-2xl font-bold">Key features</h2>
            <ul className="mt-3 space-y-2">{p.features?.map((f) => <li key={f} className="flex gap-2.5 font-semibold"><Check size={18} className="mt-1 shrink-0 text-mint-deep" /> {f}</li>)}</ul>
            <h3 className="mt-6 font-display text-xl font-bold">What&apos;s in the box</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-semibold text-ink-soft">{p.box_contents?.map((f) => <li key={f}>{f}</li>)}</ul>
            {p.video_url && <div className="mt-6 aspect-video overflow-hidden rounded-2xl border-2 border-ink"><iframe src={p.video_url} title={`${p.name} demonstration`} className="size-full" allowFullScreen loading="lazy" /></div>}
          </section>
          <section className="rounded-[28px] border-2 border-ink bg-white p-6">
            <h2 className="font-display text-2xl font-bold">Product details</h2>
            <dl className="mt-3">
              <Spec k="Brand" v={p.brand} /><Spec k="SKU" v={p.sku} /><Spec k="Age" v={`${p.age.replace("-plus", "+")} years`} /><Spec k="Toy type" v={p.toy_type} />
              <Spec k="Material" v={p.material} /><Spec k="Dimensions" v={p.dimensions} /><Spec k="Weight" v={p.weight} />
              {p.attributes?.filter((a) => !["Age", "Type"].includes(a.name)).map((a) => <Spec key={a.name} k={a.name} v={a.value} />)}
            </dl>
            <h3 className="mt-6 font-display text-xl font-bold">Safety information</h3>
            <p className="mt-2 text-[14.5px] font-semibold leading-relaxed text-ink-soft">{p.safety}</p>
          </section>
        </div>

        <ReviewsPanel product={p} distribution={distribution} />

        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="rel">
            <h2 id="rel" className="font-display text-3xl font-bold">You may also like</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 pb-6 pt-1 sm:gap-4 md:grid-cols-4">
              {related.slice(0, 4).map((r) => <li key={r.id} className="min-w-0"><ProductCard product={r} /></li>)}
            </ul>
          </section>
        )}
        {recentItems.length > 0 && (
          <section className="mt-10" aria-labelledby="rv">
            <h2 id="rv" className="font-display text-3xl font-bold">Recently viewed</h2>
            <ul className="mt-6 grid grid-cols-2 gap-3 pb-6 pt-1 sm:gap-4 md:grid-cols-4">
              {recentItems.slice(0, 4).map((r) => <li key={r.id} className="min-w-0"><ProductCard product={r} /></li>)}
            </ul>
          </section>
        )}
      </div>

      {/* Sticky purchase bar on mobile */}
      <div className={`fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-white p-3 shadow-[0_-10px_30px_-12px_rgba(41,36,59,.4)] transition-transform duration-300 md:hidden ${stickyOn ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold">{p.name}</div><div className="font-black">{inr(price * qty)}</div></div>
          <button onClick={add} disabled={out || room < 1} className="btn btn-sm btn-orange !min-h-12 disabled:opacity-50">{out ? "Sold out" : "Add to Cart"}</button>
          <button onClick={buyNow} disabled={out} className="btn btn-sm btn-purple !min-h-12 disabled:opacity-50">Buy Now</button>
        </div>
      </div>
    </div>
  );
}

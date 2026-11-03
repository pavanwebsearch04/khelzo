"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, api, type ApiProduct, type Quote } from "@/lib/api";
import { useAuth } from "./AuthProvider";

interface CartLine { id: number; qty: number }
type Panel = "cart" | "wishlist" | "menu" | null;
export type Pid = number | string;

/** The homepage still ships static card data with ids like "p07"; the API id is the number inside. */
export const toId = (id: Pid): number => (typeof id === "number" ? id : Number(String(id).replace(/\D/g, "")));

const KEY = "khelzo-store-v2";
const MAX_QTY = 10;

interface Ctx {
  cart: CartLine[];
  cartCount: number;
  quote: Quote | null;
  quoting: boolean;
  coupon: string | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  qtyOf: (id: Pid) => number;
  addToCart: (id: Pid, qty?: number, name?: string) => void;
  setQty: (id: Pid, qty: number) => void;
  removeFromCart: (id: Pid) => void;
  clearCart: () => void;
  wishlist: number[];
  isWished: (id: Pid) => boolean;
  toggleWish: (id: Pid) => void;
  compare: number[];
  toggleCompare: (id: Pid) => string | null;
  recent: number[];
  pushRecent: (id: number) => void;
  panel: Panel;
  openPanel: (p: Panel) => void;
  quickView: ApiProduct | null;
  openQuickView: (id: Pid) => void;
  closeQuickView: () => void;
  toast: { id: number; msg: string } | null;
  say: (msg: string) => void;
  bump: number;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [compare, setCompare] = useState<number[]>([]);
  const [recent, setRecent] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [quickView, setQuickView] = useState<ApiProduct | null>(null);
  const [toast, setToast] = useState<Ctx["toast"]>(null);
  const [bump, setBump] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const mergedFor = useRef<number | null>(null);

  // ---- persistence (guest + logged-in; the server copy takes over after login) ----
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) ?? "{}");
      setCart(Array.isArray(d.cart) ? d.cart.filter((l: CartLine) => Number.isInteger(l.id) && l.qty > 0) : []);
      setCoupon(d.coupon ?? null);
      setWishlist(Array.isArray(d.wishlist) ? d.wishlist.filter(Number.isInteger) : []);
      setCompare(Array.isArray(d.compare) ? d.compare.filter(Number.isInteger) : []);
      setRecent(Array.isArray(d.recent) ? d.recent.filter(Number.isInteger) : []);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify({ cart, coupon, wishlist, compare, recent })); } catch {}
  }, [hydrated, cart, coupon, wishlist, compare, recent]);

  // ---- merge guest data into the account on login ----
  useEffect(() => {
    if (!hydrated || !ready) return;
    if (!user) { mergedFor.current = null; return; }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    (async () => {
      try {
        const [srvCart, srvWish] = await Promise.all([
          api<{ items: CartLine[]; coupon: string | null }>("/account/cart"),
          api<{ ids: number[] }>("/account/wishlist/sync", { body: { ids: wishlist } }),
        ]);
        setCart((local) => {
          const m = new Map<number, number>();
          [...srvCart.items, ...local].forEach((l) => m.set(l.id, Math.min(MAX_QTY, Math.max(m.get(l.id) ?? 0, l.qty))));
          return [...m].map(([id, qty]) => ({ id, qty }));
        });
        if (srvCart.coupon) setCoupon((c) => c ?? srvCart.coupon);
        setWishlist(srvWish.ids);
      } catch {}
    })();
  }, [hydrated, ready, user, wishlist]);

  useEffect(() => {
    if (!hydrated || !user || mergedFor.current !== user.id) return;
    const t = setTimeout(() => { api("/account/cart", { method: "PUT", body: { items: cart, coupon } }).catch(() => {}); }, 600);
    return () => clearTimeout(t);
  }, [cart, coupon, user, hydrated]);

  // ---- server-side pricing ----
  useEffect(() => {
    if (!hydrated) return;
    if (!cart.length) { setQuote(null); return; }
    const ctl = new AbortController();
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const q = await api<Quote>("/cart/quote", { body: { items: cart, coupon }, signal: ctl.signal });
        setQuote(q); setCouponError(null);
      } catch (e) {
        if (ctl.signal.aborted) return;
        if (e instanceof ApiError && e.errors.coupon) { setCoupon(null); setCouponError(e.message); }
      } finally { if (!ctl.signal.aborted) setQuoting(false); }
    }, 250);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [cart, coupon, hydrated, user]);

  // Quantities the server had to cap (stock changed) are written back so the UI never shows more than is buyable.
  useEffect(() => {
    if (!quote) return;
    setCart((c) => {
      let changed = false;
      const next = c.flatMap((l) => {
        const ql = quote.lines.find((x) => x.id === l.id);
        const bad = quote.issues.find((i) => i.id === l.id);
        if (!ql) { if (bad) { changed = true; return []; } return [l]; }
        if (ql.qty < l.qty) { changed = true; return [{ ...l, qty: ql.qty }]; }
        return [l];
      });
      return changed ? next : c;
    });
  }, [quote]);

  const say = useCallback((msg: string) => {
    setToast({ id: Date.now(), msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const addToCart = useCallback((pid: Pid, qty = 1, name?: string) => {
    const id = toId(pid);
    setCart((c) => {
      const f = c.find((l) => l.id === id);
      return f ? c.map((l) => (l.id === id ? { ...l, qty: Math.min(MAX_QTY, l.qty + qty) } : l)) : [...c, { id, qty: Math.min(MAX_QTY, qty) }];
    });
    setBump((b) => b + 1);
    say(`${name ?? "Toy"} added to your KHELZO cart`);
  }, [say]);

  const toggleWish = useCallback((pid: Pid) => {
    const id = toId(pid);
    setWishlist((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
    if (user) api(`/account/wishlist/${id}`, { method: "POST" }).catch(() => {});
  }, [user]);

  const toggleCompare = useCallback((pid: Pid) => {
    const id = toId(pid);
    let msg: string | null = null;
    setCompare((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id);
      if (c.length >= 4) { msg = "You can compare up to 4 toys at a time."; return c; }
      return [...c, id];
    });
    if (msg) say(msg);
    return msg;
  }, [say]);

  const pushRecent = useCallback((id: number) => setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 12)), []);

  const applyCoupon = useCallback(async (code: string) => {
    const c = code.trim().toUpperCase();
    if (!c) return false;
    try {
      await api("/cart/quote", { body: { items: cart, coupon: c } });
      setCoupon(c); setCouponError(null); return true;
    } catch (e) { setCouponError(e instanceof Error ? e.message : "Invalid coupon"); return false; }
  }, [cart]);

  const openQuickView = useCallback(async (pid: Pid) => {
    try {
      const r = await api<{ data: ApiProduct[] }>(`/products/by-ids?ids=${toId(pid)}`);
      if (r.data[0]) setQuickView(r.data[0]);
    } catch { say("Couldn't load that toy. Please try again."); }
  }, [say]);

  const value = useMemo<Ctx>(() => ({
    cart, cartCount: cart.reduce((n, l) => n + l.qty, 0), quote, quoting, coupon, couponError, applyCoupon,
    removeCoupon: () => { setCoupon(null); setCouponError(null); },
    qtyOf: (id) => cart.find((l) => l.id === toId(id))?.qty ?? 0,
    addToCart,
    setQty: (id, qty) => setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== toId(id)) : c.map((l) => (l.id === toId(id) ? { ...l, qty: Math.min(qty, MAX_QTY) } : l)))),
    removeFromCart: (id) => setCart((c) => c.filter((l) => l.id !== toId(id))),
    clearCart: () => { setCart([]); setCoupon(null); },
    wishlist, isWished: (id) => wishlist.includes(toId(id)), toggleWish,
    compare, toggleCompare, recent, pushRecent,
    panel, openPanel: setPanel, quickView, openQuickView, closeQuickView: () => setQuickView(null),
    toast, say, bump,
  }), [cart, quote, quoting, coupon, couponError, applyCoupon, addToCart, wishlist, toggleWish, compare, toggleCompare, recent, pushRecent, panel, quickView, openQuickView, toast, say, bump]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

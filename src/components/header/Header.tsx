"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Gift, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Logo } from "@/components/art/Logo";
import { mainNav, site } from "@/data/site";
import { useStore } from "@/components/providers/StoreProvider";
import { MegaMenu } from "./MegaMenu";
import { SearchBox } from "./SearchBox";

function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % site.announcements.length), 4200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative z-[60] overflow-hidden bg-ink text-white">
      <div className="container-k flex h-9 items-center justify-center gap-2.5 text-[13px] font-bold">
        <Gift size={16} className="k-wiggle shrink-0 text-sun" />
        <div className="relative h-5 min-w-0 flex-1 text-center sm:flex-none sm:min-w-[300px]">
          <AnimatePresence mode="wait">
            <motion.span
              key={i}
              className="absolute inset-0 truncate"
              initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              {site.announcements[i]}
            </motion.span>
          </AnimatePresence>
        </div>
        <Gift size={16} className="k-wiggle hidden shrink-0 text-sun sm:block" style={{ animationDelay: ".4s" }} />
      </div>
    </div>
  );
}

export function Header() {
  const { cartCount, wishlist, openPanel, bump } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileSearch, setMobileSearch] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pinned = useRef<string | null>(null);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const hoverOpen = (key: string) => { clearTimeout(closeTimer.current); setOpen(key); };
  const hoverClose = () => { closeTimer.current = setTimeout(() => { pinned.current = null; setOpen(null); }, 140); };
  // Hover opens a menu; a click on an already-hover-opened item keeps it open (touch + keyboard get a real toggle).
  const toggle = (key: string) => {
    if (pinned.current === key) { pinned.current = null; setOpen(null); }
    else { pinned.current = key; setOpen(key); }
  };

  return (
    <>
      <AnnouncementBar />
      <header
        className={`sticky top-0 z-50 border-b-2 transition-all duration-300 ${scrolled ? "border-ink/90 bg-cream/90 shadow-[0_10px_30px_-18px_rgba(41,36,59,.5)] backdrop-blur-md" : "border-transparent bg-cream"}`}
        onMouseLeave={hoverClose}
      >
        <div className="container-k">
          <div className={`flex items-center gap-2 transition-all duration-300 sm:gap-3 md:gap-6 ${scrolled ? "h-[62px]" : "h-[76px]"}`}>
            <button className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-white sm:size-11 lg:hidden" onClick={() => openPanel("menu")} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div className={`min-w-0 origin-left transition-transform duration-300 max-[420px]:[&_svg]:size-8 max-[420px]:[&_span.font-display]:!text-[21px] ${scrolled ? "scale-90" : "scale-100"}`}><Logo size={scrolled ? 40 : 46} /></div>

            <div className="mx-auto hidden w-full max-w-xl md:block"><SearchBox /></div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 md:ml-0">
              <button className="grid size-10 place-items-center rounded-full border-2 border-ink bg-white sm:size-11 md:hidden" onClick={() => setMobileSearch((v) => !v)} aria-label="Search toys" aria-expanded={mobileSearch}>
                <Search size={20} />
              </button>
              <Link href="/account" className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold transition-colors hover:bg-purple-soft sm:flex">
                <User size={21} /> <span className="hidden xl:inline">Login</span>
              </Link>
              <button onClick={() => openPanel("wishlist")} className="relative grid size-10 place-items-center rounded-full border-2 border-ink bg-white transition-colors hover:bg-[#ffe3ec] sm:size-11" aria-label={`Wishlist, ${wishlist.length} items`}>
                <Heart size={21} />
                {wishlist.length > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-ink bg-berry px-1 text-[11px] font-black text-white">{wishlist.length}</span>}
              </button>
              <button onClick={() => openPanel("cart")} className="relative grid size-10 place-items-center rounded-full border-2 border-ink bg-sun transition-transform hover:-translate-y-0.5 sm:size-11" aria-label={`Cart, ${cartCount} items`}>
                <ShoppingBag size={21} />
                <span key={bump} className={`absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full border-2 border-ink bg-tangerine px-1 text-[11px] font-black text-white ${bump ? "k-pop" : ""}`}>{cartCount}</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {mobileSearch && (
              <motion.div className="overflow-hidden pb-3 md:hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                <SearchBox onDone={() => setMobileSearch(false)} />
              </motion.div>
            )}
          </AnimatePresence>

          <nav aria-label="Main" className="hidden items-center gap-1 pb-3 lg:flex">
            {mainNav.map((item) => {
              const key = item.mega ? `${item.label}` : null;
              const active = key && open === key;
              return (
                <div key={item.label} className="relative" onMouseEnter={() => (key ? hoverOpen(key) : (clearTimeout(closeTimer.current), setOpen(null)))}>
                  {item.mega ? (
                    <button
                      type="button"
                      aria-expanded={!!active} aria-haspopup="true"
                      onClick={() => toggle(key!)}
                      className={`flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-[13.5px] font-extrabold transition-colors xl:px-4 xl:text-[14.5px] ${active ? "bg-purple text-white" : "hover:bg-purple-soft"}`}
                    >
                      {item.label}
                      <ChevronDown size={15} className={`transition-transform ${active ? "rotate-180" : ""}`} />
                    </button>
                  ) : (
                    <Link href={item.href} className="block whitespace-nowrap rounded-full px-2.5 py-2 text-[13.5px] font-extrabold transition-colors hover:bg-purple-soft xl:px-4 xl:text-[14.5px]">{item.label}</Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              key={open}
              onMouseEnter={() => clearTimeout(closeTimer.current)}
              initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-x-0 top-full z-40 hidden lg:block"
            >
              <div className="container-k">
                <div className="overflow-hidden rounded-b-[32px] border-2 border-t-0 border-ink bg-white shadow-[0_26px_50px_-20px_rgba(41,36,59,.55)]">
                  <MegaMenu kind={open} onNavigate={() => setOpen(null)} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

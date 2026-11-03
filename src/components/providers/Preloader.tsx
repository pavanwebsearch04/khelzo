"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/art/Logo";
import { Block, Sparkle, Star } from "@/components/art/toys";
import { markIntroDone } from "@/lib/intro";

const LETTERS = ["K", "H", "E", "L", "Z", "O"];
const COLORS = ["#fff", "#fff", "#fff", "#fff", "#FF8748", "#FFD84D"];
// 6 letters + logo mark + tagline: the curtain only lifts once every one has finished animating.
const PARTS = LETTERS.length + 2;

/**
 * First-load intro. The exit is driven by the animations themselves (onAnimationComplete),
 * not a fixed timer, so the wordmark always finishes before the curtain lifts.
 * A long fallback timer exists only to avoid a stuck overlay if animations never report back.
 */
export function Preloader() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(true);
  const finished = useRef(0);
  const leaving = useRef(false);
  const seenRef = useRef<boolean | null>(null);

  const leave = useCallback((hold: number) => {
    if (leaving.current) return;
    leaving.current = true;
    setTimeout(() => { markIntroDone(); setShow(false); }, hold);
  }, []);

  const partDone = useCallback(() => {
    finished.current += 1;
    if (finished.current >= PARTS) leave(420); // brief hold so the full logo registers
  }, [leave]);

  useEffect(() => {
    // Read once per mount (a ref survives React Strict Mode's double effect run in dev).
    if (seenRef.current === null) {
      try { seenRef.current = sessionStorage.getItem("khelzo-intro") === "1"; sessionStorage.setItem("khelzo-intro", "1"); } catch { seenRef.current = false; }
    }
    const seen = seenRef.current;
    if (seen || reduce) { leave(seen ? 0 : 500); return; }
    const fallback = setTimeout(() => leave(0), 5000);
    return () => clearTimeout(fallback);
  }, [reduce, leave]);

  const anim = !reduce;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[300] grid place-items-center overflow-hidden bg-purple"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
          role="status" aria-label="Loading KHELZO"
        >
          <div className="absolute inset-0" aria-hidden="true">
            <motion.div className="absolute left-[10%] top-[18%] w-24 md:w-36" initial={anim ? { y: -300, rotate: -40, opacity: 0 } : false} animate={{ y: 0, rotate: -12, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 10, delay: 0.1 }}><Block color="yellow" className="k-float w-full" /></motion.div>
            <motion.div className="absolute bottom-[16%] right-[12%] w-28 md:w-40" initial={anim ? { y: 300, rotate: 40, opacity: 0 } : false} animate={{ y: 0, rotate: 12, opacity: 1 }} transition={{ type: "spring", stiffness: 120, damping: 10, delay: 0.25 }}><Block color="mint" className="k-float w-full" style={{ ["--fdl" as string]: "1s" }} /></motion.div>
            <Star className="k-twinkle absolute right-[22%] top-[20%] w-12" />
            <Star className="k-twinkle absolute bottom-[26%] left-[20%] w-10" style={{ ["--tdl" as string]: ".6s" }} />
          </div>

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={anim ? { y: -160, rotate: -25, opacity: 0, scale: 0.8 } : false}
              animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 170, damping: 12 }}
              onAnimationComplete={partDone}
            >
              <LogoMark size={96} />
            </motion.div>

            <div className="mt-4 flex font-display text-6xl font-bold sm:text-7xl" aria-hidden="true">
              {LETTERS.map((l, i) => (
                // Each letter drops in like a block being snapped onto the row.
                <motion.span
                  key={l + i}
                  className="inline-block px-0.5"
                  style={{ color: COLORS[i], textShadow: "0 5px 0 rgba(41,36,59,.35)" }}
                  initial={anim ? { y: -90, opacity: 0, scale: 0.6, rotate: i % 2 ? 10 : -10 } : false}
                  animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 320, damping: 15 }}
                  onAnimationComplete={partDone}
                >
                  {l}
                </motion.span>
              ))}
              {anim && <Sparkle className="k-twinkle absolute -right-6 -top-2 w-6" fill="#FFD84D" />}
            </div>

            <motion.p
              initial={anim ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.45 }}
              onAnimationComplete={partDone}
              className="mt-3 text-sm font-extrabold uppercase tracking-[0.25em] text-white/90"
            >
              Play Beyond Imagination
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

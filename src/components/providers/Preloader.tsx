"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LogoMark } from "@/components/art/Logo";
import { Block, Sparkle, Star } from "@/components/art/toys";
import { markIntroDone } from "@/lib/intro";

const LETTERS = ["K", "H", "E", "L", "Z", "O"];
const COLORS = ["#29243B", "#29243B", "#29243B", "#29243B", "#FF8748", "#7657F6"];
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
    if (finished.current >= PARTS) leave(250); // brief hold so the full logo registers
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
          transition={{ duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
          role="status" aria-label="Loading KHELZO"
        >
          <div className="absolute inset-0" aria-hidden="true">
            <motion.div className="absolute left-[10%] top-[18%] w-24 md:w-36" initial={anim ? { y: -300, rotate: -40, opacity: 0 } : false} animate={{ y: 0, rotate: -12, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 16, delay: 0.05 }}><Block color="yellow" className="k-float w-full" /></motion.div>
            <motion.div className="absolute bottom-[16%] right-[12%] w-28 md:w-40" initial={anim ? { y: 300, rotate: 40, opacity: 0 } : false} animate={{ y: 0, rotate: 12, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 16, delay: 0.15 }}><Block color="mint" className="k-float w-full" style={{ ["--fdl" as string]: "1s" }} /></motion.div>
            <Star className="k-twinkle absolute right-[22%] top-[20%] w-12" />
            <Star className="k-twinkle absolute bottom-[26%] left-[20%] w-10" style={{ ["--tdl" as string]: ".6s" }} />
          </div>

          <div className="relative flex flex-col items-center">
            <motion.div
              initial={anim ? { y: -160, rotate: -25, opacity: 0, scale: 0.8 } : false}
              animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onAnimationComplete={partDone}
            >
              <LogoMark size={88} />
            </motion.div>

            {/* The name sits on a cream plate so every letter stays crisp and readable against the purple. */}
            <motion.div
              className="relative mt-5 flex rounded-[28px] border-[3px] border-ink bg-cream px-5 py-2 font-display text-[3.4rem] font-bold leading-none shadow-[0_8px_0_0_var(--color-ink)] sm:px-8 sm:text-7xl"
              initial={anim ? { opacity: 0, scale: 0.92 } : false} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
              aria-hidden="true"
            >
              {LETTERS.map((l, i) => (
                <motion.span
                  key={l + i}
                  className="inline-block px-[1px]"
                  style={{ color: COLORS[i] }}
                  initial={anim ? { y: -28, opacity: 0 } : false}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  onAnimationComplete={partDone}
                >
                  {l}
                </motion.span>
              ))}
              {anim && <Sparkle className="k-twinkle absolute -right-3 -top-3 w-6" fill="#FFD84D" />}
            </motion.div>

            <motion.p
              initial={anim ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.35, ease: "easeOut" }}
              onAnimationComplete={partDone}
              className="mt-5 text-xs font-extrabold uppercase tracking-[0.22em] text-white sm:text-sm"
            >
              Play Beyond Imagination
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

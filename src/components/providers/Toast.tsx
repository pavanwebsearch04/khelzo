"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useStore } from "./StoreProvider";

export function Toast() {
  const { toast, openPanel } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[95] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 40, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 24 }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border-2 border-ink bg-white py-2.5 pl-4 pr-2.5 shadow-[0_5px_0_0_var(--color-ink)]"
          >
            <CheckCircle2 size={22} className="shrink-0 text-mint-deep" />
            <span className="text-sm font-extrabold line-clamp-1">{toast.msg}</span>
            <button onClick={() => openPanel("cart")} className="btn btn-sm btn-purple !min-h-8 shrink-0 !px-3 !text-xs">View cart</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

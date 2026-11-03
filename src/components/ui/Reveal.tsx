"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";

type Kind = "up" | "pop" | "left" | "right" | "mask" | "drop";

const kinds: Record<Kind, Variants> = {
  up: { hidden: { opacity: 0, y: 36 }, show: { opacity: 1, y: 0 } },
  pop: { hidden: { opacity: 0, scale: 0.8, y: 20 }, show: { opacity: 1, scale: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -48 }, show: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0 } },
  drop: { hidden: { opacity: 0, y: -40, rotate: -4 }, show: { opacity: 1, y: 0, rotate: 0 } },
  mask: { hidden: { clipPath: "inset(0 0 100% 0 round 28px)" }, show: { clipPath: "inset(0 0 0% 0 round 28px)" } },
};

export function Reveal({
  children, kind = "up", delay = 0, className, as = "div", duration = 0.7, once = true,
}: {
  children: React.ReactNode; kind?: Kind; delay?: number; className?: string; as?: "div" | "li" | "section" | "span"; duration?: number; once?: boolean;
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  if (reduce) return <M className={className}>{children}</M>;
  return (
    <M
      className={className}
      variants={kinds[kind]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "0px 0px -12% 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
}

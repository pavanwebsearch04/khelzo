import { Star as StarIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i <= Math.round(value) ? "fill-sun text-[#e8a800]" : "fill-ink/10 text-ink/20"}
        />
      ))}
    </span>
  );
}

export function SectionHead({
  eyebrow, title, sub, align = "left", light = false, action,
}: {
  eyebrow: string; title: React.ReactNode; sub?: string; align?: "left" | "center"; light?: boolean;
  action?: { label: string; href: string };
}) {
  return (
    <div className={`flex flex-col gap-4 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
        <span className={`eyebrow ${light ? "text-sun" : "text-purple"}`}>
          <span className="inline-block size-2 rounded-full bg-tangerine" />
          {eyebrow}
        </span>
        <h2 className={`display-section mt-3 ${light ? "text-white" : "text-ink"}`}>{title}</h2>
        {sub && <p className={`mt-3 text-[17px] ${light ? "text-white/80" : "text-ink-soft"}`}>{sub}</p>}
      </div>
      {action && (
        <Link href={action.href} className={`btn ${light ? "btn-sun" : "btn-white"} shrink-0`}>
          {action.label} <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}

/** Scalloped paper-cut divider, drawn in the colour of the NEXT section. */
export function Scallop({ color, flip = false, className = "" }: { color: string; flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true"
      className={`pointer-events-none block h-[34px] w-full md:h-[56px] ${className}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <path
        d="M0 60V30c20 0 20-18 40-18s20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18 20-18 40-18 20 18 40 18V60z"
        fill={color}
      />
    </svg>
  );
}

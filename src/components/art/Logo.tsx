import Link from "next/link";

/** KHELZO symbol: a stud-topped toy block with a star "spark" — imagination snapped into play. */
export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <defs>
        <linearGradient id="lm-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9b83ff" />
          <stop offset="1" stopColor="#7657F6" />
        </linearGradient>
      </defs>
      <rect x="8" y="22" width="48" height="36" rx="11" fill="#5a3dd6" />
      <rect x="8" y="18" width="48" height="36" rx="11" fill="url(#lm-top)" stroke="#29243B" strokeWidth="3" />
      <rect x="17" y="8" width="12" height="12" rx="5" fill="#9b83ff" stroke="#29243B" strokeWidth="3" />
      <rect x="35" y="8" width="12" height="12" rx="5" fill="#9b83ff" stroke="#29243B" strokeWidth="3" />
      <path
        d="M32 25.5l3.1 6.4 7 .9-5.1 4.9 1.3 7-6.3-3.4-6.3 3.4 1.3-7-5.1-4.9 7-.9z"
        fill="#FFD84D" stroke="#29243B" strokeWidth="2.4" strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ light = false, size = 44 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" aria-label="KHELZO home" className="group inline-flex items-center gap-2.5">
      <span className="transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
        <LogoMark size={size} />
      </span>
      <span className="font-display font-bold leading-none tracking-tight" style={{ fontSize: size * 0.68 }}>
        {"KHEL".split("").map((c, i) => (
          <span key={i} className={light ? "text-white" : "text-ink"}>{c}</span>
        ))}
        <span className="text-tangerine">Z</span>
        <span className={light ? "text-sun" : "text-purple"}>O</span>
      </span>
    </Link>
  );
}

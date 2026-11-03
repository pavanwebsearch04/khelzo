/**
 * Original KHELZO toy illustrations — hand-built SVG with soft gradients and
 * highlights for a 3D-inspired look. Each component is a self-contained <svg>
 * sized by its parent (width/height 100%).
 */
import type { CSSProperties } from "react";

interface P { className?: string; style?: CSSProperties }
const svgProps = { "aria-hidden": true as const, focusable: false as const };

export function Rocket({ className, style }: P) {
  return (
    <svg viewBox="0 0 160 320" className={className} style={style} {...svgProps}>
      <defs>
        <linearGradient id="rk-body" x1="0" x2="1">
          <stop offset="0" stopColor="#9b83ff" /><stop offset=".55" stopColor="#7657F6" /><stop offset="1" stopColor="#5a3dd6" />
        </linearGradient>
        <linearGradient id="rk-fire" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD84D" /><stop offset="1" stopColor="#FF8748" />
        </linearGradient>
      </defs>
      <g className="k-twinkle" style={{ ["--td" as string]: "0.5s", transformOrigin: "80px 250px" }}>
        <path d="M80 238c22 12 30 40 0 76-30-36-22-64 0-76z" fill="url(#rk-fire)" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
        <path d="M80 258c9 8 11 22 0 38-11-16-9-30 0-38z" fill="#FFF3B0" />
      </g>
      <path d="M38 176c-20 8-30 30-28 58l38-22z" fill="#FF8748" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M122 176c20 8 30 30 28 58l-38-22z" fill="#FF8748" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M80 10c40 30 52 92 46 188-2 18-6 30-10 38H44c-4-8-8-20-10-38C28 102 40 40 80 10z" fill="url(#rk-body)" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M80 10c14 11 24 26 32 44H48c8-18 18-33 32-44z" fill="#FF8748" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="80" cy="110" r="27" fill="#fff" stroke="#29243B" strokeWidth="4" />
      <circle cx="80" cy="110" r="19" fill="#76C9FF" stroke="#29243B" strokeWidth="3" />
      <path d="M68 103a14 14 0 0 1 12-9" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="40" y="168" width="80" height="14" rx="7" fill="#FFD84D" stroke="#29243B" strokeWidth="3.5" />
      <path d="M52 36c-8 24-12 56-12 92" stroke="#fff" strokeOpacity=".35" strokeWidth="7" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const faceStyles = {
  purple: ["#b5a2ff", "#7657F6", "#5a3dd6"],
  orange: ["#ffb184", "#FF8748", "#e86a27"],
  mint: ["#8ff0df", "#43D6C0", "#19b49e"],
  yellow: ["#ffe98f", "#FFD84D", "#e8b920"],
  sky: ["#b2e1ff", "#76C9FF", "#46a8e8"],
  pink: ["#ff9dbb", "#FF5D8F", "#e03a6e"],
} as const;
export type BlockColor = keyof typeof faceStyles;

/** Isometric stud block. */
export function Block({ color = "purple", letter, className, style }: P & { color?: BlockColor; letter?: string }) {
  const [light, mid, dark] = faceStyles[color];
  return (
    <svg viewBox="0 0 140 150" className={className} style={style} {...svgProps}>
      <path d="M70 34l54 28v54l-54 28-54-28V62z" fill={mid} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M16 62l54 28v54L16 116z" fill={dark} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 90l54-28v54l-54 28z" fill={mid} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 34l54 28-54 28-54-28z" fill={light} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      {[[52, 54], [88, 54], [70, 66], [70, 42]].slice(0, 2).map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 4} rx="12" ry="7" fill={mid} stroke="#29243B" strokeWidth="3" />
          <ellipse cx={x} cy={y} rx="12" ry="7" fill={light} stroke="#29243B" strokeWidth="3" />
        </g>
      ))}
      {letter && (
        <text x="97" y="104" textAnchor="middle" fontSize="38" fontWeight="700" fill="#fff" style={{ fontFamily: "var(--font-fredoka)" }} transform="skewY(-26) translate(0 52)">
          {letter}
        </text>
      )}
      <path d="M24 74l2 34" stroke="#fff" strokeOpacity=".35" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Car({ className, style, color = "#FF8748" }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 260 140" className={className} style={style} {...svgProps}>
      <ellipse cx="130" cy="130" rx="105" ry="7" fill="#29243B" opacity=".18" />
      <path d="M22 98c0-14 6-22 20-26l34-8c10-22 26-34 50-34h30c24 0 40 10 52 32 20 4 34 10 34 28v14c0 6-4 10-10 10H32c-6 0-10-4-10-10z" fill={color} stroke="#29243B" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M96 62c8-16 18-24 34-24h22v36H92z" fill="#cfeeff" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M160 38h14c14 0 24 10 34 36h-48z" fill="#cfeeff" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M104 52c6-8 12-10 22-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M40 90c20-4 40-4 60 0" stroke="#fff" strokeOpacity=".4" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="226" y="86" width="16" height="12" rx="5" fill="#FFD84D" stroke="#29243B" strokeWidth="3" />
      <g>
        <circle cx="76" cy="112" r="22" fill="#29243B" /><circle cx="76" cy="112" r="11" fill="#fff" stroke="#29243B" strokeWidth="3" /><circle cx="76" cy="112" r="4" fill="#7657F6" />
        <circle cx="198" cy="112" r="22" fill="#29243B" /><circle cx="198" cy="112" r="11" fill="#fff" stroke="#29243B" strokeWidth="3" /><circle cx="198" cy="112" r="4" fill="#7657F6" />
      </g>
    </svg>
  );
}

export function Bear({ className, style }: P) {
  return (
    <svg viewBox="0 0 220 260" className={className} style={style} {...svgProps}>
      <defs>
        <radialGradient id="br-fur" cx=".35" cy=".3" r=".9">
          <stop offset="0" stopColor="#f6c389" /><stop offset="1" stopColor="#d89455" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="250" rx="70" ry="8" fill="#29243B" opacity=".15" />
      <ellipse cx="62" cy="228" rx="26" ry="20" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" />
      <ellipse cx="158" cy="228" rx="26" ry="20" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" />
      <ellipse cx="110" cy="182" rx="56" ry="60" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" />
      <ellipse cx="110" cy="190" rx="32" ry="38" fill="#fbe0bc" />
      <ellipse cx="52" cy="168" rx="19" ry="30" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" transform="rotate(24 52 168)" />
      <ellipse cx="168" cy="168" rx="19" ry="30" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" transform="rotate(-24 168 168)" />
      <circle cx="56" cy="42" r="22" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" /><circle cx="56" cy="42" r="11" fill="#f0a98c" />
      <circle cx="164" cy="42" r="22" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" /><circle cx="164" cy="42" r="11" fill="#f0a98c" />
      <ellipse cx="110" cy="84" rx="64" ry="58" fill="url(#br-fur)" stroke="#29243B" strokeWidth="4" />
      <ellipse cx="110" cy="102" rx="26" ry="20" fill="#fbe0bc" stroke="#29243B" strokeWidth="3.5" />
      <ellipse cx="110" cy="94" rx="10" ry="7" fill="#29243B" />
      <path d="M110 101v7m-9 2c5 5 13 5 18 0" stroke="#29243B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="82" cy="76" r="7.5" fill="#29243B" /><circle cx="84.5" cy="73.5" r="2.5" fill="#fff" />
      <circle cx="138" cy="76" r="7.5" fill="#29243B" /><circle cx="140.5" cy="73.5" r="2.5" fill="#fff" />
      <ellipse cx="68" cy="96" rx="9" ry="6" fill="#FF8FA3" opacity=".6" /><ellipse cx="152" cy="96" rx="9" ry="6" fill="#FF8FA3" opacity=".6" />
      <path d="M110 138l-26-14v28zm0 0l26-14v28z" fill="#FF8748" stroke="#29243B" strokeWidth="3.5" strokeLinejoin="round" />
      <circle cx="110" cy="138" r="7" fill="#FFD84D" stroke="#29243B" strokeWidth="3" />
    </svg>
  );
}

export function Balloon({ color = "#FF5D8F", className, style }: P & { color?: string }) {
  return (
    <svg viewBox="0 0 80 170" className={className} style={style} {...svgProps}>
      <path d="M40 118c-2 18 6 26 0 48" stroke="#29243B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M40 4c24 0 38 22 34 44-4 24-22 42-34 62C28 90 10 72 6 48 2 26 16 4 40 4z" fill={color} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M34 108l6 10 6-10z" fill={color} stroke="#29243B" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M22 28c4-8 12-12 18-12" stroke="#fff" strokeOpacity=".7" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Cloud({ className, style, tone = "#fff" }: P & { tone?: string }) {
  return (
    <svg viewBox="0 0 220 110" className={className} style={style} {...svgProps}>
      <path d="M52 100c-26 0-44-12-44-30 0-16 14-28 32-28 4-20 22-34 44-34 18 0 32 10 40 24 6-4 12-6 20-6 20 0 34 14 34 32 0 4 20 10 20 22 0 12-12 20-26 20z" fill={tone} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 62c4-8 12-12 20-12" stroke="#29243B" strokeOpacity=".12" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Star({ className, style, fill = "#FFD84D" }: P & { fill?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} style={style} {...svgProps}>
      <path d="M30 5l7.4 15.6 17 2.2-12.5 11.8 3.2 16.9L30 43l-15.1 8.5 3.2-16.9L5.6 22.8l17-2.2z" fill={fill} stroke="#29243B" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 20l3-6" stroke="#fff" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Sparkle({ className, style, fill = "#fff" }: P & { fill?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} {...svgProps}>
      <path d="M20 0c1.6 11 9 18.4 20 20-11 1.6-18.4 9-20 20-1.6-11-9-18.4-20-20C11 18.4 18.4 11 20 0z" fill={fill} />
    </svg>
  );
}

export function Planet({ className, style }: P) {
  return (
    <svg viewBox="0 0 200 140" className={className} style={style} {...svgProps}>
      <defs>
        <radialGradient id="pl-g" cx=".3" cy=".3" r=".9"><stop offset="0" stopColor="#ffa56b" /><stop offset="1" stopColor="#FF8748" /></radialGradient>
      </defs>
      <circle cx="100" cy="70" r="46" fill="url(#pl-g)" stroke="#29243B" strokeWidth="4" />
      <path d="M62 56c20 8 50 8 76-2M58 82c24 8 58 6 84-6" stroke="#fff" strokeOpacity=".35" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="100" cy="76" rx="92" ry="22" fill="none" stroke="#29243B" strokeWidth="14" transform="rotate(-14 100 76)" strokeLinecap="round" opacity="0" />
      <ellipse cx="100" cy="76" rx="90" ry="20" fill="none" stroke="#29243B" strokeWidth="4" transform="rotate(-14 100 76)" />
      <ellipse cx="100" cy="76" rx="90" ry="20" fill="none" stroke="#FFD84D" strokeWidth="9" transform="rotate(-14 100 76)" strokeDasharray="190 400" strokeDashoffset="-170" />
    </svg>
  );
}

export function GiftBox({ color = "#FF8748", ribbon = "#FFD84D", className, style }: P & { color?: string; ribbon?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} style={style} {...svgProps}>
      <path d="M80 62C62 30 24 36 34 56c6 10 30 8 46 6zm0 0c18-32 56-26 46-6-6 10-30 8-46 6z" fill={ribbon} stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <rect x="18" y="62" width="124" height="34" rx="9" fill={color} stroke="#29243B" strokeWidth="4" />
      <rect x="28" y="96" width="104" height="58" rx="8" fill={color} stroke="#29243B" strokeWidth="4" />
      <path d="M28 96h104v14H28z" fill="#29243B" opacity=".12" />
      <rect x="68" y="62" width="24" height="92" fill={ribbon} stroke="#29243B" strokeWidth="4" />
      <circle cx="80" cy="60" r="10" fill={ribbon} stroke="#29243B" strokeWidth="4" />
      <path d="M32 70h28" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Duck({ className, style }: P) {
  return (
    <svg viewBox="0 0 180 150" className={className} style={style} {...svgProps}>
      <ellipse cx="90" cy="142" rx="60" ry="6" fill="#29243B" opacity=".15" />
      <path d="M20 96c0-34 28-52 56-52 8 0 14 2 20 6 4-22 20-34 40-30 18 4 22 22 8 34 4 8 6 16 6 24 0 26-24 46-64 46-40 0-66-12-66-28z" fill="#FFD84D" stroke="#29243B" strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M126 44c18-6 40 0 44 12-18 8-36 6-44-2z" fill="#FF8748" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="122" cy="34" r="6" fill="#29243B" /><circle cx="124" cy="32" r="2" fill="#fff" />
      <path d="M44 100c16 14 44 14 58-4" stroke="#e8b920" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M36 80c6-14 20-22 34-22" stroke="#fff" strokeOpacity=".6" strokeWidth="6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Slide({ className, style }: P) {
  return (
    <svg viewBox="0 0 220 220" className={className} style={style} {...svgProps}>
      <rect x="22" y="30" width="46" height="14" rx="6" fill="#FFD84D" stroke="#29243B" strokeWidth="4" />
      <path d="M32 44v168M58 44v168" stroke="#29243B" strokeWidth="7" strokeLinecap="round" />
      <path d="M34 54c80 0 110 60 150 152" stroke="#29243B" strokeWidth="34" strokeLinecap="round" fill="none" />
      <path d="M34 54c80 0 110 60 150 152" stroke="#FF5D8F" strokeWidth="24" strokeLinecap="round" fill="none" />
      <path d="M44 48c60 0 90 40 118 108" stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M24 66l-8-34h60l-8 34z" fill="#7657F6" stroke="#29243B" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}

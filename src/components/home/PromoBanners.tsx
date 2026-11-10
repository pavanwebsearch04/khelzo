"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { imgUrl } from "@/lib/api";
import { useHome } from "./HomeData";

/** Banners managed in Admin → Categories, brands & banners. Renders nothing when none are active. */
export function PromoBanners() {
  const { data } = useHome();
  const banners = data?.banners ?? [];
  if (!banners.length) return null;
  const tones = ["bg-sun", "bg-mint", "bg-tangerine text-white", "bg-sky"];
  return (
    <section aria-label="Offers" className="container-k -mt-4 pb-6 pt-8">
      <ul className={`grid gap-4 ${banners.length > 1 ? "md:grid-cols-2" : ""}`}>
        {banners.slice(0, 4).map((b, i) => {
          const body = (
            <div className={`relative flex min-h-[120px] items-center gap-4 overflow-hidden rounded-[28px] border-2 border-ink p-5 shadow-[0_5px_0_0_var(--color-ink)] transition-transform hover:-translate-y-1 ${tones[i % tones.length]}`}>
              {b.image && <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-ink bg-white"><Image src={imgUrl(b.image)} alt="" fill sizes="80px" className="object-cover" /></span>}
              <span className="min-w-0 flex-1"><b className="block font-display text-2xl font-bold leading-tight">{b.title}</b>{b.subtitle && <span className="mt-1 block text-sm font-bold opacity-90">{b.subtitle}</span>}</span>
              {b.link && <ArrowRight size={24} className="shrink-0" aria-hidden="true" />}
            </div>
          );
          return <li key={b.id}>{b.link ? <Link href={b.link}>{body}</Link> : body}</li>;
        })}
      </ul>
    </section>
  );
}

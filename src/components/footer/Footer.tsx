import Link from "next/link";
import { Lock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/art/Logo";
import { Block, Cloud } from "@/components/art/toys";
import { Scallop } from "@/components/ui/bits";
import { NewsletterForm } from "@/components/ui/NewsletterForm";
import { footerLinks, paymentMethods, site, socials } from "@/data/site";

const socialPaths: Record<string, React.ReactNode> = {
  Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>,
  Facebook: <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" />,
  YouTube: <><rect x="2.5" y="6" width="19" height="12" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></>,
  X: <path d="M4 4l16 16M20 4L4 20" />,
};

function Col({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <h3 className="mb-4 font-display text-lg font-bold text-sun">{title}</h3>
      <ul className="space-y-2.5 text-[15px] font-semibold">
        {links.map((l) => (
          <li key={l.label}><Link href={l.href} className="text-white/80 transition-colors hover:text-white hover:underline hover:decoration-tangerine hover:decoration-2 hover:underline-offset-4">{l.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-24 bg-ink text-white">
      <div className="absolute inset-x-0 top-0 -translate-y-[calc(100%-1px)] text-ink"><Scallop color="#29243B" /></div>

      <div className="relative overflow-hidden">
        <Cloud className="k-float absolute -left-10 top-10 hidden w-56 opacity-[0.07] md:block" tone="#fff" />
        <Block color="purple" className="k-float absolute -right-6 top-24 hidden w-40 opacity-30 lg:block" />

        <div className="container-k relative grid gap-12 pb-10 pt-6 lg:grid-cols-[1.25fr_2.75fr]">
          <div>
            <Logo light size={52} />
            <p className="mt-4 font-display text-xl font-bold text-sun">{site.tagline}</p>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
              KHELZO brings exciting toys, creative play and magical little moments to families across India, with child-safe picks and parent-friendly shopping.
            </p>
            <div className="mt-5 flex gap-2.5">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`KHELZO on ${s.label}`} className="grid size-11 place-items-center rounded-full border-2 border-white/25 transition-all hover:-translate-y-1 hover:border-sun hover:bg-sun hover:text-ink">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{socialPaths[s.label]}</svg>
                </a>
              ))}
            </div>
            <ul className="mt-6 space-y-2 text-sm font-semibold text-white/75">
              <li className="flex items-center gap-2.5"><Mail size={16} className="text-mint" /> hello@khelzo.example</li>
              <li className="flex items-center gap-2.5"><Phone size={16} className="text-mint" /> +91 00000 00000 (demo)</li>
              <li className="flex items-center gap-2.5"><MapPin size={16} className="text-mint" /> Shipping across India</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:grid-cols-5">
            <Col title="Shop" links={footerLinks.shop} />
            <Col title="Shop by Category" links={footerLinks.categories} />
            <Col title="Shop by Age" links={footerLinks.ages} />
            <Col title="Customer Service" links={footerLinks.service} />
            <Col title="Information" links={footerLinks.info} />
          </div>
        </div>

        <div className="container-k relative pb-10">
          <div className="grid gap-6 rounded-[32px] border-2 border-white/15 bg-white/[0.06] p-6 md:grid-cols-[1fr_1.1fr] md:items-center md:p-8">
            <div>
              <h3 className="font-display text-2xl font-bold">Join the KHELZO Club</h3>
              <p className="mt-1 text-white/75">New toys, creative ideas and special offers, straight to your inbox.</p>
            </div>
            <NewsletterForm dark id="nl-footer" />
          </div>
        </div>

        <div className="border-t-2 border-white/10">
          <div className="container-k flex flex-col gap-5 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2" aria-label="Supported payment methods">
              <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-bold text-white/70"><Lock size={15} className="text-mint" /> Secure shopping</span>
              {paymentMethods.map((m) => (
                <span key={m} className="rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-xs font-extrabold tracking-wide">{m}</span>
              ))}
            </div>
            <p className="text-sm font-semibold text-white/60">© {new Date().getFullYear()} KHELZO. {site.slogan} Demo storefront. No real orders are processed.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

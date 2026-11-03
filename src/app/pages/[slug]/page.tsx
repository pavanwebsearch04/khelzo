import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pages } from "@/data/pages";
import credits from "@/data/image-credits.json";

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: pages[slug]?.title ?? "Page" };
}

export default async function InfoPage({ params }: PageProps<"/pages/[slug]">) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();
  return (
    <article className="container-k max-w-4xl py-14 md:py-20">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm font-bold text-ink-soft"><Link href="/" className="hover:underline">Home</Link> / {page.title}</nav>
      <h1 className="display-section">{page.title}</h1>
      <p className="mt-4 text-xl text-ink-soft">{page.lead}</p>
      <div className="mt-8 space-y-8">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-2xl font-bold">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{s.p}</p>
          </section>
        ))}
      </div>
      {slug === "photo-credits" && (
        <ul className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          {credits.map((c) => (
            <li key={c.file} className="rounded-2xl border-2 border-ink/15 bg-white p-4">
              <a href={c.page} target="_blank" rel="noopener noreferrer" className="font-extrabold text-purple hover:underline">{c.title}</a>
              <div className="text-ink-soft">{c.artist || "Unknown author"} · {c.license}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-orange">Explore Toys</Link>
        <Link href="/" className="btn btn-white">Back to home</Link>
      </div>
    </article>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { ApiError, api, imgUrl, type ApiProduct } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { Stars } from "@/components/ui/bits";

interface Review { id: number; name: string; rating: number; title: string | null; body: string | null; photos: string[]; date: string; verified: boolean }
interface Reviewable { order_item_id: number; product_id: number; name: string; order_number: string }

export function ReviewsPanel({ product: p, distribution }: { product: ApiProduct; distribution: Record<string, number> }) {
  const { user } = useAuth();
  const [list, setList] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [last, setLast] = useState(1);
  const [eligible, setEligible] = useState<Reviewable[]>([]);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const load = useCallback(async (pg = 1) => {
    const r = await api<{ data: Review[]; meta: { last_page: number } }>(`/products/${p.slug}/reviews?page=${pg}`);
    setList((x) => (pg === 1 ? r.data : [...x, ...r.data])); setPage(pg); setLast(r.meta.last_page);
  }, [p.slug]);

  useEffect(() => { load(1).catch(() => {}); }, [load]);
  useEffect(() => {
    if (!user) { setEligible([]); return; }
    api<{ data: Reviewable[] }>("/account/reviewable").then((r) => setEligible(r.data.filter((x) => x.product_id === p.id))).catch(() => {});
  }, [user, p.id]);

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  const target = eligible[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setMsg({ ok: false, t: "Please choose a star rating." });
    setBusy(true); setMsg(null);
    try {
      const f = new FormData();
      f.set("order_item_id", String(target.order_item_id)); f.set("rating", String(rating));
      if (title) f.set("title", title); if (body) f.set("body", body);
      files.slice(0, 3).forEach((x) => f.append("photos[]", x));
      await api("/reviews", { form: f });
      setMsg({ ok: true, t: "Thanks! Your review is live." });
      setRating(0); setTitle(""); setBody(""); setFiles([]); setEligible((x) => x.slice(1)); await load(1);
    } catch (err) { setMsg({ ok: false, t: err instanceof ApiError ? err.message : "Could not post your review." }); }
    setBusy(false);
  };

  const remove = async (id: number) => { await api(`/reviews/${id}`, { method: "DELETE" }).catch(() => {}); await load(1); };

  return (
    <section id="reviews" className="mt-14 scroll-mt-32" aria-labelledby="rev-h">
      <h2 id="rev-h" className="font-display text-3xl font-bold">Customer reviews</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[28px] border-2 border-ink bg-white p-6">
          <div className="flex items-end gap-3"><span className="font-display text-6xl font-bold leading-none">{p.rating.toFixed(1)}</span><div className="pb-1"><Stars value={p.rating} size={18} /><p className="text-sm font-bold text-ink-soft">{p.reviews.toLocaleString("en-IN")} ratings</p></div></div>
          <ul className="mt-4 space-y-1.5">
            {[5, 4, 3, 2, 1].map((s) => {
              const c = distribution[String(s)] ?? 0;
              return <li key={s} className="flex items-center gap-2 text-sm font-bold"><span className="w-8">{s} ★</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cream-deep"><span className="block h-full rounded-full bg-sun" style={{ width: total ? `${(c / total) * 100}%` : "0%" }} /></span><span className="w-8 text-right text-ink-soft">{c}</span></li>;
            })}
          </ul>
          {total === 0 && <p className="mt-3 text-xs font-semibold text-ink-soft">Ratings shown above are the store&apos;s starting scores. Verified buyers&apos; reviews appear here once posted.</p>}

          <div className="mt-6 border-t-2 border-ink/10 pt-5">
            {!user ? (
              <p className="text-sm font-bold text-ink-soft"><Link href="/account" className="text-purple underline">Log in</Link> to review toys you have bought.</p>
            ) : !target ? (
              <p className="text-sm font-bold text-ink-soft">Only verified buyers can review, after their order is delivered. You can review each purchase once.</p>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <p className="font-extrabold">Review your purchase</p>
                <div role="radiogroup" aria-label="Your rating" className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}><Star size={30} className={n <= rating ? "fill-sun text-[#e8a800]" : "text-ink/25"} /></button>)}
                </div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Headline (optional)" className="h-11 w-full rounded-full border-2 border-ink px-4 text-sm font-bold" />
                <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} placeholder="What did your child think?" className="w-full rounded-2xl border-2 border-ink p-3 text-sm font-semibold" />
                <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} aria-label="Add photos (up to 3)" className="w-full text-sm" />
                <button disabled={busy} className="btn btn-purple w-full">{busy ? "Posting…" : "Post review"}</button>
              </form>
            )}
            {msg && <p role="status" className={`mt-3 text-sm font-bold ${msg.ok ? "text-mint-deep" : "text-berry"}`}>{msg.t}</p>}
          </div>
        </div>

        <div>
          {list.length === 0 ? <p className="rounded-[28px] border-2 border-dashed border-ink/25 p-8 text-center font-bold text-ink-soft">No written reviews yet. Be the first verified buyer to share your thoughts.</p> : (
            <ul className="space-y-4">
              {list.map((r) => (
                <li key={r.id} className="rounded-[24px] border-2 border-ink bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2"><Stars value={r.rating} size={16} />{r.title && <b>{r.title}</b>}</div>
                  {r.body && <p className="mt-2 font-semibold leading-relaxed">{r.body}</p>}
                  {r.photos.length > 0 && <div className="mt-3 flex gap-2">{r.photos.map((ph) => <span key={ph} className="relative size-20 overflow-hidden rounded-xl border-2 border-ink"><Image src={imgUrl(ph)} alt="Customer photo" fill sizes="80px" className="object-cover" /></span>)}</div>}
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold text-ink-soft">{r.name} · {r.date}{r.verified && <span className="inline-flex items-center gap-1 text-mint-deep"><BadgeCheck size={16} /> Verified purchase</span>}
                    {user && user.name === r.name && <button onClick={() => remove(r.id)} className="ml-auto inline-flex items-center gap-1 text-berry" aria-label="Delete my review"><Trash2 size={15} /> Delete</button>}</p>
                </li>
              ))}
            </ul>
          )}
          {page < last && <button onClick={() => load(page + 1)} className="btn btn-white mt-4">Load more reviews</button>}
        </div>
      </div>
    </section>
  );
}

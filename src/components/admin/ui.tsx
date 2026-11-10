"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, api, tokenStore } from "@/lib/api";

export function useAdminData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try { setData(await api<T>(path)); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, reload };
}

/** Authenticated download (CSV exports) — the bearer token can't ride on a plain link. */
export async function downloadFile(path: string, filename: string) {
  const r = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${tokenStore.get() ?? ""}`, Accept: "text/csv" } });
  if (!r.ok) throw new Error("Download failed");
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Opens an HTML document served by the API (e.g. the printable invoice) in a new tab. */
export async function openHtml(path: string) {
  const r = await fetch(API_URL + path, { headers: { Authorization: `Bearer ${tokenStore.get() ?? ""}`, Accept: "text/html" } });
  if (!r.ok) throw new Error("Could not open document");
  window.open(URL.createObjectURL(new Blob([await r.text()], { type: "text/html" })), "_blank");
}

export const fld = "h-11 w-full rounded-xl border-2 border-ink bg-white px-3 text-sm font-bold outline-none";
export const Card = ({ title, children, action }: { title?: string; children: React.ReactNode; action?: React.ReactNode }) => (
  <section className="rounded-[24px] border-2 border-ink bg-white p-5">
    {(title || action) && <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold">{title}</h2>{action}</div>}
    {children}
  </section>
);
export const Loading = ({ error }: { error: string | null }) => <p className={`p-6 font-bold ${error ? "text-berry" : "text-ink-soft"}`}>{error ?? "Loading…"}</p>;
export const Th = ({ children }: { children?: React.ReactNode }) => <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-black uppercase tracking-wider text-ink-soft">{children}</th>;
export const Td = ({ children, className = "" }: { children?: React.ReactNode; className?: string }) => <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
export const Table = ({ children }: { children: React.ReactNode }) => <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm font-semibold"><tbody className="[&>tr]:border-t-2 [&>tr]:border-ink/10">{children}</tbody></table></div>;

export function Pager({ page, last, onPage }: { page: number; last: number; onPage: (p: number) => void }) {
  if (last <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3 text-sm font-extrabold">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="btn btn-sm btn-white disabled:opacity-40">Previous</button>
      <span>Page {page} of {last}</span>
      <button disabled={page >= last} onClick={() => onPage(page + 1)} className="btn btn-sm btn-white disabled:opacity-40">Next</button>
    </div>
  );
}

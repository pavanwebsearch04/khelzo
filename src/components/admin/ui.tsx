"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export function useAdminData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try { setData(await api<T>(path)); setError(null); } catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, reload };
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

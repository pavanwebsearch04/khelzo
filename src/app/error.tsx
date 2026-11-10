"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  const msg = error instanceof globalThis.Error ? error.message : "";
  return (
    <div className="container-k grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <p className="font-display text-7xl font-bold text-purple">Oops!</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Something got tangled in the toy box</h1>
        <p className="mt-3 font-semibold text-ink-soft">{msg && msg.length < 140 ? msg : "We hit an unexpected problem loading this page. Please try again."}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => retry()} className="btn btn-purple"><RefreshCw size={17} /> Try again</button>
          <Link href="/" className="btn btn-white">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

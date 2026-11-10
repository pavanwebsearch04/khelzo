"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { api } from "@/lib/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function NewsletterForm({ dark = false, id = "nl" }: { dark?: boolean; id?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "ok" | "fail">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setState("error");
    try {
      await api("/newsletter", { body: { email: email.trim() } });
      setState("ok");
      setEmail("");
    } catch { setState("fail"); }
  };
  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor={id} className="sr-only">Email address</label>
      <div className={`flex flex-col gap-2 rounded-[28px] border-2 border-ink bg-white p-2 sm:flex-row sm:rounded-full ${state === "error" ? "ring-4 ring-berry/40" : ""}`}>
        <input
          id={id} type="email" value={email} autoComplete="email"
          onChange={(e) => { setEmail(e.target.value); if (state !== "idle") setState("idle"); }}
          placeholder="Enter your email address"
          aria-invalid={state === "error"} aria-describedby={`${id}-msg`}
          className="h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 font-semibold text-ink outline-none placeholder:text-ink/40 focus-visible:!outline-none"
        />
        <button type="submit" className={`btn ${dark ? "btn-orange" : "btn-purple"} !shadow-none`}>Subscribe <Send size={17} /></button>
      </div>
      <p id={`${id}-msg`} role="status" aria-live="polite" className="mt-2 min-h-6 px-3 text-sm font-bold">
        {state === "error" && <span className={dark ? "text-sun" : "text-berry"}>Please enter a valid email address, like parent@example.com.</span>}
        {state === "ok" && <span className="inline-flex items-center gap-1.5 text-mint-deep"><CheckCircle2 size={17} /> Welcome to the KHELZO Club! Check your inbox.</span>}
        {state === "fail" && <span className={dark ? "text-sun" : "text-berry"}>Could not subscribe right now. Please try again in a moment.</span>}
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { consent } from "@/lib/analytics";

const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Cookie banner + analytics loader. Nothing is loaded until the shopper accepts. */
export function Analytics() {
  const [choice, setChoice] = useState<"granted" | "denied" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setChoice(consent.get()); setReady(true); }, []);
  const decide = (v: "granted" | "denied") => { consent.set(v); setChoice(v); };

  // Banner is only worth showing when there is something to consent to.
  const hasTrackers = !!(GA4 || PIXEL);
  return (
    <>
      {choice === "granted" && GA4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />
          <Script id="ga4-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4}');`}</Script>
        </>
      )}
      {choice === "granted" && PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');fbq('track','PageView');`}</Script>
      )}
      {ready && hasTrackers && choice === null && (
        <div role="dialog" aria-label="Cookie preferences" className="fixed inset-x-3 bottom-3 z-[150] mx-auto max-w-3xl rounded-3xl border-2 border-ink bg-white p-4 shadow-[0_8px_0_0_var(--color-ink)] md:bottom-5 md:p-5">
          <p className="text-sm font-semibold leading-relaxed">We use essential storage to run your cart and login. With your OK we also use analytics and ad pixels to improve KHELZO. See our <Link href="/pages/cookies" className="font-extrabold text-purple underline">Cookie Policy</Link>.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => decide("granted")} className="btn btn-sm btn-purple">Accept</button>
            <button onClick={() => decide("denied")} className="btn btn-sm btn-white">Decline</button>
          </div>
        </div>
      )}
    </>
  );
}

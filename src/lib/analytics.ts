/**
 * Thin analytics layer. Events are sent to Google Analytics 4 (NEXT_PUBLIC_GA4_ID) and Meta Pixel (NEXT_PUBLIC_META_PIXEL_ID)
 * only after the shopper accepts analytics cookies (see CookieConsent). Without IDs or consent every call is a no-op.
 */
type Params = Record<string, unknown>;

declare global {
  interface Window { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void; dataLayer?: unknown[] }
}

export const CONSENT_KEY = "khelzo-consent";
export const consent = {
  get: (): "granted" | "denied" | null => { try { const v = localStorage.getItem(CONSENT_KEY); return v === "granted" || v === "denied" ? v : null; } catch { return null; } },
  set: (v: "granted" | "denied") => { try { localStorage.setItem(CONSENT_KEY, v); } catch {} },
};

const META_EVENT: Record<string, string> = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase", view_item: "ViewContent" };

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined" || consent.get() !== "granted") return;
  try {
    window.gtag?.("event", event, params);
    const m = META_EVENT[event];
    if (m) window.fbq?.("track", m, { value: params.value, currency: params.currency ?? "INR", content_ids: params.item_id ? [String(params.item_id)] : undefined });
  } catch {}
}

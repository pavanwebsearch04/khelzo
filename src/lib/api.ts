export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "khelzo-token";
const GUEST_KEY = "khelzo-guest-orders";

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string | null) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch {} },
};

/** Guests get a per-order secret from the API; we keep it so they can view/track that order later. */
export const guestOrders = {
  all: (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "{}"); } catch { return {}; } },
  set: (number: string, token: string) => { try { localStorage.setItem(GUEST_KEY, JSON.stringify({ ...guestOrders.all(), [number]: token })); } catch {} },
  get: (number: string) => guestOrders.all()[number] as string | undefined,
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors: Record<string, string[]> = {}) { super(message); }
}

type Opts = { method?: string; body?: unknown; guestOrder?: string; form?: FormData; signal?: AbortSignal; token?: string | null };

export async function api<T = unknown>(path: string, o: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = o.token === undefined ? tokenStore.get() : o.token;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (o.guestOrder) { const g = guestOrders.get(o.guestOrder); if (g) headers["X-Guest-Token"] = g; }
  let body: BodyInit | undefined;
  if (o.form) body = o.form;
  else if (o.body !== undefined) { headers["Content-Type"] = "application/json"; body = JSON.stringify(o.body); }
  let res: Response;
  try {
    res = await fetch(API_URL + path, { method: o.method ?? (body ? "POST" : "GET"), headers, body, signal: o.signal, cache: "no-store" });
  } catch {
    throw new ApiError(0, "Can't reach the KHELZO server. Please check your connection and try again.");
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const first = data?.errors ? (Object.values(data.errors)[0] as string[])?.[0] : undefined;
    throw new ApiError(res.status, first ?? data?.message ?? "Something went wrong. Please try again.", data?.errors ?? {});
  }
  return data as T;
}

/** Product images are either site assets (/images/...) or uploads served by the API (/storage/...). */
export const imgUrl = (u: string) => (u.startsWith("/storage/") ? API_ORIGIN + u : u);

export interface ApiProduct {
  id: number; slug: string; sku: string; name: string; category: string; category_name: string; brand: string | null; brand_slug: string | null;
  age: string; toy_type: string; price: number; mrp: number; discount: number; rating: number; reviews: number; images: string[];
  badge: string | null; tags: string[]; stock: number; availability: "in_stock" | "low_stock" | "out_of_stock"; desc: string; created_at: string;
  features?: string[]; box_contents?: string[]; material?: string; dimensions?: string; weight?: string; safety?: string; video_url?: string | null; tax_rate?: number;
  attributes?: { name: string; value: string }[];
}

export interface QuoteLine { id: number; name: string; slug: string; image: string | null; qty: number; unit_price: number; mrp: number; line_total: number; stock: number }
export interface Quote {
  lines: QuoteLine[]; issues: { id: number; issue: string; name?: string; available?: number }[]; qty: number; subtotal: number; discount: number;
  coupon: { code: string; description: string; type: string } | null; shipping: number; tax_included: number; total: number; savings: number;
  free_above: number; estimated_delivery: string; method: { id: string; label: string; fee: number; days_min: number; days_max: number };
}

export interface ApiOrder {
  number: string; status: string; payment_status: string; payment_method: string; total: number; subtotal: number; discount: number; shipping: number; tax_included: number;
  coupon_code: string | null; estimated_delivery: string | null; delivery_method: string; created_at: string; items_count: number | null;
  customer?: { name: string; email: string; phone: string; whatsapp: string | null };
  address?: Record<string, string>; instructions?: string | null;
  items: { id?: number; product_id?: number; name: string; sku?: string; image: string | null; unit_price?: number; qty: number; line_total?: number }[];
  timeline?: { status: string; note: string | null; at: string }[];
  shipment?: { carrier: string; tracking_number: string; tracking_url: string | null } | null;
  returns?: { id: number; type: string; status: string; reason: string }[];
  reviewed_item_ids?: number[]; can_cancel?: boolean; can_return?: boolean;
}

export const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Awaiting payment", order_placed: "Order Placed", payment_confirmed: "Payment Confirmed", processing: "Processing", packed: "Packed",
  shipped: "Shipped", out_for_delivery: "Out for Delivery", delivered: "Delivered", cancelled: "Cancelled", payment_failed: "Payment Failed",
  return_requested: "Return Requested", returned: "Returned", refunded: "Refunded",
};

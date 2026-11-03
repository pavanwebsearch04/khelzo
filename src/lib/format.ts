export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

export const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

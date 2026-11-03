import { ageBySlug, categoryBySlug, type Product } from "@/data/catalog";

/** Tiny keyword search: every typed word must match name, category, age or description. */
export function searchProducts(list: Product[], query: string): Product[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return list;
  const scored = list
    .map((p) => {
      const hay = `${p.name} ${categoryBySlug(p.category)?.name ?? ""} ${ageBySlug(p.age)?.range ?? ""} ${p.desc}`.toLowerCase();
      const nameHay = p.name.toLowerCase();
      if (!words.every((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")))) return null;
      const score = words.reduce((n, w) => n + (nameHay.includes(w) ? 3 : 1), 0);
      return { p, score };
    })
    .filter((x): x is { p: Product; score: number } => !!x);
  return scored.sort((a, b) => b.score - a.score).map((x) => x.p);
}

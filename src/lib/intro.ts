import { useSyncExternalStore } from "react";

let done = false;
const subs = new Set<() => void>();

/** Called by the preloader the moment its curtain starts lifting. */
export function markIntroDone() {
  if (done) return;
  done = true;
  subs.forEach((f) => f());
}

/** True once the preloader has finished its logo animation. Lets the hero start its entrance in sync. */
export function useIntroDone() {
  return useSyncExternalStore(
    (f) => { subs.add(f); return () => subs.delete(f); },
    () => done,
    () => false,
  );
}

export default function Loading() {
  return (
    <div className="container-k py-16" role="status" aria-live="polite">
      <div className="mx-auto h-8 w-56 animate-pulse rounded-full bg-cream-deep" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border-2 border-ink/10 bg-white p-3">
            <div className="aspect-square animate-pulse rounded-2xl bg-cream-deep" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-cream-deep" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded-full bg-cream-deep" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

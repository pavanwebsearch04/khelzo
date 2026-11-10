import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-k grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="max-w-md">
        <p className="font-display text-8xl font-bold text-tangerine">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">This toy wandered off</h1>
        <p className="mt-3 font-semibold text-ink-soft">We couldn&apos;t find the page you were looking for. It may have moved, or the toy is no longer available.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/shop" className="btn btn-orange">Explore toys</Link>
          <Link href="/" className="btn btn-white">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

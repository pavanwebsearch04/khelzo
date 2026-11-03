"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, Layers, MessageSquare, Package, RotateCcw, Settings, Tag, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

const nav = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 }, { href: "/admin/orders", label: "Orders", icon: Package }, { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users }, { href: "/admin/coupons", label: "Coupons", icon: Tag }, { href: "/admin/catalogue", label: "Categories & brands", icon: Layers },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare }, { href: "/admin/returns", label: "Returns", icon: RotateCcw }, { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const path = usePathname();
  if (!ready) return <div className="container-k py-24 text-center font-display text-2xl">Loading…</div>;
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return <div className="container-k max-w-md py-20 text-center"><h1 className="font-display text-3xl font-bold">Admin sign-in required</h1><p className="mt-2 text-ink-soft">This area is for KHELZO staff.</p><Link href="/account?next=/admin" className="btn btn-purple mt-5">Log in</Link></div>;
  }
  return (
    <div className="container-k grid gap-6 py-8 lg:grid-cols-[230px_1fr]">
      <nav aria-label="Admin" className="flex gap-2 overflow-x-auto lg:sticky lg:top-[130px] lg:h-fit lg:flex-col">
        {nav.map((n) => {
          const on = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
          return <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-extrabold ${on ? "bg-ink text-white" : "bg-white hover:bg-purple-soft"}`}><n.icon size={16} />{n.label}</Link>;
        })}
      </nav>
      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}

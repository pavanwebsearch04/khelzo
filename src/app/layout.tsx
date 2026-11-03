import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Preloader } from "@/components/providers/Preloader";
import { Toast } from "@/components/providers/Toast";
import { Header } from "@/components/header/Header";
import { Drawers } from "@/components/header/Drawers";
import { QuickView } from "@/components/products/QuickView";
import { Footer } from "@/components/footer/Footer";
import { site } from "@/data/site";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const nunito = Nunito_Sans({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800", "900"], display: "swap" });

export const metadata: Metadata = {
  title: { default: `${site.name} — ${site.tagline} | Toys, Games & Gifts in India`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { title: `${site.name} — ${site.tagline}`, description: site.description, siteName: site.name, locale: "en_IN", type: "website" },
};

export const viewport: Viewport = { themeColor: "#7657F6", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen antialiased">
        <AuthProvider><StoreProvider>
          <Preloader />
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-white">Skip to content</a>
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <Drawers />
          <QuickView />
          <Toast />
        </StoreProvider></AuthProvider>
      </body>
    </html>
  );
}

import { Hero } from "@/components/home/Hero";
import { Categories } from "@/components/home/Categories";
import { ShopByAge } from "@/components/home/ShopByAge";
import { Trending } from "@/components/home/Trending";
import { Playroom } from "@/components/home/Playroom";
import { Learning } from "@/components/home/Learning";
import { Bestsellers } from "@/components/home/Bestsellers";
import { Story } from "@/components/home/Story";
import { AdventureZone } from "@/components/home/AdventureZone";
import { GiftFinder } from "@/components/home/GiftFinder";
import { NewArrivals } from "@/components/home/NewArrivals";
import { Brands, Newsletter, Reviews } from "@/components/home/BrandsReviews";
import { HomeDataProvider, type HomeData } from "@/components/home/HomeData";
import { PromoBanners } from "@/components/home/PromoBanners";
import { API_URL } from "@/lib/api";

async function loadHome(): Promise<HomeData | null> {
  try {
    const res = await fetch(`${API_URL}/home`, { next: { revalidate: 60 }, headers: { Accept: "application/json" } });
    return res.ok ? await res.json() : null;
  } catch {
    return null; // the client retries, so the page still renders if the API is briefly down
  }
}

export default async function Home() {
  const initial = await loadHome();
  return (
    <HomeDataProvider initial={initial}>
      <Hero />
      <PromoBanners />
      <Categories />
      <ShopByAge />
      <Trending />
      <Playroom />
      <Learning />
      <Bestsellers />
      <Story />
      <AdventureZone />
      <GiftFinder />
      <NewArrivals />
      <Brands />
      <Reviews />
      <Newsletter />
    </HomeDataProvider>
  );
}

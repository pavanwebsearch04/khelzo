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

export default function Home() {
  return (
    <>
      <Hero />
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
    </>
  );
}

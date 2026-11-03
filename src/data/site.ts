export const site = {
  name: "KHELZO",
  tagline: "Play Beyond Imagination.",
  slogan: "KHELZO — Play Beyond Imagination.",
  description:
    "KHELZO is India's playful toy store for building blocks, remote control cars, soft toys, STEM kits, board games and gifts that make childhood magical.",
  freeShippingAbove: 999,
  announcements: [
    "Free delivery on orders above ₹999",
    "Gift-wrap any toy for just ₹49",
    "Cash on Delivery available across India",
  ],
};

export interface NavLink { label: string; href: string; hint?: string }

export const mainNav: { label: string; href: string; mega?: "shop" | "categories" | "age" | "learning" | "gifts" }[] = [
  { label: "Home", href: "/" },
  { label: "Shop All Toys", href: "/shop", mega: "shop" },
  { label: "Categories", href: "/shop", mega: "categories" },
  { label: "Shop by Age", href: "/shop", mega: "age" },
  { label: "Learning & Educational", href: "/shop?tag=learning", mega: "learning" },
  { label: "Best Sellers", href: "/shop?tag=bestseller" },
  { label: "New Arrivals", href: "/shop?tag=new" },
  { label: "Gifts & Offers", href: "/shop?tag=gift", mega: "gifts" },
];

export const footerLinks = {
  shop: [
    { label: "Shop All Toys", href: "/shop" },
    { label: "New Arrivals", href: "/shop?tag=new" },
    { label: "Bestsellers", href: "/shop?tag=bestseller" },
    { label: "Offers", href: "/shop?sort=discount" },
    { label: "Gift Finder", href: "/#gift-finder" },
  ],
  categories: [
    { label: "Building Toys", href: "/shop?category=building" },
    { label: "Vehicles", href: "/shop?category=vehicles" },
    { label: "Dolls", href: "/shop?category=dolls" },
    { label: "Soft Toys", href: "/shop?category=soft-toys" },
    { label: "Puzzles", href: "/shop?category=puzzles-games" },
    { label: "Educational Toys", href: "/shop?category=stem" },
    { label: "Outdoor Toys", href: "/shop?category=outdoor" },
  ],
  ages: [
    { label: "0–2 Years", href: "/shop?age=0-2" },
    { label: "3–5 Years", href: "/shop?age=3-5" },
    { label: "6–8 Years", href: "/shop?age=6-8" },
    { label: "9–12 Years", href: "/shop?age=9-12" },
    { label: "13+ Years", href: "/shop?age=13-plus" },
  ],
  service: [
    { label: "Contact Us", href: "/pages/contact" },
    { label: "FAQs", href: "/pages/faqs" },
    { label: "Shipping & Delivery", href: "/pages/shipping" },
    { label: "Returns & Refunds", href: "/pages/returns" },
    { label: "Track Your Order", href: "/track-order" },
  ],
  info: [
    { label: "About Us", href: "/pages/about" },
    { label: "Privacy Policy", href: "/pages/privacy" },
    { label: "Terms & Conditions", href: "/pages/terms" },
    { label: "Cookie Policy", href: "/pages/cookies" },
    { label: "Photo Credits", href: "/pages/photo-credits" },
  ],
};

// Only payment methods listed here are displayed in the footer.
export const paymentMethods = ["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "Cash on Delivery"];

export const socials = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
  { label: "X", href: "https://x.com/" },
];

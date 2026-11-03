export type CategorySlug =
  | "building" | "remote-control" | "vehicles" | "dolls" | "soft-toys" | "puzzles-games"
  | "stem" | "outdoor" | "arts-crafts" | "musical" | "pretend-play" | "baby-toddler";

export type AgeSlug = "0-2" | "3-5" | "6-8" | "9-12" | "13-plus";

export interface Category {
  slug: CategorySlug;
  name: string;
  short: string;
  blurb: string;
  image: string;
  bg: string; // card background
  ink: string; // text colour on card
  accent: string;
}

export const categories: Category[] = [
  { slug: "building", name: "Building Blocks & Construction", short: "Building Blocks", blurb: "Snap, stack and build big ideas.", image: "/images/categories/building.webp", bg: "#7657F6", ink: "#fff", accent: "#FFD84D" },
  { slug: "remote-control", name: "Remote Control Toys", short: "Remote Control", blurb: "Zoom, drift and race with a flick.", image: "/images/categories/remote-control.webp", bg: "#FF8748", ink: "#fff", accent: "#29243B" },
  { slug: "vehicles", name: "Cars, Trains & Vehicles", short: "Cars & Trains", blurb: "Engines on. Tracks ready.", image: "/images/categories/vehicles.webp", bg: "#FFD84D", ink: "#29243B", accent: "#7657F6" },
  { slug: "dolls", name: "Dolls & Dollhouses", short: "Dolls & Dollhouses", blurb: "Tiny homes, big stories.", image: "/images/categories/dolls.webp", bg: "#FF5D8F", ink: "#fff", accent: "#FFD84D" },
  { slug: "soft-toys", name: "Soft Toys & Teddy Bears", short: "Soft Toys", blurb: "Huggable friends for every bedtime.", image: "/images/categories/soft-toys.webp", bg: "#76C9FF", ink: "#29243B", accent: "#fff" },
  { slug: "puzzles-games", name: "Puzzles & Board Games", short: "Puzzles & Games", blurb: "Twist, solve and win together.", image: "/images/categories/puzzles-games.webp", bg: "#43D6C0", ink: "#29243B", accent: "#7657F6" },
  { slug: "stem", name: "Educational & STEM Toys", short: "STEM Toys", blurb: "Curious minds, clever machines.", image: "/images/categories/stem.webp", bg: "#29243B", ink: "#fff", accent: "#43D6C0" },
  { slug: "outdoor", name: "Outdoor & Sports Toys", short: "Outdoor & Sports", blurb: "Fresh air, fast wheels, big smiles.", image: "/images/categories/outdoor.webp", bg: "#FF6B5E", ink: "#fff", accent: "#FFD84D" },
  { slug: "arts-crafts", name: "Arts, Crafts & Creativity", short: "Arts & Crafts", blurb: "Colour outside every line.", image: "/images/categories/arts-crafts.webp", bg: "#B79BFF", ink: "#29243B", accent: "#FFD84D" },
  { slug: "musical", name: "Musical Toys", short: "Musical Toys", blurb: "Little musicians, loud joy.", image: "/images/categories/musical.webp", bg: "#2FB8A4", ink: "#fff", accent: "#FFD84D" },
  { slug: "pretend-play", name: "Pretend Play & Role Play", short: "Pretend Play", blurb: "Be a pilot, a robot, anyone.", image: "/images/categories/pretend-play.webp", bg: "#FFB86B", ink: "#29243B", accent: "#7657F6" },
  { slug: "baby-toddler", name: "Baby & Toddler Toys", short: "Baby & Toddler", blurb: "Safe, soft first discoveries.", image: "/images/categories/baby-toddler.webp", bg: "#9ED8FF", ink: "#29243B", accent: "#FF8748" },
];

export interface AgeGroup {
  slug: AgeSlug;
  range: string;
  title: string;
  blurb: string;
  image: string;
  bg: string;
  ink: string;
  accent: string;
}

export const ages: AgeGroup[] = [
  { slug: "0-2", range: "0–2", title: "Little Explorers", blurb: "Soft, safe and sensory first toys that grow with every giggle.", image: "/images/age-groups/0-2.webp", bg: "#9ED8FF", ink: "#29243B", accent: "#FF8748" },
  { slug: "3-5", range: "3–5", title: "Curious Minds", blurb: "Stacking, sorting and pretend play to feed endless questions.", image: "/images/age-groups/3-5.webp", bg: "#FFD84D", ink: "#29243B", accent: "#7657F6" },
  { slug: "6-8", range: "6–8", title: "Creative Adventurers", blurb: "Builders, racers and board games for brave little inventors.", image: "/images/age-groups/6-8.webp", bg: "#43D6C0", ink: "#29243B", accent: "#7657F6" },
  { slug: "9-12", range: "9–12", title: "Big Thinkers", blurb: "Robotics, strategy and clever kits that spark real skills.", image: "/images/age-groups/9-12.webp", bg: "#7657F6", ink: "#fff", accent: "#FFD84D" },
  { slug: "13-plus", range: "13+", title: "Young Creators", blurb: "Collectables, programmable robots and brain-bending builds.", image: "/images/age-groups/13-plus.webp", bg: "#FF8748", ink: "#fff", accent: "#29243B" },
];

export const categoryBySlug = (s: string) => categories.find((c) => c.slug === s);
export const ageBySlug = (s: string) => ages.find((a) => a.slug === s);

export interface Product {
  id: string;
  name: string;
  category: CategorySlug;
  age: AgeSlug;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  images: string[];
  badge?: "New" | "Bestseller" | "Hot";
  tags: ("trending" | "bestseller" | "new" | "learning" | "gift")[];
  desc: string;
}

const img = (n: string) => `/images/products/${n}.webp`;

export const products: Product[] = [
  { id: "p01", name: "Brick Builder Truck Set", category: "building", age: "3-5", price: 1299, mrp: 1799, rating: 4.7, reviews: 328, images: [img("brick-truck")], badge: "Bestseller", tags: ["trending", "bestseller", "gift"], desc: "Chunky, easy-grip bricks that snap into a rolling truck. Great for first builders." },
  { id: "p02", name: "Build & Roll Tractor Kit", category: "building", age: "6-8", price: 1599, mrp: 1999, rating: 4.6, reviews: 142, images: [img("build-tractor")], tags: ["trending", "new"], desc: "A colourful snap-together tractor with working wheels and a lift-off cab." },
  { id: "p03", name: "Honey Bear Plush", category: "soft-toys", age: "0-2", price: 899, mrp: 1199, rating: 4.9, reviews: 912, images: [img("honey-bear"), img("honey-bear-2")], badge: "Bestseller", tags: ["trending", "bestseller", "gift"], desc: "Ultra-soft golden bear with a sewn-in smile. Surface washable and cuddle tested." },
  { id: "p04", name: "Snowy Ribbon Bear", category: "soft-toys", age: "3-5", price: 749, mrp: 999, rating: 4.8, reviews: 540, images: [img("snowy-bear")], tags: ["trending", "gift"], desc: "A snow-white teddy with a berry-red ribbon, perfect for birthdays and bedtimes." },
  { id: "p05", name: "Mini Cuddle Bear", category: "soft-toys", age: "0-2", price: 499, mrp: 649, rating: 4.7, reviews: 288, images: [img("mini-bear"), img("mini-bear-2")], tags: ["gift", "new"], badge: "New", desc: "Pocket-sized plush companion that fits in every backpack and every hug." },
  { id: "p06", name: "Retro Racer No.1 Ride-On", category: "outdoor", age: "3-5", price: 3499, mrp: 4499, rating: 4.8, reviews: 96, images: [img("racer-one")], badge: "Hot", tags: ["trending", "gift"], desc: "Vintage-style pedal-free racer with a leather-look seat. A garden-race favourite." },
  { id: "p07", name: "Speedster GT Collector Model", category: "vehicles", age: "9-12", price: 2299, mrp: 2799, rating: 4.7, reviews: 77, images: [img("speedster-gt")], tags: ["trending"], desc: "Detailed die-cast style grand tourer in racing red, display-ready." },
  { id: "p08", name: "RC Muscle Cruiser", category: "remote-control", age: "9-12", price: 2599, mrp: 3299, rating: 4.5, reviews: 164, images: [img("rc-cruiser")], badge: "Hot", tags: ["trending", "bestseller"], desc: "Fast, grippy RC car with a bold yellow-and-black finish." },
  { id: "p09", name: "RC Racing GT Blue", category: "remote-control", age: "6-8", price: 1899, mrp: 2399, rating: 4.6, reviews: 231, images: [img("rc-nissan"), img("rc-nissan-2")], tags: ["trending", "bestseller"], desc: "Race-livery RC coupe with a rear wing and responsive steering." },
  { id: "p10", name: "RC Safari Jeep Duo", category: "remote-control", age: "6-8", price: 2199, mrp: 2699, rating: 4.4, reviews: 58, images: [img("rc-safari")], tags: ["new", "gift"], badge: "New", desc: "Two rally-styled blue jeeps ready for mud, grass and living-room obstacle courses." },
  { id: "p11", name: "Steam Loco Mini Train Set", category: "vehicles", age: "6-8", price: 1499, mrp: 1899, rating: 4.7, reviews: 119, images: [img("steam-loco")], tags: ["new", "gift"], badge: "New", desc: "A blue steam engine with a tanker wagon and snap-together track." },
  { id: "p12", name: "Wooden Choo-Choo Train", category: "vehicles", age: "3-5", price: 999, mrp: 1299, rating: 4.9, reviews: 402, images: [img("wood-choo")], badge: "Bestseller", tags: ["bestseller", "trending", "gift"], desc: "A hand-painted pull-along wooden engine with smooth, quiet wheels." },
  { id: "p13", name: "Wooden Train Trio", category: "baby-toddler", age: "0-2", price: 1199, mrp: 1499, rating: 4.8, reviews: 175, images: [img("wood-trio")], tags: ["new", "gift", "learning"], badge: "New", desc: "Three bright engines with chunky wheels sized for little hands." },
  { id: "p14", name: "Retro Tin Robot Wind-Up", category: "pretend-play", age: "6-8", price: 1099, mrp: 1399, rating: 4.6, reviews: 208, images: [img("tin-robot"), img("tin-robot-2")], tags: ["trending", "gift"], desc: "A tin-plate robot with a wind-up walk and charming retro face." },
  { id: "p15", name: "Retro Robot Duo", category: "pretend-play", age: "9-12", price: 2799, mrp: 3499, rating: 4.7, reviews: 63, images: [img("twin-robots")], tags: ["gift"], desc: "A matched pair of glossy blue collector robots." },
  { id: "p16", name: "Gold Piston Robot", category: "pretend-play", age: "13-plus", price: 3299, mrp: 3999, rating: 4.8, reviews: 41, images: [img("gold-robot"), img("gold-robot-2")], badge: "Hot", tags: ["trending", "gift"], desc: "Collector-style golden robot with a lit piston dome." },
  { id: "p17", name: "Speed Cube 3×3", category: "puzzles-games", age: "9-12", price: 399, mrp: 599, rating: 4.8, reviews: 1204, images: [img("speed-cube"), img("speed-cube-2")], badge: "Bestseller", tags: ["bestseller", "trending", "learning"], desc: "A smooth-turning classic cube. Twist, solve, repeat, then try a speed run." },
  { id: "p18", name: "Rocket Racer Friction Car", category: "vehicles", age: "3-5", price: 599, mrp: 799, rating: 4.5, reviews: 187, images: [img("rocket-racer"), img("rocket-racer-2")], tags: ["trending"], desc: "Tin rocket-car with a friction motor and an astronaut pilot." },
  { id: "p19", name: "Green Comet Racer", category: "vehicles", age: "3-5", price: 599, mrp: 799, rating: 4.5, reviews: 131, images: [img("green-racer"), img("green-racer-2")], tags: ["new"], badge: "New", desc: "Bright green-and-red friction racer for fast floor adventures." },
  { id: "p20", name: "Mini Retro Rocket", category: "pretend-play", age: "3-5", price: 349, mrp: 499, rating: 4.7, reviews: 255, images: [img("red-rocket")], tags: ["gift", "bestseller"], badge: "Bestseller", desc: "Checkerboard red-and-white rocket for table-top space missions." },
  { id: "p21", name: "Wooden Vintage Roadster", category: "vehicles", age: "6-8", price: 1299, mrp: 1599, rating: 4.7, reviews: 84, images: [img("wood-roadster")], tags: ["learning", "new"], desc: "A hand-finished wooden roadster with a glossy red hood." },
  { id: "p22", name: "Wooden Brain Ball Puzzle", category: "puzzles-games", age: "13-plus", price: 899, mrp: 1199, rating: 4.6, reviews: 93, images: [img("brain-ball")], tags: ["learning", "trending"], desc: "A satisfying interlocking wooden burr puzzle that challenges every age." },
  { id: "p23", name: "Wise Owl Plush", category: "soft-toys", age: "3-5", price: 649, mrp: 849, rating: 4.7, reviews: 156, images: [img("owl")], tags: ["gift", "learning"], desc: "Textured knit owl with big felt eyes and a red tummy." },
  { id: "p24", name: "Crochet Duckling", category: "soft-toys", age: "0-2", price: 549, mrp: 699, rating: 4.9, reviews: 220, images: [img("duckling")], tags: ["new", "gift"], badge: "New", desc: "A hand-crochet style duckling, soft, round and ready for baby's first hugs." },
  { id: "p25", name: "Rainbow Teether Ring", category: "baby-toddler", age: "0-2", price: 449, mrp: 599, rating: 4.8, reviews: 612, images: [img("teether")], tags: ["new", "bestseller"], desc: "Chunky multicolour teether and rattle ring for sensory play." },
  { id: "p26", name: "Rattle Rocker Set", category: "baby-toddler", age: "0-2", price: 599, mrp: 799, rating: 4.7, reviews: 142, images: [img("rattle-set")], tags: ["gift"], desc: "Three bell-and-ball rattles with easy-grip handles." },
  { id: "p27", name: "Jumbo Wax Crayon Set", category: "arts-crafts", age: "3-5", price: 299, mrp: 399, rating: 4.7, reviews: 489, images: [img("wax-crayons")], badge: "Bestseller", tags: ["learning", "bestseller"], desc: "Chunky, non-toxic wax crayons in rich, blendable colours." },
  { id: "p28", name: "Snakes & Ladders Classic", category: "puzzles-games", age: "6-8", price: 449, mrp: 599, rating: 4.7, reviews: 334, images: [img("snakes-ladders")], tags: ["gift", "learning"], desc: "The timeless climb-and-slide board, a family-night staple." },
  { id: "p29", name: "Dream Dollhouse", category: "dolls", age: "6-8", price: 3999, mrp: 4999, rating: 4.8, reviews: 72, images: [img("dream-house")], badge: "Hot", tags: ["trending", "gift"], desc: "A multi-room dollhouse ready to be furnished and filled with stories." },
  { id: "p30", name: "Hydraulic Robot Arm Kit", category: "stem", age: "9-12", price: 1899, mrp: 2399, rating: 4.8, reviews: 301, images: [img("hydraulic-arm")], badge: "Bestseller", tags: ["learning", "bestseller", "trending"], desc: "Build a working robotic arm powered by water and syringes. No batteries." },
  { id: "p31", name: "Colour Xylophone", category: "musical", age: "3-5", price: 699, mrp: 899, rating: 4.7, reviews: 266, images: [img("xylophone")], tags: ["learning", "gift"], desc: "A colour-coded 8-note xylophone with two wooden mallets." },
];

export const productById = (id: string) => products.find((p) => p.id === id);
export const discount = (p: Product) => Math.round(((p.mrp - p.price) / p.mrp) * 100);

export const byTag = (t: Product["tags"][number]) => products.filter((p) => p.tags.includes(t));

export const gifts = [
  { slug: "birthday", title: "Birthday Gifts", sub: "Wrapped in wow", href: "/shop?tag=gift", color: "#FF8748", ribbon: "#FFD84D" },
  { slug: "u499", title: "Under ₹499", sub: "Small price, big smiles", href: "/shop?max=499", color: "#43D6C0", ribbon: "#7657F6" },
  { slug: "u999", title: "Under ₹999", sub: "Sweet-spot surprises", href: "/shop?max=999", color: "#7657F6", ribbon: "#FFD84D" },
  { slug: "u1999", title: "Under ₹1,999", sub: "Show-stopper picks", href: "/shop?max=1999", color: "#FF5D8F", ribbon: "#FFD84D" },
  { slug: "edu", title: "Educational Gifts", sub: "Smart, fun, parent-approved", href: "/shop?tag=learning", color: "#76C9FF", ribbon: "#FF8748" },
  { slug: "special", title: "Special Occasions", sub: "Festivals, milestones & more", href: "/pages/gift-guide", color: "#FFD84D", ribbon: "#7657F6" },
] as const;

export const learning = [
  { title: "STEM & Science", blurb: "Hands-on kits that turn 'why?' into 'wow!'", image: "/images/banners/learn-stem.webp", href: "/shop?category=stem", bg: "#43D6C0", skills: ["Logic", "Engineering"] },
  { title: "Building & Engineering", blurb: "Plan, stack, test and rebuild better.", image: "/images/banners/learn-build.webp", href: "/shop?category=building", bg: "#FFD84D", skills: ["Spatial skills", "Motor skills"] },
  { title: "Puzzles & Brain Games", blurb: "Patience, memory and problem-solving.", image: "/images/banners/learn-puzzle.webp", href: "/shop?category=puzzles-games", bg: "#B79BFF", skills: ["Focus", "Strategy"] },
  { title: "Creativity & Art", blurb: "Colours, textures and wild imagination.", image: "/images/banners/learn-art.webp", href: "/shop?category=arts-crafts", bg: "#FF8748", skills: ["Expression", "Fine motor"] },
  { title: "Early Learning", blurb: "Numbers, shapes and first words through play.", image: "/images/banners/learn-early.webp", href: "/shop?age=0-2", bg: "#76C9FF", skills: ["Numbers", "Shapes"] },
] as const;

export const brands = [
  "Funskool", "Hasbro", "Mattel", "Fisher-Price", "Hot Wheels", "Playmobil", "Ravensburger", "Melissa & Doug", "Hape", "Crayola",
];

export const reviews = [
  { name: "Aarti S.", city: "Pune", rating: 5, text: "The wooden train arrived beautifully packed and my 4-year-old hasn't put it down. Quality feels solid.", product: "p12" },
  { name: "Rohit M.", city: "Bengaluru", rating: 5, text: "Ordered the hydraulic arm kit for my son's birthday. Two evenings of building together, best gift this year.", product: "p30" },
  { name: "Neha K.", city: "Delhi", rating: 4, text: "The honey bear is incredibly soft. Delivery was quick, and the gift wrapping option was a lovely touch.", product: "p03" },
  { name: "Imran A.", city: "Hyderabad", rating: 5, text: "Speed cube turns smoothly out of the box. My daughter is already down to under three minutes!", product: "p17" },
  { name: "Priya D.", city: "Kolkata", rating: 5, text: "Finally a toy site that lets me shop by age. It saved me so much guesswork for my twins.", product: "p13" },
];

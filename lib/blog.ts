// Blog articles. Add a new post by adding an entry to POSTS (newest first); the blog pages pick it up.

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO date
  readMinutes: number;
  image: string;
  imageAlt: string;
  body: Block[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "tea-101",
    title: "Tea 101: Black, Green, White, Oolong and Herbal Explained",
    excerpt:
      "All true tea comes from one plant. Here's how the same leaf becomes a malty Assam, a delicate green or a floral Darjeeling, and where herbal teas fit in.",
    category: "Tea 101",
    date: "2026-10-20",
    readMinutes: 5,
    image: "/assets/why-teabox-map.webp",
    imageAlt: "Tea pluckers in a green tea garden",
    body: [
      {
        type: "p",
        text: "Black, green, white and oolong teas all come from the same plant: Camellia sinensis. What makes them taste so different is what happens to the leaf after it is plucked, mainly how much it is allowed to oxidise (react with air and darken), the same way a cut apple turns brown.",
      },
      { type: "h2", text: "The main types of tea" },
      {
        type: "table",
        head: ["Type", "How it's made", "Taste"],
        rows: [
          ["Black", "Fully oxidised, then dried", "Bold, malty, brisk; great with milk"],
          ["Green", "Heated soon after plucking to stop oxidation", "Fresh, grassy, vegetal"],
          ["Oolong", "Partly oxidised", "Anywhere from floral to toasty"],
          ["White", "Young leaves and buds, gently withered and dried", "Light, sweet, delicate"],
        ],
      },
      {
        type: "p",
        text: "Herbal teas such as chamomile, tulsi or ginger aren't made from the tea plant at all. They are infusions of herbs, flowers, roots and spices, which is why most of them are naturally caffeine-free.",
      },
      { type: "h2", text: "India's three famous tea regions" },
      {
        type: "ul",
        items: [
          "Assam: tea grown in the hot, humid Brahmaputra valley. Strong, full-bodied and malty, it's the backbone of most Indian chai.",
          "Darjeeling: grown on the steep Himalayan slopes of West Bengal. Light and aromatic; the spring 'first flush' is fresh and floral, the summer 'second flush' has the famous muscatel character.",
          "Nilgiri: from the Blue Mountains of South India, where tea grows almost all year. Bright, brisk and fragrant, and lovely iced.",
        ],
      },
      { type: "h2", text: "Loose leaf or CTC?" },
      {
        type: "p",
        text: "Orthodox or loose-leaf tea keeps the leaf whole or in large pieces and brews a more layered cup. CTC (crush, tear, curl) tea is rolled into small granules that brew fast and strong, which is exactly what you want for kadak chai.",
      },
      {
        type: "tip",
        text: "New to tea? Start with a strong Assam for milk tea, then try a Darjeeling without milk to taste how different the same plant can be.",
      },
    ],
  },
  {
    slug: "how-to-make-masala-chai",
    title: "How to Make Perfect Masala Chai at Home",
    excerpt: "A simple, reliable recipe for two cups of rich, spiced chai, plus the small tricks that make it taste like your favourite chai stall.",
    category: "Recipes",
    date: "2026-10-12",
    readMinutes: 4,
    image: "/assets/pack-indian-chai.webp",
    imageAlt: "A pack of Indian chai tea",
    body: [
      {
        type: "p",
        text: "Good masala chai is all about balance: strong tea, fresh spices and enough milk to make it creamy without hiding the tea. This recipe makes two cups.",
      },
      { type: "h2", text: "Ingredients (2 cups)" },
      {
        type: "ul",
        items: [
          "1 cup water",
          "1 cup full-fat milk",
          "2 heaped teaspoons strong black tea (Assam or CTC works best)",
          "2 teaspoons sugar, or to taste",
          "1 inch fresh ginger, crushed",
          "2 green cardamom pods, lightly crushed",
          "Optional: 1 clove, a small piece of cinnamon, 2 black peppercorns",
        ],
      },
      { type: "h2", text: "Method" },
      {
        type: "ol",
        items: [
          "Bring the water to a boil with the ginger, cardamom and any other spices. Let it bubble for 2–3 minutes so the spices release their flavour.",
          "Add the tea and simmer for 1–2 minutes until the water turns a deep red-brown.",
          "Pour in the milk and sugar. Bring it to a boil, lower the heat as it rises, then let it come up once more.",
          "Strain into cups and serve hot.",
        ],
      },
      { type: "h2", text: "Tips for better chai" },
      {
        type: "ul",
        items: [
          "Crush spices just before using them; whole spices that have sat open for months lose their aroma.",
          "Boiling the milk twice is what gives chai its rich, rounded body.",
          "Like it kadak (strong)? Add an extra half teaspoon of tea rather than boiling it longer, which only makes it bitter.",
          "Try a pinch of dried ginger (saunth) in winter or a few tulsi leaves for a herbal twist.",
        ],
      },
      { type: "tip", text: "Using a ready chai blend? Skip the separate spices and add the blend along with the tea in step 2." },
    ],
  },
  {
    slug: "how-to-brew-tea",
    title: "The Brewing Guide: Water Temperature and Steeping Times",
    excerpt: "Bitter green tea or a flat Darjeeling usually comes down to water that's too hot or a steep that's too long. Here are the numbers that fix it.",
    category: "Brewing",
    date: "2026-10-05",
    readMinutes: 3,
    image: "/assets/hero-banner.webp",
    imageAlt: "Tea being poured into a glass cup",
    body: [
      {
        type: "p",
        text: "Two things decide most of what ends up in your cup: how hot the water is and how long the leaves steep. Delicate teas burn in boiling water, while strong black teas need the heat to open up.",
      },
      { type: "h2", text: "Quick reference (per cup, about 200 ml)" },
      {
        type: "table",
        head: ["Tea", "Amount", "Water", "Steep"],
        rows: [
          ["Black (Assam, Nilgiri)", "1 tsp (2–3 g)", "95–100°C, just boiled", "3–5 min"],
          ["Darjeeling", "1 tsp (2–3 g)", "85–90°C", "3–4 min"],
          ["Green", "1 tsp (2 g)", "70–80°C", "2–3 min"],
          ["Oolong", "1 tsp (3 g)", "85–95°C", "3–5 min"],
          ["White", "2 tsp (2–3 g)", "75–85°C", "4–5 min"],
          ["Herbal", "1–2 tsp", "100°C", "5–7 min"],
        ],
      },
      {
        type: "p",
        text: "No thermometer? Let boiled water rest for about 1 minute for roughly 90°C, and 3–4 minutes for green tea temperatures.",
      },
      { type: "h2", text: "Small things that make a big difference" },
      {
        type: "ul",
        items: [
          "Use fresh, filtered water. Water that has been boiled again and again tastes flat.",
          "Warm the cup or pot first with a splash of hot water.",
          "Remove the leaves when time is up instead of squeezing the tea bag, which pushes out bitterness.",
          "Good loose-leaf tea can often be steeped a second time. Add a minute to the second steep.",
        ],
      },
      { type: "tip", text: "Taste at the shortest time first. You can always steep longer, but you can't take bitterness out." },
    ],
  },
  {
    slug: "how-to-store-tea",
    title: "How to Store Tea So It Stays Fresh",
    excerpt: "Tea doesn't spoil like milk, but it does go flat. Four simple rules keep every cup tasting as fresh as the day you opened the pack.",
    category: "Tea 101",
    date: "2026-09-28",
    readMinutes: 3,
    image: "/assets/pack-ayurvedic.webp",
    imageAlt: "A pack of loose-leaf tea",
    body: [
      {
        type: "p",
        text: "Fresh tea is full of aroma, and aroma fades. Light, heat, moisture and strong smells are what take it away, so good storage is about keeping those four out.",
      },
      { type: "h2", text: "The four rules" },
      {
        type: "ol",
        items: [
          "Airtight: reseal the pack properly or move the tea to an airtight tin or jar.",
          "Dark: use an opaque container and keep it in a cupboard, not on a sunny shelf.",
          "Cool and dry: away from the stove, kettle steam and the sink.",
          "Away from strong smells: tea absorbs odours easily, so don't store it next to spices, coffee or onions.",
        ],
      },
      { type: "h2", text: "Should I keep tea in the fridge?" },
      {
        type: "p",
        text: "Usually no. Every time you take a cold container out, moisture condenses on the leaves. A cool, dark cupboard is better for everyday tea.",
      },
      { type: "h2", text: "How long does tea last?" },
      {
        type: "ul",
        items: [
          "Black tea and chai blends: best within about a year of opening.",
          "Green and white teas: more delicate, so best within 6 months.",
          "Herbal blends: within 6–12 months, depending on the herbs.",
        ],
      },
      { type: "tip", text: "Buy amounts you'll finish in a few months. A smaller, fresher pack beats a big one that slowly goes flat." },
    ],
  },
];

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug) || null;
}

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
}

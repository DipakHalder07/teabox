const fs = require('fs');

const raw = JSON.parse(fs.readFileSync('scratch/extracted_products.json', 'utf8'));

const products = raw.map((p, idx) => {
  // Clean URL amp
  let image = p.image.replace(/&amp;/g, '&');
  let secondaryImage = p.secondaryImage.replace(/&amp;/g, '&');

  // Infer category
  let category = 'chai';
  const titleLower = p.title.toLowerCase();
  if (titleLower.includes('green tea') || titleLower.includes('matcha') || titleLower.includes('kahwa')) {
    category = 'green-tea';
  } else if (titleLower.includes('black') || titleLower.includes('assam black') || titleLower.includes('darjeeling margaret')) {
    category = 'black-tea';
  } else if (titleLower.includes('white') || titleLower.includes('silver needle')) {
    category = 'white-tea';
  } else if (titleLower.includes('chamomile') || titleLower.includes('tisane') || titleLower.includes('blue pea') || titleLower.includes('hibiscus')) {
    category = 'herbal-tea';
  } else if (titleLower.includes('trial pack') || titleLower.includes('sampler')) {
    category = 'trial-packs';
  } else if (titleLower.includes('gift')) {
    category = 'gifts';
  } else if (titleLower.includes('premix')) {
    category = 'premix';
  } else if (titleLower.includes('cup') || titleLower.includes('mug') || titleLower.includes('teaspoon') || titleLower.includes('infuser')) {
    category = 'teaware';
  } else if (titleLower.includes('chai')) {
    category = 'chai';
  }

  // Format
  let format = 'Loose Leaf';
  if (titleLower.includes('teabag')) format = 'Tea Bags';
  else if (titleLower.includes('trial pack')) format = 'Sampler';
  else if (titleLower.includes('premix')) format = 'Premix';
  else if (category === 'teaware') format = 'Accessories';

  // Region
  let region = 'India';
  if (titleLower.includes('assam')) region = 'Assam';
  else if (titleLower.includes('darjeeling')) region = 'Darjeeling';
  else if (titleLower.includes('kashmiri') || titleLower.includes('kahwa')) region = 'Kashmir';
  else if (titleLower.includes('wayanad')) region = 'Kerala';
  else if (titleLower.includes('gujarati')) region = 'Gujarat';
  else if (titleLower.includes('jaipur')) region = 'Rajasthan';
  else if (titleLower.includes('punjabi')) region = 'Punjab';
  else if (titleLower.includes('japanese')) region = 'Japan';

  // Caffeine
  let caffeine = 'Medium';
  if (category === 'herbal-tea' || titleLower.includes('chamomile') || titleLower.includes('tisane') || titleLower.includes('blue pea')) {
    caffeine = 'Caffeine-free';
  } else if (category === 'black-tea' || titleLower.includes('kadak')) {
    caffeine = 'High';
  } else if (category === 'green-tea' || category === 'white-tea') {
    caffeine = 'Low';
  }

  // Discount
  const discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

  // Default weight / options
  const defaultWeight = p.weight || (format === 'Tea Bags' ? '25 Teabags' : format === 'Sampler' ? 'Pack of 10' : '250G');
  const weights = format === 'Tea Bags' 
    ? ['25 Teabags', '50 Teabags'] 
    : format === 'Sampler' 
    ? ['1 Box', '2 Boxes'] 
    : format === 'Accessories' 
    ? ['1 Unit'] 
    : ['100G', '250G', '500G'];

  return {
    id: p.id,
    handle: p.handle,
    title: p.title,
    subtitle: p.subtitle || (format + ' · ' + region),
    price: p.price,
    originalPrice: p.originalPrice,
    discount,
    rating: p.rating || 4.8,
    reviewsCount: p.reviewsCount || 100,
    weight: defaultWeight,
    weights,
    image,
    secondaryImage,
    category,
    format,
    region,
    caffeine,
    badge: p.badge || (discount >= 20 ? `SAVE ${discount}%` : idx === 1 ? 'BESTSELLER' : idx === 0 ? '10 VARIETIES' : ''),
    inStock: true
  };
});

const fileContent = `export interface Product {
  id: string;
  handle: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviewsCount: number;
  weight: string;
  weights: string[];
  image: string;
  secondaryImage: string;
  category: string;
  format: string;
  region: string;
  caffeine: string;
  badge?: string;
  inStock: boolean;
}

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};

export const COLLECTIONS = [
  { id: "all", name: "All Collection", description: "Discover India's freshest loose-leaf teas, authentic artisanal chais, wellness blends, and luxury gift boxes." },
  { id: "chai", name: "Chai Collection", description: "Rich, aromatic, traditional Indian chais blended with fresh garden tea and 100% natural spices." },
  { id: "green-tea", name: "Green Teas", description: "Antioxidant-rich whole-leaf green teas, detox kahwas, and Japanese ceremonial matcha." },
  { id: "black-tea", name: "Black Teas", description: "Bold, full-bodied single-estate Darjeeling and Assam black teas harvested at peak season." },
  { id: "trial-packs", name: "Trial Packs & Samplers", description: "Sample the very best of Teabox before committing to a full pack. Perfect for exploring." },
  { id: "gifts", name: "Gifts & Collections", description: "Thoughtfully curated festive specials and luxury gift sets crafted for tea connoisseurs." },
  { id: "herbal-tea", name: "Herbal & Tisanes", description: "Caffeine-free pure botanical infusions, soothing chamomile, butterfly blue pea, and lemongrass." },
  { id: "white-tea", name: "White Teas", description: "Delicate, hand-picked silver needle white teas known for subtle sweetness and floral notes." },
  { id: "premix", name: "Instant Premix Chais", description: "The world's first gut-friendly prebiotic instant tea mix. Real Assam tea in seconds." },
  { id: "teaware", name: "Accessories & Teaware", description: "Precision strainers, double-walled Valencia glassware, and brewing essentials." }
];
`;

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/products.ts', fileContent, 'utf8');
console.log('Successfully generated data/products.ts with', products.length, 'products!');

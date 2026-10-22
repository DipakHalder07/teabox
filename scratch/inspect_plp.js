const fs = require('fs');

async function main() {
  const res = await fetch('https://in.teabox.com/collections/all', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  const cardMatches = html.match(/<product-card[\s\S]*?<\/product-card>/g) || [];
  console.log('Total product cards found on page:', cardMatches.length);

  const products = [];

  for (const card of cardMatches) {
    const handleMatch = card.match(/handle="([^"]+)"/);
    const handle = handleMatch ? handleMatch[1] : '';

    const titleMatch = card.match(/class="product-card__title"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/) ||
                       card.match(/data-instant>([^<]+)<\/a><\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const pointersMatch = card.match(/class="product-card__pointers[^"]*"[^>]*>([^<]+)<\/p>/);
    const subtitle = pointersMatch ? pointersMatch[1].trim() : '';

    // images
    const imgMatches = [...card.matchAll(/src="([^"]+)"/g)].map(m => m[1]);
    const primaryImg = imgMatches.find(s => s.includes('/cdn/shop/files/')) || '';
    const secondaryImg = imgMatches.filter(s => s.includes('/cdn/shop/files/'))[1] || primaryImg;

    // rating
    const ratingMatch = card.match(/data-average-rating='([^']+)'/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.8;

    const reviewsMatch = card.match(/data-number-of-reviews='([^']+)'/);
    const reviewsCount = reviewsMatch ? parseInt(reviewsMatch[1], 10) : 100;

    // price / add to cart label
    const priceMatch = card.match(/Add\s*([0-9A-Za-z\s]+)\s*—\s*₹([0-9,]+)/) ||
                       card.match(/₹([0-9,]+)/);
    const variantLabel = card.match(/Add\s*([0-9A-Za-z\s]+)\s*—/) ? card.match(/Add\s*([0-9A-Za-z\s]+)\s*—/)[1].trim() : '250G';
    const price = priceMatch ? parseInt(priceMatch[2] ? priceMatch[2].replace(',', '') : priceMatch[1].replace(',', ''), 10) : 499;

    // badges
    const badgeMatch = card.match(/class="badge[^"]*"[^>]*>([^<]+)<\/span>/);
    const badge = badgeMatch ? badgeMatch[1].trim() : '';

    if (title) {
      products.push({
        id: handle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        handle,
        title,
        subtitle,
        price,
        originalPrice: Math.round(price * 1.2),
        rating: Math.round(rating * 10) / 10,
        reviewsCount,
        weight: variantLabel,
        image: primaryImg.startsWith('//') ? 'https:' + primaryImg : primaryImg,
        secondaryImage: secondaryImg.startsWith('//') ? 'https:' + secondaryImg : secondaryImg,
        badge,
        url: `/products/${handle}`
      });
    }
  }

  console.log('Processed products:', products.length);
  fs.writeFileSync('scratch/extracted_products.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Sample product:', products[0]);
  console.log('Sample product 2:', products[1]);
}

main().catch(console.error);




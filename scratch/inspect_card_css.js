const fs = require('fs');

async function main() {
  const res = await fetch('https://in.teabox.com/collections/all', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  // Find all stylesheet URLs
  const urls = [];
  const re = /href="([^"]+\.css[^"]*)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    let u = m[1];
    if (u.startsWith('//')) u = 'https:' + u;
    urls.push(u);
  }
  console.log('Found CSS URLs:', urls);

  for (const url of urls) {
    try {
      const r = await fetch(url);
      const text = await r.text();
      if (text.includes('product-card')) {
        console.log(`\n=== STYLESHEET: ${url} (length: ${text.length}) ===`);
        const rules = text.split('}').filter(rule => rule.includes('product-card') || rule.includes('more-sizes-btn'));
        console.log('Matching rules count:', rules.length);
        console.log(rules.slice(0, 20).join('}\n') + '}');
        fs.writeFileSync('scratch/live_product_card_extracted.css', rules.join('}\n') + '}', 'utf8');
      }
    } catch (e) {
      console.log('Error fetching:', url, e.message);
    }
  }
}

main().catch(console.error);

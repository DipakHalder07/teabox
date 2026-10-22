const fs = require('fs');

async function main() {
  const res = await fetch('https://in.teabox.com/collections/all', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  const cards = html.match(/<product-card[\s\S]*?<\/product-card>/g) || [];
  console.log('Cards found:', cards.length);

  for (let i = 0; i < Math.min(3, cards.length); i++) {
    console.log(`\n=================== CARD ${i+1} ===================`);
    let clean = cards[i].replace(/srcset="[^"]*"/g, 'srcset="..."');
    console.log(clean);
  }
}

main().catch(console.error);

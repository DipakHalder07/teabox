const fs = require('fs');

async function main() {
  const res = await fetch('https://in.teabox.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    }
  });
  const html = await res.text();
  console.log('Total live html length:', html.length);

  // Extract why teabox section
  const whyMatch = html.match(/<section[^>]*av_why_teabox[^>]*>[\s\S]*?<\/section>/);
  if (whyMatch) {
    fs.writeFileSync('scratch/live_why_teabox.html', whyMatch[0], 'utf8');
    console.log('Saved scratch/live_why_teabox.html');
  }

  // Extract promo split section
  const promoMatch = html.match(/<section[^>]*av_promo_split[^>]*>[\s\S]*?<\/section>/);
  if (promoMatch) {
    fs.writeFileSync('scratch/live_promo_split.html', promoMatch[0], 'utf8');
    console.log('Saved scratch/live_promo_split.html');
  }
}

main().catch(console.error);

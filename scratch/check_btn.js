const fs = require('fs');

async function main() {
  const res = await fetch('https://in.teabox.com/collections/all', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  const html = await res.text();

  // find any style tags mentioning button
  const styles = html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
  for (const s of styles) {
    if (s.includes('.product-card') && s.includes('button')) {
      console.log('--- FOUND IN STYLE ---');
      const rules = s.split('}').filter(r => r.includes('button'));
      rules.forEach(r => console.log(r.trim() + '}'));
    }
  }

  // check theme.css for .button {
  const css = fs.readFileSync('scratch/theme_css.css', 'utf8');
  const rules = css.split('}').filter(r => r.includes('.button') && r.includes('background'));
  console.log('--- THEME.CSS BUTTON RULES ---');
  rules.slice(0, 10).forEach(r => console.log(r.trim() + '}'));
}

main().catch(console.error);

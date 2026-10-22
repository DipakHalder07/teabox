const fs = require('fs');
const html = fs.readFileSync('home.html', 'utf8');

const idx = html.indexOf('Curated by master tasters');
console.log('Index:', idx);
if (idx !== -1) {
  let snippet = html.substring(idx - 600, idx + 2500);
  snippet = snippet.replace(/data:[^"'>\s]+/g, '[DATA_URI]');
  console.log(snippet);
}








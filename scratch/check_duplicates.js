const fs = require('fs');

const content = fs.readFileSync('data/products.ts', 'utf8');

// Find all id: "..." or "id": "..."
const idMatches = [...content.matchAll(/["']?id["']?\s*:\s*["']([^"']+)["']/g)].map(m => m[1]);

const counts = {};
const duplicates = [];

for (const id of idMatches) {
  counts[id] = (counts[id] || 0) + 1;
  if (counts[id] === 2) {
    duplicates.push(id);
  }
}

console.log('Total id entries:', idMatches.length);
console.log('Duplicates:', duplicates);

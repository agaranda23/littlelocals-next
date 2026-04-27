const fs = require('fs');
const path = 'app/components/HomeClient.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Verify line 43 is what we expect (1-indexed = lines[42])
if (!lines[42].includes("Planning ahead with the kids")) {
  console.error('❌ Line 43 is not the greeting return — aborting');
  console.error('   Found: ' + lines[42]);
  process.exit(1);
}

// Replace lines 39-43 (the body of getGreeting) — these are 0-indexed 38-42
// Original lines:
//   39:   const h = new Date().getHours()
//   40:   if (h >= 5 && h < 12) return weather?.isRainy ? '🌧️ Rainy morning ...
//   41:   if (h >= 12 && h < 18) return weather?.isRainy ? '🌧️ Rainy afternoon ...
//   42:   return '🌙 Planning ahead with the kids?'
//   43: }

const newBody = [
  "  const h = new Date().getHours()",
  "  const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]",
  "  if (h >= 5 && h < 12) return '\u{1F305} ' + day + ' morning in Ealing'",
  "  if (h >= 12 && h < 17) return '\u2600\uFE0F ' + day + ' afternoon in Ealing'",
  "  if (h >= 17 && h < 21) return '\u{1F306} ' + day + ' evening in Ealing'",
  "  return '\u{1F319} ' + day + ' night in Ealing'"
];

// Splice: replace lines 38..42 (0-indexed) with newBody
lines.splice(38, 5, ...newBody);

fs.writeFileSync(path, lines.join('\n'));
console.log('✅ getGreeting rewritten');

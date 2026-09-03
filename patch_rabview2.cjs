const fs = require('fs');
let content = fs.readFileSync('src/components/rab/RABView.tsx', 'utf8');

content = content.replace(
  /calculation=\{\{\s*subtotal: 0,\s*overheadCost: 0,\s*profitCost: 0,\s*grandTotal: Number\(totalCost\.replace\(\/\[\^0-9\.\-\]\+\/g,""\)\) \|\| 0\s*\} as any\}/,
  'calculation={calc}'
);

fs.writeFileSync('src/components/rab/RABView.tsx', content);
console.log('Patched RABView calc pass');

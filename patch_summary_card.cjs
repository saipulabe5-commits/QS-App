const fs = require('fs');
let content = fs.readFileSync('src/components/rab/RABSummaryCard.tsx', 'utf8');

content = content.replace(/bg-slate-900 text-white rounded-2xl/g, "bg-white text-slate-800 rounded-2xl");
content = content.replace(/border-slate-800/g, "border-slate-200");
content = content.replace(/text-slate-400/g, "text-slate-500");
content = content.replace(/text-slate-300/g, "text-slate-600");
content = content.replace(/bg-slate-900/g, "bg-white");
content = content.replace(/border-slate-700/g, "border-slate-300");

fs.writeFileSync('src/components/rab/RABSummaryCard.tsx', content);
console.log('RABSummaryCard is now Light Mode');

const fs = require('fs');
let content = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

content = content.replace(/bg-slate-900\/80 backdrop-blur-2xl text-slate-100/g, "bg-slate-50 border-r border-slate-200 text-slate-800");
content = content.replace(/border-slate-700\/50/g, "border-slate-200");
content = content.replace(/bg-slate-800/g, "bg-white border-slate-200 shadow-sm");
content = content.replace(/text-slate-300/g, "text-slate-600");
content = content.replace(/text-slate-100/g, "text-slate-900");
content = content.replace(/hover:text-white/g, "hover:text-blue-600");
content = content.replace(/hover:bg-slate-800/g, "hover:bg-blue-50");
content = content.replace(/bg-slate-700/g, "bg-slate-100");
content = content.replace(/border-slate-600/g, "border-slate-300");

fs.writeFileSync('src/components/layout/Sidebar.tsx', content);
console.log('Sidebar is now Light Mode');

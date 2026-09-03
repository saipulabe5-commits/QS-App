const fs = require('fs');
let content = fs.readFileSync('src/components/layout/MacToolbar.tsx', 'utf8');

const regex = /\{\/\* Theme Toggle \*\/\}\s*<button\s*onClick=\{toggleDarkMode\}\s*className="p-1\.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200\/70 dark:hover:bg-slate-700 transition-colors"\s*title="Toggle Dark\/Light Mode"\s*>\s*\{isDarkMode \? <Sun className="w-4 h-4" \/> : <Moon className="w-4 h-4" \/>\}\s*<\/button>/g;

content = content.replace(regex, '');
fs.writeFileSync('src/components/layout/MacToolbar.tsx', content);
console.log("Fixed moon");

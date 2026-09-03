const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Convert light backgrounds to dark backgrounds
  content = content.replace(/bg-white(?!\s+dark:)/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/bg-slate-50(?!\s+dark:)/g, 'bg-slate-50 dark:bg-slate-950');
  content = content.replace(/bg-slate-100(?!\s+dark:)/g, 'bg-slate-100 dark:bg-slate-800');
  content = content.replace(/bg-slate-200(?!\s+dark:)/g, 'bg-slate-200 dark:bg-slate-700');
  
  // Convert light text to dark text
  content = content.replace(/text-slate-900(?!\s+dark:)/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-slate-800(?!\s+dark:)/g, 'text-slate-800 dark:text-slate-200');
  content = content.replace(/text-slate-700(?!\s+dark:)/g, 'text-slate-700 dark:text-slate-300');
  content = content.replace(/text-slate-600(?!\s+dark:)/g, 'text-slate-600 dark:text-slate-400');
  
  // Convert borders
  content = content.replace(/border-slate-200(?!\s+dark:)/g, 'border-slate-200 dark:border-slate-800');
  content = content.replace(/border-slate-300(?!\s+dark:)/g, 'border-slate-300 dark:border-slate-700');
  
  // Avoid doubling up dark classes if they already existed
  content = content.replace(/dark:dark:/g, 'dark:');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated light to dark variants in ${file}`);
  }
});


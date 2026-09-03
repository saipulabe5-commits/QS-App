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

  // We want to safely convert bg-slate-900 to bg-white dark:bg-slate-900
  // And if it's coupled with text-white, change to text-slate-900 dark:text-white
  
  // Replace combinations first
  content = content.replace(/bg-slate-900(\/\d+)?\s+text-white/g, 'bg-white dark:bg-slate-900$1 text-slate-900 dark:text-white');
  content = content.replace(/text-white\s+bg-slate-900(\/\d+)?/g, 'text-slate-900 dark:text-white bg-white dark:bg-slate-900$1');

  content = content.replace(/bg-slate-950(\/\d+)?\s+text-white/g, 'bg-white dark:bg-slate-950$1 text-slate-900 dark:text-white');
  
  // Replace isolated bg-slate-900/950 that wasn't caught
  content = content.replace(/bg-slate-900(?!\w)/g, 'bg-white dark:bg-slate-900');
  content = content.replace(/bg-slate-950(?!\w)/g, 'bg-white dark:bg-slate-950');
  
  // Fix background slate-800
  content = content.replace(/bg-slate-800(\/\d+)?/g, 'bg-slate-50 dark:bg-slate-800$1');
  
  // Fix borders
  content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-700');
  content = content.replace(/border-slate-700/g, 'border-slate-300 dark:border-slate-700');
  
  // Fix text colors that were meant for dark mode
  content = content.replace(/text-slate-300/g, 'text-slate-600 dark:text-slate-300');
  content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400');
  
  // Avoid duplicating dark:dark:
  content = content.replace(/dark:dark:/g, 'dark:');
  content = content.replace(/bg-white dark:bg-white/g, 'bg-white');

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});


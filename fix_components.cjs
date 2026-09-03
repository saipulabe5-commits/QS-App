const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const components = walkSync('./src/components', []);
components.push('./src/App.tsx');
components.push('./src/components/layout/Sidebar.tsx');
components.push('./src/components/layout/CommandBar.tsx');
components.push('./src/components/layout/ProjectSwitcherModal.tsx');

components.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Backgrounds
  content = content.replace(/bg-white dark:bg-slate-9[05]0/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/bg-slate-50 dark:bg-slate-800/g, 'bg-[var(--bg-elevated-hover)]');
  content = content.replace(/bg-slate-100 dark:bg-slate-800/g, 'bg-[var(--bg-elevated-hover)]');
  content = content.replace(/bg-slate-50 dark:bg-slate-900/g, 'bg-[var(--bg-elevated-hover)]');
  
  // Texts
  content = content.replace(/text-slate-900 dark:text-white/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-slate-800 dark:text-slate-200/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-slate-800 dark:text-white/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-slate-700 dark:text-slate-300/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-slate-600 dark:text-slate-400/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-slate-500 dark:text-slate-400/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-slate-400 dark:text-slate-500/g, 'text-[var(--text-tertiary)]');
  
  // Borders
  content = content.replace(/border-slate-200 dark:border-slate-800/g, 'border-[var(--border-primary)]');
  content = content.replace(/border-slate-200 dark:border-slate-700/g, 'border-[var(--border-primary)]');
  content = content.replace(/border-slate-300 dark:border-slate-700/g, 'border-[var(--border-primary)]');
  content = content.replace(/border-slate-100 dark:border-slate-800/g, 'border-[var(--border-subtle)]');

  // Traffic lights replacing generic red/yellow/green
  content = content.replace(/bg-red-500/g, 'bg-[var(--traffic-red)]');
  content = content.replace(/bg-amber-500/g, 'bg-[var(--traffic-yellow)]');
  content = content.replace(/bg-yellow-500/g, 'bg-[var(--traffic-yellow)]');
  content = content.replace(/bg-green-500/g, 'bg-[var(--traffic-green)]');
  
  fs.writeFileSync(file, content);
});

console.log("Components updated with custom CSS variables!");

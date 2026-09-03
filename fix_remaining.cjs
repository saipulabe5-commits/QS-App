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

components.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-[0-9]{2,3} dark:bg-slate-9[05]0\/[0-9]{2}/g, 'bg-[var(--bg-elevated-hover)]');
  content = content.replace(/bg-slate-[0-9]{2,3} dark:bg-slate-9[05]0/g, 'bg-[var(--bg-elevated-hover)]');
  content = content.replace(/dark:bg-slate-9[05]0\/[0-9]{2}/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/dark:bg-slate-9[05]0/g, 'bg-[var(--bg-elevated)]');
  content = content.replace(/hover:bg-slate-[0-9]{2,3} dark:hover:bg-slate-[0-9]{2,3}/g, 'hover:bg-[var(--bg-elevated-hover)]');
  content = content.replace(/dark:hover:bg-slate-[0-9]{2,3}/g, 'hover:bg-[var(--bg-elevated-hover)]');

  fs.writeFileSync(file, content);
});

console.log("Remaining hardcoded classes fixed.");

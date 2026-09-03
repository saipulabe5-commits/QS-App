const fs = require('fs');

function replaceInFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/text-black\/50/g, 'text-slate-500 dark:text-slate-400');
  fs.writeFileSync(file, content);
}

replaceInFile('src/components/projects/ProjectModal.tsx');
replaceInFile('src/components/ai/AIEstimatorModal.tsx');
replaceInFile('src/components/rab/QuickRABBuilderModal.tsx');
replaceInFile('src/components/auth/AuthModal.tsx');
console.log("Patched text-black/50");

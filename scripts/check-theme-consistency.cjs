const fs = require('fs');
const path = require('path');

const checkDir = (dir) => {
  const files = fs.readdirSync(dir);
  let violations = 0;
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      violations += checkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes('className=')) {
          if (line.match(/\btext-black\b/) && !line.match(/\bdark:text-/)) {
            console.error(`Violation: text-black without dark:text- at ${fullPath}:${index + 1}`);
            violations++;
          }
          if (line.match(/\bbg-slate-900\b/) && !line.match(/\bdark:bg-/)) {
             // Exception: sometimes bg-slate-900 is used AS the dark mode background, e.g. "dark:bg-slate-900".
             // We check if bg-slate-900 appears WITHOUT dark: prefix.
             if (line.match(/(?<!dark:)bg-slate-900/) && !line.match(/\bdark:bg-/)) {
                // If it is hardcoded to dark, it should have a light mode fallback or vice versa.
                console.error(`Violation: hardcoded bg-slate-900 without dark pair at ${fullPath}:${index + 1}`);
                violations++;
             }
          }
        }
      });
    }
  });
  return violations;
};

const totalViolations = checkDir(path.join(__dirname, '../src/components'));
if (totalViolations === 0) {
  console.log('SUCCESS: No theme consistency violations found.');
} else {
  console.error(`FAILED: Found ${totalViolations} theme violations.`);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
let hasErrors = false;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Regex to find className attributes
  const classRegex = /className=(?:\{`([^`]+)`\}|"([^"]+)"|'([^']+)')/g;
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    const classStr = match[1] || match[2] || match[3];
    if (!classStr) continue;
    
    // Check for gradients: bg-gradient-to-...
    if (classStr.includes('bg-gradient-to')) {
       // It has a gradient. It MUST have an explicit text color that is NOT a theme variable
       // OR it uses theme variables for BOTH background and text.
       // Since gradients here use explicit colors like from-slate-900 or from-blue-50,
       // it MUST have an explicit text color like text-white or text-blue-950 or text-slate-900.
       // It MUST NOT use text-[var(--text-primary)] without dark:from-xxx etc.
       
       const hasExplicitWhite = classStr.includes('text-white');
       const hasExplicitDark = /text-(slate|gray|zinc|neutral|blue|red|green|yellow)-\d00/.test(classStr);
       const usesThemeText = classStr.includes('text-[var(--text-');
       
       if (usesThemeText && !classStr.includes('dark:from-')) {
          console.error(`\n❌ [ERROR] Gradient Contrast Issue in ${filePath}`);
          console.error(`Found 'bg-gradient-to-*' with theme-dependent text color '${classStr.match(/text-\[var\(--text-[^\]]+\)\]/)[0]}' but no dark mode gradient (e.g., 'dark:from-*').`);
          console.error(`Class: ${classStr}`);
          hasErrors = true;
       }
    }
  }
}

scanDir(srcDir);

if (hasErrors) {
  console.log('\n❌ Theme consistency check failed.');
  process.exit(1);
} else {
  console.log('\n✅ Theme consistency check passed! No contrast issues on gradient backgrounds.');
}

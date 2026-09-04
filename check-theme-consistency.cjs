const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
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
  } catch (err) {
    console.error('Walk error:', err);
  }
  return results;
}

function runThemeConsistencyCheck() {
  const files = walk('src');
  const violations = [];

  // Patterns that might indicate hardcoded un-themed dark colors without light equivalents
  const antiPatterns = [
    {
      regex: /className=["'][^"']*\bbg-slate-950\b(?![^"']*\bbg-(white|slate-50|slate-100))\b[^"']*["']/g,
      description: 'Hardcoded bg-slate-950 without light background variant'
    },
    {
      regex: /className=["'][^"']*\btext-slate-100\b(?![^"']*\btext-slate-(800|900))\b(?![^"']*\bdark:)\b[^"']*["']/g,
      description: 'text-slate-100 without dark prefix or light pair'
    }
  ];

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      antiPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.regex.exec(content)) !== null) {
          // Verify if it's already scoped under dark:
          const matchedStr = match[0];
          if (!matchedStr.includes('dark:bg-slate-950') && !matchedStr.includes('dark:text-slate-100')) {
            violations.push({
              file,
              matched: matchedStr.slice(0, 80),
              issue: pattern.description
            });
          }
        }
      });
    } catch (e) {
      // ignore
    }
  });

  const result = {
    checkedFiles: files.length,
    violationsFound: violations.length,
    violations: violations.slice(0, 10),
    status: violations.length === 0 ? 'CLEAN' : 'HAS_ISSUES'
  };

  return result;
}

if (require.main === module) {
  const res = runThemeConsistencyCheck();
  console.log(JSON.stringify(res, null, 2));
} else {
  module.exports = { runThemeConsistencyCheck };
}

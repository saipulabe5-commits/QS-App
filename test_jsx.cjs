const fs = require('fs');
const code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');
try {
  require('@babel/core').transformSync(code, { presets: ['@babel/preset-react', '@babel/preset-typescript'], filename: 'test.tsx' });
  console.log("Syntax is OK");
} catch (e) {
  console.log(e.message);
}

const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

code = code.replace(
  "{activeDrawing.analysisStatus !== 'completed' && (",
  "{activeDrawing.analysisStatus !== 'completed' && (<>"
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code);
console.log("Fixed JSX 2");

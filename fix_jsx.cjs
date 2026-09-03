const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

// I will wrap the entire block in a fragment
code = code.replace(
  "{activeDrawing.analysisStatus !== 'completed' && (\n                <div className=\"mt-4 flex items-center justify-between",
  "{activeDrawing.analysisStatus !== 'completed' && (\n                <>\n                <div className=\"mt-4 flex items-center justify-between"
);

// and close the fragment at the end
code = code.replace(
  "                </div>\n                </div>\n              )}",
  "                </div>\n                </>\n              )}"
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code);
console.log("Fixed JSX");

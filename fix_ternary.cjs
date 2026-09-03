const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

code = code.replace(
  ") : (\n                <div className=\"p-12 text-center space-y-4\">",
  ") : (\n                <>\n                <div className=\"p-12 text-center space-y-4\">"
);

// We should also remove the previous `<>` that I inserted wrongly at `{activeDrawing.analysisStatus !== 'completed' && (<>` if it exists.
code = code.replace("{activeDrawing.analysisStatus !== 'completed' && (<>", "{activeDrawing.analysisStatus !== 'completed' && (");

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code);
console.log("Fixed ternary");

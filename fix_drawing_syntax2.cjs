const fs = require('fs');
let content = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

content = content.replace(
  "{activeDrawing && activeDrawing.analysisStatus !== 'processing' && (",
  "{activeDrawing && activeDrawing.analysisStatus !== 'processing' && (\n            <div className=\"flex items-center space-x-2\">"
);

content = content.replace(
  "              <span>{isAnalyzing[activeDrawing.id] ? 'Menganalisis Gambar...' : 'Analisis Ulang dengan AI'}</span>\n            </button>\n          )}",
  "              <span>{isAnalyzing[activeDrawing.id] ? 'Menganalisis Gambar...' : 'Analisis Ulang dengan AI'}</span>\n            </button>\n            </div>\n          )}"
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', content);
console.log('Fixed syntax error');

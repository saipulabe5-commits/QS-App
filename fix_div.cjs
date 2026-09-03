const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

code = code.replace(
  "<span>🟢 AI Verifikasi Ganda: aktif</span>\n                  </span>",
  "<span>🟢 AI Verifikasi Ganda: aktif</span>\n                  </span>\n                </div>"
);
fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code);
console.log("Fixed div");

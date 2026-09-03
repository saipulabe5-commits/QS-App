const fs = require('fs');
let code = fs.readFileSync('src/components/ai/FinancialReviewModal.tsx', 'utf8');

if (!code.includes('AI Activity Log')) {
  code = code.replace(
    "                <Sparkles className=\"w-4 h-4\" />\n                <span>Jalankan Analisis AI</span>",
    "                <Sparkles className=\"w-4 h-4\" />\n                <span>Jalankan Analisis AI</span>\n              </button>\n            </div>\n            <div className=\"mt-2 text-center\">\n              <span className=\"inline-flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded\">\n                <span className=\"w-1.5 h-1.5 rounded-full bg-green-500\"></span>\n                <span>🟢 AI Financial Review: aktif</span>\n              </span>\n            </div>"
  );
  fs.writeFileSync('src/components/ai/FinancialReviewModal.tsx', code);
}

let code2 = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');
if (!code2.includes('AI Verifikasi Ganda')) {
  code2 = code2.replace(
    "                    <span>Mulai Analisis AI Sekarang</span>\n                  </button>",
    "                    <span>Mulai Analisis AI Sekarang</span>\n                  </button>\n                </div>\n                <div className=\"mt-3 flex justify-end\">\n                   <span className=\"inline-flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded\">\n                    <span className=\"w-1.5 h-1.5 rounded-full bg-green-500\"></span>\n                    <span>🟢 AI Verifikasi Ganda: aktif</span>\n                  </span>"
  );
  fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code2);
}

console.log("Badges added");

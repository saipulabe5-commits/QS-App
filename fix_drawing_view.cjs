const fs = require('fs');
let content = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

// Strip out the incorrectly injected checkboxes
const regexToRemove = /<div className="mt-4 flex items-center justify-center space-x-2">[\s\S]*?<label htmlFor="forceTwoPass2" className="text-xs text-slate-600 cursor-pointer">\s*QC 2-Pass\s*<\/label>\s*<\/div>/;
content = content.replace(regexToRemove, "");

// Add the checkbox to the correct locations.
// Location 1: Beside the "Analisis Ulang AI" button on line ~424
content = content.replace(
  /<button\s*onClick=\{\(\) => handleRunAIAnalysis\(activeDrawing\.id\)\}\s*disabled=\{isAnalyzing\[activeDrawing\.id\]\}/g,
  `
                  <div className="flex items-center space-x-2 mr-2">
                    <input
                      type="checkbox"
                      id="forceTwoPass2"
                      checked={forceTwoPass}
                      onChange={(e) => setForceTwoPass(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="forceTwoPass2" className="text-xs text-slate-600 cursor-pointer">
                      QC 2-Pass
                    </label>
                  </div>
                  <button
                    onClick={() => handleRunAIAnalysis(activeDrawing.id)}
                    disabled={isAnalyzing[activeDrawing.id]}`
);

// Location 2: Below the empty state "Mulai Analisis AI Sekarang"
content = content.replace(
  /<button\s*onClick=\{\(\) => handleRunAIAnalysis\(activeDrawing\.id\)\}\s*className="px-6 py-2.5 bg-indigo-600/g,
  `
                  <div className="mt-4 mb-4 flex items-center justify-center space-x-2">
                    <input
                      type="checkbox"
                      id="forceTwoPass"
                      checked={forceTwoPass}
                      onChange={(e) => setForceTwoPass(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="forceTwoPass" className="text-xs text-slate-600 cursor-pointer">
                      Re-analisa dengan verifikasi ganda (QC 2-Pass)
                    </label>
                  </div>
                  <button
                    onClick={() => handleRunAIAnalysis(activeDrawing.id)}
                    className="px-6 py-2.5 bg-indigo-600`
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', content);
console.log('Fixed DrawingAnalysisView');

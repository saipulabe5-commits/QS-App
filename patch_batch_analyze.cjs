const fs = require('fs');
let code = fs.readFileSync('src/components/drawings/DrawingAnalysisView.tsx', 'utf8');

// Add state for batch analysis
code = code.replace(
  "const [isAnalyzing, setIsAnalyzing] = useState",
  "const [batchAnalysisState, setBatchAnalysisState] = useState<{isBatching: boolean, total: number, current: number, currentId: string, success: number, failed: string[]}>({isBatching: false, total: 0, current: 0, currentId: '', success: 0, failed: []});\n  const [isAnalyzing, setIsAnalyzing] = useState"
);

// Add handleBatchAnalyze function
const batchFunc = `
  const handleBatchAnalyze = async () => {
    const unanalyzed = drawings.filter(d => d.projectId === selectedProject?.id && d.analysisStatus !== 'completed');
    if (unanalyzed.length === 0) {
      showToast('Info', 'Semua gambar sudah dianalisis.', 'info');
      return;
    }
    
    setBatchAnalysisState({
      isBatching: true,
      total: unanalyzed.length,
      current: 1,
      currentId: unanalyzed[0].id,
      success: 0,
      failed: []
    });
    
    let successCount = 0;
    const failedList: string[] = [];
    
    for (let i = 0; i < unanalyzed.length; i++) {
      const drawing = unanalyzed[i];
      setBatchAnalysisState(prev => ({ ...prev, current: i + 1, currentId: drawing.id }));
      setSelectedDrawingId(drawing.id);
      
      try {
        setIsAnalyzing(prev => ({ ...prev, [drawing.id]: true }));
        await analyzeDrawingWithAI(drawing.id, forceTwoPass);
        successCount++;
      } catch (err: any) {
        console.error(err);
        failedList.push(drawing.fileName || drawing.id);
      } finally {
        setIsAnalyzing(prev => ({ ...prev, [drawing.id]: false }));
      }
    }
    
    setBatchAnalysisState(prev => ({
      ...prev,
      isBatching: false,
      success: successCount,
      failed: failedList
    }));
    
    if (failedList.length === 0) {
      showToast('Batch Selesai', \`\${successCount} dari \${unanalyzed.length} lembar berhasil dianalisa. 0 lembar dilewati.\`, 'success');
    } else {
      showToast('Batch Selesai dengan Error', \`\${successCount} berhasil. \${failedList.length} gagal (\${failedList.join(', ')}).\`, 'warning');
    }
  };
`;

code = code.replace(
  "const handleRunAIAnalysis = async (drawingId: string) => {",
  batchFunc + "\n  const handleRunAIAnalysis = async (drawingId: string) => {"
);

// Inject batch progress UI
const batchUI = `
            {batchAnalysisState.isBatching && (
              <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 inline-block mr-2 animate-pulse" />
                    Menganalisa lembar {batchAnalysisState.current} dari {batchAnalysisState.total}...
                  </span>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                    {Math.round((batchAnalysisState.current / batchAnalysisState.total) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-indigo-100 dark:bg-indigo-950 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: \`\${(batchAnalysisState.current / batchAnalysisState.total) * 100}%\` }}></div>
                </div>
              </div>
            )}
            
            {!batchAnalysisState.isBatching && batchAnalysisState.total > 0 && batchAnalysisState.current === batchAnalysisState.total && (
              <div className={\`mb-4 border rounded-xl p-4 \${batchAnalysisState.failed.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}\`}>
                <p className={\`text-sm font-bold \${batchAnalysisState.failed.length > 0 ? 'text-amber-800 dark:text-amber-400' : 'text-green-800 dark:text-green-400'}\`}>
                  {batchAnalysisState.success} dari {batchAnalysisState.total} lembar berhasil dianalisa. 0 lembar dilewati.
                </p>
                {batchAnalysisState.failed.length > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Gagal diproses: {batchAnalysisState.failed.join(', ')}
                  </p>
                )}
              </div>
            )}
`;

code = code.replace(
  "{/* Main Grid: Left Thumbnails/List, Right Detailed Analysis */}",
  batchUI + "\n      {/* Main Grid: Left Thumbnails/List, Right Detailed Analysis */}"
);

// Add Batch button in header
code = code.replace(
  "className=\"px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm\"",
  "className=\"px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm\"\n            >\n              <Upload className=\"w-3.5 h-3.5\" />\n              <span>Unggah Gambar Baru</span>\n            </button>\n            <button\n              onClick={handleBatchAnalyze}\n              disabled={batchAnalysisState.isBatching}\n              className=\"px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm\""
);

fs.writeFileSync('src/components/drawings/DrawingAnalysisView.tsx', code);
console.log("Patched batch analysis in DrawingAnalysisView");

const fs = require('fs');
let code = fs.readFileSync('src/components/diagnostics/DiagnosticsModal.tsx', 'utf8');

// Import AILogger and Bot icon
code = code.replace("import { useApp }", "import { Bot } from 'lucide-react';\nimport { AILogger, AILogEntry } from '../../utils/AILogger';\nimport { useApp }");

// Add ai state
code = code.replace("const [activeTab, setActiveTab] = useState<'boot' | 'storage' | 'financial' | 'system'>('boot');",
  "const [activeTab, setActiveTab] = useState<'boot' | 'storage' | 'financial' | 'system' | 'ai'>('boot');\n  const [aiLogs, setAiLogs] = useState<AILogEntry[]>([]);\n  React.useEffect(() => {\n    setAiLogs(AILogger.getLogs());\n    const handleLog = () => setAiLogs(AILogger.getLogs());\n    window.addEventListener('ai-log-updated', handleLog);\n    return () => window.removeEventListener('ai-log-updated', handleLog);\n  }, []);");

// Add AI tab button
code = code.replace("{/* Financial Checks Tab */}", 
  `{/* AI Logs Tab */}\n              <button\n                onClick={() => setActiveTab('ai')}\n                className={\`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-colors \${activeTab === 'ai' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}\`}\n              >\n                <Bot className=\"w-4 h-4\" />\n                <span>AI Activity Log</span>\n              </button>\n\n              {/* Financial Checks Tab */}`);

// Add AI Logs content
code = code.replace("{activeTab === 'boot' && (", 
  `{activeTab === 'ai' && (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    <span>AI Activity Log</span>
                  </h3>
                  <button onClick={() => AILogger.clear()} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Clear Logs</button>
                </div>
                
                <div className="space-y-2">
                  {aiLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Belum ada aktivitas AI terekam di sesi ini.
                    </div>
                  ) : (
                    aiLogs.map(log => (
                      <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${log.status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : log.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}\`}>
                              {log.status.toUpperCase()}
                            </span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{log.agentName}</span>
                            <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()} ({log.durationMs}ms)</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">ID: {log.targetId.slice(0,8)}...</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono mb-2">{log.message}</p>
                        {log.details && (
                          <pre className="text-[10px] p-2 bg-white dark:bg-black/50 text-slate-600 dark:text-slate-400 rounded overflow-x-auto border border-slate-100 dark:border-slate-800">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'boot' && (`);
            
fs.writeFileSync('src/components/diagnostics/DiagnosticsModal.tsx', code);
console.log("Patched DiagnosticsModal");

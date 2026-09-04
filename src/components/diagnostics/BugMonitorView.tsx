import React, { useState, useEffect, useMemo } from 'react';
import { bugTracker, BugLogEntry } from '../../utils/bugTracker';
import { ShieldAlert, Download, Trash2, Filter, Info, AlertTriangle, Bug, XCircle, Search } from 'lucide-react';


interface BugMonitorViewProps {
  onClose?: () => void;
}

export const BugMonitorView: React.FC<BugMonitorViewProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<BugLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch Client Logs
      const clientLogs = await bugTracker.getLogs();
      
      // Fetch Server Logs
      let serverLogs: BugLogEntry[] = [];
      try {
        const response = await fetch('/api/bugs');
        const data = await response.json();
        if (data.success) {
          serverLogs = data.serverBugs || [];
        }
      } catch (err) {
        console.error('Failed to fetch server bugs', err);
      }
      
      const combined = [...clientLogs, ...serverLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh every 5 seconds if modal is open
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearLogs = async () => {
    if (!window.confirm('Yakin ingin menghapus semua catatan bug?')) return;
    try {
      await bugTracker.clearLogs();
      await fetch('/api/bugs/clear', { method: 'POST' });
      await fetchLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportJSON = () => {
    const summary = {
      error: logs.filter(l => l.severity === 'error').length,
      warning: logs.filter(l => l.severity === 'warning').length,
      info: logs.filter(l => l.severity === 'info').length,
    };
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      appVersion: 'RAB PRO V19',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'preview',
      totalEntries: logs.length,
      summary,
      entries: logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rab-pro-bug-log-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return log.message.toLowerCase().includes(query) || 
               log.category.toLowerCase().includes(query) ||
               (log.source && log.source.toLowerCase().includes(query));
      }
      return true;
    });
  }, [logs, filterSeverity, searchQuery]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'warning': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-500" />
            Bug & Error Monitor
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time observability system. Terintegrasi penuh mencatat exception sisi client maupun server.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            <Download className="w-4 h-4" /> Export JSON
          </button>
          <button 
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
          >
            <Trash2 className="w-4 h-4" /> Bersihkan Log
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pesan error, kategori..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {['all', 'error', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterSeverity === sev 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-900">
        {loading && logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">Log bersih, tidak ada bug yang tertangkap.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${getSeverityColor(log.severity)} border`}>
                      {getSeverityIcon(log.severity)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.message}</h3>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{log.source.toUpperCase()}</span>
                        <span>•</span>
                        <span className="capitalize">{log.category.replace(/-/g, ' ')}</span>
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  {log.requestUrl && (
                    <div className="text-right flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-[10px] font-mono">
                        <span className={log.responseStatus && log.responseStatus >= 500 ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                          {log.responseStatus || 'ERR'}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{log.requestMethod}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {(log.route || log.requestUrl) && (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5 text-[11px] font-mono text-slate-600 dark:text-slate-400 overflow-x-auto border border-slate-100 dark:border-slate-800">
                    <div className="flex gap-4">
                      {log.route && <div><span className="text-slate-400 dark:text-slate-500 select-none">ROUTE: </span>{log.route}</div>}
                      {log.requestUrl && <div><span className="text-slate-400 dark:text-slate-500 select-none">URL: </span>{log.requestUrl}</div>}
                    </div>
                  </div>
                )}
                
                {log.stack && (
                  <details className="text-xs group">
                    <summary className="font-semibold text-slate-600 dark:text-slate-400 cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 inline-flex items-center gap-1">
                      Lihat Stack Trace
                    </summary>
                    <pre className="mt-2 p-3 bg-slate-950 text-slate-300 rounded-lg overflow-x-auto text-[10px] leading-relaxed border border-slate-800">
                      {log.stack}
                      {log.componentStack && `\n\nComponent Stack:\n${log.componentStack}`}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { bugTracker, BugLogEntry, BugStatus } from '../../utils/bugTracker';
import { appAuditService, AppAuditReport } from '../../services/appAuditService';
import { 
  ShieldAlert, 
  Download, 
  Trash2, 
  Info, 
  AlertTriangle, 
  Bug, 
  XCircle, 
  Search, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Check, 
  Activity, 
  X,
  FileCheck,
  RefreshCw,
  Clock,
  Layers
} from 'lucide-react';

interface BugMonitorViewProps {
  onClose?: () => void;
}

export const BugMonitorView: React.FC<BugMonitorViewProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<BugLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Resolve Modal State
  const [resolvingBug, setResolvingBug] = useState<BugLogEntry | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Audit State
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [auditReport, setAuditReport] = useState<AppAuditReport | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

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
      
      const combined = [...clientLogs, ...serverLogs].sort(
        (a, b) => new Date(b.lastSeenAt || b.timestamp).getTime() - new Date(a.lastSeenAt || a.timestamp).getTime()
      );
      setLogs(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeBugs = useMemo(() => {
    return logs.filter(l => l.status !== 'resolved' && l.status !== 'wont-fix');
  }, [logs]);

  const resolvedBugs = useMemo(() => {
    return logs.filter(l => l.status === 'resolved' || l.status === 'wont-fix');
  }, [logs]);

  const displayedLogs = useMemo(() => {
    const list = activeTab === 'active' ? activeBugs : resolvedBugs;
    return list.filter(log => {
      if (filterSeverity !== 'all' && log.severity !== filterSeverity) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) || 
          log.category.toLowerCase().includes(query) ||
          (log.fingerprint && log.fingerprint.toLowerCase().includes(query)) ||
          (log.source && log.source.toLowerCase().includes(query)) ||
          (log.resolutionNote && log.resolutionNote.toLowerCase().includes(query))
        );
      }
      return true;
    });
  }, [activeTab, activeBugs, resolvedBugs, filterSeverity, searchQuery]);

  const handleOpenResolveModal = (log: BugLogEntry) => {
    setResolvingBug(log);
    setResolutionNote(`Diverifikasi selesai pada ${new Date().toLocaleDateString('id-ID')}. Perbaikan telah diterapkan.`);
  };

  const handleConfirmResolve = async () => {
    if (!resolvingBug) return;
    setIsResolving(true);
    try {
      const note = resolutionNote.trim() || 'Tandai selesai oleh auditor';
      if (resolvingBug.source === 'client') {
        await bugTracker.resolveBug(resolvingBug.id, note);
      } else {
        await fetch('/api/bugs/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: resolvingBug.id,
            fingerprint: resolvingBug.fingerprint,
            resolutionNote: note,
          }),
        });
      }
      await fetchLogs();
      setResolvingBug(null);
    } catch (e) {
      console.error('Failed to resolve bug:', e);
    } finally {
      setIsResolving(false);
    }
  };

  const handleReopenBug = async (log: BugLogEntry) => {
    try {
      if (log.source === 'client') {
        await bugTracker.reopenBug(log.id);
      } else {
        await fetch('/api/bugs/reopen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: log.id,
            fingerprint: log.fingerprint,
          }),
        });
      }
      await fetchLogs();
    } catch (e) {
      console.error('Failed to reopen bug:', e);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Yakin ingin menghapus semua catatan bug (aktif dan selesai)?')) return;
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
      totalEntries: logs.length,
      activeBugs: activeBugs.length,
      resolvedBugs: resolvedBugs.length,
      error: logs.filter(l => l.severity === 'error').length,
      warning: logs.filter(l => l.severity === 'warning').length,
      info: logs.filter(l => l.severity === 'info').length,
    };
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      appVersion: 'RAB PRO V20',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'preview',
      totalEntries: logs.length,
      summary,
      activeBugs,
      resolvedHistory: resolvedBugs,
      entries: logs
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rab-pro-bug-report-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRunAudit = async () => {
    setIsRunningAudit(true);
    setShowAuditModal(true);
    try {
      const report = await appAuditService.runFullAudit();
      setAuditReport(report);
    } catch (err) {
      console.error('Audit failed:', err);
    } finally {
      setIsRunningAudit(false);
    }
  };

  const handleDownloadAuditReport = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Bug className="w-5 h-5 text-indigo-500" />
              Bug & Error Monitor
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              V20 Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pelacak siklus hidup bug (Deduplikasi otomatis berdasarkan fingerprint, status perbaikan, dan riwayat selesai).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="btn-run-auto-audit"
            onClick={handleRunAudit}
            disabled={isRunningAudit}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Jalankan Audit Otomatis menyeluruh (Finansial, Tema, API, Bug Tracker)"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {isRunningAudit ? 'Menjalankan Audit...' : 'Jalankan Audit Aplikasi'}
          </button>

          <button 
            id="btn-download-bug-report-json"
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            title="Unduh Laporan Bug terstruktur (aktif + riwayat selesai) berformat JSON"
          >
            <Download className="w-4 h-4" /> Unduh Laporan Bug (JSON)
          </button>

          <button 
            id="btn-clear-bug-logs"
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Bersihkan riwayat catatan bug"
          >
            <Trash2 className="w-4 h-4" /> Bersihkan Log
          </button>
        </div>
      </div>

      {/* Primary Tabs: Bug Aktif vs Riwayat Selesai */}
      <div className="px-4 pt-3 pb-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            id="tab-active-bugs"
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'active'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Bug Aktif
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeBugs.length > 0
                ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}>
              {activeBugs.length}
            </span>
          </button>

          <button
            id="tab-resolved-bugs"
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'resolved'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Riwayat Selesai
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
              {resolvedBugs.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 pb-2 hidden sm:block">
          Deduplikasi aktif berdasarkan kesamaan hash fingerprint
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 flex flex-col md:flex-row items-center gap-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari pesan error, kategori, fingerprint, atau catatan resolusi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border-none rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {['all', 'error', 'warning', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filterSeverity === sev 
                  ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600 dark:text-blue-400 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Bug List Container */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50 dark:bg-slate-900">
        {loading && logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading bug logs...</div>
        ) : displayedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium">
              {activeTab === 'active' 
                ? 'Tidak ada bug aktif yang tercatat. Sistem beroperasi normal.' 
                : 'Belum ada riwayat bug yang ditandai selesai.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedLogs.map(log => {
              const isResolved = log.status === 'resolved' || log.status === 'wont-fix';
              return (
                <div 
                  key={log.id} 
                  className={`bg-white dark:bg-slate-800 rounded-xl p-4 border shadow-sm flex flex-col gap-3 transition-all ${
                    isResolved 
                      ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10' 
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`mt-0.5 p-1.5 rounded-full ${getSeverityColor(log.severity)} border flex-shrink-0`}>
                        {getSeverityIcon(log.severity)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{log.message}</h3>
                          
                          {/* Occurrence Badge */}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Terjadi {log.occurrenceCount || 1}x
                          </span>

                          {/* Status Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700'
                          }`}>
                            {log.status || 'open'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">{log.source.toUpperCase()}</span>
                          <span>•</span>
                          <span className="capitalize">{log.category.replace(/-/g, ' ')}</span>
                          <span>•</span>
                          <span>Pertama: {new Date(log.firstSeenAt || log.timestamp).toLocaleString('id-ID')}</span>
                          <span>•</span>
                          <span>Terakhir: {new Date(log.lastSeenAt || log.timestamp).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isResolved ? (
                        <button
                          onClick={() => handleOpenResolveModal(log)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          title="Tandai bug ini sudah diperbaiki dan simpan catatan resolusi"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Tandai Selesai
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReopenBug(log)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="Buka kembali bug ini ke daftar aktif"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Buka Kembali
                        </button>
                      )}

                      {log.requestUrl && (
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-[10px] font-mono">
                          <span className={log.responseStatus && log.responseStatus >= 500 ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                            {log.responseStatus || 'ERR'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">{log.requestMethod}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fingerprint info */}
                  {log.fingerprint && (
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">FINGERPRINT:</span>
                      <span className="truncate">{log.fingerprint}</span>
                    </div>
                  )}

                  {/* Resolution note if resolved */}
                  {isResolved && log.resolutionNote && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 mb-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Catatan Perbaikan:
                      </div>
                      <p>{log.resolutionNote}</p>
                      {log.resolvedAt && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                          Diselesaikan pada: {new Date(log.resolvedAt).toLocaleString('id-ID')}
                        </div>
                      )}
                    </div>
                  )}
                  
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
                      <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg overflow-x-auto text-[10px] leading-relaxed border border-slate-300 dark:border-slate-800">
                        {log.stack}
                        {log.componentStack && `\n\nComponent Stack:\n${log.componentStack}`}
                      </pre>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Resolve Bug with Notes */}
      {resolvingBug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Tandai Bug Selesai
              </h3>
              <button 
                onClick={() => setResolvingBug(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{resolvingBug.message}</div>
              <div className="text-slate-500 text-[11px]">
                Kategori: {resolvingBug.category} • Terjadi {resolvingBug.occurrenceCount || 1}x
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Catatan Perbaikan (Wajib / Deskripsi Tindakan):
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Tuliskan tindakan koreksi yang dilakukan, commit hash, atau alasan penutupan..."
                className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingBug(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmResolve}
                disabled={isResolving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {isResolving ? 'Menyimpan...' : 'Simpan & Pindahkan ke Riwayat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Automated Audit Report */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Laporan Audit Otomatis AI Agent
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pemeriksaan deterministik menyeluruh terhadap sistem finansial, tema, endpoint, dan log bug.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
              {isRunningAudit ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                  <p className="text-sm font-medium">Sedang menjalankan audit sistem menyeluruh...</p>
                  <span className="text-xs text-slate-400">Memeriksa rekonsiliasi finansial, token CSS, dan konektivitas API</span>
                </div>
              ) : auditReport ? (
                <>
                  {/* Overall Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                    auditReport.overallStatus === 'PASS'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : auditReport.overallStatus === 'WARNING'
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                        : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                  }`}>
                    {auditReport.overallStatus === 'PASS' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm">
                        STATUS AUDIT: {auditReport.overallStatus === 'PASS' ? 'LULUS (SEMUA SISTEM STABIL)' : 'CATATAN DITEMUKAN'}
                      </div>
                      <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed opacity-90">
                        {auditReport.aiNarrativeSummary}
                      </pre>
                    </div>
                  </div>

                  {/* Metric Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Financial */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Integritas Finansial</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          auditReport.financialIntegrity.issuesFound === 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}>
                          {auditReport.financialIntegrity.issuesFound === 0 ? 'KONSISTEN' : `${auditReport.financialIntegrity.issuesFound} SELISIH`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {auditReport.financialIntegrity.projectsChecked} Proyek diperiksa via Canonical Reconciler.
                      </div>
                    </div>

                    {/* Theme */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Konsistensi Tema</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          auditReport.themeConsistency.violationsFound === 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {auditReport.themeConsistency.violationsFound === 0 ? '100% KONSISTEN' : `${auditReport.themeConsistency.violationsFound} ISU`}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Pemeriksaan {auditReport.themeConsistency.checkedFiles || 119} berkas kode Tailwind.
                      </div>
                    </div>

                    {/* API Health */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Health Endpoint API</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          auditReport.apiHealth.allEndpointsOk
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}>
                          {auditReport.apiHealth.allEndpointsOk ? 'SEMUA NORMAL' : 'ADA GAGAL'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {auditReport.apiHealth.endpointsChecked.map(ep => `${ep.endpoint} (${ep.latencyMs}ms)`).join(', ')}
                      </div>
                    </div>

                    {/* Bug Tracker Summary */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Bug Tracker</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                          {auditReport.bugTrackerSummary.activeBugs} AKTIF / {auditReport.bugTrackerSummary.resolvedBugs} SELESAI
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {auditReport.bugTrackerSummary.staleOpenBugs} bug kadaluarsa (&gt;3 hari).
                      </div>
                    </div>
                  </div>

                  {/* Financial Projects Breakdown */}
                  {auditReport.financialIntegrity.details.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Detail Verifikasi Tiap Proyek:
                      </div>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                        {auditReport.financialIntegrity.details.map((d, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-xs">
                            <span className="font-medium text-slate-800 dark:text-slate-200 truncate mr-2">{d.projectName}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="font-mono text-slate-500">Rp {Math.round(d.calculatedGrandTotal).toLocaleString('id-ID')}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.isReconciled 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              }`}>
                                {d.validationStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleRunAudit}
                disabled={isRunningAudit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
                Ulangi Audit
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Tutup
                </button>
                {auditReport && (
                  <button
                    onClick={handleDownloadAuditReport}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Laporan Audit (JSON)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

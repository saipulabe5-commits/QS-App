import React, { useState, useEffect } from 'react';
import { SyncStatusInfo, SyncOperation, SyncConflict } from '../../types';
import { SyncService } from '../../services/syncService';
import { idbStorage, DB_STORES } from '../../db/indexedDBAdapter';
import { useApp } from '../../context/AppContext';
import {
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  Server,
  Smartphone,
} from 'lucide-react';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SyncStatusInfo;
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const { user, showToast } = useApp();
  const [queue, setQueue] = useState<SyncOperation[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [q, c] = await Promise.all([
        idbStorage.getAll<SyncOperation>(DB_STORES.SYNC_QUEUE),
        idbStorage.getAll<SyncConflict>(DB_STORES.SYNC_CONFLICTS),
      ]);
      setQueue(q.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setConflicts(c.filter((item) => !item.resolvedAt));
      if (c.length > 0) {
        setSelectedConflict(c[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDetails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setLoading(true);
    await SyncService.processSyncQueue();
    await loadDetails();
    setLoading(false);
    showToast('Sinkronisasi Diproses', 'Antrian data lokal telah dikirimkan ke backend.', 'info');
  };

  const handleRetryAll = async () => {
    await SyncService.retryAllFailed();
    await loadDetails();
    showToast('Coba Ulang Berjalan', 'Mencoba memproses ulang seluruh antrian yang gagal.', 'info');
  };

  const handleResolveConflict = async (strategy: 'use_local' | 'use_server') => {
    if (!selectedConflict) return;
    try {
      await SyncService.resolveConflict({
        conflictId: selectedConflict.id,
        strategy,
        userId: user?.id || 'usr_demo_1',
      });
      showToast('Konflik Diselesaikan', `Data berhasil diselesaikan dengan opsi ${strategy === 'use_local' ? 'Data Lokal' : 'Data Server'}.`, 'success');
      loadDetails();
      setSelectedConflict(null);
    } catch (e: any) {
      showToast('Gagal Resolusi', e?.message || 'Gagal menyelesaikan konflik.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-elevated)]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-elevated)] w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[var(--border-primary)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pusat Penyimpanan (Mode Local-Only)
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Data tersimpan aman di perangkat (IndexedDB). Sinkronisasi cloud belum tersedia.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Dashboard Summary */}
        <div className="p-6 bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Status Jaringan</span>
              <div className="flex items-center gap-1.5 mt-1">
                {status.isOnline ? (
                  <>
                    <Wifi className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">Online Terkoneksi</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">Offline (Lokal)</span>
                  </>
                )}
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Antrian Pending</span>
              <div className="text-xs font-bold text-[var(--text-primary)] mt-1">
                {status.pendingCount} Operasi
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Konflik Data</span>
              <div className="text-xs font-bold text-[var(--text-primary)] mt-1">
                {status.conflictCount > 0 ? (
                  <span className="text-rose-600 font-bold">{status.conflictCount} Perlu Ditinjau</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Nihil (Aman)</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)]">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Terakhir Sinkron</span>
              <div className="text-[11px] font-semibold text-[var(--text-primary)] mt-1 truncate">
                {status.lastSyncTime
                  ? new Date(status.lastSyncTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'Baru saja'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data otomatis tersimpan di IndexedDB browser saat offline tanpa kehilangan data.</span>
            </div>
            <div className="flex items-center gap-2">
              {status.failedCount > 0 && (
                <button
                  onClick={handleRetryAll}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Gagal ({status.failedCount})</span>
                </button>
              )}
              <button
                onClick={handleSyncNow}
                disabled={status.isSyncing || !status.isOnline}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 text-white transition-colors shadow-2xs ${
                  status.isOnline
                    ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${status.isSyncing ? 'animate-spin' : ''}`} />
                <span>{status.isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
          {/* Conflicts Section */}
          {conflicts.length > 0 && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Terdapat {conflicts.length} Konflik Versi Data Server &amp; Perangkat Lokal</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                Konflik terjadi ketika data diubah di perangkat lain secara bersamaan. Pilih versi data yang ingin dipertahankan.
              </p>

              {selectedConflict && (
                <div className="p-3 bg-[var(--bg-elevated)] rounded-lg border border-rose-200 text-xs space-y-3">
                  <div className="font-semibold text-[var(--text-primary)]">
                    Entitas: <span className="font-mono">{selectedConflict.entity} ({selectedConflict.entityId})</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-1 font-bold text-blue-900 mb-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Versi Lokal (Perangkat Ini)</span>
                      </div>
                      <pre className="text-[10px] font-mono text-[var(--text-primary)] max-h-24 overflow-y-auto custom-scrollbar">
                        {JSON.stringify(selectedConflict.localData, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleResolveConflict('use_local')}
                        className="w-full mt-2 py-1 bg-blue-600 text-white text-[11px] font-bold rounded-md hover:bg-blue-700"
                      >
                        Pertahankan Data Lokal
                      </button>
                    </div>

                    <div className="p-2.5 bg-[var(--bg-elevated-hover)] rounded-lg border border-[var(--border-primary)]">
                      <div className="flex items-center gap-1 font-bold text-[var(--text-primary)] mb-1">
                        <Server className="w-3.5 h-3.5" />
                        <span>Versi Server Cloud</span>
                      </div>
                      <pre className="text-[10px] font-mono text-[var(--text-primary)] max-h-24 overflow-y-auto custom-scrollbar">
                        {JSON.stringify(selectedConflict.serverData, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleResolveConflict('use_server')}
                        className="w-full mt-2 py-1 bg-[var(--bg-elevated-hover)] text-white text-[11px] font-bold rounded-md hover:bg-[var(--bg-elevated)]"
                      >
                        Gunakan Data Server
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Queue List */}
          <div>
            <h4 className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center justify-between">
              <span>Daftar Antrian Operasi Sinkronisasi ({queue.length}):</span>
            </h4>

            {queue.length === 0 ? (
              <div className="p-8 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] text-center text-xs text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold">Semua antrian sinkronisasi telah bersih.</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Tidak ada delta perubahan lokal yang tertunda.</p>
              </div>
            ) : (
              <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden">
                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Entitas</th>
                        <th className="p-2.5">Operasi</th>
                        <th className="p-2.5">Waktu</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {queue.map((op) => (
                        <tr key={op.id} className="hover:bg-[var(--bg-elevated-hover)]">
                          <td className="p-2.5 font-mono text-[11px] text-[var(--text-primary)]">
                            {op.entity} ({op.entityId?.slice(0, 10)})
                          </td>
                          <td className="p-2.5 font-semibold capitalize text-[var(--text-primary)]">
                            {op.operation}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            {new Date(op.createdAt).toLocaleTimeString('id-ID')}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                op.status === 'synced'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : op.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800'
                                  : op.status === 'conflict'
                                  ? 'bg-rose-100 text-rose-800'
                                  : op.status === 'failed'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)]'
                              }`}
                            >
                              {op.status}
                            </span>
                            {op.error && (
                              <p className="text-[10px] text-rose-600 mt-0.5 line-clamp-1">{op.error}</p>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            {op.status === 'failed' && (
                              <button
                                onClick={() => SyncService.retryOperation(op.id).then(loadDetails)}
                                className="text-blue-600 hover:text-blue-800 text-[11px] font-bold mr-2"
                              >
                                Retry
                              </button>
                            )}
                            <button
                              onClick={() => SyncService.cancelOperation(op.id).then(loadDetails)}
                              className="text-[var(--text-secondary)] hover:text-rose-600 p-1"
                              title="Batalkan dari antrian"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] px-6 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Engine: IndexedDB (Store IDB v1.0) • ServiceWorker Active</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SyncStatusInfo } from '../../types';
import { idbStorage, DB_STORES } from '../../db/indexedDBAdapter';
import { useApp } from '../../context/AppContext';
import {
  X,
  Database,
  ShieldCheck,
  Download,
  Upload,
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
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Re-render handled by parent if needed
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setLoading(true);
      const allData: any = {};
      for (const store of Object.values(DB_STORES)) {
        allData[store] = await idbStorage.getAll(store);
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rab-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export Berhasil', 'Seluruh data berhasil diexport ke file JSON.', 'success');
    } catch (e: any) {
      showToast('Export Gagal', e.message || 'Terjadi kesalahan saat export data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const allData = JSON.parse(text);

      let importedStores = 0;
      for (const store of Object.values(DB_STORES)) {
        if (allData[store] && Array.isArray(allData[store])) {
          await idbStorage.setAll(store, allData[store]);
          importedStores++;
        }
      }
      
      if (importedStores === 0) {
        throw new Error('Format file backup tidak dikenali atau kosong.');
      }

      showToast('Import Berhasil', 'Seluruh data berhasil direstore. Aplikasi memuat ulang...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      showToast('Import Gagal', err.message || 'File backup tidak valid.', 'error');
      setLoading(false);
    }
    
    // Clear input
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-elevated)]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-elevated)] w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Pusat Penyimpanan
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                  Mode Lokal — Sinkronisasi Manual
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Data tersimpan aman di perangkat (IndexedDB). Gunakan fitur export/import untuk backup manual.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-elevated-hover)] custom-scrollbar space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/15 rounded-lg text-blue-600 dark:text-blue-300">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Export Manual ke File</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Backup seluruh proyek, RAB, database harga, dan pengaturan ke dalam 1 file JSON.</p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {loading ? 'Memproses...' : 'Export Semua Data'}
                </button>
              </div>
            </div>
            
            <div className="p-5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/15 rounded-lg text-emerald-600 dark:text-emerald-300">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Import dari File Backup</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Restore data dari file backup JSON. <strong className="text-rose-500">Tindakan ini akan menimpa data yang ada!</strong></p>
                </div>
              </div>
              <div className="mt-auto pt-2">
                <label className={`w-full py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-[var(--bg-elevated)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-50' : 'cursor-pointer'}`}>
                  <Upload className="w-4 h-4" />
                  {loading ? 'Memproses...' : 'Pilih File Backup'}
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImport}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-4 p-4 bg-[var(--bg-elevated)] border border-emerald-200 dark:border-emerald-500/30 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Semua modul tersimpan otomatis di IndexedDB browser Anda (Data Anda 100% milik Anda secara offline). Lakukan backup berkala ke komputer Anda.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] px-6 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Engine: IndexedDB (Store IDB v1.0) • Local First</span>
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

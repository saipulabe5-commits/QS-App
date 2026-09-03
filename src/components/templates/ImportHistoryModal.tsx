import React from 'react';
import { useApp } from '../../context/AppContext';
import { RABImportJob } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  History,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

interface ImportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeImport: (job: RABImportJob) => void;
}

export const ImportHistoryModal: React.FC<ImportHistoryModalProps> = ({
  isOpen,
  onClose,
  onResumeImport,
}) => {
  const { importJobs, startImportJob } = useApp();

  if (!isOpen) return null;

  const getFileIcon = (fileType: string) => {
    if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (fileType === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    return <ImageIcon className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-[var(--bg-elevated)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">Riwayat Import & Berkas RAB</h3>
              <p className="text-xs text-slate-500">
                Daftar berkas yang pernah diunggah dan diekstrak ke dalam sistem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Jobs */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {importJobs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Belum ada riwayat import berkas.</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Unggah file Excel, CSV, PDF, atau Foto RAB untuk memulai.
              </p>
            </div>
          ) : (
            importJobs.map((job) => {
              const needsCheckCount = job.parsedItems.filter(
                (i) => i.verificationStatus !== 'verified'
              ).length;

              return (
                <div
                  key={job.id}
                  className="p-4 bg-[var(--bg-elevated-hover)] hover:bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:border-blue-300 rounded-2xl transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="p-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                        {getFileIcon(job.fileType)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {job.fileName}
                          </h4>
                          <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-sm text-[var(--text-primary)]">
                            {job.fileType}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          {job.createdAt.split('T')[0]} &middot; {(job.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        job.status === 'saved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {job.status === 'saved' ? 'Tersimpan' : 'Draft Siap'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-primary)]/60 text-xs">
                    <div className="flex items-center space-x-3 text-[var(--text-secondary)]">
                      <span>{job.parsedItems.length} Item</span>
                      <span>&middot;</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">
                        {formatRupiah(job.systemCalculatedTotal)}
                      </span>
                      {needsCheckCount > 0 && (
                        <span className="text-amber-700 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{needsCheckCount} Perlu Cek</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onResumeImport(job);
                        onClose();
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1 shadow-2xs transition-colors"
                    >
                      <span>Buka Pratinjau</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

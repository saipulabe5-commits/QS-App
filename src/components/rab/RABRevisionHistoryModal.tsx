import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RABRevision, RABItem, FieldDifference } from '../../types';
import { RevisionService } from '../../services/revisionService';
import { formatRupiah } from '../../utils/formatters';
import {
  X,
  History,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  User,
  Bot,
  FileSpreadsheet,
  ArrowRight,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';

interface RABRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItemId?: string;
}

export const RABRevisionHistoryModal: React.FC<RABRevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  targetItemId,
}) => {
  const { activeProject, rabItems, updateRABItem, addRABItem, deleteRABItem, showToast, user } = useApp();
  const [revisions, setRevisions] = useState<RABRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<RABRevision | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');

  const loadHistory = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      let list: RABRevision[] = [];
      if (targetItemId) {
        list = await RevisionService.getRABItemHistory(targetItemId);
      } else {
        list = await RevisionService.getProjectRABHistory(activeProject.id);
      }
      setRevisions(list);
      if (list.length > 0) {
        setSelectedRevision(list[0]);
      }
    } catch (e) {
      console.error('Failed to load revision history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, activeProject?.id, targetItemId]);

  if (!isOpen || !activeProject) return null;

  // Filter revisions
  const filteredRevisions = revisions.filter((rev) => {
    if (filterAction === 'all') return true;
    return rev.action === filterAction;
  });

  const getActorBadge = (actorType: string, actorName: string) => {
    if (actorType === 'ai') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
          <Bot className="w-3 h-3 text-purple-600" />
          AI Assistant
        </span>
      );
    }
    if (actorType === 'system') {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
          <Layers className="w-3 h-3 text-slate-600" />
          Sistem / Impor
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
        <User className="w-3 h-3 text-blue-600" />
        {actorName || 'User'}
      </span>
    );
  };

  const getActionBadge = (action: string, isRollback?: boolean) => {
    if (isRollback) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">
          Rollback
        </span>
      );
    }
    switch (action) {
      case 'create':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
            Tambah Item
          </span>
        );
      case 'update':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
            Edit Item
          </span>
        );
      case 'delete':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
            Hapus Item
          </span>
        );
      case 'bulk_apply':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-800">
            Bulk / Batch
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
            {action}
          </span>
        );
    }
  };

  // Rollback Execution
  const handleRollback = async (rev: RABRevision) => {
    if (!rev.previousData && !rev.nextData) {
      showToast('Gagal Rollback', 'Data revisi tidak memiliki snapshot untuk dipulihkan.', 'warning');
      return;
    }

    const confirmMsg = window.confirm(
      `Apakah Anda yakin ingin memulihkan (rollback) data RAB ke status revisi tanggal ${new Date(
        rev.timestamp
      ).toLocaleString('id-ID')}? Tindakan ini akan dicatat sebagai riwayat baru secara aman.`
    );
    if (!confirmMsg) return;

    setIsRollingBack(true);
    try {
      if (rev.rabItemId) {
        // Single item rollback
        const targetData = (rev.action === 'delete' ? rev.previousData : rev.previousData || rev.nextData) as Partial<RABItem>;
        if (targetData) {
          const exists = rabItems.some((it) => it.id === rev.rabItemId);
          if (exists) {
            await updateRABItem(
              rev.rabItemId,
              {
                code: targetData.code,
                name: targetData.name,
                category: targetData.category,
                unit: targetData.unit,
                volume: targetData.volume,
                unitPrice: targetData.unitPrice,
                notes: targetData.notes,
              },
              `Rollback ke revisi #${rev.id}`
            );
          } else {
            await addRABItem(
              {
                id: rev.rabItemId,
                projectId: activeProject.id,
                code: targetData.code || '00.00',
                name: targetData.name || 'Item Rollback',
                category: targetData.category || 'Pekerjaan Persiapan',
                unit: targetData.unit || 'ls',
                volume: Number(targetData.volume || 1),
                unitPrice: Number(targetData.unitPrice || 0),
                notes: targetData.notes || '',
              },
              `Restore deleted item via rollback #${rev.id}`
            );
          }
        }
      }

      showToast('Rollback Berhasil', 'Data RAB berhasil dipulihkan ke versi yang dipilih.', 'success');
      loadHistory();
    } catch (e: any) {
      showToast('Gagal Rollback', e?.message || 'Terjadi kesalahan saat memulihkan versi.', 'error');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Export Audit Log
  const handleExportLog = () => {
    const dataStr = JSON.stringify(revisions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_revisions_${activeProject.documentNo}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Log Diekspor', 'Riwayat perubahan berhasil diunduh.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Riwayat Perubahan RAB (Revision History)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Immutable Audit Trail
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Proyek: <span className="text-slate-200 font-semibold">{activeProject.name}</span> ({activeProject.documentNo})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportLog}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
              title="Unduh Berkas Log Audit"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Log</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-semibold text-slate-700">Filter Aksi:</span>
            {['all', 'create', 'update', 'delete', 'bulk_apply'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                  filterAction === act
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {act === 'all' ? 'Semua' : act}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {filteredRevisions.length} Versi Tercatat
          </span>
        </div>

        {/* Body Split View */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Revision Timeline List */}
          <div className="md:col-span-5 overflow-y-auto p-4 custom-scrollbar max-h-[40vh] md:max-h-full space-y-2 bg-slate-50/50">
            {filteredRevisions.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-xs font-semibold">Belum ada riwayat revisi yang tercatat.</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Setiap penambahan, pengeditan, atau penghapusan item akan tercatat di sini secara otomatis.
                </p>
              </div>
            ) : (
              filteredRevisions.map((rev) => {
                const isSelected = selectedRevision?.id === rev.id;
                const isValidChecksum = RevisionService.verifyRevisionChecksum(rev);
                return (
                  <button
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-white ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getActionBadge(rev.action, rev.isRollback)}
                        {getActorBadge(rev.actorType, rev.actorName)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(rev.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 line-clamp-1">
                      {rev.reason || `Perubahan RAB #${rev.id.slice(-6)}`}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
                      <span>
                        {new Date(rev.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span
                        className={`flex items-center gap-0.5 ${
                          isValidChecksum ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isValidChecksum ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-mono">{rev.checksum.slice(0, 8)}</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Invalid Checksum</span>
                          </>
                        )}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Diff & Rollback Inspector */}
          <div className="md:col-span-7 overflow-y-auto p-6 custom-scrollbar max-h-[50vh] md:max-h-full space-y-4">
            {selectedRevision ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Detail Revisi: #{selectedRevision.id}
                      </h3>
                      {getActionBadge(selectedRevision.action, selectedRevision.isRollback)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Dicatat pada {new Date(selectedRevision.timestamp).toLocaleString('id-ID')} oleh{' '}
                      <span className="font-semibold text-slate-800">
                        {selectedRevision.actorName} ({selectedRevision.actorType})
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isRollingBack}
                    onClick={() => handleRollback(selectedRevision)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRollingBack ? 'Memulihkan...' : 'Rollback ke Versi Ini'}</span>
                  </button>
                </div>

                {/* Reason & Source Metadata */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-semibold">Sumber Perubahan:</span>
                    <span className="font-mono text-slate-900 font-bold">{selectedRevision.sourceType}</span>
                  </div>
                  {selectedRevision.reason && (
                    <div className="text-slate-700 pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-500">Catatan / Alasan: </span>
                      <span>{selectedRevision.reason}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    Transaction ID: {selectedRevision.transactionId} • Device: {selectedRevision.deviceId}
                  </div>
                </div>

                {/* Diff Visual Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <span>Perbandingan Perubahan Bidang Data (Diff Matrix):</span>
                  </h4>

                  {selectedRevision.changedFields && selectedRevision.changedFields.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold">
                          <tr>
                            <th className="p-2.5">Field / Komponen</th>
                            <th className="p-2.5">Nilai Sebelumnya</th>
                            <th className="p-2.5">Nilai Baru</th>
                            <th className="p-2.5 text-right">Selisih</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedRevision.changedFields.map((diff, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-semibold text-slate-800">
                                {diff.fieldLabel || diff.field}
                              </td>
                              <td className="p-2.5 text-rose-700 bg-rose-50/50 font-medium">
                                {diff.oldValue !== null && diff.oldValue !== undefined
                                  ? typeof diff.oldValue === 'number'
                                    ? diff.field.includes('Price') || diff.field.includes('Cost')
                                      ? formatRupiah(diff.oldValue)
                                      : diff.oldValue
                                    : String(diff.oldValue)
                                  : '-'}
                              </td>
                              <td className="p-2.5 text-emerald-700 bg-emerald-50/50 font-semibold">
                                {diff.newValue !== null && diff.newValue !== undefined
                                  ? typeof diff.newValue === 'number'
                                    ? diff.field.includes('Price') || diff.field.includes('Cost')
                                      ? formatRupiah(diff.newValue)
                                      : diff.newValue
                                    : String(diff.newValue)
                                  : '-'}
                              </td>
                              <td className="p-2.5 text-right font-bold text-slate-900">
                                {diff.differenceNominal !== undefined ? (
                                  <span
                                    className={
                                      diff.differenceNominal > 0
                                        ? 'text-rose-600'
                                        : diff.differenceNominal < 0
                                        ? 'text-emerald-600'
                                        : 'text-slate-600'
                                    }
                                  >
                                    {diff.differenceNominal > 0 ? '+' : ''}
                                    {diff.field.includes('Price') || diff.field.includes('Cost')
                                      ? formatRupiah(diff.differenceNominal)
                                      : diff.differenceNominal}
                                    {diff.differencePercent !== undefined && ` (${diff.differencePercent}%)`}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      Tidak ada detail field yang dimodifikasi secara spesifik.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400">
                <p className="text-xs font-semibold">Pilih salah satu item revisi di sebelah kiri untuk melihat inspeksi diff.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit log terproteksi checksum SHA-hash &amp; pencegahan manipulasi data</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RABItem, RABCategory } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { X, CheckCircle2, AlertCircle, ShieldCheck, Check, Edit3, Sparkles, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export interface ProposedRABItem {
  code: string;
  category: RABCategory;
  name: string;
  unit: string;
  volume: number;
  unitPrice: number;
  notes?: string;
  reason?: string;
  selected?: boolean;
}

export interface ProposedPriceAdjustment {
  itemId: string;
  itemName: string;
  code?: string;
  category?: string;
  unit?: string;
  currentPrice: number;
  suggestedPrice: number;
  marketMin?: number;
  marketMax?: number;
  status?: string;
  percentDelta?: number;
  reason: string;
  selected?: boolean;
}

interface ReviewApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  mode: 'add_items' | 'adjust_prices' | 'price_watcher';
  proposedItems?: ProposedRABItem[];
  proposedPriceAdjustments?: ProposedPriceAdjustment[];
  onApproved?: () => void;
  onApplyPriceWatcher?: (approved: ProposedPriceAdjustment[]) => void;
}

export const ReviewApprovalModal: React.FC<ReviewApprovalModalProps> = ({
  isOpen,
  onClose,
  title = 'Tinjau & Setujui Rekomendasi AI',
  description = 'Periksa rincian item sebelum diterapkan ke dokumen RAB Anda.',
  mode,
  proposedItems = [],
  proposedPriceAdjustments = [],
  onApproved,
  onApplyPriceWatcher,
}) => {
  const { selectedProject, addRABItem, updateRABItem, batchUpdatePriceItemsAndReconcile, showToast } = useApp();

  // State for items
  const [items, setItems] = useState<ProposedRABItem[]>(() =>
    proposedItems.map((it) => ({ ...it, selected: it.selected ?? true }))
  );

  // State for price adjustments
  const [adjustments, setAdjustments] = useState<ProposedPriceAdjustment[]>(() =>
    proposedPriceAdjustments.map((it) => ({ ...it, selected: it.selected ?? true }))
  );

  // Filter for price watcher
  const [filterStatus, setFilterStatus] = useState<'all' | 'stale' | 'high' | 'fair'>('all');

  if (!isOpen) return null;

  // Handlers for Items
  const handleToggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleUpdateItemField = (
    index: number,
    field: 'volume' | 'unitPrice' | 'name' | 'unit',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectAllItems = (select: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  // Handlers for Adjustments
  const handleToggleAdjustment = (index: number) => {
    setAdjustments((prev) =>
      prev.map((adj, idx) => (idx === index ? { ...adj, selected: !adj.selected } : adj))
    );
  };

  const handleUpdateAdjPrice = (index: number, newPrice: number) => {
    setAdjustments((prev) =>
      prev.map((adj, idx) => (idx === index ? { ...adj, suggestedPrice: newPrice } : adj))
    );
  };

  const handleSelectAllAdjustments = (select: boolean) => {
    setAdjustments((prev) => prev.map((adj) => ({ ...adj, selected: select })));
  };

  const handleApplyChanges = () => {
    if (mode === 'price_watcher') {
      const selectedAdj = adjustments.filter((a) => a.selected);
      if (selectedAdj.length === 0) {
        showToast('Pilih Item', 'Silakan pilih minimal satu penyesuaian harga untuk disetujui.', 'warning');
        return;
      }

      if (onApplyPriceWatcher) {
        onApplyPriceWatcher(selectedAdj);
      } else {
        batchUpdatePriceItemsAndReconcile(
          selectedAdj.map((a) => ({
            id: a.itemId,
            price: Number(a.suggestedPrice) || a.currentPrice,
            reason: a.reason,
          }))
        );
      }

      if (onApproved) onApproved();
      onClose();
      return;
    }

    if (!selectedProject) {
      showToast('Pilih Proyek', 'Silakan pilih proyek aktif terlebih dahulu.', 'warning');
      return;
    }

    if (mode === 'add_items') {
      const selectedItems = items.filter((i) => i.selected);
      if (selectedItems.length === 0) {
        showToast('Tidak Ada Item', 'Pilih minimal satu item untuk dimasukkan ke RAB.', 'warning');
        return;
      }

      selectedItems.forEach((it) => {
        addRABItem({
          projectId: selectedProject.id,
          code: it.code,
          name: it.name,
          category: it.category,
          unit: it.unit,
          volume: Number(it.volume) || 1,
          unitPrice: Number(it.unitPrice) || 0,
          notes: it.notes || it.reason || 'Diverifikasi dari Rekomendasi AI',
        });
      });

      showToast(
        'Item RAB Diterapkan',
        `${selectedItems.length} pos pekerjaan berhasil disetujui dan dimasukkan ke ${selectedProject.name}.`,
        'success'
      );
    } else {
      const selectedAdj = adjustments.filter((a) => a.selected);
      if (selectedAdj.length === 0) {
        showToast('Tidak Ada Penyesuaian', 'Pilih minimal satu penyesuaian harga.', 'warning');
        return;
      }

      selectedAdj.forEach((adj) => {
        updateRABItem(adj.itemId, {
          unitPrice: Number(adj.suggestedPrice) || 0,
        });
      });

      showToast(
        'Harga Diperbarui',
        `${selectedAdj.length} harga satuan berhasil disesuaikan di dokumen RAB.`,
        'success'
      );
    }

    if (onApproved) onApproved();
    onClose();
  };

  const selectedItemCount = items.filter((i) => i.selected).length;
  const selectedAdjCount = adjustments.filter((a) => a.selected).length;
  const totalProposedCost = items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + (Number(i.volume) || 0) * (Number(i.unitPrice) || 0), 0);

  const displayedAdjustments = adjustments.filter((adj) => {
    if (filterStatus === 'stale') return (adj.status || '').toLowerCase().includes('rendah') || (adj.status || '').toLowerCase().includes('stale');
    if (filterStatus === 'high') return (adj.status || '').toLowerCase().includes('tinggi');
    if (filterStatus === 'fair') return (adj.status || '').toLowerCase().includes('wajar');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[var(--bg-elevated)] w-full max-w-4xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
              {mode === 'price_watcher' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-300">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Info Notice */}
        <div className="bg-blue-50/80 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/50 px-6 py-2.5 flex items-center justify-between text-xs text-blue-950 dark:text-blue-200 shrink-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              {mode === 'price_watcher' ? (
                <span>
                  Menyetujui perubahan harga akan <strong>otomatis merekonsiliasi</strong> pos analisa AHSP dan item RAB yang terkait.
                </span>
              ) : (
                <span>
                  Data RAB Anda tidak akan berubah sebelum Anda menekan tombol <strong>Setujui & Terapkan</strong> di bawah ini.
                </span>
              )}
            </span>
          </div>
          {mode === 'price_watcher' && (
            <span className="font-semibold text-blue-700 dark:text-blue-300 hidden sm:inline">
              Acuan Pasar 2026
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {mode === 'add_items' ? (
            <>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllItems(true)}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllItems(false)}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold"
                  >
                    Batal Pilih
                  </button>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedItemCount} dari {items.length} item dipilih
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      item.selected
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-2xs'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItem(idx)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded-sm border-[var(--border-primary)] focus:ring-blue-500 cursor-pointer"
                      />

                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold rounded-sm">
                              {item.code}
                            </span>
                            <span className="text-xs font-bold text-blue-800 dark:text-blue-300">{item.category}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            Subtotal: {formatRupiah((Number(item.volume) || 0) * (Number(item.unitPrice) || 0))}
                          </span>
                        </div>

                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateItemField(idx, 'name', e.target.value)}
                          className="w-full text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg px-2.5 py-1.5 focus:border-blue-600"
                        />

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-300 font-semibold mb-0.5">
                              Volume
                            </label>
                            <input
                              type="number"
                              value={item.volume}
                              onChange={(e) => handleUpdateItemField(idx, 'volume', Number(e.target.value))}
                              className="w-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-300 font-semibold mb-0.5">
                              Satuan
                            </label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItemField(idx, 'unit', e.target.value)}
                              className="w-full text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg px-2 py-1 text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-600 dark:text-slate-300 font-semibold mb-0.5">
                              Harga Satuan (Rp)
                            </label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItemField(idx, 'unitPrice', Number(e.target.value))}
                              className="w-full text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg px-2 py-1"
                            />
                          </div>
                        </div>

                        {item.reason && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-[var(--bg-elevated)]/70 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                            💡 {item.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Controls & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-1 border-b border-[var(--border-primary)]">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAllAdjustments(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold"
                  >
                    Pilih Semua ({adjustments.length})
                  </button>
                  <span className="text-slate-400">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllAdjustments(false)}
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    Batal Pilih
                  </button>
                </div>

                {mode === 'price_watcher' && (
                  <div className="flex items-center space-x-1">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'stale', label: 'Perlu Naik / Stale' },
                      { id: 'high', label: 'Terlalu Tinggi' },
                      { id: 'fair', label: 'Wajar' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFilterStatus(f.id as any)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold transition-colors ${
                          filterStatus === f.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Adjustments List */}
              <div className="space-y-3">
                {displayedAdjustments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-300 bg-[var(--bg-elevated-hover)] rounded-xl">
                    Tidak ada item harga yang sesuai dengan filter.
                  </div>
                ) : (
                  displayedAdjustments.map((adj) => {
                    const originalIdx = adjustments.findIndex((a) => a.itemId === adj.itemId);
                    const isStale = (adj.status || '').toLowerCase().includes('rendah') || (adj.status || '').toLowerCase().includes('stale');
                    const isHigh = (adj.status || '').toLowerCase().includes('tinggi');
                    const isFair = (adj.status || '').toLowerCase().includes('wajar');
                    const deltaPercent = adj.currentPrice > 0 ? Math.round(((adj.suggestedPrice - adj.currentPrice) / adj.currentPrice) * 100) : 0;

                    return (
                      <div
                        key={adj.itemId || originalIdx}
                        className={`p-4 rounded-xl border transition-all ${
                          adj.selected
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-2xs'
                            : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] opacity-60'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={adj.selected}
                            onChange={() => handleToggleAdjustment(originalIdx)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded-sm border-[var(--border-primary)] focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex items-center space-x-2">
                                {adj.code && (
                                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold rounded-sm">
                                    {adj.code}
                                  </span>
                                )}
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {adj.itemName}
                                </h4>
                                {adj.unit && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                    /{adj.unit}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-1.5">
                                {isStale && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/50">
                                    <TrendingUp className="w-3 h-3" />
                                    Stale / Terlalu Rendah
                                  </span>
                                )}
                                {isHigh && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/50">
                                    <TrendingDown className="w-3 h-3" />
                                    Terlalu Tinggi
                                  </span>
                                )}
                                {isFair && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/50">
                                    <Check className="w-3 h-3" />
                                    Wajar 2026
                                  </span>
                                )}
                                {deltaPercent !== 0 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm font-mono ${deltaPercent > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'}`}>
                                    {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {adj.reason}
                            </p>

                            {adj.marketMin !== undefined && adj.marketMax !== undefined && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <span>Estimasi Rentang Pasar 2026:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">
                                  {formatRupiah(adj.marketMin)} - {formatRupiah(adj.marketMax)}
                                </span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                              <div>
                                <span className="text-[10px] text-slate-600 dark:text-slate-300 block font-semibold">Harga Tercatat</span>
                                <span className="line-through text-slate-500 dark:text-slate-400 font-mono font-medium">
                                  {formatRupiah(adj.currentPrice)}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                              <div className="flex-1 max-w-[200px]">
                                <span className="text-[10px] text-blue-700 dark:text-blue-300 block font-bold">
                                  Harga Rekomendasi 2026 (Rp)
                                </span>
                                <input
                                  type="number"
                                  value={adj.suggestedPrice}
                                  onChange={(e) => handleUpdateAdjPrice(originalIdx, Number(e.target.value))}
                                  className="w-full text-xs font-mono font-bold text-blue-900 dark:text-blue-100 bg-[var(--bg-elevated)] border border-blue-300 dark:border-blue-700 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-blue-500/20"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div>
            {mode === 'add_items' ? (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Total Nilai Item Disetujui:{' '}
                <strong className="text-slate-900 dark:text-white font-mono">{formatRupiah(totalProposedCost)}</strong>
              </span>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-white font-bold">{selectedAdjCount}</strong> dari {adjustments.length} penyesuaian harga dipilih
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'price_watcher'
                  ? 'Setujui & Rekonsiliasi Otomatis (Master, AHSP & RAB)'
                  : 'Setujui & Terapkan ke RAB'}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

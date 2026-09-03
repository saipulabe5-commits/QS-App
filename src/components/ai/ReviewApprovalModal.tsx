import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RABItem, RABCategory } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { X, CheckCircle2, AlertCircle, ShieldCheck, Check, Edit3 } from 'lucide-react';
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
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  selected?: boolean;
}

interface ReviewApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  mode: 'add_items' | 'adjust_prices';
  proposedItems?: ProposedRABItem[];
  proposedPriceAdjustments?: ProposedPriceAdjustment[];
  onApproved?: () => void;
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
}) => {
  const { selectedProject, addRABItem, updateRABItem, showToast } = useApp();

  // State for items
  const [items, setItems] = useState<ProposedRABItem[]>(() =>
    proposedItems.map((it) => ({ ...it, selected: it.selected ?? true }))
  );

  // State for price adjustments
  const [adjustments, setAdjustments] = useState<ProposedPriceAdjustment[]>(() =>
    proposedPriceAdjustments.map((it) => ({ ...it, selected: it.selected ?? true }))
  );

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

  const handleApplyChanges = () => {
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
  const totalProposedCost = items
    .filter((i) => i.selected)
    .reduce((sum, i) => sum + (Number(i.volume) || 0) * (Number(i.unitPrice) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[var(--bg-elevated)] w-full max-w-3xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 my-8"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white p-1 rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2.5 flex items-center space-x-2 text-xs text-blue-900 font-medium">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Data RAB Anda tidak akan berubah sebelum Anda menekan tombol <strong>Setujui & Terapkan</strong> di bawah ini.
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
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
                  <span className="text-slate-600 dark:text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllItems(false)}
                    className="text-slate-500 hover:text-[var(--text-primary)] font-semibold"
                  >
                    Batal Pilih
                  </button>
                </div>
                <span className="font-bold text-[var(--text-primary)]">
                  {selectedItemCount} dari {items.length} item dipilih
                </span>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      item.selected
                        ? 'bg-blue-50/40 border-blue-200 shadow-2xs'
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
                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] font-mono text-[10px] font-bold rounded-sm">
                              {item.code}
                            </span>
                            <span className="text-xs font-bold text-blue-800">{item.category}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
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
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
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
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
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
                            <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
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
                          <p className="text-[11px] text-slate-500 italic bg-[var(--bg-elevated)]/70 p-2 rounded-lg border border-slate-100">
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
            <div className="space-y-3">
              {adjustments.map((adj, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    adj.selected
                      ? 'bg-blue-50/40 border-blue-200'
                      : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={adj.selected}
                      onChange={() => handleToggleAdjustment(idx)}
                      className="mt-1 w-4 h-4 text-blue-600 rounded-sm border-[var(--border-primary)] focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{adj.itemName}</h4>
                      <p className="text-[11px] text-slate-500">{adj.reason}</p>

                      <div className="flex items-center space-x-3 text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-[var(--text-secondary)] block font-semibold">Harga Saat Ini</span>
                          <span className="line-through text-slate-500 font-mono font-medium">
                            {formatRupiah(adj.currentPrice)}
                          </span>
                        </div>
                        <span className="text-[var(--text-secondary)]">➔</span>
                        <div className="flex-1 max-w-[180px]">
                          <span className="text-[10px] text-blue-700 block font-bold">Harga Rekomendasi (Rp)</span>
                          <input
                            type="number"
                            value={adj.suggestedPrice}
                            onChange={(e) => handleUpdateAdjPrice(idx, Number(e.target.value))}
                            className="w-full text-xs font-mono font-bold text-blue-900 bg-[var(--bg-elevated)] border border-blue-300 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            {mode === 'add_items' && (
              <span className="text-xs text-[var(--text-secondary)]">
                Total Nilai Item Disetujui:{' '}
                <strong className="text-[var(--text-primary)] font-mono">{formatRupiah(totalProposedCost)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-primary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApplyChanges}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Setujui & Terapkan ke RAB</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

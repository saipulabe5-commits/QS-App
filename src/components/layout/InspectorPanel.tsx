import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  Sparkles,
  PieChart,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface InspectorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIEstimator?: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  isOpen,
  onClose,
  onOpenAIEstimator,
}) => {
  const {
    selectedProject,
    projectRABItems,
    settings,
    activeTab,
    setActiveTab,
    showToast,
  } = useApp();

  if (!isOpen) return null;

  // Canonical Financial Calculations
  const directCost = projectRABItems.reduce(
    (sum, item) => sum + (Number(item.volume) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  const overheadPercent = selectedProject?.overheadPercent ?? settings?.defaultOverhead ?? 5;
  const profitPercent = selectedProject?.profitPercent ?? settings?.defaultProfit ?? 10;
  const taxPercent = selectedProject?.taxPercent ?? settings?.defaultTax ?? 0;

  const overheadCost = 0;
  const profitCost = 0;
  const subtotalBeforeTax = directCost + overheadCost + profitCost;
  const taxCost = Math.round((subtotalBeforeTax * taxPercent) / 100);
  const grandTotal = subtotalBeforeTax + taxCost;

  const buildingArea = selectedProject?.buildingArea || 0;
  const costPerM2 = buildingArea > 0 ? Math.round(grandTotal / buildingArea) : 0;

  // Breakdown by Category
  const categoryMap: Record<string, number> = {};
  projectRABItems.forEach((item) => {
    const cat = item.category || 'Lain-lain';
    categoryMap[cat] = (categoryMap[cat] || 0) + (Number(item.volume) || 0) * (Number(item.unitPrice) || 0);
  });

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 320, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-80 sm:w-88 bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-2xl flex flex-col z-30 flex-shrink-0 h-full overflow-hidden"
      >
        {/* Inspector Header */}
        <div className="px-4 py-3.5 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Workspace Inspector (⌘I)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Tutup Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
          {/* Project Summary Card */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase font-mono">
                {selectedProject?.documentNo || 'NO-DOC'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                {selectedProject?.status || 'Aktif'}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-100 mb-1 leading-snug line-clamp-2">
              {selectedProject?.name || 'Pilih Proyek'}
            </h3>
            <p className="text-slate-400 text-[11px] mb-3">
              {selectedProject?.client || 'Klien Proyek'} {selectedProject?.location ? `• ${selectedProject.location}` : ''}
            </p>

            <div className="pt-3 border-t border-slate-800">
              <div className="text-[11px] text-slate-400">Total Anggaran (Grand Total)</div>
              <div className="text-xl font-bold text-white tracking-tight tabular-nums mt-0.5">
                {formatCurrency(grandTotal)}
              </div>
              {costPerM2 > 0 && (
                <div className="text-[10px] text-blue-300 mt-1 tabular-nums">
                  {formatCurrency(costPerM2)} / m² (Luas: {buildingArea} m²)
                </div>
              )}
            </div>
          </div>

          {/* Canonical Financial Engine Lock & SOT */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center space-x-2 text-blue-900 font-bold mb-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Canonical Financial Engine</span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Semua perhitungan bersumber dari Single Source of Truth (SOT) V10 dengan audit checksum otomatis.
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                <span className="text-slate-500 block">Metode Pajak</span>
                <span className="font-bold text-slate-800">PPN {taxPercent}% (SNI)</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Accordion/Card */}
          <div className="space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span>Struktur Komponen Biaya</span>
              <span className="text-[10px] text-slate-400 font-mono">{projectRABItems.length} Items</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Biaya Pekerjaan (Cost):</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatCurrency(directCost)}</span>
              </div>
              
              <div className="flex justify-between items-center text-slate-600">
                <span>Pajak Pertambahan Nilai ({taxPercent}%):</span>
                <span className="font-semibold text-slate-900 tabular-nums">+{formatCurrency(taxCost)}</span>
              </div>
            </div>
          </div>

          {/* Category Proportions Top 4 */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 block text-xs">Divisi Pekerjaan Terbesar</span>
            <div className="space-y-1.5">
              {Object.entries(categoryMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([catName, catCost]) => {
                  const pct = directCost > 0 ? (catCost / directCost) * 100 : 0;
                  return (
                    <div key={catName} className="bg-white p-2 rounded-lg border border-slate-200/70">
                      <div className="flex justify-between text-[11px] font-medium text-slate-700 mb-1">
                        <span className="truncate pr-2">{catName}</span>
                        <span className="tabular-nums font-bold text-slate-900">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 space-y-2">
            <span className="font-bold text-slate-800 block text-xs">Aksi Cepat Workspace</span>
            
            <button
              onClick={() => {
                setActiveTab('reports');
              }}
              className="w-full flex items-center justify-between p-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-slate-800 font-semibold transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Cetak / Ekspor PDF</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {onOpenAIEstimator && (
              <button
                onClick={onOpenAIEstimator}
                className="w-full flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-900 font-semibold transition-colors border border-blue-200 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Audit Cerdas dengan AI</span>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

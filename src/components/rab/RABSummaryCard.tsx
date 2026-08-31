import React, { useState } from 'react';
import { Project, RABCalculationResult } from '../../types';
import { formatRupiah, formatNumber, numberToWordsIndo } from '../../utils/formatters';
import {
  Calculator,
  Percent,
  FolderPlus,
  Layers,
  ChevronDown,
  ChevronUp,
  Check,
  Building2,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface RABSummaryCardProps {
  project: Project;
  calc: RABCalculationResult;
  itemCount: number;
  onUpdateProjectRates: (overheadPercent: number, profitPercent: number, taxPercent: number) => void;
  onSaveAsTemplate: () => void;
}

export const RABSummaryCard: React.FC<RABSummaryCardProps> = ({
  project,
  calc,
  itemCount,
  onUpdateProjectRates,
  onSaveAsTemplate,
}) => {
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [overhead, setOverhead] = useState<number>(project.overheadPercent || 5);
  const [profit, setProfit] = useState<number>(project.profitPercent || 10);
  const [tax, setTax] = useState<number>(project.taxPercent || 11);
  const [showCategoryPills, setShowCategoryPills] = useState(false);

  const handleSaveRates = () => {
    const validOverhead = Math.min(100, Math.max(0, Number(overhead) || 0));
    const validProfit = Math.min(100, Math.max(0, Number(profit) || 0));
    const validTax = Math.min(100, Math.max(0, Number(tax) || 0));

    onUpdateProjectRates(validOverhead, validProfit, validTax);
    setIsEditingRates(false);
  };

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800">
              <Calculator className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Rekapitulasi Anggaran & Biaya Proyek
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Akumulasi biaya langsung, persentase overhead, margin profit pelaksana, dan PPN
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditingRates(!isEditingRates)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
              isEditingRates
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{isEditingRates ? 'Tutup Parameter' : 'Ubah % Parameter'}</span>
          </button>

          <button
            onClick={onSaveAsTemplate}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 transition-colors flex items-center space-x-1.5"
            title="Simpan susunan RAB ini sebagai template master"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan Template</span>
          </button>
        </div>
      </div>

      {/* Editable Rates Parameters Form */}
      {isEditingRates && (
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-400" />
              Pengaturan Persentase Biaya Tidak Langsung
            </h4>
            <span className="text-[11px] text-slate-400">Rentang valid: 0% s.d. 100%</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Overhead Proyek (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={overhead}
                  onChange={(e) => setOverhead(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Standar umum: 3% - 8%</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Keuntungan / Profit (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={profit}
                  onChange={(e) => setProfit(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Standar jasa kontraktor: 10% - 15%</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pajak PPN (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-blue-500 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">PPN Indonesia: 11% / 12%</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveRates}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Perubahan Parameter</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Recapitulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Terbilang & Info Pos */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 block">
              Nilai Terbilang (Rupiah Indonesia)
            </span>
            <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 text-xs sm:text-sm font-medium text-slate-200 leading-relaxed italic">
              "{numberToWordsIndo(calc.grandTotal)} Rupiah"
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <span>Jumlah Item Pekerjaan:</span>
              <strong className="text-white">{itemCount} Pos</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Divisi Kategori Terpakai:</span>
              <strong className="text-white">{calc.categorySummaries.length} Divisi</strong>
            </div>
            <button
              onClick={() => setShowCategoryPills(!showCategoryPills)}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1 pt-1"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showCategoryPills ? 'Sembunyikan Rincian Divisi' : 'Lihat Rekapitulasi per Divisi'}</span>
              {showCategoryPills ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Step-by-Step Calculation Table */}
        <div className="lg:col-span-7 bg-slate-800/80 p-5 rounded-xl border border-slate-700/80 space-y-3 text-xs sm:text-sm">
          {/* A. Total Biaya Langsung */}
          <div className="flex justify-between items-center py-1 text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-md bg-blue-950 text-blue-300 border border-blue-800 flex items-center justify-center font-bold text-[10px]">
                A
              </span>
              <span className="font-semibold text-white">Total Biaya Langsung (Direct Cost)</span>
            </div>
            <span className="font-mono font-bold text-white text-sm">
              {formatRupiah(calc.directCost)}
            </span>
          </div>

          {/* B. Overhead */}
          <div className="flex justify-between items-center py-1 text-slate-300 border-t border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                B
              </span>
              <span>Biaya Overhead</span>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded-sm border border-blue-800">
                {project.overheadPercent}%
              </span>
            </div>
            <span className="font-mono text-slate-200">{formatRupiah(calc.overheadCost)}</span>
          </div>

          {/* C. Profit */}
          <div className="flex justify-between items-center py-1 text-slate-300 border-t border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                C
              </span>
              <span>Keuntungan Pelaksana (Profit)</span>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded-sm border border-blue-800">
                {project.profitPercent}%
              </span>
            </div>
            <span className="font-mono text-slate-200">{formatRupiah(calc.profitCost)}</span>
          </div>

          {/* D. Subtotal Biaya Proyek */}
          <div className="flex justify-between items-center py-1.5 text-slate-200 border-t border-slate-700 font-semibold bg-slate-900/40 px-2.5 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-md bg-blue-900 text-blue-200 flex items-center justify-center font-bold text-[10px]">
                D
              </span>
              <span>Subtotal Biaya Proyek (A + B + C)</span>
            </div>
            <span className="font-mono font-bold text-white">
              {formatRupiah(calc.directCost + calc.overheadCost + calc.profitCost)}
            </span>
          </div>

          {/* E. Pajak PPN */}
          <div className="flex justify-between items-center py-1 text-slate-300 border-t border-slate-700/60">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-md bg-slate-900 text-slate-300 border border-slate-700 flex items-center justify-center font-bold text-[10px]">
                E
              </span>
              <span>Pajak Pertambahan Nilai (PPN)</span>
              <span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded-sm border border-blue-800">
                {project.taxPercent}%
              </span>
            </div>
            <span className="font-mono text-slate-200">{formatRupiah(calc.taxCost)}</span>
          </div>

          {/* GRAND TOTAL */}
          <div className="flex justify-between items-center pt-3 border-t-2 border-blue-500">
            <div>
              <div className="text-xs sm:text-sm font-black text-white uppercase tracking-tight">
                Grand Total RAB (Nilai Kontrak)
              </div>
              <div className="text-[11px] text-slate-400">Total Keseluruhan Termasuk Pajak</div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-blue-400 font-mono tracking-tight">
              {formatRupiah(calc.grandTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Category Breakdown Pills */}
      {showCategoryPills && (
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-bold text-slate-300 mb-3 flex items-center justify-between">
            <span>Rincian Biaya per Divisi Pekerjaan</span>
            <span>100% Bobot Biaya Langsung</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {calc.categorySummaries.map((cat, idx) => (
              <div
                key={cat.category}
                className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-white truncate">
                    {idx + 1}. {cat.category}
                  </div>
                  <div className="text-[10px] text-slate-400">{cat.itemCount} item</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-slate-200 font-mono">
                    {formatRupiah(cat.subtotal)}
                  </div>
                  <div className="text-[11px] font-black text-blue-400">
                    {formatNumber(cat.weightPercent, 2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

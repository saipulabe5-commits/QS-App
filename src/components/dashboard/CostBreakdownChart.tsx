import React, { useState } from 'react';
import { PieChart, Layers, HardHat, Wrench, ShieldAlert, BadgePercent, Receipt, Info } from 'lucide-react';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { CostStructureBreakdown } from '../../utils/calculations';

interface CostBreakdownChartProps {
  portfolioBreakdown: CostStructureBreakdown;
  selectedProjectBreakdown: CostStructureBreakdown | null;
  selectedProjectName?: string;
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  portfolioBreakdown,
  selectedProjectBreakdown,
  selectedProjectName,
}) => {
  const [scope, setScope] = useState<'selected' | 'portfolio'>(
    selectedProjectBreakdown ? 'selected' : 'portfolio'
  );

  const data =
    scope === 'selected' && selectedProjectBreakdown
      ? selectedProjectBreakdown
      : portfolioBreakdown;

  const titleScope =
    scope === 'selected' && selectedProjectName
      ? selectedProjectName
      : 'Akumulasi Seluruh Proyek (Portofolio)';

  // Data komponen biaya
  const costItems = [
    {
      id: 'material',
      name: 'Material / Bahan',
      cost: data.materialCost,
      percent: data.materialPercent,
      color: 'bg-blue-600',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-50 border-blue-200',
      icon: Layers,
      description: 'Semen, pasir, bata, besi beton, granit, atap, cat, dll.',
    },
    {
      id: 'labor',
      name: 'Tenaga Kerja / Upah',
      cost: data.laborCost,
      percent: data.laborPercent,
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-200',
      icon: HardHat,
      description: 'Upah pekerja, tukang batu/kayu/besi, kepala tukang, mandor.',
    },
    {
      id: 'equipment',
      name: 'Peralatan & Rental',
      cost: data.equipmentCost,
      percent: data.equipmentPercent,
      color: 'bg-amber-600',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-200',
      icon: Wrench,
      description: 'Molen cor, stamper, scaffolding, vibrator, dump truck.',
    },
    {
      id: 'overhead',
      name: 'Biaya Overhead',
      cost: data.overheadCost,
      percent: data.overheadPercent,
      color: 'bg-indigo-600',
      textColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-50 border-indigo-200',
      icon: ShieldAlert,
      description: 'Operasional kantor, administrasi lapangan, listrik & air kerja.',
    },
    {
      id: 'profit',
      name: 'Profit Kontraktor',
      cost: data.profitCost,
      percent: data.profitPercent,
      color: 'bg-sky-600',
      textColor: 'text-sky-700',
      badgeBg: 'bg-sky-50 border-sky-200',
      icon: BadgePercent,
      description: 'Keuntungan jasa pemborong / kontraktor pelaksana.',
    },
    {
      id: 'tax',
      name: 'Pajak (PPN)',
      cost: data.taxCost,
      percent: data.taxPercent,
      color: 'bg-slate-700',
      textColor: 'text-[var(--text-primary)]',
      badgeBg: 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)]',
      icon: Receipt,
      description: 'Pajak Pertambahan Nilai (PPN) resmi negara.',
    },
  ].filter(c => c.cost > 0);

  return (
    <div className="bg-[var(--bg-elevated)] p-5 sm:p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs">
      {/* Header & Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Grafik Komposisi & Struktur Biaya
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rincian alokasi anggaran: Material, Tenaga Kerja, Alat, Overhead, Profit, & Pajak
          </p>
        </div>

        {/* Scope Selector Button Group */}
        <div className="flex items-center bg-[var(--bg-elevated-hover)] p-1 rounded-xl border border-[var(--border-primary)] text-xs font-semibold">
          {selectedProjectBreakdown && (
            <button
              onClick={() => setScope('selected')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                scope === 'selected'
                  ? 'bg-[var(--bg-elevated)] text-blue-700 shadow-2xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Proyek Terpilih
            </button>
          )}
          <button
            onClick={() => setScope('portfolio')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              scope === 'portfolio'
                ? 'bg-[var(--bg-elevated)] text-blue-700 shadow-2xs font-bold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Semua Proyek
          </button>
        </div>
      </div>

      {/* Target Project Label & Total Value Indicator */}
      <div className="mt-4 p-3.5 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-md">
            Menganalisis: <strong className="text-[var(--text-primary)]">{titleScope}</strong>
          </span>
        </div>
        <div className="text-right flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-slate-500">Grand Total RAB:</span>
          <span className="text-sm font-black text-blue-700">
            {formatRupiah(data.grandTotal)}
          </span>
        </div>
      </div>

      {/* Segmented Cost Bar Graph */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-semibold mb-2">
          <span>Distribusi Proporsi Visual</span>
          <span>100% Anggaran</span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-5 rounded-lg bg-[var(--bg-elevated-hover)] p-0.5 border border-[var(--border-primary)] flex overflow-hidden">
          {costItems.map((item) => {
            const widthPct = Math.max(0, item.percent);
            if (widthPct === 0) return null;
            return (
              <div
                key={item.id}
                title={`${item.name}: ${formatNumber(item.percent, 1)}% (${formatRupiah(item.cost)})`}
                className={`${item.color} h-full transition-all duration-300 first:rounded-l-md last:rounded-r-md cursor-pointer hover:opacity-90`}
                style={{ width: `${widthPct}%` }}
              />
            );
          })}
        </div>

        {/* Mini Legend Row below the bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] text-[var(--text-secondary)] font-medium">
          {costItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-xs ${item.color}`} />
              <span>{item.name}</span>
              <span className="font-bold text-[var(--text-primary)]">
                ({formatNumber(item.percent, 1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Cost Grid Cards (6 Component Breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-6">
        {costItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border ${item.badgeBg} flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-7 h-7 rounded-lg ${item.color} text-white flex items-center justify-center`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <span className={`text-xs font-black ${item.textColor}`}>
                    {formatNumber(item.percent, 1)}%
                  </span>
                </div>
                <div className="mt-3 text-sm sm:text-base font-black text-[var(--text-primary)]">
                  {formatRupiah(item.cost)}
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500 leading-tight">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

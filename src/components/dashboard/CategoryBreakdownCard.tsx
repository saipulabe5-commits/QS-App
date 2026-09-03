import React, { useState } from 'react';
import { ArrowRight, Layers, Search, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { CategorySummary } from '../../types';

interface CategoryBreakdownCardProps {
  categorySummaries: CategorySummary[];
  onNavigateToRAB: () => void;
  selectedProjectName?: string;
}

export const CategoryBreakdownCard: React.FC<CategoryBreakdownCardProps> = ({
  categorySummaries,
  onNavigateToRAB,
  selectedProjectName,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'cost' | 'name'>('cost');

  const filteredCategories = (categorySummaries || [])
    .filter((cat) =>
      cat.category.toLowerCase().includes(searchTerm.toLowerCase().trim())
    )
    .sort((a, b) => {
      if (sortBy === 'cost') return b.subtotal - a.subtotal;
      return a.category.localeCompare(b.category);
    });

  const totalCost = (categorySummaries || []).reduce((sum, c) => sum + c.subtotal, 0);

  return (
    <div className="bg-[var(--bg-elevated)] p-5 sm:p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Ringkasan Biaya per Kategori
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {selectedProjectName ? `Proyek: ${selectedProjectName}` : 'Distribusi anggaran divisi pekerjaan'}
            </p>
          </div>

          <button
            onClick={onNavigateToRAB}
            className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center space-x-1.5 self-start sm:self-auto bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Kelola di RAB</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter & Sort Controls */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kategori pekerjaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-colors"
            />
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'cost' ? 'name' : 'cost')}
            className="flex items-center space-x-1 px-2.5 py-1.5 text-xs bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] rounded-lg border border-[var(--border-primary)] font-medium transition-colors"
            title="Ubah Urutan"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">
              {sortBy === 'cost' ? 'Biaya Tertinggi' : 'Nama A-Z'}
            </span>
          </button>
        </div>

        {/* Category List */}
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-secondary)] text-xs">
            {categorySummaries.length === 0
              ? 'Belum ada rincian item pekerjaan di proyek ini.'
              : 'Tidak ada kategori yang cocok dengan pencarian.'}
          </div>
        ) : (
          <div className="mt-4 space-y-3.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredCategories.map((cat, index) => {
              const pct = totalCost > 0 ? (cat.subtotal / totalCost) * 100 : 0;
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 font-semibold text-[var(--text-primary)]">
                      <span className="text-[11px] text-[var(--text-secondary)] font-mono w-4">
                        {index + 1}.
                      </span>
                      <span className="truncate max-w-[180px] sm:max-w-[240px]">
                        {cat.category}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-normal">
                        ({cat.itemCount} item)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-right">
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatRupiah(cat.subtotal)}
                      </span>
                      <span className="text-xs font-black text-blue-700 w-12 text-right">
                        {formatNumber(pct, 1)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar without gradient */}
                  <div className="w-full bg-[var(--bg-elevated-hover)] rounded-full h-2 overflow-hidden border border-[var(--border-primary)]">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subtotal Summary Footer */}
      {categorySummaries.length > 0 && (
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            Total Biaya Langsung ({categorySummaries.length} Divisi):
          </span>
          <span className="font-bold text-[var(--text-primary)] text-sm">
            {formatRupiah(totalCost)}
          </span>
        </div>
      )}
    </div>
  );
};

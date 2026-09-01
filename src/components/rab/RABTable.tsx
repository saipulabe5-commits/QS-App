import React, { useState } from 'react';
import { RABItem, RABCategory, RABCalculationResult, RAB_CATEGORIES } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import {
  Edit2,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface RABTableProps {
  items: RABItem[];
  calc: RABCalculationResult;
  selectedCategoryFilter: string;
  searchQuery: string;
  onAddItem: (categoryName?: string) => void;
  onEditItem: (item: RABItem) => void;
  onDuplicateItem: (item: RABItem) => void;
  onDeleteItem: (item: RABItem) => void;
}

export const RABTable: React.FC<RABTableProps> = ({
  items,
  calc,
  selectedCategoryFilter,
  searchQuery,
  onAddItem,
  onEditItem,
  onDuplicateItem,
  onDeleteItem,
}) => {
  // Collapsed categories tracking
  const [collapsedCategories, setCollapsedCategories] = useState<{ [cat: string]: boolean }>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Determine categories in use
  const categoriesInUse = Array.from(new Set(items.map((i) => i.category)));
  const orderedCategories: RABCategory[] = [...RAB_CATEGORIES].filter((cat) =>
    categoriesInUse.includes(cat)
  );
  categoriesInUse.forEach((cat) => {
    if (!orderedCategories.includes(cat as RABCategory)) {
      orderedCategories.push(cat as RABCategory);
    }
  });

  const romanNumerals = [
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  ];

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Tidak Ada Item Pekerjaan</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          {searchQuery || selectedCategoryFilter !== 'all'
            ? 'Tidak ditemukan pos pekerjaan yang sesuai dengan kriteria pencarian / filter Anda.'
            : 'Mulai susun RAB dengan menambahkan uraian pekerjaan atau gunakan template standar.'}
        </p>
        <button
          onClick={() => onAddItem()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors"
        >
          + Tambah Item Pekerjaan
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-900 text-white font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3.5 w-12 text-center">No</th>
              <th className="px-3 py-3.5 w-24">Kode</th>
              <th className="px-4 py-3.5 min-w-[240px]">Uraian Pekerjaan</th>
              <th className="px-3 py-3.5 w-20 text-center">Satuan</th>
              <th className="px-3 py-3.5 w-24 text-right">Volume</th>
              <th className="px-4 py-3.5 w-32 text-right">Harga Satuan (Rp)</th>
              <th className="px-4 py-3.5 w-36 text-right">Jumlah Biaya (Rp)</th>
              <th className="px-3 py-3.5 w-24 text-right">Bobot (%)</th>
              <th className="px-3 py-3.5 min-w-[140px]">Keterangan</th>
              <th className="px-4 py-3.5 w-28 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orderedCategories
              .filter((cat) =>
                selectedCategoryFilter === 'all' ? true : cat === selectedCategoryFilter
              )
              .map((cat, catIdx) => {
                const catItems = items.filter((it) => it.category === cat);
                if (catItems.length === 0) return null;

                const catSubtotal = catItems.reduce((s, it) => s + (it.volume * it.unitPrice), 0);
                const catWeight =
                  calc.directCost > 0 ? (catSubtotal / calc.directCost) * 100 : 0;
                const romanNum = romanNumerals[catIdx] || String(catIdx + 1);
                const isCollapsed = Boolean(collapsedCategories[cat]);

                return (
                  <React.Fragment key={cat}>
                    {/* Category Divider Header Row (SUB-TOTAL) */}
                    <tr className="bg-slate-300 hover:bg-slate-400/80 text-slate-900 font-bold border-y-2 border-slate-400 transition-colors shadow-2xs">
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded bg-blue-700 text-white font-mono text-xs font-black shadow-2xs">
                          {romanNum}
                        </span>
                      </td>
                      <td colSpan={5} className="px-3 py-2.5">
                        <div className="flex items-center space-x-2.5">
                          <button
                            onClick={() => toggleCategory(cat)}
                            className="p-1 rounded-md hover:bg-slate-400/60 text-slate-800 transition-colors"
                            title={isCollapsed ? 'Buka Divisi' : 'Lipat Divisi'}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <span className="uppercase tracking-wider text-xs sm:text-[13px] font-black text-slate-950">
                            {cat}
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 bg-white/90 px-2 py-0.5 rounded-full border border-slate-400 shadow-2xs">
                            {catItems.length} pos
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-950 font-mono text-xs sm:text-sm">
                        {formatRupiah(catSubtotal)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-blue-900 font-mono text-xs">
                        <span className="px-2 py-0.5 bg-white/95 text-blue-900 rounded border border-slate-400 shadow-2xs">
                          {formatNumber(catWeight, 2)}%
                        </span>
                      </td>
                      <td colSpan={2} className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => onAddItem(cat)}
                          className="text-[11px] font-bold text-slate-900 hover:text-blue-900 bg-white hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-400 hover:border-blue-500 transition-colors shadow-2xs inline-flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3 text-blue-700" />
                          <span>Item {cat.split(':')[0]}</span>
                        </button>
                      </td>
                    </tr>

                    {/* Items under this category (if not collapsed) */}
                    {!isCollapsed &&
                      catItems.map((item, itemIdx) => {
                        const totalCost = item.volume * item.unitPrice;
                        const itemWeight =
                          calc.directCost > 0 ? (totalCost / calc.directCost) * 100 : 0;
                        const prevItem = itemIdx > 0 ? catItems[itemIdx - 1] : null;
                        const isNewFloor = Boolean(item.floor && (!prevItem || prevItem.floor !== item.floor));
                        const isNewSubcategory = Boolean(item.subcategory && (!prevItem || prevItem.subcategory !== item.subcategory || isNewFloor));

                        return (
                          <React.Fragment key={item.id}>
                            {/* Floor / Level Header */}
                            {isNewFloor && (
                              <tr className="bg-gradient-to-r from-blue-100/90 via-blue-50/70 to-slate-50 border-y-2 border-blue-300/80">
                                <td colSpan={10} className="px-4 py-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-700 text-white rounded-md shadow-2xs">
                                      LANTAI
                                    </span>
                                    <span className="font-black text-xs text-blue-950 uppercase tracking-wide">
                                      {item.floor}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {/* Subcategory Header */}
                            {isNewSubcategory && (
                              <tr className="bg-slate-100/90 border-y border-slate-200">
                                <td colSpan={10} className="px-4 py-1.5 pl-8 bg-slate-50/90">
                                  <div className="flex items-center space-x-2 text-slate-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                    <span className="font-bold text-[11px] text-slate-800 tracking-wide uppercase">
                                      {item.subcategory}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}

                            <tr className="hover:bg-blue-50/50 transition-colors group">
                              {/* Nomor Item */}
                              <td className="px-3 py-3 text-center text-slate-400 font-mono text-[11px]">
                                {itemIdx + 1}
                              </td>

                              {/* Kode Pekerjaan */}
                              <td className="px-3 py-3 font-mono font-semibold text-slate-700 text-[11px]">
                                {item.code}
                              </td>

                              {/* Uraian Pekerjaan */}
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900 text-xs leading-snug">
                                  {item.name}
                                </div>
                              </td>

                              {/* Satuan */}
                              <td className="px-3 py-3 text-center font-medium text-slate-700">
                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] text-slate-700 font-medium">
                                  {item.unit}
                                </span>
                              </td>

                              {/* Volume */}
                              <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                                {formatNumber(item.volume, 2)}
                              </td>

                              {/* Harga Satuan */}
                              <td className="px-4 py-3 text-right font-mono text-slate-700">
                                {formatRupiah(item.unitPrice)}
                              </td>

                              {/* Jumlah Biaya = Volume × Harga Satuan */}
                              <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                                {formatRupiah(totalCost)}
                              </td>

                              {/* Bobot Pekerjaan (%) */}
                              <td className="px-3 py-3 text-right font-mono font-bold text-blue-700 text-[11px]">
                                {formatNumber(itemWeight, 2)}%
                              </td>

                              {/* Keterangan */}
                              <td
                                className="px-3 py-3 text-[11px] text-slate-500 truncate max-w-[150px]"
                                title={item.notes || '-'}
                              >
                                {item.notes || '-'}
                              </td>

                              {/* Aksi */}
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() => onEditItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Item"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDuplicateItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Duplikat Item"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteItem(item)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Hapus Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
          </tbody>

          {/* Table Footer: Total Biaya Langsung */}
          <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
            <tr>
              <td colSpan={6} className="px-4 py-2 text-right uppercase tracking-wider text-xs">
                Total Biaya Langsung Pekerjaan (Direct Cost):
              </td>
              <td className="px-4 py-2 text-right font-black text-sm text-slate-900 font-mono">
                {formatRupiah(calc.directCost)}
              </td>
              <td className="px-3 py-2 text-right font-black text-xs text-blue-700 font-mono">
                100,00%
              </td>
              <td colSpan={2} className="px-3 py-2 text-[11px] text-slate-500 font-normal">
                {items.length} Pos Pekerjaan
              </td>
            </tr>

            {/* Tax */}
            {calc.taxCost > 0 && (
              <tr className="bg-slate-50 text-slate-700 font-semibold border-t border-slate-200">
                <td colSpan={6} className="px-4 py-1.5 text-right uppercase text-xs">
                  Pajak Pertambahan Nilai / PPN ({calc.taxPercent}%)
                </td>
                <td className="px-4 py-1.5 text-right font-mono text-sm text-slate-800">
                  {formatRupiah(calc.taxCost)}
                </td>
                <td colSpan={3} className="px-3 py-1.5"></td>
              </tr>
            )}

            {/* Grand Total */}
            <tr className="bg-slate-200 font-black border-t-2 border-slate-400 text-slate-900">
              <td colSpan={6} className="px-4 py-3 text-right uppercase tracking-wider text-sm">
                GRAND TOTAL NILAI RAB:
              </td>
              <td className="px-4 py-3 text-right font-black text-lg text-blue-900 font-mono">
                {formatRupiah(calc.grandTotal)}
              </td>
              <td colSpan={3} className="px-3 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

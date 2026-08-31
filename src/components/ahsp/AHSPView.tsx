import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AHSPItem,
  AHSP_CATEGORIES,
  AHSP_CATEGORY_DEFINITIONS,
  AHSPCategory,
  RABCategory,
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { normalizeCategory } from '../../utils/normalizers';
import { AHSPModal } from './AHSPModal';
import { ConfirmModal } from '../layout/ConfirmModal';
import {
  Plus,
  Search,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Info,
  FolderTree,
  LayoutList,
  Filter,
  Check,
  Building,
  Home,
  Hammer,
  Paintbrush,
  Droplets,
  Zap,
  Trees,
  DoorOpen,
  Maximize2,
  Grid,
  Box,
  Compass,
  ArrowUpDown,
  BookOpen,
  RefreshCw,
  Database,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  'Pekerjaan Persiapan': Compass,
  'Pekerjaan Tanah & Pondasi': Layers,
  'Pekerjaan Struktur Beton': Box,
  'Pekerjaan Struktur Baja': Hammer,
  'Pekerjaan Pasangan & Dinding': Building,
  'Pekerjaan Pintu, Jendela & Kaca': DoorOpen,
  'Pekerjaan Penutup Atap': Home,
  'Pekerjaan Plafon': Maximize2,
  'Pekerjaan Penutup Lantai': Grid,
  'Pekerjaan Pengecatan': Paintbrush,
  'Pekerjaan Sanitasi & Plumbing': Droplets,
  'Pekerjaan Elektrikal': Zap,
  'Pekerjaan Landscape & Eksterior': Trees,
};

export const AHSPView: React.FC = () => {
  const {
    ahspItems,
    deleteAHSPItem,
    addRABItem,
    syncAHSPWithPriceDatabase,
    exportAHSPComponentsToPriceDatabase,
    selectedProject,
    showToast,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [expandedCategories, setExpandedCategories] = useState<{ [cat: string]: boolean }>({
    'Pekerjaan Persiapan': true,
    'Pekerjaan Tanah & Pondasi': true,
    'Pekerjaan Struktur Beton': true,
    'Pekerjaan Pasangan & Dinding': true,
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<AHSPItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<AHSPItem | null>(null);

  // Insert to RAB quick modal state
  const [itemToInsert, setItemToInsert] = useState<AHSPItem | null>(null);
  const [insertVolume, setInsertVolume] = useState<number | string>(1);

  // Category counts and subcategories computed from actual items
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    const subCatsByCat: Record<string, Set<string>> = {};

    AHSP_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
      subCatsByCat[cat] = new Set();
    });

    ahspItems.forEach((item) => {
      const cat = item.category || 'Lain-lain';
      counts[cat] = (counts[cat] || 0) + 1;
      if (item.subCategory) {
        if (!subCatsByCat[cat]) subCatsByCat[cat] = new Set();
        subCatsByCat[cat].add(item.subCategory);
      }
    });

    return { counts, subCatsByCat };
  }, [ahspItems]);

  // Subcategories available for active filter
  const currentSubCategories = useMemo(() => {
    if (selectedCategory === 'all') {
      const allSubs = new Set<string>();
      ahspItems.forEach((i) => {
        if (i.subCategory) allSubs.add(i.subCategory);
      });
      return Array.from(allSubs);
    }
    const catSet = categoryStats.subCatsByCat[selectedCategory];
    return catSet ? Array.from(catSet) : [];
  }, [selectedCategory, ahspItems, categoryStats]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return ahspItems.filter((item) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.components.some((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCat =
        selectedCategory === 'all' || item.category === selectedCategory;

      const matchSub =
        selectedSubCategory === 'all' || item.subCategory === selectedSubCategory;

      return matchSearch && matchCat && matchSub;
    });
  }, [ahspItems, searchQuery, selectedCategory, selectedSubCategory]);

  // Grouped items by category
  const groupedItems = useMemo(() => {
    const groups: { category: string; meta?: any; items: AHSPItem[] }[] = [];

    // Order by standard AHSP_CATEGORIES
    const presentCategories = Array.from(
      new Set([...AHSP_CATEGORIES, ...ahspItems.map((i) => i.category)])
    );

    presentCategories.forEach((cat) => {
      const itemsInCat = filteredItems.filter((i) => i.category === cat);
      if (itemsInCat.length > 0 || (selectedCategory === cat && filteredItems.length === 0)) {
        groups.push({
          category: cat,
          meta: AHSP_CATEGORY_DEFINITIONS[cat as AHSPCategory],
          items: itemsInCat,
        });
      }
    });

    return groups;
  }, [filteredItems, ahspItems, selectedCategory]);

  const toggleCategoryExpand = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleExpandAll = () => {
    const allExpanded: { [cat: string]: boolean } = {};
    AHSP_CATEGORIES.forEach((cat) => {
      allExpanded[cat] = true;
    });
    setExpandedCategories(allExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  const handleEdit = (item: AHSPItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteAHSPItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleInsertToRAB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToInsert || !selectedProject) return;

    const vol = Math.max(0.01, Number(insertVolume) || 1);
    const mappedCategory = normalizeCategory(itemToInsert.category);

    addRABItem({
      projectId: selectedProject.id,
      code: itemToInsert.code,
      name: itemToInsert.name,
      category: mappedCategory,
      unit: itemToInsert.unit,
      volume: vol,
      unitPrice: itemToInsert.unitPrice,
      notes: itemToInsert.notes || `Analisis SNI 2026 (${itemToInsert.category})`,
    });

    setItemToInsert(null);
    setInsertVolume(1);
    showToast(
      'Dimasukkan ke RAB',
      `"${itemToInsert.name}" (${vol} ${itemToInsert.unit}) berhasil ditambahkan ke RAB ${selectedProject.name} pada ${mappedCategory}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Standar SNI 2026 & Permen PUPR Terklasifikasi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Analisis Harga Satuan Pekerjaan (AHSP)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Katalog lengkap {ahspItems.length} rincian koefisien bahan, upah tenaga kerja (OH), dan alat berat yang dikelompokkan secara terstruktur berdasarkan 13 kategori divisi pekerjaan konstruksi termasuk pekerjaan infrastruktur jalan perumahan.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 flex-shrink-0">
            <div className="text-left md:text-right">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Koleksi AHSP
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                {ahspItems.length}{' '}
                <span className="text-xs font-normal text-blue-300">Analisis Item</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setIsSyncing(true);
                  try {
                    syncAHSPWithPriceDatabase();
                  } finally {
                    setTimeout(() => setIsSyncing(false), 500);
                  }
                }}
                disabled={isSyncing}
                title="Perbarui seluruh harga satuan komponen AHSP mengikuti harga terbaru di Database Harga"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sinkron Database</span>
              </button>

              <button
                onClick={() => {
                  exportAHSPComponentsToPriceDatabase();
                }}
                title="Salin seluruh komponen bahan/upah/alat dari AHSP yang belum terdaftar ke Database Harga"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
              >
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Ekspor ke DB</span>
              </button>

              <button
                onClick={() => {
                  setItemToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah AHSP</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Slider / Quick Navigator */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <FolderTree className="w-4 h-4 text-blue-600" />
            <span>Kategori Pekerjaan Konstruksi ({AHSP_CATEGORIES.length})</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium flex items-center space-x-1.5 transition-colors"
            >
              {viewMode === 'grouped' ? (
                <>
                  <LayoutList className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mode Daftar</span>
                </>
              ) : (
                <>
                  <FolderTree className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mode Kelompok</span>
                </>
              )}
            </button>

            {viewMode === 'grouped' && (
              <div className="hidden sm:flex items-center space-x-1">
                <button
                  onClick={handleExpandAll}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                >
                  Buka Semua
                </button>
                <span className="text-slate-300">&bull;</span>
                <button
                  onClick={handleCollapseAll}
                  className="px-2 py-1 text-[11px] text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded"
                >
                  Tutup Semua
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category & Subcategory Dropdowns */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {/* Category Dropdown */}
          <div className="relative w-full sm:w-72">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubCategory('all');
              }}
              className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border-2 border-blue-500 rounded-xl text-slate-700 font-medium text-sm focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm hover:border-blue-600"
            >
              <option value="all">Semua Kategori Pekerjaan</option>
              {AHSP_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Subcategories Dropdown (Only show if active category has subcategories) */}
          {currentSubCategories.length > 0 && (
            <div className="relative w-full sm:w-72">
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-medium text-sm focus:outline-hidden focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all cursor-pointer hover:border-slate-300"
              >
                <option value="all">Semua Sub-pekerjaan</option>
                {currentSubCategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari analisis (misal: Pondasi, Beton K225, Plesteran, Granit, Pipa)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end text-xs text-slate-500">
          <div>
            Menampilkan <strong>{filteredItems.length}</strong> dari <strong>{ahspItems.length}</strong> item
          </div>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubCategory('all');
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Grouped by Category OR List View */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ditemukan Analisis AHSP</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ganti kata kunci pencarian atau pilih kategori pekerjaan lainnya.
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* ================= GROUPED BY CATEGORY VIEW ================= */
        <div className="space-y-6">
          {groupedItems.map((group, groupIdx) => {
            const IconComp = CATEGORY_ICONS[group.category] || Layers;
            const isCatExpanded = expandedCategories[group.category] ?? true;
            const def = group.meta || AHSP_CATEGORY_DEFINITIONS[group.category as AHSPCategory];

            return (
              <div
                key={group.category}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Category Header Bar */}
                <div
                  onClick={() => toggleCategoryExpand(group.category)}
                  className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/80 to-white hover:bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {def?.codePrefix || `DIVISI 0${groupIdx + 1}`}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">
                          {group.category}
                        </h3>
                      </div>
                      {def?.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {def.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-slate-200/80 text-slate-700 rounded-lg text-xs font-bold font-mono">
                      {group.items.length} Item
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
                    >
                      {isCatExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Category Items List */}
                {isCatExpanded && (
                  <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-2">
                    {group.items.map((item) => (
                      <AHSPItemCard
                        key={item.id}
                        item={item}
                        isExpanded={expandedId === item.id}
                        onToggleExpand={() =>
                          setExpandedId(expandedId === item.id ? null : item.id)
                        }
                        onEdit={() => handleEdit(item)}
                        onDelete={() => setItemToDelete(item)}
                        onInsertToRAB={() => {
                          setItemToInsert(item);
                          setInsertVolume(1);
                        }}
                        hasActiveProject={Boolean(selectedProject)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT LIST VIEW ================= */
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <AHSPItemCard
                item={item}
                isExpanded={expandedId === item.id}
                onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                onEdit={() => handleEdit(item)}
                onDelete={() => setItemToDelete(item)}
                onInsertToRAB={() => {
                  setItemToInsert(item);
                  setInsertVolume(1);
                }}
                hasActiveProject={Boolean(selectedProject)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AHSPModal
        isOpen={isModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Hapus Analisis AHSP?"
        message={`Apakah Anda yakin ingin menghapus analisis harga satuan "${itemToDelete?.name}"?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Quick Insert to Project RAB Dialog */}
      {itemToInsert && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setItemToInsert(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              Masukkan ke RAB Proyek
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan item ini ke proyek aktif <strong>"{selectedProject.name}"</strong>
            </p>

            <form onSubmit={handleInsertToRAB} className="mt-4 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    {itemToInsert.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {itemToInsert.category}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-800">{itemToInsert.name}</div>
                <div className="text-xs text-blue-700 font-mono font-semibold pt-1">
                  Harga Satuan: {formatRupiah(itemToInsert.unitPrice)} / {itemToInsert.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume Pekerjaan ({itemToInsert.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  autoFocus
                  value={insertVolume}
                  onChange={(e) => setInsertVolume(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-900">Total Biaya Pos Ini:</span>
                <span className="text-sm font-black text-blue-900 font-mono">
                  {formatRupiah((Number(insertVolume) || 0) * itemToInsert.unitPrice)}
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setItemToInsert(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Tambahkan ke RAB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface AHSPItemCardProps {
  item: AHSPItem;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onInsertToRAB: () => void;
  hasActiveProject: boolean;
}

const AHSPItemCard: React.FC<AHSPItemCardProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onInsertToRAB,
  hasActiveProject,
}) => {
  const matComps = item.components.filter((c) => c.type === 'material');
  const laborComps = item.components.filter((c) => c.type === 'labor');
  const eqComps = item.components.filter((c) => c.type === 'equipment');

  const totalMat = matComps.reduce((s, c) => s + c.totalCost, 0);
  const totalLab = laborComps.reduce((s, c) => s + c.totalCost, 0);
  const totalEq = eqComps.reduce((s, c) => s + c.totalCost, 0);

  return (
    <div className="rounded-xl border border-slate-100 hover:border-blue-200 bg-white overflow-hidden transition-all">
      {/* Header Row */}
      <div className="p-4 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
            {item.unit}
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                {item.code}
              </span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {item.category}
              </span>
              {item.subCategory && (
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.subCategory}
                </span>
              )}
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1 leading-snug">
              {item.name}
            </h3>
            {item.notes && (
              <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-4 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="text-left md:text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Harga Satuan Pekerjaan
            </div>
            <div className="text-sm sm:text-base font-black text-blue-900 font-mono">
              {formatRupiah(item.unitPrice)}{' '}
              <span className="text-xs font-normal text-slate-500">/ {item.unit}</span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {hasActiveProject && (
              <button
                onClick={onInsertToRAB}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center space-x-1"
                title="Gunakan ke RAB Proyek Aktif"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ RAB</span>
              </button>
            )}

            <button
              onClick={onEdit}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Analisis"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleExpand}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title={isExpanded ? 'Tutup Rincian Koefisien' : 'Lihat Rincian Koefisien'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Components Details */}
      {isExpanded && (
        <div className="bg-slate-50/70 p-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2">Unsur / Komponen</th>
                  <th className="px-3 py-2">Nama Bahan / Upah / Alat</th>
                  <th className="px-2 py-2 text-center">Satuan</th>
                  <th className="px-3 py-2 text-right">Koefisien</th>
                  <th className="px-4 py-2 text-right">Harga Satuan (Rp)</th>
                  <th className="px-4 py-2 text-right">Jumlah Biaya (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {/* A. Tenaga Kerja */}
                {laborComps.length > 0 && (
                  <>
                    <tr className="bg-slate-50/90 font-bold text-slate-800">
                      <td colSpan={5} className="px-4 py-1.5 text-[11px]">
                        A. TENAGA KERJA (UPAH)
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-900">
                        {formatRupiah(totalLab)}
                      </td>
                    </tr>
                    {laborComps.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-1 text-slate-400 pl-8">&bull; Tenaga</td>
                        <td className="px-3 py-1 font-medium text-slate-800">{c.name}</td>
                        <td className="px-2 py-1 text-center">{c.unit}</td>
                        <td className="px-3 py-1 text-right font-mono">{formatNumber(c.coefficient, 4)}</td>
                        <td className="px-4 py-1 text-right font-mono">{formatRupiah(c.unitPrice)}</td>
                        <td className="px-4 py-1 text-right font-mono font-semibold text-slate-800">{formatRupiah(c.totalCost)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* B. Bahan / Material */}
                {matComps.length > 0 && (
                  <>
                    <tr className="bg-slate-50/90 font-bold text-slate-800">
                      <td colSpan={5} className="px-4 py-1.5 text-[11px]">
                        B. BAHAN / MATERIAL
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-900">
                        {formatRupiah(totalMat)}
                      </td>
                    </tr>
                    {matComps.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-1 text-slate-400 pl-8">&bull; Bahan</td>
                        <td className="px-3 py-1 font-medium text-slate-800">{c.name}</td>
                        <td className="px-2 py-1 text-center">{c.unit}</td>
                        <td className="px-3 py-1 text-right font-mono">{formatNumber(c.coefficient, 4)}</td>
                        <td className="px-4 py-1 text-right font-mono">{formatRupiah(c.unitPrice)}</td>
                        <td className="px-4 py-1 text-right font-mono font-semibold text-slate-800">{formatRupiah(c.totalCost)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* C. Peralatan */}
                {eqComps.length > 0 && (
                  <>
                    <tr className="bg-slate-50/90 font-bold text-slate-800">
                      <td colSpan={5} className="px-4 py-1.5 text-[11px]">
                        C. PERALATAN
                      </td>
                      <td className="px-4 py-1.5 text-right font-mono text-slate-900">
                        {formatRupiah(totalEq)}
                      </td>
                    </tr>
                    {eqComps.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-1 text-slate-400 pl-8">&bull; Alat</td>
                        <td className="px-3 py-1 font-medium text-slate-800">{c.name}</td>
                        <td className="px-2 py-1 text-center">{c.unit}</td>
                        <td className="px-3 py-1 text-right font-mono">{formatNumber(c.coefficient, 4)}</td>
                        <td className="px-4 py-1 text-right font-mono">{formatRupiah(c.unitPrice)}</td>
                        <td className="px-4 py-1 text-right font-mono font-semibold text-slate-800">{formatRupiah(c.totalCost)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Grand Total Row */}
                <tr className="bg-slate-900 text-white font-bold text-xs">
                  <td colSpan={5} className="px-4 py-2 uppercase tracking-wide">
                    Total Harga Satuan Pekerjaan (A + B + C)
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-blue-300 font-black">
                    {formatRupiah(item.unitPrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

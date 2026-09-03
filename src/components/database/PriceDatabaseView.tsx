import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceItem, ItemType, RABCategory } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { exportPriceDatabaseToCSV, parsePriceCSV } from '../../utils/exportHelpers';
import { PriceItemModal } from './PriceItemModal';
import { ConfirmModal } from '../layout/ConfirmModal';
import {
  Plus,
  Search,
  Upload,
  Download,
  Database,
  Edit2,
  Trash2,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const PriceDatabaseView: React.FC = () => {
  const {
    priceDatabase,
    deletePriceItem,
    importPriceItems,
    selectedProject,
    addRABItem,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<PriceItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<PriceItem | null>(null);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick insert to RAB
  const [itemToInsert, setItemToInsert] = useState<PriceItem | null>(null);
  const [insertVolume, setInsertVolume] = useState<number | string>(1);

  // Distinct categories
  const categories = Array.from(new Set(priceDatabase.map((p) => p.category)));

  const filteredItems = priceDatabase.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchType = selectedType === 'all' ? true : item.type === selectedType;
    const matchCat = selectedCategory === 'all' ? true : item.category === selectedCategory;

    return matchSearch && matchType && matchCat;
  });

  const handleEdit = (item: PriceItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deletePriceItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleExportCSV = () => {
    exportPriceDatabaseToCSV(priceDatabase);
    showToast('Export Berhasil', 'File master database harga CSV berhasil diunduh.', 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const parsed = parsePriceCSV(text);
      if (parsed.length > 0) {
        importPriceItems(parsed);
      } else {
        showToast('Format Tidak Sesuai', 'Pastikan format CSV memiliki kolom Kode, Nama, Jenis, Satuan, Harga.', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInsertToRAB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToInsert || !selectedProject) return;

    const vol = Math.max(0.01, Number(insertVolume) || 1);
    addRABItem({
      projectId: selectedProject.id,
      code: itemToInsert.code,
      name: itemToInsert.name,
      category: 'Lain-lain' as RABCategory,
      unit: itemToInsert.unit,
      volume: vol,
      unitPrice: itemToInsert.price,
      notes: `Dari Database (${itemToInsert.source})`,
    });

    setItemToInsert(null);
    setInsertVolume(1);
    showToast(
      'Dimasukkan ke RAB',
      `"${itemToInsert.name}" (${vol} ${itemToInsert.unit}) berhasil dimasukkan ke RAB ${selectedProject.name}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Database Harga Material, Upah & Alat ({priceDatabase.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog referensi harga satuan standar untuk estimasi cepat dan akurat
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.txt"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors"
            title="Import CSV"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setItemToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item Harga</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari item, kode, atau sumber..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center space-x-1 bg-[var(--bg-elevated-hover)] p-1 rounded-xl">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'material', label: 'Material' },
              { id: 'labor', label: 'Tenaga / Upah' },
              { id: 'equipment', label: 'Alat' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-[var(--bg-elevated)] text-blue-700 font-bold shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Database Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-12 text-center shadow-2xs">
          <Database className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Tidak Ada Data Harga</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba sesuaikan filter pencarian atau tambahkan item harga satuan baru.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-semibold border-b border-[var(--border-primary)] uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Kode</th>
                  <th className="px-4 py-3.5">Nama Item Bahan / Upah / Alat</th>
                  <th className="px-3 py-3.5">Jenis</th>
                  <th className="px-3 py-3.5">Kategori</th>
                  <th className="px-3 py-3.5 text-center">Satuan</th>
                  <th className="px-4 py-3.5 text-right">Harga Satuan (Rp)</th>
                  <th className="px-4 py-3.5">Sumber & Pembaruan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-elevated-hover)] transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500 font-medium">
                      {item.code}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[var(--text-primary)] text-xs">
                      {item.name}
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'material'
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'labor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.type === 'material' ? 'Material' : item.type === 'labor' ? 'Upah' : 'Alat'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-[var(--text-secondary)]">{item.category}</td>
                    <td className="px-3 py-3.5 text-center font-medium text-[var(--text-primary)]">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-black text-blue-900 text-sm">
                      {formatRupiah(item.price)}
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-500">
                      <div>{item.source}</div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{formatDateIndo(item.updatedAt)}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {selectedProject && (
                          <button
                            onClick={() => {
                              setItemToInsert(item);
                              setInsertVolume(1);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold"
                            title="Masukkan ke RAB Proyek Aktif"
                          >
                            + RAB
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      <PriceItemModal
        isOpen={isModalOpen}
        itemToEdit={itemToEdit}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Hapus Item Harga?"
        message={`Apakah Anda yakin ingin menghapus data harga "${itemToDelete?.name}" dari database?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Quick Insert to RAB Dialog */}
      {itemToInsert && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setItemToInsert(null)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Masukkan ke RAB Proyek
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan item ini ke RAB <strong>"{selectedProject.name}"</strong>
            </p>

            <form onSubmit={handleInsertToRAB} className="mt-4 space-y-3">
              <div className="p-3 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)]">
                <div className="text-xs font-bold text-[var(--text-primary)]">{itemToInsert.name}</div>
                <div className="text-xs text-blue-700 font-mono mt-1">
                  Harga Satuan: {formatRupiah(itemToInsert.price)} / {itemToInsert.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Volume Kebutuhan ({itemToInsert.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  autoFocus
                  value={insertVolume}
                  onChange={(e) => setInsertVolume(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono text-right font-bold focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-900">Total Biaya Item:</span>
                <span className="text-sm font-black text-blue-900 font-mono">
                  {formatRupiah((Number(insertVolume) || 0) * itemToInsert.price)}
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setItemToInsert(null)}
                  className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
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

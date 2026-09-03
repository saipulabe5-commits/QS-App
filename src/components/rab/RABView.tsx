import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RABItem, RABCategory, RAB_CATEGORIES } from '../../types';
import { calculateRAB } from '../../utils/calculations';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { exportRABToCSV } from '../../utils/exportHelpers';
import { RABItemModal } from './RABItemModal';
import { RABTable } from './RABTable';
import { RABSummaryCard } from './RABSummaryCard';
import { ConfirmModal } from '../layout/ConfirmModal';
import { RABRevisionHistoryModal } from './RABRevisionHistoryModal';
import { QuickRABBuilderModal } from './QuickRABBuilderModal';
import { FinancialReviewModal } from '../ai/FinancialReviewModal';
import {
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Sparkles,
  Trash2,
  Building2,
  FolderPlus,
  RefreshCw,
  Ruler,
  FileSpreadsheet,
  Layers,
  MapPin,
  Calendar,
  User,
  HardHat,
  History,
  Zap, ShieldCheck,
} from 'lucide-react';

interface RABViewProps {
  onOpenAIModal?: () => void;
  onOpenCalculator: () => void;
}

export const RABView: React.FC<RABViewProps> = ({
  onOpenAIModal,
  onOpenCalculator,
}) => {
  const {
    selectedProject,
    projectRABItems,
    addRABItem,
    deleteRABItem,
    clearProjectRAB,
    rabTemplates,
    applyRABTemplateToProject,
    saveProjectAsTemplate,
    deleteRABTemplate,
    updateProject,
    setActiveTab,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<RABItem | null>(null);
  const [initialModalCategory, setInitialModalCategory] = useState<string>('Pekerjaan Persiapan');

  // Delete Modal State
  const [itemToDelete, setItemToDelete] = useState<RABItem | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Template Apply Modal State
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = useState(false);
  const [selectedTemplateToApply, setSelectedTemplateToApply] = useState('');
  const [templateApplyMode, setTemplateApplyMode] = useState<'append' | 'replace'>('append');

  // Save As Template Modal State
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('Rumah Tinggal');

  // Revision History & Quick Builder Modals
  const [isRevisionHistoryOpen, setIsRevisionHistoryOpen] = useState(false);
  const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);
  const [isFinancialReviewOpen, setIsFinancialReviewOpen] = useState(false);

  // If no project selected
  if (!selectedProject) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-12 text-center shadow-2xs">
        <Building2 className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Belum Ada Proyek Terpilih</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Silakan pilih atau buat proyek konstruksi terlebih dahulu untuk mulai menyusun Rencana Anggaran Biaya.
        </p>
        <button
          onClick={() => setActiveTab('projects')}
          className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
        >
          Buka Daftar Proyek
        </button>
      </div>
    );
  }

  // Calculate full RAB dynamically
  const calc = calculateRAB(
    projectRABItems,
    selectedProject.overheadPercent,
    selectedProject.profitPercent,
    selectedProject.taxPercent
  );

  // Filter items based on search and category
  const filteredItems = projectRABItems.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory =
      selectedCategoryFilter === 'all' ? true : item.category === selectedCategoryFilter;

    return matchSearch && matchCategory;
  });

  // Handlers
  const handleAddItem = (categoryName?: string) => {
    setItemToEdit(null);
    setInitialModalCategory(categoryName || 'Pekerjaan Persiapan');
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: RABItem) => {
    setItemToEdit(item);
    setIsItemModalOpen(true);
  };

  const handleDuplicateItem = (item: RABItem) => {
    addRABItem({
      projectId: selectedProject.id,
      code: `${item.code}-COPY`,
      name: `${item.name} (Duplikat)`,
      category: item.category,
      unit: item.unit,
      volume: item.volume,
      unitPrice: item.unitPrice,
      notes: item.notes,
    });
    showToast(`Pos "${item.name}" berhasil diduplikasi ke RAB`, 'success');
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteRABItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleClearRABConfirm = () => {
    clearProjectRAB(selectedProject.id);
    setIsClearConfirmOpen(false);
  };

  const handleUpdateRates = (overhead: number, profit: number, tax: number) => {
    updateProject(selectedProject.id, {
      overheadPercent: overhead,
      profitPercent: profit,
      taxPercent: tax,
    });
    showToast('Parameter persentase overhead, profit, dan pajak diperbarui', 'success');
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplateToApply) return;
    applyRABTemplateToProject(selectedTemplateToApply, selectedProject.id, templateApplyMode);
    setIsApplyTemplateOpen(false);
    setSelectedTemplateToApply('');
  };

  const handleSaveAsTemplate = () => {
    if (!newTemplateName.trim()) return;
    saveProjectAsTemplate(selectedProject.id, newTemplateName.trim(), newTemplateCategory, newTemplateDesc.trim());
    setIsSaveTemplateOpen(false);
    setNewTemplateName('');
    setNewTemplateDesc('');
  };

  const handleExportCSV = () => {
    exportRABToCSV(selectedProject, projectRABItems, calc);
    showToast('File RAB berhasil diekspor dalam format CSV / Excel', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Project Identity Banner */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-mono text-[11px] font-bold rounded-lg border border-blue-200">
                {selectedProject.docNumber}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  selectedProject.status === 'Berjalan'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : selectedProject.status === 'Selesai'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border-[var(--border-primary)]'
                }`}
              >
                {selectedProject.status}
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                Dibuat: {selectedProject.createdAt}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              {selectedProject.name}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[var(--text-secondary)] pt-1">
              <div className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                <span className="truncate">{selectedProject.location || 'Lokasi Belum Diatur'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                <span className="truncate">Pemilik: {selectedProject.ownerName || '-'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <HardHat className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                <span className="truncate">Kontraktor: {selectedProject.contractorName || '-'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                <span className="truncate">
                  {selectedProject.startDate ? `${selectedProject.startDate} s/d ${selectedProject.endDate || '-'}` : 'Waktu Belum Diatur'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Grand Total Badge */}
          <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] flex-shrink-0 min-w-[240px] text-right">
            <span className="text-[10px] text-blue-400 uppercase font-extrabold tracking-wider block">
              Nilai Kontrak RAB (Grand Total)
            </span>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">
              {formatRupiah(calc.grandTotal)}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-1">
              {projectRABItems.length} Pos Pekerjaan Terhitung
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode, uraian, spesifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-[var(--text-primary)]"
            >
              <option value="all">Semua Kategori Pekerjaan</option>
              {RAB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsQuickBuilderOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
            title="Bangun RAB instan dalam hitungan menit (Wizard)"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Quick RAB</span>
          </button>

          {onOpenAIModal && (
            <button
              onClick={onOpenAIModal}
              className="px-3.5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-blue-400 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors border border-blue-900"
              title="Buka AI Asisten Quantity Surveyor (QS)"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>AI Asisten RAB</span>
            </button>
          )}

          <button
            onClick={() => handleAddItem()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Item RAB</span>
          </button>

          <button
            onClick={() => setIsRevisionHistoryOpen(true)}
            className="px-3 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Lihat riwayat revisi dan audit perubahan data RAB"
          >
            <History className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden lg:inline">Riwayat Revisi</span>
          </button>

          <button
            onClick={() => setIsApplyTemplateOpen(true)}
            className="px-3 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Gunakan template pekerjaan siap pakai"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Gunakan Template</span>
          </button>

          <button
            onClick={onOpenCalculator}
            className="px-3 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Buka kalkulator volume pekerjaan"
          >
            <Ruler className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden sm:inline">Kalkulator</span>
          </button>

                    <button
            onClick={() => setIsFinancialReviewOpen(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Review Kewajaran Anggaran via AI"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">AI Review</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Ekspor ke CSV / Excel"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden md:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className="px-3 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            title="Lihat dan cetak dokumen laporan RAB"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden md:inline">Laporan</span>
          </button>

          {projectRABItems.length > 0 && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="p-2 text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Kosongkan seluruh item RAB pada proyek ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main RAB Work Table */}
      <RABTable
        items={filteredItems}
        calc={calc}
        selectedCategoryFilter={selectedCategoryFilter}
        searchQuery={searchQuery}
        onAddItem={handleAddItem}
        onEditItem={handleEditItem}
        onDuplicateItem={handleDuplicateItem}
        onDeleteItem={(item) => setItemToDelete(item)}
      />

      {/* Live Financial Recapitulation Card */}
      <RABSummaryCard
        project={selectedProject}
        calc={calc}
        itemCount={projectRABItems.length}
        onUpdateProjectRates={handleUpdateRates}
        onUpdateBuildingArea={(area) => updateProject(selectedProject.id, { buildingArea: area })}
        onSaveAsTemplate={() => {
          setNewTemplateName(`Template ${selectedProject.name}`);
          setIsSaveTemplateOpen(true);
        }}
      />

      {/* Item Modal (Add/Edit) */}
      <RABItemModal
        isOpen={isItemModalOpen}
        projectId={selectedProject.id}
        itemToEdit={itemToEdit}
        initialCategory={initialModalCategory}
        onClose={() => setIsItemModalOpen(false)}
        onOpenCalculator={onOpenCalculator}
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(itemToDelete)}
        title="Hapus Item Pekerjaan?"
        message={`Apakah Anda yakin ingin menghapus pos pekerjaan "${itemToDelete?.name}" dari RAB? Total anggaran dan persentase bobot akan dihitung ulang secara otomatis.`}
        confirmLabel="Ya, Hapus Item"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Clear RAB Confirmation Modal */}
      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Kosongkan Seluruh RAB Proyek?"
        message="Tindakan ini akan menghapus semua pos item pekerjaan di proyek ini. Apakah Anda yakin?"
        confirmLabel="Ya, Kosongkan RAB"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleClearRABConfirm}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      {/* Apply Template Modal */}
      {isApplyTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setIsApplyTemplateOpen(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Gunakan Template Pekerjaan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih susunan pekerjaan standar untuk mengisi RAB secara cepat.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Pilih Template Master
                </label>
                <select
                  value={selectedTemplateToApply}
                  onChange={(e) => setSelectedTemplateToApply(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                >
                  <option value="">-- Pilih Template --</option>
                  {rabTemplates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.items?.length || 0} item) - {tpl.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Metode Pengisian
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTemplateApplyMode('append')}
                    className={`p-2.5 rounded-xl border text-center font-medium ${
                      templateApplyMode === 'append'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Tambahkan ke RAB
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateApplyMode('replace')}
                    className={`p-2.5 rounded-xl border text-center font-medium ${
                      templateApplyMode === 'replace'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Timpa (Ganti Total)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsApplyTemplateOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleApplyTemplate}
                disabled={!selectedTemplateToApply}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-2xs"
              >
                Terapkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Template Modal */}
      {isSaveTemplateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setIsSaveTemplateOpen(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Simpan Sebagai Template Master</h3>
            <p className="text-xs text-slate-500 mt-1">
              Simpan seluruh {projectRABItems.length} pos pekerjaan dari proyek ini sebagai template yang dapat digunakan berulang kali.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Nama Template <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Contoh: Template Rumah Minimalis 2 Lantai"
                  className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Kategori Template
                </label>
                <select
                  value={newTemplateCategory}
                  onChange={(e) => setNewTemplateCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                >
                  <option value="Rumah Tinggal">Rumah Tinggal</option>
                  <option value="Gedung & Ruko">Gedung & Ruko</option>
                  <option value="Renovasi">Renovasi</option>
                  <option value="Pekerjaan Umum & Sipil">Pekerjaan Umum & Sipil</option>
                  <option value="Interior & Fit-out">Interior & Fit-out</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Deskripsi spesifikasi template..."
                  className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsSaveTemplateOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!newTemplateName.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-2xs"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revision History Modal */}
      {isRevisionHistoryOpen && (
        <RABRevisionHistoryModal
          isOpen={isRevisionHistoryOpen}
          onClose={() => setIsRevisionHistoryOpen(false)}
        />
      )}

      {/* Quick RAB Builder Wizard Modal */}
      {isQuickBuilderOpen && (
        <QuickRABBuilderModal
          isOpen={isQuickBuilderOpen}
          onClose={() => setIsQuickBuilderOpen(false)}
        />
      )}
      {/* Financial Review Modal */}
      {isFinancialReviewOpen && (
        <FinancialReviewModal
          isOpen={isFinancialReviewOpen}
          onClose={() => setIsFinancialReviewOpen(false)}
          project={selectedProject}
          items={projectRABItems}
          calculation={calc}
        />
      )}
    </div>
  );
};

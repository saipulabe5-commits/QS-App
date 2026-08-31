import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RABTemplate,
  RABImportJob,
  RAB_CATEGORIES,
  RABCategory,
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { exportTemplateToExcel, exportTemplateToCSV } from '../../utils/rabImportParser';
import { ConfirmModal } from '../layout/ConfirmModal';
import { TemplateUploadModal } from './TemplateUploadModal';
import { ImportPreviewModal } from './ImportPreviewModal';
import { TemplateDetailModal } from './TemplateDetailModal';
import { ImportHistoryModal } from './ImportHistoryModal';
import {
  Boxes,
  Upload,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Sparkles,
  History,
  RefreshCw,
  Copy,
  Download,
  Star,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const TemplateView: React.FC = () => {
  const {
    rabTemplates,
    importJobs,
    activeImportJob,
    deleteRABTemplate,
    duplicateRABTemplate,
    syncTemplateWithPriceDatabase,
    applyRABTemplateToProject,
    createProjectFromRABTemplate,
    selectedProject,
    setActiveTab,
    startImportJob,
    showToast,
  } = useApp();

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedDetailTemplate, setSelectedDetailTemplate] = useState<RABTemplate | null>(null);

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'custom' | 'builtin' | 'favorite'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // Template to delete
  const [templateToDelete, setTemplateToDelete] = useState<RABTemplate | null>(null);

  // Template to apply modal
  const [templateToApply, setTemplateToApply] = useState<RABTemplate | null>(null);
  const [applyAction, setApplyAction] = useState<'current' | 'new'>('current');
  const [applyMode, setApplyMode] = useState<'append' | 'replace'>('append');

  const categories = Array.from(new Set(rabTemplates.map((t) => t.category)));
  const customCount = rabTemplates.filter((t) => !t.isBuiltIn).length;
  const builtInCount = rabTemplates.filter((t) => t.isBuiltIn).length;

  const filteredTemplates = rabTemplates.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.sourceFileName && t.sourceFileName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCat = selectedCategory === 'all' ? true : t.category === selectedCategory;

    let matchTab = true;
    if (activeTabFilter === 'custom') matchTab = !t.isBuiltIn;
    if (activeTabFilter === 'builtin') matchTab = Boolean(t.isBuiltIn);

    return matchSearch && matchCat && matchTab;
  });

  const handleDeleteConfirm = () => {
    if (templateToDelete) {
      deleteRABTemplate(templateToDelete.id);
      setTemplateToDelete(null);
    }
  };

  const handleExecuteApply = () => {
    if (!templateToApply) return;

    if (applyAction === 'new') {
      createProjectFromRABTemplate(templateToApply.id, {
        name: `Proyek ${templateToApply.name}`,
        notes: `Dibuat dari master template ${templateToApply.name}`,
        overheadPercent: templateToApply.defaultOverhead,
        profitPercent: templateToApply.defaultProfit,
        taxPercent: templateToApply.defaultTax,
      });
    } else if (selectedProject) {
      applyRABTemplateToProject(templateToApply.id, selectedProject.id, applyMode);
      setActiveTab('rab');
    }

    setTemplateToApply(null);
  };

  const handleResumeImport = (job: RABImportJob) => {
    startImportJob(job);
    setIsPreviewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Template Master & Import RAB
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
              {rabTemplates.length} Template
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat manajemen template konstruksi, unggah berkas Excel/CSV/PDF/Scan, dan sinkronisasi harga otomatis
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Riwayat Import */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <History className="w-4 h-4 text-purple-600" />
            <span>Riwayat Import ({importJobs.length})</span>
          </button>

          {/* Upload RAB Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload & Ekstrak Berkas RAB</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Template
          </div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {rabTemplates.length}
          </div>
          <div className="text-[11px] text-slate-500">Siap Diterapkan ke Proyek</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Template Kustom / Import
          </div>
          <div className="text-xl font-black text-purple-900 mt-0.5">
            {customCount}
          </div>
          <div className="text-[11px] text-purple-600 font-medium">Milik Anda & Hasil Ekstraksi</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Standar Referensi SNI
          </div>
          <div className="text-xl font-black text-blue-900 mt-0.5">
            {builtInCount}
          </div>
          <div className="text-[11px] text-blue-600 font-medium">Baku & Terverifikasi</div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Draft Berkas Import
          </div>
          <div className="text-xl font-black text-emerald-900 mt-0.5">
            {importJobs.length}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">Excel, CSV, PDF & Scan</div>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold w-full md:w-auto">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 md:flex-none ${
              activeTabFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({rabTemplates.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('custom')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 md:flex-none ${
              activeTabFilter === 'custom'
                ? 'bg-white text-purple-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kustom & Import ({customCount})
          </button>
          <button
            onClick={() => setActiveTabFilter('builtin')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex-1 md:flex-none ${
              activeTabFilter === 'builtin'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Standar SNI ({builtInCount})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama template, file sumber..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white"
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

      {/* Active Import Job Banner (if any active draft awaiting action) */}
      {activeImportJob && activeImportJob.status === 'parsed' && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h4 className="text-xs font-bold text-blue-950">
                Ada Berkas RAB Hasil Ekstraksi yang Siap Diverifikasi!
              </h4>
              <p className="text-[11px] text-blue-700 truncate">
                Berkas: <strong>{activeImportJob.fileName}</strong> &middot; {activeImportJob.parsedItems.length} item pekerjaan ditemukan.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors flex-shrink-0"
          >
            <span>Buka Layar Verifikasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
          <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak Ditemukan Template</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau unggah berkas RAB baru.
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 inline-flex items-center space-x-1.5 shadow-xs"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Berkas RAB</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTemplates.map((tpl) => {
            const isExpanded = expandedTemplateId === tpl.id;
            const approxTotal = tpl.items.reduce(
              (sum, it) => sum + (it.volume || 1) * (it.unitPrice || 0),
              0
            );

            return (
              <div
                key={tpl.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        v{tpl.version}
                      </span>
                    </div>

                    {tpl.isBuiltIn ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        Standar SNI
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Kustom / Import
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{tpl.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>

                  {/* Source File Badge */}
                  {tpl.sourceFileName && (
                    <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">Sumber: <strong>{tpl.sourceFileName}</strong></span>
                    </div>
                  )}

                  {/* Financial & Counts Card */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Estimasi Biaya Dasar
                      </div>
                      <div className="text-sm font-black text-blue-900 font-mono">
                        {formatRupiah(approxTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">
                        Jumlah Pos Pekerjaan
                      </div>
                      <div className="font-bold text-slate-800">
                        {tpl.items.length} Item
                      </div>
                    </div>
                  </div>

                  {/* Toggle Preview Items */}
                  <div className="mt-3 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <span>{isExpanded ? 'Sembunyikan' : `Pratinjau ${tpl.items.length} Item`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => setSelectedDetailTemplate(tpl)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rincian Lengkap</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 max-h-56 overflow-y-auto custom-scrollbar border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-1.5 animate-in fade-in duration-150">
                      {tpl.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[11px] p-1.5 bg-white rounded-lg border border-slate-100"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono text-slate-400 mr-1.5">{it.itemCode}</span>
                            <span className="font-medium text-slate-800">{it.description}</span>
                          </div>
                          <div className="font-mono font-semibold text-blue-800 flex-shrink-0">
                            {formatNumber(it.volume, 2)} {it.unit} &middot; {formatRupiah(it.unitPrice)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1">
                    {/* Quick Sync */}
                    <button
                      onClick={() => syncTemplateWithPriceDatabase(tpl.id)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Sinkronkan Harga dengan Database Harga"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    {/* Quick Excel Export */}
                    <button
                      onClick={() => exportTemplateToExcel(tpl)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Export Excel .xlsx"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    </button>

                    {/* Quick Duplicate */}
                    <button
                      onClick={() => duplicateRABTemplate(tpl.id)}
                      className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplikasi Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete for custom */}
                    {!tpl.isBuiltIn && (
                      <button
                        onClick={() => setTemplateToDelete(tpl)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setTemplateToApply(tpl);
                      setApplyAction('current');
                      setApplyMode('append');
                    }}
                    className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center space-x-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Gunakan Template</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <TemplateUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportReady={() => {
          setIsUploadModalOpen(false);
          setIsPreviewModalOpen(true);
        }}
      />

      {/* Import Preview & Verification Modal */}
      <ImportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onSavedAsTemplate={(newTplId) => {
          setIsPreviewModalOpen(false);
          const tpl = rabTemplates.find((t) => t.id === newTplId);
          if (tpl) setSelectedDetailTemplate(tpl);
        }}
      />

      {/* Template Detail & Editing Modal */}
      <TemplateDetailModal
        template={selectedDetailTemplate}
        isOpen={Boolean(selectedDetailTemplate)}
        onClose={() => setSelectedDetailTemplate(null)}
        onApply={(tpl) => {
          setTemplateToApply(tpl);
          setApplyAction('current');
          setApplyMode('append');
        }}
      />

      {/* Import History Modal */}
      <ImportHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        onResumeImport={handleResumeImport}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(templateToDelete)}
        title="Hapus Template Master?"
        message={`Apakah Anda yakin ingin menghapus template "${templateToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTemplateToDelete(null)}
      />

      {/* Apply Template Dialog */}
      {templateToApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setTemplateToApply(null)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 z-10">
            <h3 className="text-base font-bold text-slate-900">
              Gunakan "{templateToApply.name}"
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih bagaimana {templateToApply.items.length} item pekerjaan diterapkan:
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tujuan Penerapan
                </label>
                <div className="space-y-2 text-xs">
                  {selectedProject && (
                    <label className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/50">
                      <input
                        type="radio"
                        name="applyAction"
                        checked={applyAction === 'current'}
                        onChange={() => setApplyAction('current')}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="font-bold text-slate-800">
                          Masukkan ke Proyek Aktif saat ini
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Proyek: <strong>{selectedProject.name}</strong>
                        </div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-start space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-blue-50/50">
                    <input
                      type="radio"
                      name="applyAction"
                      checked={applyAction === 'new'}
                      onChange={() => setApplyAction('new')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800">
                        Buat Proyek Baru dari Template ini
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Membuat proyek mandiri otomatis terisi template ini
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {applyAction === 'current' && selectedProject && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Penggabungan
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setApplyMode('append')}
                      className={`p-2.5 rounded-xl border text-center font-medium ${
                        applyMode === 'append'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Tambahkan ke Akhir
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyMode('replace')}
                      className={`p-2.5 rounded-xl border text-center font-medium ${
                        applyMode === 'replace'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Ganti Semua Item
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setTemplateToApply(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteApply}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

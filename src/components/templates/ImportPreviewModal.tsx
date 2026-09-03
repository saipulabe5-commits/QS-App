import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RABTemplateItem,
  RABImportJob,
  RAB_CATEGORIES,
  RABCategory,
  VerificationStatus,
  ColumnMappingConfig,
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Trash2,
  Plus,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  Save,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Calculator,
  ShieldCheck,
  ChevronDown,
  Info,
  FolderPlus,
} from 'lucide-react';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavedAsTemplate?: (templateId: string) => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onSavedAsTemplate,
}) => {
  const {
    activeImportJob,
    updateImportJobItem,
    removeImportJobItem,
    addImportJobItem,
    saveImportJobAsTemplate,
    applyRABTemplateToProject,
    createProjectFromRABTemplate,
    selectedProject,
    setActiveTab,
    showToast,
    clearActiveImportJob,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_verification' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Save Modal States
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [showApplyProjectDialog, setShowApplyProjectDialog] = useState(false);
  const [templateName, setTemplateName] = useState(
    activeImportJob?.fileName
      ? `Template ${activeImportJob.fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')}`
      : 'Template Master RAB Baru'
  );
  const [templateDescription, setTemplateDescription] = useState(
    `Template hasil ekstraksi file ${activeImportJob?.fileName || 'import'} pada ${new Date().toLocaleDateString('id-ID')}`
  );
  const [templateCategory, setTemplateCategory] = useState<string>('Perumahan');
  const [templateProjectType, setTemplateProjectType] = useState<string>('Rumah Tinggal');
  const [overheadPercent, setOverheadPercent] = useState<number>(5);
  const [profitPercent, setProfitPercent] = useState<number>(10);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [templateVisibility, setTemplateVisibility] = useState<'private' | 'team' | 'public'>('team');

  // Apply to project settings
  const [applyMode, setApplyMode] = useState<'append' | 'replace'>('append');

  // New item modal
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [newItemCategory, setNewItemCategory] = useState<RABCategory>('Pekerjaan Struktur');
  const [newItemCode, setNewItemCode] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('m3');
  const [newItemVolume, setNewItemVolume] = useState<number>(1);
  const [newItemUnitPrice, setNewItemUnitPrice] = useState<number>(0);
  const [newItemNotes, setNewItemNotes] = useState('');

  if (!isOpen || !activeImportJob) return null;

  const {
    id: jobId,
    fileName,
    fileType,
    fileSize,
    fileDataUrl,
    parsedItems,
    fileCalculatedTotal,
    systemCalculatedTotal,
    totalDifference,
    confidenceScore,
    warnings,
  } = activeImportJob;

  const needsVerificationItems = parsedItems.filter(
    (i) => i.verificationStatus === 'needs_verification' || i.verificationStatus === 'error'
  );
  const verifiedItems = parsedItems.filter((i) => i.verificationStatus === 'verified');

  const filteredItems = parsedItems.filter((item) => {
    const matchStatus =
      activeFilter === 'all'
        ? true
        : activeFilter === 'needs_verification'
        ? item.verificationStatus === 'needs_verification' || item.verificationStatus === 'error'
        : item.verificationStatus === 'verified';

    const matchCat =
      selectedCategoryFilter === 'all' ? true : item.category === selectedCategoryFilter;

    const matchSearch =
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchCat && matchSearch;
  });

  const categoriesInJob = Array.from(new Set(parsedItems.map((i) => i.category)));

  // Bulk mark all as verified
  const handleMarkAllVerified = () => {
    parsedItems.forEach((it) => {
      if (it.verificationStatus !== 'verified') {
        updateImportJobItem(jobId, it.id, { verificationStatus: 'verified', validationWarnings: undefined });
      }
    });
    showToast('Semua Item Terverifikasi', 'Semua item pekerjaan telah ditandai sebagai valid.', 'success');
  };

  // Add Item to Job
  const handleAddNewItem = () => {
    if (!newItemDescription.trim()) {
      showToast('Uraian Wajib Diisi', 'Silakan masukkan uraian pekerjaan.', 'warning');
      return;
    }

    addImportJobItem(jobId, {
      category: newItemCategory,
      itemCode: newItemCode.trim() || `ITM-${parsedItems.length + 1}`,
      description: newItemDescription.trim(),
      unit: newItemUnit.trim() || 'ls',
      volume: newItemVolume > 0 ? newItemVolume : 1,
      unitPrice: newItemUnitPrice > 0 ? newItemUnitPrice : 0,
      calculatedAmount: (newItemVolume > 0 ? newItemVolume : 1) * (newItemUnitPrice > 0 ? newItemUnitPrice : 0),
      notes: newItemNotes.trim() || undefined,
      confidenceScore: 100,
      verificationStatus: 'verified',
      priceSource: 'Input Manual',
    });

    setShowAddItemDialog(false);
    setNewItemDescription('');
    setNewItemCode('');
    setNewItemUnitPrice(0);
    setNewItemVolume(1);
    setNewItemNotes('');
    showToast('Item Ditambahkan', 'Item baru berhasil ditambahkan ke daftar verifikasi.', 'success');
  };

  // Save as template handler
  const handleExecuteSaveTemplate = () => {
    if (!templateName.trim()) {
      showToast('Nama Template Wajib Diisi', 'Silakan masukkan nama template.', 'warning');
      return;
    }

    try {
      const newTemplate = saveImportJobAsTemplate(jobId, {
        name: templateName.trim(),
        description: templateDescription.trim(),
        category: templateCategory,
        projectType: templateProjectType,
        defaultOverhead: overheadPercent,
        defaultProfit: profitPercent,
        defaultTax: taxPercent,
        visibility: templateVisibility,
        status: 'active',
      });

      setShowSaveTemplateDialog(false);
      onClose();
      if (onSavedAsTemplate) {
        onSavedAsTemplate(newTemplate.id);
      }
    } catch (err: any) {
      showToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  // Apply directly to project handler
  const handleExecuteApplyToProject = (actionType: 'current' | 'new') => {
    try {
      // First, create the template
      const tempTemplate = saveImportJobAsTemplate(jobId, {
        name: templateName.trim() || `Import ${fileName}`,
        description: templateDescription.trim(),
        category: templateCategory,
        projectType: templateProjectType,
        defaultOverhead: overheadPercent,
        defaultProfit: profitPercent,
        defaultTax: taxPercent,
        visibility: 'private',
        status: 'active',
      });

      if (actionType === 'new') {
        createProjectFromRABTemplate(tempTemplate.id, {
          name: `Proyek Hasil Import (${fileName})`,
          notes: `Dibuat langsung dari file import ${fileName}`,
          overheadPercent,
          profitPercent,
          taxPercent,
        });
      } else if (selectedProject) {
        applyRABTemplateToProject(tempTemplate.id, selectedProject.id, applyMode);
        setActiveTab('rab');
      }

      setShowApplyProjectDialog(false);
      onClose();
    } catch (err: any) {
      showToast('Gagal Menerapkan', err.message || 'Terjadi kesalahan.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-[var(--bg-elevated)]/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-[var(--bg-elevated)] w-full max-w-6xl h-[94vh] rounded-2xl shadow-2xl border border-[var(--border-primary)] flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-6 py-3.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="p-2 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white truncate">
                  Pratinjau & Verifikasi Import RAB
                </h3>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md">
                  {fileType.toUpperCase()}
                </span>
                {confidenceScore && (
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Akurasi {confidenceScore}%</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                Berkas Sumber: <strong>{fileName}</strong> &middot; {(fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated-hover)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Summary Banner (Anti-Hallucination & Math Check) */}
        <div className="bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)] px-6 py-3 flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Card 1: Total Items */}
          <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              Total Item Terbaca
            </div>
            <div className="text-lg font-black text-[var(--text-primary)] mt-0.5">
              {parsedItems.length} Item
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {categoriesInJob.length} Kategori Pekerjaan
            </div>
          </div>

          {/* Card 2: Verification Status Breakdown */}
          <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              Status Verifikasi
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-emerald-700 font-bold text-sm flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{verifiedItems.length} Valid</span>
              </span>
              {needsVerificationItems.length > 0 && (
                <span className="text-amber-700 font-bold text-sm flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{needsVerificationItems.length} Perlu Cek</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {needsVerificationItems.length === 0
                ? 'Semua data lengkap & valid'
                : 'Harap periksa baris bertanda kuning'}
            </div>
          </div>

          {/* Card 3: Total System Calculation */}
          <div className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              Total Hitungan Sistem
            </div>
            <div className="text-base font-black text-blue-900 font-mono mt-0.5">
              {formatRupiah(systemCalculatedTotal)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Σ (Volume × Harga Satuan)
            </div>
          </div>

          {/* Card 4: Discrepancy / Math Integrity Card */}
          <div
            className={`p-3 rounded-xl border shadow-2xs ${
              totalDifference > 500
                ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">
              Perbandingan Nilai File
            </div>
            <div className="text-sm font-black font-mono mt-0.5">
              {formatRupiah(fileCalculatedTotal)}
            </div>
            <div className="text-[11px] font-medium flex items-center space-x-1">
              {totalDifference > 500 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Selisih: {formatRupiah(totalDifference)}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Matematika 100% Selaras</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Global Warnings Banner if any */}
        {warnings && warnings.length > 0 && (
          <div className="px-6 py-2 bg-amber-100/70 border-b border-amber-200 flex items-center space-x-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="truncate">
              <strong>Peringatan Verifikasi:</strong> {warnings.join(' &middot; ')}
            </div>
          </div>
        )}

        {/* Toolbar & Filter Tabs */}
        <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {/* Status Filter Tabs */}
            <div className="flex items-center bg-[var(--bg-elevated-hover)] p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Semua ({parsedItems.length})
              </button>
              <button
                onClick={() => setActiveFilter('needs_verification')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeFilter === 'needs_verification'
                    ? 'bg-[var(--traffic-yellow)] text-white shadow-xs font-bold'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Perlu Cek ({needsVerificationItems.length})</span>
              </button>
              <button
                onClick={() => setActiveFilter('verified')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
                  activeFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valid ({verifiedItems.length})</span>
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl px-3 py-1.5 text-[var(--text-primary)] font-medium focus:bg-[var(--bg-elevated)]"
            >
              <option value="all">Semua Kategori ({categoriesInJob.length})</option>
              {categoriesInJob.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari uraian / kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl w-44 md:w-56 focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Quick Actions */}
            {needsVerificationItems.length > 0 && (
              <button
                onClick={handleMarkAllVerified}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
                title="Tandai semua item sebagai valid jika Anda sudah memeriksa secara visual"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui Semua</span>
              </button>
            )}

            <button
              onClick={() => setShowAddItemDialog(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris</span>
            </button>
          </div>
        </div>

        {/* Interactive Editable Table */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-[var(--text-secondary)]">
              <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--text-secondary)]">Tidak ada item yang sesuai filter.</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Coba ubah kriteria pencarian atau status tab di atas.</p>
            </div>
          ) : (
            <div className="border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xs bg-[var(--bg-elevated)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[var(--bg-elevated-hover)]/90 text-[var(--text-primary)] font-bold border-b border-[var(--border-primary)] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">No</th>
                    <th className="py-3 px-3 w-28">Kode Item</th>
                    <th className="py-3 px-3 w-40">Kategori Standar</th>
                    <th className="py-3 px-4 min-w-[200px]">Uraian Pekerjaan (Dapat Diedit)</th>
                    <th className="py-3 px-3 w-20 text-center">Satuan</th>
                    <th className="py-3 px-3 w-24 text-right">Volume</th>
                    <th className="py-3 px-3 w-32 text-right">Harga Satuan (Rp)</th>
                    <th className="py-3 px-3 w-36 text-right">Total Biaya (Rp)</th>
                    <th className="py-3 px-3 w-28 text-center">Status</th>
                    <th className="py-3 px-2 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredItems.map((item, idx) => {
                    const isNeedsCheck =
                      item.verificationStatus === 'needs_verification' ||
                      item.verificationStatus === 'error';

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isNeedsCheck
                            ? 'bg-amber-50/50 hover:bg-amber-50'
                            : 'hover:bg-[var(--bg-elevated-hover)]'
                        }`}
                      >
                        {/* No */}
                        <td className="py-2.5 px-3 text-center text-[var(--text-secondary)] font-mono text-[11px]">
                          {item.sortOrder || idx + 1}
                        </td>

                        {/* Kode Item */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.itemCode}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, { itemCode: e.target.value })
                            }
                            className="w-full px-2 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-xs font-mono"
                          />
                        </td>

                        {/* Kategori Standar Dropdown */}
                        <td className="py-2.5 px-3">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, {
                                category: e.target.value as RABCategory,
                              })
                            }
                            className="w-full px-2 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-[11px] font-semibold text-[var(--text-primary)]"
                          >
                            {RAB_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Uraian Pekerjaan */}
                        <td className="py-2.5 px-4">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, { description: e.target.value })
                            }
                            className="w-full px-2 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-xs font-medium text-[var(--text-primary)]"
                          />
                          {item.validationWarnings && item.validationWarnings.length > 0 && (
                            <div className="text-[10px] text-amber-700 mt-0.5 flex items-center space-x-1 pl-2">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>{item.validationWarnings.join(', ')}</span>
                            </div>
                          )}
                        </td>

                        {/* Satuan */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, { unit: e.target.value })
                            }
                            className="w-full text-center px-1.5 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-xs font-mono font-bold"
                          />
                        </td>

                        {/* Volume */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={item.volume}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, {
                                volume: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full text-right px-2 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-xs font-mono font-semibold"
                          />
                        </td>

                        {/* Harga Satuan */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            step="100"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateImportJobItem(jobId, item.id, {
                                unitPrice: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full text-right px-2 py-1 bg-transparent hover:bg-[var(--bg-elevated)] focus:bg-[var(--bg-elevated)] border border-transparent hover:border-[var(--border-primary)] focus:border-blue-400 rounded-lg text-xs font-mono font-semibold"
                          />
                        </td>

                        {/* Total Biaya (Auto Calculated) */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                          {formatRupiah(item.calculatedAmount)}
                        </td>

                        {/* Status Toggle Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() =>
                              updateImportJobItem(jobId, item.id, {
                                verificationStatus: isNeedsCheck ? 'verified' : 'needs_verification',
                                validationWarnings: isNeedsCheck ? undefined : ['Diverifikasi ulang secara manual'],
                              })
                            }
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors flex items-center justify-center space-x-1 mx-auto ${
                              !isNeedsCheck
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                            }`}
                            title="Klik untuk mengubah status verifikasi"
                          >
                            {!isNeedsCheck ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Valid</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Perlu Cek</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Delete Row */}
                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => removeImportJobItem(jobId, item.id)}
                            className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-[var(--text-primary)]">Total Validasi:</span>
            <span>{parsedItems.length} Pos Pekerjaan</span>
            <span>&middot;</span>
            <span className="font-mono font-bold text-blue-900 text-sm">
              {formatRupiah(systemCalculatedTotal)}
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                clearActiveImportJob();
                onClose();
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-colors"
            >
              Buang Draft
            </button>

            {selectedProject && (
              <button
                onClick={() => setShowApplyProjectDialog(true)}
                className="flex-1 sm:flex-none px-4 py-2 bg-[var(--bg-elevated-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Terapkan ke Proyek</span>
              </button>
            )}

            <button
              onClick={() => setShowSaveTemplateDialog(true)}
              className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Sebagai Template Master</span>
            </button>
          </div>
        </div>
      </div>

      {/* Save As Template Configuration Modal */}
      {showSaveTemplateDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setShowSaveTemplateDialog(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    Simpan Template Master RAB
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Menyimpan {parsedItems.length} item pekerjaan ke perpustakaan template pribadi Anda
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveTemplateDialog(false)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Nama Template <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-semibold text-[var(--text-primary)]"
                  placeholder="Contoh: Template Rumah Mewah 2 Lantai"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">Deskripsi Ringkas</label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Kategori</label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-medium"
                  >
                    <option value="Perumahan">Perumahan / Residensial</option>
                    <option value="Komersial">Komersial / Ruko / Kantor</option>
                    <option value="Infrastruktur">Infrastruktur & Jalan</option>
                    <option value="Renovasi">Renovasi & Interior</option>
                    <option value="Kustom">Kustom / Lain-lain</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Tipe Bangunan</label>
                  <input
                    type="text"
                    value={templateProjectType}
                    onChange={(e) => setTemplateProjectType(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-medium"
                    placeholder="Contoh: Type 70, 2 Lantai"
                  />
                </div>
              </div>

              {/* Default Financial Markups */}
              <div className="p-3 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-2">
                <div className="font-bold text-[var(--text-primary)] text-[11px] uppercase tracking-wider">
                  Default Parameter Keuangan Proyek
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      Overhead (%)
                    </label>
                    <input
                      type="number"
                      value={overheadPercent}
                      onChange={(e) => setOverheadPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      Profit (%)
                    </label>
                    <input
                      type="number"
                      value={profitPercent}
                      onChange={(e) => setProfitPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      PPN (%)
                    </label>
                    <input
                      type="number"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Visibility / Access Control */}
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Hak Akses & Privasi Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateVisibility('private')}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      templateVisibility === 'private'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Privat (Saya)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateVisibility('team')}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      templateVisibility === 'team'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Tim Perusahaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateVisibility('public')}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      templateVisibility === 'public'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)] text-[var(--text-secondary)]'
                    }`}
                  >
                    Publik
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveTemplateDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteSaveTemplate}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Direct to Project Modal */}
      {showApplyProjectDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setShowApplyProjectDialog(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Terapkan Hasil Import ke Proyek
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih tujuan penerapan {parsedItems.length} item pekerjaan hasil import:
            </p>

            <div className="space-y-3 text-xs">
              {selectedProject && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="font-bold text-blue-950">
                    Proyek Aktif: {selectedProject.name}
                  </div>
                  <div className="text-[11px] text-blue-800">
                    Pilih opsi bagaimana item hasil import digabungkan ke RAB proyek saat ini:
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setApplyMode('append')}
                      className={`p-2 rounded-lg border text-center font-semibold ${
                        applyMode === 'append'
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-primary)]'
                      }`}
                    >
                      Tambahkan ke Akhir
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyMode('replace')}
                      className={`p-2 rounded-lg border text-center font-semibold ${
                        applyMode === 'replace'
                          ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-2xs'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-primary)]'
                      }`}
                    >
                      Ganti Semua RAB
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteApplyToProject('current')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-2 shadow-xs transition-colors"
                  >
                    Terapkan ke {selectedProject.name}
                  </button>
                </div>
              )}

              <div className="p-3 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl space-y-2">
                <div className="font-bold text-[var(--text-primary)]">
                  Buat Proyek Baru Mandiri
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Membuat proyek baru yang langsung terisi semua item hasil import ini.
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteApplyToProject('new')}
                  className="w-full py-2 bg-[var(--bg-elevated-hover)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold rounded-xl shadow-xs transition-colors"
                >
                  Buat Proyek Baru Sekarang
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowApplyProjectDialog(false)}
                className="px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-[var(--bg-elevated-hover)] rounded-xl font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Dialog */}
      {showAddItemDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setShowAddItemDialog(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Tambah Item Pekerjaan Baru
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">Kategori</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as RABCategory)}
                  className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-medium"
                >
                  {RAB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Kode Item</label>
                  <input
                    type="text"
                    value={newItemCode}
                    onChange={(e) => setNewItemCode(e.target.value)}
                    placeholder="STR-01"
                    className="w-full px-2 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Uraian Pekerjaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="Pekerjaan Kolom Praktis 15x15"
                    className="w-full px-3 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Satuan</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Volume</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemVolume}
                    onChange={(e) => setNewItemVolume(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    step="1000"
                    value={newItemUnitPrice}
                    onChange={(e) => setNewItemUnitPrice(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">Catatan / Spesifikasi</label>
                <input
                  type="text"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="K-225 besi ulir dia 10mm"
                  className="w-full px-3 py-1.5 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl text-[var(--text-secondary)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddItemDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddNewItem}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

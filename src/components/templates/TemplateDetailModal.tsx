import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  RABTemplate,
  RABTemplateItem,
  RAB_CATEGORIES,
  RABCategory,
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { exportTemplateToExcel, exportTemplateToCSV } from '../../utils/rabImportParser';
import {
  X,
  FileSpreadsheet,
  FileText,
  Clock,
  RefreshCw,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Tag,
  Share2,
  Sparkles,
} from 'lucide-react';

interface TemplateDetailModalProps {
  template: RABTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: RABTemplate) => void;
}

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({
  template,
  isOpen,
  onClose,
  onApply,
}) => {
  const {
    updateRABTemplate,
    createTemplateVersion,
    duplicateRABTemplate,
    syncTemplateWithPriceDatabase,
    deleteRABTemplate,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'items' | 'versions' | 'edit'>('items');
  const [selectedVersion, setSelectedVersion] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // New version dialog
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [versionChangelog, setVersionChangelog] = useState('');

  // Editing template meta
  const [editName, setEditName] = useState(template?.name || '');
  const [editDescription, setEditDescription] = useState(template?.description || '');
  const [editCategory, setEditCategory] = useState(template?.category || 'Perumahan');
  const [editProjectType, setEditProjectType] = useState(template?.projectType || 'Umum');
  const [editOverhead, setEditOverhead] = useState(template?.defaultOverhead || 5);
  const [editProfit, setEditProfit] = useState(template?.defaultProfit || 10);
  const [editTax, setEditTax] = useState(template?.defaultTax ?? 0);

  if (!isOpen || !template) return null;

  // Determine items based on version selection
  let displayItems = template.items;
  if (selectedVersion !== 'latest') {
    const ver = template.versions?.find((v) => v.versionNumber === selectedVersion);
    if (ver && ver.snapshotData?.items?.length) {
      displayItems = ver.snapshotData.items;
    }
  }

  const filteredItems = displayItems.filter((it) => {
    const matchCat = selectedCategory === 'all' ? true : it.category === selectedCategory;
    const matchSearch =
      it.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = Array.from(new Set(displayItems.map((i) => i.category)));

  // Recapitulation
  const directCost = displayItems.reduce((s, it) => s + it.calculatedAmount, 0);
  const overheadAmount = (directCost * (template.defaultOverhead || 5)) / 100;
  const profitAmount = (directCost * (template.defaultProfit || 10)) / 100;
  const subtotalBeforeTax = directCost + overheadAmount + profitAmount;
  const taxAmount = (subtotalBeforeTax * (template.defaultTax ?? 0)) / 100;
  const grandTotal = subtotalBeforeTax + taxAmount;

  // Save metadata changes
  const handleSaveMetaChanges = () => {
    updateRABTemplate(template.id, {
      name: editName.trim() || template.name,
      description: editDescription.trim(),
      category: editCategory,
      projectType: editProjectType,
      defaultOverhead: editOverhead,
      defaultProfit: editProfit,
      defaultTax: editTax,
    });
    setActiveTab('items');
  };

  // Create new version
  const handleCreateVersion = () => {
    if (!versionChangelog.trim()) {
      showToast('Keterangan Diperlukan', 'Masukkan ringkasan perubahan versi baru.', 'warning');
      return;
    }
    createTemplateVersion(template.id, versionChangelog.trim());
    setShowNewVersionDialog(false);
    setVersionChangelog('');
  };

  // Sync with Price DB
  const handleSyncPrice = () => {
    syncTemplateWithPriceDatabase(template.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative bg-[var(--bg-elevated)] w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border border-[var(--border-primary)] flex flex-col z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[var(--text-primary)]">{template.name}</h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {template.category}
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                  v{template.version}
                </span>
                {template.sourceFileName && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/70 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                    Dari: {template.sourceFileName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                {template.description || 'Template master pekerjaan konstruksi siap pakai.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subheader Toolbar & Tabs */}
        <div className="px-6 py-2.5 bg-[var(--bg-elevated)] border-b border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                activeTab === 'items'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)]'
              }`}
            >
              Daftar Pos Pekerjaan ({displayItems.length})
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1 ${
                activeTab === 'versions'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Versi ({template.versions?.length || 1})</span>
            </button>
            {!template.isBuiltIn && (
              <button
                onClick={() => {
                  setEditName(template.name);
                  setEditDescription(template.description);
                  setEditCategory(template.category);
                  setEditProjectType(template.projectType);
                  setEditOverhead(template.defaultOverhead);
                  setEditProfit(template.defaultProfit);
                  setEditTax(template.defaultTax);
                  setActiveTab('edit');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors ${
                  activeTab === 'edit'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)]'
                }`}
              >
                Ubah Parameter
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Sync with Price DB */}
            <button
              onClick={handleSyncPrice}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              title="Perbarui harga satuan berdasarkan Database Harga terkini"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkron Harga</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <button
              onClick={() => exportTemplateToExcel(template)}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
              title="Export ke file Excel .xlsx"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportTemplateToCSV(template)}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
              title="Export ke file CSV .csv"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            {/* Duplicate */}
            <button
              onClick={() => duplicateRABTemplate(template.id)}
              className="px-2.5 py-1.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl flex items-center space-x-1 transition-colors"
              title="Gandakan sebagai template baru"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplikasi</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {activeTab === 'items' && (
            <div className="space-y-6">
              {/* Financial Recapitulation Card */}
              <div className="p-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl shadow-md grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                    Biaya Langsung (Direct Cost)
                  </div>
                  <div className="text-sm font-black font-mono text-blue-300 mt-0.5">
                    {formatRupiah(directCost)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                    Overhead ({template.defaultOverhead}%) + Profit ({template.defaultProfit}%)
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {formatRupiah(overheadAmount + profitAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                    PPN ({template.defaultTax}%)
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {formatRupiah(taxAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                    Grand Total Estimasi
                  </div>
                  <div className="text-base font-black font-mono text-emerald-300 mt-0.5">
                    {formatRupiah(grandTotal)}
                  </div>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl px-3 py-1.5 text-[var(--text-primary)] font-medium"
                  >
                    <option value="all">Semua Kategori ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {template.versions && template.versions.length > 1 && (
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="text-xs bg-purple-50 border border-purple-200 text-purple-800 rounded-xl px-3 py-1.5 font-bold"
                    >
                      <option value="latest">Versi Terkini (v{template.version})</option>
                      {template.versions.map((v) => (
                        <option key={v.versionNumber} value={v.versionNumber}>
                          Versi v{v.versionNumber} ({v.createdAt.split('T')[0]})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Cari item dalam template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
                />
              </div>

              {/* Grouped Category Tables */}
              <div className="space-y-4">
                {categories.map((cat) => {
                  if (selectedCategory !== 'all' && selectedCategory !== cat) return null;
                  const catItems = filteredItems.filter((i) => i.category === cat);
                  if (catItems.length === 0) return null;

                  const catSubtotal = catItems.reduce((s, it) => s + it.calculatedAmount, 0);

                  return (
                    <div
                      key={cat}
                      className="border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-2xs bg-[var(--bg-elevated)]"
                    >
                      <div className="px-4 py-3 bg-slate-300 border-b border-slate-400 flex items-center justify-between shadow-2xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-700"></span>
                          <span className="font-black text-xs sm:text-[13px] text-slate-950 uppercase tracking-wider">
                            {cat}
                          </span>
                          <span className="text-[11px] font-bold text-[var(--text-primary)] bg-[var(--bg-elevated)]/90 px-2 py-0.5 rounded-full border border-slate-400 shadow-2xs">
                            {catItems.length} pos
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs sm:text-sm text-slate-950">
                          Subtotal: {formatRupiah(catSubtotal)}
                        </span>
                      </div>

                      <table className="w-full text-left text-xs">
                        <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] font-semibold text-[10px] uppercase">
                          <tr>
                            <th className="py-2 px-3 w-12 text-center">No</th>
                            <th className="py-2 px-3 w-28">Kode</th>
                            <th className="py-2 px-4">Uraian Pekerjaan</th>
                            <th className="py-2 px-3 w-20 text-center">Satuan</th>
                            <th className="py-2 px-3 w-24 text-right">Volume</th>
                            <th className="py-2 px-3 w-32 text-right">Harga Satuan</th>
                            <th className="py-2 px-4 w-36 text-right">Jumlah Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {catItems.map((item, idx) => {
                            const prevItem = idx > 0 ? catItems[idx - 1] : null;
                            const isNewFloor = Boolean(item.floor && (!prevItem || prevItem.floor !== item.floor));
                            const isNewSubcategory = Boolean(item.subcategory && (!prevItem || prevItem.subcategory !== item.subcategory || isNewFloor));

                            return (
                              <React.Fragment key={item.id || idx}>
                                {/* Floor / Level Divider Header */}
                                {isNewFloor && (
                                  <tr className="bg-gradient-to-r from-blue-100/90 via-blue-50/70 to-slate-50 border-y-2 border-blue-300/80">
                                    <td colSpan={7} className="py-2.5 px-4">
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

                                {/* Subcategory / Room / Section Header */}
                                {isNewSubcategory && (
                                  <tr className="bg-[var(--bg-elevated-hover)]/90 border-y border-[var(--border-primary)]">
                                    <td colSpan={7} className="py-1.5 px-4 pl-8 bg-[var(--bg-elevated-hover)]">
                                      <div className="flex items-center space-x-2 text-[var(--text-primary)]">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                        <span className="font-bold text-[11px] text-[var(--text-primary)] tracking-wide uppercase">
                                          {item.subcategory}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* Item Row */}
                                <tr className="hover:bg-blue-50/40 transition-colors">
                                  <td className="py-2.5 px-3 text-center text-[var(--text-secondary)] font-mono text-[11px]">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono font-semibold text-[var(--text-primary)] text-xs">
                                    {item.itemCode}
                                  </td>
                                  <td className="py-2.5 px-4 font-medium text-[var(--text-primary)]">
                                    <div className="font-semibold text-[var(--text-primary)] leading-snug">{item.description}</div>
                                    {item.notes && (
                                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        <strong className="text-[var(--text-secondary)] font-semibold">Spesifikasi:</strong> {item.notes}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] rounded-md font-mono font-bold text-[11px]">
                                      {item.unit}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                                    {formatNumber(item.volume, 2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono text-[var(--text-primary)]">
                                    {formatRupiah(item.unitPrice)}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900">
                                    {formatRupiah(item.calculatedAmount)}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Versi & Riwayat Modifikasi</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Setiap perubahan struktur atau pembaruan item dapat diabadikan dalam versi terpisah
                  </p>
                </div>
                <button
                  onClick={() => setShowNewVersionDialog(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Versi Baru</span>
                </button>
              </div>

              <div className="space-y-3">
                {(template.versions || []).map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200">
                          v{v.versionNumber}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-primary)]">{v.changeSummary}</span>
                      </div>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {v.createdAt.split('T')[0]} &middot; oleh {v.createdBy}
                      </span>
                    </div>

                    {v.snapshotData && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-4 pt-1">
                        <span>{v.snapshotData.items?.length || 0} Item Pekerjaan</span>
                        <span>&middot;</span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {formatRupiah(v.snapshotData.estimatedTotal || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4 max-w-lg mx-auto bg-[var(--bg-elevated-hover)] p-6 rounded-2xl border border-[var(--border-primary)]">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Ubah Parameter Template</h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Nama Template</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">Deskripsi</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1">Kategori</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl font-medium"
                    >
                      <option value="Perumahan">Perumahan</option>
                      <option value="Komersial">Komersial</option>
                      <option value="Infrastruktur">Infrastruktur</option>
                      <option value="Renovasi">Renovasi</option>
                      <option value="Kustom">Kustom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1">Tipe Bangunan</label>
                    <input
                      type="text"
                      value={editProjectType}
                      onChange={(e) => setEditProjectType(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      Overhead (%)
                    </label>
                    <input
                      type="number"
                      value={editOverhead}
                      onChange={(e) => setEditOverhead(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      Profit (%)
                    </label>
                    <input
                      type="number"
                      value={editProfit}
                      onChange={(e) => setEditProfit(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      PPN (%)
                    </label>
                    <input
                      type="number"
                      value={editTax}
                      onChange={(e) => setEditTax(Number(e.target.value))}
                      className="w-full px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-center font-bold"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end space-x-2">
                  <button
                    onClick={() => setActiveTab('items')}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-semibold rounded-xl text-[var(--text-primary)]"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveMetaChanges}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl text-white shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Terakhir Diperbarui: <strong>{template.updatedAt.split('T')[0]}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                onClose();
                onApply(template);
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Gunakan Template Ini</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Version Snapshot Modal */}
      {showNewVersionDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
            onClick={() => setShowNewVersionDialog(false)}
          />
          <div className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] p-6 z-10 space-y-4">
            <h4 className="text-base font-bold text-[var(--text-primary)]">Buat Versi Baru Template</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Versi baru akan menaikkan nomor versi dan menyimpan snapshot kondisi template saat ini.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Ringkasan Perubahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={versionChangelog}
                  onChange={(e) => setVersionChangelog(e.target.value)}
                  placeholder="Contoh: Penyesuaian harga semen & besi 2026"
                  className="w-full px-3 py-2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewVersionDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleCreateVersion}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
              >
                Rilis Versi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

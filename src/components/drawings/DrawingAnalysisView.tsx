import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectDrawing, DrawingAnalysis, EstimatedDrawingItem, DrawingCategory, DrawingVerificationStatus } from '../../types/drawing';

import { DrawingUploadModal } from './DrawingUploadModal';
import { DrawingItemEditModal } from './DrawingItemEditModal';
import { formatRupiah } from '../../utils/formatters';
import {
  Image as ImageIcon,
  UploadCloud,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowRight,
  Eye,
  Trash2,
  Edit3,
  Check,
  X,
  FileSpreadsheet,
  Ruler,
  Maximize2,
  RefreshCw,
  Building2,
  ChevronDown,
  Info,
  HelpCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua Dokumen' },
  { value: 'Denah', label: 'Denah' },
  { value: 'Tampak', label: 'Tampak' },
  { value: 'Potongan', label: 'Potongan' },
  { value: 'Detail Pondasi', label: 'Detail Pondasi' },
  { value: 'Detail Kolom & Balok', label: 'Kolom & Balok' },
  { value: 'Detail Struktur', label: 'Struktur' },
  { value: 'Detail Atap', label: 'Atap' },
  { value: 'Detail Arsitektur', label: 'Arsitektur' },
  { value: 'Gambar Kerja', label: 'Gambar Kerja' },
  { value: 'Foto Lapangan', label: 'Foto Lapangan' },
  { value: 'Dokumen PDF', label: 'PDF' },
];

export const DrawingAnalysisView: React.FC = () => {
  const {
    selectedProject,
    projectDrawings,
    drawingAnalyses,
    analyzeDrawingWithAI,
    deleteDrawing,
    updateAnalysisItem,
    verifyAnalysisItem,
    bulkVerifyAnalysisItems,
    transferApprovedItemsToRAB,
    setActiveTab,
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(() => {
    return projectDrawings.length > 0 ? projectDrawings[0].id : null;
  });

  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ analysisId: string; item: EstimatedDrawingItem } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active drawing & its analysis
  const activeDrawing = projectDrawings.find((d) => d.id === selectedDrawingId) || (projectDrawings.length > 0 ? projectDrawings[0] : null);
  const activeAnalysis = activeDrawing ? drawingAnalyses.find((a) => a.drawingId === activeDrawing.id) : null;
  const activeEstimatedItems = activeAnalysis?.estimatedItems || [];
  const activeDetectedElements = activeAnalysis?.detectedElements || [];
  const activeExtractedDimensions = activeAnalysis?.extractedDimensions || [];
  const activeAssumptions = activeAnalysis?.assumptions || [];
  const qualityWarning = activeAnalysis?.qualityWarning;

  // Filtered estimated items based on status
  const displayedEstimatedItems = activeEstimatedItems.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.verificationStatus === statusFilter;
  });

  // Filtered drawings
  const filteredDrawings = projectDrawings.filter((drawing) => {
    const matchesCat = selectedCategory === 'all' || drawing.category === selectedCategory;
    const titleText = drawing.title || drawing.fileName || '';
    const descText = drawing.description || '';
    const matchesSearch =
      titleText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRunAIAnalysis = async (drawingId: string) => {
    try {
      setIsAnalyzing((prev) => ({ ...prev, [drawingId]: true }));
      await analyzeDrawingWithAI(drawingId);
      setSelectedDrawingId(drawingId);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAnalyzing((prev) => ({ ...prev, [drawingId]: false }));
    }
  };

  const handleTransferToRAB = () => {
    if (!activeAnalysis) return;
    const count = transferApprovedItemsToRAB(
      activeAnalysis.id,
      selectedItemIds.length > 0 ? selectedItemIds : undefined
    );
    if (count > 0) {
      setSelectedItemIds([]);
    }
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleSelectAllItems = () => {
    if (!activeAnalysis) return;
    if (selectedItemIds.length === activeEstimatedItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(activeEstimatedItems.map((i) => i.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Analisis Dokumen Gambar Konstruksi (AI Vision)</h1>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl">
            Ekstrak dimensi, volume pekerjaan pondasi, struktur, dinding, atap, serta spesifikasi material langsung dari denah dan dokumen gambar teknik menggunakan AI Multimodal.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Proyek: <strong className="text-white">{selectedProject?.name || 'Pilih Proyek'}</strong>
            </span>
            <span>•</span>
            <span>{projectDrawings.length} Dokumen Terunggah</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">
              {drawingAnalyses.filter((a) => a.projectId === selectedProject?.id).length} Selesai Dianalisis
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Unggah Gambar Baru</span>
          </button>

          {activeDrawing && activeDrawing.analysisStatus !== 'processing' && (
            <button
              onClick={() => handleRunAIAnalysis(activeDrawing.id)}
              disabled={isAnalyzing[activeDrawing.id]}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing[activeDrawing.id] ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing[activeDrawing.id] ? 'Menganalisis Gambar...' : 'Analisis Ulang dengan AI'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Thumbnails/List, Right Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drawing Gallery & Search (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search & Filter Header */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari denah, tampak, potongan..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              />
            </div>

            {/* Category horizontal badges */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drawings List Cards */}
          <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-1">
            {filteredDrawings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Dokumen Gambar</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Unggah denah arsitektur, gambar kerja, atau foto lapangan untuk dianalisis oleh AI.
                </p>
                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
                >
                  + Unggah Dokumen
                </button>
              </div>
            ) : (
              filteredDrawings.map((drawing) => {
                const isSelected = activeDrawing?.id === drawing.id;
                const analysis = drawingAnalyses.find((a) => a.drawingId === drawing.id);
                const isBusy = isAnalyzing[drawing.id] || drawing.analysisStatus === 'processing';

                return (
                  <div
                    key={drawing.id}
                    onClick={() => setSelectedDrawingId(drawing.id)}
                    className={`bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden p-3 relative ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-sm bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Image Thumbnail with zoom trigger */}
                      <div className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0 group">
                        <img
                          src={drawing.fileUrl}
                          alt={drawing.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewModalUrl(drawing.fileUrl);
                          }}
                          className="absolute inset-0 bg-slate-950/40 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                          title="Perbesar Gambar"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                            {drawing.category}
                          </span>
                          <span className="text-[10px] text-slate-400">{drawing.scale || '1:100'}</span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1" title={drawing.title}>
                          {drawing.title}
                        </h4>

                        <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
                          <span>{drawing.fileSize || '1.2 MB'}</span>
                          <span>•</span>
                          <span>{drawing.uploadDate}</span>
                        </div>

                        {/* Status / AI Analysis Indicator */}
                        <div className="mt-2 flex items-center justify-between">
                          {isBusy ? (
                            <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin" /> Sedang Dianalisis AI...
                            </span>
                          ) : analysis ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {(analysis.estimatedItems || []).length} Pekerjaan Terdeteksi
                            </span>
                          ) : (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Belum Dianalisis AI
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(drawing.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                            title="Hapus Gambar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirm Mini Popup */}
                    {deleteConfirmId === drawing.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2"
                      >
                        <p className="text-xs text-rose-800 font-semibold">
                          Hapus gambar & hasil analisis ini?
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              deleteDrawing(drawing.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                          >
                            Ya, Hapus
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Drawing AI Analysis & Extraction Table (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {activeDrawing ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Active Drawing Header & Preview */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white flex-shrink-0 cursor-pointer relative group"
                    onClick={() => setPreviewModalUrl(activeDrawing.fileUrl)}
                  >
                    <img
                      src={activeDrawing.fileUrl}
                      alt={activeDrawing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-extrabold text-blue-800 uppercase bg-blue-100 px-2 py-0.5 rounded-sm">
                        {activeDrawing.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Skala: {activeDrawing.scale || '1:100'}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{activeDrawing.title}</h2>
                    {activeDrawing.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{activeDrawing.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewModalUrl(activeDrawing.fileUrl)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Layar Penuh</span>
                  </button>

                  <button
                    onClick={() => handleRunAIAnalysis(activeDrawing.id)}
                    disabled={isAnalyzing[activeDrawing.id]}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing[activeDrawing.id] ? 'animate-spin' : ''}`} />
                    <span>{isAnalyzing[activeDrawing.id] ? 'Menganalisis Gambar...' : 'Analisis Ulang AI'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Image Preview Box with Zoom Controls */}
              <div className="bg-slate-900 border-b border-slate-800 p-3">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 px-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                    Pratinjau Gambar Kerja Konstruksi
                  </span>
                  <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-1.5 text-blue-300">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.2))}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setZoomLevel(1)}
                      className="p-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Reset Zoom"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="relative overflow-auto max-h-[360px] flex items-center justify-center p-4 min-h-[220px]">
                  <img
                    src={activeDrawing.fileUrl}
                    alt={activeDrawing.title}
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease',
                    }}
                    className="max-h-[320px] w-auto object-contain rounded-md shadow-md"
                  />
                </div>
              </div>

              {/* Analysis Result Container */}
              {isAnalyzing[activeDrawing.id] ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-bounce">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">AI Sedang Menganalisis Dokumen Gambar...</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Mengekstrak teks dimensi, notasi arsitektur/struktur, serta menghitung volume pekerjaan tanpa mengarang ukuran di luar gambar.
                  </p>
                </div>
              ) : activeAnalysis ? (
                <div className="p-6 space-y-6">
                  {/* Anti-Hallucination & AI Integrity Banner */}
                  <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start space-x-3 text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900">Integritas Dimensi & Rekayasa QS:</h4>
                      <p className="text-blue-800 mt-0.5 leading-relaxed">
                        AI hanya mengekstrak dimensi dan notasi yang terlihat pada dokumen gambar. Dimensi tersembunyi/tidak tercantum ditandai sebagai asumsi standar teknik dan wajib diverifikasi sebelum transfer ke RAB.
                      </p>
                    </div>
                  </div>

                  {/* Quality Warning if applicable */}
                  {qualityWarning && (
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 flex items-start space-x-3 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900">Catatan Kualitas Gambar:</h4>
                        <p className="text-amber-800 mt-0.5">{qualityWarning}</p>
                      </div>
                    </div>
                  )}

                  {/* Summary & Cost Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-blue-600" />
                          Ringkasan Temuan AI
                        </span>
                        <span className="text-slate-500 font-normal">Skala: {activeAnalysis.scaleDetected}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{activeAnalysis.summary}</p>

                      {/* Detected Elements Chips */}
                      {activeDetectedElements.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                            Elemen Terdeteksi:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeDetectedElements.map((elem: any, i: number) => {
                              const label = typeof elem === 'string' ? elem : (elem.name || elem.category || 'Elemen');
                              return (
                                <span
                                  key={i}
                                  className="text-[11px] bg-white border border-slate-300 text-slate-800 px-2 py-0.5 rounded-md font-medium"
                                >
                                  {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assumptions list */}
                      {activeAssumptions.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/80 mt-2">
                          <span className="text-[11px] font-bold text-slate-600 block mb-1">
                            Asumsi Perhitungan (Perlu Verifikasi Fisik):
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600">
                            {activeAssumptions.map((asm: string, idx: number) => (
                              <li key={idx}>{asm}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Total Estimated Cost Card */}
                    <div className="p-4 bg-blue-900 text-white rounded-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-200">
                          Total Estimasi Biaya Gambar
                        </span>
                        <div className="text-xl font-black text-white mt-1">
                          {formatRupiah(activeAnalysis.totalEstimatedCost)}
                        </div>
                        <p className="text-[11px] text-blue-200 mt-1">
                          {activeEstimatedItems.length} Item Pekerjaan Terdaftar
                        </p>
                      </div>

                      <button
                        onClick={handleTransferToRAB}
                        className="mt-4 w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Masukkan ke RAB ({selectedItemIds.length > 0 ? `${selectedItemIds.length} Dipilih` : 'Semua Disetujui'})</span>
                      </button>
                    </div>
                  </div>

                  {/* Extracted Dimensions Summary */}
                  {activeExtractedDimensions.length > 0 && (
                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-blue-600" />
                        Dimensi Terukur Nyata dari Gambar
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {activeExtractedDimensions.map((dim: any, i: number) => (
                          <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <span className="text-slate-500 text-[10px] block truncate">{dim.component || dim.label || 'Dimensi'}</span>
                            <div className="font-bold text-slate-900 mt-0.5">{dim.dimension || (dim.value ? `${dim.value} ${dim.unit || ''}` : '-')}</div>
                            {(dim.notes || dim.source) && <p className="text-[10px] text-slate-400 truncate mt-0.5">{dim.notes || dim.source}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estimated Work Items Table (Interactive) */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>Daftar Uraian Pekerjaan & Perhitungan Volume</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                            {displayedEstimatedItems.length} / {activeEstimatedItems.length} Item
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tinjau rumus volume, sesuaikan angka jika perlu, setujui status, lalu klik "Masukkan ke RAB".
                        </p>
                      </div>

                      {/* Status Filter & Bulk Verification */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {/* Status Filter Pills */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                          <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                              statusFilter === 'all'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Semua ({activeEstimatedItems.length})
                          </button>
                          <button
                            onClick={() => setStatusFilter('unverified')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                              statusFilter === 'unverified'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Belum Cek ({activeEstimatedItems.filter((i) => i.verificationStatus === 'unverified').length})
                          </button>
                          <button
                            onClick={() => setStatusFilter('verified')}
                            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                              statusFilter === 'verified'
                                ? 'bg-white text-emerald-800 shadow-xs'
                                : 'text-slate-600 hover:text-emerald-800'
                            }`}
                          >
                            Disetujui ({activeEstimatedItems.filter((i) => i.verificationStatus === 'verified').length})
                          </button>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => bulkVerifyAnalysisItems(activeAnalysis.id, 'verified')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui Semua</span>
                          </button>
                          <button
                            onClick={() => bulkVerifyAnalysisItems(activeAnalysis.id, 'unverified')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  displayedEstimatedItems.length > 0 &&
                                  displayedEstimatedItems.every((it) => selectedItemIds.includes(it.id))
                                }
                                onChange={toggleSelectAllItems}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="p-3">Uraian Pekerjaan</th>
                            <th className="p-3">Kategori</th>
                            <th className="p-3 text-right">Volume</th>
                            <th className="p-3 text-right">Harga Satuan</th>
                            <th className="p-3 text-right">Jumlah Biaya</th>
                            <th className="p-3">Rumus / Dimensi</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {displayedEstimatedItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-6 text-center text-slate-500 text-xs">
                                Tidak ada item pekerjaan pada filter ini.
                              </td>
                            </tr>
                          ) : (
                            displayedEstimatedItems.map((item) => {
                              const isChecked = selectedItemIds.includes(item.id);

                              let statusBadge = (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  Belum Cek
                                </span>
                              );
                              if (item.verificationStatus === 'verified') {
                                statusBadge = (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Disetujui
                                  </span>
                                );
                              } else if (item.verificationStatus === 'adjusted') {
                                statusBadge = (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                    Disesuaikan
                                  </span>
                                );
                              } else if (item.verificationStatus === 'rejected') {
                                statusBadge = (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    Ditolak
                                  </span>
                                );
                              }

                              return (
                                <tr
                                  key={item.id}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    isChecked ? 'bg-blue-50/40' : ''
                                  }`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSelectItem(item.id)}
                                      className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="p-3 font-semibold text-slate-900">
                                    <div className="flex items-center space-x-1.5">
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {item.workCode}
                                      </span>
                                      <span>{item.workName}</span>
                                    </div>
                                    {item.userNotes && (
                                      <p className="text-[10px] text-blue-700 italic mt-0.5 font-normal">
                                        Catatan: {item.userNotes}
                                      </p>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-600">{item.category}</td>
                                  <td className="p-3 text-right font-bold text-slate-800 font-mono">
                                    {item.volume.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">{item.unit}</span>
                                  </td>
                                  <td className="p-3 text-right text-slate-700 font-mono">
                                    {formatRupiah(item.unitPrice)}
                                  </td>
                                  <td className="p-3 text-right font-extrabold text-blue-900 font-mono">
                                    {formatRupiah(item.totalPrice)}
                                  </td>
                                  <td className="p-3 text-slate-500 text-[11px] max-w-xs truncate" title={item.formulaExplanation}>
                                    {item.formulaExplanation || '-'}
                                  </td>
                                  <td className="p-3 text-center">{statusBadge}</td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          verifyAnalysisItem(
                                            activeAnalysis.id,
                                            item.id,
                                            item.verificationStatus === 'verified' ? 'unverified' : 'verified'
                                          )
                                        }
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          item.verificationStatus === 'verified'
                                            ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200'
                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                        title="Setujui Item"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setEditingItem({
                                            analysisId: activeAnalysis.id,
                                            item,
                                          })
                                        }
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit Volume / Harga"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          verifyAnalysisItem(
                                            activeAnalysis.id,
                                            item.id,
                                            item.verificationStatus === 'rejected' ? 'unverified' : 'rejected'
                                          )
                                        }
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          item.verificationStatus === 'rejected'
                                            ? 'text-rose-700 bg-rose-100 hover:bg-rose-200'
                                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                        }`}
                                        title="Tolak Item"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Action Transfer Bar */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        <span>
                          {selectedItemIds.length > 0
                            ? `${selectedItemIds.length} item dipilih`
                            : `${activeEstimatedItems.filter((i) => i.verificationStatus === 'verified' || i.verificationStatus === 'adjusted').length} item siap dimasukkan ke RAB`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleTransferToRAB}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-2"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          <span>Masukkan ke RAB</span>
                        </button>
                        <button
                          onClick={() => setActiveTab('rab')}
                          className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
                        >
                          <span>Buka Tabel RAB</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7 text-indigo-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Dokumen Belum Dianalisis AI</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Klik tombol "Mulai Analisis AI" untuk membaca dimensi gambar dan menyusun volume pekerjaan otomatis.
                  </p>
                  <button
                    onClick={() => handleRunAIAnalysis(activeDrawing.id)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Analisis AI Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Pilih Dokumen Gambar untuk Ditampilkan</h3>
              <p className="text-xs text-slate-500">
                Pilih gambar dari daftar di sebelah kiri atau unggah dokumen gambar baru.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <DrawingUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Item Edit Modal */}
      {editingItem && (
        <DrawingItemEditModal
          isOpen={true}
          onClose={() => setEditingItem(null)}
          item={editingItem.item}
          onSave={(updated) => {
            updateAnalysisItem(editingItem.analysisId, editingItem.item.id, updated);
          }}
        />
      )}

      {/* Image Fullscreen Preview Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900">Preview Dokumen Gambar Konstruksi</h4>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center p-4 bg-slate-900 rounded-xl">
              <img src={previewModalUrl} alt="Preview" className="max-w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

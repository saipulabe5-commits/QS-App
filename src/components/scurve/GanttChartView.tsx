import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useApp } from '../../context/AppContext';
import { PdfExportButton } from "../common/PdfExportButton";
import { formatRupiah, formatNumber } from '../../utils/formatters';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  BarChart2,
  RefreshCw,
  Filter,
  Eye,
  TrendingUp,
  Sliders,
  Check,
  X,
  Info,
  Printer,
  Loader2,
  Building2,
} from 'lucide-react';

type GroupByMode = 'category' | 'none';
type ZoomLevel = 'compact' | 'normal' | 'wide';

const CATEGORY_COLORS: Record<string, { bar: string; fill: string; header: string; text: string; badge: string }> = {
  'Pekerjaan Persiapan':        { bar: 'bg-slate-600',   fill: '#64748b', header: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-800 dark:text-slate-200', badge: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  'Pekerjaan Tanah':            { bar: 'bg-amber-500',   fill: '#f59e0b', header: 'bg-amber-50 dark:bg-amber-950/40',    text: 'text-amber-800 dark:text-amber-200', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700' },
  'Pekerjaan Pondasi':          { bar: 'bg-orange-500',  fill: '#f97316', header: 'bg-orange-50 dark:bg-orange-950/40',   text: 'text-orange-800 dark:text-orange-200', badge: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700' },
  'Pekerjaan Struktur':         { bar: 'bg-blue-600',    fill: '#2563eb', header: 'bg-blue-50 dark:bg-blue-950/40',     text: 'text-blue-800 dark:text-blue-200', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700' },
  'Pekerjaan Dinding':          { bar: 'bg-cyan-500',    fill: '#06b6d4', header: 'bg-cyan-50 dark:bg-cyan-950/40',     text: 'text-cyan-800 dark:text-cyan-200', badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700' },
  'Pekerjaan Lantai':           { bar: 'bg-teal-500',    fill: '#14b8a6', header: 'bg-teal-50 dark:bg-teal-950/40',     text: 'text-teal-800 dark:text-teal-200', badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700' },
  'Pekerjaan Atap':             { bar: 'bg-indigo-500',  fill: '#6366f1', header: 'bg-indigo-50 dark:bg-indigo-950/40',   text: 'text-indigo-800 dark:text-indigo-200', badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700' },
  'Pekerjaan Plafon':           { bar: 'bg-violet-500',  fill: '#8b5cf6', header: 'bg-violet-50 dark:bg-violet-950/40',   text: 'text-violet-800 dark:text-violet-200', badge: 'bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 border-violet-300 dark:border-violet-700' },
  'Pekerjaan Pintu dan Jendela':{ bar: 'bg-purple-500',  fill: '#a855f7', header: 'bg-purple-50 dark:bg-purple-950/40',   text: 'text-purple-800 dark:text-purple-200', badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700' },
  'Pekerjaan Instalasi Listrik':{ bar: 'bg-yellow-500',  fill: '#eab308', header: 'bg-yellow-50 dark:bg-yellow-950/40',   text: 'text-yellow-800 dark:text-yellow-200', badge: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700' },
  'Pekerjaan Sanitasi':         { bar: 'bg-sky-500',     fill: '#0ea5e9', header: 'bg-sky-50 dark:bg-sky-950/40',      text: 'text-sky-800 dark:text-sky-200', badge: 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700' },
  'Pekerjaan Pengecatan':       { bar: 'bg-pink-500',    fill: '#ec4899', header: 'bg-pink-50 dark:bg-pink-950/40',     text: 'text-pink-800 dark:text-pink-200', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700' },
  'Pekerjaan Akhir':            { bar: 'bg-rose-500',    fill: '#f43f5e', header: 'bg-rose-50 dark:bg-rose-950/40',     text: 'text-rose-800 dark:text-rose-200', badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700' },
  'Lain-lain':                  { bar: 'bg-gray-500',    fill: '#6b7280', header: 'bg-gray-50 dark:bg-gray-800',     text: 'text-gray-700 dark:text-gray-200', badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700' },
};

const DEFAULT_COLOR = {
  bar: 'bg-blue-600',
  fill: '#2563eb',
  header: 'bg-blue-50 dark:bg-blue-950/40',
  text: 'text-blue-800 dark:text-blue-200',
  badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
};

const ZOOM_CONFIG: Record<ZoomLevel, { colWidth: number; label: string }> = {
  compact: { colWidth: 40, label: 'Kompak' },
  normal:  { colWidth: 64, label: 'Normal' },
  wide:    { colWidth: 92, label: 'Lebar' },
};

export const GanttChartView: React.FC = () => {
  const {
    selectedProject,
    projectSCurve,
    projectRABItems,
    generateSCurveFromRAB,
    syncSCurveWithCurrentRAB,
    setActiveTab,
    showToast,
  } = useApp();

  const [zoom, setZoom] = useState<ZoomLevel>('normal');
  const [groupBy, setGroupBy] = useState<GroupByMode>('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showActual, setShowActual] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scurve = projectSCurve;
  const colWidth = ZOOM_CONFIG[zoom].colWidth;

  // ── High-Resolution PDF Export Engine ─────────────────────
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Memproses PDF', 'Menyiapkan render visual resolusi tinggi...', 'info');
      await new Promise((resolve) => setTimeout(resolve, 800));

      const element = document.getElementById('kurvas-export-area');
      if (!element) {
        showToast('Gagal', 'Area dokumen Gantt Chart tidak ditemukan.', 'error');
        setIsExportingPDF(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          // 1. Sanitasi style tags untuk mencegah parser crash pada oklch/oklab
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleTag) => {
            if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('oklab'))) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]+\)/g, '#64748b')
                .replace(/oklab\([^)]+\)/g, '#64748b');
            }
          });

          // 2. Sanitasi computed styles pada seluruh elemen
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (!htmlEl || !htmlEl.style) return;
            try {
              const style = window.getComputedStyle(el);
              const propsToCheck = ['backgroundColor', 'color', 'borderColor', 'stroke', 'fill'];
              
              propsToCheck.forEach((prop) => {
                const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                const val = style.getPropertyValue(cssProp);
                if (val && (val.includes('oklch') || val.includes('oklab'))) {
                  if (prop === 'color') htmlEl.style[prop as any] = '#0f172a';
                  else if (prop === 'backgroundColor') htmlEl.style[prop as any] = '#ffffff';
                  else if (prop === 'borderColor') htmlEl.style[prop as any] = '#e2e8f0';
                  else htmlEl.style[prop as any] = 'transparent';
                }
              });
            } catch {
              // ignore
            }
          });
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pdfHeight - margin * 2);
      }

      const filename = `GanttChart_${selectedProject?.name?.replace(/\s+/g, '_') || 'Proyek'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      showToast('Cetak PDF Berhasil', `Dokumen ${filename} berhasil diunduh.`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Gagal Cetak PDF', err.message || 'Terjadi kesalahan saat memproses dokumen PDF.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────
  const getPeriodLabel = (period: number): string => {
    const rec = scurve?.periodRecords.find((r) => r.period === period);
    if (rec?.periodLabel) return rec.periodLabel;
    return `${scurve?.periodType === 'weekly' ? 'M' : 'B'}-${period}`;
  };

  const getPeriodShortLabel = (period: number): string => {
    const label = getPeriodLabel(period);
    const parts = label.split(' ');
    return parts[0] ?? `${period}`;
  };

  // ── Derived Data ────────────────────────────────────────
  const scheduleItems = useMemo(() => {
    if (!scurve) return [];
    return scurve.scheduleItems.filter((it) =>
      filterCategory === 'all' ? true : it.category === filterCategory
    );
  }, [scurve, filterCategory]);

  const categories = useMemo(() => {
    return Array.from(new Set(scurve?.scheduleItems.map((it) => it.category) ?? []));
  }, [scurve]);

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') return [{ category: null, items: scheduleItems }];
    const map = new Map<string, typeof scheduleItems>();
    scheduleItems.forEach((it) => {
      const cat = it.category ?? 'Lain-lain';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(it);
    });
    return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
  }, [scheduleItems, groupBy]);

  const totalPeriods = scurve?.totalPeriods ?? 0;
  const totalWidth = colWidth * totalPeriods;

  // ── Percentage of actual done for a given item ──────────
  const getItemActualPercent = (itemId: string): number => {
    if (!scurve) return 0;
    // Check itemProgress in period records
    const latestRecordWithItemProgress = [...scurve.periodRecords]
      .reverse()
      .find((r) => r.itemProgress && r.itemProgress[itemId] !== undefined);
    
    if (latestRecordWithItemProgress && latestRecordWithItemProgress.itemProgress[itemId] !== undefined) {
      return latestRecordWithItemProgress.itemProgress[itemId];
    }

    const item = scurve.scheduleItems.find((it) => it.id === itemId);
    if (!item) return 0;

    // Estimate based on active completed periods
    const activeRecords = scurve.periodRecords.filter(
      (r) => r.period >= item.startPeriod && r.period <= item.endPeriod && r.status !== 'Belum ada data'
    );
    if (activeRecords.length === 0) return 0;
    const avgActual = activeRecords.reduce((s, r) => s + r.actualProgress, 0);
    const plannedInRange = item.plannedPeriodValues
      .slice(item.startPeriod - 1, item.endPeriod)
      .reduce((s, v) => s + v, 0);
    if (plannedInRange <= 0) return 0;
    const ratio = avgActual / plannedInRange;
    return Math.min(100, Math.round(ratio * 100));
  };

  // Find latest recorded period with actual data
  const latestActualRecord = useMemo(() => {
    if (!scurve) return null;
    const filled = scurve.periodRecords.filter((r) => r.status !== 'Belum ada data');
    return filled.length > 0 ? filled[filled.length - 1] : null;
  }, [scurve]);

  // ── Handlers ────────────────────────────────────────────
  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleGenerateSCurve = () => {
    if (!selectedProject) return;
    if (projectRABItems.length === 0) {
      showToast('Item RAB Kosong', 'Tambahkan item pekerjaan di RAB terlebih dahulu.', 'warning');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      generateSCurveFromRAB(selectedProject.id, 'weekly', 12);
      setIsGenerating(false);
      showToast('Berhasil', 'Jadwal Gantt Chart berhasil dibuat dari RAB.', 'success');
    }, 300);
  };

  const handleSync = () => {
    if (!selectedProject) return;
    setIsGenerating(true);
    setTimeout(() => {
      syncSCurveWithCurrentRAB(selectedProject.id);
      setIsGenerating(false);
      showToast('Sinkronisasi Berhasil', 'Jadwal Gantt Chart telah disinkronkan dengan RAB terbaru.', 'success');
    }, 300);
  };

  // ── No SCurve State ─────────────────────────────────────
  if (!scurve) {
    return (
      <div className="space-y-6" id="gantt-chart-view">
        {/* Header */}
        <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-6 border border-slate-200 dark:border-[var(--border-primary)]">
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Gantt Chart Jadwal Pekerjaan</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
            Visualisasi interaktif jadwal pekerjaan berbasis data Kurva S — bar plan vs aktual per periode.
          </p>
        </div>

        {/* Empty State */}
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-12 border border-slate-200 dark:border-[var(--border-primary)] text-center space-y-4 max-w-xl mx-auto shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Jadwal Kurva S Belum Dibuat</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
            Buat jadwal rencana Kurva S terlebih dahulu dari item RAB untuk menampilkan Gantt Chart interaktif.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleGenerateSCurve}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors inline-flex items-center space-x-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              <Calendar className="w-4 h-4" />
              <span>{isGenerating ? 'Menyusun...' : 'Buat Jadwal dari RAB'}</span>
            </button>
            <button
              onClick={() => setActiveTab('scurve-plan')}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Buka Rencana Kurva S
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────
  const selectedItem = selectedItemId
    ? scurve.scheduleItems.find((it) => it.id === selectedItemId)
    : null;

  return (
    <div className="space-y-5">
      {/* ── Top Banner ── */}
      <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-5 border border-slate-200 dark:border-[var(--border-primary)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <BarChart2 className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Gantt Chart Jadwal Pekerjaan (Interaktif)</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
            Visualisasi bar chart jadwal item pekerjaan berdasarkan rencana Kurva S. Klik item untuk melihat rincian alokasi periode.
          </p>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-700 dark:text-slate-200">
            <span>
              Proyek: <strong className="text-slate-900 dark:text-white">{selectedProject?.name || '—'}</strong>
            </span>
            <span>•</span>
            <span>
              <strong className="text-slate-900 dark:text-white">{scurve.totalPeriods}</strong> {scurve.periodType === 'weekly' ? 'Minggu' : 'Bulan'}
            </span>
            <span>•</span>
            <span><strong className="text-slate-900 dark:text-white">{scurve.scheduleItems.length}</strong> Pos Pekerjaan</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{formatRupiah(scurve.totalBudget)}</span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={isGenerating}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-2xs"
            title="Sinkronkan dengan item RAB terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>Sinkronkan RAB</span>
          </button>

          {/* Cetak PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Printer className="w-3.5 h-3.5 text-white" />
            )}
            <span>{isExportingPDF ? 'Mencetak...' : 'Cetak / Simpan PDF'}</span>
          </button>

          {/* S-Curve Link */}
          <button
            onClick={() => setActiveTab('scurve-plan')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Lihat Kurva S</span>
          </button>
        </div>
      </div>

      <div className="space-y-5 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-2xl" id="kurvas-export-area">
        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Total Durasi Proyek</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {scurve.totalPeriods} <span className="text-xs font-normal text-slate-600 dark:text-slate-300">{scurve.periodType === 'weekly' ? 'Minggu' : 'Bulan'}</span>
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
              {scurve.startDate ? `${scurve.startDate} s/d ${scurve.endDate}` : 'Time Schedule Aktif'}
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Rencana Kumulatif Saat Ini</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {latestActualRecord ? `${latestActualRecord.plannedCumulative.toFixed(2)}%` : '0.00%'}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
              Target per {latestActualRecord ? latestActualRecord.periodLabel : 'Periode 1'}
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Aktual Kumulatif</div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {latestActualRecord ? `${latestActualRecord.actualCumulative.toFixed(2)}%` : '0.00%'}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
              Realisasi Fisik Lapangan
            </div>
          </div>

          <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
            <div className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Status Deviasi Jadwal</div>
            <div className="text-sm font-bold mt-1 flex items-center space-x-1.5">
              {latestActualRecord ? (
                latestActualRecord.deviation >= 0 ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-400">+{latestActualRecord.deviation.toFixed(2)}% (Lebih Cepat)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-rose-700 dark:text-rose-400">{latestActualRecord.deviation.toFixed(2)}% (Terlambat)</span>
                  </>
                )
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Belum Ada Progres</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">
              {latestActualRecord ? latestActualRecord.status : 'Menunggu input aktual'}
            </div>
          </div>
        </div>

        {/* ── Toolbar & Control Panel ── */}
        <div className="bg-[var(--bg-elevated)] p-3.5 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            {/* Category Filter */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="all">Semua Kategori ({scurve.scheduleItems.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({scurve.scheduleItems.filter((i) => i.category === cat).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Group By Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-[var(--border-primary)] text-xs">
              <button
                onClick={() => setGroupBy('category')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  groupBy === 'category'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Grup Kategori
              </button>
              <button
                onClick={() => setGroupBy('none')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  groupBy === 'none'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Daftar Rata
              </button>
            </div>

            {/* Toggle Show Actual Progress */}
            <button
              onClick={() => setShowActual(!showActual)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium flex items-center space-x-1.5 transition-colors ${
                showActual
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Check className={`w-3.5 h-3.5 ${showActual ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
              <span>Tampilkan Progres Aktual Lapangan</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200">Skala Kolom:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-[var(--border-primary)] text-xs">
              {(['compact', 'normal', 'wide'] as ZoomLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setZoom(lvl)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    zoom === lvl
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {ZOOM_CONFIG[lvl].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main Gantt Chart Table / Canvas ── */}
        <div className="bg-[var(--bg-elevated)] rounded-xl border border-slate-200 dark:border-[var(--border-primary)] overflow-hidden shadow-2xs flex flex-col">
          <div ref={scrollRef} className="overflow-x-auto custom-scrollbar">
            <div className="min-w-full inline-block align-middle">
              {/* Header Row */}
              <div className="flex border-b border-slate-200 dark:border-[var(--border-primary)] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-[11px] uppercase tracking-wider sticky top-0 z-20">
                {/* Left Fixed Header Columns */}
                <div className="flex items-center shrink-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-[var(--border-primary)] z-30 sticky left-0 shadow-xs">
                  <div className="w-10 px-2 py-2.5 text-center font-bold">No</div>
                  <div className="w-20 px-2.5 py-2.5">Kode</div>
                  <div className="w-64 px-3 py-2.5">Uraian Pekerjaan</div>
                  <div className="w-16 px-2 py-2.5 text-right">Bobot</div>
                  <div className="w-14 px-2 py-2.5 text-center">Durasi</div>
                  {showActual && <div className="w-16 px-2 py-2.5 text-center">Aktual</div>}
                </div>

                {/* Timeline Header Columns */}
                <div className="flex shrink-0">
                  {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((p) => {
                    const isCurrent = latestActualRecord?.period === p;
                    const rec = scurve.periodRecords.find((r) => r.period === p);
                    return (
                      <div
                        key={p}
                        style={{ width: colWidth }}
                        className={`text-center py-1.5 px-1 border-r border-slate-200 dark:border-[var(--border-primary)] flex flex-col justify-between shrink-0 ${
                          isCurrent ? 'bg-blue-100/70 dark:bg-blue-900/40 border-b-2 border-b-blue-600 font-bold text-blue-900 dark:text-blue-200' : ''
                        }`}
                      >
                        <span className="text-[11px] font-bold">
                          {getPeriodShortLabel(p)}
                        </span>
                        <span className="text-[9px] text-slate-600 dark:text-slate-300 font-mono">
                          {rec ? `${rec.plannedProgress.toFixed(1)}%` : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {groupedItems.map((group, gIdx) => {
                  const isCollapsed = group.category ? collapsedCategories.has(group.category) : false;
                  const catColor = (group.category && CATEGORY_COLORS[group.category]) || DEFAULT_COLOR;
                  const groupWeight = group.items.reduce((sum, it) => sum + (it.weight || 0), 0);

                  return (
                    <React.Fragment key={group.category || gIdx}>
                      {/* Category Group Header Bar */}
                      {group.category && (
                        <div
                          onClick={() => toggleCategory(group.category!)}
                          className={`flex items-center cursor-pointer select-none hover:bg-slate-200 dark:hover:bg-slate-700/70 transition-colors ${catColor.header} border-y border-slate-200 dark:border-[var(--border-primary)]`}
                        >
                          {/* Left Group Header */}
                          <div
                            className={`flex items-center shrink-0 px-3 py-2 border-r border-slate-200 dark:border-[var(--border-primary)] sticky left-0 z-10 ${catColor.header}`}
                            style={{ width: showActual ? 400 : 336 }}
                          >
                            <div
                              aria-hidden="true"
                              className="mr-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                            <span className={`font-bold text-xs ${catColor.text} truncate`}>
                              {group.category} ({group.items.length} item)
                            </span>
                            <span className="ml-auto font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                              {formatNumber(groupWeight, 2)}%
                            </span>
                          </div>

                          {/* Category Timeline Span Marker */}
                          <div className="flex shrink-0 relative h-7 items-center" style={{ width: totalWidth }}>
                            {/* Span calculation across all items in group */}
                            {(() => {
                              const minStart = Math.min(...group.items.map((it) => it.startPeriod));
                              const maxEnd = Math.max(...group.items.map((it) => it.endPeriod));
                              if (minStart > 0 && maxEnd >= minStart) {
                                const left = (minStart - 1) * colWidth;
                                const width = (maxEnd - minStart + 1) * colWidth;
                                return (
                                  <div
                                    style={{ left, width }}
                                    className={`absolute h-3 rounded-full opacity-40 ${catColor.bar}`}
                                    title={`${group.category}: ${getPeriodShortLabel(minStart)} s/d ${getPeriodShortLabel(maxEnd)}`}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Group Items */}
                      {!isCollapsed &&
                        group.items.map((item, itemIdx) => {
                          const isHovered = hoveredItemId === item.id;
                          const isSelected = selectedItemId === item.id;
                          const actualPercent = getItemActualPercent(item.id);
                          const itemCatColor = CATEGORY_COLORS[item.category] || DEFAULT_COLOR;

                          // Bar position calculations
                          const barLeft = (item.startPeriod - 1) * colWidth + 2;
                          const barWidth = Math.max(12, (item.endPeriod - item.startPeriod + 1) * colWidth - 4);
                          const actualWidth = (barWidth * Math.min(100, actualPercent)) / 100;

                          return (
                            <div
                              key={item.id}
                              onMouseEnter={() => setHoveredItemId(item.id)}
                              onMouseLeave={() => setHoveredItemId(null)}
                              onClick={() => setSelectedItemId(isSelected ? null : item.id)}
                              className={`flex items-center hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                                isSelected ? 'bg-blue-50/80 dark:bg-slate-800/80 ring-1 ring-inset ring-blue-500' : isHovered ? 'bg-slate-50 dark:bg-slate-800/40' : ''
                              }`}
                            >
                              {/* Left Fixed Columns */}
                              <div className="flex items-center shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-[var(--border-primary)] sticky left-0 z-10 shadow-xs">
                                <div className="w-10 px-2 py-2 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                  {itemIdx + 1}
                                </div>
                                <div className="w-20 px-2.5 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
                                  {item.workCode || '-'}
                                </div>
                                <div className="w-64 px-3 py-2 text-slate-900 dark:text-white font-medium truncate" title={item.description}>
                                  {item.description}
                                </div>
                                <div className="w-16 px-2 py-2 text-right font-mono text-slate-900 dark:text-white font-bold text-[11px]">
                                  {formatNumber(item.weight, 2)}%
                                </div>
                                <div className="w-14 px-2 py-2 text-center font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                                  {item.duration} {scurve.periodType === 'weekly' ? 'M' : 'B'}
                                </div>
                                {showActual && (
                                  <div className="w-16 px-2 py-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        actualPercent >= 100
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                          : actualPercent > 0
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                      }`}
                                    >
                                      {actualPercent}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Gantt Bar Grid */}
                              <div
                                className="relative h-9 flex items-center shrink-0 select-none"
                                style={{ width: totalWidth }}
                              >
                                {/* Background Period Column Stripes */}
                                {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((p) => {
                                  const isCurrent = latestActualRecord?.period === p;
                                  return (
                                    <div
                                      key={p}
                                      style={{ width: colWidth }}
                                      className={`h-full border-r border-slate-100 dark:border-slate-800 shrink-0 ${
                                        isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                                      }`}
                                    />
                                  );
                                })}

                                {/* Planned Schedule Bar */}
                                <div
                                  style={{ left: barLeft, width: barWidth }}
                                  className={`absolute h-6 rounded-lg ${itemCatColor.bar} text-white shadow-2xs flex items-center justify-between px-2 text-[10px] font-bold overflow-hidden transition-all group hover:brightness-110 ${
                                    isSelected ? 'ring-2 ring-blue-600 ring-offset-1 z-10' : ''
                                  }`}
                                  title={`${item.description} (Periode ${item.startPeriod} - ${item.endPeriod}, Bobot: ${item.weight.toFixed(2)}%)`}
                                >
                                  {/* Actual progress overlay bar */}
                                  {showActual && actualPercent > 0 && (
                                    <div
                                      style={{ width: `${Math.min(100, actualPercent)}%` }}
                                      className="absolute inset-y-0 left-0 bg-black/25 z-0"
                                    />
                                  )}

                                  {/* Label inside bar if wide enough */}
                                  {barWidth >= 70 && (
                                    <span className="relative z-10 truncate text-[10px] font-medium tracking-tight">
                                      {item.weight.toFixed(2)}%
                                    </span>
                                  )}

                                  {showActual && barWidth >= 100 && (
                                    <span className="relative z-10 ml-auto text-[9px] font-mono opacity-90">
                                      {actualPercent}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chart Footer Info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center flex-wrap gap-4">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
                <span>Bar Rencana Jadwal</span>
              </div>
              {showActual && (
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-sm bg-slate-400 dark:bg-slate-600 inline-block" />
                  <span>Overlay Progres Aktual</span>
                </div>
              )}
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                <span>Garis Kolom Periode Aktif</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300">
              Total {scheduleItems.length} pos pekerjaan • Klik bar pekerjaan untuk rincian bobot per periode
            </div>
          </div>
        </div>

        {/* ── Selected Item Detail Drawer / Panel ── */}
        {selectedItem && (
          <div className="bg-[var(--bg-elevated)] rounded-xl border border-blue-200 dark:border-blue-900 p-4 shadow-sm space-y-3 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg">
                  <Info className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{selectedItem.workCode} - {selectedItem.description}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${(CATEGORY_COLORS[selectedItem.category] || DEFAULT_COLOR).badge}`}>
                      {selectedItem.category}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Periode Aktif: <strong className="text-slate-900 dark:text-white">{getPeriodLabel(selectedItem.startPeriod)}</strong> s/d <strong className="text-slate-900 dark:text-white">{getPeriodLabel(selectedItem.endPeriod)}</strong> ({selectedItem.duration} periode)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItemId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-[var(--border-primary)]">
              <div>
                <span className="text-slate-700 dark:text-slate-200 text-[11px]">Bobot terhadap Proyek:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{selectedItem.weight.toFixed(2)}%</div>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-200 text-[11px]">Estimasi Biaya Rencana:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{formatRupiah(selectedItem.plannedCost || 0)}</div>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-200 text-[11px]">Pola Distribusi Bobot:</span>
                <div className="font-bold text-blue-700 dark:text-blue-400 text-sm mt-0.5 capitalize">{selectedItem.distributionType || 'Bell Curve'}</div>
              </div>
              <div>
                <span className="text-slate-700 dark:text-slate-200 text-[11px]">Realisasi Aktual Saat Ini:</span>
                <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">{getItemActualPercent(selectedItem.id)}%</div>
              </div>
            </div>

            {/* Planned Period Value Distribution Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white mb-1.5">Distribusi Bobot per Periode:</div>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden text-xs text-center divide-x divide-slate-200 dark:divide-slate-700">
                {Array.from({ length: totalPeriods }, (_, i) => i + 1).map((p) => {
                  const inRange = p >= selectedItem.startPeriod && p <= selectedItem.endPeriod;
                  const val = selectedItem.plannedPeriodValues?.[p - 1] || 0;
                  return (
                    <div
                      key={p}
                      className={`flex-1 py-1.5 px-2 min-w-[50px] ${
                        inRange ? 'bg-blue-50 dark:bg-blue-900/40 font-bold text-blue-900 dark:text-blue-200' : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] font-semibold">{getPeriodShortLabel(p)}</div>
                      <div className="text-[11px] font-mono mt-0.5">{inRange ? `${val.toFixed(2)}%` : '-'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

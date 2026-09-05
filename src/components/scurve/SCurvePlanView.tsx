import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useApp } from '../../context/AppContext';
import { PdfExportButton } from "../common/PdfExportButton";
import { DistributionPattern, ScheduleItem } from '../../types/scurve';
import { formatRupiah } from '../../utils/formatters';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import {
  Calendar,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Layers,
  FileSpreadsheet,
  Download,
  BarChart2,
  Printer,
  Loader2,
} from 'lucide-react';

export const SCurvePlanView: React.FC = () => {
  const {
    selectedProject,
    projectRABItems,
    projectSCurve,
    generateSCurveFromRAB,
    syncSCurveWithCurrentRAB,
    updateScheduleItem,
    distributeScheduleWeights,
    setActiveTab,
    showToast,
  } = useApp();

  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [totalPeriods, setTotalPeriods] = useState<number>(12);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // High-Resolution PDF Export Engine
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Memproses PDF', 'Menyiapkan render visual resolusi tinggi...', 'info');
      // Delay to ensure charts and DOM finish rendering smoothly
      await new Promise((resolve) => setTimeout(resolve, 800));

      const element = document.getElementById('kurvas-export-area');
      if (!element) {
        showToast('Gagal', 'Area dokumen Kurva S tidak ditemukan.', 'error');
        setIsExportingPDF(false);
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
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

      const filename = `Rencana_KurvaS_${selectedProject?.name?.replace(/\s+/g, '_') || 'Proyek'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      showToast('Cetak PDF Berhasil', `Dokumen ${filename} berhasil diunduh.`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Gagal Cetak PDF', err.message || 'Terjadi kesalahan saat memproses dokumen PDF.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // If no SCurve exists yet for this project, let's allow 1-click initialization
  const handleInitSCurve = () => {
    if (!selectedProject) return;
    if (projectRABItems.length === 0) {
      showToast('Item RAB Kosong', 'Tambahkan item pekerjaan di RAB terlebih dahulu untuk membuat jadwal Kurva S.', 'warning');
      return;
    }
    setIsRegenerating(true);
    setTimeout(() => {
      generateSCurveFromRAB(selectedProject.id, periodType, totalPeriods);
      setIsRegenerating(false);
    }, 300);
  };

  const handleSyncFromRAB = () => {
    if (!selectedProject) return;
    setIsRegenerating(true);
    setTimeout(() => {
      syncSCurveWithCurrentRAB(selectedProject.id);
      setIsRegenerating(false);
    }, 300);
  };

  const scurve = projectSCurve;

  const filteredScheduleItems = scurve
    ? scurve.scheduleItems.filter(
        (it) => selectedCategory === 'all' || it.category === selectedCategory
      )
    : [];

  const categories = scurve
    ? Array.from(new Set(scurve.scheduleItems.map((i) => i.category)))
    : [];

  // Prepare chart data for Planned S-Curve
  const chartData = scurve
    ? scurve.periodRecords.map((r) => ({
        name: r.periodLabel.split(' ')[0], // e.g. M-1
        fullName: r.periodLabel,
        plannedWeekly: r.plannedProgress,
        plannedCumulative: r.plannedCumulative,
      }))
    : [];

  return (
    <div className="space-y-6" id="scurve-plan-view">
      {/* Header Banner */}
      <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-6 border border-slate-200 dark:border-[var(--border-primary)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Rencana Jadwal & Kurva S (Time Schedule)</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
            Distribusi bobot pekerjaan RAB secara proporsional sepanjang durasi proyek dengan kurva distribusi normal (Bell Curve) atau linier untuk membentuk target Kurva S standar konstruksi.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-700 dark:text-slate-200">
            <span>
              Proyek: <strong className="font-bold text-slate-900 dark:text-white">{selectedProject?.name || 'Belum Dipilih'}</strong>
            </span>
            <span>•</span>
            <span>{projectRABItems.length} Item RAB</span>
            <span>•</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold">
              Total Anggaran: {formatRupiah(scurve?.totalBudget || 0)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          {scurve && (
            <>
              <button
                onClick={handleSyncFromRAB}
                disabled={isRegenerating}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Ulang dari RAB</span>
              </button>

              <button
                onClick={() => setActiveTab('scurve-gantt')}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 shadow-2xs"
              >
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Gantt Chart</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
              >
                {isExportingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Printer className="w-4 h-4 text-white" />
                )}
                <span>{isExportingPDF ? 'Mencetak...' : 'Cetak PDF'}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('scurve-actual')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <span>Buka Input Progres Aktual</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!scurve ? (
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-12 border border-[var(--border-primary)] text-center space-y-5 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Jadwal Rencana Kurva S Belum Dibuat</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
              Sistem akan otomatis menghitung bobot (%) setiap item pekerjaan dari RAB dan memetakan jadwal pekerjaan berdasarkan kategori.
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Pilihan Periode Jadwal:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodType('weekly')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                    periodType === 'weekly'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Mingguan (Weekly)
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType('monthly')}
                  className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                    periodType === 'monthly'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Bulanan (Monthly)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Total Durasi Proyek ({periodType === 'weekly' ? 'Minggu' : 'Bulan'}):
              </label>
              <select
                value={totalPeriods}
                onChange={(e) => setTotalPeriods(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              >
                {[4, 6, 8, 10, 12, 14, 16, 20, 24, 32, 48, 52].map((num) => (
                  <option key={num} value={num}>
                    {num} {periodType === 'weekly' ? 'Minggu' : 'Bulan'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleInitSCurve}
            disabled={isRegenerating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 disabled:cursor-not-allowed"
          >
            <Calendar className="w-4 h-4" />
            <span>{isRegenerating ? 'Menyusun Jadwal...' : 'Buat Jadwal Rencana Kurva S Otomatis'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-2xl" id="kurvas-export-area">
          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Total Anggaran (Direct Cost)</span>
              <div className="text-base font-extrabold text-blue-900 dark:text-blue-400 mt-1">
                {formatRupiah(scurve.totalBudget)}
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Durasi Pelaksanaan</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {scurve.totalPeriods} {scurve.periodType === 'weekly' ? 'Minggu' : 'Bulan'}
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Total Item Terjadwal</span>
              <div className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                {scurve.scheduleItems.length} Pekerjaan
              </div>
            </div>
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Target Akhir Rencana</span>
              <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                100.00 %
              </div>
            </div>
          </div>

          {/* S-Curve Chart (Visual S-Curve Target) */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-slate-200 dark:border-[var(--border-primary)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Grafik Rencana Kurva S (Target Baseline)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Grafik garis kumulatif rencana (%) dan diagram batang target progres per periode.
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-blue-600 rounded-xs inline-block" />
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Rencana Kumulatif (%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 bg-blue-300 rounded-xs inline-block" />
                  <span className="text-slate-700 dark:text-slate-200 font-semibold">Rencana Periode (%)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value: any, name: any) => [
                      `${Number(value).toFixed(2)} %`,
                      name === 'plannedCumulative' ? 'Kumulatif Rencana' : 'Progres Periode',
                    ]}
                    labelFormatter={(label, items) => {
                      const item = items && items[0]?.payload;
                      return item ? item.fullName : label;
                    }}
                  />
                  <Bar dataKey="plannedWeekly" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line
                    type="monotone"
                    dataKey="plannedCumulative"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Schedule Breakdown Table */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-slate-200 dark:border-[var(--border-primary)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-[var(--border-primary)] bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Matriks Distribusi Bobot & Periode Pekerjaan
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Ubah periode mulai, selesai, dan pola distribusi (Bell Curve / Linier / Step) untuk setiap item.
                </p>
              </div>

              {/* Filter Category */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-700 dark:text-slate-200 font-semibold">Filter:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                >
                  <option value="all">Semua Kategori ({scurve.scheduleItems.length})</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-[var(--border-primary)] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Uraian Pekerjaan</th>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-right">Biaya (Rp)</th>
                    <th className="p-3 text-right">Bobot (%)</th>
                    <th className="p-3 text-center">Mulai</th>
                    <th className="p-3 text-center">Selesai</th>
                    <th className="p-3 text-center">Durasi</th>
                    <th className="p-3 text-center">Pola Distribusi</th>
                    {/* Period Columns */}
                    {scurve.periodRecords.map((rec) => (
                      <th key={rec.period} className="p-2 text-center text-[10px] w-12 bg-slate-100 dark:bg-slate-800 border-l border-slate-200 dark:border-[var(--border-primary)] text-slate-900 dark:text-white">
                        {scurve.periodType === 'weekly' ? 'M' : 'B'}-{rec.period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredScheduleItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-center text-slate-600 dark:text-slate-300">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.workCode}</span>
                          <span>{item.description}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{item.category}</td>
                      <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                        {formatRupiah(item.plannedCost)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-blue-900 dark:text-blue-400">
                        {item.weight.toFixed(2)} %
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.startPeriod}
                          onChange={(e) => {
                            const newStart = parseInt(e.target.value, 10);
                            const newEnd = Math.max(newStart, item.endPeriod);
                            updateScheduleItem(selectedProject!.id, item.id, {
                              startPeriod: newStart,
                              endPeriod: newEnd,
                            });
                          }}
                          className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold text-slate-900 dark:text-white"
                        >
                          {Array.from({ length: scurve.totalPeriods }, (_, i) => i + 1).map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.endPeriod}
                          onChange={(e) => {
                            const newEnd = parseInt(e.target.value, 10);
                            const newStart = Math.min(item.startPeriod, newEnd);
                            updateScheduleItem(selectedProject!.id, item.id, {
                              startPeriod: newStart,
                              endPeriod: newEnd,
                            });
                          }}
                          className="px-1.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[11px] font-bold text-slate-900 dark:text-white"
                        >
                          {Array.from({ length: scurve.totalPeriods }, (_, i) => i + 1).map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                        {item.endPeriod - item.startPeriod + 1} {scurve.periodType === 'weekly' ? 'mg' : 'bln'}
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.distributionType}
                          onChange={(e) =>
                            distributeScheduleWeights(
                              selectedProject!.id,
                              item.id,
                              e.target.value as DistributionPattern
                            )
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-[11px] font-semibold text-slate-900 dark:text-white"
                        >
                          <option value="bell-curve">Bell Curve (Normal)</option>
                          <option value="linear">Linier (Rata)</option>
                          <option value="step">Step (Awal Berat)</option>
                        </select>
                      </td>

                      {/* Period Values Breakdown */}
                      {scurve.periodRecords.map((rec) => {
                        const val = item.plannedPeriodValues[rec.period - 1] || 0;
                        const isWorking = rec.period >= item.startPeriod && rec.period <= item.endPeriod;
                        return (
                          <td
                            key={rec.period}
                            className={`p-2 text-center font-mono text-[10px] border-l border-slate-200 dark:border-slate-700 ${
                              isWorking && val > 0
                                ? 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300 font-bold'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {val > 0 ? val.toFixed(2) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                {/* Total Period Row */}
                <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-600">
                  <tr>
                    <td colSpan={4} className="p-3 text-right">
                      Jumlah Bobot Rencana Periode (%)
                    </td>
                    <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-400">
                      100.00 %
                    </td>
                    <td colSpan={4}></td>
                    {scurve.periodRecords.map((rec) => (
                      <td key={rec.period} className="p-2 text-center font-mono text-[10px] border-l border-slate-200 dark:border-slate-700 text-blue-900 dark:text-blue-400">
                        {rec.plannedProgress.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-blue-900 text-white font-bold">
                    <td colSpan={4} className="p-3 text-right">
                      Kumulatif Rencana (%)
                    </td>
                    <td className="p-3 text-right font-mono font-black text-white">
                      100.00 %
                    </td>
                    <td colSpan={4}></td>
                    {scurve.periodRecords.map((rec) => (
                      <td key={rec.period} className="p-2 text-center font-mono text-[10px] border-l border-blue-800 text-white">
                        {rec.plannedCumulative.toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

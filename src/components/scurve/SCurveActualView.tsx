import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';
import { useApp } from '../../context/AppContext';
import { PdfExportButton } from "../common/PdfExportButton";
import { PeriodProgressRecord } from '../../types/scurve';
import { formatRupiah } from '../../utils/formatters';
import {
  Activity,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Clock,
  ArrowRight,
  TrendingUp,
  Save,
  Trash2,
  Info,
  HelpCircle,
  Plus,
  Printer,
  Loader2,
} from 'lucide-react';

export const SCurveActualView: React.FC = () => {
  const {
    selectedProject,
    projectSCurve,
    updateActualProgressRecord,
    importSCurveCSV,
    exportSCurveCSV,
    setActiveTab,
    showToast,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected period to edit
  const [editingPeriod, setEditingPeriod] = useState<PeriodProgressRecord | null>(null);
  const [actualProgressInput, setActualProgressInput] = useState<number>(0);
  const [actualCostInput, setActualCostInput] = useState<number>(0);
  const [reportDateInput, setReportDateInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [issuesInput, setIssuesInput] = useState<string>('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // High-Resolution PDF Export Engine
  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      showToast('Memproses PDF', 'Menyiapkan render visual resolusi tinggi...', 'info');
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

      const filename = `Progres_Aktual_KurvaS_${selectedProject?.name?.replace(/\s+/g, '_') || 'Proyek'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
      showToast('Cetak PDF Berhasil', `Dokumen ${filename} berhasil diunduh.`, 'success');
    } catch (err: any) {
      console.error('PDF generation error:', err);
      showToast('Gagal Cetak PDF', err.message || 'Terjadi kesalahan saat memproses dokumen PDF.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const scurve = projectSCurve;

  const openEditModal = (rec: PeriodProgressRecord) => {
    setEditingPeriod(rec);
    setActualProgressInput(rec.actualProgress || 0);
    setActualCostInput(rec.actualCost || (rec.actualProgress ? Number(((rec.actualProgress / 100) * (scurve?.totalBudget || 0)).toFixed(0)) : 0));
    setReportDateInput(rec.reportDate || new Date().toISOString().split('T')[0]);
    setNotesInput(rec.notes || '');
    setIssuesInput(rec.issuesObstacles || '');
  };

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !editingPeriod) return;

    updateActualProgressRecord(selectedProject.id, editingPeriod.period, {
      actualProgress: Number(actualProgressInput) || 0,
      actualCost: Number(actualCostInput) || 0,
      reportDate: reportDateInput,
      notes: notesInput.trim(),
      issuesObstacles: issuesInput.trim(),
    });

    setEditingPeriod(null);
  };

  const handleExportCSV = () => {
    if (!selectedProject) return;
    const csv = exportSCurveCSV(selectedProject.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Kurva_S_${selectedProject.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Berhasil', 'File CSV Kurva S berhasil diunduh.', 'success');
  };

  const handleImportCSVFile = (file: File) => {
    if (!selectedProject) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        importSCurveCSV(selectedProject.id, content);
      }
    };
    reader.readAsText(file);
  };

  // Calculate high-level progress statistics
  const reportedRecords = scurve?.periodRecords.filter((r) => r.status !== 'Belum ada data') || [];
  const latestReported = reportedRecords.length > 0 ? reportedRecords[reportedRecords.length - 1] : null;

  const currentPlannedCum = latestReported ? latestReported.plannedCumulative : 0;
  const currentActualCum = latestReported ? latestReported.actualCumulative : 0;
  const currentDeviation = latestReported ? latestReported.deviation : 0;

  return (
    <div className="space-y-6" id="scurve-actual-view">
      {/* Header Banner */}
      <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-6 border border-slate-200 dark:border-[var(--border-primary)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Progres Aktual & Pengendalian Lapangan</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
            Input capaian fisik pekerjaan berkala, pantau deviasi (+/-) terhadap rencana, dan catat kendala teknis pelaksanaan proyek secara terstruktur.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-slate-700 dark:text-slate-200">
            <span>
              Proyek: <strong className="font-bold text-slate-900 dark:text-white">{selectedProject?.name || 'Pilih Proyek'}</strong>
            </span>
            <span>•</span>
            <span>{reportedRecords.length} Periode Telah Dilaporkan</span>
            <span>•</span>
            <span className="text-blue-700 dark:text-blue-400 font-bold">
              Deviasi Terakhir: {currentDeviation > 0 ? `+${currentDeviation.toFixed(2)}%` : `${currentDeviation.toFixed(2)}%`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleImportCSVFile(e.target.files[0]);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-2xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Impor CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-300 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {isExportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Printer className="w-4 h-4 text-white" />
            )}
            <span>{isExportingPDF ? 'Mencetak...' : 'Cetak PDF'}</span>
          </button>

          <button
            onClick={() => setActiveTab('scurve-comparison')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <span>Buka Grafik Perbandingan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!scurve ? (
        <div className="bg-[var(--bg-elevated)] rounded-2xl p-12 border border-slate-200 dark:border-[var(--border-primary)] text-center space-y-4 max-w-xl mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Jadwal Rencana Kurva S Belum Ada</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
            Buat jadwal rencana Kurva S terlebih dahulu sebelum memasukkan progres aktual lapangan.
          </p>
          <button
            onClick={() => setActiveTab('scurve-plan')}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Buka Rencana Kurva S</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6 bg-white dark:bg-slate-900 p-2 sm:p-4 rounded-2xl" id="kurvas-export-area">
          {/* Status KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Target Kumulatif (Sd. Saat Ini)</span>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {currentPlannedCum.toFixed(2)} %
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">Target rencana yang harus dicapai</p>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Realisasi Fisik Aktual</span>
              <div className="text-xl font-extrabold text-blue-900 dark:text-blue-400 mt-1">
                {currentActualCum.toFixed(2)} %
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">Capaian fisik aktual lapangan</p>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Deviasi Progres</span>
              <div
                className={`text-xl font-extrabold mt-1 ${
                  currentDeviation >= 0.5
                    ? 'text-blue-600 dark:text-blue-400'
                    : currentDeviation <= -2.0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {currentDeviation >= 0 ? `+${currentDeviation.toFixed(2)} %` : `${currentDeviation.toFixed(2)} %`}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {currentDeviation >= 0.5 ? 'Lebih cepat dari jadwal' : currentDeviation <= -2.0 ? 'Mengalami keterlambatan' : 'Sesuai dengan target rencana'}
              </p>
            </div>

            <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--border-primary)] shadow-2xs">
              <span className="text-xs text-slate-700 dark:text-slate-200 font-medium">Status Kesehatan Proyek</span>
              <div className="mt-1 flex items-center space-x-2">
                {currentDeviation >= 0.5 ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lebih Cepat
                  </span>
                ) : currentDeviation <= -2.0 ? (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Terlambat (Kritis)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sesuai Rencana
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">Berdasarkan deviasi kumulatif</p>
            </div>
          </div>

          {/* Table of Period Progress */}
          <div className="bg-[var(--bg-elevated)] rounded-2xl border border-slate-200 dark:border-[var(--border-primary)] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-[var(--border-primary)] bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Daftar Laporan Capaian Progres per Periode
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Klik tombol "Input / Edit Progres" pada baris periode untuk memperbarui capaian mingguan/bulanan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-[var(--border-primary)] uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-14 text-center">Periode</th>
                    <th className="p-3">Rentang Tanggal</th>
                    <th className="p-3 text-right">Rencana (%)</th>
                    <th className="p-3 text-right">Kum. Rencana (%)</th>
                    <th className="p-3 text-right">Aktual (%)</th>
                    <th className="p-3 text-right">Kum. Aktual (%)</th>
                    <th className="p-3 text-right">Deviasi (%)</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Catatan / Hambatan</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {scurve.periodRecords.map((rec) => {
                    const hasData = rec.status !== 'Belum ada data';

                    let statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                        Belum Diisi
                      </span>
                    );
                    if (rec.status === 'Lebih cepat') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Lebih Cepat
                        </span>
                      );
                    } else if (rec.status === 'Terlambat') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          Terlambat
                        </span>
                      );
                    } else if (rec.status === 'Sesuai rencana') {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Sesuai
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={rec.period}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          hasData ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40'
                        }`}
                      >
                        <td className="p-3 text-center font-bold text-slate-900 dark:text-white">
                          {scurve.periodType === 'weekly' ? 'M' : 'B'}-{rec.period}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                          {rec.periodLabel}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900 dark:text-white">
                          {rec.plannedProgress.toFixed(2)} %
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {rec.plannedCumulative.toFixed(2)} %
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-blue-900 dark:text-blue-400">
                          {hasData ? `${rec.actualProgress.toFixed(2)} %` : '-'}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-blue-900 dark:text-blue-400">
                          {hasData ? `${rec.actualCumulative.toFixed(2)} %` : '-'}
                        </td>
                        <td
                          className={`p-3 text-right font-mono font-extrabold ${
                            !hasData
                              ? 'text-slate-500 dark:text-slate-400'
                              : rec.deviation >= 0.5
                              ? 'text-blue-600 dark:text-blue-400'
                              : rec.deviation <= -2.0
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {hasData
                            ? rec.deviation >= 0
                              ? `+${rec.deviation.toFixed(2)} %`
                              : `${rec.deviation.toFixed(2)} %`
                            : '-'}
                        </td>
                        <td className="p-3 text-center">{statusBadge}</td>
                        <td className="p-3 text-xs text-slate-700 dark:text-slate-300 max-w-xs truncate" title={rec.notes || rec.issuesObstacles}>
                          {rec.notes ? (
                            <div>
                              <span>{rec.notes}</span>
                              {rec.issuesObstacles && (
                                <p className="text-[10px] text-rose-700 italic">Kendala: {rec.issuesObstacles}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400 italic">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => openEditModal(rec)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors inline-flex items-center gap-1 border border-blue-200"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{hasData ? 'Edit' : 'Input Progres'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Input Progress Modal */}
      {editingPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-elevated)]/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-lg overflow-hidden my-6">
            <div className="p-5 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  {scurve?.periodType === 'weekly' ? 'M' : 'B'}-{editingPeriod.period}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Input Progres Fisik Lapangan</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{editingPeriod.periodLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPeriod(null)}
                className="text-[var(--text-secondary)] hover:text-white p-1 rounded-lg hover:bg-[var(--bg-elevated-hover)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-6 space-y-4">
              {/* Planned Target Reference Banner */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-blue-700 font-semibold">Target Rencana Periode Ini:</span>
                  <div className="text-sm font-bold text-blue-950">{editingPeriod.plannedProgress.toFixed(2)} %</div>
                </div>
                <div className="text-right">
                  <span className="text-blue-700 font-semibold">Target Kumulatif:</span>
                  <div className="text-sm font-bold text-blue-950">{editingPeriod.plannedCumulative.toFixed(2)} %</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  Realisasi Progres Fisik Periode Ini (%) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={actualProgressInput}
                  onChange={(e) => setActualProgressInput(parseFloat(e.target.value) || 0)}
                  placeholder="Contoh: 8.50"
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  Realisasi Biaya Lapangan (Rp) (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={actualCostInput}
                  onChange={(e) => setActualCostInput(parseFloat(e.target.value) || 0)}
                  placeholder="Estimasi biaya dikeluarkan..."
                  className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Format: {formatRupiah(actualCostInput)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  Tanggal Laporan Progres
                </label>
                <input
                  type="date"
                  value={reportDateInput}
                  onChange={(e) => setReportDateInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  Uraian Capaian Pekerjaan Lapangan
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: 'Pengecoran plat lantai 1 selesai 100%, mulai pasang bata dinding lt. 1'..."
                  className="w-full px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">
                  Kendala & Rencana Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  value={issuesInput}
                  onChange={(e) => setIssuesInput(e.target.value)}
                  placeholder="Contoh: 'Hujan deras selama 2 hari, ditindaklanjuti dengan lembur 2 jam'..."
                  className="w-full px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Laporan Progres</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateRAB } from '../../utils/calculations';
import { formatRupiah, formatNumber, numberToWordsIndo, formatDateIndo } from '../../utils/formatters';
import { exportRABToCSV } from '../../utils/exportHelpers';
import { exportOfficialReportToPDF } from '../../utils/pdfGenerator';
import { RAB_CATEGORIES, RABCategory } from '../../types';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Settings,
  Eye,
  Columns,
  Sparkles,
  Loader2,
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedProject, projectRABItems, settings, setActiveTab, showToast } = useApp();

  const [reportType, setReportType] = useState<'detail' | 'recap'>('detail');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);

  if (!selectedProject) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-12 text-center shadow-2xs">
        <FileText className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">Belum Ada Proyek Terpilih</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Silakan pilih proyek konstruksi terlebih dahulu untuk menghasilkan laporan RAB.
        </p>
        <button
          onClick={() => setActiveTab('projects')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl"
        >
          Ke Daftar Proyek
        </button>
      </div>
    );
  }

  const calc = calculateRAB(
    projectRABItems,
    selectedProject.overheadPercent,
    selectedProject.profitPercent,
    selectedProject.taxPercent
  );

  // Export PDF resmi menggunakan vector engine (jspdf-autotable)
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await exportOfficialReportToPDF({
        project: selectedProject,
        items: projectRABItems,
        calc,
        settings,
        reportType,
        orientation,
        includeSignatures,
        reportDate,
        filename: `RAB_${selectedProject.name}_${reportType}`,
      });
      showToast('Export Berhasil', 'Dokumen PDF resmi (vektor murni) berhasil diunduh.', 'success');
    } catch (error) {
      console.error('Gagal generate PDF:', error);
      showToast('Gagal Export PDF', 'Terjadi kesalahan saat menyusun dokumen PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    try {
      if (window.self !== window.top) {
        // Jika di iframe AI Studio, langsung tawarkan unduhan PDF vektor resmi
        handleExportPDF();
        return;
      }
      window.print();
    } catch (e) {
      handleExportPDF();
    }
  };

  const handleExportCSV = () => {
    exportRABToCSV(selectedProject, projectRABItems, calc);
    showToast('Export Berhasil', 'Dokumen RAB CSV berhasil diunduh.', 'success');
  };

  // Group items by category
  const categoriesInUse = Array.from(new Set(projectRABItems.map((i) => i.category)));
  const orderedCategories: RABCategory[] = [...RAB_CATEGORIES].filter((cat) => categoriesInUse.includes(cat));
  categoriesInUse.forEach((cat) => {
    if (!orderedCategories.includes(cat as RABCategory)) orderedCategories.push(cat as RABCategory);
  });

  return (
    <div className="space-y-6" id="report-view">
      {/* Top Toolbar (Hidden on Print & html2canvas ignore) */}
      <div 
        data-html2canvas-ignore="true"
        className="no-print bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              Laporan Resmi Rencana Anggaran Biaya (RAB)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
              Vektor PDF Murni
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dokumen cetak berstandar konstruksi Indonesia lengkap dengan Kop Surat, Rekapitulasi & Lembar Pengesahan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-[var(--bg-elevated-hover)] p-1 rounded-xl text-xs">
            <button
              onClick={() => setReportType('detail')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                reportType === 'detail'
                  ? 'bg-[var(--bg-elevated)] text-blue-700 font-bold shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              RAB Rinci
            </button>
            <button
              onClick={() => setReportType('recap')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                reportType === 'recap'
                  ? 'bg-[var(--bg-elevated)] text-blue-700 font-bold shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Rekapitulasi Saja
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyusun PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Sheet Container (Strictly Isolated to Light Mode) */}
      <div className="flex justify-center">
        <div
          id="printable-report"
          style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          className="bg-white text-slate-900 shadow-xl border border-slate-300 rounded-xl p-8 sm:p-12 w-full max-w-4xl font-sans text-xs print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:m-0 print:rounded-none"
        >
          {/* Header Kop Surat Perusahaan */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-2xl tracking-tighter flex-shrink-0">
                RAB
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
                  {settings.companyName || 'PT. CITRA KUSUMA DEVELOPMENT'}
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">{settings.companyAddress}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Telp: {settings.companyPhone} &middot; Email: {settings.companyEmail}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Format Dokumen Resmi
              </span>
              <div className="text-xs font-mono font-bold text-slate-900 mt-1">
                {selectedProject.documentNo}
              </div>
              <div className="text-[11px] text-slate-500">
                Tanggal: {formatDateIndo(reportDate)}
              </div>
            </div>
          </div>

          {/* Judul Laporan */}
          <div className="text-center my-5">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
              RENCANA ANGGARAN BIAYA (RAB)
            </h2>
            <h3 className="text-sm font-bold text-blue-900 mt-0.5">
              {selectedProject.name}
            </h3>
          </div>

          {/* Project Identity Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-600">Pemilik / Klien:</span>{' '}
              <strong className="text-slate-900">{selectedProject.clientName}</strong>
            </div>
            <div>
              <span className="text-slate-600">Lokasi Proyek:</span>{' '}
              <strong className="text-slate-900">{selectedProject.location}</strong>
            </div>
            <div>
              <span className="text-slate-600">Pelaksana Kontraktor:</span>{' '}
              <strong className="text-slate-900">{selectedProject.contractor || settings.companyName}</strong>
            </div>
            <div>
              <span className="text-slate-600">Konsultan Perencana:</span>{' '}
              <strong className="text-slate-900">{selectedProject.consultant}</strong>
            </div>
            <div>
              <span className="text-slate-600">Tanggal Pelaksanaan:</span>{' '}
              <strong className="text-slate-900">
                {formatDateIndo(selectedProject.startDate)} s.d. {formatDateIndo(selectedProject.endDate)}
              </strong>
            </div>
            <div>
              <span className="text-slate-600">Tahun Anggaran:</span>{' '}
              <strong className="text-slate-900">{new Date().getFullYear()}</strong>
            </div>
          </div>

          {/* Table: If Detail Mode */}
          {reportType === 'detail' && (
            <div className="mb-6 overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold border-b border-slate-900 uppercase">
                    <th className="p-2 border-r border-slate-700 text-center w-8">No</th>
                    <th className="p-2 border-r border-slate-700 w-20">Kode</th>
                    <th className="p-2 border-r border-slate-700">Uraian Pekerjaan</th>
                    <th className="p-2 border-r border-slate-700 text-center w-14">Satuan</th>
                    <th className="p-2 border-r border-slate-700 text-right w-16">Volume</th>
                    <th className="p-2 border-r border-slate-700 text-right w-28">Harga Satuan (Rp)</th>
                    <th className="p-2 border-r border-slate-700 text-right w-32">Jumlah Biaya (Rp)</th>
                    <th className="p-2 text-right w-16">Bobot (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedCategories.map((cat, catIdx) => {
                    const catItems = projectRABItems.filter((it) => it.category === cat);
                    if (catItems.length === 0) return null;

                    const catSubtotal = catItems.reduce((s, it) => s + it.totalCost, 0);
                    const catWeight =
                      calc.directCost > 0 ? (catSubtotal / calc.directCost) * 100 : 0;
                    const romanNum = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'][catIdx] || String(catIdx + 1);

                    return (
                      <React.Fragment key={cat}>
                        {/* Category Row (SUB-TOTAL) */}
                        <tr className="bg-slate-200 text-slate-950 font-bold border-y-2 border-slate-400">
                          <td className="p-2 border-r border-slate-400 text-center font-mono font-black text-slate-950">{romanNum}</td>
                          <td colSpan={5} className="p-2 border-r border-slate-400 uppercase tracking-wide font-black text-xs text-slate-950">
                            {cat}
                          </td>
                          <td className="p-2 border-r border-slate-400 text-right font-mono font-black text-slate-950">
                            {formatRupiah(catSubtotal)}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-blue-900">
                            {formatNumber(catWeight, 2)}%
                          </td>
                        </tr>

                        {/* Item Rows */}
                        {catItems.map((item, itemIdx) => {
                          const itemWeight =
                            calc.directCost > 0 ? (item.totalCost / calc.directCost) * 100 : 0;
                          const prevItem = itemIdx > 0 ? catItems[itemIdx - 1] : null;
                          const isNewFloor = Boolean(item.floor && (!prevItem || prevItem.floor !== item.floor));
                          const isNewSubcategory = Boolean(item.subcategory && (!prevItem || prevItem.subcategory !== item.subcategory || isNewFloor));

                          return (
                            <React.Fragment key={item.id}>
                              {isNewFloor && (
                                <tr className="bg-blue-50 font-bold border-y border-blue-200">
                                  <td colSpan={8} className="p-2 pl-4 text-xs font-bold text-blue-900 uppercase tracking-wide">
                                    {item.floor}
                                  </td>
                                </tr>
                              )}

                              {isNewSubcategory && (
                                <tr className="bg-slate-100 font-semibold border-y border-slate-300">
                                  <td colSpan={8} className="p-1.5 pl-6 text-xs text-slate-900 uppercase tracking-wide">
                                    ▸ {item.subcategory}
                                  </td>
                                </tr>
                              )}

                              <tr className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="p-2 border-r border-slate-200 text-center text-slate-500 font-mono text-xs">
                                  {itemIdx + 1}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-mono text-slate-600 text-xs">
                                  {item.code}
                                </td>
                                <td className="p-2 border-r border-slate-200 font-medium">
                                  <div className="text-slate-900">{item.name}</div>
                                  {item.notes && (
                                    <div className="text-[10px] text-slate-500">{item.notes}</div>
                                  )}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-center text-slate-700">
                                  {item.unit}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">
                                  {formatNumber(item.volume, 2)}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono text-slate-800">
                                  {formatRupiah(item.unitPrice)}
                                </td>
                                <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-950">
                                  {formatRupiah(item.totalCost)}
                                </td>
                                <td className="p-2 text-right font-mono text-slate-700">
                                  {formatNumber(itemWeight, 2)}%
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Rekapitulasi Biaya Tabel */}
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
              REKAPITULASI BIAYA PEKERJAAN
            </h4>
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-900 uppercase">
                  <th className="p-2 border-r border-slate-700 text-center w-10">No</th>
                  <th className="p-2 border-r border-slate-700">Divisi / Kategori Pekerjaan</th>
                  <th className="p-2 border-r border-slate-700 text-right w-40">Jumlah Biaya (Rp)</th>
                  <th className="p-2 text-right w-24">Bobot (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {calc.categorySummaries.map((cat, idx) => (
                  <tr key={cat.category}>
                    <td className="p-2 border-r border-slate-200 text-center font-mono text-slate-600">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-900">{cat.category}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold text-slate-900">
                      {formatRupiah(cat.subtotal)}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-700">
                      {formatNumber(cat.weightPercent, 2)}%
                    </td>
                  </tr>
                ))}
                
                {/* Subtotal Biaya Langsung */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={2} className="p-2 border-r border-slate-300 text-right text-slate-900">
                    TOTAL BIAYA PEKERJAAN (REAL COST)
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono text-slate-900">
                    {formatRupiah(calc.directCost)}
                  </td>
                  <td className="p-2 text-right font-mono text-slate-900">100,00%</td>
                </tr>

                {/* PPN */}
                {selectedProject.taxPercent > 0 && (
                  <tr>
                    <td colSpan={2} className="p-2 border-r border-slate-300 text-right font-semibold text-slate-800">
                      PAJAK PERTAMBAHAN NILAI (PPN) ({selectedProject.taxPercent}%)
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono font-semibold text-slate-800">
                      {formatRupiah(calc.taxCost)}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                  </tr>
                )}

                {/* Grand Total */}
                <tr className="bg-blue-50 font-black text-sm border-t-2 border-slate-400">
                  <td colSpan={2} className="p-3 border-r border-blue-200 text-right uppercase text-blue-950">
                    GRAND TOTAL NILAI RAB
                  </td>
                  <td className="p-3 border-r border-blue-200 text-right font-mono text-blue-950">
                    {formatRupiah(calc.grandTotal)}
                  </td>
                  <td className="p-3 text-right font-mono text-blue-950">-</td>
                </tr>

                {/* Harga Rata-Rata per m2 */}
                {Boolean(selectedProject.buildingArea) && (
                  <tr className="bg-slate-50 font-bold text-xs border-t border-slate-200">
                    <td colSpan={2} className="p-2 border-r border-slate-300 text-right text-slate-800 uppercase">
                      Harga Permeter Bangunan (Luas: {selectedProject.buildingArea} m²)
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-blue-900">
                      {`${formatRupiah(Math.round(calc.grandTotal / (selectedProject.buildingArea || 1)))} / m²`}
                    </td>
                    <td className="p-2 text-right font-mono text-slate-500">-</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Terbilang Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-8">
            <div className="text-[10px] font-bold uppercase text-slate-500">Terbilang:</div>
            <div className="text-xs font-semibold text-slate-900 italic mt-0.5">
              "{numberToWordsIndo(calc.grandTotal)} Rupiah"
            </div>
          </div>

          {/* Lembar Tanda Tangan (3 Kolom: Disetujui Pemilik, Diperiksa Konsultan, Dibuat Kontraktor) */}
          {includeSignatures && (
            <div className="mt-10 pt-4 border-t border-slate-300">
              <div className="text-right text-xs text-slate-600 mb-6">
                {selectedProject.location}, {formatDateIndo(reportDate)}
              </div>

              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                {/* 1. Pemilik */}
                <div>
                  <div className="font-semibold text-slate-900">Disetujui Oleh,</div>
                  <div className="text-slate-600">Pemilik Proyek / Klien</div>
                  <div className="h-20" />
                  <div className="font-bold text-slate-900 underline">
                    {selectedProject.clientName || '................................'}
                  </div>
                  <div className="text-[10px] text-slate-500">Owner / Pemberi Tugas</div>
                </div>

                {/* 2. Konsultan */}
                <div>
                  <div className="font-semibold text-slate-900">Diperiksa Oleh,</div>
                  <div className="text-slate-600">Konsultan Pengawas / Perencana</div>
                  <div className="h-20" />
                  <div className="font-bold text-slate-900 underline">
                    {selectedProject.consultant || '................................'}
                  </div>
                  <div className="text-[10px] text-slate-500">Site Engineer / Estimator</div>
                </div>

                {/* 3. Kontraktor */}
                <div>
                  <div className="font-semibold text-slate-900">Dibuat Oleh,</div>
                  <div className="text-slate-600">Kontraktor Pelaksana</div>
                  <div className="h-20" />
                  <div className="font-bold text-slate-900 underline">
                    {selectedProject.contractor || settings.companyName || '................................'}
                  </div>
                  <div className="text-[10px] text-slate-500">Direktur Utama / Project Manager</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

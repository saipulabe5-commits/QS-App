import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Printer,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';

export const SCurveComparisonView: React.FC = () => {
  const { selectedProject, projectSCurve, exportSCurveCSV, showToast } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const scurve = projectSCurve;

  const handlePrint = () => {
    try {
      if (window.self !== window.top) {
        showToast(
          'Fitur Terblokir di Preview',
          'Sistem keamanan pratinjau memblokir fitur cetak. Buka aplikasi di Tab Baru (tombol pojok kanan atas) untuk mencetak/simpan PDF.',
          'warning'
        );
        return;
      }
      window.print();
    } catch (e) {
      window.print(); // Fallback if cross-origin check throws error
    }
  };

  const handleExportCSV = () => {
    if (!selectedProject) return;
    const csv = exportSCurveCSV(selectedProject.id);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_KurvaS_${selectedProject.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export Berhasil', 'Laporan Kurva S berhasil diunduh dalam format CSV.', 'success');
  };

  if (!scurve) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-12 border border-[var(--border-primary)] text-center space-y-4 max-w-xl mx-auto shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
          <TrendingUp className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)]">Kurva S Belum Tersedia</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Silakan buat jadwal rencana Kurva S terlebih dahulu pada menu Rencana Kurva S.
        </p>
      </div>
    );
  }

  // Reported records
  const reportedRecords = scurve.periodRecords.filter((r) => r.status !== 'Belum ada data');
  const latestReport = reportedRecords.length > 0 ? reportedRecords[reportedRecords.length - 1] : null;

  const currentPlanned = latestReport ? latestReport.plannedCumulative : 0;
  const currentActual = latestReport ? latestReport.actualCumulative : 0;
  const currentDev = latestReport ? latestReport.deviation : 0;

  // Chart data
  const chartData = scurve.periodRecords.map((r) => {
    const hasReport = r.status !== 'Belum ada data';
    return {
      periodName: `${scurve.periodType === 'weekly' ? 'M' : 'B'}-${r.period}`,
      fullName: r.periodLabel,
      plannedWeekly: r.plannedProgress,
      actualWeekly: hasReport ? r.actualProgress : null,
      plannedCum: r.plannedCumulative,
      actualCum: hasReport ? r.actualCumulative : null,
    };
  });

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header Banner */}
      <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-6 border border-slate-200 dark:border-[var(--border-primary)] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:bg-[var(--bg-elevated)] print:text-[var(--text-primary)] print:border-none print:p-0">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white print:hidden">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Evaluasi & Perbandingan Kurva S (Rencana vs Realisasi)</h1>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 print:text-[var(--text-secondary)] max-w-2xl">
            Laporan visual komparasi progres fisik konstruksi mingguan & kumulatif untuk pelaporan owner, konsultan manajemen konstruksi, dan kontraktor.
          </p>
          <div className="flex items-center space-x-3 mt-3 text-xs text-[var(--text-secondary)] print:text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Proyek: <strong className="text-white print:text-[var(--text-primary)]">{selectedProject?.name}</strong>
            </span>
            <span>•</span>
            <span>No. Dok: {selectedProject?.documentNumber || 'PRJ-2025-001'}</span>
            <span>•</span>
            <span>Kontraktor: {selectedProject?.contractor || '-'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-[var(--border-primary)] transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-primary)] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rencana Kumulatif Saat Ini</span>
          <div className="text-xl font-extrabold text-[var(--text-primary)] mt-1">
            {currentPlanned.toFixed(2)} %
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Target schedule baseline</p>
        </div>

        <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-primary)] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Realisasi Aktual Kumulatif</span>
          <div className="text-xl font-extrabold text-blue-900 mt-1">
            {currentActual.toFixed(2)} %
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Fisik lapangan tercapai</p>
        </div>

        <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-primary)] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Deviasi Kumulatif</span>
          <div
            className={`text-xl font-extrabold mt-1 flex items-center gap-1 ${
              currentDev >= 0.5
                ? 'text-blue-600'
                : currentDev <= -2.0
                ? 'text-rose-600'
                : 'text-emerald-600'
            }`}
          >
            {currentDev >= 0.5 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : currentDev <= -2.0 ? (
              <ArrowDownRight className="w-5 h-5" />
            ) : (
              <Minus className="w-5 h-5" />
            )}
            <span>{currentDev >= 0 ? `+${currentDev.toFixed(2)} %` : `${currentDev.toFixed(2)} %`}</span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            {currentDev >= 0.5 ? 'Surplus / Ahead' : currentDev <= -2.0 ? 'Defisit / Delay' : 'On Track'}
          </p>
        </div>

        <div className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-primary)] shadow-2xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status Pengendalian</span>
          <div className="mt-1">
            {currentDev >= 0.5 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lebih Cepat
              </span>
            ) : currentDev <= -2.0 ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Keterlambatan Fisik
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Proyek Sesuai Target
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-1">Periode terakhir terlapor</p>
        </div>
      </div>

      {/* Multi-Series S-Curve Interactive Recharts */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl p-6 border border-[var(--border-primary)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Kurva S Komparasi (Rencana vs Aktual Lapangan)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Garis biru menandakan target rencana, garis hijau/merah menandakan realisasi fisik aktual.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-blue-600 rounded-xs inline-block" />
              <span className="text-[var(--text-primary)] font-semibold">Rencana Kum. (%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-emerald-600 rounded-xs inline-block" />
              <span className="text-[var(--text-primary)] font-semibold">Aktual Kum. (%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-blue-200 rounded-xs inline-block" />
              <span className="text-slate-500 dark:text-slate-400">Rencana Mingguan</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 bg-emerald-200 rounded-xs inline-block" />
              <span className="text-slate-500 dark:text-slate-400">Aktual Mingguan</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="periodName" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                formatter={(value: any, name: any) => {
                  if (value === null || value === undefined) return ['-', ''];
                  const labelMap: Record<string, string> = {
                    plannedCum: 'Kumulatif Rencana',
                    actualCum: 'Kumulatif Realisasi',
                    plannedWeekly: 'Target Periode',
                    actualWeekly: 'Realisasi Periode',
                  };
                  return [`${Number(value).toFixed(2)} %`, labelMap[name] || name];
                }}
                labelFormatter={(label, items) => {
                  const it = items && items[0]?.payload;
                  return it ? it.fullName : label;
                }}
              />
              <Bar dataKey="plannedWeekly" fill="#bfdbfe" radius={[3, 3, 0, 0]} barSize={12} />
              <Bar dataKey="actualWeekly" fill="#a7f3d0" radius={[3, 3, 0, 0]} barSize={12} />
              <Line
                type="monotone"
                dataKey="plannedCum"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="actualCum"
                stroke={currentDev < -2.0 ? '#e11d48' : '#059669'}
                strokeWidth={3.5}
                dot={{ r: 5, fill: currentDev < -2.0 ? '#e11d48' : '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-elevated-hover)] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              Tabel Rekapitulasi Rencana vs Realisasi Progres
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rincian deviasi mingguan dan kumulatif secara mendalam.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-bold border-b border-[var(--border-primary)] uppercase tracking-wider">
              <tr>
                <th className="p-3 w-14 text-center">Periode</th>
                <th className="p-3">Rentang Waktu</th>
                <th className="p-3 text-right">Rencana (%)</th>
                <th className="p-3 text-right">Aktual (%)</th>
                <th className="p-3 text-right">Kum. Rencana (%)</th>
                <th className="p-3 text-right">Kum. Aktual (%)</th>
                <th className="p-3 text-right">Deviasi Kumulatif (%)</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Realisasi Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {scurve.periodRecords.map((rec) => {
                const hasData = rec.status !== 'Belum ada data';

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)]">
                    Belum Lapor
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
                      Sesuai Target
                    </span>
                  );
                }

                return (
                  <tr key={rec.period} className="hover:bg-[var(--bg-elevated-hover)] transition-colors">
                    <td className="p-3 text-center font-bold text-[var(--text-primary)]">
                      {scurve.periodType === 'weekly' ? 'M' : 'B'}-{rec.period}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)] font-medium">{rec.periodLabel}</td>
                    <td className="p-3 text-right font-mono text-[var(--text-primary)]">
                      {rec.plannedProgress.toFixed(2)} %
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[var(--text-primary)]">
                      {hasData ? `${rec.actualProgress.toFixed(2)} %` : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-blue-900">
                      {rec.plannedCumulative.toFixed(2)} %
                    </td>
                    <td className="p-3 text-right font-mono font-black text-blue-950">
                      {hasData ? `${rec.actualCumulative.toFixed(2)} %` : '-'}
                    </td>
                    <td
                      className={`p-3 text-right font-mono font-extrabold ${
                        !hasData
                          ? 'text-[var(--text-secondary)]'
                          : rec.deviation >= 0.5
                          ? 'text-blue-600'
                          : rec.deviation <= -2.0
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {hasData
                        ? rec.deviation >= 0
                          ? `+${rec.deviation.toFixed(2)} %`
                          : `${rec.deviation.toFixed(2)} %`
                        : '-'}
                    </td>
                    <td className="p-3 text-center">{statusBadge}</td>
                    <td className="p-3 text-right font-mono text-[var(--text-primary)]">
                      {hasData && rec.actualCost ? formatRupiah(rec.actualCost) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

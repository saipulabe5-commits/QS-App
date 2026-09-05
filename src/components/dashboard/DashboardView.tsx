import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PdfExportButton } from "../common/PdfExportButton";
import { calculateRAB, calculateCostStructure } from '../../utils/calculations';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { StatCards } from './StatCards';
import { CostBreakdownChart } from './CostBreakdownChart';
import { CategoryBreakdownCard } from './CategoryBreakdownCard';
import { RecentProjectsSection } from './RecentProjectsSection';
import {
  Sparkles,
  Ruler,
  Plus,
  Building2,
  FileSpreadsheet,
  Calendar,
  MapPin,
  Layers,
  Boxes,
  Database,
  RefreshCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewProjectModal?: () => void;
  onOpenAIModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewProjectModal,
  onOpenAIModal,
}) => {
  const {
    projects,
    rabItems,
    setActiveTab,
    setActiveProjectId,
    selectedProject,
    resetToDemoData,
    showToast,
  } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Trigger loading state for feedback demonstration
  const handleRefreshData = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
      showToast('Data Diperbarui', 'Dashboard berhasil memuat kalkulasi RAB terbaru.', 'success');
    }, 500);
  };

  // Hitung total nilai seluruh RAB dari semua proyek
  const totalPortfolioValue = projects.reduce((total, proj) => {
    const pItems = rabItems.filter((it) => it.projectId === proj.id);
    const calc = calculateRAB(pItems, proj.overheadPercent, proj.profitPercent, proj.taxPercent);
    return total + calc.grandTotal;
  }, 0);

  const activeProjectsCount = projects.filter((p) => p.status === 'Berjalan').length;
  const completedProjectsCount = projects.filter((p) => p.status === 'Selesai').length;
  const draftProjectsCount = projects.filter((p) => p.status === 'Draft').length;

  // Data kalkulasi untuk proyek aktif/terpilih saat ini
  const activeProjectItems = rabItems.filter(
    (it) => it.projectId === (selectedProject?.id || '')
  );

  const activeCalc = selectedProject
    ? calculateRAB(
        activeProjectItems,
        selectedProject.overheadPercent,
        selectedProject.profitPercent,
        selectedProject.taxPercent
      )
    : null;

  // Struktur biaya portofolio seluruh proyek
  const portfolioCostBreakdown = calculateCostStructure(rabItems, 5, 10, 11);

  // Struktur biaya proyek terpilih
  const selectedProjectCostBreakdown = selectedProject
    ? calculateCostStructure(
        activeProjectItems,
        selectedProject.overheadPercent,
        selectedProject.profitPercent,
        selectedProject.taxPercent
      )
    : null;

  // State: Error
  if (hasError) {
    return (
      <div className="bg-[var(--bg-elevated)] p-8 rounded-2xl border border-rose-200 shadow-2xs text-center my-8">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)]">Gagal Memuat Data Dashboard</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
          Terjadi kendala saat membaca data penyimpanan atau menghitung rekapitulasi.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setHasError(false)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
          <button
            onClick={resetToDemoData}
            className="px-4 py-2 bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] text-xs font-bold rounded-xl hover:bg-slate-200 dark:bg-slate-700 transition-colors border border-[var(--border-primary)]"
          >
            Reset Data Awal
          </button>
        </div>
      </div>
    );
  }

  // State: Loading Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Welcome Skeleton */}
        <div className="bg-[var(--bg-elevated-hover)] h-44 rounded-2xl" />
        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-elevated)] h-28 rounded-2xl border border-[var(--border-primary)]" />
          <div className="bg-[var(--bg-elevated)] h-28 rounded-2xl border border-[var(--border-primary)]" />
          <div className="bg-[var(--bg-elevated)] h-28 rounded-2xl border border-[var(--border-primary)]" />
          <div className="bg-[var(--bg-elevated)] h-28 rounded-2xl border border-[var(--border-primary)]" />
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[var(--bg-elevated)] h-80 rounded-2xl border border-[var(--border-primary)]" />
          <div className="bg-[var(--bg-elevated)] h-80 rounded-2xl border border-[var(--border-primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="export-pdf-container">
      {/* 1. Header Banner */}
      <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-2xl p-6 sm:p-7 relative border border-slate-200 dark:border-[var(--border-primary)] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>Sistem Estimasi RAB Terstandarisasi SNI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)] dark:text-white">
              Dashboard Estimasi & Anggaran Biaya
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Pantau rekapitulasi nilai proyek, komposisi upah, bahan, peralatan, serta distribusi
              anggaran per divisi konstruksi secara real-time.
            </p>

            {/* Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <PdfExportButton elementId="export-pdf-container" filename="Dashboard_RAB" title="Dashboard Eksekutif" isLandscape={true} />
              <button
                onClick={() => {
                  if (onOpenNewProjectModal) onOpenNewProjectModal();
                  else setActiveTab('projects');
                }}
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Proyek Baru</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenAIModal) onOpenAIModal();
                }}
                className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-white border border-[var(--border-primary)] text-xs font-semibold rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>AI Estimator Cepat</span>
              </button>

              <button
                onClick={() => setActiveTab('drawings')}
                className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-[var(--border-primary)] text-xs font-semibold rounded-xl transition-colors"
              >
                <Boxes className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                <span>Analisis Gambar (AI)</span>
              </button>

              <button
                onClick={() => setActiveTab('scurve-plan')}
                className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-[var(--border-primary)] text-xs font-semibold rounded-xl transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Jadwal Kurva S</span>
              </button>

              <button
                onClick={() => setActiveTab('calculator')}
                className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-[var(--border-primary)] text-xs font-semibold rounded-xl transition-colors"
              >
                <Ruler className="w-4 h-4" />
                <span>Kalkulator Volume</span>
              </button>

              <button
                onClick={handleRefreshData}
                className="inline-flex items-center space-x-1.5 px-3 py-2.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--text-secondary)] hover:text-slate-900 dark:hover:text-white border border-[var(--border-primary)] text-xs font-medium rounded-xl transition-colors ml-auto sm:ml-0"
                title="Refresh Perhitungan"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Segarkan</span>
              </button>
            </div>
          </div>

          {/* Quick Active Project Card in Banner */}
          {selectedProject && activeCalc && (
            <div className="bg-[var(--bg-elevated-hover)]/90 border border-[var(--border-primary)] p-4 rounded-xl max-w-sm w-full">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400">
                  <Building2 className="w-3.5 h-3.5" />
                  Proyek Terpilih Saat Ini
                </span>
                <span
                  className={`px-2 py-0.5 rounded-sm font-bold text-[10px] ${
                    selectedProject.status === 'Berjalan'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800/60'
                      : selectedProject.status === 'Selesai'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/60'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {selectedProject.status}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] mt-2 truncate" title={selectedProject.name}>
                {selectedProject.name}
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">
                {selectedProject.documentNo}
              </p>

              <div className="mt-3 pt-3 border-t border-[var(--border-primary)]/80 flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Nilai Grand Total:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                  {formatRupiah(activeCalc.grandTotal)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('rab')}
                  className="flex-1 py-1.5 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Buka RAB</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="py-1.5 px-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-lg text-center transition-colors flex items-center space-x-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Laporan</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. 4 Stat Cards */}
      <StatCards
        totalPortfolioValue={totalPortfolioValue}
        projects={projects}
        activeProjectsCount={activeProjectsCount}
        completedProjectsCount={completedProjectsCount}
        draftProjectsCount={draftProjectsCount}
        onNavigateToProjects={() => setActiveTab('projects')}
      />

      {/* 3. Selected Project Deep Dive & Cost Structure Breakdown */}
      {selectedProject && activeCalc && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Project Details Card */}
          <div className="bg-[var(--bg-elevated)] p-5 sm:p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs lg:col-span-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  Rincian Proyek Aktif
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-sm ${
                    selectedProject.status === 'Berjalan'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                      : selectedProject.status === 'Selesai'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30'
                      : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                  }`}
                >
                  {selectedProject.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--text-primary)] mt-4 leading-snug">
                {selectedProject.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">{selectedProject.documentNo}</p>

              <div className="mt-4 space-y-2.5 text-xs text-[var(--text-secondary)]">
                <div className="flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                  <span className="truncate">
                    Klien: <strong>{selectedProject.clientName}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                  <span className="truncate">{selectedProject.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                  <span>
                    Durasi: {formatDateIndo(selectedProject.startDate)} s.d.{' '}
                    {formatDateIndo(selectedProject.endDate)}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Biaya Pekerjaan ({activeProjectItems.length} item)</span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatRupiah(activeCalc.directCost)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>PPN / Pajak ({selectedProject.taxPercent}%)</span>
                  <span>{formatRupiah(activeCalc.taxCost)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[var(--text-primary)] pt-2 border-t border-[var(--border-primary)]">
                  <span>Grand Total RAB</span>
                  <span className="text-blue-700 text-base">
                    {formatRupiah(activeCalc.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('rab')}
                className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center transition-colors flex items-center justify-center space-x-1.5"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Detail RAB</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="py-2.5 px-3.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-bold rounded-xl text-center transition-colors border border-[var(--border-primary)]"
              >
                Laporan
              </button>
            </div>
          </div>

          {/* Category Breakdown Component */}
          <div className="lg:col-span-2">
            <CategoryBreakdownCard
              categorySummaries={activeCalc.categorySummaries}
              onNavigateToRAB={() => setActiveTab('rab')}
              selectedProjectName={selectedProject.name}
            />
          </div>
        </div>
      )}

      {/* 4. Cost Structure Chart (Material, Labor, Equipment, Overhead, Profit, Tax) */}
      <CostBreakdownChart
        portfolioBreakdown={portfolioCostBreakdown}
        selectedProjectBreakdown={selectedProjectCostBreakdown}
        selectedProjectName={selectedProject?.name}
      />

      {/* 5. Recent Projects Table Section */}
      <RecentProjectsSection
        projects={projects}
        rabItems={rabItems}
        selectedProjectId={selectedProject?.id || null}
        onSelectProject={(id) => setActiveProjectId(id)}
        onOpenRAB={(id) => {
          setActiveProjectId(id);
          setActiveTab('rab');
        }}
        onOpenReport={(id) => {
          setActiveProjectId(id);
          setActiveTab('reports');
        }}
        onOpenNewProjectModal={() => {
          if (onOpenNewProjectModal) onOpenNewProjectModal();
          else setActiveTab('projects');
        }}
        onNavigateToProjects={() => setActiveTab('projects')}
      />

      {/* 6. Quick Access Navigation Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AHSP */}
        <div
          onClick={() => setActiveTab('ahsp')}
          className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-700 transition-colors">
              Analisis Harga Satuan (AHSP)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Koefisien tenaga kerja, bahan baku, dan alat sesuai formula SNI PUPR.
            </p>
          </div>
          <span className="mt-3 text-xs font-bold text-blue-700 flex items-center space-x-1">
            <span>Buka Modul</span>
            <span>&rarr;</span>
          </span>
        </div>

        {/* Database Harga */}
        <div
          onClick={() => setActiveTab('database')}
          className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] flex items-center justify-center mb-3 border border-[var(--border-primary)] group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-700 transition-colors">
              Database Harga & Upah
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Master harga material, standar upah tukang/mandor, dan tarif sewa alat.
            </p>
          </div>
          <span className="mt-3 text-xs font-bold text-blue-700 flex items-center space-x-1">
            <span>Buka Modul</span>
            <span>&rarr;</span>
          </span>
        </div>

        {/* Template Pekerjaan */}
        <div
          onClick={() => setActiveTab('templates')}
          className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-purple-700 transition-colors">
              Template RAB Siap Pakai
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Template rumah tinggal tipe 36/45/70, ruko 2 lantai, saluran, dan renovasi.
            </p>
          </div>
          <span className="mt-3 text-xs font-bold text-purple-700 flex items-center space-x-1">
            <span>Buka Modul</span>
            <span>&rarr;</span>
          </span>
        </div>

        {/* Kalkulator Volume */}
        <div
          onClick={() => setActiveTab('calculator')}
          className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Ruler className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-emerald-700 transition-colors">
              Kalkulator Volume Cepat
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hitung kubikasi beton, luas dinding, galian tanah, dan langsung masukkan ke RAB.
            </p>
          </div>
          <span className="mt-3 text-xs font-bold text-emerald-700 flex items-center space-x-1">
            <span>Buka Modul</span>
            <span>&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
};

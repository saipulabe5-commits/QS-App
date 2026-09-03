import React from 'react';
import { Briefcase, TrendingUp, Coins, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { Project } from '../../types';

interface StatCardsProps {
  totalPortfolioValue: number;
  projects: Project[];
  activeProjectsCount: number;
  completedProjectsCount: number;
  draftProjectsCount: number;
  onNavigateToProjects: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalPortfolioValue,
  projects,
  activeProjectsCount,
  completedProjectsCount,
  draftProjectsCount,
  onNavigateToProjects,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {/* Stat 1: Total Nilai RAB */}
      <div className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-2xs hover:border-[var(--border-primary)] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Nilai Seluruh RAB
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <Coins className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
            {formatRupiah(totalPortfolioValue)}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-400">
            <span>Akumulasi {projects.length} proyek</span>
            <span className="font-semibold text-blue-700">Portofolio</span>
          </div>
        </div>
      </div>

      {/* Stat 2: Total Proyek */}
      <div
        onClick={onNavigateToProjects}
        className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Proyek
          </span>
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] flex items-center justify-center border border-[var(--border-primary)] group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-baseline gap-1.5">
            {projects.length}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Proyek Terdaftar</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-400">
            <span className="group-hover:text-blue-700 font-medium transition-colors">Lihat Semua</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-blue-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Stat 3: Proyek Berjalan / Aktif */}
      <div className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-2xs hover:border-[var(--border-primary)] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Proyek Aktif (Berjalan)
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-emerald-700 tracking-tight flex items-baseline gap-1.5">
            {activeProjectsCount}
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Dalam Pengerjaan</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-400">
            <span>Pelaksanaan Lapangan</span>
            <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 font-bold text-[10px]">
              {projects.length > 0 ? Math.round((activeProjectsCount / projects.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Stat 4: Selesai & Draft */}
      <div className="bg-[var(--bg-elevated)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-2xs hover:border-[var(--border-primary)] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Selesai & Perencanaan
          </span>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-baseline gap-1.5">
            {completedProjectsCount}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Selesai / {draftProjectsCount} Draft</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 dark:text-slate-400">
            <span>Dokumen Selesai: {completedProjectsCount}</span>
            <span className="px-2 py-0.5 rounded-sm bg-purple-50 text-purple-700 font-bold text-[10px]">
              Tuntas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

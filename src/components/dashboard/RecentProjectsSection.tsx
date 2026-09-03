import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  ArrowRight,
  Plus,
  Calendar,
  Building2,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Project, RABItem, ProjectStatus } from '../../types';
import { calculateRAB } from '../../utils/calculations';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface RecentProjectsSectionProps {
  projects: Project[];
  rabItems: RABItem[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onOpenRAB: (id: string) => void;
  onOpenReport: (id: string) => void;
  onOpenNewProjectModal: () => void;
  onNavigateToProjects: () => void;
}

export const RecentProjectsSection: React.FC<RecentProjectsSectionProps> = ({
  projects,
  rabItems,
  selectedProjectId,
  onSelectProject,
  onOpenRAB,
  onOpenReport,
  onOpenNewProjectModal,
  onNavigateToProjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | ProjectStatus>('Semua');

  // Filter projects
  const filteredProjects = projects.filter((proj) => {
    const matchSearch =
      proj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.documentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proj.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'Semua' || proj.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-2xs overflow-hidden">
      {/* Section Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Daftar Proyek Terbaru</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Status pelaksanaan, nilai anggaran RAB, dan dokumen kontrak konstruksi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewProjectModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Proyek</span>
          </button>
          <button
            onClick={onNavigateToProjects}
            className="text-xs font-bold text-[var(--text-primary)] hover:text-blue-700 hover:bg-[var(--bg-elevated-hover)] px-3 py-2 rounded-xl border border-[var(--border-primary)] transition-colors flex items-center space-x-1"
          >
            <span>Semua Proyek</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-5 py-3 bg-[var(--bg-elevated-hover)] border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama proyek, no. dokumen, klien, atau lokasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto text-xs">
          {(['Semua', 'Berjalan', 'Draft', 'Selesai'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:bg-[var(--bg-elevated-hover)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-[var(--text-primary)]">
            {projects.length === 0 ? 'Belum Ada Proyek Terdaftar' : 'Tidak Ditemukan Proyek'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {projects.length === 0
              ? 'Mulai estimasi dengan membuat proyek baru atau pilih template standar pekerjaan.'
              : 'Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={onOpenNewProjectModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
            >
              + Buat Proyek Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-secondary)]">
            <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-bold border-b border-[var(--border-primary)] uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Nama Proyek</th>
                <th className="px-4 py-3.5">No. Dokumen</th>
                <th className="px-4 py-3.5">Pemilik / Lokasi</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Nilai Total RAB</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((proj) => {
                const pItems = rabItems.filter((it) => it.projectId === proj.id);
                const pCalc = calculateRAB(
                  pItems,
                  proj.overheadPercent,
                  proj.profitPercent,
                  proj.taxPercent
                );
                const isSelected = proj.id === selectedProjectId;

                return (
                  <tr
                    key={proj.id}
                    className={`hover:bg-[var(--bg-elevated-hover)] transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Nama Proyek */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)] text-sm truncate max-w-[240px]">
                          {proj.name}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-sm border border-blue-200">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-1 flex items-center space-x-1.5">
                        <Calendar className="w-3 h-3 text-[var(--text-secondary)]" />
                        <span>Dibuat: {formatDateIndo(proj.createdAt)}</span>
                      </div>
                    </td>

                    {/* No. Dokumen */}
                    <td className="px-4 py-4 font-mono text-[var(--text-primary)] font-semibold">
                      {proj.documentNo}
                    </td>

                    {/* Klien / Lokasi */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                        {proj.clientName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px] mt-0.5">
                        {proj.location}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          proj.status === 'Berjalan'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : proj.status === 'Selesai'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </td>

                    {/* Nilai Total RAB */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-black text-[var(--text-primary)] text-sm">
                        {formatRupiah(pCalc.grandTotal)}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {pItems.length} item pekerjaan
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            onSelectProject(proj.id);
                            onOpenRAB(proj.id);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-colors shadow-2xs flex items-center space-x-1"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>RAB</span>
                        </button>
                        <button
                          onClick={() => {
                            onSelectProject(proj.id);
                            onOpenReport(proj.id);
                          }}
                          className="px-2.5 py-1.5 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] font-semibold rounded-lg text-xs transition-colors border border-[var(--border-primary)]"
                          title="Lihat & Cetak Laporan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

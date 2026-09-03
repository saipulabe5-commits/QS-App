import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { calculateRAB } from '../../utils/calculations';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../layout/ConfirmModal';
import { ProjectModal } from './ProjectModal';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Building2,
  Calendar,
  MapPin,
  FileSpreadsheet,
  Printer,
  Copy,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ProjectListViewProps {
  onOpenNewProjectModal?: () => void;
  onNewProject?: () => void;
  onEditProject?: (project: Project) => void;
}

export const ProjectListView: React.FC<ProjectListViewProps> = ({
  onOpenNewProjectModal,
  onNewProject,
  onEditProject,
}) => {
  const {
    projects,
    rabItems,
    setActiveTab,
    setActiveProjectId,
    deleteProject,
    duplicateProject,
    updateProject,
  } = useApp();

  const handleCreateNew = onNewProject || onOpenNewProjectModal;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Edit & Delete modal state
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleEdit = (proj: Project) => {
    if (onEditProject) {
      onEditProject(proj);
    } else {
      setProjectToEdit(proj);
    }
  };

  // Filtering
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.documentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ? true : p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Daftar Seluruh Proyek ({projects.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen dokumen RAB, spesifikasi kontrak, dan status pengerjaan
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleCreateNew}
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Proyek</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--bg-elevated)] p-4 rounded-2xl border border-[var(--border-primary)] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama proyek, no. dokumen, klien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Filters and View Mode Toggle */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'Draft', 'Berjalan', 'Selesai'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {st === 'all' ? 'Semua Status' : st}
              </button>
            ))}
          </div>

          {/* Grid/Table Switcher */}
          <div className="hidden sm:flex items-center bg-[var(--bg-elevated-hover)] p-1 rounded-xl border border-[var(--border-primary)]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-[var(--text-secondary)] transition-colors ${
                viewMode === 'grid' ? 'bg-[var(--bg-elevated)] text-blue-600 shadow-2xs font-bold' : 'hover:text-[var(--text-primary)]'
              }`}
              title="Tampilan Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-[var(--text-secondary)] transition-colors ${
                viewMode === 'table' ? 'bg-[var(--bg-elevated)] text-blue-600 shadow-2xs font-bold' : 'hover:text-[var(--text-primary)]'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List / Grid */}
      {filteredProjects.length === 0 ? (
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] p-12 text-center shadow-2xs">
          <Building2 className="w-12 h-12 text-slate-600 dark:text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--text-primary)]">Tidak Ada Proyek yang Sesuai</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all'
              ? 'Coba sesuaikan kata kunci pencarian atau ganti filter status.'
              : 'Anda belum memiliki proyek konstruksi. Buat proyek pertama Anda sekarang!'}
          </p>
          <button
            onClick={onOpenNewProjectModal}
            className="mt-5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            + Buat Proyek Baru
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const pItems = rabItems.filter((it) => it.projectId === proj.id);
            const pCalc = calculateRAB(pItems, proj.overheadPercent, proj.profitPercent, proj.taxPercent);

            return (
              <div
                key={proj.id}
                className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-2xs hover:shadow-md hover:border-[var(--border-primary)] transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Status & Doc No */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-[var(--bg-elevated-hover)] px-2 py-0.5 rounded-md truncate max-w-[170px]">
                      {proj.documentNo}
                    </span>
                    <select
                      value={proj.status}
                      onChange={(e) => updateProject(proj.id, { status: e.target.value as ProjectStatus })}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-hidden ${
                        proj.status === 'Berjalan'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : proj.status === 'Selesai'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] border-[var(--border-primary)]'
                      }`}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Berjalan">Berjalan</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      setActiveTab('rab');
                    }}
                    className="text-base font-bold text-[var(--text-primary)] line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-snug"
                    title={proj.name}
                  >
                    {proj.name}
                  </h3>

                  {/* Client & Location */}
                  <div className="mt-3 space-y-1.5 text-xs text-[var(--text-secondary)]">
                    <div className="flex items-center space-x-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="truncate">Klien: <strong>{proj.clientName || '-'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="truncate">{proj.location || '-'}</span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span>
                        Mulai: {formatDateIndo(proj.startDate)}
                      </span>
                    </div>
                  </div>

                  {/* Financial Overview Pill */}
                  <div className="mt-4 p-3 bg-[var(--bg-elevated-hover)] rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                        Total Anggaran (RAB)
                      </div>
                      <div className="text-base font-black text-blue-900 tracking-tight">
                        {formatRupiah(pCalc.grandTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">
                        Item Pekerjaan
                      </div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        {pItems.length} Pos
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3 bg-[var(--bg-elevated-hover)] border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setActiveProjectId(proj.id);
                      setActiveTab('rab');
                    }}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl text-center transition-colors flex items-center justify-center space-x-1.5 shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Buka RAB</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setActiveProjectId(proj.id);
                        setActiveTab('reports');
                      }}
                      title="Cetak Laporan"
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicateProject(proj.id)}
                      title="Duplikasi Proyek"
                      className="p-2 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(proj)}
                      title="Edit Proyek"
                      className="p-2 text-[var(--text-secondary)] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setProjectToDelete(proj)}
                      title="Hapus Proyek"
                      className="p-2 text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-primary)] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-semibold border-b border-[var(--border-primary)] uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Nama Proyek</th>
                  <th className="px-4 py-3.5">No. Dokumen</th>
                  <th className="px-4 py-3.5">Klien & Lokasi</th>
                  <th className="px-4 py-3.5">Periode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Grand Total RAB</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((proj) => {
                  const pItems = rabItems.filter((it) => it.projectId === proj.id);
                  const pCalc = calculateRAB(pItems, proj.overheadPercent, proj.profitPercent, proj.taxPercent);

                  return (
                    <tr key={proj.id} className="hover:bg-[var(--bg-elevated-hover)] transition-colors">
                      <td className="px-5 py-4">
                        <div
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setActiveTab('rab');
                          }}
                          className="font-bold text-[var(--text-primary)] text-sm hover:text-blue-600 cursor-pointer"
                        >
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {pItems.length} pos pekerjaan
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-medium text-[var(--text-primary)]">
                        {proj.documentNo}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-[var(--text-primary)]">{proj.clientName}</div>
                        <div className="text-[11px] text-[var(--text-secondary)]">{proj.location}</div>
                      </td>
                      <td className="px-4 py-4 text-[11px] text-[var(--text-secondary)]">
                        {formatDateIndo(proj.startDate)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            proj.status === 'Berjalan'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : proj.status === 'Selesai'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-[var(--text-primary)] text-sm">
                        {formatRupiah(pCalc.grandTotal)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setActiveProjectId(proj.id);
                              setActiveTab('rab');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            RAB
                          </button>
                          <button
                            onClick={() => handleEdit(proj)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateProject(proj.id)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                            title="Duplikasi"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProjectToDelete(proj)}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Edit Modal Fallback */}
      <ProjectModal
        isOpen={Boolean(projectToEdit)}
        projectToEdit={projectToEdit}
        onClose={() => setProjectToEdit(null)}
      />

      {/* Confirmation Modal for Project Deletion */}
      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        title="Hapus Proyek Konstruksi?"
        message={`Apakah Anda yakin ingin menghapus proyek "${projectToDelete?.name}" beserta seluruh data rincian item RAB di dalamnya? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus Proyek"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};

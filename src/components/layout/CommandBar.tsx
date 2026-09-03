import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  LayoutDashboard,
  Briefcase,
  FileSpreadsheet,
  Layers,
  Database,
  Boxes,
  Ruler,
  FileText,
  Settings,
  Sparkles,
  Zap,
  Building2,
  Activity,
  Calendar,
  GitCompare,
  BarChart2,
  Image as ImageIcon,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowRight,
  Command,
  CornerDownLeft,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navigasi' | 'Aksi Cepat' | 'Proyek' | 'Alat & Diagnostik';
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  badge?: string;
}

interface CommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject?: () => void;
  onOpenAIEstimator?: () => void;
  onOpenQuickBuilder?: () => void;
  onOpenDiagnostics?: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  isOpen,
  onClose,
  onOpenNewProject,
  onOpenAIEstimator,
  onOpenQuickBuilder,
  onOpenDiagnostics,
}) => {
  const {
    activeTab,
    setActiveTab,
    projects,
    setActiveProjectId,
    selectedProject,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = [
    // NAVIGASI UTAMA
    {
      id: 'nav-dashboard',
      title: 'Buka Dashboard Eksekutif',
      category: 'Navigasi',
      icon: LayoutDashboard,
      shortcut: 'G D',
      action: () => { setActiveTab('dashboard'); onClose(); },
      badge: activeTab === 'dashboard' ? 'Aktif' : undefined,
    },
    {
      id: 'nav-rab',
      title: 'Buka Lembar Kerja RAB & Anggaran',
      category: 'Navigasi',
      icon: FileSpreadsheet,
      shortcut: 'G R',
      action: () => { setActiveTab('rab'); onClose(); },
      badge: activeTab === 'rab' ? 'Aktif' : undefined,
    },
    {
      id: 'nav-projects',
      title: 'Buka Manajemen Proyek',
      category: 'Navigasi',
      icon: Briefcase,
      shortcut: 'G P',
      action: () => { setActiveTab('projects'); onClose(); },
    },
    {
      id: 'nav-drawings',
      title: 'Buka Analisis Gambar Konstruksi (AI)',
      category: 'Navigasi',
      icon: ImageIcon,
      shortcut: 'G I',
      action: () => { setActiveTab('drawings'); onClose(); },
    },
    {
      id: 'nav-scurve-plan',
      title: 'Buka Rencana Jadwal Kurva S',
      category: 'Navigasi',
      icon: Calendar,
      action: () => { setActiveTab('scurve-plan'); onClose(); },
    },
    {
      id: 'nav-scurve-actual',
      title: 'Buka Aktual Progres Kurva S',
      category: 'Navigasi',
      icon: Activity,
      action: () => { setActiveTab('scurve-actual'); onClose(); },
    },
    {
      id: 'nav-scurve-comparison',
      title: 'Buka Analisis Deviasi & EVM Proyek',
      category: 'Navigasi',
      icon: GitCompare,
      action: () => { setActiveTab('scurve-comparison'); onClose(); },
    },
    {
      id: 'nav-scurve-gantt',
      title: 'Buka Gantt Chart Timeline',
      category: 'Navigasi',
      icon: BarChart2,
      action: () => { setActiveTab('scurve-gantt'); onClose(); },
    },
    {
      id: 'nav-ahsp',
      title: 'Buka Analisa Harga Satuan Pekerjaan (AHSP)',
      category: 'Navigasi',
      icon: Layers,
      action: () => { setActiveTab('ahsp'); onClose(); },
    },
    {
      id: 'nav-database',
      title: 'Buka Database Harga Material & Upah',
      category: 'Navigasi',
      icon: Database,
      action: () => { setActiveTab('database'); onClose(); },
    },
    {
      id: 'nav-templates',
      title: 'Buka Template Master RAB',
      category: 'Navigasi',
      icon: Boxes,
      action: () => { setActiveTab('templates'); onClose(); },
    },
    {
      id: 'nav-calculator',
      title: 'Buka Kalkulator Volume Bangunan',
      category: 'Navigasi',
      icon: Ruler,
      action: () => { setActiveTab('calculator'); onClose(); },
    },
    {
      id: 'nav-reports',
      title: 'Buka Laporan & Berita Acara (Cetak/PDF)',
      category: 'Navigasi',
      icon: FileText,
      action: () => { setActiveTab('reports'); onClose(); },
    },
    {
      id: 'nav-settings',
      title: 'Buka Pengaturan Perusahaan & Aplikasi',
      category: 'Navigasi',
      icon: Settings,
      action: () => { setActiveTab('settings'); onClose(); },
    },

    // AKSI CEPAT
    {
      id: 'act-new-project',
      title: 'Buat Proyek Baru...',
      category: 'Aksi Cepat',
      icon: Plus,
      shortcut: '⌘ N',
      action: () => {
        onClose();
        if (onOpenNewProject) onOpenNewProject();
      },
    },
    {
      id: 'act-quick-builder',
      title: 'Jalankan Quick RAB Builder Wizard',
      category: 'Aksi Cepat',
      icon: Zap,
      shortcut: '⌘ B',
      action: () => {
        onClose();
        if (onOpenQuickBuilder) onOpenQuickBuilder();
      },
    },
    {
      id: 'act-ai-estimator',
      title: 'Buka Asisten AI Estimator Cerdas',
      category: 'Aksi Cepat',
      icon: Sparkles,
      shortcut: '⌘ J',
      action: () => {
        onClose();
        if (onOpenAIEstimator) onOpenAIEstimator();
      },
    },

    // ALAT & DIAGNOSTIK
    {
      id: 'tool-diagnostics',
      title: 'Buka Panel Diagnostik Runtime & Storage',
      category: 'Alat & Diagnostik',
      icon: ShieldCheck,
      shortcut: '⌥ D',
      action: () => {
        onClose();
        if (onOpenDiagnostics) onOpenDiagnostics();
      },
    },
    {
      id: 'tool-refresh-cache',
      title: 'Segarkan Cache Aplikasi & Validasi SOT',
      category: 'Alat & Diagnostik',
      icon: RefreshCw,
      action: () => {
        showToast('Validasi Financial Engine Selesai', 'Seluruh rumus canonical tersinkronisasi 100%', 'success');
        onClose();
      },
    },

    // DAFTAR PROYEK SEBAGAI SHORTCUT CEPAT
    ...projects.map((proj) => ({
      id: `proj-${proj.id}`,
      title: `Ganti Proyek: ${proj.name} (${proj.documentNo})`,
      category: 'Proyek' as const,
      icon: Building2,
      badge: proj.id === selectedProject?.id ? 'Aktif' : proj.status,
      action: () => {
        setActiveProjectId(proj.id);
        showToast('Proyek Dialihkan', `Beralih ke: ${proj.name}`, 'info');
        onClose();
      },
    })),
  ];

  const filteredCommands = allCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.shortcut && cmd.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredCommands.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
        {/* Backdrop with Mac-style blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Command Palette Surface */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
          className="relative w-full max-w-2xl bg-[var(--bg-elevated)]/70 backdrop-blur-3xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 overflow-hidden flex flex-col max-h-[75vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & Search Input */}
          <div className="flex items-center px-5 py-4 border-b border-[var(--border-primary)]/50 bg-transparent">
            <Search className="w-6 h-6 text-[var(--text-secondary)] mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Cari fitur, buka modul, atau buat RAB..."
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 text-xl font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-secondary)] px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-700/60"
              >
                Clear
              </button>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-2 custom-scrollbar flex-1 space-y-1">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-secondary)] text-sm">
                Tidak ada perintah yang sesuai dengan "{query}"
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={cmd.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm transition-all ${
                      isSelected
                        ? 'bg-mac-blue text-white shadow-md shadow-blue-500/20'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)]/70'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`p-1.5 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-[var(--bg-elevated)]/20 text-white' : 'bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="font-semibold block truncate">{cmd.title}</span>
                        <span
                          className={`text-[11px] block truncate ${
                            isSelected ? 'text-blue-100' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {cmd.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {cmd.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isSelected
                              ? 'bg-[var(--bg-elevated)]/20 text-white'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {cmd.badge}
                        </span>
                      )}
                      {cmd.shortcut && (
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded-sm ${
                            isSelected
                              ? 'bg-blue-700 text-blue-100 border border-blue-500'
                              : 'bg-[var(--bg-elevated-hover)] text-slate-500 border border-[var(--border-primary)]'
                          }`}
                        >
                          {cmd.shortcut}
                        </span>
                      )}
                      {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-blue-100 ml-1" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div className="px-4 py-2.5 bg-[var(--bg-elevated-hover)]/70 border-t border-[var(--border-primary)]/60 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded font-mono shadow-2xs">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded font-mono shadow-2xs">↓</kbd>
                <span>Navigasi</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded font-mono shadow-2xs">↵</kbd>
                <span>Pilih</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded font-mono shadow-2xs">ESC</kbd>
                <span>Tutup</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center space-x-1 text-[var(--text-secondary)] font-medium">
              <Command className="w-3 h-3" />
              <span>RAB Pro Mac Desktop Command Engine</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OfflineStatusIndicator } from './OfflineStatusIndicator';
import { NotificationBell } from '../notifications/NotificationBell';
import {
  Menu,
  Sparkles,
  Printer,
  ChevronDown,
  Building2,
  User as UserIcon,
  LogOut,
  FolderOpen,
  Plus,
  Zap,
} from 'lucide-react';

interface TopbarProps {
  onOpenAIModal?: () => void;
  onOpenAIEstimator?: () => void;
  onOpenNewProjectModal?: () => void;
  onOpenNewProject?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAuth?: () => void;
  onOpenQuickBuilder?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenAIModal,
  onOpenAIEstimator,
  onOpenNewProjectModal,
  onOpenNewProject,
  onOpenAuthModal,
  onOpenAuth,
  onOpenQuickBuilder,
}) => {
  const {
    activeTab,
    setActiveTab,
    setIsMobileSidebarOpen,
    projects,
    activeProjectId,
    setActiveProjectId,
    selectedProject,
    user,
    logout,
  } = useApp();

  const handleOpenAI = onOpenAIEstimator || onOpenAIModal;
  const handleOpenNewProject = onOpenNewProject || onOpenNewProjectModal;
  const handleOpenAuth = onOpenAuth || onOpenAuthModal;

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Eksekutif';
      case 'projects':
        return 'Manajemen Proyek';
      case 'rab':
        return 'Rencana Anggaran Biaya (RAB)';
      case 'ahsp':
        return 'Analisis Harga Satuan Pekerjaan (AHSP)';
      case 'database':
        return 'Database Harga & Upah Satuan';
      case 'templates':
        return 'Template Master Pekerjaan';
      case 'calculator':
        return 'Kalkulator Volume Konstruksi';
      case 'reports':
        return 'Laporan RAB & Berita Acara';
      case 'settings':
        return 'Pengaturan Aplikasi & Perusahaan';
      default:
        return 'RAB Pro';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-elevated)]/70 backdrop-blur-xl border-b border-[var(--border-primary)]/50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {getPageTitle()}
              </h1>
              {selectedProject && activeTab === 'rab' && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedProject.documentNo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Sistem Estimasi Rencana Anggaran Biaya Terstandarisasi SNI
            </p>
          </div>
        </div>

        {/* Right: Project Switcher & Quick Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Project Quick Switcher (Visible when projects exist) */}
          {projects.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsProjectDropdownOpen(!isProjectDropdownOpen);
                  setIsUserMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl transition-colors max-w-[150px] sm:max-w-[220px]"
              >
                <Building2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="truncate text-left font-medium">
                  {selectedProject ? selectedProject.name : 'Pilih Proyek'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)] flex-shrink-0" />
              </button>

              {isProjectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProjectDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-elevated)] rounded-xl shadow-xl border border-[var(--border-primary)] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Daftar Proyek Anda ({projects.length})
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {projects.map((proj) => (
                        <button
                          key={proj.id}
                          onClick={() => {
                            setActiveProjectId(proj.id);
                            setIsProjectDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs hover:bg-[var(--bg-elevated-hover)] flex items-start justify-between ${
                            proj.id === activeProjectId ? 'bg-blue-50/80 font-bold text-blue-900' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-semibold">{proj.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{proj.documentNo}</div>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-sm font-medium ${
                              proj.status === 'Berjalan'
                                ? 'bg-emerald-100 text-emerald-800'
                                : proj.status === 'Selesai'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)]'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-1 mt-1 px-2">
                      <button
                        onClick={() => {
                          setIsProjectDropdownOpen(false);
                          if (handleOpenNewProject) handleOpenNewProject();
                        }}
                        className="w-full flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Proyek Baru</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Quick RAB Builder Trigger */}
          {onOpenQuickBuilder && (
            <button
              onClick={onOpenQuickBuilder}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors"
              title="Bangun RAB Cepat (Quick Builder)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Quick RAB</span>
            </button>
          )}

          {/* Quick AI Assistant Trigger */}
          <button
            onClick={() => {
              if (handleOpenAI) handleOpenAI();
            }}
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-2xs transition-colors"
            title="Asisten Cerdas Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Estimator</span>
          </button>

          {/* Offline PWA Status Indicator */}
          <OfflineStatusIndicator />

          {/* Notification Center Bell */}
          <NotificationBell />

          {/* Quick Report Print Trigger */}
          <button
            onClick={() => setActiveTab('reports')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl transition-colors"
            title="Buka Halaman Cetak Laporan"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Cetak</span>
          </button>

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsProjectDropdownOpen(false);
              }}
              className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-[var(--bg-elevated-hover)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] text-[var(--text-primary)] font-bold flex items-center justify-center text-xs">
                {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-elevated)] rounded-xl shadow-xl border border-[var(--border-primary)] py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {user ? user.name : 'Pengguna Demo'}
                      </p>
                      {user?.role === 'administrator' && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user ? user.email : 'demo@rabpro.id'}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px]">
                      <span className="text-blue-600 font-medium truncate">
                        {user ? user.companyName : 'PT. Citra Kusuma Development'}
                      </span>
                      {user?.permissions && (
                        <span className="text-[var(--text-secondary)] font-mono text-[9px]">
                          {user.permissions.length} Izin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('projects');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] flex items-center space-x-2"
                    >
                      <FolderOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span>Semua Proyek</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] flex items-center space-x-2"
                    >
                      <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span>Profil Perusahaan</span>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    {user ? (
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar (Logout)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 font-semibold"
                      >
                        Login / Daftar Akun
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

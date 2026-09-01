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
  Search,
  Sidebar as SidebarIcon,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Command,
  HelpCircle,
  Activity,
  Sliders,
} from 'lucide-react';

interface MacToolbarProps {
  onOpenAIModal?: () => void;
  onOpenAIEstimator?: () => void;
  onOpenNewProjectModal?: () => void;
  onOpenNewProject?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAuth?: () => void;
  onOpenQuickBuilder?: () => void;
  onOpenCommandBar?: () => void;
  onOpenProjectSwitcher?: () => void;
  onToggleInspector?: () => void;
  onOpenShortcuts?: () => void;
  onOpenDiagnostics?: () => void;
  isInspectorOpen?: boolean;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const MacToolbar: React.FC<MacToolbarProps> = ({
  onOpenAIModal,
  onOpenAIEstimator,
  onOpenNewProjectModal,
  onOpenNewProject,
  onOpenAuthModal,
  onOpenAuth,
  onOpenQuickBuilder,
  onOpenCommandBar,
  onOpenProjectSwitcher,
  onToggleInspector,
  onOpenShortcuts,
  onOpenDiagnostics,
  isInspectorOpen,
  isFocusMode,
  onToggleFocusMode,
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
    showToast,
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
      case 'drawings':
        return 'Analisis Gambar Konstruksi';
      case 'scurve-plan':
        return 'Kurva S Rencana';
      case 'scurve-actual':
        return 'Kurva S Realisasi';
      case 'scurve-comparison':
        return 'Deviasi & Analisis EVM';
      case 'scurve-gantt':
        return 'Gantt Chart Jadwal';
      case 'ahsp':
        return 'Analisis Satuan (AHSP)';
      case 'database':
        return 'Database Harga & Upah';
      case 'templates':
        return 'Template Master RAB';
      case 'calculator':
        return 'Kalkulator Volume Bangunan';
      case 'reports':
        return 'Laporan & Berita Acara';
      case 'settings':
        return 'Pengaturan & Perusahaan';
      default:
        return 'RAB Pro Workspace';
    }
  };

  const handleTrafficRed = () => {
    showToast('Segarkan Sesi', 'Memperbarui cache runtime...', 'info');
    setTimeout(() => window.location.reload(), 300);
  };

  const handleTrafficYellow = () => {
    if (onToggleFocusMode) onToggleFocusMode();
  };

  const handleTrafficGreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all select-none">
      {/* Top Window Title Bar with Mac Traffic Lights */}
      <div className="h-10 px-3 sm:px-4 flex items-center justify-between border-b border-slate-200/50">
        {/* Left: Mac Traffic Lights & Mobile Hamburger */}
        <div className="flex items-center space-x-3">
          {/* Traffic Lights for macOS feel */}
          <div className="hidden sm:flex items-center space-x-2 mr-2">
            <button
              onClick={handleTrafficRed}
              className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors shadow-2xs cursor-pointer"
              title="Segarkan Sesi Workspace (Red Dot)"
            />
            <button
              onClick={handleTrafficYellow}
              className="w-3 h-3 rounded-full bg-amber-400 hover:bg-amber-500 transition-colors shadow-2xs cursor-pointer"
              title="Toggle Mode Fokus / Full Density (Yellow Dot)"
            />
            <button
              onClick={handleTrafficGreen}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-2xs cursor-pointer"
              title="Toggle Fullscreen Layar Penuh (Green Dot)"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-800">RAB Pro 10.0</span>
            <span>›</span>
            {selectedProject ? (
              <button
                onClick={onOpenProjectSwitcher}
                className="font-medium text-slate-700 hover:text-blue-600 truncate max-w-[140px] sm:max-w-[220px] transition-colors"
                title={selectedProject.name}
              >
                {selectedProject.name}
              </button>
            ) : (
              <span className="text-slate-400">Pilih Proyek</span>
            )}
            <span>›</span>
            <span className="font-semibold text-blue-600 truncate">{getPageTitle()}</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger Search Box */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-sm px-4">
          <button
            onClick={onOpenCommandBar}
            className="w-full flex items-center justify-between px-3 py-1 bg-white hover:bg-slate-100/80 border border-slate-200/80 rounded-lg text-xs text-slate-400 shadow-2xs transition-all"
          >
            <div className="flex items-center space-x-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-500">Cari modul, aksi, proyek...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-mono text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Quick Action Controls & Inspector Toggle */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Quick RAB Button */}
          {onOpenQuickBuilder && (
            <button
              onClick={onOpenQuickBuilder}
              className="hidden xl:flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
              title="Bangun RAB Kilat <5 Menit"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span>Quick RAB</span>
            </button>
          )}

          {/* AI Estimator */}
          {handleOpenAI && (
            <button
              onClick={handleOpenAI}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
              title="Asisten Cerdas Gemini AI"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span className="hidden lg:inline">AI Estimator</span>
            </button>
          )}

          {/* Offline Indicator */}
          <OfflineStatusIndicator />

          {/* Notification Bell */}
          <NotificationBell />

          {/* Inspector Panel Toggle Button */}
          {onToggleInspector && (
            <button
              onClick={onToggleInspector}
              className={`p-1.5 rounded-lg transition-colors ${
                isInspectorOpen
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Buka / Tutup Inspector Panel (⌘I)"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}

          {/* User Profile Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsProjectDropdownOpen(false);
              }}
              className="flex items-center space-x-1 p-1 rounded-lg hover:bg-slate-200/70 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user ? user.name : 'Pengguna Demo'}
                      </p>
                      <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full font-bold uppercase">
                        {user?.role || 'Admin'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user ? user.email : 'saipulabe@gmail.com'}
                    </p>
                  </div>
                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        if (onOpenProjectSwitcher) onOpenProjectSwitcher();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <FolderOpen className="w-4 h-4 text-slate-400" />
                        <span>Ganti Proyek</span>
                      </div>
                      <kbd className="font-mono text-[10px] text-slate-400">⌘P</kbd>
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenDiagnostics) onOpenDiagnostics();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Diagnostik Runtime</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenShortcuts) onOpenShortcuts();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="w-4 h-4 text-slate-400" />
                        <span>Pintasan Keyboard</span>
                      </div>
                      <kbd className="font-mono text-[10px] text-slate-400">⌘/</kbd>
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
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

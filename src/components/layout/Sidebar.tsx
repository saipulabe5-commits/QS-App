import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Briefcase,
  FileSpreadsheet,
  Layers,
  Database,
  Boxes,
  Ruler,
  FileText,
  Settings,
  X,
  Sparkles,
  Building2,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Image as ImageIcon,
  Calendar,
  Activity,
  GitCompare,
  TrendingUp,
  BarChart2,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  onOpenAIModal?: () => void;
  onOpenAIEstimator?: () => void;
  onOpenAuthModal?: () => void;
  onOpenNewProject?: () => void;
  onOpenQuickBuilder?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenAIModal,
  onOpenAIEstimator,
  onOpenAuthModal,
  onOpenNewProject,
  onOpenQuickBuilder,
}) => {
  const {
    activeTab,
    setActiveTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    projects,
    selectedProject,
    drawings,
    user,
    logout,
    settings,
  } = useApp();

  const handleOpenAI = onOpenAIEstimator || onOpenAIModal;

  const projectDrawingsCount = drawings.filter(
    (d) => d.projectId === (selectedProject?.id || '')
  ).length;

  const navigationSections = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
        { id: 'projects', label: 'Daftar Proyek', icon: Briefcase, badge: projects.length },
        { id: 'rab', label: 'RAB & Anggaran', icon: FileSpreadsheet, badge: null, highlight: true },
      ],
    },
    {
      title: 'ANALISIS GAMBAR & AI',
      items: [
        {
          id: 'drawings',
          label: 'Analisis Gambar',
          icon: ImageIcon,
          badge: projectDrawingsCount > 0 ? projectDrawingsCount : 'AI',
          badgeColor: 'bg-indigo-900 text-indigo-200 border border-indigo-700',
        },
      ],
    },
    {
      title: 'PENGENDALIAN PROYEK (KURVA S)',
      items: [
        { id: 'scurve-plan', label: 'Rencana Kurva S', icon: Calendar, badge: null },
        { id: 'scurve-actual', label: 'Aktual Kurva S', icon: Activity, badge: null },
        { id: 'scurve-comparison', label: 'Perbandingan Kurva S', icon: GitCompare, badge: null },
        { id: 'scurve-gantt', label: 'Gantt Chart Jadwal', icon: BarChart2, badge: null },
      ],
    },
    {
      title: 'DATABASE & TOOLS',
      items: [
        { id: 'ahsp', label: 'Analisis Harga (AHSP)', icon: Layers, badge: null },
        { id: 'database', label: 'Database Harga', icon: Database, badge: null },
        { id: 'templates', label: 'Template Pekerjaan', icon: Boxes, badge: null },
        { id: 'calculator', label: 'Kalkulator Volume', icon: Ruler, badge: null },
        { id: 'reports', label: 'Laporan & Cetak', icon: FileText, badge: null },
        { id: 'settings', label: 'Pengaturan', icon: Settings, badge: null },
      ],
    },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[var(--bg-elevated)]/60 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[var(--bg-elevated-hover)] border-r border-[var(--border-primary)] text-[var(--text-primary)] flex flex-col border-r border-[var(--border-primary)] transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static shadow-[4px_0_24px_rgba(0,0,0,0.1)] ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-slate-200 dark:border-[var(--border-primary)]/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-mac-blue flex items-center justify-center text-white font-black text-xl shadow-sm">
              R
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight">RAB Pro</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                  SNI
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[140px] mt-0.5">
                {settings.companyName || 'Estimator Konstruksi'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden text-[var(--text-secondary)] hover:text-blue-600 p-1 rounded-lg hover:bg-[var(--bg-elevated)] border-[var(--border-primary)] shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Project Card Selector */}
        <div className="p-3 mx-3 my-2 bg-[var(--bg-elevated)] border-[var(--border-primary)] shadow-sm rounded-xl border border-[var(--border-primary)] flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Proyek Aktif
            </span>
            <button
              onClick={() => handleNavClick('projects')}
              className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
            >
              Ganti
            </button>
          </div>
          {selectedProject ? (
            <div>
              <h4 className="text-sm font-semibold text-white line-clamp-1" title={selectedProject.name}>
                {selectedProject.name}
              </h4>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-[var(--text-secondary)]">
                <span className="truncate max-w-[120px]">{selectedProject.documentNo}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-sm font-medium ${
                    selectedProject.status === 'Berjalan'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800/40'
                      : selectedProject.status === 'Selesai'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800/40'
                      : 'bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)]'
                  }`}
                >
                  {selectedProject.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <p className="text-xs text-[var(--text-secondary)]">Belum ada proyek terpilih</p>
              <button
                onClick={() => {
                  if (onOpenNewProject) onOpenNewProject();
                  else handleNavClick('projects');
                }}
                className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Buat Proyek Baru
              </button>
            </div>
          )}
        </div>

        {/* AI Quick Assistant Launcher & Quick RAB */}
        <div className="px-3 mb-1.5 flex-shrink-0 space-y-1.5">
          <button
            onClick={() => {
              if (handleOpenAI) handleOpenAI();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-800 transition-colors group"
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-[var(--text-primary)] dark:text-white flex items-center gap-1">
                  AI Estimator
                  <span className="text-[9px] bg-mac-blue text-white font-bold px-1 rounded-xs">GEMINI</span>
                </div>
                <div className="text-[10px] text-blue-600/80 dark:text-blue-300/80">Otomasi & Analisis RAB</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {onOpenQuickBuilder && (
            <button
              onClick={onOpenQuickBuilder}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-800 dark:text-indigo-100 border-indigo-200 dark:border-indigo-800 transition-colors group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-md bg-indigo-900 text-amber-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[var(--text-primary)] dark:text-white flex items-center gap-1">
                    Quick RAB Builder
                    <span className="text-[9px] bg-indigo-600 text-white font-bold px-1 rounded-xs">&lt;5 Mnt</span>
                  </div>
                  <div className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80">Wizard Instan</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-1 space-y-4 overflow-y-auto custom-scrollbar">
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx}>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-1">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-mac-blue text-white shadow-2xs font-semibold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border-[var(--border-primary)] shadow-sm hover:text-blue-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[var(--text-secondary)]'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                            isActive
                              ? 'bg-blue-800 text-white'
                              : (item as any).badgeColor || 'bg-[var(--bg-elevated)] border-[var(--border-primary)] shadow-sm text-[var(--text-secondary)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 m-3 bg-[var(--bg-elevated)] border-[var(--border-primary)] shadow-sm rounded-xl border border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] flex-shrink-0 font-bold text-xs">
              {user ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                <span>{user ? user.name : 'Tamu'}</span>
                {user?.role === 'administrator' && (
                  <span className="text-[9px] bg-[var(--traffic-yellow)]/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] truncate">
                {user ? user.email : 'Belum Login'}
              </div>
            </div>
          </div>
          {user ? (
            <button
              onClick={logout}
              title="Keluar"
              className="p-1.5 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800"
            >
              Login
            </button>
          )}
        </div>
      </aside>
    </>
  );
};


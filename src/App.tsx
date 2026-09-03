import React, { useState, useEffect, Suspense, lazy } from 'react';
import { lazyWithRetry } from './utils/lazyImport';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { MacToolbar } from './components/layout/MacToolbar';
import { StatusBar } from './components/layout/StatusBar';
const InspectorPanel = lazyWithRetry(() => import('./components/layout/InspectorPanel').then(m => ({ default: m.InspectorPanel })));
const CommandBar = lazyWithRetry(() => import('./components/layout/CommandBar').then(m => ({ default: m.CommandBar })));
const ProjectSwitcherModal = lazyWithRetry(() => import('./components/layout/ProjectSwitcherModal').then(m => ({ default: m.ProjectSwitcherModal })));
const KeyboardShortcutsModal = lazyWithRetry(() => import('./components/layout/KeyboardShortcutsModal').then(m => ({ default: m.KeyboardShortcutsModal })));
const DiagnosticsModal = lazyWithRetry(() => import('./components/diagnostics/DiagnosticsModal').then(m => ({ default: m.DiagnosticsModal })));
import { ToastContainer } from './components/layout/Toast';
import { ViewFallback } from './components/layout/ViewFallback';
const DashboardView = lazyWithRetry(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
import { AuthGate } from './components/auth/AuthGate';

// PROGRESSIVE LAZY MODULE LOADING (ISOLATION OF SUB-MODULE FAILURES)
const ProjectListView = lazyWithRetry(() => import('./components/projects/ProjectListView').then(m => ({ default: m.ProjectListView })));
const RABView = lazyWithRetry(() => import('./components/rab/RABView').then(m => ({ default: m.RABView })));
const AHSPView = lazyWithRetry(() => import('./components/ahsp/AHSPView').then(m => ({ default: m.AHSPView })));
const PriceDatabaseView = lazyWithRetry(() => import('./components/database/PriceDatabaseView').then(m => ({ default: m.PriceDatabaseView })));
const TemplateView = lazyWithRetry(() => import('./components/templates/TemplateView').then(m => ({ default: m.TemplateView })));
const VolumeCalculatorView = lazyWithRetry(() => import('./components/calculator/VolumeCalculatorView').then(m => ({ default: m.VolumeCalculatorView })));
const ReportView = lazyWithRetry(() => import('./components/reports/ReportView').then(m => ({ default: m.ReportView })));
const SettingsView = lazyWithRetry(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const DrawingAnalysisView = lazyWithRetry(() => import('./components/drawings/DrawingAnalysisView').then(m => ({ default: m.DrawingAnalysisView })));
const SCurvePlanView = lazyWithRetry(() => import('./components/scurve/SCurvePlanView').then(m => ({ default: m.SCurvePlanView })));
const SCurveActualView = lazyWithRetry(() => import('./components/scurve/SCurveActualView').then(m => ({ default: m.SCurveActualView })));
const SCurveComparisonView = lazyWithRetry(() => import('./components/scurve/SCurveComparisonView').then(m => ({ default: m.SCurveComparisonView })));
const GanttChartView = lazyWithRetry(() => import('./components/scurve/GanttChartView').then(m => ({ default: m.GanttChartView })));

// LAZY MODALS
const ProjectModal = lazyWithRetry(() => import('./components/projects/ProjectModal').then(m => ({ default: m.ProjectModal })));
const RABAssistantModal = lazyWithRetry(() => import('./components/ai/RABAssistantModal').then(m => ({ default: m.RABAssistantModal })));
const AuthModal = lazyWithRetry(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const QuickRABBuilderModal = lazyWithRetry(() => import('./components/rab/QuickRABBuilderModal').then(m => ({ default: m.QuickRABBuilderModal })));

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, user } = useApp();

  // Check if Safe Mode is requested via URL query (?safemode=1)
  const isSafeMode = typeof window !== 'undefined' && window.location.search.includes('safemode=1');

  // Desktop Panels & Modals State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState<'chat' | 'missing' | 'audit' | 'volume' | 'savings' | 'summary' | 'estimate'>('chat');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);

  // Mac Desktop Experience Panels
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false);
  const [isProjectSwitcherOpen, setIsProjectSwitcherOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // GLOBAL KEYBOARD SHORTCUTS CONTROLLER
  useEffect(() => {
    // Clear chunk reload flag on successful app boot
    sessionStorage.removeItem("rabpro_chunk_reload_attempt");

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept shortcuts when typing in inputs/textareas except for Command+K/P/I/Escape
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandBarOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsProjectSwitcherOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      } else if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsDiagnosticsModalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n' && !isInput) {
        e.preventDefault();
        setIsProjectModalOpen(true);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j' && !isInput) {
        e.preventDefault();
        handleOpenAIWithTab('chat');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // STRICT ACCESS GATE: JIKA USER LOGOUT ATAU BELUM LOGIN, APLIKASI TERKUNCI TOTAL
  if (!user) {
    return (
      <>
        <AuthGate />
        <ToastContainer />
      </>
    );
  }

  const handleOpenAIWithTab = (tab: 'chat' | 'missing' | 'audit' | 'volume' | 'savings' | 'summary' | 'estimate' = 'chat') => {
    setAiInitialTab(tab);
    setIsAIModalOpen(true);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Manajemen Proyek..." />}>
            <ProjectListView onNewProject={() => setIsProjectModalOpen(true)} />
          </Suspense>
        );
      case 'rab':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Lembar Kerja RAB..." />}>
            <RABView
              onOpenAIModal={() => handleOpenAIWithTab('chat')}
              onOpenCalculator={() => setActiveTab('calculator')}
            />
          </Suspense>
        );
      case 'drawings':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Analisis Gambar Konstruksi..." />}>
            <DrawingAnalysisView />
          </Suspense>
        );
      case 'scurve-plan':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Kurva S Rencana..." />}>
            <SCurvePlanView />
          </Suspense>
        );
      case 'scurve-actual':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Kurva S Realisasi..." />}>
            <SCurveActualView />
          </Suspense>
        );
      case 'scurve-comparison':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Perbandingan Deviasi & EVM..." />}>
            <SCurveComparisonView />
          </Suspense>
        );
      case 'scurve-gantt':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Jadwal Gantt Chart..." />}>
            <GanttChartView />
          </Suspense>
        );
      case 'ahsp':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Analisa Harga Satuan (AHSP)..." />}>
            <AHSPView />
          </Suspense>
        );
      case 'database':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Database Harga Bahan & Upah..." />}>
            <PriceDatabaseView />
          </Suspense>
        );
      case 'templates':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Template Proyek..." />}>
            <TemplateView />
          </Suspense>
        );
      case 'calculator':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Kalkulator Volume Bangunan..." />}>
            <VolumeCalculatorView />
          </Suspense>
        );
      case 'reports':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Laporan & Ekspor..." />}>
            <ReportView />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<ViewFallback label="Memuat Pengaturan Perusahaan..." />}>
            <SettingsView />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<ViewFallback label="Memuat Dasbor..." />}>
            <DashboardView />
          </Suspense>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-[var(--bg-elevated)] text-slate-900 dark:text-slate-100 overflow-hidden antialiased select-none font-sans transition-colors">
      {/* SAFE MODE BANNER IF ACTIVATED */}
      {isSafeMode && (
        <div className="bg-[var(--traffic-yellow)] text-slate-950 font-bold px-4 py-1 text-xs text-center flex items-center justify-between shadow-sm z-50 flex-shrink-0">
          <span>SAFE MODE AKTIF: Fitur berat diisolasi untuk keandalan maksimal.</span>
          <button
            onClick={() => { window.location.href = window.location.pathname; }}
            className="underline hover:text-white ml-2 text-xs cursor-pointer"
          >
            Keluar dari Safe Mode
          </button>
        </div>
      )}

      {/* Primary Workspace Window */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Sidebar Navigation (Collapsible in focus mode) */}
        {!isFocusMode && (
          <Sidebar
            onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
            onOpenNewProject={() => setIsProjectModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenQuickBuilder={() => setIsQuickBuilderOpen(true)}
          />
        )}

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[var(--bg-elevated-hover)]">
          {/* Top Window Bar (Mac Toolbar) */}
          <MacToolbar
            onOpenNewProject={() => setIsProjectModalOpen(true)}
            onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenQuickBuilder={() => setIsQuickBuilderOpen(true)}
            onOpenCommandBar={() => setIsCommandBarOpen(true)}
            onOpenProjectSwitcher={() => setIsProjectSwitcherOpen(true)}
            onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
            onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
            onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
            isInspectorOpen={isInspectorOpen}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
          />

          {/* Viewport Workspace with Error Boundary */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 custom-scrollbar select-auto">
            <div className="max-w-7xl mx-auto pb-8 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.99 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 350, 
                    damping: 28, 
                    mass: 0.7 
                  }}
                  className="w-full h-full"
                >
                  <ErrorBoundary key={activeTab} isViewLevel={true} fallbackTitle={`Modul ${activeTab.toUpperCase()}`}>
                    {renderActiveView()}
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Inspector Panel Slide-Over */}
        <Suspense fallback={null}>
        <InspectorPanel
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
        />      </Suspense>
      </div>

      {/* Bottom Desktop Status Bar */}
      <StatusBar
        onOpenCommandBar={() => setIsCommandBarOpen(true)}
        onOpenProjectSwitcher={() => setIsProjectSwitcherOpen(true)}
        onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
        isInspectorOpen={isInspectorOpen}
      />

      {/* Command Palette (⌘K) */}
      <Suspense fallback={null}>
      <CommandBar
        isOpen={isCommandBarOpen}
        onClose={() => setIsCommandBarOpen(false)}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
        onOpenQuickBuilder={() => setIsQuickBuilderOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsModalOpen(true)}
      />    </Suspense>

      {/* Quick Project Switcher (⌘P) */}
      <Suspense fallback={null}>
      <ProjectSwitcherModal
        isOpen={isProjectSwitcherOpen}
        onClose={() => setIsProjectSwitcherOpen(false)}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
      />    </Suspense>

      {/* Keyboard Shortcuts Helper (⌘/) */}
      <Suspense fallback={null}>
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />    </Suspense>

      {/* Runtime Diagnostics Modal (⌥D) */}
      <Suspense fallback={null}>
      <DiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
      />    </Suspense>

      {/* Global Modals loaded lazily only when requested */}
      {isProjectModalOpen && (
        <Suspense fallback={null}>
          <ProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
          />
        </Suspense>
      )}

      {isQuickBuilderOpen && (
        <Suspense fallback={null}>
          <QuickRABBuilderModal
            isOpen={isQuickBuilderOpen}
            onClose={() => setIsQuickBuilderOpen(false)}
          />
        </Suspense>
      )}

      {isAIModalOpen && (
        <Suspense fallback={null}>
          <RABAssistantModal
            isOpen={isAIModalOpen}
            initialTab={aiInitialTab}
            onClose={() => setIsAIModalOpen(false)}
          />
        </Suspense>
      )}

      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </Suspense>
      )}

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

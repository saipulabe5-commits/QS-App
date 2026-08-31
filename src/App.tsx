import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { ToastContainer } from './components/layout/Toast';
import { ViewFallback } from './components/layout/ViewFallback';
import { DashboardView } from './components/dashboard/DashboardView';
import { AuthGate } from './components/auth/AuthGate';

// PROGRESSIVE LAZY MODULE LOADING (ISOLATION OF SUB-MODULE FAILURES)
const ProjectListView = lazy(() => import('./components/projects/ProjectListView').then(m => ({ default: m.ProjectListView })));
const RABView = lazy(() => import('./components/rab/RABView').then(m => ({ default: m.RABView })));
const AHSPView = lazy(() => import('./components/ahsp/AHSPView').then(m => ({ default: m.AHSPView })));
const PriceDatabaseView = lazy(() => import('./components/database/PriceDatabaseView').then(m => ({ default: m.PriceDatabaseView })));
const TemplateView = lazy(() => import('./components/templates/TemplateView').then(m => ({ default: m.TemplateView })));
const VolumeCalculatorView = lazy(() => import('./components/calculator/VolumeCalculatorView').then(m => ({ default: m.VolumeCalculatorView })));
const ReportView = lazy(() => import('./components/reports/ReportView').then(m => ({ default: m.ReportView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const DrawingAnalysisView = lazy(() => import('./components/drawings/DrawingAnalysisView').then(m => ({ default: m.DrawingAnalysisView })));
const SCurvePlanView = lazy(() => import('./components/scurve/SCurvePlanView').then(m => ({ default: m.SCurvePlanView })));
const SCurveActualView = lazy(() => import('./components/scurve/SCurveActualView').then(m => ({ default: m.SCurveActualView })));
const SCurveComparisonView = lazy(() => import('./components/scurve/SCurveComparisonView').then(m => ({ default: m.SCurveComparisonView })));
const GanttChartView = lazy(() => import('./components/scurve/GanttChartView').then(m => ({ default: m.GanttChartView })));

// LAZY MODALS
const ProjectModal = lazy(() => import('./components/projects/ProjectModal').then(m => ({ default: m.ProjectModal })));
const RABAssistantModal = lazy(() => import('./components/ai/RABAssistantModal').then(m => ({ default: m.RABAssistantModal })));
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));
const QuickRABBuilderModal = lazy(() => import('./components/rab/QuickRABBuilderModal').then(m => ({ default: m.QuickRABBuilderModal })));

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, user } = useApp();

  // Check if Safe Mode is requested via URL query (?safemode=1)
  const isSafeMode = typeof window !== 'undefined' && window.location.search.includes('safemode=1');

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInitialTab, setAiInitialTab] = useState<'chat' | 'missing' | 'audit' | 'volume' | 'savings' | 'summary' | 'estimate'>('chat');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);

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
          <Suspense fallback={<ViewFallback label="Memuat Daftar Proyek..." />}>
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
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden antialiased">
      {/* SAFE MODE BANNER IF ACTIVATED */}
      {isSafeMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 font-bold px-4 py-1 text-xs text-center flex items-center justify-between shadow-sm">
          <span>SAFE MODE AKTIF: Fitur berat diisolasi untuk keandalan maksimal.</span>
          <button
            onClick={() => { window.location.href = window.location.pathname; }}
            className="underline hover:text-white ml-2 text-xs cursor-pointer"
          >
            Keluar dari Safe Mode
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
        onOpenNewProject={() => setIsProjectModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenQuickBuilder={() => setIsQuickBuilderOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          onOpenNewProject={() => setIsProjectModalOpen(true)}
          onOpenAIEstimator={() => handleOpenAIWithTab('chat')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenQuickBuilder={() => setIsQuickBuilderOpen(true)}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-slate-50/50">
          <div className="max-w-7xl mx-auto pb-12 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25, 
                  mass: 0.8 
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

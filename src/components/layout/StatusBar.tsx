import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Database,
  Layers,
  Sparkles,
  Command,
  HelpCircle,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface StatusBarProps {
  onOpenCommandBar: () => void;
  onOpenProjectSwitcher: () => void;
  onToggleInspector: () => void;
  onOpenShortcuts: () => void;
  onOpenDiagnostics: () => void;
  isInspectorOpen: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  onOpenCommandBar,
  onOpenProjectSwitcher,
  onToggleInspector,
  onOpenShortcuts,
  onOpenDiagnostics,
  isInspectorOpen,
}) => {
  const {
    selectedProject,
    projectRABItems,
    user,
    activeTab,
  } = useApp();

  const directCost = projectRABItems.reduce(
    (sum, item) => sum + (Number(item.volume) || 0) * (Number(item.unitPrice) || 0),
    0
  );

  return (
    <footer className="h-7 bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-t border-slate-200 dark:border-[var(--border-primary)] text-[11px] px-3 flex items-center justify-between select-none z-20 flex-shrink-0">
      {/* Left items: Engine & Storage status */}
      <div className="flex items-center space-x-3 overflow-hidden">
        {/* Engine Lock Status */}
        <div
          className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-white cursor-pointer transition-colors truncate"
          onClick={onOpenDiagnostics}
          title="Canonical Financial Engine V10 - SOT Locked"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium truncate hidden sm:inline">Engine: SNI SOT Locked</span>
          <span className="font-medium sm:hidden">SOT OK</span>
        </div>

        <span className="text-[var(--text-primary)] hidden sm:inline">|</span>

        {/* Database Local First Status */}
        <div
          className="flex items-center space-x-1 text-[var(--text-secondary)] hover:text-slate-200 cursor-pointer transition-colors truncate hidden md:flex"
          onClick={onOpenDiagnostics}
          title="Penyimpanan Data: Offline-First IndexedDB"
        >
          <Database className="w-3 h-3 text-blue-400 flex-shrink-0" />
          <span>Local-First DB</span>
        </div>

        <span className="text-[var(--text-primary)] hidden md:inline">|</span>

        {/* Project Items count */}
        {selectedProject && (
          <div className="flex items-center space-x-1 text-[var(--text-secondary)] truncate">
            <Layers className="w-3 h-3 text-amber-400 flex-shrink-0" />
            <span className="tabular-nums font-mono">{projectRABItems.length} Pos Pekerjaan</span>
          </div>
        )}
      </div>

      {/* Center: Live Grand Total / View Title */}
      <div className="hidden lg:flex items-center space-x-2 text-slate-600 dark:text-slate-300">
        {selectedProject ? (
          <div className="flex items-center space-x-1.5 font-mono text-[10px]">
            <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
            <span className="font-bold text-emerald-400 tabular-nums">{formatCurrency(directCost)}</span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">RAB Pro macOS Desktop Edition V10.0</span>
        )}
      </div>

      {/* Right items: Shortcuts hints & Inspector trigger */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenCommandBar}
          className="hidden sm:flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-slate-200 transition-colors"
          title="Buka Command Palette (⌘K)"
        >
          <kbd className="px-1 py-0.2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded text-[9px] font-mono">⌘K</kbd>
          <span>Command</span>
        </button>

        <button
          onClick={onOpenProjectSwitcher}
          className="hidden md:flex items-center space-x-1 px-1.5 py-0.5 rounded hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-slate-200 transition-colors"
          title="Buka Project Switcher (⌘P)"
        >
          <kbd className="px-1 py-0.2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded text-[9px] font-mono">⌘P</kbd>
          <span>Proyek</span>
        </button>

        <button
          onClick={onToggleInspector}
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-colors ${
            isInspectorOpen
              ? 'bg-blue-600/30 text-blue-300 font-bold'
              : 'hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-slate-200'
          }`}
          title="Toggle Workspace Inspector (⌘I)"
        >
          <kbd className="px-1 py-0.2 bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded text-[9px] font-mono">⌘I</kbd>
          <span className="hidden sm:inline">Inspector</span>
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-1 rounded hover:bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:text-slate-200 transition-colors"
          title="Daftar Pintasan Keyboard (⌘/)"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};

import React from 'react';

export const ViewFallback: React.FC<{ label?: string }> = ({ label = 'Memuat modul...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)]/80 shadow-xs">
    <div className="w-8 h-8 border-2 border-slate-200 dark:border-slate-700 border-t-slate-600 dark:border-t-slate-400 rounded-full animate-spin mb-3"></div>
    <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
  </div>
);

import React from 'react';

export const ViewFallback: React.FC<{ label?: string }> = ({ label = 'Memuat modul...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center bg-white rounded-xl border border-slate-200/80 shadow-xs">
    <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
    <p className="text-sm font-medium text-slate-600">{label}</p>
  </div>
);

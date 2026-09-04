import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = CheckCircle2;
          let borderClass = 'border-emerald-500 bg-[var(--bg-elevated)] text-[var(--text-primary)]';
          let iconColor = 'text-emerald-600';

          if (toast.type === 'error') {
            Icon = AlertCircle;
            borderClass = 'border-rose-500 bg-[var(--bg-elevated)] text-[var(--text-primary)]';
            iconColor = 'text-rose-600';
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            borderClass = 'border-amber-500 bg-[var(--bg-elevated)] text-[var(--text-primary)]';
            iconColor = 'text-amber-600';
          } else if (toast.type === 'info') {
            Icon = Info;
            borderClass = 'border-blue-500 bg-[var(--bg-elevated)] text-[var(--text-primary)]';
            iconColor = 'text-blue-600';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className={`pointer-events-auto flex items-start p-4 rounded-xl border shadow-lg ${borderClass}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${iconColor}`} />
              <div className="flex-1 pr-2">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{toast.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

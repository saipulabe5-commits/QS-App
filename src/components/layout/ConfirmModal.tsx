import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10"
        >
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
              </div>
              <button
                onClick={onCancel}
                className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] p-1.5 rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">{message}</p>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-xs transition-colors ${
                  isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

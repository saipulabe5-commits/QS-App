import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutsList = [
    {
      category: 'Navigasi & Global',
      items: [
        { keys: ['⌘', 'K'], label: 'Buka Command Palette / Pencarian Universal' },
        { keys: ['⌘', 'P'], label: 'Buka Quick Project Switcher' },
        { keys: ['⌘', 'I'], label: 'Buka / Tutup Workspace Inspector' },
        { keys: ['⌘', '/'], label: 'Buka Daftar Pintasan Keyboard Ini' },
        { keys: ['ESC'], label: 'Tutup Modal / Batal / Bersihkan Input' },
      ],
    },
    {
      category: 'Aksi & Alur Kerja',
      items: [
        { keys: ['⌘', 'N'], label: 'Buat Proyek Konstruksi Baru' },
        { keys: ['⌘', 'B'], label: 'Buka Quick RAB Wizard' },
        { keys: ['⌘', 'J'], label: 'Buka Asisten Cerdas AI Estimator' },
        { keys: ['⌥', 'D'], label: 'Buka Panel Diagnostik & Storage' },
      ],
    },
    {
      category: 'Navigasi Cepat Modul',
      items: [
        { keys: ['G', 'D'], label: 'Lompat ke Dashboard' },
        { keys: ['G', 'R'], label: 'Lompat ke Lembar Kerja RAB' },
        { keys: ['G', 'P'], label: 'Lompat ke Daftar Proyek' },
        { keys: ['G', 'I'], label: 'Lompat ke Analisis Gambar (AI Takeoff)' },
      ],
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800">
              <Keyboard className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-base">Pintasan Keyboard (macOS & Windows)</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-xs">
            {shortcutsList.map((sec) => (
              <div key={sec.category} className="space-y-2.5">
                <h4 className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                  {sec.category}
                </h4>
                <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 divide-y divide-slate-200/60">
                  {sec.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-2.5 flex items-center justify-between text-slate-700"
                    >
                      <span>{item.label}</span>
                      <div className="flex items-center space-x-1">
                        {item.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 bg-white border border-slate-300 rounded font-mono text-[11px] font-bold shadow-2xs text-slate-800"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 text-right">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

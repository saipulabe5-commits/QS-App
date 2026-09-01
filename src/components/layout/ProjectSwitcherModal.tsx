import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Search,
  Plus,
  Check,
  Calendar,
  DollarSign,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewProject?: () => void;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({
  isOpen,
  onClose,
  onOpenNewProject,
}) => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    rabItems,
    showToast,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredProjects = projects.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.documentNo.toLowerCase().includes(q) ||
      (p.client && p.client.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q))
    );
  });

  const handleSelect = (id: string, name: string) => {
    setActiveProjectId(id);
    showToast('Proyek Aktif Diganti', `Sekarang bekerja pada: ${name}`, 'info');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredProjects.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredProjects.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProjects[selectedIndex]) {
        handleSelect(filteredProjects[selectedIndex].id, filteredProjects[selectedIndex].name);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[70vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Pilih Proyek Aktif (⌘P)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {projects.length} Proyek Terdaftar
            </span>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-slate-200/60 flex items-center">
            <Search className="w-4 h-4 text-slate-400 mr-2.5 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Cari berdasarkan nama proyek, nomor dokumen, klien..."
              className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-sm font-medium"
            />
          </div>

          {/* Project List */}
          <div className="overflow-y-auto p-2 custom-scrollbar flex-1 space-y-1.5">
            {filteredProjects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Tidak ada proyek yang sesuai dengan pencarian Anda.
              </div>
            ) : (
              filteredProjects.map((proj, idx) => {
                const isSelected = idx === selectedIndex;
                const isActive = proj.id === activeProjectId;
                const projRAB = rabItems.filter((item) => item.projectId === proj.id);
                const totalDirectCost = projRAB.reduce((sum, item) => sum + item.volume * item.unitPrice, 0);

                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelect(proj.id, proj.name)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full p-3 rounded-xl text-left transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/70'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="font-bold text-sm text-slate-900 truncate">{proj.name}</span>
                        {isActive && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                            Aktif
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-sm font-semibold ${
                            proj.status === 'Berjalan'
                              ? 'bg-emerald-100 text-emerald-800'
                              : proj.status === 'Selesai'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {proj.status}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="font-mono">{proj.documentNo}</span>
                        {proj.location && <span>• {proj.location}</span>}
                        {proj.buildingArea && <span>• {proj.buildingArea} m²</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-xs text-slate-900 tabular-nums">
                        {formatCurrency(totalDirectCost)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {projRAB.length} Item RAB
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with New Project Button */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                if (onOpenNewProject) onOpenNewProject();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Proyek Baru</span>
            </button>
            <div className="text-[11px] text-slate-400">
              Tekan <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono shadow-2xs">ESC</kbd> untuk menutup
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

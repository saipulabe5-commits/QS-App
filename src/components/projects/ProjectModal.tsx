import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { X, Building2, Calendar, Percent, FileText, CheckCircle2, Boxes } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectModalProps {
  isOpen: boolean;
  projectToEdit?: Project | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  projectToEdit,
  onClose,
}) => {
  const { addProject, updateProject, templates, settings } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    documentNo: '',
    clientName: '',
    location: '',
    contractor: '',
    consultant: '',
    startDate: '',
    endDate: '',
    notes: '',
    status: 'Draft' as ProjectStatus,
    overheadPercent: settings.defaultOverhead,
    profitPercent: settings.defaultProfit,
    taxPercent: settings.defaultTax,
    selectedTemplateId: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name,
        documentNo: projectToEdit.documentNo,
        clientName: projectToEdit.clientName,
        location: projectToEdit.location,
        contractor: projectToEdit.contractor,
        consultant: projectToEdit.consultant,
        startDate: projectToEdit.startDate,
        endDate: projectToEdit.endDate,
        notes: projectToEdit.notes,
        status: projectToEdit.status,
        overheadPercent: projectToEdit.overheadPercent,
        profitPercent: projectToEdit.profitPercent,
        taxPercent: projectToEdit.taxPercent,
        selectedTemplateId: '',
      });
    } else {
      const currentYear = new Date().getFullYear();
      const currentMonthRoman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][new Date().getMonth()];
      const docNo = `RAB/${currentYear}/${currentMonthRoman}/001`;

      setFormData({
        name: '',
        documentNo: docNo,
        clientName: '',
        location: '',
        contractor: settings.companyName,
        consultant: 'Tim Konsultan Perencana',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: '',
        status: 'Draft',
        overheadPercent: settings.defaultOverhead,
        profitPercent: settings.defaultProfit,
        taxPercent: settings.defaultTax,
        selectedTemplateId: '',
      });
    }
    setErrors({});
  }, [projectToEdit, isOpen, settings]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errs.name = 'Nama proyek wajib diisi.';
    }
    if (!formData.documentNo.trim()) {
      errs.documentNo = 'Nomor dokumen wajib diisi.';
    }
    if (formData.overheadPercent < 0 || formData.overheadPercent > 100) {
      errs.overheadPercent = 'Overhead harus berada antara 0 - 100%';
    }
    if (formData.profitPercent < 0 || formData.profitPercent > 100) {
      errs.profitPercent = 'Profit harus berada antara 0 - 100%';
    }
    if (formData.taxPercent < 0 || formData.taxPercent > 100) {
      errs.taxPercent = 'Pajak harus berada antara 0 - 100%';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        name: formData.name.trim(),
        documentNo: formData.documentNo.trim(),
        clientName: formData.clientName.trim(),
        location: formData.location.trim(),
        contractor: formData.contractor.trim(),
        consultant: formData.consultant.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes.trim(),
        status: formData.status,
        overheadPercent: Number(formData.overheadPercent),
        profitPercent: Number(formData.profitPercent),
        taxPercent: Number(formData.taxPercent),
      });
    } else {
      addProject(
        {
          name: formData.name.trim(),
          documentNo: formData.documentNo.trim(),
          clientName: formData.clientName.trim(),
          location: formData.location.trim(),
          contractor: formData.contractor.trim(),
          consultant: formData.consultant.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes.trim(),
          status: formData.status,
          overheadPercent: Number(formData.overheadPercent),
          profitPercent: Number(formData.profitPercent),
          taxPercent: Number(formData.taxPercent),
        },
        formData.selectedTemplateId || undefined
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="relative w-full max-w-2xl rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-10 flex flex-col max-h-[90vh] border border-white/40 bg-white/70 backdrop-blur-2xl"
      >
        {/* HEADER MAC OS STYLE */}
        <div className="px-4 py-3 flex items-center justify-between bg-white/40 border-b border-slate-200/50 sticky top-0 z-20">
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2 w-20">
            <button 
              type="button"
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner hover:bg-[#FF5F56]/80 flex items-center justify-center group"
            >
              <X className="w-2.5 h-2.5 text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button type="button" className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner"></button>
            <button type="button" className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner"></button>
          </div>

          {/* Judul Window di Tengah */}
          <div className="flex-1 text-center">
            <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
              {projectToEdit ? 'Edit Data Proyek' : 'Tambah Proyek Konstruksi Baru'}
            </h3>
          </div>

          {/* Spacer */}
          <div className="w-20"></div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/60 space-y-4">
          {/* Row 1: Nama & Dokumen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Proyek <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Pembangunan Rumah Tinggal 2 Lantai Minimalis"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.name ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Dokumen Kontrak / RAB <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.documentNo}
                onChange={(e) => setFormData({ ...formData, documentNo: e.target.value })}
                placeholder="RAB/2026/VIII/001"
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 border rounded-xl font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.documentNo ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.documentNo && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.documentNo}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status Pelaksanaan Proyek
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              >
                <option value="Draft">Draft (Perencanaan)</option>
                <option value="Berjalan">Berjalan (Sedang Dikerjakan)</option>
                <option value="Selesai">Selesai (Tuntas)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Klien & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemilik / Klien
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Bpk. Hendra Gunawan / PT. Klien"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lokasi Pekerjaan Proyek
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="BSD City, Tangerang Selatan"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Kontraktor & Konsultan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pelaksana Kontraktor
              </label>
              <input
                type="text"
                value={formData.contractor}
                onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                placeholder={settings.companyName}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konsultan Perencana / Pengawas
              </label>
              <input
                type="text"
                value={formData.consultant}
                onChange={(e) => setFormData({ ...formData, consultant: e.target.value })}
                placeholder="Studio Arsitek Mandiri"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Jadwal Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Mulai Pekerjaan
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimasi Tanggal Selesai
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Row 5: Parameter Finansial (Overhead, Profit, Pajak) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span>Parameter Finansial & Markup Anggaran (%)</span>
            </h4>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Overhead (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.overheadPercent}
                  onChange={(e) => setFormData({ ...formData, overheadPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-right font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Profit Kontraktor (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.profitPercent}
                  onChange={(e) => setFormData({ ...formData, profitPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-right font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pajak PPN (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-right font-medium"
                />
              </div>
            </div>
          </div>

          {/* If creating new: Optional Template Selection */}
          {!projectToEdit && (
            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
              <label className="block text-xs font-bold text-blue-950 mb-1.5 flex items-center space-x-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>Gunakan Template Pekerjaan (Opsional)</span>
              </label>
              <select
                value={formData.selectedTemplateId}
                onChange={(e) => setFormData({ ...formData, selectedTemplateId: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">-- Mulai dengan RAB Kosong --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.items.length} item pekerjaan)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-blue-700/80 mt-1">
                Memilih template akan otomatis mengisikan item pekerjaan standar beserta satuan dan harga unit.
              </p>
            </div>
          )}

          {/* Catatan Proyek */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan & Spesifikasi Khusus
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Spesifikasi teknis, batasan pekerjaan, atau asumsi anggaran..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-colors"
            >
              {projectToEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

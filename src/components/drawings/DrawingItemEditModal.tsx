import React, { useState, useEffect } from 'react';
import { EstimatedDrawingItem, DrawingVerificationStatus } from '../../types/drawing';

import { RAB_CATEGORIES, RABCategory } from '../../types/rab';
import { X, Edit3, Calculator, Check, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface DrawingItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: EstimatedDrawingItem | null;
  onSave: (updated: Partial<EstimatedDrawingItem>) => void;
}

export const DrawingItemEditModal: React.FC<DrawingItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
}) => {
  const [workCode, setWorkCode] = useState('');
  const [workName, setWorkName] = useState('');
  const [category, setCategory] = useState<RABCategory>('Struktur');
  const [unit, setUnit] = useState('m3');
  const [volume, setVolume] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [formulaExplanation, setFormulaExplanation] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<DrawingVerificationStatus>('adjusted');


  useEffect(() => {
    if (item) {
      setWorkCode(item.workCode || '');
      setWorkName(item.workName || '');
      setCategory(item.category as RABCategory || 'Struktur');
      setUnit(item.unit || 'm3');
      setVolume(item.volume || 0);
      setUnitPrice(item.unitPrice || 0);
      setFormulaExplanation(item.formulaExplanation || '');
      setUserNotes(item.userNotes || '');
      setVerificationStatus(item.verificationStatus || 'adjusted');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const totalCost = volume * unitPrice;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      workCode: workCode.trim(),
      workName: workName.trim(),
      category,
      unit: unit.trim(),
      volume: Number(volume) || 0,
      unitPrice: Number(unitPrice) || 0,
      totalPrice: totalCost,
      formulaExplanation: formulaExplanation.trim(),
      userNotes: userNotes.trim(),
      verificationStatus: verificationStatus === 'unverified' ? 'adjusted' : verificationStatus,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Estimasi Item Pekerjaan AI</h3>
              <p className="text-xs text-slate-300">Sesuaikan volume atau harga sebelum masuk ke RAB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kode Pekerjaan
              </label>
              <input
                type="text"
                value={workCode}
                onChange={(e) => setWorkCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Pekerjaan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RABCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              >
                {RAB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Uraian / Nama Pekerjaan *
              </label>
              <input
                type="text"
                required
                value={workName}
                onChange={(e) => setWorkName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Volume Pekerjaan *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Satuan (m, m2, m3, kg, dll)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Harga Satuan (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            {/* Total Cost Banner */}
            <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-700 font-medium">Subtotal Biaya Item:</span>
                <div className="text-base font-extrabold text-blue-900">{formatRupiah(totalCost)}</div>
              </div>
              <div className="text-xs text-slate-500">
                {volume} {unit} × {formatRupiah(unitPrice)}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Penjelasan Rumus / Dimensi AI
              </label>
              <input
                type="text"
                value={formulaExplanation}
                onChange={(e) => setFormulaExplanation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Verifikasi Anda
              </label>
              <textarea
                rows={2}
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                placeholder="Contoh: 'Telah diverifikasi sesuai addendum spesifikasi teknis'..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status Verifikasi Item
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'verified', label: 'Disetujui', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                  { value: 'adjusted', label: 'Disesuaikan', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                  { value: 'rejected', label: 'Ditolak', color: 'border-rose-500 bg-rose-50 text-rose-800' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setVerificationStatus(s.value as DrawingVerificationStatus)}

                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                      verificationStatus === s.value
                        ? `${s.color} ring-2 ring-blue-500`
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

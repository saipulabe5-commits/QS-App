import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PriceItem, ItemType } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Database, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface PriceItemModalProps {
  isOpen: boolean;
  itemToEdit?: PriceItem | null;
  onClose: () => void;
}

export const PriceItemModal: React.FC<PriceItemModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
}) => {
  const { addPriceItem, updatePriceItem } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('material');
  const [category, setCategory] = useState('Material Pokok');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState<number | string>(0);
  const [source, setSource] = useState('Harga Pasar 2026');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (itemToEdit) {
      setCode(itemToEdit.code);
      setName(itemToEdit.name);
      setType(itemToEdit.type);
      setCategory(itemToEdit.category);
      setUnit(itemToEdit.unit);
      setPrice(itemToEdit.price);
      setSource(itemToEdit.source);
    } else {
      setCode('MAT-' + Math.floor(Math.random() * 900 + 100));
      setName('');
      setType('material');
      setCategory('Material Pokok');
      setUnit('kg');
      setPrice(0);
      setSource('Harga Pasar 2026');
    }
    setErrors({});
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Nama item wajib diisi.';
    if (!code.trim()) errs.code = 'Kode item wajib diisi.';
    if (Number(price) < 0) errs.price = 'Harga satuan tidak boleh negatif.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (itemToEdit) {
      updatePriceItem(itemToEdit.id, {
        code: code.trim(),
        name: name.trim(),
        type,
        category: category.trim(),
        unit: unit.trim(),
        price: Number(price) || 0,
        source: source.trim(),
      });
    } else {
      addPriceItem({
        code: code.trim(),
        name: name.trim(),
        type,
        category: category.trim(),
        unit: unit.trim() || 'bh',
        price: Number(price) || 0,
        source: source.trim() || 'Harga Pasar Lokal',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative bg-[var(--bg-elevated)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 my-8"
      >
        <div className="px-6 py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold">
              {itemToEdit ? 'Edit Data Harga Satuan' : 'Tambah Data Harga Satuan Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white p-1 rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Jenis Unsur <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value as ItemType;
                  setType(newType);
                  if (newType === 'labor') {
                    setCategory('Upah Kerja');
                    setUnit('OH');
                  } else if (newType === 'equipment') {
                    setCategory('Sewa Peralatan');
                    setUnit('hari');
                  } else {
                    setCategory('Material Pokok');
                    setUnit('kg');
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
              >
                <option value="material">Material (Bahan Baku)</option>
                <option value="labor">Tenaga Kerja (Upah Tukang)</option>
                <option value="equipment">Peralatan & Mesin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Kode Item <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAT-01 / UPH-01"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono"
              />
              {errors.code && <p className="text-[10px] text-rose-600 mt-0.5">{errors.code}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
              Nama Item Bahan / Upah / Alat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Semen Portland Gresik 50kg / Tukang Batu Terampil"
              className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
            />
            {errors.name && <p className="text-[10px] text-rose-600 mt-0.5">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Kategori
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Semen, Besi & Baja, Kayu, Upah..."
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Satuan (Unit)
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="sak, kg, m³, OH, hari, bh..."
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Harga Satuan (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono text-right font-bold"
              />
              {errors.price && <p className="text-[10px] text-rose-600 mt-0.5">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Sumber Referensi Harga
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Standar Pemda / Toko Mitra"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
            <span className="text-blue-900 font-semibold">Tampilan Harga:</span>
            <span className="text-sm font-black text-blue-900 font-mono">
              {formatRupiah(Number(price) || 0)} / {unit}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
            >
              {itemToEdit ? 'Simpan Perubahan' : 'Tambah ke Database'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

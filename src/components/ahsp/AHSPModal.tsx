import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AHSPItem,
  AHSPComponent,
  AHSP_CATEGORIES,
  AHSP_CATEGORY_DEFINITIONS,
  AHSPCategory,
  PriceItem,
} from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { X, Plus, Trash2, Layers, Database, Sparkles, Tag, FolderTree, Info, ChevronRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AHSPModalProps {
  isOpen: boolean;
  itemToEdit?: AHSPItem | null;
  onClose: () => void;
}

export const AHSPModal: React.FC<AHSPModalProps> = ({
  isOpen,
  itemToEdit,
  onClose,
}) => {
  const { addAHSPItem, updateAHSPItem, priceDatabase, settings } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Pekerjaan Struktur Beton');
  const [subCategory, setSubCategory] = useState<string>('');
  const [unit, setUnit] = useState('m³');
  const [notes, setNotes] = useState('');
  const [components, setComponents] = useState<AHSPComponent[]>([]);

  const overheadPercent = settings?.defaultOverhead ?? 5;
  const profitPercent = settings?.defaultProfit ?? 10;

  // Add Component Sub-state
  const [compType, setCompType] = useState<'material' | 'labor' | 'equipment'>('material');
  const [compName, setCompName] = useState('');
  const [compUnit, setCompUnit] = useState('kg');
  const [compCoefficient, setCompCoefficient] = useState<number | string>(1);
  const [compUnitPrice, setCompUnitPrice] = useState<number | string>(0);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (itemToEdit) {
      setCode(itemToEdit.code);
      setName(itemToEdit.name);
      setCategory(itemToEdit.category || 'Pekerjaan Struktur Beton');
      setSubCategory(itemToEdit.subCategory || itemToEdit.subKategori || '');
      setUnit(itemToEdit.unit);
      setNotes(itemToEdit.notes || '');
      setComponents(itemToEdit.components || []);
    } else {
      setCode('A.3.1.1.' + Math.floor(Math.random() * 90 + 10));
      setName('');
      setCategory('Pekerjaan Struktur Beton');
      setSubCategory('Pengecoran Beton');
      setUnit('m³');
      setNotes('Standar SNI 2026 / Permen PUPR');
      setComponents([]);
    }
    setErrors({});
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const currentCategoryDef = AHSP_CATEGORY_DEFINITIONS[category as AHSPCategory];

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const def = AHSP_CATEGORY_DEFINITIONS[newCat as AHSPCategory];
    if (def) {
      if (def.subCategories && def.subCategories.length > 0) {
        setSubCategory(def.subCategories[0]);
      }
      if (!itemToEdit && def.codePrefix) {
        setCode(`${def.codePrefix}.${Math.floor(Math.random() * 90 + 10)}`);
      }
    }
  };

  // Totals calculations
  const totalMaterial = components
    .filter((c) => c.type === 'material')
    .reduce((s, c) => s + c.totalCost, 0);

  const totalLabor = components
    .filter((c) => c.type === 'labor')
    .reduce((s, c) => s + c.totalCost, 0);

  const totalEquipment = components
    .filter((c) => c.type === 'equipment')
    .reduce((s, c) => s + c.totalCost, 0);

  const subtotal = totalMaterial + totalLabor + totalEquipment;
  const overheadCost = subtotal * (overheadPercent / 100);
  const profitCost = subtotal * (profitPercent / 100);
  const grandHSP = subtotal + overheadCost + profitCost;

  const handleAddComponent = () => {
    if (!compName.trim()) return;
    const coef = Math.max(0, Number(compCoefficient) || 0);
    const price = Math.max(0, Number(compUnitPrice) || 0);

    const newComp: AHSPComponent = {
      id: 'comp_' + Date.now() + Math.random().toString(36).substring(2, 4),
      name: compName.trim(),
      type: compType,
      unit: compUnit.trim() || 'bh',
      coefficient: coef,
      unitPrice: price,
      totalCost: coef * price,
    };

    setComponents([...components, newComp]);
    setCompName('');
    setCompCoefficient(1);
    setCompUnitPrice(0);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const handleSelectFromPriceDb = (priceItem: PriceItem) => {
    setCompName(priceItem.name);
    setCompUnit(priceItem.unit);
    setCompUnitPrice(priceItem.price);
    setCompType(priceItem.type);
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Nama analisis pekerjaan wajib diisi.';
    if (!code.trim()) errs.code = 'Kode analisis wajib diisi.';
    if (components.length === 0) errs.components = 'Tambahkan setidaknya satu komponen biaya (bahan/upah/alat).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (itemToEdit) {
      updateAHSPItem(itemToEdit.id, {
        code: code.trim(),
        name: name.trim(),
        category,
        subCategory: subCategory.trim(),
        subKategori: subCategory.trim(),
        unit: unit.trim(),
        notes: notes.trim(),
        components,
        overheadPercent,
        profitPercent,
        unitPrice: grandHSP,
      });
    } else {
      addAHSPItem({
        code: code.trim(),
        name: name.trim(),
        category,
        subCategory: subCategory.trim(),
        subKategori: subCategory.trim(),
        unit: unit.trim(),
        notes: notes.trim(),
        components,
        overheadPercent,
        profitPercent,
        unitPrice: grandHSP,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        {/* HEADER: Lebih Elegan dengan Latar Terang & Garis Halus */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 sticky top-0 z-20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {itemToEdit ? 'Edit Analisa Harga Satuan' : 'Formulasi AHSP Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Penyusunan koefisien bahan, upah, dan alat berdasarkan standar baku
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-slate-50/30">
          
          {/* SECTION 1: Identifikasi Pekerjaan (Lebih lapang dan terstruktur) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-50 pb-3">
              <FolderTree className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-800">Kategori & Identitas Pekerjaan</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Kategori Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori Divisi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  {AHSP_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {currentCategoryDef && (
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    {currentCategoryDef.description}
                  </p>
                )}
              </div>

              {/* Sub Kategori Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sub-kategori Pekerjaan
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Contoh: Bekisting, Pembesian, Pengecoran..."
                    className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  {currentCategoryDef?.subCategories && currentCategoryDef.subCategories.length > 0 && (
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Pilihan:</span>
                      {currentCategoryDef.subCategories.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSubCategory(s)}
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${
                            subCategory === s
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Kode AHSP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode AHSP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="A.3.1.1.1"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
                {errors.code && <p className="text-[10px] text-rose-600 mt-0.5">{errors.code}</p>}
              </div>

              {/* Nama Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Uraian Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pembuatan Railing Tangga Plat Strip 10x30mm"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
                {errors.name && <p className="text-[10px] text-rose-600 mt-0.5">{errors.name}</p>}
              </div>

              {/* Satuan Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Satuan Pekerjaan
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="m³, m², kg, m¹"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Acuan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Keterangan / Acuan Standar
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Standar SNI 2026 / Permen PUPR"
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Formulasi Koefisien (Dilengkapi Tooltip Edukasi) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-800">Rincian Komponen Biaya</h4>
              </div>
              
              {/* Tooltip Interaktif Bawaan untuk QS Baru */}
              <div className="group relative flex items-center space-x-1.5 text-xs text-slate-500 cursor-help bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium">Apa itu Koefisien?</span>
                
                {/* Hover Pop-up */}
                <div className="absolute right-0 top-8 w-64 p-3 bg-slate-800 text-white text-[11px] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  Koefisien adalah angka indeks yang menunjukkan seberapa banyak bahan, waktu tenaga (OH), atau jam alat yang dibutuhkan untuk menyelesaikan <strong>1 satuan pekerjaan</strong>.
                </div>
              </div>
            </div>

            {/* Cepat dari DB */}
            <div className="flex items-center space-x-1.5 text-[11px] overflow-x-auto pb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="text-slate-500 font-medium flex-shrink-0">Cepat dari Database:</span>
              {priceDatabase.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectFromPriceDb(p)}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-700 flex-shrink-0 truncate max-w-[140px] transition-colors"
                  title={`Pilih ${p.name}`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Input Row: Didesain seperti Command Bar yang elegan */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-wrap md:flex-nowrap gap-2 items-center">
              <select
                value={compType}
                onChange={(e) => setCompType(e.target.value as any)}
                className="w-full md:w-32 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-bold text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="material">📦 Bahan</option>
                <option value="labor">👷 Upah</option>
                <option value="equipment">🚜 Alat</option>
              </select>

              <input
                type="text"
                placeholder="Nama Material (misal: Besi Nako Solid 10x10mm)"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400"
              />

              <input
                type="text"
                placeholder="Satuan (kg)"
                value={compUnit}
                onChange={(e) => setCompUnit(e.target.value)}
                className="w-20 px-3 py-2 text-xs text-center bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400"
              />

              <input
                type="number"
                step="any"
                placeholder="Koefisien"
                value={compCoefficient}
                onChange={(e) => setCompCoefficient(e.target.value)}
                className="w-24 px-3 py-2 text-xs text-right font-mono font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100 rounded-lg outline-none focus:border-indigo-400 focus:bg-indigo-50"
                title="Jumlah kebutuhan per satuan pekerjaan"
              />

              <input
                type="number"
                placeholder="Harga (Rp)"
                value={compUnitPrice}
                onChange={(e) => setCompUnitPrice(e.target.value)}
                className="w-32 px-3 py-2 text-xs text-right font-mono bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400"
              />

              <button
                type="button"
                onClick={handleAddComponent}
                className="w-full md:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Tambah
              </button>
            </div>

            {errors.components && (
              <p className="text-xs text-rose-600 font-semibold">{errors.components}</p>
            )}

            {/* TABEL KOMPONEN: Visual lebih bersih dengan padding longgar */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3 font-bold">Unsur</th>
                    <th className="px-5 py-3 font-bold">Uraian Komponen</th>
                    <th className="px-5 py-3 text-center font-bold">Satuan</th>
                    <th className="px-5 py-3 text-right font-bold">Koefisien</th>
                    <th className="px-5 py-3 text-right font-bold">Harga Satuan</th>
                    <th className="px-5 py-3 text-right font-bold">Jumlah Harga</th>
                    <th className="px-5 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {components.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <Layers className="w-8 h-8 mb-2 opacity-20" />
                          <span className="text-sm font-medium">Belum ada komponen penyusun.</span>
                          <span className="text-xs">Gunakan form di atas untuk merakit analisa.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    components.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="px-5 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-md capitalize ${
                              c.type === 'material'
                                ? 'bg-blue-100 text-blue-800'
                                : c.type === 'labor'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {c.type === 'material' ? 'Bahan' : c.type === 'labor' ? 'Upah' : 'Alat'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">{c.name}</td>
                        <td className="px-5 py-3 text-center">{c.unit}</td>
                        <td className="px-5 py-3 text-right font-mono font-medium text-slate-600">{formatNumber(c.coefficient, 4)}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600">{formatRupiah(c.unitPrice)}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(c.totalCost)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                  {components.length > 0 && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200 text-slate-700">
                            Overhead
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">Biaya Overhead</td>
                        <td className="px-5 py-3 text-center text-slate-500">ls</td>
                        <td className="px-5 py-3 text-right font-mono font-medium text-slate-600">{formatNumber(overheadPercent / 100, 4)}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600">{formatRupiah(subtotal)}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(overheadCost)}
                        </td>
                        <td className="px-5 py-3 text-center"></td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="px-5 py-3">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-200 text-slate-700">
                            Profit
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800">Keuntungan Pelaksana / Profit</td>
                        <td className="px-5 py-3 text-center text-slate-500">ls</td>
                        <td className="px-5 py-3 text-right font-mono font-medium text-slate-600">{formatNumber(profitPercent / 100, 4)}</td>
                        <td className="px-5 py-3 text-right font-mono text-slate-600">{formatRupiah(subtotal)}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(profitCost)}
                        </td>
                        <td className="px-5 py-3 text-center"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* FOOTER & TOTALS: Tampilan Dashboard-style */}
        <div className="bg-slate-900 px-8 py-5 flex flex-col md:flex-row items-center justify-between shrink-0 rounded-b-2xl">
          <div className="flex items-center space-x-6 text-white mb-4 md:mb-0">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Bahan</div>
              <div className="font-mono text-sm">{formatRupiah(totalMaterial)}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Upah & Alat</div>
              <div className="font-mono text-sm">{formatRupiah(totalLabor + totalEquipment)}</div>
            </div>
            <div className="pl-6 border-l border-slate-700">
              <div className="text-[10px] text-indigo-300 uppercase font-black tracking-widest mb-1">Total HSP (D + E + F)</div>
              <div className="font-mono text-xl font-bold text-white">{formatRupiah(grandHSP)}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 md:flex-none px-6 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 md:flex-none px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-lg transition-all"
            >
              {itemToEdit ? 'Simpan Analisa' : 'Simpan Analisa Baru'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};


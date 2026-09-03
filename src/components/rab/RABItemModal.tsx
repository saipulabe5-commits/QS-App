import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { RABItem, RABCategory, RAB_CATEGORIES, PriceItem, AHSPItem } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { normalizeCategory } from '../../utils/normalizers';
import { aiService } from '../../services/aiService';
import {
  X,
  Calculator,
  Database,
  Layers,
  Ruler,
  Check,
  ChevronRight,
  Info,
  Sparkles,
  Loader2,
  Zap,
} from 'lucide-react';

interface RABItemModalProps {
  isOpen: boolean;
  projectId: string;
  itemToEdit?: RABItem | null;
  initialCategory?: string;
  onClose: () => void;
  onOpenCalculator?: () => void;
}

export const RABItemModal: React.FC<RABItemModalProps> = ({
  isOpen,
  projectId,
  itemToEdit,
  initialCategory,
  onClose,
  onOpenCalculator,
}) => {
  const { addRABItem, updateRABItem, priceDatabase, ahspItems } = useApp();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RABCategory>('Pekerjaan Persiapan');
  const [unit, setUnit] = useState('m²');
  const [volume, setVolume] = useState<number | string>(1);
  const [unitPrice, setUnitPrice] = useState<number | string>(0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Tabs: 'form' | 'priceDb' | 'ahsp'
  const [pickerTab, setPickerTab] = useState<'form' | 'priceDb' | 'ahsp'>('form');
  const [dbSearch, setDbSearch] = useState('');
  const [priceTypeFilter, setPriceTypeFilter] = useState<'all' | 'material' | 'labor' | 'equipment'>('all');
  const [ahspCategoryFilter, setAhspCategoryFilter] = useState<string>('all');

  // Mini Quick Volume Calculator Inside Modal
  const [isMiniCalcOpen, setIsMiniCalcOpen] = useState(false);
  const [calcFormula, setCalcFormula] = useState<'luas' | 'volume' | 'dinding' | 'galian'>('luas');
  const [calcLength, setCalcLength] = useState<number>(0);
  const [calcWidth, setCalcWidth] = useState<number>(0);
  const [calcHeight, setCalcHeight] = useState<number>(0);
  const [calcOpenings, setCalcOpenings] = useState<number>(0);

  // Smart Auto-categorization State (Fitur 4)
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [autoCatResult, setAutoCatResult] = useState<{
    category: string;
    confidence: number;
    reason: string;
    suggestedUnit?: string;
    suggestedCode?: string;
  } | null>(null);

  useEffect(() => {
    if (itemToEdit) {
      setCode(itemToEdit.code || '');
      setName(itemToEdit.name || '');
      setCategory(itemToEdit.category || 'Pekerjaan Persiapan');
      setUnit(itemToEdit.unit || 'm²');
      setVolume(itemToEdit.volume || 1);
      setUnitPrice(itemToEdit.unitPrice || 0);
      setNotes(itemToEdit.notes || '');
    } else {
      setCode('');
      setName('');
      setCategory((initialCategory as RABCategory) || 'Pekerjaan Persiapan');
      setUnit('m²');
      setVolume(1);
      setUnitPrice(0);
      setNotes('');
    }
    setPickerTab('form');
    setIsMiniCalcOpen(false);
    setAutoCatResult(null);
    setErrors({});
  }, [itemToEdit, initialCategory, isOpen]);

  // Handler: Smart Auto-categorize (Fitur 4)
  const handleAutoCategorize = async () => {
    if (!name || name.trim().length < 3) {
      setErrors((prev) => ({ ...prev, name: 'Ketik uraian pekerjaan terlebih dahulu (minimal 3 karakter).' }));
      return;
    }
    setIsAutoCategorizing(true);
    try {
      const res = await aiService.autoCategorize(name.trim(), category);
      if (res.suggestedCategory) {
        setCategory(res.suggestedCategory);
        if (res.suggestedUnit && (!unit || unit === 'm²' || unit === 'ls')) {
          setUnit(res.suggestedUnit);
        }
        if (res.suggestedCode && !code) {
          setCode(res.suggestedCode);
        }
        setAutoCatResult({
          category: res.suggestedCategory,
          confidence: res.confidence || 85,
          reason: res.reason || 'Klasifikasi otomatis berdasarkan uraian pekerjaan standar SNI.',
          suggestedUnit: res.suggestedUnit,
          suggestedCode: res.suggestedCode,
        });
      }
    } catch (err) {
      console.warn('Auto categorize error:', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  if (!isOpen) return null;

  const numVol = Math.max(0, Number(volume) || 0);
  const numPrice = Math.max(0, Number(unitPrice) || 0);
  const totalCostPreview = numVol * numPrice;

  // Mini volume calculation
  const getCalculatedVolume = (): number => {
    if (calcFormula === 'luas') {
      return (Number(calcLength) || 0) * (Number(calcWidth) || 0);
    }
    if (calcFormula === 'volume' || calcFormula === 'galian') {
      return (Number(calcLength) || 0) * (Number(calcWidth) || 0) * (Number(calcHeight) || 0);
    }
    if (calcFormula === 'dinding') {
      const gross = (Number(calcLength) || 0) * (Number(calcHeight) || 0);
      return Math.max(0, gross - (Number(calcOpenings) || 0));
    }
    return 0;
  };

  const handleApplyCalculatedVolume = () => {
    const calculated = getCalculatedVolume();
    if (calculated > 0) {
      setVolume(Number(calculated.toFixed(3)));
      if (calcFormula === 'luas' || calcFormula === 'dinding') {
        if (!unit || unit === 'ls' || unit === 'm³') setUnit('m²');
      } else if (calcFormula === 'volume' || calcFormula === 'galian') {
        if (!unit || unit === 'ls' || unit === 'm²') setUnit('m³');
      }
      setIsMiniCalcOpen(false);
    }
  };

  const handleSelectFromPriceDb = (item: PriceItem) => {
    setName(item.name);
    setUnit(item.unit);
    setUnitPrice(item.price);
    if (!code) setCode(item.code);
    setPickerTab('form');
  };

  const handleSelectFromAHSP = (item: AHSPItem) => {
    setName(item.name);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    if (!code) setCode(item.code);
    setCategory(normalizeCategory(item.category));
    if (item.notes) setNotes(item.notes);
    setPickerTab('form');
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) {
      errs.name = 'Uraian pekerjaan wajib diisi.';
    }
    if (numVol <= 0) {
      errs.volume = 'Volume harus berupa angka positif lebih dari 0.';
    }
    if (numPrice < 0) {
      errs.unitPrice = 'Harga satuan tidak boleh bernilai negatif.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const generatedCode = code.trim() || `POS-${Math.floor(Math.random() * 900 + 100)}`;

    if (itemToEdit) {
      updateRABItem(itemToEdit.id, {
        code: generatedCode,
        name: name.trim(),
        category,
        unit: unit.trim() || 'ls',
        volume: numVol,
        unitPrice: numPrice,
        notes: notes.trim(),
      });
    } else {
      addRABItem({
        projectId,
        code: generatedCode,
        name: name.trim(),
        category,
        unit: unit.trim() || 'ls',
        volume: numVol,
        unitPrice: numPrice,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Box */}
      <div className="relative bg-[var(--bg-elevated)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 my-8 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {itemToEdit ? 'Edit Item Pekerjaan RAB' : 'Tambah Item Pekerjaan Baru'}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Lengkapi rincian volume, harga satuan, dan divisi pekerjaan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white p-1.5 rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-elevated-hover)] px-6 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPickerTab('form')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 ${
              pickerTab === 'form'
                ? 'bg-[var(--bg-elevated)] text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-[var(--text-primary)] border-transparent'
            }`}
          >
            Form Input RAB
          </button>
          <button
            type="button"
            onClick={() => setPickerTab('priceDb')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 flex items-center space-x-1.5 ${
              pickerTab === 'priceDb'
                ? 'bg-[var(--bg-elevated)] text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-[var(--text-primary)] border-transparent'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Pilih Master Harga</span>
          </button>
          <button
            type="button"
            onClick={() => setPickerTab('ahsp')}
            className={`px-4 py-2 rounded-t-lg transition-colors border-b-2 flex items-center space-x-1.5 ${
              pickerTab === 'ahsp'
                ? 'bg-[var(--bg-elevated)] text-blue-700 border-blue-600 shadow-2xs'
                : 'text-slate-500 hover:text-[var(--text-primary)] border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pilih AHSP SNI</span>
          </button>
        </div>

        {/* Tab 1: Form Input */}
        {pickerTab === 'form' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Category & Code */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Kategori / Divisi Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as RABCategory)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                >
                  {RAB_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Kode Pekerjaan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: STR-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Uraian Pekerjaan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Uraian Pekerjaan <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-2 text-[11px]">
                  <button
                    type="button"
                    onClick={handleAutoCategorize}
                    disabled={isAutoCategorizing || !name.trim()}
                    className="font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200 flex items-center space-x-1 transition-colors disabled:opacity-50"
                    title="Gunakan AI untuk menentukan kategori, satuan, dan kode secara otomatis"
                  >
                    {isAutoCategorizing ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>Auto Kategori AI</span>
                      </>
                    )}
                  </button>
                  <span>&middot;</span>
                  <button
                    type="button"
                    onClick={() => setPickerTab('ahsp')}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    + Dari AHSP
                  </button>
                  <span>&middot;</span>
                  <button
                    type="button"
                    onClick={() => setPickerTab('priceDb')}
                    className="font-semibold text-blue-700 hover:underline"
                  >
                    + Dari DB Harga
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (autoCatResult) setAutoCatResult(null);
                }}
                placeholder="Contoh: Pekerjaan cor beton bertulang Sloof 15/20 cm K-250 besi ulir"
                className={`w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 ${
                  errors.name ? 'border-rose-400' : 'border-[var(--border-primary)]'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.name}</p>}

              {/* Auto Category Feedback Badge */}
              {autoCatResult && (
                <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start justify-between gap-2 text-[11px]">
                  <div className="flex items-start space-x-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900">
                        Kategori Terpilih: {autoCatResult.category} ({autoCatResult.confidence}% confidence)
                      </span>
                      <p className="text-emerald-700 text-[10.5px] mt-0.5">{autoCatResult.reason}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoCatResult(null)}
                    className="text-emerald-600 hover:text-emerald-800 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Satuan, Volume, Harga Satuan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  list="unit-options-list"
                  placeholder="m², m³, kg, ls..."
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-medium focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
                <datalist id="unit-options-list">
                  <option value="m¹" />
                  <option value="m²" />
                  <option value="m³" />
                  <option value="kg" />
                  <option value="bh" />
                  <option value="ls" />
                  <option value="titik" />
                  <option value="set" />
                  <option value="unit" />
                  <option value="sak" />
                  <option value="OH" />
                  <option value="btg" />
                </datalist>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Volume <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMiniCalcOpen(!isMiniCalcOpen)}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center space-x-1"
                    title="Hitung dengan Kalkulator Dimensi"
                  >
                    <Ruler className="w-3 h-3" />
                    <span>{isMiniCalcOpen ? 'Tutup' : 'Hitung'}</span>
                  </button>
                </div>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border rounded-xl font-mono text-right font-bold text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 ${
                    errors.volume ? 'border-rose-400' : 'border-[var(--border-primary)]'
                  }`}
                />
                {errors.volume && <p className="text-[10px] text-rose-600 mt-1">{errors.volume}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Harga Satuan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className={`w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border rounded-xl font-mono text-right font-bold text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 ${
                    errors.unitPrice ? 'border-rose-400' : 'border-[var(--border-primary)]'
                  }`}
                />
                {errors.unitPrice && <p className="text-[10px] text-rose-600 mt-1">{errors.unitPrice}</p>}
              </div>
            </div>

            {/* Quick Mini Calculator Drawer inside Modal */}
            {isMiniCalcOpen && (
              <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-blue-700" />
                    Kalkulator Dimensi Cepat
                  </span>
                  <div className="flex items-center gap-1 text-[11px]">
                    {(['luas', 'volume', 'dinding', 'galian'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCalcFormula(mode)}
                        className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                          calcFormula === mode
                            ? 'bg-blue-600 text-white'
                            : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700'
                        }`}
                      >
                        {mode === 'luas' ? 'Luas' : mode === 'volume' ? 'Volume' : mode === 'dinding' ? 'Dinding' : 'Galian'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                      Panjang (m)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={calcLength || ''}
                      onChange={(e) => setCalcLength(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-right font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                      {calcFormula === 'dinding' ? 'Tinggi (m)' : 'Lebar (m)'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={calcFormula === 'dinding' ? calcHeight || '' : calcWidth || ''}
                      onChange={(e) =>
                        calcFormula === 'dinding'
                          ? setCalcHeight(Number(e.target.value))
                          : setCalcWidth(Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-right font-mono"
                    />
                  </div>
                  {calcFormula === 'volume' || calcFormula === 'galian' ? (
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                        {calcFormula === 'galian' ? 'Kedalaman (m)' : 'Tinggi/Tebal (m)'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={calcHeight || ''}
                        onChange={(e) => setCalcHeight(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-right font-mono"
                      />
                    </div>
                  ) : calcFormula === 'dinding' ? (
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-secondary)] mb-0.5">
                        Bukaan Pintu/Jendela (m²)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={calcOpenings || ''}
                        onChange={(e) => setCalcOpenings(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg text-right font-mono"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Hasil: <strong className="text-blue-700 font-mono text-sm">{formatNumber(getCalculatedVolume(), 3)}</strong> {calcFormula === 'luas' || calcFormula === 'dinding' ? 'm²' : 'm³'}
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyCalculatedVolume}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Gunakan Nilai Ini</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Calculation Banner (Volume × Harga Satuan = Jumlah Biaya) */}
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-blue-800 uppercase font-extrabold tracking-wider block">
                  Perhitungan Otomatis Biaya Item
                </span>
                <div className="text-xs text-[var(--text-primary)] mt-0.5">
                  Volume: <strong className="text-[var(--text-primary)]">{formatNumber(numVol, 2)} {unit}</strong> &times; Harga:{' '}
                  <strong className="text-[var(--text-primary)]">{formatRupiah(numPrice)}</strong>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-blue-700 font-medium block">Jumlah Biaya Pos:</span>
                <span className="text-lg font-black text-blue-900 font-mono">
                  {formatRupiah(totalCostPreview)}
                </span>
              </div>
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Keterangan / Spesifikasi Bahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Semen Gresik, pasir muntilan, besi ulir SNI"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-2xs transition-colors"
              >
                {itemToEdit ? 'Simpan Perubahan' : 'Tambahkan ke Tabel RAB'}
              </button>
            </div>
          </form>
        ) : pickerTab === 'priceDb' ? (
          /* Tab 2: Database Harga Picker */
          <div className="p-6 space-y-4 max-h-[75vh] flex flex-col">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Cari nama material, upah tukang, alat..."
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />
              <div className="flex items-center space-x-1 text-xs">
                {(['all', 'material', 'labor', 'equipment'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPriceTypeFilter(type)}
                    className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                      priceTypeFilter === type
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-[var(--bg-elevated-hover)] text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700'
                    }`}
                  >
                    {type === 'all' ? 'Semua' : type === 'material' ? 'Bahan' : type === 'labor' ? 'Upah' : 'Alat'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[350px] pr-1 custom-scrollbar">
              {priceDatabase
                .filter((p) => {
                  const matchSearch =
                    p.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    p.code.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(dbSearch.toLowerCase());
                  const matchType = priceTypeFilter === 'all' || p.type === priceTypeFilter;
                  return matchSearch && matchType;
                })
                .map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectFromPriceDb(p)}
                    className="p-3 bg-[var(--bg-elevated-hover)] hover:bg-blue-50 rounded-xl border border-[var(--border-primary)] hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-900">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono text-[var(--text-secondary)] font-semibold">{p.code}</span> &middot; {p.category} &middot;{' '}
                        <span className="capitalize">{p.type}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-blue-700 font-mono">
                        {formatRupiah(p.price)} / {p.unit}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)]">{p.source || 'Master'}</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPickerTab('form')}
                className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
              >
                Kembali ke Form
              </button>
            </div>
          </div>
        ) : (
          /* Tab 3: AHSP SNI Picker */
          <div className="p-6 space-y-4 max-h-[75vh] flex flex-col">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Cari analisis SNI (Pondasi, Plesteran, Cor Beton, Pasangan Bata, Plafon)..."
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
              />

              {/* Category Pills inside AHSP Picker */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setAhspCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium flex-shrink-0 transition-colors ${
                    ahspCategoryFilter === 'all'
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)]'
                  }`}
                >
                  Semua Kategori ({ahspItems.length})
                </button>
                {Array.from(new Set(ahspItems.map((a) => a.category))).map((cat) => {
                  const count = ahspItems.filter((a) => a.category === cat).length;
                  const isSelected = ahspCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAhspCategoryFilter(isSelected ? 'all' : cat)}
                      className={`px-2.5 py-1 rounded-lg font-medium flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)]'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-h-[320px] pr-1 custom-scrollbar">
              {ahspItems
                .filter((a) => {
                  const matchSearch =
                    a.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    a.code.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    a.category.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    (a.subCategory && a.subCategory.toLowerCase().includes(dbSearch.toLowerCase()));
                  const matchCat =
                    ahspCategoryFilter === 'all' || a.category === ahspCategoryFilter;
                  return matchSearch && matchCat;
                })
                .map((a) => (
                  <div
                    key={a.id}
                    onClick={() => handleSelectFromAHSP(a)}
                    className="p-3.5 bg-[var(--bg-elevated-hover)] hover:bg-blue-50 rounded-xl border border-[var(--border-primary)] hover:border-blue-300 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-900">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5">
                        <span className="font-mono text-[var(--text-secondary)] font-semibold">{a.code}</span>
                        <span>&middot;</span>
                        <span className="text-blue-600 font-medium">{a.category}</span>
                        {a.subCategory && (
                          <>
                            <span>&middot;</span>
                            <span className="text-[var(--text-secondary)]">{a.subCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-black text-blue-700 font-mono">
                        {formatRupiah(a.unitPrice)} / {a.unit}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-medium">Standar SNI PUPR</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPickerTab('form')}
                className="px-4 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
              >
                Kembali ke Form
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

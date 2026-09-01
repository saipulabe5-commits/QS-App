import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  QuickBuilderMethod,
  BuildingTypeOption,
  QuickBuilderProjectData,
  QuickBuilderDraftItem,
  QuickBuilderSummary,
  RABCategory,
  RAB_CATEGORIES,
  CustomCategoryItem,
} from '../../types';
import { PRESET_BUILDING_CONFIGS, QuickBuilderService } from '../../services/quickBuilderService';
import { ZeroMistakeEngine } from '../../services/zeroMistakeEngine';
import { formatRupiah } from '../../utils/formatters';
import {
  X,
  Sparkles,
  Layers,
  Boxes,
  Building2,
  FileSpreadsheet,
  Upload,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  ShieldCheck,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface QuickRABBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickRABBuilderModal: React.FC<QuickRABBuilderModalProps> = ({ isOpen, onClose }) => {
  const {
    projects,
    addProject,
    setActiveProjectId,
    rabTemplates,
    ahspItems,
    priceDatabase,
    user,
    showToast,
    addRABItem,
    setActiveTab,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Project Info
  const [projectData, setProjectData] = useState<QuickBuilderProjectData>({
    name: '',
    documentNo: `RAB-${new Date().getFullYear()}-${String(projects.length + 1).padStart(3, '0')}`,
    clientName: '',
    location: 'Jakarta',
    projectType: 'Rumah Tinggal',
    buildingArea: 72,
    areaUnit: 'm²',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetBudget: 350000000,
    overheadPercent: 5,
    profitPercent: 10,
    taxPercent: 0,
    notes: 'Dibuat melalui Quick RAB Builder',
  });

  // Step 2: Method & Template Selection
  const [method, setMethod] = useState<QuickBuilderMethod>('building_type');
  const [selectedBuildingType, setSelectedBuildingType] = useState<BuildingTypeOption>('residential_single_storey');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [aiDisclaimerAccepted, setAiDisclaimerAccepted] = useState(false);

  // Step 3: Categories
  const [selectedCategories, setSelectedCategories] = useState<RABCategory[]>([...RAB_CATEGORIES]);
  const [customCategories, setCustomCategories] = useState<CustomCategoryItem[]>([]);
  const [newCustomCatName, setNewCustomCatName] = useState('');

  // Step 4: Generated Draft Items
  const [draftItems, setDraftItems] = useState<QuickBuilderDraftItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Step 5: Review & Consent
  const [userConsentChecked, setUserConsentChecked] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Errors & Warnings state
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [stepWarnings, setStepWarnings] = useState<string[]>([]);

  // Update categories when building type changes
  useEffect(() => {
    if (method === 'building_type' && PRESET_BUILDING_CONFIGS[selectedBuildingType]) {
      const config = PRESET_BUILDING_CONFIGS[selectedBuildingType];
      setSelectedCategories([...config.categories]);
      setProjectData((prev) => ({
        ...prev,
        projectType: config.name,
        buildingArea: config.defaultArea,
        targetBudget: config.defaultArea * config.estimatedCostPerM2,
      }));
    }
  }, [method, selectedBuildingType]);

  // Generate Draft Items when entering Step 4
  const generateItemsForStep4 = () => {
    const selectedTemplate = rabTemplates.find((t) => t.id === selectedTemplateId);
    const generated = QuickBuilderService.generateDraftItems({
      method,
      buildingType: selectedBuildingType,
      buildingArea: projectData.buildingArea,
      selectedCategories,
      template: selectedTemplate,
      ahspItems,
      priceDatabase,
    });

    setDraftItems(generated);
    setSelectedItemIds(new Set(generated.map((it) => it.id)));
  };

  if (!isOpen) return null;

  // Validation per step
  const validateStep = (currentStep: number): boolean => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (currentStep === 1) {
      if (!projectData.name.trim()) errors.push('Nama proyek wajib diisi.');
      if (!projectData.projectType) errors.push('Jenis proyek wajib dipilih.');
      if (projectData.buildingArea < 0) errors.push('Luas bangunan tidak boleh negatif.');
      if (projectData.targetBudget < 0) errors.push('Nilai anggaran target tidak boleh negatif.');
      if (
        projectData.overheadPercent < 0 ||
        projectData.overheadPercent > 100 ||
        projectData.profitPercent < 0 ||
        projectData.profitPercent > 100 ||
        projectData.taxPercent < 0 ||
        projectData.taxPercent > 100
      ) {
        errors.push('Persentase biaya (overhead, profit, pajak) harus antara 0% - 100%.');
      }
      if (projectData.startDate && projectData.endDate) {
        if (new Date(projectData.endDate) < new Date(projectData.startDate)) {
          errors.push('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.');
        }
      }
    }

    if (currentStep === 2) {
      if (method === 'template' && !selectedTemplateId) {
        errors.push('Silakan pilih salah satu template RAB.');
      }
      if (method === 'ai_estimator' && !aiDisclaimerAccepted) {
        errors.push('Anda wajib mencentang konfirmasi pemahaman estimasi AI.');
      }
    }

    if (currentStep === 3) {
      if (selectedCategories.length === 0) {
        errors.push('Pilih minimal 1 kategori pekerjaan untuk menyusun RAB.');
      }
    }

    if (currentStep === 4) {
      const activeDrafts = draftItems.filter((it) => selectedItemIds.has(it.id));
      if (activeDrafts.length === 0) {
        errors.push('Pilih minimal 1 item pekerjaan untuk dimasukkan ke RAB.');
      }
      const duplicateCodes = activeDrafts.filter((it) => it.isDuplicate);
      if (duplicateCodes.length > 0) {
        warnings.push(`Terdapat ${duplicateCodes.length} item dengan kode pekerjaan terduplikasi.`);
      }
    }

    setStepErrors(errors);
    setStepWarnings(warnings);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 3) {
        generateItemsForStep4();
      }
      if (step < 5) {
        setStep((prev) => (prev + 1) as any);
      }
    }
  };

  const handleBack = () => {
    setStepErrors([]);
    setStepWarnings([]);
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  // Toggle Category
  const toggleCategory = (cat: RABCategory) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Add Custom Category
  const handleAddCustomCategory = () => {
    const trimmed = newCustomCatName.trim();
    if (!trimmed) return;
    if (
      selectedCategories.includes(trimmed as any) ||
      customCategories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      showToast('Kategori Duplikat', 'Kategori dengan nama tersebut sudah ada.', 'warning');
      return;
    }
    const newCat: CustomCategoryItem = {
      id: `cat_${Date.now()}`,
      name: trimmed,
      isActive: true,
    };
    setCustomCategories([...customCategories, newCat]);
    setSelectedCategories([...selectedCategories, trimmed as any]);
    setNewCustomCatName('');
  };

  // Toggle Item Selection in Step 4
  const toggleItemSelection = (id: string) => {
    const nextSet = new Set(selectedItemIds);
    if (nextSet.has(id)) nextSet.delete(id);
    else nextSet.add(id);
    setSelectedItemIds(nextSet);
  };

  // Select all / Deselect all
  const toggleAllItems = () => {
    if (selectedItemIds.size === draftItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(draftItems.map((d) => d.id)));
    }
  };

  // Update item field
  const updateDraftItem = (id: string, field: keyof QuickBuilderDraftItem, value: any) => {
    setDraftItems(
      draftItems.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'volume' || field === 'unitPrice') {
          const vol = field === 'volume' ? Number(value) : it.volume;
          const price = field === 'unitPrice' ? Number(value) : it.unitPrice;
          updated.totalCost = Math.max(0, vol * price);
        }
        return updated;
      })
    );
  };

  // Delete item from draft
  const deleteDraftItem = (id: string) => {
    setDraftItems(draftItems.filter((it) => it.id !== id));
    const nextSet = new Set(selectedItemIds);
    nextSet.delete(id);
    setSelectedItemIds(nextSet);
  };

  // Active items for calculation
  const activeSelectedDrafts = draftItems.filter((it) => selectedItemIds.has(it.id));
  const summary: QuickBuilderSummary = QuickBuilderService.calculateWizardSummary(
    activeSelectedDrafts,
    projectData.overheadPercent,
    projectData.profitPercent,
    projectData.taxPercent,
    projectData.targetBudget
  );

  // Apply to Project Atomic Execution
  const handleApplyToProject = async () => {
    if (!userConsentChecked) {
      showToast('Persetujuan Diperlukan', 'Harap centang kotak persetujuan sebelum menerapkan ke proyek.', 'warning');
      return;
    }

    setIsApplying(true);
    try {
      // 1. Buat entity Project baru
      const newProject = await addProject({
        name: projectData.name,
        documentNo: projectData.documentNo,
        clientName: projectData.clientName || 'Klien Umum',
        location: projectData.location || 'Indonesia',
        contractor: user?.companyName || 'PT. Citra Kusuma Development',
        consultant: 'Konsultan QS',
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        status: 'Draft',
        overheadPercent: projectData.overheadPercent,
        profitPercent: projectData.profitPercent,
        taxPercent: projectData.taxPercent,
        targetBudget: projectData.targetBudget,
        projectType: projectData.projectType,
        buildingArea: projectData.buildingArea,
        areaUnit: projectData.areaUnit,
        notes: projectData.notes || '',
      });

      // 2. Tambahkan semua item RAB terpilih
      for (const item of activeSelectedDrafts) {
        await addRABItem(
          {
            projectId: newProject.id,
            code: item.code,
            name: item.name,
            category: item.category,
            unit: item.unit,
            volume: item.volume,
            unitPrice: item.unitPrice,
            notes: item.notes || '',
            sourceType: item.sourceType,
            sourceTemplateId: item.sourceTemplateId,
            confidence: item.confidence,
            needsVerification: item.needsVerification,
            assumptions: item.assumptions,
            warnings: item.warnings,
          },
          `Quick RAB Builder (${method})`
        );
      }

      // 3. Set Proyek Aktif & Navigasi ke Halaman RAB
      setActiveProjectId(newProject.id);
      setActiveTab('rab');
      showToast('RAB Berhasil Dibuat', `Proyek "${newProject.name}" dan ${activeSelectedDrafts.length} item RAB siap digunakan.`, 'success');
      onClose();
    } catch (error: any) {
      console.error('Failed to apply Quick RAB Builder:', error);
      showToast('Gagal Menerapkan RAB', error?.message || 'Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Window */}
      <div className="relative w-full max-w-4xl rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-10 flex flex-col max-h-[92vh] border border-white/40 bg-white/70 backdrop-blur-2xl">
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
          <div className="flex-1 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
                Quick RAB Builder
              </h3>
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full">
                Wizard
              </span>
            </div>
          </div>

          {/* Spacer */}
          <div className="w-20"></div>
        </div>

        {/* Progress Step Indicator */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Info Proyek' },
              { num: 2, label: 'Metode & Template' },
              { num: 3, label: 'Kategori' },
              { num: 4, label: 'Generate Item' },
              { num: 5, label: 'Review & Konfirmasi' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === s.num
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : step > s.num
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline ${
                      step === s.num ? 'text-blue-900 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div
                    className={`w-6 sm:w-12 h-0.5 mx-2 ${
                      step > s.num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Errors & Warnings Notification Box */}
        {(stepErrors.length > 0 || stepWarnings.length > 0) && (
          <div className="mx-6 mt-4 p-3 rounded-xl border space-y-1 text-xs bg-rose-50 border-rose-200 text-rose-800">
            {stepErrors.map((err, i) => (
              <div key={i} className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{err}</span>
              </div>
            ))}
            {stepWarnings.map((w, i) => (
              <div key={i} className="flex items-center gap-1.5 text-amber-800 font-medium">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content View per Step */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/60">
          {/* STEP 1: INFORMASI PROYEK */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Langkah 1 dari 5: Informasi Umum & Plafon Anggaran Proyek
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Masukkan identitas proyek, dimensi bangunan, dan parameter kalkulasi biaya overhead & profit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Proyek <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectData.name}
                    onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                    placeholder="Contoh: Pembangunan Rumah Tinggal 2 Lantai Bpk. Hendra"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Dokumen
                  </label>
                  <input
                    type="text"
                    value={projectData.documentNo}
                    onChange={(e) => setProjectData({ ...projectData, documentNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Pemilik / Klien
                  </label>
                  <input
                    type="text"
                    value={projectData.clientName}
                    onChange={(e) => setProjectData({ ...projectData, clientName: e.target.value })}
                    placeholder="Nama Klien atau Instansi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={projectData.location}
                    onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                    placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis / Tipe Proyek <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectData.projectType}
                    onChange={(e) => setProjectData({ ...projectData, projectType: e.target.value })}
                    placeholder="Contoh: Rumah Tinggal / Ruko / Gudang"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Luas Bangunan
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={projectData.buildingArea}
                      onChange={(e) => setProjectData({ ...projectData, buildingArea: Math.max(0, Number(e.target.value)) })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Satuan Luas
                    </label>
                    <input
                      type="text"
                      value={projectData.areaUnit}
                      onChange={(e) => setProjectData({ ...projectData, areaUnit: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Anggaran (Budget Plafon)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-semibold">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={projectData.targetBudget}
                      onChange={(e) => setProjectData({ ...projectData, targetBudget: Math.max(0, Number(e.target.value)) })}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-semibold text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {formatRupiah(projectData.targetBudget)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Overhead (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectData.overheadPercent}
                      onChange={(e) => setProjectData({ ...projectData, overheadPercent: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Profit (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectData.profitPercent}
                      onChange={(e) => setProjectData({ ...projectData, profitPercent: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pajak PPN (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={projectData.taxPercent}
                      onChange={(e) => setProjectData({ ...projectData, taxPercent: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: METODE / TEMPLATE */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  Langkah 2 dari 5: Pilih Metode & Template Penyusunan RAB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan bagaimana item RAB awal akan disusun (berdasarkan tipe bangunan, template terverifikasi, AI, atau mulai dari kosong).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'building_type' as QuickBuilderMethod,
                    title: 'Jenis Bangunan Standar',
                    desc: 'Otomasi volume & AHSP berdasarkan tipe bangunan dan luas area.',
                    icon: Building2,
                    badge: 'Direkomendasikan',
                  },
                  {
                    id: 'template' as QuickBuilderMethod,
                    title: 'Gunakan Template RAB',
                    desc: 'Pilih dari template master pekerjaan yang telah diverifikasi.',
                    icon: Boxes,
                    badge: `${rabTemplates.length} Template`,
                  },
                  {
                    id: 'ai_estimator' as QuickBuilderMethod,
                    title: 'AI Estimator (Gemini)',
                    desc: 'Estimasi awal cerdas dengan asumsi teknis dan confidence score.',
                    icon: Sparkles,
                    badge: 'AI Powered',
                  },
                  {
                    id: 'standard_list' as QuickBuilderMethod,
                    title: 'Daftar Pekerjaan Standar',
                    desc: 'Daftar WBS standar SNI dengan harga satuan default.',
                    icon: FileSpreadsheet,
                    badge: 'SNI / PUPR',
                  },
                  {
                    id: 'blank' as QuickBuilderMethod,
                    title: 'Mulai dari Kosong',
                    desc: 'Buat proyek kosong dan input item secara manual nanti.',
                    icon: Plus,
                    badge: 'Manual',
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = method === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setMethod(opt.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {opt.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{opt.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Sub-Selection based on Method */}
              {method === 'building_type' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Pilih Model Tipe Bangunan:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.values(PRESET_BUILDING_CONFIGS).map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedBuildingType(preset.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-colors ${
                          selectedBuildingType === preset.id
                            ? 'border-blue-600 bg-white font-bold text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-slate-900">{preset.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{preset.description}</div>
                        <div className="text-[10px] text-blue-600 mt-1 font-medium">
                          Estimasi: ± {formatRupiah(preset.estimatedCostPerM2)} / m²
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {method === 'template' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mt-4">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Pilih Template Master RAB:</h4>
                  {rabTemplates.length === 0 ? (
                    <p className="text-xs text-slate-500">Belum ada template tersimpan.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {rabTemplates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`w-full p-2.5 rounded-lg border text-left text-xs flex items-center justify-between transition-colors ${
                            selectedTemplateId === tpl.id
                              ? 'border-blue-600 bg-white font-bold text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{tpl.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {tpl.category} • {tpl.items?.length || 0} Item Pekerjaan
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              Terverifikasi
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {method === 'ai_estimator' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Pemberitahuan Wajib Asisten AI Estimator
                      </h4>
                      <p className="text-[11px] text-amber-800 leading-relaxed mt-1">
                        1. Hasil estimasi AI merupakan prakiraan awal matematis berbasis parameter input.<br />
                        2. Setiap volume dan harga wajib diverifikasi oleh tenaga ahli Quantity Surveyor di lapangan.<br />
                        3. Asumsi dan tingkat keyakinan (confidence score) akan dicantumkan pada masing-masing item.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-amber-200">
                    <input
                      type="checkbox"
                      checked={aiDisclaimerAccepted}
                      onChange={(e) => setAiDisclaimerAccepted(e.target.checked)}
                      className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      Saya memahami dan menyetujui bahwa hasil AI merupakan estimasi awal yang perlu verifikasi teknis.
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PILIH KATEGORI PEKERJAAN */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Langkah 3 dari 5: Pilih Kategori Pekerjaan RAB
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang kategori yang berlaku untuk proyek ini. Anda juga dapat menambahkan kategori kustom.
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Terpilih: {selectedCategories.length} Kategori
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedCategories([...RAB_CATEGORIES])}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="text-slate-500 hover:underline"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RAB_CATEGORIES.map((cat) => {
                  const isChecked = selectedCategories.includes(cat);
                  return (
                    <label
                      key={cat}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-900'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCategory(cat)}
                          className="rounded-sm text-blue-600 focus:ring-blue-500"
                        />
                        <span>{cat}</span>
                      </div>
                    </label>
                  );
                })}

                {/* Custom Categories */}
                {customCategories.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-xs font-semibold text-indigo-900"
                  >
                    <span>{c.name} (Kustom)</span>
                    <button
                      onClick={() => {
                        setCustomCategories(customCategories.filter((x) => x.id !== c.id));
                        setSelectedCategories(selectedCategories.filter((x) => x !== (c.name as any)));
                      }}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Category Input */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomCatName}
                  onChange={(e) => setNewCustomCatName(e.target.value)}
                  placeholder="Tambah Kategori Kustom Baru..."
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATE ITEM & PREVIEW TABEL */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Langkah 4 dari 5: Pratinjau Item RAB Ter-Generate ({draftItems.length} Item)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tinjau, edit volume/harga, atau buang item sebelum diterapkan secara resmi ke proyek.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAllItems}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
                  >
                    {selectedItemIds.size === draftItems.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>
                </div>
              </div>

              {draftItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500">
                    Tidak ada item yang dihasilkan dari kombinasi metode dan kategori terpilih.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 w-8 text-center">Pilih</th>
                          <th className="p-2 w-16">Kode</th>
                          <th className="p-2">Uraian Pekerjaan</th>
                          <th className="p-2 w-28">Kategori</th>
                          <th className="p-2 w-20 text-right">Volume</th>
                          <th className="p-2 w-16 text-center">Satuan</th>
                          <th className="p-2 w-28 text-right">Harga Satuan</th>
                          <th className="p-2 w-28 text-right">Total</th>
                          <th className="p-2 w-10 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {draftItems.map((item) => {
                          const isSelected = selectedItemIds.has(item.id);
                          return (
                            <tr
                              key={item.id}
                              className={`hover:bg-slate-50/80 ${
                                !isSelected ? 'opacity-40 bg-slate-50' : ''
                              }`}
                            >
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="rounded-sm text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="p-2 font-mono font-semibold text-slate-800">
                                <input
                                  type="text"
                                  value={item.code}
                                  onChange={(e) => updateDraftItem(item.id, 'code', e.target.value)}
                                  className="w-14 px-1 py-0.5 border border-slate-200 rounded-sm text-[11px]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => updateDraftItem(item.id, 'name', e.target.value)}
                                  className="w-full px-1.5 py-0.5 border border-slate-200 rounded-sm text-xs font-medium"
                                />
                                {item.warnings && item.warnings.length > 0 && (
                                  <div className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{item.warnings[0]}</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-2 text-slate-600 text-[11px] truncate max-w-[120px]">
                                {item.category}
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.volume}
                                  onChange={(e) => updateDraftItem(item.id, 'volume', e.target.value)}
                                  className="w-16 px-1 py-0.5 border border-slate-200 rounded-sm text-right text-xs"
                                />
                              </td>
                              <td className="p-2 text-center text-slate-600 text-[11px]">
                                {item.unit}
                              </td>
                              <td className="p-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.unitPrice}
                                  onChange={(e) => updateDraftItem(item.id, 'unitPrice', e.target.value)}
                                  className="w-24 px-1 py-0.5 border border-slate-200 rounded-sm text-right text-xs font-semibold"
                                />
                              </td>
                              <td className="p-2 text-right font-bold text-slate-900">
                                {formatRupiah(item.totalCost)}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => deleteDraftItem(item.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW DAN KONFIRMASI */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  Langkah 5 dari 5: Rekapitulasi Akhir & Konfirmasi Penerapan
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periksa ringkasan matematis, perbandingan terhadap target anggaran, dan konfirmasi penyimpanan ke database proyek.
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Total Item & Kategori</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {summary.itemCount} Item ({summary.categoryCount} Kategori)
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Biaya Langsung (Direct Cost)</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {formatRupiah(summary.directCost)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold">Overhead + Profit ({projectData.overheadPercent + projectData.profitPercent}%)</span>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    {formatRupiah(summary.overheadCost + summary.profitCost)}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-[11px] text-blue-700 font-bold">Grand Total (Inc. PPN)</span>
                  <div className="text-sm font-black text-blue-950 mt-1">
                    {formatRupiah(summary.grandTotal)}
                  </div>
                </div>
              </div>

              {/* Budget Variance Analysis */}
              {summary.targetBudget > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Analisis Plafon Target Anggaran:</span>
                    <span className="font-bold text-slate-900">{formatRupiah(summary.targetBudget)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        summary.budgetUsagePercent > 100
                          ? 'bg-rose-500'
                          : summary.budgetUsagePercent > 90
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, summary.budgetUsagePercent)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      Penggunaan Anggaran: <span className="font-bold text-slate-800">{summary.budgetUsagePercent}%</span>
                    </span>
                    <span
                      className={`font-bold ${
                        summary.budgetVariance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {summary.budgetVariance > 0
                        ? `Over Budget: +${formatRupiah(summary.budgetVariance)}`
                        : `Sisa Anggaran: -${formatRupiah(Math.abs(summary.budgetVariance))}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Consent Checkbox */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userConsentChecked}
                    onChange={(e) => setUserConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950">
                      Konfirmasi Persetujuan Penerapan RAB Resmi
                    </span>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Saya telah meninjau uraian, volume, dan harga satuan di atas. Dengan menekan tombol &quot;Terapkan ke Proyek&quot;, sistem akan membuat proyek baru, mencatat snapshot audit trail revision history, dan mengunci transaksi awal secara otomatis.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Batal
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Lanjut ke Langkah {step + 1}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!userConsentChecked || isApplying}
                onClick={handleApplyToProject}
                className={`px-6 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-2 transition-colors shadow-xs ${
                  userConsentChecked && !isApplying
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-400 cursor-not-allowed'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isApplying ? 'Menerapkan Data...' : 'Terapkan ke Proyek'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

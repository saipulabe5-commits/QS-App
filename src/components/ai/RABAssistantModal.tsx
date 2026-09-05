import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  aiService,
  AIChatMessage,
  AIMissingItemResult,
  AIAuditResult,
  AIVolumeResult,
  AICostSavingResult,
  AIExecutiveSummaryResult,
  AICostEscalationResult,
  ExtractedRABItem,
} from '../../services/aiService';
import { calculateRAB } from '../../utils/calculations';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { ReviewApprovalModal, ProposedRABItem, ProposedPriceAdjustment } from './ReviewApprovalModal';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Calculator,
  DollarSign,
  FileText,
  Wand2,
  Lightbulb,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Check,
  Copy,
  TrendingUp,
  Clock,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RABAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'chat' | 'missing' | 'audit' | 'volume' | 'savings' | 'summary' | 'estimate' | 'escalation';
}

export const RABAssistantModal: React.FC<RABAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'chat',
}) => {
  const { selectedProject, projectRABItems, addRABItem, updateRABItem, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<
    'chat' | 'missing' | 'audit' | 'volume' | 'savings' | 'summary' | 'estimate' | 'escalation'
  >(initialTab);

  // Synchronize initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Calculations for current project
  const calc = calculateRAB(
    projectRABItems,
    selectedProject?.overheadPercent || 5,
    selectedProject?.profitPercent || 10,
    selectedProject?.taxPercent || 11
  );

  // 1. Chat State
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Halo! Saya adalah **AI Asisten Quantity Surveyor (QS)** Anda. 

Saya siap membantu Anda dalam:
- 🏗️ **Menyusun uraian pekerjaan (WBS)** berdasarkan jenis proyek
- 🔍 **Mendeteksi pos pekerjaan yang terlewat (missing items)**
- 📏 **Menyarankan satuan pekerjaan** standar SNI & PUPR
- 📐 **Menghitung volume pekerjaan** dengan rumus transparan
- ⚠️ **Mendeteksi anomali harga satuan**
- 📊 **Membuat ringkasan eksekutif RAB**
- 🧩 **Menjelaskan komponen biaya (AHSP)**
- 💡 **Rekomendasi penghematan biaya (Value Engineering)**

*Catatan: Semua saran AI tidak akan mengubah dokumen RAB Anda tanpa persetujuan Anda terlebih dahulu.*`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 2. Missing Items State
  const [missingResult, setMissingResult] = useState<AIMissingItemResult | null>(null);
  const [isMissingLoading, setIsMissingLoading] = useState(false);

  // 3. Price Audit State
  const [auditResult, setAuditResult] = useState<AIAuditResult | null>(null);
  const [isAuditLoading, setIsAuditLoading] = useState(false);

  // 4. Volume Calculator State
  const [volumeQuery, setVolumeQuery] = useState(
    'Dinding keliling bangunan ukuran 8 x 12 meter dengan tinggi dinding 3.5 meter, memiliki 2 pintu ukuran 0.9 x 2.1 m dan 4 jendela ukuran 0.8 x 1.2 m.'
  );
  const [volumeWorkType, setVolumeWorkType] = useState('Pekerjaan Pasangan Dinding Bata Ringan');
  const [volumeResult, setVolumeResult] = useState<AIVolumeResult | null>(null);
  const [isVolumeLoading, setIsVolumeLoading] = useState(false);

  // 5. Cost Savings State
  const [costSavingsResult, setCostSavingsResult] = useState<AICostSavingResult | null>(null);
  const [isSavingsLoading, setIsSavingsLoading] = useState(false);

  // 6. Summary State
  const [summaryResult, setSummaryResult] = useState<AIExecutiveSummaryResult | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // 7. Full Estimator State
  const [estimatePrompt, setEstimatePrompt] = useState(
    'Pembangunan Rumah Tinggal 2 Lantai Luas Bangunan 120 m² dengan struktur beton bertulang, dinding bata ringan, lantai granit 60x60, atap baja ringan genteng keramik, dan instalasi listrik lengkap.'
  );
  const [estimateArea, setEstimateArea] = useState<string>('120');
  const [estimateBudget, setEstimateBudget] = useState<string>('350000000');
  const [suggestedEstimateItems, setSuggestedEstimateItems] = useState<ProposedRABItem[]>([]);
  const [isEstimateLoading, setIsEstimateLoading] = useState(false);

  // 8. Predictive Cost Escalation State (Fitur 2)
  const [escalationMonths, setEscalationMonths] = useState<number>(6);
  const [escalationResult, setEscalationResult] = useState<AICostEscalationResult | null>(null);
  const [isEscalationLoading, setIsEscalationLoading] = useState(false);

  // Review & Approval Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalProps, setReviewModalProps] = useState<{
    title: string;
    description: string;
    mode: 'add_items' | 'adjust_prices';
    proposedItems?: ProposedRABItem[];
    proposedPriceAdjustments?: ProposedPriceAdjustment[];
  }>({
    title: 'Tinjau & Setujui Rekomendasi AI',
    description: 'Pilih dan setujui item yang akan diterapkan ke RAB.',
    mode: 'add_items',
  });

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Handler: Send Chat
  const handleSendChat = async (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || isChatLoading) return;

    const userMsg: AIChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await aiService.sendChatMessage(text, selectedProject, projectRABItems);
      const aiMsg: AIChatMessage = {
        id: 'ai_' + Date.now(),
        sender: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        suggestedActionType: response.suggestedActionType,
        suggestedItems: response.suggestedItems,
        priceAdjustments: response.priceAdjustments,
        volumeResult: response.volumeResult,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      showToast('Error', 'Gagal memproses pesan asisten.', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Handler: Scan Missing Items
  const handleScanMissing = async () => {
    setIsMissingLoading(true);
    try {
      const res = await aiService.scanMissingItems(selectedProject, projectRABItems);
      setMissingResult(res);
    } catch {
      showToast('Error', 'Gagal memeriksa pos pekerjaan terlewat.', 'error');
    } finally {
      setIsMissingLoading(false);
    }
  };

  // Handler: Price Audit
  const handleAuditPrices = async () => {
    if (projectRABItems.length === 0) {
      showToast('RAB Kosong', 'Tambahkan minimal satu pos pekerjaan untuk diaudit.', 'warning');
      return;
    }
    setIsAuditLoading(true);
    try {
      const res = await aiService.auditPrices(selectedProject, projectRABItems);
      setAuditResult(res);
    } catch {
      showToast('Error', 'Gagal melakukan audit harga.', 'error');
    } finally {
      setIsAuditLoading(false);
    }
  };

  // Handler: Calculate Volume
  const handleCalculateVolume = async () => {
    if (!volumeQuery.trim()) return;
    setIsVolumeLoading(true);
    try {
      const res = await aiService.calculateVolume(volumeQuery, volumeWorkType);
      setVolumeResult(res);
    } catch {
      showToast('Error', 'Gagal menghitung volume.', 'error');
    } finally {
      setIsVolumeLoading(false);
    }
  };

  // Handler: Cost Savings
  const handleAnalyzeSavings = async () => {
    setIsSavingsLoading(true);
    try {
      const res = await aiService.analyzeCostSavings(selectedProject, projectRABItems, calc.grandTotal);
      setCostSavingsResult(res);
    } catch {
      showToast('Error', 'Gagal menganalisis penghematan.', 'error');
    } finally {
      setIsSavingsLoading(false);
    }
  };

  // Handler: Executive Summary
  const handleGenerateSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const res = await aiService.generateExecutiveSummary(selectedProject, projectRABItems, calc);
      setSummaryResult(res);
    } catch {
      showToast('Error', 'Gagal membuat ringkasan eksekutif.', 'error');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Handler: Full Estimate
  const handleGenerateEstimate = async () => {
    if (!estimatePrompt.trim()) return;
    setIsEstimateLoading(true);
    try {
      const res = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: estimatePrompt,
          buildingArea: Number(estimateArea) || 100,
          budgetTarget: Number(estimateBudget) || 300000000,
          projectName: selectedProject?.name || 'Proyek Baru',
        }),
      });
      if (!res.ok) throw new Error('Gagal menghubungi server');
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        setSuggestedEstimateItems(data.items);
      }
    } catch {
      // Fallback items
      const area = Number(estimateArea) || 100;
      setSuggestedEstimateItems([
        {
          code: 'A.1.1',
          name: 'Pembersihan dan Perataan Lahan Lapangan',
          category: 'Pekerjaan Persiapan',
          unit: 'm²',
          volume: area * 1.2,
          unitPrice: 18000,
          notes: 'Standar SNI',
        },
        {
          code: 'A.2.1',
          name: 'Galian Tanah Pondasi Footplat & Batu Kali',
          category: 'Pekerjaan Tanah',
          unit: 'm³',
          volume: area * 0.35,
          unitPrice: 95000,
          notes: 'Kedalaman 1.2m',
        },
        {
          code: 'A.4.1',
          name: 'Cor Beton Bertulang Kolom & Balok K-250',
          category: 'Pekerjaan Struktur',
          unit: 'm³',
          volume: area * 0.28,
          unitPrice: 4750000,
          notes: 'Termasuk pembesian & bekisting',
        },
        {
          code: 'A.5.1',
          name: 'Pasangan Dinding Bata Ringan Hebel t=10cm',
          category: 'Pekerjaan Dinding',
          unit: 'm²',
          volume: area * 2.8,
          unitPrice: 145000,
          notes: 'Mortar instan',
        },
        {
          code: 'A.6.1',
          name: 'Pemasangan Lantai Granit Tile 60x60 Polished',
          category: 'Pekerjaan Lantai',
          unit: 'm²',
          volume: area * 0.95,
          unitPrice: 245000,
          notes: 'Granit homogen premium',
        },
        {
          code: 'A.7.1',
          name: 'Rangka Atap Baja Ringan Canal C.75 & Genteng Keramik',
          category: 'Pekerjaan Atap',
          unit: 'm²',
          volume: area * 0.65,
          unitPrice: 320000,
          notes: 'Baja ringan zinc-alum',
        },
        {
          code: 'A.10.1',
          name: 'Instalasi Titik Lampu & Stop Kontak NYM 3x2.5mm',
          category: 'Instalasi Listrik',
          unit: 'titik',
          volume: Math.round(area * 0.28),
          unitPrice: 275000,
          notes: 'Kabel SNI Supreme/Eterna',
        },
      ]);
    } finally {
      setIsEstimateLoading(false);
    }
  };

  // Handler: Predictive Cost Escalation (Fitur 2)
  const handlePredictEscalation = async () => {
    if (projectRABItems.length === 0) {
      showToast('RAB Kosong', 'Tambahkan minimal satu pos pekerjaan untuk memprediksi eskalasi biaya.', 'warning');
      return;
    }
    setIsEscalationLoading(true);
    try {
      const res = await aiService.predictCostEscalation(selectedProject, projectRABItems, escalationMonths);
      setEscalationResult(res);
      showToast('Analisis Selesai', `Prediksi eskalasi biaya ${res.forecastPeriod} berhasil diperbarui.`, 'success');
    } catch {
      showToast('Error', 'Gagal memproses prediksi eskalasi biaya.', 'error');
    } finally {
      setIsEscalationLoading(false);
    }
  };

  // Trigger Review Modal for Missing Items
  const handleOpenReviewMissing = () => {
    if (!missingResult || missingResult.missingItems.length === 0) return;
    setReviewModalProps({
      title: 'Tinjau & Setujui Pos Pekerjaan Terlewat',
      description: 'Pilih pos pekerjaan yang ingin ditambahkan ke RAB proyek Anda.',
      mode: 'add_items',
      proposedItems: missingResult.missingItems.map((item) => ({
        ...item,
        selected: true,
      })),
    });
    setReviewModalOpen(true);
  };

  // Trigger Review Modal for Price Adjustments
  const handleOpenReviewPrices = () => {
    if (!auditResult) return;
    const anomalies = auditResult.auditedItems.filter((i) => i.status !== 'Wajar');
    if (anomalies.length === 0) {
      showToast('Semua Harga Wajar', 'Tidak ada anomali harga yang perlu disesuaikan.', 'info');
      return;
    }
    setReviewModalProps({
      title: 'Tinjau & Setujui Penyesuaian Harga Satuan',
      description: 'Periksa perubahan harga satuan sesuai standar acuan pasar sebelum diterapkan.',
      mode: 'adjust_prices',
      proposedPriceAdjustments: anomalies.map((item) => ({
        itemId: item.itemId,
        itemName: item.name,
        currentPrice: item.currentPrice,
        suggestedPrice: item.recommendedPrice,
        reason: `${item.status}: ${item.note}`,
        selected: true,
      })),
    });
    setReviewModalOpen(true);
  };

  // Trigger Review Modal for Full Estimate
  const handleOpenReviewEstimate = () => {
    if (suggestedEstimateItems.length === 0) return;
    setReviewModalProps({
      title: 'Tinjau & Setujui Estimasi RAB Lengkap',
      description: 'Periksa seluruh item estimasi sebelum dimasukkan ke dokumen RAB Anda.',
      mode: 'add_items',
      proposedItems: suggestedEstimateItems.map((item) => ({ ...item, selected: true })),
    });
    setReviewModalOpen(true);
  };

  // Quick Prompt Chips
  const promptChips = [
    'Saran satuan standar SNI untuk pekerjaan sipil',
    'Cek pekerjaan yang belum dimasukkan di proyek ini',
    'Jelaskan analisa komponen biaya AHSP plesteran dinding',
    'Rekomendasi penghematan biaya tanpa menurunkan kualitas',
    'Bagaimana cara menghitung volume pondasi batu kali?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs"
      />

      {/* Main Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative bg-[var(--bg-elevated)] w-full max-w-5xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden z-10 my-4 flex flex-col max-h-[92vh]"
      >
        {/* Header (Solid Navy Blue, NO Gradient) */}
        <div className="px-6 py-4 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-tight">AI Assistant & Quantity Surveyor</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-blue-950 text-blue-300 border border-blue-800">
                  RAB PRO
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Asisten Cerdas Estimasi Biaya & Konsultan Teknik Sipil Indonesia
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

        {/* Navigation Tabs */}
        <div className="bg-[var(--bg-elevated-hover)] px-4 py-2 flex items-center space-x-1 overflow-x-auto custom-scrollbar flex-shrink-0 border-b border-[var(--border-primary)]">
          {[
            { id: 'chat', label: 'Tanya AI QS', icon: Sparkles },
            { id: 'escalation', label: 'Eskalasi Biaya', icon: TrendingUp },
            { id: 'missing', label: 'Deteksi Item Terlewat', icon: FileSearch },
            { id: 'audit', label: 'Audit Anomali Harga', icon: AlertTriangle },
            { id: 'volume', label: 'Kalkulator Volume AI', icon: Calculator },
            { id: 'savings', label: 'Rekomendasi Hemat', icon: Lightbulb },
            { id: 'summary', label: 'Ringkasan Eksekutif', icon: FileText },
            { id: 'estimate', label: 'Auto-RAB Generator', icon: Wand2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[var(--bg-elevated-hover)]">
          {/* TAB 1: INTERACTIVE CHAT */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px] bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-2xs">
              {/* Messages viewport */}
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                          : 'bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] rounded-bl-xs border border-[var(--border-primary)]'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Actionable Card for Suggested Items */}
                      {msg.suggestedItems && msg.suggestedItems.length > 0 && (
                        <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-[11px] text-blue-900">
                              📋 Rekomendasi {msg.suggestedItems.length} Pos Pekerjaan:
                            </span>
                          </div>
                          <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar text-[11px]">
                            {msg.suggestedItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between border-b border-slate-100 py-1">
                                <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                                  {item.name}
                                </span>
                                <span className="font-mono text-[var(--text-primary)] font-bold">
                                  {item.volume} {item.unit} @ {formatRupiah(item.unitPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewModalProps({
                                title: 'Tinjau & Setujui Rekomendasi Chat AI',
                                description: 'Pilih item pekerjaan dari hasil saran AI sebelum diterapkan ke RAB.',
                                mode: 'add_items',
                                proposedItems: msg.suggestedItems!.map((it) => ({ ...it, selected: true })),
                              });
                              setReviewModalOpen(true);
                            }}
                            className="mt-2.5 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Tinjau & Terapkan ke Dokumen RAB</span>
                          </button>
                        </div>
                      )}

                      {/* Actionable Card for Price Adjustments */}
                      {msg.priceAdjustments && msg.priceAdjustments.length > 0 && (
                        <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] shadow-2xs">
                          <span className="font-bold text-[11px] text-blue-900 block mb-2">
                            ⚠️ Saran Penyesuaian {msg.priceAdjustments.length} Harga Satuan:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewModalProps({
                                title: 'Tinjau & Setujui Penyesuaian Harga',
                                description: 'Periksa perubahan harga satuan yang disarankan AI.',
                                mode: 'adjust_prices',
                                proposedPriceAdjustments: msg.priceAdjustments!.map((adj) => ({
                                  ...adj,
                                  selected: true,
                                })),
                              });
                              setReviewModalOpen(true);
                            }}
                            className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Tinjau & Terapkan Penyesuaian Harga</span>
                          </button>
                        </div>
                      )}

                      {/* Actionable Card for Volume Solver */}
                      {msg.volumeResult && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-900 shadow-2xs">
                          <span className="font-bold text-[11px] block">📐 Hasil Perhitungan Volume:</span>
                          <div className="font-mono text-base font-black mt-0.5 text-blue-900">
                            {msg.volumeResult.calculatedVolume} {msg.volumeResult.unit}
                          </div>
                          <p className="text-[10px] text-blue-700 mt-1">Rumus: {msg.volumeResult.formula}</p>
                          <button
                            type="button"
                            onClick={() => {
                              if (!selectedProject) return;
                              addRABItem({
                                projectId: selectedProject.id,
                                code: 'VOL-AI',
                                name: msg.volumeResult!.workName || 'Pekerjaan Hasil Hitung AI',
                                category: 'Pekerjaan Struktur',
                                unit: msg.volumeResult!.unit,
                                volume: msg.volumeResult!.calculatedVolume,
                                unitPrice: 0,
                                notes: `Rumus: ${msg.volumeResult!.formula}`,
                              });
                              showToast('Volume Dimasukkan', 'Pos pekerjaan berhasil ditambahkan ke RAB.', 'success');
                            }}
                            className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg"
                          >
                            + Masukkan Pos Pekerjaan ke RAB
                          </button>
                        </div>
                      )}

                      <span
                        className={`text-[9px] block text-right mt-1.5 ${
                          msg.sender === 'user' ? 'text-blue-100' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--bg-elevated-hover)] rounded-2xl rounded-bl-xs p-3.5 text-xs flex items-center space-x-2 text-[var(--text-secondary)] border border-[var(--border-primary)]">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>AI QS sedang menganalisis database & standar SNI...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
                {promptChips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendChat(chip)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-[var(--text-secondary)] border border-[var(--border-primary)] whitespace-nowrap transition-colors flex-shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border-primary)] flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Ketik pertanyaan teknis, minta saran satuan, atau instruksi QS..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChat();
                  }}
                  className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-1 focus:ring-blue-600 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendChat()}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MISSING ITEMS SCANNER */}
          {activeTab === 'missing' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Pemeriksaan Pos Pekerjaan Terlewat (Missing Items)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    AI membandingkan {projectRABItems.length} pos pekerjaan saat ini dengan tahapan konstruksi SNI lengkap.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleScanMissing}
                  disabled={isMissingLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 transition-colors flex-shrink-0"
                >
                  {isMissingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memindai Dokumen...</span>
                    </>
                  ) : (
                    <>
                      <FileSearch className="w-4 h-4" />
                      <span>Pindai Kelengkapan RAB</span>
                    </>
                  )}
                </button>
              </div>

              {missingResult && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">Hasil Pemindaian AI</span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{missingResult.summary}</p>
                    </div>
                    {missingResult.missingItems.length > 0 && (
                      <button
                        type="button"
                        onClick={handleOpenReviewMissing}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Tinjau & Masukkan ke RAB</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {missingResult.missingItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-mono text-[10px] font-bold rounded-sm">
                              {item.code}
                            </span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">{item.name}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">({item.category})</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] italic">💡 {item.reason}</p>
                        </div>

                        <div className="text-right sm:flex-shrink-0">
                          <div className="text-xs font-mono font-bold text-[var(--text-primary)]">
                            Vol: {item.volume} {item.unit} @ {formatRupiah(item.unitPrice)}
                          </div>
                          <div className="text-[11px] font-mono text-blue-700 font-semibold">
                            Total: {formatRupiah(item.volume * item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PRICE AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Audit Anomali & Kesesuaian Harga Satuan</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Membandingkan harga satuan tiap item terhadap acuan harga pasar dan AHSP PUPR 2024-2026.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAuditPrices}
                  disabled={isAuditLoading || projectRABItems.length === 0}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 transition-colors flex-shrink-0"
                >
                  {isAuditLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengaudit...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Mulai Audit Harga Satuan</span>
                    </>
                  )}
                </button>
              </div>

              {auditResult && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] flex flex-col items-center justify-center font-mono">
                        <span className="text-[10px] text-[var(--text-secondary)] font-sans">SKOR</span>
                        <span className="text-base font-bold text-blue-400">{auditResult.overallScore}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">Status Kelayakan:</span>
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              auditResult.overallVerdict === 'Wajar'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {auditResult.overallVerdict}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{auditResult.summary}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenReviewPrices}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Tinjau Penyesuaian Harga</span>
                    </button>
                  </div>

                  {/* Audited items table */}
                  <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                      <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Item Pekerjaan</th>
                          <th className="px-2 py-2 text-center">Status</th>
                          <th className="px-3 py-2 text-right">Harga Saat Ini</th>
                          <th className="px-3 py-2 text-right">Rentang Pasar (Rp)</th>
                          <th className="px-3 py-2 text-right">Rekomendasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditResult.auditedItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-elevated-hover)]">
                            <td className="px-3 py-2">
                              <div className="font-medium text-[var(--text-primary)]">{item.name}</div>
                              <div className="text-[10px] text-[var(--text-secondary)]">{item.note}</div>
                            </td>
                            <td className="px-2 py-2 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                                  item.status === 'Wajar'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : item.status === 'Terlalu Rendah'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-medium">
                              {formatRupiah(item.currentPrice)} / {item.unit}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {formatRupiah(item.marketMin)} - {formatRupiah(item.marketMax)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-blue-700">
                              {formatRupiah(item.recommendedPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI VOLUME CALCULATOR */}
          {activeTab === 'volume' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Kalkulator Volume Berbantu AI (Natural Language Geometry Solver)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tuliskan dimensi atau gambar denah dalam bahasa bebas. AI akan menerapkan rumus geometris sipil, menghitung potongan opening, dan menyajikan rumus step-by-step.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Nama Pos Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={volumeWorkType}
                    onChange={(e) => setVolumeWorkType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Deskripsi Dimensi & Rincian Lapangan
                  </label>
                  <textarea
                    rows={3}
                    value={volumeQuery}
                    onChange={(e) => setVolumeQuery(e.target.value)}
                    placeholder="Contoh: Sloof beton 15x20cm panjang total 54 meter dengan pembesian 4D12 dan sengkang D8 jarak 15cm..."
                    className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-1 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCalculateVolume}
                  disabled={isVolumeLoading || !volumeQuery.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center space-x-2 transition-colors"
                >
                  {isVolumeLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghitung Geometri & Rumus SNI...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span>Hitung Volume Pekerjaan dengan AI</span>
                    </>
                  )}
                </button>
              </div>

              {volumeResult && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">
                        Hasil Perhitungan Volume
                      </span>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{volumeResult.workName}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-blue-900">
                        {volumeResult.volume} {volumeResult.unit}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">Langkah Perhitungan Rumus:</span>
                    <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
                      {volumeResult.stepByStep.map((step, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <strong>Rumus Digunakan:</strong> {volumeResult.formulaUsed}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedProject) return;
                      addRABItem({
                        projectId: selectedProject.id,
                        code: 'VOL-01',
                        name: volumeResult.workName,
                        category: 'Pekerjaan Struktur',
                        unit: volumeResult.unit,
                        volume: volumeResult.volume,
                        unitPrice: 0,
                        notes: `Dihitung oleh AI: ${volumeResult.formulaUsed}`,
                      });
                      showToast('Volume Ditambahkan', `Pos ${volumeResult.workName} dimasukkan ke RAB.`, 'success');
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terapkan Volume ini Sebagai Item Baru di RAB</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COST SAVINGS / VALUE ENGINEERING */}
          {activeTab === 'savings' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Rekomendasi Penghematan Biaya & Value Engineering
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    AI menganalisis peluang efisiensi material, fabrikasi, dan metode kerja tanpa mengurangi mutu struktur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeSavings}
                  disabled={isSavingsLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 transition-colors flex-shrink-0"
                >
                  {isSavingsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Efisiensi...</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-4 h-4" />
                      <span>Analisis Penghematan</span>
                    </>
                  )}
                </button>
              </div>

              {costSavingsResult && (
                <div className="space-y-3">
                  <div className="bg-emerald-900 text-white p-4 rounded-xl border border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-300">
                        Potensi Total Penghematan Anggaran
                      </span>
                      <div className="text-xl font-black font-mono mt-0.5">
                        {formatRupiah(costSavingsResult.totalPotentialSavings)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-800 text-emerald-100 rounded-full font-bold text-xs">
                        Hemat ± {costSavingsResult.savingsPercentage}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {costSavingsResult.strategies.map((strat, idx) => (
                      <div key={idx} className="bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-[var(--text-primary)]">{strat.title}</h5>
                          <span className="text-xs font-mono font-bold text-emerald-700">
                            Potensi: {formatRupiah(strat.estimatedSaving)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{strat.description}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-2 border-t border-slate-100 gap-2">
                          <span className="text-slate-500 dark:text-slate-400">
                            <strong>Dampak Mutu:</strong> {strat.impactOnQuality}
                          </span>
                          <span className="text-blue-700 font-semibold">
                            💡 {strat.actionRecommendation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EXECUTIVE SUMMARY */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">
                    Ringkasan Eksekutif & Struktur Pembiayaan Proyek
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Menyusun narasi laporan formal, analisis Pareto biaya dominan, dan mitigasi risiko finansial.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isSummaryLoading}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 transition-colors flex-shrink-0"
                >
                  {isSummaryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyusun Narasi Eksekutif...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Buat Ringkasan Eksekutif</span>
                    </>
                  )}
                </button>
              </div>

              {summaryResult && (
                <div className="bg-[var(--bg-elevated)] p-6 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-4 text-xs">
                  <div className="prose max-w-none text-[var(--text-primary)] leading-relaxed bg-[var(--bg-elevated-hover)] p-4 rounded-xl border border-[var(--border-primary)]">
                    <p>{summaryResult.executiveNarrative}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-[var(--text-primary)] text-xs block">
                      📌 Pemicu Biaya Utama (Top Cost Drivers / Pareto 80/20):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {summaryResult.topCostDrivers.map((driver, idx) => (
                        <div key={idx} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-900">{driver.category}</span>
                            <span className="font-mono font-black text-blue-700">{driver.percentage}%</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">{driver.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-1">
                    <span className="font-bold text-[var(--text-primary)] block">💳 Saran Alur Kas & Termin Pembayaran:</span>
                    <p className="text-[var(--text-secondary)]">{summaryResult.cashflowAdvice}</p>
                  </div>

                  {summaryResult.riskHighlights.length > 0 && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                      <span className="font-bold text-amber-900 block">⚠️ Sorotan Risiko Anggaran:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                        {summaryResult.riskHighlights.map((risk, idx) => (
                          <li key={idx}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: AUTO-RAB GENERATOR */}
          {activeTab === 'estimate' && (
            <div className="space-y-4">
              <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-3">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Generator RAB Otomatis Berdasarkan Spesifikasi Proyek
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI menyusun daftar uraian pekerjaan lengkap mulai dari persiapan, struktur, dinding, finishing hingga instalasi ME.
                </p>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--text-primary)]">
                    Spesifikasi & Deskripsi Proyek
                  </label>
                  <textarea
                    rows={3}
                    value={estimatePrompt}
                    onChange={(e) => setEstimatePrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Luas Bangunan (m²)
                    </label>
                    <input
                      type="number"
                      value={estimateArea}
                      onChange={(e) => setEstimateArea(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                      Target Pagu Anggaran (Rp)
                    </label>
                    <input
                      type="number"
                      value={estimateBudget}
                      onChange={(e) => setEstimateBudget(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateEstimate}
                  disabled={isEstimateLoading || !estimatePrompt.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center space-x-2 transition-colors"
                >
                  {isEstimateLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyusun Rencana Anggaran Biaya...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Seluruh Pos Pekerjaan RAB</span>
                    </>
                  )}
                </button>
              </div>

              {suggestedEstimateItems.length > 0 && (
                <div className="bg-[var(--bg-elevated)] p-5 rounded-xl border border-[var(--border-primary)] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        Hasil Generasi ({suggestedEstimateItems.length} Item Pos Pekerjaan)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenReviewEstimate}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Tinjau & Terapkan ke RAB Proyek</span>
                    </button>
                  </div>

                  <div className="border border-[var(--border-primary)] rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                      <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Kode</th>
                          <th className="px-3 py-2">Uraian Pekerjaan</th>
                          <th className="px-2 py-2 text-center">Sat</th>
                          <th className="px-3 py-2 text-right">Volume</th>
                          <th className="px-3 py-2 text-right">Harga (Rp)</th>
                          <th className="px-3 py-2 text-right">Subtotal (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {suggestedEstimateItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[var(--bg-elevated-hover)]">
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.code}</td>
                            <td className="px-3 py-2 font-medium text-[var(--text-primary)]">
                              <div>{item.name}</div>
                              <div className="text-[10px] text-blue-600">{item.category}</div>
                            </td>
                            <td className="px-2 py-2 text-center">{item.unit}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatNumber(item.volume, 2)}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-[var(--text-primary)]">
                              {formatRupiah(item.volume * item.unitPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: AI PREDICTIVE COST ESCALATION (FITUR 2) */}
          {activeTab === 'escalation' && (
            <div className="space-y-4">
              {/* Header & Controls Box */}
              <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center space-x-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span>AI Predictive Cost Escalation & Inflasi Material</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Prediksi pergerakan harga material, fluktuasi kurs, dan penyesuaian upah kerja pasar Indonesia 2025-2026.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1.5 bg-[var(--bg-elevated-hover)] p-1 rounded-xl border border-[var(--border-primary)] text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ml-1.5" />
                      <span className="text-[var(--text-secondary)] font-medium text-[11px]">Periode:</span>
                      {[3, 6, 12].map((months) => (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setEscalationMonths(months)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            escalationMonths === months
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200 dark:bg-slate-700'
                          }`}
                        >
                          {months} Bln
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={isEscalationLoading || projectRABItems.length === 0}
                      onClick={handlePredictEscalation}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors shrink-0"
                    >
                      {isEscalationLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Menganalisis Tren Pasar...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Jalankan Prediksi AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Initial / Empty State */}
              {!escalationResult && !isEscalationLoading && (
                <div className="p-8 text-center bg-[var(--bg-elevated)] rounded-xl border border-dashed border-[var(--border-primary)]">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-[var(--text-primary)]">Mulai Analisis Prediktif Eskalasi Biaya</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
                    AI menganalisis seluruh pos pekerjaan dalam RAB Anda terhadap proyeksi inflasi komoditas baja, semen, pasir, kurs valuta asing, dan upah tenaga kerja konstruksi Indonesia.
                  </p>
                  <button
                    type="button"
                    onClick={handlePredictEscalation}
                    disabled={projectRABItems.length === 0}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl inline-flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Prediksi Eskalasi ({escalationMonths} Bulan)</span>
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isEscalationLoading && (
                <div className="p-12 text-center bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                  <h5 className="text-xs font-bold text-[var(--text-primary)]">Menghubungkan ke Engine Ekonometri Konstruksi...</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Mengkalkulasi bobot material, indeks harga produsen semen/baja, dan simulasi dampak penundaan pengadaan.
                  </p>
                </div>
              )}

              {/* Results View */}
              {escalationResult && !isEscalationLoading && (
                <div className="space-y-4">
                  {/* Top KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Estimasi Kenaikan Total</div>
                      <div className="text-xl font-bold text-rose-600 mt-0.5">
                        +{escalationResult.overallEscalationRate.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Periode {escalationResult.forecastPeriod} ({escalationResult.referenceDate})
                      </div>
                    </div>

                    <div className="p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Kondisi Pasar Prediksi</div>
                      <div className="text-sm font-bold text-[var(--text-primary)] mt-1 flex items-center space-x-1.5">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            escalationResult.marketCondition === 'Inflasi Tinggi'
                              ? 'bg-rose-500'
                              : escalationResult.marketCondition === 'Inflasi Moderat'
                              ? 'bg-[var(--traffic-yellow)]'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>{escalationResult.marketCondition}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">Sektor Konstruksi Nasional</div>
                    </div>

                    <div className="p-3.5 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] shadow-2xs">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Total Anggaran Saat Ini</div>
                      <div className="text-sm font-mono font-bold text-[var(--text-primary)] mt-1">
                        {formatRupiah(escalationResult.totalCurrentBudget || calc.grandTotal)}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Baseline RAB Proyek</div>
                    </div>

                    <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 shadow-2xs">
                      <div className="text-[11px] text-rose-700 font-medium">Tambahan Anggaran Diperlukan</div>
                      <div className="text-sm font-mono font-bold text-rose-700 mt-1">
                        +{formatRupiah(escalationResult.additionalBudgetNeeded || 0)}
                      </div>
                      <div className="text-[10px] text-rose-600 mt-0.5">
                        Total Proyeksi: {formatRupiah(escalationResult.totalProjectedBudget || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-[var(--text-primary)] leading-relaxed">
                    <div className="font-bold text-blue-900 mb-1 flex items-center space-x-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ringkasan Analisis Pasar & Ekonometri:</span>
                    </div>
                    {escalationResult.summary}
                  </div>

                  {/* Material Urgency Alerts */}
                  {escalationResult.materialAlerts && escalationResult.materialAlerts.length > 0 && (
                    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] p-4 shadow-2xs">
                      <h5 className="text-xs font-bold text-[var(--text-primary)] mb-3 flex items-center space-x-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Peringatan Pembelian Material Kunci (Material Procurement Alerts)</span>
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {escalationResult.materialAlerts.map((mat, idx) => {
                          const isUrgent = mat.urgency === 'Segera Beli';
                          const isWatch = mat.urgency === 'Pantau';
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border flex flex-col justify-between ${
                                isUrgent
                                  ? 'bg-rose-50/60 border-rose-200'
                                  : isWatch
                                  ? 'bg-amber-50/60 border-amber-200'
                                  : 'bg-[var(--bg-elevated-hover)] border-[var(--border-primary)]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-bold text-xs text-[var(--text-primary)]">{mat.material}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      isUrgent
                                        ? 'bg-rose-600 text-white'
                                        : isWatch
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-600 text-white'
                                    }`}
                                  >
                                    {mat.urgency}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-[var(--text-primary)] mt-0.5 mb-1.5">
                                  {mat.currentTrend} ({mat.projectedChange >= 0 ? `+${mat.projectedChange}%` : `${mat.projectedChange}%`})
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-snug">
                                  {mat.recommendation}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown Table */}
                  {escalationResult.categoryEscalations && escalationResult.categoryEscalations.length > 0 && (
                    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-2xs">
                      <div className="px-4 py-3 bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)] flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-primary)]">
                          Dampak Eskalasi per Divisi Pekerjaan
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {escalationResult.categoryEscalations.length} Kategori Terdampak
                        </span>
                      </div>
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-[var(--text-secondary)]">
                          <thead className="bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] font-semibold text-[10px] uppercase">
                            <tr>
                              <th className="px-3.5 py-2">Kategori Pekerjaan</th>
                              <th className="px-3 py-2 text-right">Biaya Awal (Rp)</th>
                              <th className="px-2.5 py-2 text-center">Eskalasi</th>
                              <th className="px-3 py-2 text-right">Biaya Proyeksi (Rp)</th>
                              <th className="px-3 py-2">Faktor Pemicu (Drivers)</th>
                              <th className="px-2.5 py-2 text-center">Tingkat Risiko</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {escalationResult.categoryEscalations.map((cat, idx) => (
                              <tr key={idx} className="hover:bg-[var(--bg-elevated-hover)]">
                                <td className="px-3.5 py-2.5 font-bold text-[var(--text-primary)]">{cat.category}</td>
                                <td className="px-3 py-2.5 text-right font-mono text-[var(--text-secondary)]">
                                  {formatRupiah(cat.currentCost)}
                                </td>
                                <td className="px-2.5 py-2.5 text-center font-mono font-bold text-rose-600">
                                  +{cat.escalationRate.toFixed(1)}%
                                </td>
                                <td className="px-3 py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                                  {formatRupiah(cat.projectedCost)}
                                </td>
                                <td className="px-3 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                                  {cat.mainDrivers?.join(', ') || '-'}
                                </td>
                                <td className="px-2.5 py-2.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      cat.riskLevel === 'Tinggi'
                                        ? 'bg-rose-100 text-rose-700'
                                        : cat.riskLevel === 'Sedang'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}
                                  >
                                    {cat.riskLevel}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Mitigation Strategies */}
                  {escalationResult.mitigationStrategies && escalationResult.mitigationStrategies.length > 0 && (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <div className="font-bold text-emerald-900 text-xs mb-2 flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Strategi Mitigasi & Pengamanan Anggaran Kontraktor:</span>
                      </div>
                      <ul className="space-y-1 text-xs text-emerald-900">
                        {escalationResult.mitigationStrategies.map((strat, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                            <span>{strat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[var(--bg-elevated)] border-t border-[var(--border-primary)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AI Advisor: Semua data aman dan memerlukan konfirmasi pengguna sebelum diaplikasikan.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </motion.div>

      {/* Review & Approval Modal */}
      <ReviewApprovalModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={reviewModalProps.title}
        description={reviewModalProps.description}
        mode={reviewModalProps.mode}
        proposedItems={reviewModalProps.proposedItems}
        proposedPriceAdjustments={reviewModalProps.proposedPriceAdjustments}
      />
    </div>
  );
};

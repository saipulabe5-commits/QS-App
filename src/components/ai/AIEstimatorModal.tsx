import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RABItem, RABCategory } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { X, Sparkles, Wand2, Plus, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AIEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIEstimatorModal: React.FC<AIEstimatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedProject, addRABItem, showToast } = useApp();

  const [projectPrompt, setProjectPrompt] = useState(
    'Pembangunan Rumah Tinggal 2 Lantai Luas Bangunan 120 m² dengan struktur beton bertulang, dinding bata ringan, lantai granit 60x60, atap baja ringan genteng keramik, dan instalasi listrik lengkap.'
  );
  const [targetBudget, setTargetBudget] = useState<number | string>('350000000');
  const [buildingArea, setBuildingArea] = useState<number | string>('120');

  const [isLoading, setIsLoading] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<
    Array<{
      code: string;
      name: string;
      category: RABCategory;
      unit: string;
      volume: number;
      unitPrice: number;
      totalCost: number;
      notes?: string;
    }>
  >([]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!projectPrompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: projectPrompt,
          buildingArea: Number(buildingArea) || 100,
          targetBudget: Number(targetBudget) || 300000000,
          projectName: selectedProject?.name || 'Proyek Baru',
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server AI');
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setSuggestedItems(data.items);
      }
    } catch (err: any) {
      console.warn('AI API error or fallback to local generator:', err);
      // Smart fallback generation based on SNI rules
      const area = Number(buildingArea) || 100;
      const fallbackItems: any[] = [
        {
          code: 'A.1.1',
          name: 'Pembersihan dan Perataan Lahan Lapangan',
          category: 'Pekerjaan Persiapan',
          unit: 'm²',
          volume: area * 1.2,
          unitPrice: 18000,
          totalCost: area * 1.2 * 18000,
          notes: 'AI Estimator SNI',
        },
        {
          code: 'A.1.2',
          name: 'Pengukuran dan Pemasangan Bouwplank',
          category: 'Pekerjaan Persiapan',
          unit: 'm¹',
          volume: Math.sqrt(area) * 4 + 8,
          unitPrice: 48000,
          totalCost: (Math.sqrt(area) * 4 + 8) * 48000,
          notes: 'AI Estimator SNI',
        },
        {
          code: 'A.2.1',
          name: 'Galian Tanah Pondasi Footplat & Batu Kali',
          category: 'Pekerjaan Tanah',
          unit: 'm³',
          volume: area * 0.35,
          unitPrice: 95000,
          totalCost: area * 0.35 * 95000,
          notes: 'Kedalaman 1.2m',
        },
        {
          code: 'A.3.1',
          name: 'Pasangan Pondasi Batu Kali 1Pc : 5Ps',
          category: 'Pekerjaan Pondasi',
          unit: 'm³',
          volume: area * 0.22,
          unitPrice: 920000,
          totalCost: area * 0.22 * 920000,
          notes: 'Batu belah SNI',
        },
        {
          code: 'A.4.1',
          name: 'Cor Beton Bertulang Kolom & Balok K-250',
          category: 'Pekerjaan Struktur',
          unit: 'm³',
          volume: area * 0.28,
          unitPrice: 4750000,
          totalCost: area * 0.28 * 4750000,
          notes: 'Termasuk pembesian & bekisting',
        },
        {
          code: 'A.5.1',
          name: 'Pasangan Dinding Bata Ringan Hebel t=10cm',
          category: 'Pekerjaan Dinding',
          unit: 'm²',
          volume: area * 2.8,
          unitPrice: 145000,
          totalCost: area * 2.8 * 145000,
          notes: 'Perekat mortar instan',
        },
        {
          code: 'A.5.2',
          name: 'Plesteran + Acian Dinding 1Pc : 4Ps',
          category: 'Pekerjaan Dinding',
          unit: 'm²',
          volume: area * 5.4,
          unitPrice: 78000,
          totalCost: area * 5.4 * 78000,
          notes: 'Dua sisi dinding',
        },
        {
          code: 'A.6.1',
          name: 'Pemasangan Lantai Granit Tile 60x60 Polished',
          category: 'Pekerjaan Lantai',
          unit: 'm²',
          volume: area * 0.95,
          unitPrice: 245000,
          totalCost: area * 0.95 * 245000,
          notes: 'Granit homogen premium',
        },
        {
          code: 'A.7.1',
          name: 'Rangka Atap Baja Ringan Canal C.75 & Genteng Keramik',
          category: 'Pekerjaan Atap',
          unit: 'm²',
          volume: area * 0.65,
          unitPrice: 320000,
          totalCost: area * 0.65 * 320000,
          notes: 'Baja ringan zinc-alum',
        },
        {
          code: 'A.8.1',
          name: 'Plafon Gypsum Board 9mm + Rangka Hollow Galvanis',
          category: 'Pekerjaan Plafon',
          unit: 'm²',
          volume: area * 0.9,
          unitPrice: 125000,
          totalCost: area * 0.9 * 125000,
          notes: 'Kompon & cat dasar',
        },
        {
          code: 'A.10.1',
          name: 'Instalasi Titik Lampu & Stop Kontak NYM 3x2.5mm',
          category: 'Instalasi Listrik',
          unit: 'titik',
          volume: Math.round(area * 0.28),
          unitPrice: 275000,
          totalCost: Math.round(area * 0.28) * 275000,
          notes: 'Kabel Supreme / Eterna',
        },
        {
          code: 'A.12.1',
          name: 'Pengecatan Dinding Interior & Eksterior Weatherproof',
          category: 'Pekerjaan Pengecatan',
          unit: 'm²',
          volume: area * 5.4,
          unitPrice: 42000,
          totalCost: area * 5.4 * 42000,
          notes: 'Cat Dulux/Mowilex 3 lapis',
        },
      ];

      setSuggestedItems(fallbackItems);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToProject = () => {
    if (!selectedProject) {
      showToast('Pilih Proyek', 'Silakan pilih proyek aktif terlebih dahulu.', 'warning');
      return;
    }

    suggestedItems.forEach((it) => {
      addRABItem({
        projectId: selectedProject.id,
        code: it.code,
        name: it.name,
        category: it.category,
        unit: it.unit,
        volume: it.volume,
        unitPrice: it.unitPrice,
        notes: it.notes || 'Dihasilkan oleh AI Estimator',
      });
    });

    showToast(
      'Estimasi AI Diterapkan',
      `${suggestedItems.length} pos pekerjaan berhasil dimasukkan ke RAB ${selectedProject.name}.`,
      'success'
    );
    onClose();
  };

  const totalAIEstimate = suggestedItems.reduce((s, i) => s + i.totalCost, 0);

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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="relative w-full max-w-4xl rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-10 flex flex-col max-h-[90vh] border border-white/40 bg-white/70 backdrop-blur-2xl"
      >
        {/* HEADER MAC OS STYLE */}
        <div className="px-4 py-3 flex items-center justify-between bg-white/40 border-b border-slate-200/50 sticky top-0 z-20">
          {/* Traffic Lights (Merah, Kuning, Hijau) */}
          <div className="flex items-center space-x-2 w-20">
            <button 
              onClick={onClose}
              className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner hover:bg-[#FF5F56]/80 flex items-center justify-center group"
            >
              <X className="w-2.5 h-2.5 text-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner"></button>
            <button className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner"></button>
          </div>

          {/* Judul Window di Tengah */}
          <div className="flex-1 text-center">
            <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
              AI Cost Estimator
            </h3>
          </div>

          {/* Spacer agar judul benar-benar di tengah */}
          <div className="w-20"></div>
        </div>

        {/* KONTEN (Beri background semi-transparan agar blur dari luar tembus) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white/60 space-y-5">
          {/* Prompt input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Spesifikasi Proyek Konstruksi
              </label>
              <textarea
                rows={3}
                value={projectPrompt}
                onChange={(e) => setProjectPrompt(e.target.value)}
                placeholder="Contoh: Pembangunan Rumah 2 Lantai 150m2 dengan finishing granit, dinding bata merah, atap baja ringan..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Luas Bangunan (m²)
                </label>
                <input
                  type="number"
                  value={buildingArea}
                  onChange={(e) => setBuildingArea(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Plafon Anggaran (Rp - Opsional)
                </label>
                <input
                  type="number"
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  placeholder="350000000"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Menganalisis Spesifikasi & Standar SNI...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Generate Rencana Anggaran Biaya dengan AI</span>
                </>
              )}
            </button>
          </div>

          {/* Results preview */}
          {suggestedItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hasil Rekomendasi Item Pekerjaan ({suggestedItems.length})
                </h4>
                <span className="text-xs font-black text-blue-700 font-mono">
                  Total Estimasi: {formatRupiah(totalAIEstimate)}
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-slate-700 font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Kode</th>
                      <th className="px-3 py-2">Uraian Pekerjaan</th>
                      <th className="px-2 py-2 text-center">Sat</th>
                      <th className="px-3 py-2 text-right">Volume</th>
                      <th className="px-3 py-2 text-right">Harga (Rp)</th>
                      <th className="px-3 py-2 text-right">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suggestedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{item.code}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          <div>{item.name}</div>
                          <div className="text-[10px] text-blue-600">{item.category}</div>
                        </td>
                        <td className="px-2 py-2 text-center">{item.unit}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatNumber(item.volume, 2)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatRupiah(item.unitPrice)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            {suggestedItems.length > 0 && (
              <button
                type="button"
                onClick={handleApplyToProject}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Terapkan Semua Item ke RAB Proyek</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

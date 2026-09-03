import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, Loader2, PlayCircle, Bot } from 'lucide-react';
import { Project, RABItem, ProjectCalculation } from '../../types';
import { runDeterministicAudit, AuditAnomaly } from '../../services/financialAuditAgent';
import { aiService } from '../../services/aiService';

interface FinancialReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  items: RABItem[];
  calculation: ProjectCalculation;
}

export const FinancialReviewModal: React.FC<FinancialReviewModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
  calculation,
}) => {
  const [anomalies, setAnomalies] = useState<AuditAnomaly[]>([]);
  const [isClean, setIsClean] = useState(true);
  const [aiReviewResult, setAiReviewResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Run deterministic audit when opened
      const result = runDeterministicAudit(project as any, items, calculation);
      setAnomalies(result.anomalies);
      setIsClean(result.isClean);
      setAiReviewResult(null);
      setError(null);
    }
  }, [isOpen, project, items, calculation]);

  const handleRunAiReview = async () => {
    if (!project) return;
    setIsAiLoading(true);
    setError(null);
    try {
      const result = await aiService.financialReview(project, items, calculation, anomalies);
      setAiReviewResult(result);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses evaluasi finansial.');
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-elevated)]/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-elevated)] w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[var(--bg-elevated-hover)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Financial Audit & Review</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Zero-Mistake Engine (Deterministik & AI)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Deterministik Panel */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center">
              <span className="w-6 h-6 rounded-md bg-[var(--bg-elevated-hover)] flex items-center justify-center mr-2">1</span>
              Hasil Audit Deterministik
            </h3>
            
            {isClean ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-emerald-800">Tidak ada anomali matematis fatal</h4>
                  <p className="text-xs text-emerald-600 mt-1">Sistem tidak mendeteksi volume kosong, harga satuan nol, duplikasi, atau inkonsistensi kalkulasi (Overhead & Profit valid).</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className={`border rounded-xl p-4 flex items-start space-x-3 ${anomaly.severity === 'fatal' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${anomaly.severity === 'fatal' ? 'text-rose-600' : 'text-amber-600'}`} />
                    <div>
                      <h4 className={`text-sm font-semibold ${anomaly.severity === 'fatal' ? 'text-rose-800' : 'text-amber-800'}`}>
                        {anomaly.type === 'oh_profit_inconsistency' ? 'Inkonsistensi Total' : anomaly.itemName}
                      </h4>
                      <p className={`text-xs mt-1 ${anomaly.severity === 'fatal' ? 'text-rose-600' : 'text-amber-600'}`}>{anomaly.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* AI Panel */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2">2</span>
                AI Financial Review
              </div>
              {!aiReviewResult && !isAiLoading && (
                <button
                  onClick={handleRunAiReview}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1.5 shadow-sm shadow-indigo-200"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Jalankan Analisis AI</span>
                </button>
              )}
            </h3>

            {isAiLoading ? (
              <div className="bg-[var(--bg-elevated-hover)] border border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Menganalisis komposisi anggaran proyek...</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Menggunakan AI Zero-Cost Safeguard</p>
              </div>
            ) : aiReviewResult ? (
              <div className="bg-[var(--bg-elevated)] border border-indigo-100 rounded-xl p-5 shadow-sm">
                <div className="prose prose-sm prose-slate max-w-none whitespace-pre-wrap leading-relaxed">
                  {aiReviewResult}
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-elevated-hover)] border border-slate-100 rounded-xl p-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  AI akan mengevaluasi kewajaran komposisi biaya material/pekerja dan kelengkapan kategori untuk skala proyek ini.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 text-rose-600 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-[var(--bg-elevated-hover)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[var(--bg-elevated-hover)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

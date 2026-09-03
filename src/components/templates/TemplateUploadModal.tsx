import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseSpreadsheetData, normalizeOCRResult } from '../../utils/rabImportParser';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { RABImportJob, RABTemplateItem } from '../../types';
import { safeLocalStorageGet } from '../../utils/storageUtils';

interface TemplateUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportReady: () => void;
}

export const TemplateUploadModal: React.FC<TemplateUploadModalProps> = ({
  isOpen,
  onClose,
  onImportReady,
}) => {
  const { startImportJob, showToast, user } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'xlsx' | 'xls' | 'csv' | 'pdf' | 'jpg' | 'jpeg' | 'png' | 'unknown' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      setFileType(ext as any);
      setSelectedFile(file);
      setFilePreview(null);
    } else if (ext === 'pdf') {
      setFileType('pdf');
      setSelectedFile(file);
      setFilePreview(null);
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setFileType(ext === 'png' ? 'png' : ext === 'jpeg' ? 'jpeg' : 'jpg');
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('Format file tidak didukung. Harap unggah file Excel (.xlsx, .xls), CSV, PDF, atau Gambar (.jpg, .png).');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressStage('Menganalisis format dokumen...');

    try {
      let newJob: RABImportJob;

      if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
        setProgressStage('Mengekstrak baris & kolom spreadsheet...');
        const buffer = await selectedFile.arrayBuffer();
        newJob = await parseSpreadsheetData(buffer, selectedFile.name, user?.id || 'usr_1', filePreview || undefined);
      } else {
        // PDF or Image extraction via AI / OCR
        setProgressStage('Mengirim dokumen ke modul OCR & AI Vision...');
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const token = typeof window !== 'undefined' ? safeLocalStorageGet('rabpro_token') : '';
        const response = await fetch('/api/ai/extract-rab-document', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            fileData: base64,
            fileName: selectedFile.name,
            fileType: fileType,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Gagal mengekstrak dokumen (${response.statusText})`);
        }

        const data = await response.json();
        newJob = normalizeOCRResult(data.extractedData || data, selectedFile.name, user?.id || 'usr_1', base64);
      }

      if (!newJob.parsedItems || newJob.parsedItems.length === 0) {
        throw new Error('Tidak ditemukan baris item RAB yang valid dalam dokumen ini. Pastikan format tabel memiliki kolom Uraian Pekerjaan, Satuan, Volume, atau Harga.');
      }

      startImportJob(newJob);
      showToast('Ekstraksi Berhasil', `Berhasil mengekstrak ${newJob.parsedItems.length} item pekerjaan dari ${selectedFile.name}.`, 'success');
      onImportReady();
    } catch (err: any) {
      console.error('Import processing error:', err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengekstrak data dari dokumen.');
      showToast('Ekstraksi Gagal', err.message || 'Format dokumen tidak dapat diproses.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[var(--bg-elevated)]/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-elevated-hover)]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Unggah File RAB & Template</h2>
              <p className="text-xs text-slate-500">Mendukung Excel (.xlsx/.xls), CSV, PDF, dan Gambar Cetak</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated-hover)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-[var(--border-primary)] hover:border-blue-400 hover:bg-[var(--bg-elevated-hover)]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center space-y-2">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                  {fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv' ? (
                    <FileSpreadsheet className="w-8 h-8" />
                  ) : fileType === 'pdf' ? (
                    <FileText className="w-8 h-8" />
                  ) : (
                    <ImageIcon className="w-8 h-8" />
                  )}
                </div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{selectedFile.name}</div>
                <div className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Klik atau tarik untuk mengganti file
                </div>
                {filePreview && (
                  <div className="mt-2 max-h-32 rounded-lg overflow-hidden border border-[var(--border-primary)] shadow-xs">
                    <img src={filePreview} alt="Preview" className="h-28 w-auto object-contain" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    Tarik file ke sini atau <span className="text-blue-600 underline">pilih dari perangkat</span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Excel (.xlsx, .xls), CSV, Dokumen PDF, Gambar/Scan Foto (.png, .jpg)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Feature Badges */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-[var(--bg-elevated-hover)] rounded-xl border border-slate-100 flex flex-col items-center">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="font-semibold text-[var(--text-primary)]">Auto Formula</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Deteksi Volume & Satuan</span>
            </div>
            <div className="p-2.5 bg-[var(--bg-elevated-hover)] rounded-xl border border-slate-100 flex flex-col items-center">
              <Sparkles className="w-4 h-4 text-purple-600 mb-1" />
              <span className="font-semibold text-[var(--text-primary)]">AI OCR Vision</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Pindai PDF & Gambar</span>
            </div>
            <div className="p-2.5 bg-[var(--bg-elevated-hover)] rounded-xl border border-slate-100 flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-blue-600 mb-1" />
              <span className="font-semibold text-[var(--text-primary)]">Validasi Data</span>
              <span className="text-[10px] text-[var(--text-secondary)]">Verifikasi & Normalisasi</span>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-3 text-xs text-blue-800">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div>
                <div className="font-semibold">Sedang Memproses Dokumen...</div>
                <div className="text-blue-600 mt-0.5">{progressStage}</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-slate-200 dark:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleProcessFile}
            disabled={!selectedFile || isProcessing}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengekstrak Data...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Mulai Ekstraksi RAB</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

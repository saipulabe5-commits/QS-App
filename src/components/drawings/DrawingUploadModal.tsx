import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DrawingCategory } from '../../types/drawing';
import { compressImageBase64 } from '../../utils/imageCompressor';
import {
  X,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Building2,
  Trash2,
} from 'lucide-react';

interface DrawingUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: DrawingCategory;
}

const CATEGORIES: { value: DrawingCategory; label: string; description: string }[] = [
  { value: 'Denah', label: 'Denah Bangunan', description: 'Denah lantai, tata ruang, grid kolom' },
  { value: 'Tampak', label: 'Tampak Bangunan', description: 'Tampak depan, samping, dan belakang' },
  { value: 'Potongan', label: 'Potongan Bangunan', description: 'Potongan melintang & membujur, elevasi' },
  { value: 'Detail Pondasi', label: 'Detail Pondasi', description: 'Pondasi batu kali, footplate, tiang pancang' },
  { value: 'Detail Kolom & Balok', label: 'Detail Kolom & Balok', description: 'Pembesian, dimensi tulangan & selimut' },
  { value: 'Detail Struktur', label: 'Detail Struktur', description: 'Plat lantai, tangga, sloof, ringbalk' },
  { value: 'Detail Atap', label: 'Detail Rangka & Penutup Atap', description: 'Kuda-kuda baja ringan/kayu, genteng, lisplang' },
  { value: 'Detail Arsitektur', label: 'Detail Arsitektur', description: 'Pintu, jendela, keramik, kusen, plafon' },
  { value: 'Gambar Kerja', label: 'Gambar Kerja Lengkap', description: 'Shop drawing & DED konstruksi komprehensif' },
  { value: 'Foto Lapangan', label: 'Foto Kondisi Lapangan', description: 'Dokumentasi visual fisik lokasi proyek' },
  { value: 'Dokumen PDF', label: 'Dokumen PDF / Lainnya', description: 'Berkas gambar teknik format PDF' },
];

export const DrawingUploadModal: React.FC<DrawingUploadModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Denah',
}) => {
  const { selectedProject, addDrawing, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DrawingCategory>(defaultCategory);
  const [description, setDescription] = useState('');
  const [scale, setScale] = useState('1:100');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    // Validate format (JPG, JPEG, PNG, PDF, WEBP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB

    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Format Tidak Didukung', 'Hanya menerima format JPG, JPEG, PNG, WEBP, dan PDF.', 'error');
      return;
    }

    if (file.size > maxSizeBytes) {
      showToast('Ukuran Terlalu Besar', 'Maksimal ukuran file adalah 15MB.', 'error');
      return;
    }

    setFileData({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawUrl = e.target?.result as string;
      if (rawUrl && rawUrl.startsWith('data:image/')) {
        const compressed = await compressImageBase64(rawUrl, 1200, 1200, 0.75);
        setPreviewUrl(compressed);
      } else {
        setPreviewUrl(rawUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      showToast('Pilih Proyek', 'Pilih atau buat proyek aktif terlebih dahulu.', 'warning');
      return;
    }

    if (!title.trim()) {
      showToast('Data Tidak Lengkap', 'Judul dokumen gambar wajib diisi.', 'error');
      return;
    }

    if (!previewUrl) {
      showToast('File Diperlukan', 'Silakan pilih gambar atau dokumen terlebih dahulu.', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(40);

    setTimeout(() => {
      setUploadProgress(100);
      addDrawing({
        projectId: selectedProject.id,
        title: title.trim(),
        category,
        fileUrl: previewUrl,
        fileName: fileData?.name || 'drawing.png',
        fileSize: fileData ? `${(fileData.size / (1024 * 1024)).toFixed(2)} MB` : '1.2 MB',
        fileType: fileData?.type || 'image/png',
        scale: scale.trim() || '1:100',
        description: description.trim(),
      });

      setIsUploading(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-elevated)]/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[var(--bg-elevated)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 bg-[var(--bg-elevated)] text-[var(--text-primary)] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Unggah Dokumen Gambar Konstruksi</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Proyek: <span className="text-blue-400 font-semibold">{selectedProject?.name || 'Tidak Ada'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-white p-1 rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Drag and Drop Zone */}
          {!previewUrl ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
                  : 'border-[var(--border-primary)] hover:border-blue-400 hover:bg-[var(--bg-elevated-hover)]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) { Array.from(e.target.files).forEach((f: any) => handleFile(f)); }
                }}
              />
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Tarik & Lepas File Gambar di Sini, atau <span className="text-blue-600 underline">Pilih Berkas</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
                Mendukung gambar Denah, Tampak, Potongan, Detail Pondasi, Kolom, Balok, & PDF (JPG, PNG, PDF maks. 15MB)
              </p>
            </div>
          ) : (
            <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-2xl border border-[var(--border-primary)] flex items-center justify-between">
              <div className="flex items-center space-x-3.5 overflow-hidden">
                <div className="w-16 h-16 rounded-xl border border-[var(--border-primary)] overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0 flex items-center justify-center">
                  {fileData?.type.includes('pdf') ? (
                    <FileText className="w-8 h-8 text-rose-500" />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-xs">{fileData?.name}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Siap
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Ukuran: {fileData ? (fileData.size / (1024 * 1024)).toFixed(2) : '1.0'} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setFileData(null);
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Ganti Berkas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Memproses dan mengompres dokumen gambar...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Judul Dokumen / Nama Gambar *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Denah Lantai 1 & Grid Kolom K1-K2"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Kategori Dokumen *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DrawingCategory)}
                className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--text-primary)]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Skala Gambar (Opsional)
              </label>
              <input
                type="text"
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                placeholder="1:100 / 1:50 / 1:20"
                className="w-full px-3.5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--text-primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1.5">
                Catatan / Keterangan Tambahan
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tambahkan catatan khusus untuk AI (contoh: 'Tinggi plafon 3.5m, dinding bata ringan tebal 10cm')..."
                className="w-full px-3.5 py-2 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[var(--text-primary)] resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated-hover)] rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading || !previewUrl || !title.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center space-x-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Menyimpan...' : 'Simpan & Unggah Dokumen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

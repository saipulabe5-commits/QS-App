import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PasswordStrengthMeter } from "../auth/PasswordStrengthMeter";
import { AppSettings } from '../../types';
import { safeLocalStorageGet } from '../../utils/storageUtils';
import {
  Building2,
  Percent,
  FileText,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Database,
  Download,
  Upload,
  Code2,
  FileCode,
  FolderTree,
  Eye,
  EyeOff,
  Sparkles,
  Key,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { SourceCodeExportModal } from './SourceCodeExportModal';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, showToast, projects, rabItems, priceDatabase, ahspItems, user, changePassword } = useApp();

  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword) {
      setPassError('Kata sandi lama wajib diisi.');
      return;
    }
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-.,])[A-Za-z\d@$!%*?&_\-.,]{10,}$/;
    if (!newPassword || !strongPasswordRegex.test(newPassword)) {
      setPassError("Kata sandi baru minimal 10 karakter, harus mengandung huruf besar, huruf kecil, angka, dan simbol.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPassSuccess('Kata sandi Anda berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.error || 'Gagal mengganti kata sandi.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const ov = Math.max(0, Math.min(100, Number(formData.defaultOverhead) || 0));
    const pf = Math.max(0, Math.min(100, Number(formData.defaultProfit) || 0));
    const tx = Math.max(0, Math.min(100, Number(formData.defaultTax) || 0));

    updateSettings({
      ...formData,
      defaultOverhead: ov,
      defaultProfit: pf,
      defaultTax: tx,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    showToast('Pengaturan Disimpan', 'Konfigurasi perusahaan dan parameter biaya berhasil diperbarui.', 'success');
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        settings,
        projects,
        rabItems,
        priceDatabase,
        ahspItems,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `RAB_PRO_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      setTimeout(() => {
        downloadAnchor.remove();
        window.URL.revokeObjectURL(url);
      }, 150);

      showToast('Backup Berhasil', 'File cadangan JSON seluruh database RAB berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error('Backup download error:', err);
      showToast('Gagal Mengunduh', err?.message || 'Terjadi kesalahan saat mengekspor cadangan data.', 'error');
    }
  };

  const handleExportSourceCodeJSON = async () => {
    setIsDownloadingSource(true);
    try {
      const token = safeLocalStorageGet('rabpro_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/export/source-code?download=true', {
        headers,
      });

      if (!response.ok) {
        throw new Error(`Server returned error ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SOURCE_CODE_RAB_PRO_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 150);

      showToast('Export Source Code Berhasil', 'Berkas JSON source code lengkap berhasil diunduh.', 'success');
    } catch (err: any) {
      console.error('Download source error:', err);
      showToast('Gagal Mengunduh', err?.message || 'Terjadi kesalahan saat mengekspor source code.', 'error');
    } finally {
      setIsDownloadingSource(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
          Pengaturan Sistem & Profil Perusahaan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Atur identitas resmi kop surat, persentase default anggaran, dan konfigurasi penomoran
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Perusahaan */}
        <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Identitas Perusahaan (Kop Surat)</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Informasi ini akan tercetak otomatis pada lembar dokumen dan laporan RAB
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Nama Perusahaan / Kontraktor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-blue-500/20"
                placeholder="PT. Citra Kusuma Development"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Alamat Kantor
              </label>
              <input
                type="text"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                placeholder="Jl. Jenderal Sudirman No. 128, Jakarta Pusat"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                placeholder="(021) 555-8901 / 0812-3456-7890"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Alamat Email
              </label>
              <input
                type="email"
                value={formData.companyEmail}
                onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)]"
                placeholder="info@konstruksijaya.co.id"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Default Biaya & Pajak */}
        <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <Percent className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Nilai Persentase Default Anggaran
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Akan otomatis diterapkan saat membuat proyek baru (dapat diubah per proyek)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Default Biaya Overhead (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultOverhead}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultOverhead: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono text-right pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] font-bold">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Default Keuntungan/Profit (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.defaultProfit}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultProfit: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono text-right pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] font-bold">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Format Penomoran */}
        <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Format Penomoran Dokumen</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pola penomoran otomatis untuk berkas RAB proyek baru
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Template Format Nomor Dokumen
              </label>
              <input
                type="text"
                value={formData.documentNumberFormat}
                onChange={(e) =>
                  setFormData({ ...formData, documentNumberFormat: e.target.value })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl font-mono"
                placeholder="RAB/{YEAR}/{NUM}"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Presisi Jumlah Desimal
              </label>
              <select
                value={formData.decimalDigits}
                onChange={(e) =>
                  setFormData({ ...formData, decimalDigits: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl"
              >
                <option value={0}>0 Desimal (Rp1.250.000)</option>
                <option value={2}>2 Desimal (Rp1.250.000,00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Keamanan Akun & Ganti Kata Sandi */}
        <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Keamanan Akun & Ganti Kata Sandi</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Perbarui kata sandi login untuk akun resmi: <span className="font-semibold text-[var(--text-primary)]">{user?.email || 'saipulabe@gmail.com'}</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Terenkripsi Salted Scrypt
            </span>
          </div>

          {passError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          {passSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{passSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Kata Sandi Saat Ini <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showOldPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama"
                  className="w-full px-3.5 py-2.5 pr-9 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
                >
                  {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 10 karakter"
                  className="w-full px-3.5 py-2.5 pr-9 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)]"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={newPassword} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                className="w-full px-3.5 py-2.5 text-xs bg-[var(--bg-elevated-hover)] border border-[var(--border-primary)] rounded-xl focus:bg-[var(--bg-elevated)] focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleChangePasswordSubmit}
              disabled={isChangingPass || !oldPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>{isChangingPass ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
            </button>
          </div>
        </div>

        {/* Section 5: Export Source Code & Backup Data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Pusat Ekspor Source Code & Cadangan Data
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Unduh seluruh kode sumber aplikasi atau cadangan database proyek dalam format file JSON
              </p>
            </div>
          </div>

          {/* Card 1: Source Code JSON Export */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-[var(--border-primary)] shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-white">
                    Ekspor Source Code Lengkap (.json)
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                    TypeScript + React Bundle
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  Mengemas seluruh berkas kode program frontend (React, Context, Utilities, Types, AHSP logic, Views) dan backend Express ke dalam format file JSON terstruktur.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] bg-[var(--bg-elevated-hover)] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-[var(--border-primary)] font-mono">
                    React 18
                  </span>
                  <span className="text-[10px] bg-[var(--bg-elevated-hover)] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-[var(--border-primary)] font-mono">
                    TypeScript
                  </span>
                  <span className="text-[10px] bg-[var(--bg-elevated-hover)] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-[var(--border-primary)] font-mono">
                    Tailwind CSS
                  </span>
                  <span className="text-[10px] bg-[var(--bg-elevated-hover)] text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-[var(--border-primary)] font-mono">
                    Node/Express
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(true)}
                className="px-3.5 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl border border-[var(--border-primary)] transition-colors flex items-center space-x-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Inspeksi Berkas</span>
              </button>

              <button
                type="button"
                onClick={handleExportSourceCodeJSON}
                disabled={isDownloadingSource}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <Download className={`w-4 h-4 ${isDownloadingSource ? 'animate-bounce' : ''}`} />
                <span>{isDownloadingSource ? 'Mengunduh...' : 'Download Source JSON'}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Database Backup */}
          <div className="bg-[var(--bg-elevated)] p-6 rounded-2xl border border-[var(--border-primary)] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Cadangan Seluruh Data Proyek & RAB (JSON)</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Unduh file cadangan data proyek aktif, rekaman item RAB, daftar harga material, dan koefisien AHSP
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2 bg-[var(--bg-elevated-hover)] hover:bg-slate-200 dark:bg-slate-700 text-[var(--text-primary)] text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Backup Data JSON</span>
            </button>
          </div>
        </div>

        {/* Section 6: Local-First Security Notice */}
        <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-900">Privasi & Keamanan Data (Local-First)</h3>
              <p className="text-[11px] text-indigo-700">
                Aplikasi ini mengadopsi arsitektur <strong>Local-First</strong>.
              </p>
            </div>
          </div>
          <div className="text-xs text-indigo-800 space-y-2 pl-11">
            <p>
              Seluruh data proyek, AHSP, dan material Anda <strong>disimpan secara eksklusif di dalam memori perangkat ini (IndexedDB)</strong> dan tidak pernah dikirim ke server pusat untuk disimpan. Mode sinkronisasi cloud saat ini dinonaktifkan secara permanen.
            </p>
            <p>
              Keamanan data Anda sepenuhnya bergantung pada keamanan perangkat keras/komputer ini. Pastikan Anda tidak memberikan akses perangkat ke pihak yang tidak berwenang, dan gunakan kata sandi atau kunci PIN OS komputer Anda untuk melindungi data.
            </p>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan berhasil disimpan!</span>
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Source Code Export / Explorer Modal */}
      <SourceCodeExportModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
};

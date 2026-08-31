import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Lock, Mail, User, Building, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, showToast, user, logout, requestPasswordReset, resetPasswordWithCode } = useApp();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset-code'>(initialMode);
  const [email, setEmail] = useState('saipulabe@gmail.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: 'Email wajib diisi.' });
      return;
    }
    if (!password.trim()) {
      setErrors({ password: 'Password wajib diisi.' });
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      onClose();
    } else {
      setErrors({ general: res.error || 'Email atau kata sandi tidak valid.' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: 'Nama lengkap wajib diisi.' });
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrors({ email: 'Format email tidak valid.' });
      return;
    }
    if (password.length < 6) {
      setErrors({ password: 'Password minimal 6 karakter.' });
      return;
    }

    const res = await register(name, email, company, password);
    if (res.success) {
      onClose();
    } else {
      setErrors({ general: res.error || 'Pendaftaran akun gagal.' });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!email.trim()) {
      setErrors({ email: 'Email wajib diisi.' });
      return;
    }
    const res = await requestPasswordReset(email);
    if (res.success) {
      setResetCode('');
      setMode('reset-code');
    } else {
      setErrors({ general: res.error || 'Gagal mengirim kode pemulihan.' });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!resetCode.trim()) {
      setErrors({ resetCode: 'Kode pemulihan wajib diisi.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrors({ newPassword: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    const res = await resetPasswordWithCode(email, resetCode, newPassword);
    if (res.success) {
      onClose();
    } else {
      setErrors({ general: res.error || 'Gagal mengatur ulang kata sandi.' });
    }
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="relative w-full max-w-md rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-10 flex flex-col border border-white/40 bg-white/70 backdrop-blur-2xl"
      >
        {/* HEADER MAC OS STYLE */}
        <div className="px-4 py-3 flex items-center justify-between bg-white/40 border-b border-slate-200/50 sticky top-0 z-20">
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
          <div className="flex-1 text-center">
            <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
              Auth
            </h3>
          </div>
          <div className="w-20"></div>
        </div>

        <div className="p-6 bg-white/60">
        {/* Logo and Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xl mx-auto shadow-xs">
            RAB
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-3">
            {mode === 'login'
              ? 'Masuk ke RAB Pro'
              : mode === 'register'
              ? 'Daftar Akun Baru'
              : 'Atur Ulang Password'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login'
              ? 'Akses proyek konstruksi dan estimasi anggaran Anda'
              : mode === 'register'
              ? 'Kelola RAB profesional bersama tim Anda'
              : 'Masukkan email akun Anda untuk menerima tautan pemulihan'}
          </p>
        </div>

        {/* Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estimator@konstruksi.co.id"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-600 mt-0.5">{errors.email}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {errors.password && <p className="text-[10px] text-rose-600 mt-0.5">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Masuk Sekarang
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Belum punya akun? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Daftar Akun
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ir. Budi Santoso, S.T."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.name && <p className="text-[10px] text-rose-600 mt-0.5">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Perusahaan / Kontraktor
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="PT. Citra Kusuma Development"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@binakarya.co.id"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-600 mt-0.5">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.password && <p className="text-[10px] text-rose-600 mt-0.5">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors mt-2"
            >
              Buat Akun RAB Pro
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500">Sudah punya akun? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Masuk
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Akun
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="saipulabe@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-600 mt-0.5">{errors.email}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Kirim Kode Pemulihan
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Kembali ke Halaman Masuk
              </button>
            </div>
          </form>
        )}

        {mode === 'reset-code' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                Kode verifikasi 6-digit telah dikirim ke <strong>{email}</strong>. Silakan periksa inbox / spam email Anda.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Pemulihan dari Email (6 Digit)
              </label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Masukkan 6-digit kode dari email"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-center font-bold focus:bg-white"
              />
              {errors.resetCode && <p className="text-[10px] text-rose-600 mt-0.5">{errors.resetCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kata Sandi Baru (Min. 6 Karakter)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ketik kata sandi baru"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.newPassword && <p className="text-[10px] text-rose-600 mt-0.5">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ulangi Kata Sandi Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi kata sandi baru"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              {errors.confirmPassword && <p className="text-[10px] text-rose-600 mt-0.5">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Simpan Password Baru & Masuk
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Batal & Kembali ke Masuk
              </button>
            </div>
          </form>
        )}
        </div>
      </motion.div>
    </div>
  );
};

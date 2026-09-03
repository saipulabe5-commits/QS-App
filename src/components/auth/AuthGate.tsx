import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  FileSpreadsheet,
  Activity,
  AlertCircle,
  Key,
  ShieldAlert,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export const AuthGate: React.FC = () => {
  const { login, requestPasswordReset, resetPasswordWithCode, showToast } = useApp();

  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset-code'>('login');
  const [email, setEmail] = useState('saipulabe@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password / Reset State
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    if (cleanEmail !== 'saipulabe@gmail.com' && cleanEmail !== 'saipulabe5@gmail.com') {
      setErrorMessage('Akses Ditolak: Hanya akun resmi saipulabe@gmail.com yang diizinkan masuk.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(cleanEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || 'Kata sandi tidak sesuai. Silakan periksa kembali.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    if (cleanEmail !== 'saipulabe@gmail.com' && cleanEmail !== 'saipulabe5@gmail.com') {
      setErrorMessage('Akses Ditolak: Pemulihan hanya berlaku untuk akun saipulabe@gmail.com.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success) {
        setResetCode('');
        setAuthMode('reset-code');
        setSuccessMessage(`Kode pemulihan 6-digit telah dikirimkan ke email ${cleanEmail}. Silakan periksa kotak masuk atau spam email Anda.`);
      } else {
        setErrorMessage(res.error || 'Gagal mengirim kode pemulihan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const cleanEmail = email.trim().toLowerCase();

    if (!resetCode.trim()) {
      setErrorMessage('Kode pemulihan 6-digit wajib diisi.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak sesuai.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordWithCode(cleanEmail, resetCode.trim(), newPassword);
      if (res.success) {
        showToast('Kata Sandi Berhasil Direset', 'Anda telah masuk dengan kata sandi baru!', 'success');
      } else {
        setErrorMessage(res.error || 'Gagal mereset kata sandi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghubungi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-elevated)] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] rounded-full bg-sky-500/5 blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 border-b border-slate-200 dark:border-[var(--border-primary)]/60 bg-[var(--bg-elevated)]/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30">
              R
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">RAB Pro</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800/80">
                  Enterprise V4
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800/80 hidden sm:inline-block">
                  Single Authorized User
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Sistem Manajemen Anggaran Biaya & Konstruksi Terpadu
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] text-xs text-slate-600 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">Akses Terproteksi Khusus</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Grid */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Feature Highlights & Value Props */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Sistem Estimasi Anggaran Konstruksi Standar SNI</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Akses Eksklusif Administrator RAB Pro
            </h2>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Workspace ini dikunci secara privat untuk satu akun resmi terverifikasi. Masukkan kata sandi terenkripsi Anda untuk membuka akses penuh ke seluruh proyek, database AHSP, Kurva S, dan audit forensik zero-mistake.
            </p>

            {/* Feature List */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-slate-200 dark:border-[var(--border-primary)] flex items-start space-x-3">
                <FileSpreadsheet className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Database SNI & AHSP</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Ratusan analisis koefisien tenaga, bahan, & alat resmi.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-slate-200 dark:border-[var(--border-primary)] flex items-start space-x-3">
                <Activity className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Kurva S Rencana vs Real</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Monitoring deviasi bobot progres rencana vs aktual.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-slate-200 dark:border-[var(--border-primary)] flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Zero-Cost Offline</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">IndexedDB lokal, terenkripsi, tanpa biaya langganan.</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-slate-200 dark:border-[var(--border-primary)] flex items-start space-x-3">
                <UserCheck className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Single Account Auth</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Hanya saipulabe@gmail.com dengan password terverifikasi.</p>
                </div>
              </div>
            </div>

            {/* Security Badge */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-[11px] text-amber-300 flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Sistem diatur dalam mode Single-User Strict Lockdown untuk keamanan mutlak data proyek.</span>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="bg-[var(--bg-elevated)]/90 border border-slate-200 dark:border-[var(--border-primary)] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl relative"
            >
              {/* Authorized Account Badge */}
              <div className="mb-6 p-3 rounded-xl bg-[var(--bg-elevated)]/80 border border-slate-200 dark:border-[var(--border-primary)] flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[var(--traffic-yellow)]/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                    SA
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Saipul Abe</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-[var(--traffic-yellow)]/20 text-amber-300 border border-amber-500/40 uppercase font-extrabold">
                        Owner / Admin
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] font-mono">saipulabe@gmail.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-800/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Akun Resmi</span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mb-5 text-left">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-400" />
                  <span>
                    {authMode === 'login' && 'Masuk dengan Kata Sandi'}
                    {authMode === 'forgot' && 'Pemulihan Kata Sandi'}
                    {authMode === 'reset-code' && 'Buat Kata Sandi Baru'}
                  </span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {authMode === 'login' && 'Masukkan kata sandi akun untuk membuka seluruh modul dan database RAB Pro.'}
                  {authMode === 'forgot' && 'Dapatkan kode verifikasi keamanan untuk mengatur ulang kata sandi Anda.'}
                  {authMode === 'reset-code' && 'Masukkan kode pemulihan dan tetapkan kata sandi baru Anda.'}
                </p>
              </div>

              {/* Error Alert Message */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Success Alert Message */}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              {/* MODE 1: LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Alamat Email Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="saipulabe@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Kata Sandi (Password)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage('');
                          setSuccessMessage('');
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Lupa kata sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan kata sandi Anda"
                        className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Masuk ke Workspace RAB</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 2: REQUEST RESET CODE (FORGOT PASSWORD STEP 1) */}
              {authMode === 'forgot' && (
                <form onSubmit={handleRequestResetSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Alamat Email Pemilik Akun
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="saipulabe@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-[11px] text-blue-300 flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Sistem akan mengirimkan kode verifikasi 6-digit langsung ke email resmi Anda (<strong>saipulabe@gmail.com</strong>).
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Kirim Kode ke Email</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs text-[var(--text-secondary)] hover:text-slate-200 transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kembali ke Halaman Login</span>
                    </button>
                  </div>
                </form>
              )}

              {/* MODE 3: ENTER RESET CODE & SET NEW PASSWORD (FORGOT PASSWORD STEP 2) */}
              {authMode === 'reset-code' && (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-left">
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/50 text-blue-200 text-xs flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[11px] leading-relaxed">
                      Kode verifikasi 6-digit telah dikirim ke <strong>{email}</strong>. Silakan periksa inbox / spam email Anda, lalu masukkan kodenya di bawah ini.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Kode Pemulihan dari Email (6 Digit PIN)
                    </label>
                    <input
                      type="text"
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Masukkan 6-digit kode dari email"
                      className="w-full px-4 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-sm font-mono tracking-widest text-center text-amber-400 font-bold placeholder-slate-600 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Kata Sandi Baru (Minimal 6 Karakter)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Masukkan kata sandi baru"
                        className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600 dark:text-slate-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Ulangi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi baru"
                        className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-elevated)] border border-slate-200 dark:border-[var(--border-primary)] rounded-xl text-xs text-[var(--text-primary)] placeholder-slate-500 dark:placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Simpan Kata Sandi & Masuk</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-xs text-[var(--text-secondary)] hover:text-slate-200 transition-colors inline-flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Batal dan Kembali ke Login</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Footnote */}
              <div className="mt-5 text-center text-[11px] text-slate-500">
                <span>Dilindungi Enkripsi Kriptografi & Verifikasi Zero-Mistake.</span>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-[var(--border-primary)]/60 bg-[var(--bg-elevated)]/80 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} RAB Pro Enterprise. Hak Cipta Dilindungi.</span>
          <div className="flex items-center space-x-4 text-[var(--text-secondary)]">
            <span>Standar SNI & AHSP PU</span>
            <span>•</span>
            <span>Single-Account Authorized: saipulabe@gmail.com</span>
            <span>•</span>
            <span>100% Offline-First IndexedDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

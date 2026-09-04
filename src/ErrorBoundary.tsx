import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Database, ShieldAlert } from 'lucide-react';

export interface ErrorBoundaryProps {
  children?: ReactNode;
  fallbackTitle?: string;
  isViewLevel?: boolean;
  onReset?: () => void;
  key?: React.Key;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

// Sanitizes error stack and message to never expose JWT, tokens, or API keys
export function sanitizeErrorMessage(msg: string = ''): string {
  return msg
    .replace(/bearer\s+[a-zA-Z0-9\-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/eyJ[a-zA-Z0-9\-_.]+/g, '[REDACTED_JWT]')
    .replace(/ai_key_[a-zA-Z0-9_-]+/gi, '[REDACTED_KEY]')
    .replace(/password\s*[:=]\s*["'][^"']+["']/gi, 'password: "[REDACTED]"');
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `ERR_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[RAB Pro V11 ErrorBoundary ${(this as any).state?.errorId}]:`, error, errorInfo);
    bugTracker.log({
      category: "react-error-boundary",
      severity: "error",
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    try {
      if (typeof window !== 'undefined') {
        const preserveToken = localStorage.getItem('rabpro_token');
        localStorage.clear();
        sessionStorage.clear();
        if (preserveToken) {
          localStorage.setItem('rabpro_token', preserveToken);
        }
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key).catch(() => {}));
          }).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Reset storage failed:', e);
    }
    window.location.reload();
  };

  private handleResetView = () => {
    const props = (this as any).props;
    if (props && props.onReset) {
      props.onReset();
    }
    (this as any).setState({ hasError: false, error: null });
  };

  public render() {
    const state = (this as any).state as ErrorBoundaryState;
    const props = (this as any).props as ErrorBoundaryProps;

    if (state && state.hasError) {
      const sanitizedMessage = sanitizeErrorMessage(state.error?.message || 'Terjadi kesalahan tidak terduga pada komponen UI.');
      const sanitizedStack = sanitizeErrorMessage(state.error?.stack || '');

      if (props && props.isViewLevel) {
        return (
          <div className="p-8 bg-white dark:bg-slate-900 border border-rose-200 rounded-2xl shadow-sm my-4 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {props.fallbackTitle || 'Gagal Memuat Modul'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
              {sanitizedMessage}
            </p>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-left font-mono text-xs text-slate-700 dark:text-slate-300 mb-6 overflow-x-auto max-h-32">
              <span className="text-slate-500 dark:text-slate-400">ID Insiden: {state.errorId}</span>
              <div className="mt-1 text-rose-700">{sanitizedMessage}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={this.handleResetView}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Muat Ulang Modul</span>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-300 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Pemulihan Runtime RAB Pro V11
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
              Sistem mendeteksi kendala pada rendering komponen frontend. Data proyek Anda tersimpan secara aman di database lokal/server.
            </p>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-300 dark:border-slate-700 rounded-xl p-4 mb-6 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-x-auto max-h-44">
              <div className="text-slate-500 mb-1">
                Ref ID: <span className="text-blue-400 font-bold">{state.errorId}</span> | Waktu: {new Date().toISOString()}
              </div>
              <div className="text-rose-400 font-semibold mb-2">{sanitizedMessage}</div>
              {sanitizedStack && (
                <pre className="text-slate-500 text-[10px] whitespace-pre-wrap">{sanitizedStack.split('\n').slice(0, 5).join('\n')}</pre>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Segarkan Aplikasi</span>
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition-colors border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>Bersihkan Cache & Boot Ulang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props?.children;
  }
}

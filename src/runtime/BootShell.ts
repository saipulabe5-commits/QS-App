/**
 * RAB PRO V11 - Native Zero-Dependency Boot Shell & Runtime Instrumenter
 * Fully isolated from React, Tailwind, Lucide, Recharts, Framer Motion, IndexedDB, and APIs.
 */

export interface BootEvent {
  timestamp: string;
  phase: string;
  status: 'START' | 'SUCCESS' | 'FAILURE' | 'INFO';
  detail?: string;
  error?: any;
}

class RuntimeDiagnostics {
  private events: BootEvent[] = [];

  public log(phase: string, status: 'START' | 'SUCCESS' | 'FAILURE' | 'INFO', detail?: string, error?: any) {
    const event: BootEvent = {
      timestamp: new Date().toISOString(),
      phase,
      status,
      detail,
      error: error ? (error.message || String(error)) : undefined,
    };
    this.events.push(event);

    const color = status === 'FAILURE' ? '#ef4444' : status === 'SUCCESS' ? '#10b981' : '#3b82f6';
    if (typeof console !== 'undefined' && console.log) {
      if (typeof window !== 'undefined') {
        console.log(
          `%c[RAB PRO RUNTIME]%c [${status}] ${phase} ${detail ? `- ${detail}` : ''}`,
          `color: #ffffff; background: ${color}; font-weight: bold; padding: 2px 6px; border-radius: 3px;`,
          'color: #94a3b8;'
        );
      } else {
        console.log(`[RAB PRO RUNTIME] [${status}] ${phase} ${detail ? `- ${detail}` : ''}`);
      }
    }
    if (error && typeof console !== 'undefined' && console.error) {
      console.error('[RAB Pro Runtime Error]:', error);
    }
  }

  public getEvents(): BootEvent[] {
    return [...this.events];
  }
}

export const diagnostics = new RuntimeDiagnostics();

export const clearRuntimeCachesAndReload = async () => {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheKeys = await window.caches.keys();
      for (const key of cacheKeys) {
        await window.caches.delete(key);
      }
    }
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {}
  } catch (err) {
    console.warn('[Runtime Cache Reset Warning]:', err);
  } finally {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }
};

export const renderEmergencyBootUI = (container: HTMLElement, opts: {
  phase: string;
  error?: any;
  isSafeMode?: boolean;
}) => {
  const sanitizedMsg = opts.error ? (opts.error.message || String(opts.error)) : 'Gagal memuat komponen aplikasi secara normal.';
  const sanitizedStack = opts.error && opts.error.stack ? String(opts.error.stack).slice(0, 1000) : '';

  if (container) {
    container.innerHTML = `
      <div style="min-height: 100vh; width: 100%; background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box;">
        <div style="max-width: 640px; width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px;">
              ⚠️
            </div>
            <div>
              <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0;">RAB PRO RUNTIME DIAGNOSTIC</h2>
              <p style="font-size: 13px; color: #94a3b8; margin: 2px 0 0 0;">Fase Booting Terkendala: <strong style="color:#38bdf8;">${opts.phase}</strong></p>
            </div>
          </div>

          <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 14px; margin: 16px 0; font-family: monospace; font-size: 13px; color: #fca5a5; overflow-x: auto; word-break: break-word;">
            ${sanitizedMsg}
          </div>

          ${sanitizedStack ? `
            <details style="margin: 12px 0; font-size: 12px; color: #64748b;">
              <summary style="cursor: pointer; color: #94a3b8; font-weight: 600; margin-bottom: 6px;">Lihat Diagnostic Stack Trace</summary>
              <pre style="background: #040711; padding: 10px; border-radius: 6px; overflow-x: auto; color: #94a3b8; white-space: pre-wrap; font-size: 11px;">${sanitizedStack}</pre>
            </details>
          ` : ''}

          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px;">
            <button id="rab-btn-retry" style="background: #2563eb; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              Muat Ulang Halaman
            </button>
            <button id="rab-btn-safemode" style="background: #0d9488; color: #ffffff; border: none; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              Masuk Mode Aman (Safe Mode)
            </button>
            <button id="rab-btn-resetcache" style="background: #334155; color: #e2e8f0; border: 1px solid #475569; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.2s;">
              Bersihkan Cache & Boot Ulang
            </button>
          </div>
        </div>
      </div>
    `;

    if (typeof document !== 'undefined') {
      document.getElementById('rab-btn-retry')?.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.location) window.location.reload();
      });

      document.getElementById('rab-btn-safemode')?.addEventListener('click', () => {
        if (typeof window !== 'undefined' && window.location) window.location.search = '?safemode=1';
      });

      document.getElementById('rab-btn-resetcache')?.addEventListener('click', () => {
        clearRuntimeCachesAndReload();
      });
    }
  }
};

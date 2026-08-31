import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { diagnostics, renderEmergencyBootUI } from './runtime/BootShell';

// STEP 1: INITIALIZE BOOT SEQUENCE
diagnostics.log('BOOT_START', 'START', 'Memulai inisialisasi runtime bootstrap RAB Pro V10');

// GLOBAL UNCAUGHT ERROR TRAP TO PREVENT SILENT BLANK SCREEN
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    diagnostics.log('WINDOW_ERROR', 'FAILURE', event.message, event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    diagnostics.log('UNHANDLED_REJECTION', 'FAILURE', String(event.reason), event.reason);
  });
}

const container = document.getElementById('root');

if (!container) {
  diagnostics.log('ROOT_NOT_FOUND', 'FAILURE', 'Elemen #root tidak ditemukan pada dokumen');
} else {
  diagnostics.log('ROOT_FOUND', 'SUCCESS', 'Elemen #root siap untuk pemasangan React');

  // STEP 2: SAFE ASYNCHRONOUS APPLICATION IMPORT & MOUNT
  (async () => {
    try {
      diagnostics.log('APP_IMPORT_START', 'START', 'Memuat modul utama aplikasi (App.tsx)');
      const { default: App } = await import('./App.tsx');
      diagnostics.log('APP_IMPORT_SUCCESS', 'SUCCESS', 'Modul utama App.tsx berhasil dievaluasi');

      diagnostics.log('REACT_MOUNT_START', 'START', 'Memasang React root pada DOM');
      const root = createRoot(container);
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>,
      );
      diagnostics.log('REACT_MOUNT_SUCCESS', 'SUCCESS', 'Aplikasi RAB Pro V10 aktif terpasang');
    } catch (bootError: any) {
      diagnostics.log('APP_IMPORT_FAILURE', 'FAILURE', 'Kegagalan evaluasi atau pemasangan modul', bootError);
      renderEmergencyBootUI(container, {
        phase: 'APP_MODULE_EVALUATION',
        error: bootError,
      });
    }
  })();
}

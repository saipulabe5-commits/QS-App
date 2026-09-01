import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './ErrorBoundary';
import { diagnostics, renderEmergencyBootUI } from './runtime/BootShell';

// STEP 1: INITIALIZE BOOT SEQUENCE
diagnostics.log('BOOT_START', 'START', 'Memulai inisialisasi runtime bootstrap RAB Pro V10');

const container = document.getElementById('root');

if (!container) {
  diagnostics.log('ROOT_NOT_FOUND', 'FAILURE', 'Elemen #root tidak ditemukan pada dokumen');
} else {
  try {
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
    diagnostics.log('APP_MOUNT_FAILURE', 'FAILURE', 'Kegagalan pemasangan modul utama', bootError);
    renderEmergencyBootUI(container, {
      phase: 'APP_MOUNT',
      error: bootError,
    });
  }
}


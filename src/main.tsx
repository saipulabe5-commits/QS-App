import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { diagnostics, renderEmergencyBootUI } from './runtime/BootShell';

// STEP 1: INITIALIZE BOOT SEQUENCE
diagnostics.log('BOOT_START', 'START', 'Memulai inisialisasi runtime bootstrap RAB Pro V12');

const container = document.getElementById('root');
if (!container) {
  diagnostics.log('ROOT_NOT_FOUND', 'FAILURE', 'Elemen #root tidak ditemukan pada dokumen');
} else {
  // Dynamically load AppBootstrap only
  diagnostics.log('REACT_IMPORT_START', 'START', 'Memuat modul utama aplikasi secara dinamis');
  
  import('./runtime/AppBootstrap')
    .then((BootstrapModule) => {
      diagnostics.log('REACT_IMPORT_SUCCESS', 'SUCCESS', 'Modul utama berhasil dimuat');
      diagnostics.log('REACT_MOUNT_START', 'START', 'Memasang React root pada DOM');
      
      try {
        const root = ReactDOM.createRoot(container);
        const AppBootstrap = BootstrapModule.default;
        
        root.render(
          React.createElement(AppBootstrap)
        );
        
        diagnostics.log('REACT_MOUNT_SUCCESS', 'SUCCESS', 'Aplikasi RAB Pro V12 aktif terpasang');
        
        // Clear Blank Screen Watchdog
        if (typeof window !== 'undefined' && (window as any).__rabBootTimeout) {
          clearTimeout((window as any).__rabBootTimeout);
        }
      } catch (renderError) {
        diagnostics.log('REACT_MOUNT_FAILURE', 'FAILURE', 'Kegagalan saat proses render awal (createRoot)', renderError);
        
        // Clear Blank Screen Watchdog so our emergency UI isn't overwritten
        if (typeof window !== 'undefined' && (window as any).__rabBootTimeout) {
          clearTimeout((window as any).__rabBootTimeout);
        }
        
        renderEmergencyBootUI(container, {
          phase: 'REACT_MOUNT',
          error: renderError,
        });
      }
    })
    .catch((importError) => {
      diagnostics.log('APP_IMPORT_FAILURE', 'FAILURE', 'Kegagalan pemuatan modul dinamis (import error)', importError);
      
      // Clear Blank Screen Watchdog
      if (typeof window !== 'undefined' && (window as any).__rabBootTimeout) {
        clearTimeout((window as any).__rabBootTimeout);
      }
      
      renderEmergencyBootUI(container, {
        phase: 'DYNAMIC_IMPORT_RESOLUTION',
        error: importError,
      });
    });
}

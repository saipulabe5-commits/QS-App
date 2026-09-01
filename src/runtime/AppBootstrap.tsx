import { StrictMode, Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { diagnostics } from './BootShell';
import { lazyWithRetry } from '../utils/lazyImport';

// Dynamically import the App shell to isolate top-level failures.
// Uses a resilient retry wrapper to mitigate transient chunk loading errors
// in sandbox preview environments.
const App = lazyWithRetry(() => {
  diagnostics.log('APP_IMPORT_START', 'START', 'Mulai memuat modul utama aplikasi secara dinamis');
  return import('../App').then((mod) => {
    diagnostics.log('APP_IMPORT_SUCCESS', 'SUCCESS', 'Modul utama aplikasi berhasil dimuat');
    return { default: mod.default };
  });
});

export default function AppBootstrap() {
  return (
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<NativeReactLoadingFallback />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
}

function NativeReactLoadingFallback() {
  return (
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      background: '#0f172a', 
      color: '#f8fafc',
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{
        width: '40px', 
        height: '40px', 
        border: '3px solid rgba(59,130,246,0.2)', 
        borderTopColor: '#3b82f6', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite', 
        marginBottom: '16px'
      }}></div>
      <div style={{fontSize: '15px', fontWeight: 'bold'}}>Memuat Komponen Antarmuka...</div>
    </div>
  );
}

import React, { lazy, ComponentType } from 'react';
import { clearRuntimeCachesAndReload } from '../runtime/BootShell';

/**
 * Wraps a dynamic import with a retry mechanism for chunk load failures and duplicate React instance errors.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 2,
  interval = 500
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (retries: number) => {
        componentImport()
          .then((comp) => {
            // Clear reload flag on successful component resolution
            if (typeof window !== 'undefined') {
              try {
                sessionStorage.removeItem('rabpro_chunk_retry_reload');
              } catch {}
            }
            resolve(comp);
          })
          .catch((error) => {
            const errorMessage = (error && typeof error.message === 'string') ? error.message : String(error || '');
            const errorStack = (error && typeof error.stack === 'string') ? error.stack : '';

            const isChunkLoadError = 
              error?.name === 'ChunkLoadError' ||
              errorMessage.includes('dynamically imported module') ||
              errorMessage.includes('Failed to fetch dynamically imported module') ||
              errorMessage.includes('Importing a module script failed');

            const isReactInstanceError =
              errorMessage.includes('Cannot read properties of null') ||
              errorMessage.includes("reading 'useState'") ||
              errorMessage.includes('reading "useState"') ||
              errorMessage.includes('Invalid hook call') ||
              errorStack.includes("reading 'useState'") ||
              errorStack.includes('reading "useState"');

            const isRecoverableError = isChunkLoadError || isReactInstanceError;

            if (isRecoverableError && retries > 0) {
              console.warn(
                `[LAZY RETRY] Lazy import transient error (${errorMessage}). Retrying... (${retries} attempts left)`
              );
              setTimeout(() => attempt(retries - 1), interval);
            } else if (isRecoverableError && typeof window !== 'undefined') {
              // Pengaman tambahan: Jika percobaan habis, bersihkan runtime cache & reload sekali
              const RELOAD_KEY = 'rabpro_chunk_retry_reload';
              try {
                const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
                if (!alreadyReloaded) {
                  sessionStorage.setItem(RELOAD_KEY, '1');
                  console.warn('[LAZY RECOVERY] Clearing runtime caches and reloading to heal stale bundle/React instance...');
                  clearRuntimeCachesAndReload().catch(() => {
                    window.location.reload();
                  });
                  return;
                }
              } catch {}

              console.error(`[LAZY FATAL] Exhausted retries for lazy import: ${errorMessage}`);
              reject(error);
            } else {
              // Stop retrying and reject, ErrorBoundary (ViewFallback) will handle it.
              console.error(`[LAZY FATAL] Exhausted retries. Displaying manual fallback.`);
              reject(error);
            }
          });
      };
      attempt(retriesLeft);
    });
  });
}

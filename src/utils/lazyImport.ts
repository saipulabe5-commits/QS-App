import React, { lazy, ComponentType } from 'react';

/**
 * Wraps a dynamic import with a retry mechanism for chunk load failures.
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
          .then(resolve)
          .catch((error) => {
            const isChunkLoadError = 
                error.name === 'ChunkLoadError' ||
                (error.message && error.message.includes('dynamically imported module')) ||
               (error.message && error.message.includes('Failed to fetch dynamically imported module')) ||
               (error.message && error.message.includes('Importing a module script failed'));

            if (isChunkLoadError && retries > 0) {
              console.warn(`[CHUNK RETRY] Chunk load failed. Retrying... (${retries} attempts left)`);
              setTimeout(() => attempt(retries - 1), interval);
            } else {
              // Stop retrying and reject, ErrorBoundary (ViewFallback) will handle it.
              console.error(`[CHUNK FATAL] Exhausted retries. Displaying manual fallback.`);
              reject(error);
            }
          });
      };
      attempt(retriesLeft);
    });
  });
}

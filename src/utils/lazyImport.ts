import React, { lazy, ComponentType } from 'react';

/**
 * Wraps a dynamic import with a retry mechanism for chunk load failures.
 * This is crucial for Google AI Studio Preview environments where network
 * interruptions or aggressive caching can cause temporary failures.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retriesLeft = 3,
  interval = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attempt = (retries: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retries === 0) {
              reject(error);
              return;
            }
            
            // Check if it's a dynamic import failure (chunk load error)
            const isChunkLoadError = 
              error.name === 'ChunkLoadError' || 
              (error.message && error.message.includes('dynamically imported module')) ||
              (error.message && error.message.includes('Failed to fetch dynamically imported module')) ||
              (error.message && error.message.includes('Importing a module script failed'));

            if (isChunkLoadError) {
              console.warn(`[CHUNK RETRY] Chunk load failed. Retrying... (${retries} attempts left)`);
              // Force cache bust by appending a query string to the current URL if possible,
              // though for dynamic imports we just try again and hope the browser or service worker cleared it.
              setTimeout(() => attempt(retries - 1), interval);
            } else {
              // Not a chunk load error, reject immediately
              reject(error);
            }
          });
      };
      attempt(retriesLeft);
    });
  });
}

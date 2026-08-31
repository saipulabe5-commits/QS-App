/**
 * Utility untuk kompresi gambar client-side dan pengamanan kapasitas LocalStorage
 * Mencegah QuotaExceededError saat pengguna mengunggah gambar denah/CAD/foto proyek
 */

export async function compressImageBase64(
  dataUrl: string,
  maxWidth: number = 1400,
  maxHeight: number = 1400,
  quality: number = 0.78
): Promise<string> {
  // If not an image data url (e.g. PDF or plain string), return as is
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw image on white background for transparency safety
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG for best compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        resolve(dataUrl);
      };

      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/**
 * Penyimpan LocalStorage yang aman dari QuotaExceededError
 */
export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Gagal menyimpan kunci "${key}" ke LocalStorage:`, err?.message || err);

    // If quota exceeded, try cleaning stale large caches
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        console.info('[SafeStorage] Mencoba optimasi dan pembersihan cache...');
        // If the item being saved is drawings, remove huge fileUrl payloads in fallback
        if (Array.isArray(value) && value.length > 0 && 'fileUrl' in value[0]) {
          const stripped = value.map((item: any) => ({
            ...item,
            fileUrl: item.fileUrl && item.fileUrl.length > 1000 ? '' : item.fileUrl,
          }));
          window.localStorage.setItem(key, JSON.stringify(stripped));
          return true;
        }
      } catch (innerErr) {
        console.error('[SafeStorage] Tidak dapat menyimpan data ke LocalStorage:', innerErr);
      }
    }
    return false;
  }
}

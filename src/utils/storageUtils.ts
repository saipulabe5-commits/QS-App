/**
 * Safe LocalStorage access wrappers that gracefully handle
 * browser sandbox restrictions, private browsing, quota errors,
 * and data corruption detection/quarantine (RAB Pro V9 Hardened).
 */

export interface QuarantinedItem {
  key: string;
  corruptedValue: string;
  quarantinedAt: string;
  errorReason: string;
}

export function safeLocalStorageGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeLocalStorageGetJson<T = any>(key: string, defaultValue: T): T {
  const raw = safeLocalStorageGet(key);
  if (!raw) return defaultValue;
  try {
    return JSON.parse(raw) as T;
  } catch (err: any) {
    console.warn(`[SafeStorage Quarantine] Data pada kunci "${key}" rusak, memindahkan ke karantina:`, err?.message);
    quarantineCorruptedData(key, raw, err?.message || 'JSON Parse Failure');
    return defaultValue;
  }
}

export function quarantineCorruptedData(key: string, rawData: string, errorReason: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const quarantineKey = `quarantine_${key}_${Date.now()}`;
    const entry: QuarantinedItem = {
      key,
      corruptedValue: rawData.substring(0, 5000), // Protect space
      quarantinedAt: new Date().toISOString(),
      errorReason
    };
    window.localStorage.setItem(quarantineKey, JSON.stringify(entry));
  } catch {
    // Non-blocking
  }
}

export function safeLocalStorageSet(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (!window.localStorage) return false;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (err: any) {
    console.warn(`[SafeStorage] Gagal menyimpan kunci "${key}":`, err?.message || err);
    // In case of quota exceeded on large drawings, strip fileUrl payloads
    if (err?.name === 'QuotaExceededError' || err?.code === 22) {
      try {
        if (Array.isArray(value) && value.length > 0 && 'fileUrl' in value[0]) {
          const stripped = value.map((item: any) => ({
            ...item,
            fileUrl: item.fileUrl && item.fileUrl.length > 1000 ? '' : item.fileUrl,
          }));
          window.localStorage.setItem(key, JSON.stringify(stripped));
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (!window.localStorage) return;
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

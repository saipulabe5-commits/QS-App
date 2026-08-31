/**
 * Storage Adapter Interface
 * Memungkinkan pergantian storage engine secara fleksibel antara:
 * - LocalStorage / IndexedDB (Client-side offline-first)
 * - Cloud Database / REST API / Firestore / PostgreSQL (Backend)
 */
export interface StorageAdapter {
  getItem<T>(key: string, defaultValue: T): Promise<T>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'rab_app_v1_') {
    this.prefix = prefix;
  }

  async getItem<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (typeof window === 'undefined' || (!(() => { try { return !!window.localStorage; } catch (e) { return false; } })())) {
        return defaultValue;
      }
      const data = window.localStorage.getItem(this.prefix + key);
      if (data === null) return defaultValue;
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn(`[StorageAdapter] Gagal membaca data kunci: ${key}`, error);
      return defaultValue;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof window === 'undefined' || (!(() => { try { return !!window.localStorage; } catch (e) { return false; } })())) return;
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (error) {
      console.error(`[StorageAdapter] Gagal menyimpan data kunci: ${key}`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window === 'undefined' || (!(() => { try { return !!window.localStorage; } catch (e) { return false; } })())) return;
      window.localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error(`[StorageAdapter] Gagal menghapus kunci: ${key}`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined' || (!(() => { try { return !!window.localStorage; } catch (e) { return false; } })())) return;
      Object.keys(window.localStorage)
        .filter((k) => k.startsWith(this.prefix))
        .forEach((k) => window.localStorage.removeItem(k));
    } catch (error) {
      console.error('[StorageAdapter] Gagal mereset storage', error);
    }
  }
}

export const defaultStorage = new LocalStorageAdapter();

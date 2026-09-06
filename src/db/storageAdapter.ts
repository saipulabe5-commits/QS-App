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

export const STORAGE_KEYS = {
  USER: 'rabpro_user_v1',
  ACTIVE_PROJECT: 'rabpro_active_project_v1',
  PROJECTS: 'rabpro_projects_v1',
  RAB_ITEMS: 'rabpro_rab_items_v1',
  PRICES: 'rabpro_prices_v1',
  AHSP: 'rabpro_ahsp_v1',
  TEMPLATES: 'rabpro_templates_v1',
  RAB_TEMPLATES: 'rabpro_rab_templates_v1',
  IMPORT_JOBS: 'rabpro_import_jobs_v1',
  DRAWINGS: 'rabpro_drawings_v1',
  ANALYSES: 'rabpro_analyses_v1',
  SCURVES: 'rabpro_scurves_v1',
  SETTINGS: 'rabpro_settings_v1',
} as const;

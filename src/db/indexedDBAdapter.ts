/**
 * IndexedDB Storage Engine for RAB Pro Offline PWA
 * Mendukung penyimpanan lokal terstruktur berkapasitas besar dan bebas quota crash.
 */

const DB_NAME = 'rabpro_offline_db';
const DB_VERSION = 1;

export const DB_STORES = {
  PROJECTS: 'projects',
  RAB_ITEMS: 'rabItems',
  PRICES: 'priceDatabase',
  AHSP: 'ahspItems',
  TEMPLATES: 'templates',
  RAB_TEMPLATES: 'rabTemplates',
  DRAWINGS: 'drawings',
  ANALYSES: 'drawingAnalyses',
  SCURVES: 'scurves',
  REVISIONS: 'revisions',
  NOTIFICATIONS: 'notifications',
  SYNC_QUEUE: 'syncQueue',
  SYNC_CONFLICTS: 'syncConflicts',
  APP_METADATA: 'appMetadata',
} as const;

export type DBStoreName = typeof DB_STORES[keyof typeof DB_STORES];

class IndexedDBAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = true;

  constructor() {
    if (typeof window === 'undefined') { this.isAvailable = false; } else { try { if (!window.indexedDB) this.isAvailable = false; } catch (e) { this.isAvailable = false; } }
  }

  public isSupported(): boolean {
    if (!this.isAvailable || typeof window === 'undefined') return false; try { return !!window.indexedDB; } catch (e) { return false; }
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      throw new Error('IndexedDB tidak didukung pada browser ini.');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Store: projects
          if (!db.objectStoreNames.contains(DB_STORES.PROJECTS)) {
            db.createObjectStore(DB_STORES.PROJECTS, { keyPath: 'id' });
          }

          // Store: rabItems (Indexed by projectId)
          if (!db.objectStoreNames.contains(DB_STORES.RAB_ITEMS)) {
            const rabStore = db.createObjectStore(DB_STORES.RAB_ITEMS, { keyPath: 'id' });
            rabStore.createIndex('projectId', 'projectId', { unique: false });
          }

          // Store: priceDatabase
          if (!db.objectStoreNames.contains(DB_STORES.PRICES)) {
            db.createObjectStore(DB_STORES.PRICES, { keyPath: 'id' });
          }

          // Store: ahspItems
          if (!db.objectStoreNames.contains(DB_STORES.AHSP)) {
            db.createObjectStore(DB_STORES.AHSP, { keyPath: 'id' });
          }

          // Store: templates
          if (!db.objectStoreNames.contains(DB_STORES.TEMPLATES)) {
            db.createObjectStore(DB_STORES.TEMPLATES, { keyPath: 'id' });
          }

          // Store: rabTemplates
          if (!db.objectStoreNames.contains(DB_STORES.RAB_TEMPLATES)) {
            db.createObjectStore(DB_STORES.RAB_TEMPLATES, { keyPath: 'id' });
          }

          // Store: drawings
          if (!db.objectStoreNames.contains(DB_STORES.DRAWINGS)) {
            const drawStore = db.createObjectStore(DB_STORES.DRAWINGS, { keyPath: 'id' });
            drawStore.createIndex('projectId', 'projectId', { unique: false });
          }

          // Store: drawingAnalyses
          if (!db.objectStoreNames.contains(DB_STORES.ANALYSES)) {
            db.createObjectStore(DB_STORES.ANALYSES, { keyPath: 'id' });
          }

          // Store: scurves
          if (!db.objectStoreNames.contains(DB_STORES.SCURVES)) {
            db.createObjectStore(DB_STORES.SCURVES, { keyPath: 'projectId' });
          }

          // Store: revisions (Indexed by projectId and transactionId)
          if (!db.objectStoreNames.contains(DB_STORES.REVISIONS)) {
            const revStore = db.createObjectStore(DB_STORES.REVISIONS, { keyPath: 'id' });
            revStore.createIndex('projectId', 'projectId', { unique: false });
            revStore.createIndex('transactionId', 'transactionId', { unique: false });
          }

          // Store: notifications (Indexed by userId, isRead)
          if (!db.objectStoreNames.contains(DB_STORES.NOTIFICATIONS)) {
            const notifStore = db.createObjectStore(DB_STORES.NOTIFICATIONS, { keyPath: 'id' });
            notifStore.createIndex('userId', 'userId', { unique: false });
            notifStore.createIndex('isRead', 'isRead', { unique: false });
          }

          // Store: syncQueue (Indexed by status)
          if (!db.objectStoreNames.contains(DB_STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(DB_STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('status', 'status', { unique: false });
          }

          // Store: syncConflicts
          if (!db.objectStoreNames.contains(DB_STORES.SYNC_CONFLICTS)) {
            db.createObjectStore(DB_STORES.SYNC_CONFLICTS, { keyPath: 'id' });
          }

          // Store: appMetadata
          if (!db.objectStoreNames.contains(DB_STORES.APP_METADATA)) {
            db.createObjectStore(DB_STORES.APP_METADATA, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          this.isAvailable = false;
          reject(request.error);
        };
      });
    }

    return this.dbPromise;
  }

  public async getAll<T>(storeName: DBStoreName): Promise<T[]> {
    try {
      const db = await this.getDB();
      return new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();

        req.onsuccess = () => resolve((req.result || []) as T[]);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback getAll failed on store: ${storeName}`, e);
      return [];
    }
  }

  public async get<T>(storeName: DBStoreName, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);

        req.onsuccess = () => resolve(req.result ? (req.result as T) : null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback get failed on store: ${storeName}`, e);
      return null;
    }
  }

  public async put<T>(storeName: DBStoreName, item: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.put(item);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback put failed on store: ${storeName}`, e);
    }
  }

  public async putAll<T>(storeName: DBStoreName, items: T[]): Promise<void> {
    if (!items || items.length === 0) return;
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        items.forEach((item) => store.put(item));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback putAll failed on store: ${storeName}`, e);
    }
  }

  public async delete(storeName: DBStoreName, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(key);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback delete failed on store: ${storeName}`, e);
    }
  }

  public async clear(storeName: DBStoreName): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback clear failed on store: ${storeName}`, e);
    }
  }

  public async setAll<T>(storeName: DBStoreName, items: T[]): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        items.forEach((item) => store.put(item));

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.warn(`[IndexedDB] Fallback setAll failed on store: ${storeName}`, e);
    }
  }
}

export const idbStorage = new IndexedDBAdapter();

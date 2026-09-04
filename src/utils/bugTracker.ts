export interface BugLogEntry {
  id: string;
  timestamp: string;
  source: 'client' | 'server';
  severity: 'error' | 'warning' | 'info';
  category: 'runtime' | 'network' | 'react-error-boundary' | 'unhandled-rejection' | 'api-failure' | 'build' | 'other';
  message: string;
  stack?: string;
  componentStack?: string;
  route?: string;
  userAgent?: string;
  userEmail?: string;
  requestUrl?: string;
  requestMethod?: string;
  responseStatus?: number;
  metadata?: Record<string, any>;
}

class BugTracker {
  private readonly DB_NAME = 'RabProBugTrackerDB';
  private readonly STORE_NAME = 'bug_log';
  private readonly MAX_ENTRIES = 500;
  private dbPromise: Promise<IDBDatabase>;
  private listenersAttached = false;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public attachListeners() {
    if (this.listenersAttached) return;
    this.listenersAttached = true;

    window.addEventListener('error', (event) => {
      this.log({
        category: 'runtime',
        severity: 'error',
        message: event.message,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.log({
        category: 'unhandled-rejection',
        severity: 'error',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });
  }

  public async log(entryData: Omit<BugLogEntry, 'id' | 'timestamp' | 'source'>) {
    try {
      const entry: BugLogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        source: 'client',
        userAgent: navigator.userAgent,
        route: window.location.pathname,
        ...entryData,
      };

      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      store.add(entry);

      // Rotate
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > this.MAX_ENTRIES) {
          const cursorReq = store.openCursor();
          let toDelete = countReq.result - this.MAX_ENTRIES;
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && toDelete > 0) {
              cursor.delete();
              toDelete--;
              cursor.continue();
            }
          };
        }
      };
    } catch (error) {
      console.error('BugTracker failed to log:', error);
    }
  }

  public async getLogs(): Promise<BugLogEntry[]> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readonly');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          // sort descending by timestamp
          const res = (req.result as BugLogEntry[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          resolve(res);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('BugTracker getLogs failed:', e);
      return [];
    }
  }

  public async clearLogs(): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('BugTracker clearLogs failed:', e);
    }
  }
}

export const bugTracker = new BugTracker();

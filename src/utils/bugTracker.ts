export type BugStatus = 'open' | 'investigating' | 'resolved' | 'wont-fix';

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

  // V20 Lifecycle and Deduplication
  fingerprint: string;
  status: BugStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  resolutionNote?: string;
  resolvedAt?: string;
  resolvedInCommit?: string;
}

export function generateBugFingerprint(category: string, message: string, requestUrl?: string): string {
  // Normalize variable content: UUIDs, numbers, timestamps, query strings
  const cleanMsg = (message || '')
    .replace(/[0-9a-fA-F-]{36}/g, ':uuid:')
    .replace(/\b\d+\b/g, ':num:')
    .replace(/\?.*$/, '')
    .trim()
    .toLowerCase();
  const cleanUrl = (requestUrl || '')
    .split('?')[0]
    .replace(/[0-9a-fA-F-]{36}/g, ':uuid:')
    .trim()
    .toLowerCase();
  return `${category}__${cleanUrl}__${cleanMsg.slice(0, 120)}`;
}

class BugTracker {
  private readonly DB_NAME = 'RabProBugTrackerDB';
  private readonly STORE_NAME = 'bug_log';
  private readonly MAX_ENTRIES = 500;
  private dbPromise: Promise<IDBDatabase>;
  private listenersAttached = false;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 2);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('fingerprint', 'fingerprint', { unique: false });
        } else {
          const store = (event.target as any).transaction.objectStore(this.STORE_NAME);
          if (!store.indexNames.contains('fingerprint')) {
            store.createIndex('fingerprint', 'fingerprint', { unique: false });
          }
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

  public async log(entryData: Omit<BugLogEntry, 'id' | 'timestamp' | 'source' | 'fingerprint' | 'status' | 'firstSeenAt' | 'lastSeenAt' | 'occurrenceCount'> & { fingerprint?: string; status?: BugStatus }) {
    try {
      const now = new Date().toISOString();
      const fingerprint = entryData.fingerprint || generateBugFingerprint(entryData.category, entryData.message, entryData.requestUrl);

      const db = await this.dbPromise;
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);

      // Check for existing entry with the same fingerprint
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => {
        const items = getAllReq.result as BugLogEntry[];
        const existing = items.find(item => item.fingerprint === fingerprint);

        if (existing) {
          // Deduplicate: increment count and update lastSeenAt
          existing.occurrenceCount = (existing.occurrenceCount || 1) + 1;
          existing.lastSeenAt = now;
          existing.timestamp = now;
          // If bug was resolved and happens again, mark as investigating/open
          if (existing.status === 'resolved') {
            existing.status = 'open';
            existing.resolutionNote = `(Terjadi kembali setelah resolusi) ${existing.resolutionNote || ''}`.trim();
          }
          store.put(existing);
        } else {
          // Create brand new entry
          const newEntry: BugLogEntry = {
            id: crypto.randomUUID(),
            timestamp: now,
            firstSeenAt: now,
            lastSeenAt: now,
            occurrenceCount: 1,
            fingerprint,
            status: entryData.status || 'open',
            source: 'client',
            userAgent: navigator.userAgent,
            route: window.location.pathname,
            ...entryData,
          };
          store.add(newEntry);
        }

        // Maintain maximum capacity
        if (items.length > this.MAX_ENTRIES) {
          const sorted = items.sort((a, b) => new Date(a.lastSeenAt || a.timestamp).getTime() - new Date(b.lastSeenAt || b.timestamp).getTime());
          const toDelete = sorted.slice(0, items.length - this.MAX_ENTRIES);
          toDelete.forEach(d => store.delete(d.id));
        }
      };
    } catch (error) {
      console.error('BugTracker failed to log:', error);
    }
  }

  public async resolveBug(id: string, resolutionNote: string, commitHash?: string): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const entry = getReq.result as BugLogEntry | undefined;
          if (entry) {
            entry.status = 'resolved';
            entry.resolutionNote = resolutionNote;
            entry.resolvedAt = new Date().toISOString();
            if (commitHash) entry.resolvedInCommit = commitHash;
            store.put(entry);
            resolve(true);
          } else {
            resolve(false);
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (err) {
      console.error('BugTracker resolveBug failed:', err);
      return false;
    }
  }

  public async reopenBug(id: string): Promise<boolean> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.STORE_NAME, 'readwrite');
        const store = tx.objectStore(this.STORE_NAME);
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          const entry = getReq.result as BugLogEntry | undefined;
          if (entry) {
            entry.status = 'open';
            store.put(entry);
            resolve(true);
          } else {
            resolve(false);
          }
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch (err) {
      console.error('BugTracker reopenBug failed:', err);
      return false;
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
          // Normalize legacy entries without lifecycle fields
          const res = (req.result as BugLogEntry[]).map(item => ({
            ...item,
            fingerprint: item.fingerprint || generateBugFingerprint(item.category, item.message, item.requestUrl),
            status: item.status || 'open',
            firstSeenAt: item.firstSeenAt || item.timestamp,
            lastSeenAt: item.lastSeenAt || item.timestamp,
            occurrenceCount: item.occurrenceCount || 1,
          })).sort((a, b) => new Date(b.lastSeenAt || b.timestamp).getTime() - new Date(a.lastSeenAt || a.timestamp).getTime());
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

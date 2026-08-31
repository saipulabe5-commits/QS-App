import {
  SyncOperation,
  SyncConflict,
  SyncOperationType,
  SyncEntity,
  SyncStatusInfo,
  SyncPushResponse,
} from '../types';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { ZeroMistakeEngine } from './zeroMistakeEngine';

type SyncListener = (info: SyncStatusInfo) => void;

/**
 * OfflineSyncEngine
 * Menangani antrian perubahan data lokal, deteksi konektivitas, pengiriman delta ke backend,
 * dan penyelesaian konflik data dua arah.
 */
export class SyncService {
  private static listeners: Set<SyncListener> = new Set();
  private static isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private static isSyncing: boolean = false;
  private static lastSyncTime: string | null = null;
  private static deviceId: string = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 30) : 'device_local';

  /**
   * Inisialisasi listener network
   */
  static init(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    this.isOnline = navigator.onLine;
  }

  /**
   * Registrasi listener perubahan status sinkronisasi
   */
  static subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.getSyncStatus().then(listener);
    return () => this.listeners.delete(listener);
  }

  private static async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach((fn) => fn(status));
  }

  /**
   * Mendapatkan status sinkronisasi saat ini
   */
  static async getSyncStatus(): Promise<SyncStatusInfo> {
    const queue = await idbStorage.getAll<SyncOperation>(DB_STORES.SYNC_QUEUE);
    const conflicts = await idbStorage.getAll<SyncConflict>(DB_STORES.SYNC_CONFLICTS);

    const pendingCount = queue.filter((op) => op.status === 'pending' || op.status === 'processing').length;
    const failedCount = queue.filter((op) => op.status === 'failed').length;
    const conflictCount = conflicts.filter((c) => !c.resolvedAt).length;

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingCount,
      failedCount,
      conflictCount,
      mode: 'cloud',
    };
  }

  /**
   * Masukkan operasi baru ke dalam antrian sinkronisasi offline
   */
  static async enqueueOperation(params: {
    userId: string;
    projectId?: string;
    entity: SyncEntity;
    entityId: string;
    operation: SyncOperationType;
    payload: any;
    baseVersion?: number;
    localVersion?: number;
  }): Promise<SyncOperation> {
    const id = `sync_op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const checksum = ZeroMistakeEngine.generateChecksum(params.payload || {});

    const op: SyncOperation = {
      id,
      deviceId: this.deviceId,
      userId: params.userId,
      projectId: params.projectId,
      entity: params.entity,
      entityId: params.entityId,
      operation: params.operation,
      payload: params.payload,
      baseVersion: params.baseVersion || 1,
      localVersion: params.localVersion || 1,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
      checksum,
    };

    await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
    this.notifyListeners();

    // Jika online, coba jalankan sync otomatis di background
    if (this.isOnline) {
      setTimeout(() => this.processSyncQueue(), 200);
    }

    return op;
  }

  /**
   * Proses pengiriman antrian sinkronisasi ke server
   */
  static async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.isSyncing) return;

    const queue = await idbStorage.getAll<SyncOperation>(DB_STORES.SYNC_QUEUE);
    const pendingOps = queue.filter((op) => op.status === 'pending' || op.status === 'failed');

    if (pendingOps.length === 0) return;

    this.isSyncing = true;
    this.notifyListeners();

    try {
      // Tandai processing
      for (const op of pendingOps) {
        op.status = 'processing';
        op.lastAttemptAt = new Date().toISOString();
        await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
      }

      // Sync backend disabled for Local-First zero-cost architecture
      return;
      const response = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          userId: pendingOps[0].userId,
          operations: pendingOps,
        }),
      });

      if (response.ok) {
        const result: SyncPushResponse = await response.json();
        
        // Update status operasi yang diterima
        for (const opId of result.accepted) {
          const op = pendingOps.find((o) => o.id === opId);
          if (op) {
            op.status = 'synced';
            await idbStorage.delete(DB_STORES.SYNC_QUEUE, opId);
          }
        }

        // Simpan konflik jika ada
        if (result.conflicts && result.conflicts.length > 0) {
          for (const conflict of result.conflicts) {
            await idbStorage.put(DB_STORES.SYNC_CONFLICTS, conflict);
            const relatedOp = pendingOps.find((o) => o.id === conflict.syncOpId);
            if (relatedOp) {
              relatedOp.status = 'conflict';
              await idbStorage.put(DB_STORES.SYNC_QUEUE, relatedOp);
            }
          }
        }

        // Tandai failed jika ditolak
        if (result.rejected && result.rejected.length > 0) {
          for (const rej of result.rejected) {
            const op = pendingOps.find((o) => o.id === rej.id);
            if (op) {
              op.status = 'failed';
              op.error = rej.reason;
              op.retryCount += 1;
              await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
            }
          }
        }

        this.lastSyncTime = new Date().toISOString();
      } else {
        // Gagal terhubung ke API backend
        for (const op of pendingOps) {
          op.status = 'failed';
          op.error = `HTTP Error ${response.status}: Server backend tidak merespons.`;
          op.retryCount += 1;
          await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
        }
      }
    } catch (error: any) {
      console.warn('[OfflineSyncEngine] Proses sinkronisasi ditunda (koneksi terputus/offline):', error);
      for (const op of pendingOps) {
        op.status = 'failed';
        op.error = error?.message || 'Koneksi jaringan terputus';
        op.retryCount += 1;
        await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Selesaikan konflik data secara eksplisit
   */
  static async resolveConflict(params: {
    conflictId: string;
    strategy: 'use_local' | 'use_server' | 'manual_merge' | 'save_as_new';
    mergedData?: any;
    userId: string;
  }): Promise<void> {
    const conflict = await idbStorage.get<SyncConflict>(DB_STORES.SYNC_CONFLICTS, params.conflictId);
    if (!conflict) throw new Error('Konflik tidak ditemukan.');

    conflict.resolvedAt = new Date().toISOString();
    conflict.resolutionStrategy = params.strategy;
    conflict.resolvedData = params.mergedData || (params.strategy === 'use_local' ? conflict.localData : conflict.serverData);

    await idbStorage.put(DB_STORES.SYNC_CONFLICTS, conflict);

    // Hapus sync operation terkait dari antrian conflict
    await idbStorage.delete(DB_STORES.SYNC_QUEUE, conflict.syncOpId);

    // Masukkan operasi baru dengan hasil resolusi
    await this.enqueueOperation({
      userId: params.userId,
      projectId: conflict.projectId,
      entity: conflict.entity,
      entityId: conflict.entityId,
      operation: 'update',
      payload: conflict.resolvedData,
    });

    this.notifyListeners();
  }

  /**
   * Retry semua operasi yang berstatus failed
   */
  static async retryAllFailed(): Promise<void> {
    const queue = await idbStorage.getAll<SyncOperation>(DB_STORES.SYNC_QUEUE);
    for (const op of queue) {
      if (op.status === 'failed') {
        op.status = 'pending';
        op.error = undefined;
        await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
      }
    }
    this.notifyListeners();
    this.processSyncQueue();
  }

  /**
   * Retry satu operasi spesifik
   */
  static async retryOperation(opId: string): Promise<void> {
    const op = await idbStorage.get<SyncOperation>(DB_STORES.SYNC_QUEUE, opId);
    if (op) {
      op.status = 'pending';
      op.error = undefined;
      await idbStorage.put(DB_STORES.SYNC_QUEUE, op);
      this.notifyListeners();
      this.processSyncQueue();
    }
  }

  /**
   * Batalkan operasi di antrian
   */
  static async cancelOperation(opId: string): Promise<void> {
    await idbStorage.delete(DB_STORES.SYNC_QUEUE, opId);
    this.notifyListeners();
  }
}

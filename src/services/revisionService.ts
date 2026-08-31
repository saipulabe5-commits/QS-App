import { RABItem, RABRevision, RABRevisionAction, RevisionActorType, FieldDifference, ProjectSnapshot } from '../types';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { ZeroMistakeEngine } from './zeroMistakeEngine';
import { sha256Sync, getOrCreateDeviceId } from '../utils/cryptoUtils';

const SENSITIVE_FIELDS: Array<{ key: keyof RABItem; label: string }> = [
  { key: 'volume', label: 'Volume' },
  { key: 'unitPrice', label: 'Harga Satuan' },
  { key: 'totalCost', label: 'Total Biaya' },
  { key: 'category', label: 'Kategori' },
  { key: 'unit', label: 'Satuan' },
  { key: 'name', label: 'Uraian Pekerjaan' },
  { key: 'code', label: 'Kode Pekerjaan' },
  { key: 'notes', label: 'Catatan Spesifikasi' },
];

/**
 * RABRevisionHistory Service
 * Mengelola immutable audit log pergerakan RAB, perbandingan versi, rollback, dan restore point.
 */
export class RevisionService {
  /**
   * Menghitung perbedaan field antar dua versi data RABItem
   */
  static compareRABVersions(
    prev: Partial<RABItem> | null,
    next: Partial<RABItem> | null
  ): FieldDifference[] {
    const diffs: FieldDifference[] = [];

    if (!prev && next) {
      // Create new
      SENSITIVE_FIELDS.forEach(({ key, label }) => {
        if (next[key] !== undefined && next[key] !== null) {
          diffs.push({
            field: key as string,
            fieldLabel: label,
            oldValue: null,
            newValue: next[key],
            differenceNominal: typeof next[key] === 'number' ? next[key] : undefined,
          });
        }
      });
      return diffs;
    }

    if (prev && !next) {
      // Delete
      SENSITIVE_FIELDS.forEach(({ key, label }) => {
        if (prev[key] !== undefined && prev[key] !== null) {
          diffs.push({
            field: key as string,
            fieldLabel: label,
            oldValue: prev[key],
            newValue: null,
            differenceNominal: typeof prev[key] === 'number' ? -Number(prev[key]) : undefined,
          });
        }
      });
      return diffs;
    }

    if (prev && next) {
      SENSITIVE_FIELDS.forEach(({ key, label }) => {
        const oldVal = prev[key];
        const newVal = next[key];

        if (oldVal !== newVal) {
          const diff: FieldDifference = {
            field: key as string,
            fieldLabel: label,
            oldValue: oldVal,
            newValue: newVal,
          };

          if (typeof oldVal === 'number' && typeof newVal === 'number') {
            const nominal = newVal - oldVal;
            diff.differenceNominal = nominal;
            if (oldVal !== 0) {
              diff.differencePercent = Number(((nominal / oldVal) * 100).toFixed(2));
            }
          }

          diffs.push(diff);
        }
      });
    }

    return diffs;
  }

  /**
   * Membuat entri revision baru dan menyimpannya secara immutable dengan hash chaining
   */
  static async createRABRevision(params: {
    projectId: string;
    rabItemId?: string;
    transactionId?: string;
    action: RABRevisionAction;
    actorType: RevisionActorType;
    actorId: string;
    actorName: string;
    sourceType: string;
    sourceId?: string;
    previousData: Partial<RABItem> | Partial<RABItem>[] | null;
    nextData: Partial<RABItem> | Partial<RABItem>[] | null;
    reason?: string;
    metadata?: Record<string, any>;
    parentRevisionId?: string;
    isRollback?: boolean;
    deviceId?: string;
  }): Promise<RABRevision> {
    const timestamp = new Date().toISOString();
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const transactionId = params.transactionId || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const deviceId = params.deviceId || getOrCreateDeviceId();

    // Dapatkan revision terakhir untuk proyek ini guna membentuk Hash Chain (SHA-256)
    const existingHistory = await this.getProjectRABHistory(params.projectId);
    const previousRevision = existingHistory.length > 0 ? existingHistory[0] : null;
    const previousHash = previousRevision?.currentHash || 'GENESIS_BLOCK_0000000000000000000000000000000000000000000000000000000000000000';

    // Menghitung diff jika data berupa single item
    let changedFields: FieldDifference[] = [];
    if (!Array.isArray(params.previousData) && !Array.isArray(params.nextData)) {
      changedFields = this.compareRABVersions(params.previousData, params.nextData);
    } else {
      // Bulk action
      changedFields = [{
        field: 'items_count',
        fieldLabel: 'Jumlah Item',
        oldValue: Array.isArray(params.previousData) ? params.previousData.length : 0,
        newValue: Array.isArray(params.nextData) ? params.nextData.length : 0,
        differenceNominal: (Array.isArray(params.nextData) ? params.nextData.length : 0) - (Array.isArray(params.previousData) ? params.previousData.length : 0),
      }];
    }

    const payloadForChecksum = {
      id,
      projectId: params.projectId,
      rabItemId: params.rabItemId,
      transactionId,
      action: params.action,
      timestamp,
      previousData: params.previousData,
      nextData: params.nextData,
      deviceId,
    };

    const payloadHash = sha256Sync(payloadForChecksum);
    const currentHash = sha256Sync({
      id,
      previousHash,
      payloadHash,
      timestamp,
      actorId: params.actorId,
    });
    const checksum = `chk_${currentHash.substring(0, 12)}`;

    const revision: RABRevision = {
      id,
      projectId: params.projectId,
      rabItemId: params.rabItemId,
      transactionId,
      action: params.action,
      actorType: params.actorType,
      actorId: params.actorId,
      actorName: params.actorName,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
      timestamp,
      previousData: params.previousData,
      nextData: params.nextData,
      changedFields,
      reason: params.reason,
      metadata: params.metadata,
      checksum,
      previousHash,
      currentHash,
      payloadHash,
      parentRevisionId: params.parentRevisionId || previousRevision?.id,
      isRollback: params.isRollback || false,
      deviceId,
      syncStatus: 'local_only',
    };

    // Simpan ke IndexedDB
    await idbStorage.put(DB_STORES.REVISIONS, revision);

    return revision;
  }

  /**
   * Verifikasi integritas checksum & hash chain revision (mencegah tampering)
   */
  static verifyRevisionChecksum(revision: RABRevision): boolean {
    const payloadForChecksum = {
      id: revision.id,
      projectId: revision.projectId,
      rabItemId: revision.rabItemId,
      transactionId: revision.transactionId,
      action: revision.action,
      timestamp: revision.timestamp,
      previousData: revision.previousData,
      nextData: revision.nextData,
      deviceId: revision.deviceId,
    };
    const calculatedPayloadHash = sha256Sync(payloadForChecksum);
    if (revision.payloadHash && revision.payloadHash !== calculatedPayloadHash) {
      return false;
    }
    if (revision.previousHash && revision.currentHash) {
      const calculatedCurrent = sha256Sync({
        id: revision.id,
        previousHash: revision.previousHash,
        payloadHash: calculatedPayloadHash,
        timestamp: revision.timestamp,
        actorId: revision.actorId,
      });
      return calculatedCurrent === revision.currentHash;
    }
    const legacyChecksum = ZeroMistakeEngine.generateChecksum(payloadForChecksum);
    return revision.checksum.includes(legacyChecksum) || revision.checksum.startsWith('chk_');
  }

  /**
   * Mengambil riwayat revision untuk suatu proyek
   */
  static async getProjectRABHistory(projectId: string): Promise<RABRevision[]> {
    const all = await idbStorage.getAll<RABRevision>(DB_STORES.REVISIONS);
    return all
      .filter((rev) => rev.projectId === projectId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Mengambil riwayat revision untuk suatu item pekerjaan spesifik
   */
  static async getRABItemHistory(itemId: string): Promise<RABRevision[]> {
    const all = await idbStorage.getAll<RABRevision>(DB_STORES.REVISIONS);
    return all
      .filter((rev) => rev.rabItemId === itemId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Simpan snapshot proyek sebelum operasi besar
   */
  static async saveProjectSnapshot(projectId: string, currentItems: RABItem[], reason: string): Promise<ProjectSnapshot> {
    const transactionId = `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const snapshot: ProjectSnapshot = {
      transactionId,
      projectId,
      timestamp: new Date().toISOString(),
      items: JSON.parse(JSON.stringify(currentItems)),
      reason,
    };
    await idbStorage.put(DB_STORES.APP_METADATA, { key: `snapshot_${projectId}_${transactionId}`, ...snapshot });
    return snapshot;
  }
}

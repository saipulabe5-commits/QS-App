import { RABItem } from './rab';

export type RABRevisionAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'duplicate'
  | 'import'
  | 'apply_template'
  | 'apply_ai'
  | 'apply_ocr'
  | 'apply_price_db'
  | 'apply_ahsp'
  | 'bulk_update'
  | 'bulk_delete'
  | 'recalculate'
  | 'restore'
  | 'rollback'
  | 'sync_update';

export type RevisionActorType = 'user' | 'ai' | 'import' | 'ocr' | 'system' | 'sync';

export interface FieldDifference {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  differenceNominal?: number;
  differencePercent?: number;
}

export interface RABRevision {
  id: string;
  projectId: string;
  rabItemId?: string;
  transactionId: string;
  action: RABRevisionAction;
  actorType: RevisionActorType;
  actorId: string;
  actorName: string;
  sourceType: string;
  sourceId?: string;
  timestamp: string;
  previousData: Partial<RABItem> | Partial<RABItem>[] | null;
  nextData: Partial<RABItem> | Partial<RABItem>[] | null;
  changedFields: FieldDifference[];
  reason?: string;
  metadata?: Record<string, any>;
  checksum: string;
  previousHash?: string;
  currentHash?: string;
  payloadHash?: string;
  parentRevisionId?: string;
  isRollback?: boolean;
  deviceId: string;
  syncStatus: 'pending' | 'synced' | 'local_only';
}

export interface ProjectSnapshot {
  transactionId: string;
  projectId: string;
  timestamp: string;
  items: RABItem[];
  reason: string;
}

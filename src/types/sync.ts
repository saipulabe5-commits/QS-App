export type SyncOperationType =
  | 'create'
  | 'update'
  | 'delete'
  | 'restore'
  | 'bulk_update'
  | 'bulk_delete';

export type SyncEntity =
  | 'project'
  | 'rab_item'
  | 'price_item'
  | 'ahsp_item'
  | 'template'
  | 'drawing'
  | 'scurve'
  | 'revision';

export type SyncStatus =
  | 'pending'
  | 'processing'
  | 'synced'
  | 'failed'
  | 'conflict'
  | 'cancelled';

export interface SyncOperation {
  id: string;
  deviceId: string;
  userId: string;
  projectId?: string;
  entity: SyncEntity;
  entityId: string;
  operation: SyncOperationType;
  payload: any;
  baseVersion: number;
  localVersion: number;
  createdAt: string;
  retryCount: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  status: SyncStatus;
  error?: string;
  checksum: string;
}

export interface SyncConflict {
  id: string;
  syncOpId: string;
  entity: SyncEntity;
  entityId: string;
  projectId?: string;
  localData: any;
  serverData: any;
  conflictingFields: string[];
  createdAt: string;
  resolvedAt?: string;
  resolutionStrategy?: 'use_local' | 'use_server' | 'manual_merge' | 'save_as_new';
  resolvedData?: any;
}

export interface SyncPushRequest {
  deviceId: string;
  userId: string;
  operations: SyncOperation[];
}

export interface SyncPushResponse {
  success: boolean;
  serverTime: string;
  accepted: string[]; // operation ids
  rejected: Array<{ id: string; reason: string }>;
  conflicts: SyncConflict[];
  nextCursor: string | null;
  warnings: string[];
}

export interface SyncPullResponse {
  success: boolean;
  serverTime: string;
  changes: Array<{
    entity: SyncEntity;
    entityId: string;
    operation: SyncOperationType;
    version: number;
    data: any;
    updatedAt: string;
  }>;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface SyncStatusInfo {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  failedCount: number;
  conflictCount: number;
  mode: 'cloud' | 'local_only';
}

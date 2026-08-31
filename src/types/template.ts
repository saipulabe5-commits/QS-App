import { RABCategory } from './rab';

export type TemplateStatus = 'draft' | 'active' | 'archived';
export type TemplateVisibility = 'private' | 'team' | 'public';
export type VerificationStatus =
  | 'verified'
  | 'needs_verification'
  | 'error'
  | 'unverified'
  | 'adjusted'
  | 'rejected'
  | 'pending'
  | 'Belum diverifikasi'
  | 'Disetujui'
  | 'Perlu diperbaiki'
  | 'Ditolak';

export interface RABTemplateItem {
  id: string;
  templateId: string;
  parentId?: string;
  category: RABCategory;
  subcategory?: string;
  itemCode: string;
  description: string;
  unit: string;
  volume: number;
  unitPrice: number;
  calculatedAmount: number; // volume * unitPrice
  materialCoefficient?: number;
  laborCoefficient?: number;
  equipmentCoefficient?: number;
  notes?: string;
  priceSource?: string;
  sourceRowNumber?: number;
  confidenceScore?: number; // 0 - 100
  verificationStatus: VerificationStatus;
  validationWarnings?: string[];
  validationErrors?: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RABTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: string; // e.g. "1.0", "1.1", "2.0"
  snapshotData: {
    name: string;
    description: string;
    category: string;
    projectType: string;
    defaultOverhead: number;
    defaultProfit: number;
    defaultTax: number;
    estimatedTotal: number;
    items: RABTemplateItem[];
  };
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface RABTemplate {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  projectType: string;
  category: string;
  status: TemplateStatus;
  visibility: TemplateVisibility;
  sharedWithUserIds?: string[];
  isFavorite?: boolean;
  isBuiltIn?: boolean;
  version: string;
  sourceFileUrl?: string;
  sourceFileName?: string;
  sourceFileType?: 'excel' | 'csv' | 'pdf' | 'image' | 'manual';
  sourceFileSize?: number;
  verificationStatus: VerificationStatus;
  itemCount: number;
  estimatedTotal: number;
  defaultOverhead: number;
  defaultProfit: number;
  defaultTax: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  items: RABTemplateItem[];
  versions: RABTemplateVersion[];
}

export interface RABImportJob {
  id: string;
  userId: string;
  templateId?: string;
  fileName: string;
  fileType: 'xlsx' | 'xls' | 'csv' | 'pdf' | 'jpg' | 'jpeg' | 'png' | 'unknown';
  fileSize: number;
  fileDataUrl?: string; // base64 preview for image/pdf
  status: 'pending' | 'processing' | 'parsed' | 'verified' | 'failed' | 'saved';
  progress: number; // 0 - 100
  totalRows: number;
  processedRows: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  errorDetails: string[];
  warnings: string[];
  detectedHeaders: string[];
  columnMapping: Record<string, string>;
  rawRows: any[];
  parsedItems: RABTemplateItem[];
  fileCalculatedTotal: number;
  systemCalculatedTotal: number;
  totalDifference: number;
  confidenceScore: number;
  categorySubtotals: Record<string, number>;
  createdAt: string;
  completedAt?: string;
}

export interface ColumnMappingConfig {
  itemCode?: string;
  description: string;
  category?: string;
  subcategory?: string;
  unit?: string;
  volume?: string;
  unitPrice?: string;
  calculatedAmount?: string;
  materialCoefficient?: string;
  laborCoefficient?: string;
  equipmentCoefficient?: string;
  overhead?: string;
  profit?: string;
  tax?: string;
  notes?: string;
  priceSource?: string;
}

// Backwards-compatible interface with existing code
export interface ProjectTemplate {
  id: string;
  userId?: string;
  name: string;
  description: string;
  category: string;
  projectType: string;
  isBuiltIn?: boolean;
  defaultOverhead: number;
  defaultProfit: number;
  defaultTax: number;
  items: Array<{
    code: string;
    name: string;
    category: RABCategory;
    unit: string;
    volume: number;
    unitPrice: number;
    notes?: string;
  }>;
}

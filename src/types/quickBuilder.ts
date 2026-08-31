import { RABCategory, RABItem } from './rab';
import { Project } from './project';

export type QuickBuilderMethod =
  | 'blank'
  | 'template'
  | 'building_type'
  | 'ai_estimator'
  | 'import_doc'
  | 'standard_list';

export type BuildingTypeOption =
  | 'residential_single_storey'
  | 'residential_two_storey'
  | 'residential_luxury'
  | 'shophouse'
  | 'office_renovation'
  | 'steel_warehouse'
  | 'simple_house_36_45';

export interface QuickBuilderProjectData {
  name: string;
  documentNo: string;
  clientName: string;
  location: string;
  projectType: string;
  buildingArea: number;
  areaUnit: string;
  startDate: string;
  endDate: string;
  targetBudget: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
  notes?: string;
}

export interface CustomCategoryItem {
  id: string;
  name: string;
  isActive: boolean;
}

export interface QuickBuilderDraftItem extends RABItem {
  sourceType: 'template' | 'ahsp' | 'price_db' | 'standard' | 'ai' | 'ocr' | 'manual';
  sourceId?: string;
  sourceDrawingId?: string;
  sourceDocumentId?: string;
  sourceTemplateId?: string;
  sourcePriceItemId?: string;
  sourceAHSPId?: string;
  confidence?: number; // 0 - 100
  needsVerification?: boolean;
  assumptions?: string[];
  warnings?: string[];
  isDuplicate?: boolean;
  isInvalid?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickBuilderStepValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QuickBuilderSummary {
  itemCount: number;
  categoryCount: number;
  directCost: number;
  overheadCost: number;
  profitCost: number;
  subtotalBeforeTax: number;
  taxCost: number;
  grandTotal: number;
  targetBudget: number;
  budgetVariance: number; // grandTotal - targetBudget
  budgetUsagePercent: number; // (grandTotal / targetBudget) * 100
  warningCount: number;
  needsVerificationCount: number;
  duplicateCount: number;
  invalidCount: number;
}

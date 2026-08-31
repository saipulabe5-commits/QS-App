export const RAB_CATEGORIES = [
  'Pekerjaan Persiapan',
  'Pekerjaan Tanah',
  'Pekerjaan Pondasi',
  'Pekerjaan Struktur',
  'Pekerjaan Dinding',
  'Pekerjaan Lantai',
  'Pekerjaan Atap',
  'Pekerjaan Plafon',
  'Pekerjaan Pintu dan Jendela',
  'Pekerjaan Instalasi Listrik',
  'Pekerjaan Sanitasi',
  'Pekerjaan Pengecatan',
  'Pekerjaan Akhir',
  'Pekerjaan Persiapan & Sipil',
  'Pekerjaan Jalan',
  'Pekerjaan Saluran',
  'Pekerjaan Plambing',
  'Pekerjaan Elektrikal',
  'Pekerjaan Lansekap',
  'Lain-lain',
] as const;

export type RABCategory = typeof RAB_CATEGORIES[number];

export interface RABItem {
  id: string;
  projectId: string;
  code: string;
  name: string;
  category: RABCategory;
  unit: string;
  volume: number;
  unitPrice: number;
  totalCost: number; // calculated: volume * unitPrice
  weightPercent?: number; // calculated relative to total direct cost
  notes?: string;
  sortOrder?: number;
  sourceType?: 'template' | 'ahsp' | 'price_db' | 'standard' | 'ai' | 'ocr' | 'manual' | 'sync';
  sourceId?: string;
  sourceDrawingId?: string;
  sourceDocumentId?: string;
  sourceTemplateId?: string;
  sourcePriceItemId?: string;
  sourceAHSPId?: string;
  confidence?: number;
  needsVerification?: boolean;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
  assumptions?: string[];
  warnings?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySummary {
  category: string;
  itemCount: number;
  subtotal: number;
  weightPercent: number;
}

export interface RABCalculationResult {
  directCost: number;
  overheadPercent: number;
  overheadCost: number;
  profitPercent: number;
  profitCost: number;
  subtotalBeforeTax: number;
  taxPercent: number;
  taxCost: number;
  grandTotal: number;
  categorySummaries: CategorySummary[];
  itemsWithCalculations: RABItem[];
}

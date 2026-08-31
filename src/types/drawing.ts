import { RABCategory } from './rab';

export type DrawingCategory =
  | 'Denah'
  | 'Tampak'
  | 'Potongan'
  | 'Detail Struktur'
  | 'Detail Pondasi'
  | 'Detail Kolom & Balok'
  | 'Detail Atap'
  | 'Detail Arsitektur'
  | 'Gambar Kerja'
  | 'Foto Lapangan'
  | 'Dokumen PDF'
  | 'Lainnya';

export type DrawingVerificationStatus =
  | 'unverified'
  | 'verified'
  | 'adjusted'
  | 'rejected'
  | 'Belum diverifikasi'
  | 'Disetujui'
  | 'Perlu diperbaiki'
  | 'Ditolak';


export interface DetectedDrawingElement {
  id?: string;
  category?: string;
  name?: string;
  location?: string;
  dimensionsText?: string;
  confidence?: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface ExtractedDimension {
  component?: string;
  dimension?: string;
  notes?: string;
  label?: string;
  value?: number;
  unit?: string;
  source?: string;
}

export interface EstimatedDrawingItem {
  id: string;
  drawingId: string;
  workCode?: string;
  workName?: string;
  category?: RABCategory | string;
  unit: string;
  volume: number;
  unitPrice: number;
  totalPrice?: number;
  formulaExplanation?: string;
  userNotes?: string;
  verificationStatus: DrawingVerificationStatus;
  // Aliases for initial/legacy compatibility
  element?: string;
  workDescription?: string;
  rabCategory?: string;
  rabCode?: string;
  location?: string;
  dimensions?: string;
  totalCost?: number;
  calculationBasis?: string;
  confidenceScore?: number;
  isDirectMeasurement?: boolean;
  verificationNotes?: string;
  transferredToRAB?: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  matchedAHSPCode?: string;
}

export interface DrawingAnalysis {
  id: string;
  drawingId: string;
  projectId?: string;
  fileName?: string;
  status?: 'idle' | 'analyzing' | 'processing' | 'completed' | 'failed' | 'pending' | string;
  analyzedAt?: string;
  scaleDetected?: string;
  summary?: string;
  detectedElements?: (string | DetectedDrawingElement)[];
  extractedDimensions?: ExtractedDimension[];
  estimatedItems?: EstimatedDrawingItem[];
  totalEstimatedCost?: number;
  estimatedTotal?: number;
  createdAt?: string;
  updatedAt?: string;
  analysisDate?: string;
  drawingTitle?: string;
  drawingTypeDetected?: string;
  assumptions?: string[];
  confidenceScore?: number;
  qualityWarning?: string;
  verificationStatus?: DrawingVerificationStatus;
  verifiedBy?: string;
  estimatedVolumes?: EstimatedDrawingItem[];
  rawAIResponse?: string;
}

export interface ProjectDrawing {
  id: string;
  projectId: string;
  title?: string;
  fileName: string;
  fileUrl?: string;
  fileData?: string;
  fileType: string;
  fileSize: string | number;
  scale?: string;
  category: DrawingCategory;
  description?: string;
  uploadDate?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  analysisStatus: 'idle' | 'analyzing' | 'processing' | 'completed' | 'failed' | 'pending';
  analysisId?: string;
}

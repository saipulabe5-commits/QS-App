export type ProjectStatus = 'Draft' | 'Berjalan' | 'Selesai';

export interface Project {
  id: string;
  userId: string;
  name: string;
  documentNo: string;
  clientName: string;
  location: string;
  contractor: string;
  consultant: string;
  createdAt: string;
  updatedAt?: string;
  startDate: string;
  endDate: string;
  notes: string;
  status: ProjectStatus;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
  targetBudget?: number;
  projectType?: string;
  buildingArea?: number;
  areaUnit?: string;
  // Aliases for compatibility
  docNumber?: string;
  documentNumber?: string;
  client?: string;
  ownerName?: string;
  contractorName?: string;
}

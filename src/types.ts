// Re-export all modular types for seamless backward compatibility
export * from './types/index';

export interface ProjectCalculation {
  subtotal: number;
  overheadValue: number;
  profitValue: number;
  ppnValue: number;
  grandTotal: number;
  totalMaterial?: number;
  totalLabor?: number;
  totalEquipment?: number;
}

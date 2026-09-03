import { Project, RABItem, ProjectCalculation } from '../types';

export interface AuditAnomaly {
  type: 'price_deviation' | 'zero_volume' | 'zero_price' | 'duplicate_item' | 'oh_profit_inconsistency';
  severity: 'warning' | 'fatal';
  message: string;
  itemId?: string;
  itemName?: string;
}

export interface FinancialAuditResult {
  isClean: boolean;
  anomalies: AuditAnomaly[];
  requiresAIReview: boolean;
}

export function runDeterministicAudit(project: Project, items: RABItem[], calc: ProjectCalculation): FinancialAuditResult {
  const anomalies: AuditAnomaly[] = [];

  // 1. Detect item with zero volume or zero price
  items.forEach(item => {
    if (item.volume <= 0) {
      anomalies.push({
        type: 'zero_volume',
        severity: 'fatal',
        message: `Item memiliki volume 0 namun masuk ke RAB akhir.`,
        itemId: item.id,
        itemName: item.name
      });
    }
    if (item.unitPrice <= 0) {
      anomalies.push({
        type: 'zero_price',
        severity: 'fatal',
        message: `Item memiliki harga satuan 0.`,
        itemId: item.id,
        itemName: item.name
      });
    }
  });

  // 2. Detect duplicates
  const seenNames = new Set<string>();
  items.forEach(item => {
    const key = `${item.category}-${item.name.toLowerCase().trim()}`;
    if (seenNames.has(key)) {
      anomalies.push({
        type: 'duplicate_item',
        severity: 'warning',
        message: `Item berpotensi duplikat (nama dan kategori sama).`,
        itemId: item.id,
        itemName: item.name
      });
    }
    seenNames.add(key);
  });

  // 3. Check OH & Profit Consistency
  // Re-calculate expected grand total based on subtotal + OH + Profit
  const expectedGrandTotal = calc.subtotal + calc.overheadValue + calc.profitValue;
  if (Math.abs(expectedGrandTotal - calc.grandTotal) > 1) { // 1 rupiah tolerance
    anomalies.push({
      type: 'oh_profit_inconsistency',
      severity: 'fatal',
      message: `Terdapat inkonsistensi kalkulasi Overhead & Profit. Diharapkan: ${expectedGrandTotal}, Aktual: ${calc.grandTotal}`
    });
  }

  // 4. (Simulated) Price deviation - normally we check against a median price DB
  // For now, we rely on the PriceDatabase or assume standard if too high.

  const isClean = anomalies.length === 0;
  return {
    isClean,
    anomalies,
    requiresAIReview: anomalies.length > 0
  };
}

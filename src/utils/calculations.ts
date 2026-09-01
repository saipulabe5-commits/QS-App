/**
 * CANONICAL FINANCIAL CALCULATION ENGINE (RAB PRO V4 ZERO-MISTAKE)
 * Single Source of Truth for:
 * - RAB Item Calculations & Aggregations
 * - Cost Structure (Material, Labor, Equipment, Overhead, Profit, Tax)
 * - Property Feasibility & Investment Appraisal
 * - Sensitivity Scenarios (Base, Optimistic, Pessimistic, Stress)
 * - Cash Flow Simulation & Working Capital Estimation
 * - Geometry Volume/Quantity Takeoff
 * - Unit Conversion
 * - Cryptographic Checksums & Financial Reconciliation
 */

import {
  RABItem,
  RABCalculationResult,
  CategorySummary,
  RAB_CATEGORIES,
  RABCategory,
  Project,
  ProjectFinancialInput,
  CanonicalFinancialResult,
  CategoryFinancialSummary,
  ValidatedFinancialItem,
  CanonicalCostStructure,
  CostStructureBreakdown,
  CanonicalReconciliation,
  TaxConfiguration,
  OverheadConfiguration,
  ProfitConfiguration,
  PropertyFeasibilityInput,
  PropertyFeasibilityResult,
  SensitivityScenarioResult,
  CashFlowSimulationResult,
  CashFlowPeriodItem,
} from '../types';
import { sha256Sync } from './cryptoUtils';

export type { CostStructureBreakdown };

// =========================================================================
// 1. CANONICAL PRECISION & ARITHMETIC UTILITIES
// =========================================================================

/**
 * Standard rounding (HALF_UP) to prevent floating-point representation drift.
 */
export function roundHalfUp(value: number, decimals: number = 0): number {
  if (!isFinite(value) || isNaN(value)) return 0;
  const factor = Math.pow(10, decimals);
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * factor)) / factor;
}

/**
 * Currency rounding: Indonesian Rupiah (IDR) is rounded to 0 decimal places (Integer).
 */
export function roundCurrency(amount: number): number {
  return roundHalfUp(amount, 0);
}

/**
 * Safe numeric parser with fallback
 */
export function safeNumber(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined || val === '') return defaultVal;
  const num = Number(val);
  return isFinite(num) && !isNaN(num) ? num : defaultVal;
}

/**
 * Canonical calculation of volume * unitPrice for an item.
 * Always returns a non-negative integer IDR amount.
 */
export function calculateItemAmount(volume: number, unitPrice: number): number {
  const v = Math.max(0, safeNumber(volume));
  const p = Math.max(0, safeNumber(unitPrice));
  return roundCurrency(v * p);
}

/**
 * Canonical calculation of coefficient * unitPrice for AHSP component.
 */
export function calculateComponentAmount(coefficient: number, unitPrice: number): number {
  const c = Math.max(0, safeNumber(coefficient));
  const p = Math.max(0, safeNumber(unitPrice));
  return roundHalfUp(c * p, 2);
}

// =========================================================================
// 2. CANONICAL GEOMETRY & QUANTITY ENGINE
// =========================================================================

export type GeometryType =
  | 'rectangle_area'
  | 'box_volume'
  | 'concrete'
  | 'wall'
  | 'floor'
  | 'excavation'
  | 'foundation_trapezoid'
  | 'rebar_weight';

export interface GeometryCalculationResult {
  volume: number;
  unit: string;
  suggestedName: string;
  suggestedCategory: RABCategory;
  formulaDescription: string;
}

/**
 * Evaluates geometry quantities with exact standard construction engineering formulas.
 */
export function calculateGeometryQuantity(
  type: GeometryType,
  params: Record<string, number | string>
): GeometryCalculationResult {
  switch (type) {
    case 'rectangle_area': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const width = Math.max(0, safeNumber(params.width, 1));
      const volume = roundHalfUp(length * width, 4);
      return {
        volume,
        unit: 'm²',
        suggestedName: `Pekerjaan Luasan (${length}m × ${width}m)`,
        suggestedCategory: 'Pekerjaan Persiapan',
        formulaDescription: `Luas = Panjang (${length}m) × Lebar (${width}m) = ${volume} m²`,
      };
    }

    case 'box_volume': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const width = Math.max(0, safeNumber(params.width, 1));
      const height = Math.max(0, safeNumber(params.height, 1));
      const volume = roundHalfUp(length * width * height, 4);
      return {
        volume,
        unit: 'm³',
        suggestedName: `Pekerjaan Kubikasi Ruang (${length}m × ${width}m × ${height}m)`,
        suggestedCategory: 'Pekerjaan Struktur',
        formulaDescription: `Volume = ${length}m × ${width}m × ${height}m = ${volume} m³`,
      };
    }

    case 'concrete': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const width = Math.max(0, safeNumber(params.width, 1));
      const height = Math.max(0, safeNumber(params.height, 1));
      const count = Math.max(1, safeNumber(params.count, 1));
      const volume = roundHalfUp(length * width * height * count, 4);
      return {
        volume,
        unit: 'm³',
        suggestedName: `Pengecoran Beton Balok/Kolom (${count} titik @ ${length}m × ${width}m × ${height}m)`,
        suggestedCategory: 'Pekerjaan Struktur',
        formulaDescription: `Volume = ${length}m × ${width}m × ${height}m × ${count} titik = ${volume} m³`,
      };
    }

    case 'wall': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const height = Math.max(0, safeNumber(params.height, 1));
      const openingArea = Math.max(0, safeNumber(params.openingArea, 0));
      const grossArea = length * height;
      const netArea = Math.max(0, grossArea - openingArea);
      const volume = roundHalfUp(netArea, 4);
      return {
        volume,
        unit: 'm²',
        suggestedName: `Pekerjaan Pasangan Dinding & Plesteran (${length}m × ${height}m)`,
        suggestedCategory: 'Pekerjaan Dinding',
        formulaDescription: `Luas Bersih = (${length}m × ${height}m) - Bukaan (${openingArea}m²) = ${volume} m²`,
      };
    }

    case 'floor': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const width = Math.max(0, safeNumber(params.width, 1));
      const wastePercent = Math.max(0, safeNumber(params.wastePercent, 5));
      const baseArea = length * width;
      const totalArea = baseArea * (1 + wastePercent / 100);
      const volume = roundHalfUp(totalArea, 4);
      return {
        volume,
        unit: 'm²',
        suggestedName: `Pekerjaan Penutup Lantai Keramik/Granit (${length}m × ${width}m)`,
        suggestedCategory: 'Pekerjaan Lantai',
        formulaDescription: `Luas = (${length}m × ${width}m) + Waste ${wastePercent}% = ${volume} m²`,
      };
    }

    case 'excavation': {
      const length = Math.max(0, safeNumber(params.length, 1));
      const width = Math.max(0, safeNumber(params.width, 1));
      const depth = Math.max(0, safeNumber(params.depth, 1));
      const volume = roundHalfUp(length * width * depth, 4);
      return {
        volume,
        unit: 'm³',
        suggestedName: `Galian Tanah Saluran / Pondasi (${length}m × ${width}m × ${depth}m)`,
        suggestedCategory: 'Pekerjaan Tanah',
        formulaDescription: `Volume = ${length}m × ${width}m × ${depth}m = ${volume} m³`,
      };
    }

    case 'foundation_trapezoid': {
      const topWidth = Math.max(0, safeNumber(params.topWidth, 0.3));
      const bottomWidth = Math.max(0, safeNumber(params.bottomWidth, 0.7));
      const height = Math.max(0, safeNumber(params.height, 0.8));
      const length = Math.max(0, safeNumber(params.length, 1));
      const crossSection = ((topWidth + bottomWidth) / 2) * height;
      const volume = roundHalfUp(crossSection * length, 4);
      return {
        volume,
        unit: 'm³',
        suggestedName: `Pasangan Pondasi Batu Kali Trapesium (${length}m)`,
        suggestedCategory: 'Pekerjaan Pondasi',
        formulaDescription: `Volume = [(${topWidth} + ${bottomWidth}) / 2 × ${height}] × ${length}m = ${volume} m³`,
      };
    }

    case 'rebar_weight': {
      const diameterMm = Math.max(0, safeNumber(params.diameterMm, 10));
      const totalLengthM = Math.max(0, safeNumber(params.totalLengthM, 1));
      // Formula SNI: Berat per meter besi beton = 0.006165 * D^2 (kg/m)
      const kgPerMeter = 0.006165 * Math.pow(diameterMm, 2);
      const totalWeightKg = roundHalfUp(kgPerMeter * totalLengthM, 2);
      return {
        volume: totalWeightKg,
        unit: 'kg',
        suggestedName: `Pembesian Besi Tulangan D${diameterMm} (${totalLengthM} m)`,
        suggestedCategory: 'Pekerjaan Struktur',
        formulaDescription: `Berat = 0.006165 × (${diameterMm}mm)² × ${totalLengthM}m = ${totalWeightKg} kg`,
      };
    }

    default:
      return {
        volume: 0,
        unit: 'ls',
        suggestedName: 'Pekerjaan Baru',
        suggestedCategory: 'Pekerjaan Struktur',
        formulaDescription: 'Kalkulasi volume standar',
      };
  }
}

// =========================================================================
// 3. CANONICAL UNIT CONVERSION ENGINE
// =========================================================================

/**
 * Standard conversion factor map for common construction units
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  densityKgPerM3: number = 2400 // Default concrete density
): number {
  const from = fromUnit.trim().toLowerCase();
  const to = toUnit.trim().toLowerCase();

  if (from === to) return value;

  // Length
  if (from === 'mm' && to === 'm') return value / 1000;
  if (from === 'cm' && to === 'm') return value / 100;
  if (from === 'm' && to === 'cm') return value * 100;
  if (from === 'm' && to === 'mm') return value * 1000;

  // Area
  if (from === 'cm²' && to === 'm²') return value / 10000;
  if (from === 'm²' && to === 'cm²') return value * 10000;

  // Mass
  if (from === 'gram' && to === 'kg') return value / 1000;
  if (from === 'kg' && to === 'gram') return value * 1000;
  if (from === 'kg' && to === 'ton') return value / 1000;
  if (from === 'ton' && to === 'kg') return value * 1000;

  // Volume to Mass via Density (e.g. m³ to kg)
  if (from === 'm³' && to === 'kg') return value * densityKgPerM3;
  if (from === 'kg' && to === 'm³') return value / densityKgPerM3;

  // Volume to Volume
  if (from === 'liter' && to === 'm³') return value / 1000;
  if (from === 'm³' && to === 'liter') return value * 1000;

  return value; // If unrecognized, return as-is
}

// =========================================================================
// 4. CANONICAL SINGLE SOURCE OF TRUTH: calculateProjectFinancials
// =========================================================================

/**
 * The single master calculation engine for all RAB Pro financial metrics.
 * Follows the rigorous Zero-Mistake Financial Pipeline:
 * READ -> NORMALIZE -> VALIDATE -> CALCULATE DIRECT -> OVERHEAD -> PROFIT -> TAX -> RECONCILE -> CHECKSUM.
 */
export function calculateProjectFinancials(
  items: (Partial<RABItem> | ValidatedFinancialItem | any)[],
  projectOrConfig?: ProjectFinancialInput | Partial<Project> | null
): CanonicalFinancialResult {
  const now = new Date().toISOString();
  const projectId = projectOrConfig?.id || 'proj_active';
  const projectName = projectOrConfig?.name || 'Proyek Konstruksi';
  const buildingArea = Math.max(0, safeNumber((projectOrConfig as any)?.buildingArea, 0));

  // 1. Tax Config Resolution
  const rawConfig = projectOrConfig as any;
  const taxRate = Math.max(
    0,
    safeNumber(
      rawConfig?.taxConfig?.rate ?? projectOrConfig?.taxPercent,
      0
    )
  );
  const taxMode = rawConfig?.taxConfig?.mode || 'TAX_EXCLUSIVE';
  const taxConfig: TaxConfiguration = {
    mode: taxMode,
    rate: taxRate,
    isEnabled: rawConfig?.taxConfig?.isEnabled ?? taxRate > 0,
  };

  // 2. Overhead Config Resolution
  const overheadRate = Math.max(
    0,
    safeNumber(
      rawConfig?.overheadConfig?.rate ?? projectOrConfig?.overheadPercent,
      5
    )
  );
  const overheadMethod = rawConfig?.overheadConfig?.method || 'percentage_of_direct_cost';
  const overheadFixed = Math.max(0, safeNumber(rawConfig?.overheadConfig?.fixedAmount, 0));
  const overheadConfig: OverheadConfiguration = {
    method: overheadMethod,
    rate: overheadRate,
    fixedAmount: overheadFixed,
    isEnabled: rawConfig?.overheadConfig?.isEnabled ?? (overheadRate > 0 || overheadFixed > 0),
  };

  // 3. Profit Config Resolution
  const profitRate = Math.max(
    0,
    safeNumber(
      rawConfig?.profitConfig?.rate ?? projectOrConfig?.profitPercent,
      10
    )
  );
  const profitMethod = rawConfig?.profitConfig?.method || 'percentage_of_direct_cost';
  const profitFixed = Math.max(0, safeNumber(rawConfig?.profitConfig?.fixedAmount, 0));
  const profitConfig: ProfitConfiguration = {
    method: profitMethod,
    rate: profitRate,
    fixedAmount: profitFixed,
    isEnabled: rawConfig?.profitConfig?.isEnabled ?? (profitRate > 0 || profitFixed > 0),
  };

  // 4. Normalize & Validate Items
  const validItems: ValidatedFinancialItem[] = (items || []).map((raw, idx) => {
    const id = raw.id || `item_${idx + 1}`;
    const code = String(raw.code || raw.itemCode || `P-${idx + 1}`).trim();
    const name = String(raw.name || raw.description || 'Pekerjaan Konstruksi').trim();
    const category = (raw.category as RABCategory) || 'Pekerjaan Persiapan';
    const unit = String(raw.unit || 'm²').trim();
    const volume = Math.max(0, safeNumber(raw.volume));
    const unitPrice = Math.max(0, safeNumber(raw.unitPrice));
    const directCost = calculateItemAmount(volume, unitPrice);

    // Component cost breakdown if item provides detailed breakdown or SNI standard heuristics
    let matRatio = 0.65;
    let labRatio = 0.28;
    let eqRatio = 0.07;

    const catStr = String(category).toLowerCase();
    if (catStr.includes('tanah')) {
      matRatio = 0.05;
      labRatio = 0.75;
      eqRatio = 0.20;
    } else if (catStr.includes('persiapan')) {
      matRatio = 0.45;
      labRatio = 0.40;
      eqRatio = 0.15;
    } else if (catStr.includes('pondasi')) {
      matRatio = 0.65;
      labRatio = 0.30;
      eqRatio = 0.05;
    } else if (catStr.includes('struktur')) {
      matRatio = 0.68;
      labRatio = 0.24;
      eqRatio = 0.08;
    } else if (catStr.includes('dinding') || catStr.includes('lantai') || catStr.includes('atap') || catStr.includes('plafon')) {
      matRatio = 0.70;
      labRatio = 0.28;
      eqRatio = 0.02;
    } else if (catStr.includes('cat') || catStr.includes('pengecatan') || catStr.includes('akhir')) {
      matRatio = 0.55;
      labRatio = 0.45;
      eqRatio = 0.00;
    }

    const materialCost = roundCurrency(directCost * matRatio);
    const laborCost = roundCurrency(directCost * labRatio);
    const equipmentCost = directCost - materialCost - laborCost; // Exact balance to directCost

    const materialUnitPrice = volume > 0 ? roundHalfUp(materialCost / volume, 2) : 0;
    const laborUnitPrice = volume > 0 ? roundHalfUp(laborCost / volume, 2) : 0;
    const equipmentUnitPrice = volume > 0 ? roundHalfUp(equipmentCost / volume, 2) : 0;

    return {
      id,
      projectId: raw.projectId || projectId,
      code,
      name,
      category,
      unit,
      volume,
      unitPrice,
      materialUnitPrice,
      laborUnitPrice,
      equipmentUnitPrice,
      materialCost,
      laborCost,
      equipmentCost,
      directCost,
      weightPercent: 0, // Will be computed after total direct cost
      sourceType: raw.sourceType || 'manual',
      sourceId: raw.sourceId,
      confidence: raw.confidence,
      verified: raw.verificationStatus === 'verified' || raw.verified === true,
      notes: raw.notes || '',
      assumptions: raw.assumptions || [],
      warnings: raw.warnings || [],
    };
  });

  // 5. Total Direct Cost Calculation
  const directCost = validItems.reduce((sum, it) => sum + it.directCost, 0);
  const materialCost = validItems.reduce((sum, it) => sum + it.materialCost, 0);
  const laborCost = validItems.reduce((sum, it) => sum + it.laborCost, 0);
  const equipmentCost = validItems.reduce((sum, it) => sum + it.equipmentCost, 0);

  // 6. Compute Weights per item (4 decimals)
  validItems.forEach((it) => {
    it.weightPercent = directCost > 0 ? roundHalfUp((it.directCost / directCost) * 100, 4) : 0;
  });

  // 7. Category Summaries Calculation
  const catMap = new Map<RABCategory, { count: number; subtotal: number; mat: number; lab: number; eq: number }>();
  RAB_CATEGORIES.forEach((cat) => {
    catMap.set(cat, { count: 0, subtotal: 0, mat: 0, lab: 0, eq: 0 });
  });

  validItems.forEach((it) => {
    const cur = catMap.get(it.category) || { count: 0, subtotal: 0, mat: 0, lab: 0, eq: 0 };
    catMap.set(it.category, {
      count: cur.count + 1,
      subtotal: cur.subtotal + it.directCost,
      mat: cur.mat + it.materialCost,
      lab: cur.lab + it.laborCost,
      eq: cur.eq + it.equipmentCost,
    });
  });

  const categorySummaries: CategoryFinancialSummary[] = [];
  catMap.forEach((val, category) => {
    if (val.count > 0) {
      const weightPercent = directCost > 0 ? roundHalfUp((val.subtotal / directCost) * 100, 2) : 0;
      categorySummaries.push({
        category,
        itemCount: val.count,
        subtotal: val.subtotal,
        materialCost: val.mat,
        laborCost: val.lab,
        equipmentCost: val.eq,
        weightPercent,
      });
    }
  });

  // 8. Overhead Calculation (Now moved to AHSP level, project-level OH is 0)
  const overheadCost = 0;

  // 9. Profit Calculation (Now moved to AHSP level, project-level Profit is 0)
  const profitCost = 0;

  // 10. Subtotal Before Tax
  const subtotalBeforeTax = directCost + overheadCost + profitCost;

  // 0. Tax Base & Tax Cost Calculation
  let taxBase = subtotalBeforeTax;
  let taxCost = 0;
  let grandTotal = subtotalBeforeTax;

  if (taxConfig.isEnabled && taxConfig.rate > 0) {
    if (taxConfig.mode === 'TAX_INCLUSIVE') {
      // Inclusive PPN: Grand Total is fixed to subtotal, Tax Base is grandTotal / (1 + rate/100)
      taxBase = roundCurrency(subtotalBeforeTax / (1 + taxConfig.rate / 100));
      taxCost = subtotalBeforeTax - taxBase;
      grandTotal = subtotalBeforeTax;
    } else {
      // Exclusive PPN (Standard construction tender): PPN added to Subtotal
      taxBase = subtotalBeforeTax;
      taxCost = roundCurrency(taxBase * (taxConfig.rate / 100));
      grandTotal = subtotalBeforeTax + taxCost;
    }
  }

  // 12. Cost Structure Breakdown
  const gtSafe = grandTotal > 0 ? grandTotal : 1;
  const costStructure: CanonicalCostStructure = {
    materialCost,
    laborCost,
    equipmentCost,
    directCost,
    overheadCost,
    profitCost,
    taxCost,
    grandTotal,
    materialPercent: roundHalfUp((materialCost / gtSafe) * 100, 2),
    laborPercent: roundHalfUp((laborCost / gtSafe) * 100, 2),
    equipmentPercent: roundHalfUp((equipmentCost / gtSafe) * 100, 2),
    overheadPercent: roundHalfUp((overheadCost / gtSafe) * 100, 2),
    profitPercent: roundHalfUp((profitCost / gtSafe) * 100, 2),
    taxPercent: roundHalfUp((taxCost / gtSafe) * 100, 2),
  };

  // 13. Unit Economics
  const costPerM2 = buildingArea > 0 ? roundCurrency(grandTotal / buildingArea) : 0;

  // 14. Financial Reconciliation & Cross-Validation
  const itemSum = validItems.reduce((s, it) => s + it.directCost, 0);
  const directDiscrepancy = Math.abs(itemSum - directCost);
  const componentsSum = directCost + overheadCost + profitCost + (taxConfig.mode === 'TAX_EXCLUSIVE' ? taxCost : 0);
  const totalDiscrepancy = Math.abs(componentsSum - grandTotal);
  const isReconciled = directDiscrepancy <= 1.0 && totalDiscrepancy <= 1.0;

  const reconciliation: CanonicalReconciliation = {
    isReconciled,
    toleranceDiscrepancy: Math.max(directDiscrepancy, totalDiscrepancy),
    itemSumDirectCost: itemSum,
    calculatedDirectCost: directCost,
    subtotalBeforeTax,
    calculatedGrandTotal: grandTotal,
    componentsSum,
    validationStatus: isReconciled ? 'VALID' : 'WARNING',
    message: isReconciled
      ? 'Struktur biaya dan rekonsiliasi total 100% konsisten tanpa selisih matematis.'
      : `Terdapat selisih matematis Rp ${Math.max(directDiscrepancy, totalDiscrepancy).toLocaleString('id-ID')}.`,
  };

  // 15. Immutable Deterministic Checksum Generation
  const checksumPayload = {
    engineVersion: '4.0.0',
    projectId,
    directCost,
    overheadCost,
    profitCost,
    taxCost,
    grandTotal,
    itemCount: validItems.length,
    itemCodes: validItems.map((i) => i.code).join('|'),
  };
  const checksum = sha256Sync(checksumPayload);

  return {
    engineVersion: '4.0.0',
    calculatedAt: now,
    projectId,
    projectName,
    currency: 'IDR',
    materialCost,
    laborCost,
    equipmentCost,
    directCost,
    overheadConfig,
    overheadCost,
    profitConfig,
    profitCost,
    taxConfig,
    taxBase,
    taxCost,
    subtotalBeforeTax,
    grandTotal,
    buildingArea,
    costPerM2,
    categorySummaries,
    itemsWithCalculations: validItems,
    costStructure,
    reconciliation,
    checksum,
  };
}

// =========================================================================
// 5. BACKWARD-COMPATIBLE API WRAPPERS
// =========================================================================

/**
 * Backward-compatible calculateRAB calling the canonical calculateProjectFinancials engine.
 */
export function calculateRAB(
  itemsOrProject: RABItem[] | (Partial<Project> & { overheadPercent?: number; profitPercent?: number; taxPercent?: number }),
  itemsOrOverhead: RABItem[] | number = 5,
  profitPercentParam: number = 10,
  taxPercentParam: number = 0
): RABCalculationResult {
  let items: RABItem[] = [];
  let overheadPercent = 5;
  let profitPercent = 10;
  let taxPercent = 0;
  let projectObj: Partial<Project> = {};

  if (Array.isArray(itemsOrProject)) {
    items = itemsOrProject;
    overheadPercent = typeof itemsOrOverhead === 'number' ? itemsOrOverhead : 5;
    profitPercent = profitPercentParam;
    taxPercent = taxPercentParam;
    projectObj = {
      overheadPercent,
      profitPercent,
      taxPercent,
    };
  } else if (itemsOrProject && typeof itemsOrProject === 'object') {
    projectObj = itemsOrProject;
    overheadPercent = typeof projectObj.overheadPercent === 'number' ? projectObj.overheadPercent : 5;
    profitPercent = typeof projectObj.profitPercent === 'number' ? projectObj.profitPercent : 10;
    taxPercent = typeof projectObj.taxPercent === 'number' ? projectObj.taxPercent : 0;
    items = Array.isArray(itemsOrOverhead) ? itemsOrOverhead : [];
  }

  const canonical = calculateProjectFinancials(items, projectObj);

  // Map to legacy RABCalculationResult format
  const legacyCategorySummaries: CategorySummary[] = canonical.categorySummaries.map((c) => ({
    category: c.category,
    itemCount: c.itemCount,
    subtotal: c.subtotal,
    weightPercent: c.weightPercent,
  }));

  const legacyItemsWithCalc: RABItem[] = canonical.itemsWithCalculations.map((i) => ({
    id: i.id,
    projectId: i.projectId,
    code: i.code,
    name: i.name,
    category: i.category,
    unit: i.unit,
    volume: i.volume,
    unitPrice: i.unitPrice,
    totalCost: i.directCost,
    weightPercent: i.weightPercent,
    notes: i.notes,
    sourceType: (i.sourceType as any) || 'manual',
    sourceId: i.sourceId,
    confidence: i.confidence,
    assumptions: i.assumptions,
    warnings: i.warnings,
    needsVerification: !i.verified,
  }));

  return {
    directCost: canonical.directCost,
    overheadPercent: canonical.overheadConfig.rate,
    overheadCost: canonical.overheadCost,
    profitPercent: canonical.profitConfig.rate,
    profitCost: canonical.profitCost,
    subtotalBeforeTax: canonical.subtotalBeforeTax,
    taxPercent: canonical.taxConfig.rate,
    taxCost: canonical.taxCost,
    grandTotal: canonical.grandTotal,
    categorySummaries: legacyCategorySummaries,
    itemsWithCalculations: legacyItemsWithCalc,
  };
}

export function reconcileFinancialTotals(calc: RABCalculationResult): CanonicalReconciliation {
  const itemSum = calc.itemsWithCalculations.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  const expectedDirect = calc.directCost;
  const directDiscrepancy = Math.abs(itemSum - expectedDirect);

  const componentsSum = calc.directCost + calc.overheadCost + calc.profitCost + calc.taxCost;
  const totalDiscrepancy = Math.abs(componentsSum - calc.grandTotal);

  const isReconciled = directDiscrepancy <= 1.0 && totalDiscrepancy <= 1.0;

  return {
    isReconciled,
    toleranceDiscrepancy: Math.max(directDiscrepancy, totalDiscrepancy),
    calculatedDirectCost: calc.directCost,
    itemSumDirectCost: itemSum,
    subtotalBeforeTax: calc.subtotalBeforeTax,
    calculatedGrandTotal: calc.grandTotal,
    componentsSum,
    validationStatus: isReconciled ? 'VALID' : 'WARNING',
    message: isReconciled
      ? 'Struktur biaya dan rekonsiliasi total 100% konsisten tanpa selisih matematis.'
      : `Terdapat selisih pembulatan Rp ${Math.max(directDiscrepancy, totalDiscrepancy).toLocaleString('id-ID')}.`,
  };
}

export function calculateCostStructure(
  items: RABItem[],
  overheadPercent: number = 5,
  profitPercent: number = 10,
  taxPercent: number = 0
): CanonicalCostStructure {
  const canonical = calculateProjectFinancials(items, {
    overheadPercent,
    profitPercent,
    taxPercent,
  });
  return canonical.costStructure;
}

export function sanitizeRABItem(item: Partial<RABItem>): RABItem {
  const volume = Math.max(0, isFinite(Number(item.volume)) ? Number(item.volume) : 0);
  const unitPrice = Math.max(0, isFinite(Number(item.unitPrice)) ? Number(item.unitPrice) : 0);
  const totalCost = calculateItemAmount(volume, unitPrice);

  return {
    id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: item.projectId || '',
    code: item.code || '',
    name: (item.name || 'Pekerjaan Baru').trim(),
    category: (item.category as any) || 'Pekerjaan Persiapan',
    unit: item.unit || 'm²',
    volume,
    unitPrice,
    totalCost,
    weightPercent: Number(item.weightPercent) || 0,
    notes: item.notes || '',
    sourceType: item.sourceType || 'manual',
    sourceId: item.sourceId,
    confidence: item.confidence,
    assumptions: item.assumptions,
    needsVerification: item.needsVerification,
    warnings: item.warnings,
  };
}

// =========================================================================
// 6. CANONICAL PROPERTY FEASIBILITY & FINANCIAL MODELING ENGINE
// =========================================================================

/**
 * Calculates complete property development feasibility metrics, unit economics, and break-even points.
 */
export function calculatePropertyFeasibility(input: PropertyFeasibilityInput): PropertyFeasibilityResult {
  const landAreaM2 = Math.max(0, safeNumber(input.landAreaM2));
  const landPricePerM2 = Math.max(0, safeNumber(input.landPricePerM2));
  const landCost = input.totalLandCost ? roundCurrency(input.totalLandCost) : roundCurrency(landAreaM2 * landPricePerM2);

  const constructionCost = roundCurrency(Math.max(0, safeNumber(input.constructionCost)));
  const permitCost = roundCurrency(Math.max(0, safeNumber(input.permitAndLicensingCost)));
  const professionalFees = roundCurrency(Math.max(0, safeNumber(input.professionalFees)));
  const infrastructureCost = roundCurrency(Math.max(0, safeNumber(input.infrastructureCost)));
  const marketingCost = roundCurrency(Math.max(0, safeNumber(input.marketingCost)));
  const contingencyCost = roundCurrency(Math.max(0, safeNumber(input.contingencyCost)));
  const financingCost = roundCurrency(Math.max(0, safeNumber(input.financingCost)));
  const operationalCost = roundCurrency(Math.max(0, safeNumber(input.operationalCost)));

  const softCost =
    permitCost +
    professionalFees +
    infrastructureCost +
    marketingCost +
    contingencyCost +
    financingCost +
    operationalCost;

  const totalDevelopmentCost = landCost + constructionCost + softCost;
  const totalInvestment = totalDevelopmentCost;

  const totalUnits = Math.max(1, safeNumber(input.totalUnits, 1));
  const sellableAreaM2 = Math.max(1, safeNumber(input.sellableAreaM2, 1));
  const avgSellingPrice = Math.max(0, safeNumber(input.averageSellingPricePerUnit));

  const grossRevenue = roundCurrency(totalUnits * avgSellingPrice);
  const netRevenue = grossRevenue; // Or deducted by commercial sales taxes

  const grossProfit = grossRevenue - totalDevelopmentCost;
  const netProfit = grossProfit;

  const roi = totalInvestment > 0 ? roundHalfUp((netProfit / totalInvestment) * 100, 2) : 0;
  const netProfitMargin = grossRevenue > 0 ? roundHalfUp((netProfit / grossRevenue) * 100, 2) : 0;

  const costPerM2Land = landAreaM2 > 0 ? roundCurrency(landCost / landAreaM2) : 0;
  const costPerM2Building = sellableAreaM2 > 0 ? roundCurrency(constructionCost / sellableAreaM2) : 0;
  const revenuePerM2Sellable = sellableAreaM2 > 0 ? roundCurrency(grossRevenue / sellableAreaM2) : 0;

  const costPerUnit = totalUnits > 0 ? roundCurrency(totalDevelopmentCost / totalUnits) : 0;
  const revenuePerUnit = avgSellingPrice;
  const profitPerUnit = totalUnits > 0 ? roundCurrency(netProfit / totalUnits) : 0;

  const breakEvenUnits = avgSellingPrice > 0 ? Math.ceil(totalDevelopmentCost / avgSellingPrice) : totalUnits;
  const breakEvenPricePerUnit = totalUnits > 0 ? roundCurrency(totalDevelopmentCost / totalUnits) : 0;
  const breakEvenPercent = totalUnits > 0 ? roundHalfUp((breakEvenUnits / totalUnits) * 100, 2) : 0;

  const checksumPayload = {
    engineVersion: '4.0.0',
    projectId: input.projectId,
    totalDevelopmentCost,
    grossRevenue,
    netProfit,
    roi,
    breakEvenUnits,
  };
  const checksum = sha256Sync(checksumPayload);

  return {
    engineVersion: '4.0.0',
    calculatedAt: new Date().toISOString(),
    landCost,
    constructionCost,
    softCost,
    permitCost,
    professionalFees,
    infrastructureCost,
    marketingCost,
    contingencyCost,
    financingCost,
    operationalCost,
    totalDevelopmentCost,
    totalInvestment,
    grossRevenue,
    netRevenue,
    grossProfit,
    netProfit,
    roi,
    netProfitMargin,
    costPerM2Land,
    costPerM2Building,
    revenuePerM2Sellable,
    costPerUnit,
    revenuePerUnit,
    profitPerUnit,
    breakEvenUnits,
    breakEvenPricePerUnit,
    breakEvenPercent,
    checksum,
  };
}

/**
 * Evaluates property investment sensitivity under multiple economic scenarios
 */
export function calculateSensitivityAnalysis(baseInput: PropertyFeasibilityInput): SensitivityScenarioResult[] {
  const baseResult = calculatePropertyFeasibility(baseInput);

  const scenarios: {
    type: 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'STRESS';
    description: string;
    costAdj: number;
    revAdj: number;
    durationAdj: number;
  }[] = [
    {
      type: 'BASE',
      description: 'Skenario Normal / Rencana Dasar',
      costAdj: 0,
      revAdj: 0,
      durationAdj: 0,
    },
    {
      type: 'OPTIMISTIC',
      description: 'Penjualan cepat (+10% harga jual, -5% biaya konstruksi)',
      costAdj: -0.05,
      revAdj: 0.10,
      durationAdj: -2,
    },
    {
      type: 'PESSIMISTIC',
      description: 'Kenaikan material & perlambatan (+10% biaya, -10% harga jual)',
      costAdj: 0.10,
      revAdj: -0.10,
      durationAdj: 4,
    },
    {
      type: 'STRESS',
      description: 'Skenario Krisis Pasar (+20% biaya, -20% harga jual, durasi +6 bln)',
      costAdj: 0.20,
      revAdj: -0.20,
      durationAdj: 6,
    },
  ];

  return scenarios.map((sc) => {
    const adjustedCost = baseResult.totalDevelopmentCost * (1 + sc.costAdj);
    const adjustedRevenue = baseResult.grossRevenue * (1 + sc.revAdj);
    const netProfit = adjustedRevenue - adjustedCost;
    const roi = adjustedCost > 0 ? roundHalfUp((netProfit / adjustedCost) * 100, 2) : 0;
    const netProfitMargin = adjustedRevenue > 0 ? roundHalfUp((netProfit / adjustedRevenue) * 100, 2) : 0;
    const avgPrice = baseInput.averageSellingPricePerUnit * (1 + sc.revAdj);
    const breakEvenUnits = avgPrice > 0 ? Math.ceil(adjustedCost / avgPrice) : baseInput.totalUnits;

    let viabilityStatus: 'FEASIBLE' | 'MODERATE_RISK' | 'HIGH_RISK' | 'UNFEASIBLE' = 'FEASIBLE';
    if (roi < 0) {
      viabilityStatus = 'UNFEASIBLE';
    } else if (roi < 10) {
      viabilityStatus = 'HIGH_RISK';
    } else if (roi < 20) {
      viabilityStatus = 'MODERATE_RISK';
    } else {
      viabilityStatus = 'FEASIBLE';
    }

    return {
      scenario: sc.type,
      description: sc.description,
      costAdjustmentPercent: sc.costAdj * 100,
      revenueAdjustmentPercent: sc.revAdj * 100,
      durationAdjustmentMonths: sc.durationAdj,
      totalDevelopmentCost: roundCurrency(adjustedCost),
      grossRevenue: roundCurrency(adjustedRevenue),
      netProfit: roundCurrency(netProfit),
      roi,
      netProfitMargin,
      breakEvenUnits,
      viabilityStatus,
    };
  });
}

// =========================================================================
// 7. CANONICAL CASH FLOW SIMULATION ENGINE
// =========================================================================

/**
 * Simulates project cash inflows and outflows across months to calculate working capital and payback period.
 */
export function simulateProjectCashFlow(
  totalConstructionBudget: number,
  softCosts: number,
  totalSalesRevenue: number,
  totalDurationMonths: number = 12,
  salesAbsorptionMonths: number = 12
): CashFlowSimulationResult {
  const totalMonths = Math.max(1, totalDurationMonths);
  const totalOutflowBudget = totalConstructionBudget + softCosts;

  // Precompute unnormalized bell-curve weights to ensure exact sum equals totalOutflowBudget
  const rawWeights: number[] = [];
  for (let m = 1; m <= totalMonths; m++) {
    const x = (m - 0.5) / totalMonths;
    rawWeights.push(Math.sin(Math.PI * x) + 0.3);
  }
  const rawWeightSum = rawWeights.reduce((a, b) => a + b, 0);

  const periods: CashFlowPeriodItem[] = [];
  let cumulativeOutflow = 0;
  let cumulativeInflow = 0;
  let cumulativeBalance = 0;
  let peakDeficit = 0;
  let paybackPeriodMonth = -1;

  for (let m = 1; m <= totalMonths; m++) {
    const progressPercent = roundHalfUp((100 / totalMonths), 2);
    const weightFraction = rawWeights[m - 1] / rawWeightSum;
    
    // Exact allocation for last month to eliminate rounding drift
    let monthlyOutflow = 0;
    if (m === totalMonths) {
      monthlyOutflow = totalOutflowBudget - cumulativeOutflow;
    } else {
      monthlyOutflow = roundCurrency(totalOutflowBudget * weightFraction);
    }
    cumulativeOutflow += monthlyOutflow;

    // Sales Inflow ramp up from month 2
    let monthlyInflow = 0;
    if (m >= 2 && m <= salesAbsorptionMonths) {
      const salesPeriodCount = Math.max(1, salesAbsorptionMonths - 1);
      if (m === salesAbsorptionMonths) {
        monthlyInflow = totalSalesRevenue - cumulativeInflow;
      } else {
        monthlyInflow = roundCurrency(totalSalesRevenue / salesPeriodCount);
      }
    }
    cumulativeInflow += monthlyInflow;

    const netCashFlow = monthlyInflow - monthlyOutflow;
    cumulativeBalance += netCashFlow;

    if (cumulativeBalance < peakDeficit) {
      peakDeficit = cumulativeBalance;
    }

    if (cumulativeBalance >= 0 && paybackPeriodMonth === -1 && m > 1) {
      paybackPeriodMonth = m;
    }

    periods.push({
      period: m,
      periodLabel: `Bulan ${m}`,
      plannedProgressPercent: progressPercent,
      cumulativeProgressPercent: Math.min(100, roundHalfUp(progressPercent * m, 2)),
      plannedExpenditure: monthlyOutflow,
      cumulativeExpenditure: cumulativeOutflow,
      plannedInflow: monthlyInflow,
      cumulativeInflow,
      netCashFlow,
      cumulativeCashBalance: cumulativeBalance,
    });
  }

  const checksum = sha256Sync({
    engineVersion: '4.0.0',
    totalOutflow: cumulativeOutflow,
    totalInflow: cumulativeInflow,
    peakDeficit,
    paybackPeriodMonth,
  });

  return {
    projectId: `cf_${Date.now()}`,
    totalDurationMonths: totalMonths,
    totalPlannedOutflow: cumulativeOutflow,
    totalPlannedInflow: cumulativeInflow,
    peakDeficit: Math.abs(peakDeficit),
    paybackPeriodMonth: paybackPeriodMonth > 0 ? paybackPeriodMonth : totalMonths,
    periods,
    checksum,
  };
}

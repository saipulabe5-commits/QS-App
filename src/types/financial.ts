/**
 * Canonical Financial Engine Data Models & Types (RAB Pro V4 Zero-Mistake)
 * Single Source of Truth for construction financial calculations, feasibility, cashflow, and tax.
 */

import { RABCategory } from './rab';

export type TaxCalculationMode = 'TAX_EXCLUSIVE' | 'TAX_INCLUSIVE';

export interface TaxConfiguration {
  mode: TaxCalculationMode;
  rate: number; // e.g., 11 for 11% PPN
  isEnabled: boolean;
}

export type OverheadCalculationMethod = 'percentage_of_direct_cost' | 'fixed_amount';

export interface OverheadConfiguration {
  method: OverheadCalculationMethod;
  rate: number; // e.g., 5 for 5%
  fixedAmount: number;
  isEnabled: boolean;
}

export type ProfitCalculationMethod = 'percentage_of_direct_cost' | 'percentage_of_cost_plus_overhead' | 'fixed_amount';

export interface ProfitConfiguration {
  method: ProfitCalculationMethod;
  rate: number; // e.g., 10 for 10%
  fixedAmount: number;
  isEnabled: boolean;
}

export interface ProjectFinancialInput {
  id: string;
  name: string;
  location?: string;
  landArea?: number; // m²
  buildingArea?: number; // m²
  projectDurationMonths?: number;
  currency?: string; // default 'IDR'
  taxConfig?: Partial<TaxConfiguration>;
  overheadConfig?: Partial<OverheadConfiguration>;
  profitConfig?: Partial<ProfitConfiguration>;
  overheadPercent?: number; // legacy compat
  profitPercent?: number; // legacy compat
  taxPercent?: number; // legacy compat
}

export interface ValidatedFinancialItem {
  id: string;
  projectId: string;
  code: string;
  category: RABCategory;
  name: string;
  unit: string;
  volume: number; // strictly >= 0, finite
  unitPrice: number; // strictly >= 0, finite
  materialUnitPrice: number;
  laborUnitPrice: number;
  equipmentUnitPrice: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  directCost: number; // material + labor + equipment or volume * unitPrice
  weightPercent: number; // relative to project direct cost (0-100%)
  sourceType: 'manual' | 'ahsp' | 'database' | 'ai' | 'drawing_takeoff' | 'imported';
  sourceId?: string;
  confidence?: number;
  verified: boolean;
  notes?: string;
  assumptions?: string[];
  warnings?: string[];
}

export interface CategoryFinancialSummary {
  category: RABCategory;
  itemCount: number;
  subtotal: number;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  weightPercent: number;
}

export interface CanonicalCostStructure {
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  directCost: number;
  overheadCost: number;
  profitCost: number;
  taxCost: number;
  grandTotal: number;
  materialPercent: number;
  laborPercent: number;
  equipmentPercent: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
}

export type CostStructureBreakdown = CanonicalCostStructure;

export interface CanonicalReconciliation {
  isReconciled: boolean;
  toleranceDiscrepancy: number;
  itemSumDirectCost: number;
  calculatedDirectCost: number;
  subtotalBeforeTax: number;
  calculatedGrandTotal: number;
  componentsSum: number;
  validationStatus: 'VALID' | 'WARNING' | 'RECONCILED';
  message: string;
}

export interface CanonicalFinancialResult {
  engineVersion: string; // '4.0.0'
  calculatedAt: string;
  projectId: string;
  projectName: string;
  currency: string;
  
  // Cost Components
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  directCost: number;
  
  // Overhead
  overheadConfig: OverheadConfiguration;
  overheadCost: number;
  
  // Profit
  profitConfig: ProfitConfiguration;
  profitCost: number;
  
  // Tax Base & Tax
  taxConfig: TaxConfiguration;
  taxBase: number;
  taxCost: number;
  subtotalBeforeTax: number;
  
  // Grand Totals & Unit Economics
  grandTotal: number;
  buildingArea: number;
  costPerM2: number; // grandTotal / buildingArea
  
  // Structure & Breakdown
  categorySummaries: CategoryFinancialSummary[];
  itemsWithCalculations: ValidatedFinancialItem[];
  costStructure: CanonicalCostStructure;
  
  // Audit & Integrity
  reconciliation: CanonicalReconciliation;
  checksum: string;
}

/**
 * Property Feasibility Calculation Models
 */
export interface PropertyFeasibilityInput {
  projectId: string;
  projectName: string;
  
  // Land & Area
  landAreaM2: number;
  landPricePerM2: number;
  totalLandCost?: number; // Override if lump sum
  sellableAreaM2: number;
  totalUnits: number;
  
  // Construction
  constructionCost: number; // From Financial Engine RAB Grand Total or Direct Cost
  constructionCostSource: 'RAB_GRAND_TOTAL' | 'RAB_DIRECT_COST' | 'CUSTOM';
  
  // Soft Costs & Permitting
  permitAndLicensingCost: number; // IMB/PBG, Amdal, Sertifikasi
  professionalFees: number; // Arsitek, QS, Struktur, MEP
  infrastructureCost: number; // Jalan, PJU, Saluran, Gerbang
  marketingCost: number; // Sales agent, iklan, brosur
  contingencyCost: number; // Biaya tak terduga (biasanya 3-5%)
  financingCost: number; // Bunga bank / modal kerja
  operationalCost: number; // Biaya kantor proyek & legal
  
  // Revenue & Sales
  averageSellingPricePerUnit: number;
  projectDurationMonths: number;
  salesAbsorptionMonths: number;
}

export interface PropertyFeasibilityResult {
  engineVersion: string;
  calculatedAt: string;
  
  // Cost breakdown
  landCost: number;
  constructionCost: number;
  softCost: number; // permits + fees + marketing + infra + contingency + finance + ops
  permitCost: number;
  professionalFees: number;
  infrastructureCost: number;
  marketingCost: number;
  contingencyCost: number;
  financingCost: number;
  operationalCost: number;
  
  // Total Development Cost (TDC) / Total Investment
  totalDevelopmentCost: number;
  totalInvestment: number;
  
  // Revenue
  grossRevenue: number;
  netRevenue: number; // grossRevenue minus sales tax/marketing if applicable
  
  // Profitability
  grossProfit: number;
  netProfit: number;
  roi: number; // (Net Profit / Total Investment) * 100 (%)
  netProfitMargin: number; // (Net Profit / Gross Revenue) * 100 (%)
  
  // Unit Economics
  costPerM2Land: number;
  costPerM2Building: number;
  revenuePerM2Sellable: number;
  costPerUnit: number;
  revenuePerUnit: number;
  profitPerUnit: number;
  
  // Break-even Analysis
  breakEvenUnits: number; // Minimum units sold to cover TDC
  breakEvenPricePerUnit: number; // Minimum unit price to cover TDC at total units
  breakEvenPercent: number; // (breakEvenUnits / totalUnits) * 100 (%)
  
  checksum: string;
}

export type SensitivityScenarioType = 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'STRESS';

export interface SensitivityScenarioResult {
  scenario: SensitivityScenarioType;
  description: string;
  costAdjustmentPercent: number;
  revenueAdjustmentPercent: number;
  durationAdjustmentMonths: number;
  totalDevelopmentCost: number;
  grossRevenue: number;
  netProfit: number;
  roi: number;
  netProfitMargin: number;
  breakEvenUnits: number;
  viabilityStatus: 'FEASIBLE' | 'MODERATE_RISK' | 'HIGH_RISK' | 'UNFEASIBLE';
}

/**
 * Cash Flow Simulation Models
 */
export interface CashFlowPeriodItem {
  period: number; // Month 1..N
  periodLabel: string;
  plannedProgressPercent: number;
  cumulativeProgressPercent: number;
  plannedExpenditure: number; // Cash Outflow for construction & soft cost
  cumulativeExpenditure: number;
  plannedInflow: number; // Cash Inflow from DP, progress payments, or sales
  cumulativeInflow: number;
  netCashFlow: number; // Inflow - Outflow
  cumulativeCashBalance: number;
}

export interface CashFlowSimulationResult {
  projectId: string;
  totalDurationMonths: number;
  totalPlannedOutflow: number;
  totalPlannedInflow: number;
  peakDeficit: number; // Maximum negative cash balance (Working Capital needed)
  paybackPeriodMonth: number; // Month when cumulative cash balance permanently >= 0
  periods: CashFlowPeriodItem[];
  checksum: string;
}

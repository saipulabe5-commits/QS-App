import { RABCategory } from './rab';

export interface ProposedRABItem {
  id?: string;
  name: string;
  category: RABCategory | string;
  unit: string;
  volume: number;
  unitPrice: number;
  totalPrice?: number;
  ahspCode?: string;
  rationale?: string;
}

export interface AIMissingItemResult {
  missingItems: ProposedRABItem[];
  overallRiskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  categoryCoverage: { [category: string]: boolean };
  insights: string[];
}

export interface AIPriceAuditResult {
  anomalyItems: Array<{
    item: string;
    category: string;
    currentPrice: number;
    benchmarkPrice: number;
    deviationPercentage: number;
    status: 'Terlalu Murah' | 'Terlalu Mahal' | 'Wajar';
    recommendation: string;
  }>;
  overallHealthScore: number;
  totalPotentialSaving: number;
}

export interface AIVolumeResult {
  itemName: string;
  suggestedVolume: number;
  unit: string;
  calculationFormula: string;
  confidenceScore: number;
  notes: string;
}

export interface AICostSavingResult {
  potentialSavings: Array<{
    item: string;
    category: string;
    originalCost: number;
    optimizedCost: number;
    savingAmount: number;
    substitutionProposal: string;
    impactOnQuality: string;
    actionRecommendation: string;
  }>;
}

export interface AIExecutiveSummaryResult {
  executiveNarrative: string;
  topCostDrivers: Array<{
    category: string;
    percentage: number;
    explanation: string;
  }>;
  budgetFeasibility: string;
  cashflowAdvice: string;
  riskHighlights: string[];
}

export interface AICostEscalationResult {
  overallEscalationRate: number;
  forecastPeriod: string;
  referenceDate: string;
  marketCondition: 'Stabil' | 'Inflasi Moderat' | 'Inflasi Tinggi' | 'Deflasi';
  summary: string;
  categoryEscalations: Array<{
    category: string;
    currentCost: number;
    escalationRate: number;
    projectedCost: number;
    mainDrivers: string[];
    riskLevel: 'Rendah' | 'Sedang' | 'Tinggi';
  }>;
  materialAlerts: Array<{
    material: string;
    currentTrend: string;
    projectedChange: number;
    recommendation: string;
    urgency: 'Segera Beli' | 'Pantau' | 'Tunda Pembelian';
  }>;
  mitigationStrategies: string[];
  totalCurrentBudget: number;
  totalProjectedBudget: number;
  additionalBudgetNeeded: number;
}

export interface AIAutoCategorizeResult {
  suggestedCategory: string;
  confidence: number;
  reason: string;
  alternativeCategory: string | null;
  suggestedUnit: string;
  suggestedCode: string;
  source?: string;
}

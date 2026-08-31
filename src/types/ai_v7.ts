export type AIConfidenceLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type SeverityLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'AI_SUGGESTED' | 'REQUIRES_REVIEW' | 'USER_APPROVED' | 'OFFICIAL' | 'REJECTED';

export interface AIRecommendation {
  type: string;
  status: ApprovalStatus;
  confidence: AIConfidenceLevel;
  source: string;
  assumptions: string[];
  evidence: string;
  recommendation: string;
  financialImpact?: number;
  requiresApproval: boolean;
  actionId?: string; // for human-in-the-loop tracking
}

export interface AIRiskScore {
  score: number; // 0-100
  dimensions: {
    probability: number;
    impact: number;
    exposure: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  };
  reason: string;
  affectedModule: string;
  mitigationRecommendation: string;
}

export interface AICostForecast {
  originalBudget: number;
  actualCost: number;
  progress: number;
  estimateAtCompletion: number;
  expectedFinalCost: number;
  costVariance: number;
  costOverrunProbability: number; // 0-1
  earlyWarning: string;
}

export interface AIAuditTrail {
  timestamp: string;
  userId: string;
  action: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  beforeChecksum: string;
  afterChecksum: string;
}

export interface AIAnomalyAlert {
  id: string;
  type: string; // 'Abnormal unit price', etc.
  severity: SeverityLevel;
  description: string;
  recommendedAction: string;
}

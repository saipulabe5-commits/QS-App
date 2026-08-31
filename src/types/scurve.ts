import { RABCategory } from './rab';

export type PeriodType = 'weekly' | 'monthly';

export type DistributionPattern = 'linear' | 'bell-curve' | 'step' | 'custom';

export interface ScheduleItem {
  id: string;
  projectId: string;
  rabItemId?: string;
  workCode: string;
  description: string;
  category: RABCategory;
  weight: number; // percentage (0-100%)
  plannedCost: number; // in IDR
  plannedStartDate: string;
  plannedEndDate: string;
  duration: number; // count of periods
  startPeriod: number; // 1-indexed
  endPeriod: number; // 1-indexed
  distributionType: DistributionPattern;
  plannedPeriodValues: number[]; // bobot per periode (%) e.g. [0, 2.5, 5, 2.5]
}

export interface PeriodProgressRecord {
  period: number; // 1, 2, 3...
  periodLabel: string; // e.g. "M-1 (01-07 Agt)"
  plannedProgress: number; // bobot periode rencana (%)
  plannedCumulative: number; // bobot rencana kumulatif (%)
  actualProgress: number; // bobot periode aktual (%)
  actualCumulative: number; // bobot aktual kumulatif (%)
  deviation: number; // actualCumulative - plannedCumulative (%)
  plannedCost: number; // Rp rencana periode ini
  actualCost: number; // Rp aktual periode ini
  deviationCost: number; // actualCost - plannedCost
  status: 'Sesuai rencana' | 'Terlambat' | 'Lebih cepat' | 'Belum ada data';
  reportDate: string;
  notes: string;
  issuesObstacles?: string;
  itemProgress: Record<string, number>; // scheduleItemId -> actual percentage completed (0-100%)
}

export interface ProjectSCurve {
  id: string;
  projectId: string;
  periodType: PeriodType;
  totalPeriods: number;
  startDate: string;
  endDate: string;
  totalBudget: number;
  scheduleItems: ScheduleItem[];
  periodRecords: PeriodProgressRecord[];
  lastUpdated: string;
}

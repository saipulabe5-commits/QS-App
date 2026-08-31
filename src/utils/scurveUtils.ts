import { ScheduleItem, PeriodProgressRecord, ProjectSCurve, DistributionPattern } from '../types/scurve';
import { RABItem } from '../types/rab';

/**
 * Distribute an item's weight across periods based on distribution pattern
 */
export function calculatePeriodWeights(
  totalWeight: number,
  startPeriod: number, // 1-indexed
  endPeriod: number, // 1-indexed
  totalPeriods: number,
  pattern: DistributionPattern
): number[] {
  const values: number[] = new Array(totalPeriods).fill(0);
  const duration = Math.max(1, endPeriod - startPeriod + 1);

  if (startPeriod < 1 || startPeriod > totalPeriods) return values;

  const validStart = Math.max(1, Math.min(startPeriod, totalPeriods));
  const validEnd = Math.max(validStart, Math.min(endPeriod, totalPeriods));
  const validDuration = validEnd - validStart + 1;

  if (pattern === 'linear') {
    const perPeriod = Number((totalWeight / validDuration).toFixed(3));
    let remaining = totalWeight;
    for (let p = validStart; p <= validEnd; p++) {
      if (p === validEnd) {
        values[p - 1] = Number(remaining.toFixed(3));
      } else {
        values[p - 1] = perPeriod;
        remaining -= perPeriod;
      }
    }
  } else if (pattern === 'bell-curve') {
    // Normal / Gaussian-like distribution peaking in the middle
    const factors: number[] = [];
    for (let i = 0; i < validDuration; i++) {
      // parabolic bell curve factor
      const x = (i + 0.5) / validDuration;
      const factor = Math.sin(Math.PI * x) + 0.3; // ensures ends have some weight
      factors.push(factor);
    }
    const sumFactors = factors.reduce((a, b) => a + b, 0);
    let remaining = totalWeight;
    for (let i = 0; i < validDuration; i++) {
      const p = validStart + i;
      if (i === validDuration - 1) {
        values[p - 1] = Number(remaining.toFixed(3));
      } else {
        const val = Number(((factors[i] / sumFactors) * totalWeight).toFixed(3));
        values[p - 1] = val;
        remaining -= val;
      }
    }
  } else if (pattern === 'step') {
    // Early peak / ramp down
    const factors: number[] = [];
    for (let i = 0; i < validDuration; i++) {
      factors.push(validDuration - i);
    }
    const sumFactors = factors.reduce((a, b) => a + b, 0);
    let remaining = totalWeight;
    for (let i = 0; i < validDuration; i++) {
      const p = validStart + i;
      if (i === validDuration - 1) {
        values[p - 1] = Number(remaining.toFixed(3));
      } else {
        const val = Number(((factors[i] / sumFactors) * totalWeight).toFixed(3));
        values[p - 1] = val;
        remaining -= val;
      }
    }
  }

  return values;
}

/**
 * Recalculate all period records (planned cumulative, actual cumulative, deviation, costs)
 */
export function recalculateSCurve(scurve: ProjectSCurve): ProjectSCurve {
  const { totalPeriods, scheduleItems, periodRecords, totalBudget } = scurve;

  // Calculate planned weight per period across all schedule items
  const plannedPerPeriod: number[] = new Array(totalPeriods).fill(0);
  scheduleItems.forEach((item) => {
    (item.plannedPeriodValues || []).forEach((val, idx) => {
      if (idx < totalPeriods) {
        plannedPerPeriod[idx] += Number(val || 0);
      }
    });
  });

  let runningPlannedCumulative = 0;
  let runningActualCumulative = 0;

  const updatedRecords: PeriodProgressRecord[] = [];

  for (let p = 1; p <= totalPeriods; p++) {
    const existing = periodRecords.find((r) => r.period === p);
    const plannedThis = Number((plannedPerPeriod[p - 1] || 0).toFixed(2));
    runningPlannedCumulative = Number((runningPlannedCumulative + plannedThis).toFixed(2));
    if (p === totalPeriods && Math.abs(runningPlannedCumulative - 100) < 0.2) {
      runningPlannedCumulative = 100.0;
    }

    const actualThis = existing ? Number((existing.actualProgress || 0).toFixed(2)) : 0;
    const hasActualData = existing && (existing.reportDate || existing.actualProgress > 0 || (existing.actualCumulative && existing.actualCumulative > 0));

    if (hasActualData) {
      if (existing.actualCumulative && existing.actualCumulative > 0 && !existing.actualProgress) {
        runningActualCumulative = Number(existing.actualCumulative.toFixed(2));
      } else {
        runningActualCumulative = Number((runningActualCumulative + actualThis).toFixed(2));
      }
    }

    const deviation = hasActualData ? Number((runningActualCumulative - runningPlannedCumulative).toFixed(2)) : 0;
    const plannedCost = Number(((plannedThis / 100) * totalBudget).toFixed(0));
    const actualCost = hasActualData ? (existing.actualCost || Number(((actualThis / 100) * totalBudget).toFixed(0))) : 0;
    const deviationCost = hasActualData ? actualCost - plannedCost : 0;

    let status: 'Sesuai rencana' | 'Terlambat' | 'Lebih cepat' | 'Belum ada data' = 'Belum ada data';
    if (hasActualData) {
      if (deviation >= 0.5) {
        status = 'Lebih cepat';
      } else if (deviation <= -2.0) {
        status = 'Terlambat';
      } else {
        status = 'Sesuai rencana';
      }
    }

    updatedRecords.push({
      period: p,
      periodLabel: existing?.periodLabel || `${scurve.periodType === 'weekly' ? 'M' : 'B'}-${p}`,
      plannedProgress: plannedThis,
      plannedCumulative: runningPlannedCumulative,
      actualProgress: hasActualData ? actualThis : 0,
      actualCumulative: hasActualData ? runningActualCumulative : 0,
      deviation,
      plannedCost,
      actualCost,
      deviationCost,
      status,
      reportDate: existing?.reportDate || '',
      notes: existing?.notes || '',
      issuesObstacles: existing?.issuesObstacles || '',
      itemProgress: existing?.itemProgress || {},
    });
  }

  return {
    ...scurve,
    periodRecords: updatedRecords,
    lastUpdated: new Date().toISOString().split('T')[0],
  };
}

/**
 * Create a new S-Curve from RAB Items
 */
export function buildSCurveFromRAB(
  projectId: string,
  rabItems: RABItem[],
  periodType: 'weekly' | 'monthly' = 'weekly',
  totalPeriods: number = 12,
  startDateStr?: string
): ProjectSCurve {
  const totalDirectCost = rabItems.reduce((sum, it) => sum + (it.volume * it.unitPrice), 0);
  const startDate = startDateStr || new Date().toISOString().split('T')[0];
  const startDt = new Date(startDate);
  const endDt = new Date(startDt);
  if (periodType === 'weekly') {
    endDt.setDate(endDt.getDate() + totalPeriods * 7);
  } else {
    endDt.setMonth(endDt.getMonth() + totalPeriods);
  }
  const endDate = endDt.toISOString().split('T')[0];

  const scheduleItems: ScheduleItem[] = rabItems.map((item, idx) => {
    const itemCost = item.volume * item.unitPrice;
    const weight = totalDirectCost > 0 ? Number(((itemCost / totalDirectCost) * 100).toFixed(2)) : 0;

    // Distribute along project duration logically based on category
    const categoryLower = (item.category || '').toLowerCase();
    let startPeriod = 1;
    let duration = 2;
    let pattern: DistributionPattern = 'linear';

    if (categoryLower.includes('persiapan')) {
      startPeriod = 1;
      duration = Math.max(1, Math.min(2, Math.floor(totalPeriods * 0.2)));
    } else if (categoryLower.includes('tanah')) {
      startPeriod = Math.max(1, Math.floor(totalPeriods * 0.1));
      duration = Math.max(1, Math.floor(totalPeriods * 0.2));
    } else if (categoryLower.includes('pondasi')) {
      startPeriod = Math.max(1, Math.floor(totalPeriods * 0.15));
      duration = Math.max(2, Math.floor(totalPeriods * 0.25));
      pattern = 'bell-curve';
    } else if (categoryLower.includes('struktur')) {
      startPeriod = Math.max(2, Math.floor(totalPeriods * 0.25));
      duration = Math.max(3, Math.floor(totalPeriods * 0.45));
      pattern = 'bell-curve';
    } else if (categoryLower.includes('dinding')) {
      startPeriod = Math.max(3, Math.floor(totalPeriods * 0.4));
      duration = Math.max(3, Math.floor(totalPeriods * 0.4));
      pattern = 'bell-curve';
    } else if (categoryLower.includes('atap')) {
      startPeriod = Math.max(4, Math.floor(totalPeriods * 0.55));
      duration = Math.max(2, Math.floor(totalPeriods * 0.3));
    } else if (categoryLower.includes('lantai')) {
      startPeriod = Math.max(5, Math.floor(totalPeriods * 0.65));
      duration = Math.max(2, Math.floor(totalPeriods * 0.25));
    } else if (categoryLower.includes('plafon')) {
      startPeriod = Math.max(5, Math.floor(totalPeriods * 0.7));
      duration = Math.max(2, Math.floor(totalPeriods * 0.2));
    } else if (categoryLower.includes('pintu') || categoryLower.includes('jendela')) {
      startPeriod = Math.max(5, Math.floor(totalPeriods * 0.7));
      duration = Math.max(2, Math.floor(totalPeriods * 0.2));
    } else if (categoryLower.includes('listrik') || categoryLower.includes('sanitasi')) {
      startPeriod = Math.max(3, Math.floor(totalPeriods * 0.35));
      duration = Math.max(4, Math.floor(totalPeriods * 0.45));
    } else if (categoryLower.includes('cat') || categoryLower.includes('pengecatan')) {
      startPeriod = Math.max(6, Math.floor(totalPeriods * 0.8));
      duration = Math.max(2, Math.floor(totalPeriods * 0.2));
    } else if (categoryLower.includes('akhir')) {
      startPeriod = Math.max(1, totalPeriods - 1);
      duration = 2;
    } else {
      startPeriod = Math.min(idx + 1, totalPeriods);
      duration = 2;
    }

    const endPeriod = Math.min(totalPeriods, startPeriod + duration - 1);
    const itemStartDt = new Date(startDt);
    if (periodType === 'weekly') {
      itemStartDt.setDate(itemStartDt.getDate() + (startPeriod - 1) * 7);
    } else {
      itemStartDt.setMonth(itemStartDt.getMonth() + (startPeriod - 1));
    }
    const itemEndDt = new Date(startDt);
    if (periodType === 'weekly') {
      itemEndDt.setDate(itemEndDt.getDate() + endPeriod * 7);
    } else {
      itemEndDt.setMonth(itemEndDt.getMonth() + endPeriod);
    }

    const plannedValues = calculatePeriodWeights(weight, startPeriod, endPeriod, totalPeriods, pattern);

    return {
      id: `sch_${item.id || idx + 1}`,
      projectId,
      rabItemId: item.id,
      workCode: item.code,
      description: item.name,
      category: item.category as any,
      weight,
      plannedCost: itemCost,
      plannedStartDate: itemStartDt.toISOString().split('T')[0],
      plannedEndDate: itemEndDt.toISOString().split('T')[0],
      duration: endPeriod - startPeriod + 1,
      startPeriod,
      endPeriod,
      distributionType: pattern,
      plannedPeriodValues: plannedValues,
    };
  });

  // Normalize total weights to 100%
  const sumWeight = scheduleItems.reduce((s, it) => s + it.weight, 0);
  if (sumWeight > 0 && Math.abs(sumWeight - 100) > 0.05) {
    scheduleItems.forEach((it) => {
      it.weight = Number(((it.weight / sumWeight) * 100).toFixed(2));
      it.plannedPeriodValues = calculatePeriodWeights(
        it.weight,
        it.startPeriod,
        it.endPeriod,
        totalPeriods,
        it.distributionType
      );
    });
  }

  // Create initial period records
  const periodRecords: PeriodProgressRecord[] = [];
  for (let p = 1; p <= totalPeriods; p++) {
    const pStartDt = new Date(startDt);
    const pEndDt = new Date(startDt);
    if (periodType === 'weekly') {
      pStartDt.setDate(pStartDt.getDate() + (p - 1) * 7);
      pEndDt.setDate(pEndDt.getDate() + p * 7 - 1);
    } else {
      pStartDt.setMonth(pStartDt.getMonth() + (p - 1));
      pEndDt.setMonth(pEndDt.getMonth() + p);
      pEndDt.setDate(pEndDt.getDate() - 1);
    }

    const startStr = `${pStartDt.getDate().toString().padStart(2, '0')}/${(pStartDt.getMonth() + 1).toString().padStart(2, '0')}`;
    const endStr = `${pEndDt.getDate().toString().padStart(2, '0')}/${(pEndDt.getMonth() + 1).toString().padStart(2, '0')}`;

    periodRecords.push({
      period: p,
      periodLabel: `${periodType === 'weekly' ? 'M' : 'B'}-${p} (${startStr}-${endStr})`,
      plannedProgress: 0,
      plannedCumulative: 0,
      actualProgress: 0,
      actualCumulative: 0,
      deviation: 0,
      plannedCost: 0,
      actualCost: 0,
      deviationCost: 0,
      status: 'Belum ada data',
      reportDate: '',
      notes: '',
      issuesObstacles: '',
      itemProgress: {},
    });
  }

  const newSCurve: ProjectSCurve = {
    id: `sc_${projectId}`,
    projectId,
    periodType,
    totalPeriods,
    startDate,
    endDate,
    totalBudget: totalDirectCost,
    scheduleItems,
    periodRecords,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  return recalculateSCurve(newSCurve);
}

/**
 * Safely synchronize an existing S-Curve with updated RAB items
 * - Preserves user schedule configuration (startPeriod, endPeriod, distributionType) where items match
 * - Adds new schedule items for new RAB items with smart category distribution
 * - Updates weights and planned costs
 * - Normalizes total weights to exactly 100.00%
 * - CRITICALLY PRESERVES all existing actual progress entries (actualProgress, actualCumulative, reportDate, notes, issues)
 * - Recalculates planned cumulative and deviation
 */
export function syncSCurveWithRAB(
  currentSCurve: ProjectSCurve,
  updatedRabItems: RABItem[]
): ProjectSCurve {
  const totalDirectCost = updatedRabItems.reduce((sum, it) => sum + (it.volume * it.unitPrice), 0);
  const totalPeriods = currentSCurve.totalPeriods;
  const startDt = new Date(currentSCurve.startDate || new Date().toISOString().split('T')[0]);

  // Map existing schedule items by rabItemId or code/name
  const existingMap = new Map<string, ScheduleItem>();
  currentSCurve.scheduleItems.forEach((it) => {
    if (it.rabItemId) existingMap.set(it.rabItemId, it);
    if (it.workCode) existingMap.set(it.workCode, it);
  });

  const newScheduleItems: ScheduleItem[] = updatedRabItems.map((item, idx) => {
    const itemCost = item.volume * item.unitPrice;
    const rawWeight = totalDirectCost > 0 ? (itemCost / totalDirectCost) * 100 : 0;
    const existing = existingMap.get(item.id) || existingMap.get(item.code);

    let startPeriod = existing ? existing.startPeriod : 1;
    let endPeriod = existing ? existing.endPeriod : 2;
    let pattern: DistributionPattern = existing ? existing.distributionType : 'linear';

    if (!existing) {
      // Default heuristics by category if it is a brand new item
      const categoryLower = (item.category || '').toLowerCase();
      let duration = 2;
      if (categoryLower.includes('persiapan')) {
        startPeriod = 1;
        duration = Math.max(1, Math.min(2, Math.floor(totalPeriods * 0.2)));
      } else if (categoryLower.includes('tanah')) {
        startPeriod = Math.max(1, Math.floor(totalPeriods * 0.1));
        duration = Math.max(1, Math.floor(totalPeriods * 0.2));
      } else if (categoryLower.includes('pondasi')) {
        startPeriod = Math.max(1, Math.floor(totalPeriods * 0.15));
        duration = Math.max(2, Math.floor(totalPeriods * 0.25));
        pattern = 'bell-curve';
      } else if (categoryLower.includes('struktur')) {
        startPeriod = Math.max(2, Math.floor(totalPeriods * 0.25));
        duration = Math.max(3, Math.floor(totalPeriods * 0.45));
        pattern = 'bell-curve';
      } else if (categoryLower.includes('dinding')) {
        startPeriod = Math.max(3, Math.floor(totalPeriods * 0.4));
        duration = Math.max(3, Math.floor(totalPeriods * 0.4));
        pattern = 'bell-curve';
      } else if (categoryLower.includes('atap')) {
        startPeriod = Math.max(4, Math.floor(totalPeriods * 0.55));
        duration = Math.max(2, Math.floor(totalPeriods * 0.3));
      } else if (categoryLower.includes('lantai')) {
        startPeriod = Math.max(5, Math.floor(totalPeriods * 0.65));
        duration = Math.max(2, Math.floor(totalPeriods * 0.25));
      } else if (categoryLower.includes('plafon') || categoryLower.includes('pintu') || categoryLower.includes('jendela')) {
        startPeriod = Math.max(5, Math.floor(totalPeriods * 0.7));
        duration = Math.max(2, Math.floor(totalPeriods * 0.2));
      } else if (categoryLower.includes('listrik') || categoryLower.includes('sanitasi')) {
        startPeriod = Math.max(3, Math.floor(totalPeriods * 0.35));
        duration = Math.max(4, Math.floor(totalPeriods * 0.45));
      } else if (categoryLower.includes('cat') || categoryLower.includes('pengecatan')) {
        startPeriod = Math.max(6, Math.floor(totalPeriods * 0.8));
        duration = Math.max(2, Math.floor(totalPeriods * 0.2));
      } else {
        startPeriod = Math.min(idx + 1, totalPeriods);
        duration = 2;
      }
      endPeriod = Math.min(totalPeriods, startPeriod + duration - 1);
    }

    // Ensure valid period bounds
    startPeriod = Math.max(1, Math.min(startPeriod, totalPeriods));
    endPeriod = Math.max(startPeriod, Math.min(endPeriod, totalPeriods));

    const itemStartDt = new Date(startDt);
    if (currentSCurve.periodType === 'weekly') {
      itemStartDt.setDate(itemStartDt.getDate() + (startPeriod - 1) * 7);
    } else {
      itemStartDt.setMonth(itemStartDt.getMonth() + (startPeriod - 1));
    }
    const itemEndDt = new Date(startDt);
    if (currentSCurve.periodType === 'weekly') {
      itemEndDt.setDate(itemEndDt.getDate() + endPeriod * 7);
    } else {
      itemEndDt.setMonth(itemEndDt.getMonth() + endPeriod);
    }

    const plannedValues = calculatePeriodWeights(rawWeight, startPeriod, endPeriod, totalPeriods, pattern);

    return {
      id: existing ? existing.id : `sch_${item.id || idx + 1}`,
      projectId: currentSCurve.projectId,
      rabItemId: item.id,
      workCode: item.code,
      description: item.name,
      category: item.category as any,
      weight: Number(rawWeight.toFixed(2)),
      plannedCost: itemCost,
      plannedStartDate: itemStartDt.toISOString().split('T')[0],
      plannedEndDate: itemEndDt.toISOString().split('T')[0],
      duration: endPeriod - startPeriod + 1,
      startPeriod,
      endPeriod,
      distributionType: pattern,
      plannedPeriodValues: plannedValues,
    };
  });

  // Normalize total weights to exactly 100%
  const sumWeight = newScheduleItems.reduce((s, it) => s + it.weight, 0);
  if (sumWeight > 0) {
    let acc = 0;
    newScheduleItems.forEach((it, idx) => {
      if (idx === newScheduleItems.length - 1) {
        it.weight = Number((100 - acc).toFixed(2));
      } else {
        it.weight = Number(((it.weight / sumWeight) * 100).toFixed(2));
        acc += it.weight;
      }
      it.plannedPeriodValues = calculatePeriodWeights(
        it.weight,
        it.startPeriod,
        it.endPeriod,
        totalPeriods,
        it.distributionType
      );
    });
  }

  const updatedSCurve: ProjectSCurve = {
    ...currentSCurve,
    totalBudget: totalDirectCost,
    scheduleItems: newScheduleItems,
    periodRecords: currentSCurve.periodRecords,
    lastUpdated: new Date().toISOString().split('T')[0],
  };

  return recalculateSCurve(updatedSCurve);
}

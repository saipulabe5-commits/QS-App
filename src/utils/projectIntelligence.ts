import { Project } from '../types';

export function calculateProjectHealthScore(metrics: any): number {
  if (!metrics) return 0;
  // Deterministic weighted score
  const financial = (metrics.financial || 0) * 0.4;
  const schedule = (metrics.schedule || 0) * 0.3;
  const quality = (metrics.quality || 0) * 0.3;
  const score = financial + schedule + quality;
  return Math.min(100, Math.max(0, score));
}

export function evaluateEarnedValue(pv: number, ev: number, ac: number) {
  if (pv < 0 || ev < 0 || ac < 0) throw new Error("Invalid EVM inputs");
  const cv = ev - ac;
  const sv = ev - pv;
  const cpi = ac === 0 ? 1 : ev / ac;
  const spi = pv === 0 ? 1 : ev / pv;
  return { cv, sv, cpi, spi };
}

export function assessCashflowStress(baselineOutflow: number, delayMonths: number, costSpikePercent: number) {
  const newOutflow = baselineOutflow * (1 + costSpikePercent / 100);
  return {
    peakDeficitIncrease: newOutflow - baselineOutflow,
    delayImpact: delayMonths > 0 ? "HIGH" : "NORMAL"
  };
}

export function detectProfitErosion(baselineMargin: number, currentMargin: number) {
  if (currentMargin < baselineMargin * 0.5) return "CRITICAL";
  if (currentMargin < baselineMargin * 0.8) return "WARNING";
  return "HEALTHY";
}

export function computeDataQuality(project: Project): number {
  let score = 100;
  if (!project.name) score -= 20;
  if (!project.location) score -= 10;
  return Math.max(0, score);
}

export function diffProjects(v1: Project, v2: Project) {
  const diffs = [];
  if (v1.name !== v2.name) diffs.push("Name changed");
  if (v1.status !== v2.status) diffs.push("Status changed");
  return diffs;
}

export function isolatePortfolio(userProjects: Project[], requestedProjectId: string) {
  const found = userProjects.find(p => p.id === requestedProjectId);
  if (!found) throw new Error("Unauthorized access or project not found");
  return found;
}

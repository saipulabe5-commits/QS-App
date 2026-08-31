import { Project } from '../types';
import { calculateProjectFinancials } from './calculations';

export type Role = 'OWNER' | 'ADMIN' | 'FINANCE' | 'PROJECT_LEADER' | 'TEAM' | 'VIEWER' | 'CLIENT_VIEWER';

export interface UserContext {
  id: string;
  role: Role;
  email: string;
}

export interface SecurityContext {
  user: UserContext;
  project?: Project;
}

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  OWNER: ['project.read', 'project.create', 'project.update', 'project.delete', 'rab.read', 'rab.create', 'rab.update', 'rab.delete', 'financial.calculate', 'financial.approve', 'financial.export', 'financial.restore', 'price.create', 'price.verify', 'ahsp.update', 'cashflow.update', 'scurve.update', 'feasibility.read', 'backup.create', 'backup.restore', 'user.manage', 'audit.read'],
  ADMIN: ['project.read', 'project.create', 'project.update', 'project.delete', 'rab.read', 'rab.create', 'rab.update', 'rab.delete', 'financial.calculate', 'financial.export', 'price.create', 'price.verify', 'ahsp.update', 'cashflow.update', 'scurve.update', 'feasibility.read', 'user.manage', 'audit.read'],
  FINANCE: ['project.read', 'rab.read', 'financial.calculate', 'financial.approve', 'financial.export', 'price.verify', 'feasibility.read', 'audit.read'],
  PROJECT_LEADER: ['project.read', 'project.update', 'rab.read', 'rab.create', 'rab.update', 'financial.calculate', 'price.create', 'cashflow.update', 'scurve.update', 'feasibility.read'],
  TEAM: ['project.read', 'rab.read', 'rab.create', 'rab.update', 'price.create'],
  VIEWER: ['project.read', 'rab.read', 'feasibility.read'],
  CLIENT_VIEWER: ['project.read', 'rab.read'],
};

export function hasPermission(user: UserContext, permission: string): boolean {
  if (!user || !user.role) return false;
  const perms = ROLE_PERMISSIONS[user.role] || [];
  return perms.includes(permission);
}

export function authorizeMutation(user: UserContext, project: Project | undefined, permission: string): boolean {
  if (!hasPermission(user, permission)) return false;
  // ABAC: Check ownership if mutating project
  if (project && permission.includes('update') && user.role !== 'ADMIN' && user.role !== 'OWNER' && user.role !== 'FINANCE') {
    if (project.userId && project.userId !== user.id && user.role !== 'PROJECT_LEADER') {
      return false;
    }
  }
  return true;
}

export function validateFinancialMutation(user: UserContext, project: Project, mutationData: any): boolean {
  if (!authorizeMutation(user, project, 'rab.update')) {
    throw new Error('Unauthorized financial mutation');
  }
  return true;
}

export function generateAuditLog(user: UserContext, action: string, resourceType: string, resourceId: string, reason: string = '') {
  return {
    timestamp: new Date().toISOString(),
    userId: user.id,
    action,
    resourceType,
    resourceId,
    reason,
  };
}

// Stale Data Detection
export function isDataStale(currentChecksum: string, lastCalculatedChecksum: string): boolean {
  return currentChecksum !== lastCalculatedChecksum;
}

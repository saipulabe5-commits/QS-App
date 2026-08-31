export type Permission =
  | 'users.read'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'projects.read'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
  | 'rab.read'
  | 'rab.create'
  | 'rab.update'
  | 'rab.delete'
  | 'templates.manage'
  | 'prices.manage'
  | 'ahsp.manage'
  | 'imports.manage'
  | 'ai.use'
  | 'revisions.read'
  | 'revisions.restore'
  | 'sync.manage'
  | 'settings.manage'
  | 'system.manage';

export const ADMIN_PERMISSIONS: Permission[] = [
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'projects.read',
  'projects.create',
  'projects.update',
  'projects.delete',
  'rab.read',
  'rab.create',
  'rab.update',
  'rab.delete',
  'templates.manage',
  'prices.manage',
  'ahsp.manage',
  'imports.manage',
  'ai.use',
  'revisions.read',
  'revisions.restore',
  'sync.manage',
  'settings.manage',
  'system.manage',
];

export interface User {
  id: string;
  name: string;
  email: string;
  companyName: string;
  role: 'administrator' | 'estimator' | 'project_manager' | 'viewer' | string;
  permissions: Permission[] | string[];
  avatarUrl?: string;
}


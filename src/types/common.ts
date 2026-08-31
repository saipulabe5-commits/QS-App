export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export type ActiveNavTab =
  | 'dashboard'
  | 'projects'
  | 'rab'
  | 'drawings'
  | 'ahsp'
  | 'database'
  | 'templates'
  | 'calculator'
  | 'scurve-plan'
  | 'scurve-actual'
  | 'scurve-comparison'
  | 'scurve-gantt'
  | 'reports'
  | 'settings';


export type NotificationType =
  | 'budget_exceeded'
  | 'budget_warning'
  | 'budget_recovery'
  | 'deadline_approaching'
  | 'deadline_overdue'
  | 'schedule_delayed'
  | 'import_completed'
  | 'import_failed'
  | 'ai_completed'
  | 'ai_failed'
  | 'sync_completed'
  | 'sync_failed'
  | 'validation_error'
  | 'revision_created'
  | 'revision_restored'
  | 'backup_completed'
  | 'backup_failed'
  | 'system_error';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface NotificationItem {
  id: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  source: 'system' | 'budget_engine' | 'deadline_engine' | 'ai' | 'ocr' | 'import' | 'sync' | 'revision' | 'user';
  sourceId?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  expiresAt?: string;
  actionLabel?: string;
  actionTarget?: {
    tab: string;
    projectId?: string;
    itemId?: string;
    filter?: string;
  };
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  enableBudgetNotifications: boolean;
  budgetWarningPercent: number; // default 90%
  budgetCriticalPercent: number; // default 100%
  enableDeadlineNotifications: boolean;
  deadlineReminderDays: number; // default 7
  enableOverdueNotifications: boolean;
  enableRevisionNotifications: boolean;
  revisionPriceChangeThresholdPercent: number; // default 10%
  revisionVolumeChangeThresholdPercent: number; // default 10%
  revisionTotalChangeThresholdPercent: number; // default 5%
  enableBrowserNotifications: boolean;
  enableSound: boolean;
}

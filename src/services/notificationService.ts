import { NotificationItem, NotificationSettings, NotificationType, NotificationSeverity, Project, RABItem } from '../types';
import { idbStorage, DB_STORES } from '../db/indexedDBAdapter';
import { calculateRAB } from '../utils/calculations';
import { formatRupiah } from '../utils/formatters';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enableBudgetNotifications: true,
  budgetWarningPercent: 90,
  budgetCriticalPercent: 100,
  enableDeadlineNotifications: true,
  deadlineReminderDays: 7,
  enableOverdueNotifications: true,
  enableRevisionNotifications: true,
  revisionPriceChangeThresholdPercent: 10,
  revisionVolumeChangeThresholdPercent: 10,
  revisionTotalChangeThresholdPercent: 5,
  enableBrowserNotifications: false,
  enableSound: true,
};

const NOTIF_SETTINGS_KEY = 'notif_settings';

/**
 * Normalisasi tanggal aman (menghindari timezone shifting browser)
 */
function normalizeDateOnly(dateStr: string): number {
  if (!dateStr) return 0;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])).getTime();
  }
  return new Date(dateStr).setHours(0, 0, 0, 0);
}

/**
 * NotificationService
 * Pusat pengelolaan notifikasi cerdas untuk anggaran, deadline, kurva S, revisi, dan sinkronisasi.
 */
export class NotificationService {
  /**
   * Mengambil preferensi notifikasi
   */
  static async getSettings(): Promise<NotificationSettings> {
    const data = await idbStorage.get<{ key: string; value: NotificationSettings }>(
      DB_STORES.APP_METADATA,
      NOTIF_SETTINGS_KEY
    );
    return data?.value || DEFAULT_NOTIFICATION_SETTINGS;
  }

  /**
   * Menyimpan preferensi notifikasi
   */
  static async saveSettings(settings: NotificationSettings): Promise<void> {
    await idbStorage.put(DB_STORES.APP_METADATA, {
      key: NOTIF_SETTINGS_KEY,
      value: settings,
    });
  }

  /**
   * Mengambil semua notifikasi pengguna
   */
  static async getAll(userId: string = 'usr_demo_1'): Promise<NotificationItem[]> {
    const list = await idbStorage.getAll<NotificationItem>(DB_STORES.NOTIFICATIONS);
    return list
      .filter((n) => !userId || n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Menambahkan notifikasi baru dengan pencegahan duplikasi dalam periode cooldown
   */
  static async addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'isRead' | 'isDismissed'>): Promise<NotificationItem | null> {
    const existing = await idbStorage.getAll<NotificationItem>(DB_STORES.NOTIFICATIONS);
    
    // Cek duplikasi identik dalam 1 jam terakhir
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const isDuplicate = existing.some((n) => {
      return (
        n.projectId === notif.projectId &&
        n.type === notif.type &&
        n.title === notif.title &&
        new Date(n.createdAt).getTime() > oneHourAgo
      );
    });

    if (isDuplicate) {
      return null;
    }

    const newItem: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
      isDismissed: false,
    };

    await idbStorage.put(DB_STORES.NOTIFICATIONS, newItem);

    // Kirim notifikasi browser jika diizinkan
    this.sendBrowserNotification(newItem);

    return newItem;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<void> {
    const notif = await idbStorage.get<NotificationItem>(DB_STORES.NOTIFICATIONS, id);
    if (notif) {
      notif.isRead = true;
      await idbStorage.put(DB_STORES.NOTIFICATIONS, notif);
    }
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId: string): Promise<void> {
    const list = await this.getAll(userId);
    const updated = list.map((n) => ({ ...n, isRead: true }));
    await idbStorage.putAll(DB_STORES.NOTIFICATIONS, updated);
  }

  /**
   * Dismiss notification
   */
  static async dismiss(id: string): Promise<void> {
    const notif = await idbStorage.get<NotificationItem>(DB_STORES.NOTIFICATIONS, id);
    if (notif) {
      notif.isDismissed = true;
      await idbStorage.put(DB_STORES.NOTIFICATIONS, notif);
    }
  }

  /**
   * Delete notification
   */
  static async delete(id: string): Promise<void> {
    await idbStorage.delete(DB_STORES.NOTIFICATIONS, id);
  }

  /**
   * Hapus notifikasi kadaluarsa
   */
  static async clearExpired(): Promise<void> {
    const now = new Date().getTime();
    const list = await idbStorage.getAll<NotificationItem>(DB_STORES.NOTIFICATIONS);
    for (const notif of list) {
      if (notif.expiresAt && new Date(notif.expiresAt).getTime() < now) {
        await idbStorage.delete(DB_STORES.NOTIFICATIONS, notif.id);
      }
    }
  }

  /**
   * Pengecekan ambang anggaran (Budget Guard)
   */
  static async checkBudgetAlerts(project: Project, items: RABItem[]): Promise<NotificationItem | null> {
    const settings = await this.getSettings();
    if (!settings.enableBudgetNotifications) return null;

    const targetBudget = project.targetBudget ?? 0;
    if (targetBudget <= 0) return null;

    const calc = calculateRAB(items, project.overheadPercent, project.profitPercent, project.taxPercent);
    const usagePercent = Number(((calc.grandTotal / targetBudget) * 100).toFixed(1));

    if (usagePercent >= settings.budgetCriticalPercent) {
      const overAmount = calc.grandTotal - targetBudget;
      return await this.addNotification({
        userId: project.userId,
        projectId: project.id,
        projectName: project.name,
        type: 'budget_exceeded',
        severity: 'critical',
        title: `Anggaran Melebihi Batas: ${project.name}`,
        message: `Total RAB (${formatRupiah(calc.grandTotal)}) telah melampaui plafon target anggaran (${formatRupiah(targetBudget)}) sebesar ${formatRupiah(overAmount)} (${usagePercent}%).`,
        source: 'budget_engine',
        sourceId: project.id,
        actionLabel: 'Tinjau RAB',
        actionTarget: { tab: 'rab', projectId: project.id },
      });
    } else if (usagePercent >= settings.budgetWarningPercent) {
      return await this.addNotification({
        userId: project.userId,
        projectId: project.id,
        projectName: project.name,
        type: 'budget_warning',
        severity: 'warning',
        title: `Peringatan Anggaran: ${project.name}`,
        message: `Total RAB saat ini mencapai ${formatRupiah(calc.grandTotal)} (${usagePercent}% dari anggaran ${formatRupiah(targetBudget)}).`,
        source: 'budget_engine',
        sourceId: project.id,
        actionLabel: 'Tinjau RAB',
        actionTarget: { tab: 'rab', projectId: project.id },
      });
    }

    return null;
  }

  /**
   * Pengecekan deadline dan keterlambatan jadwal proyek
   */
  static async checkDeadlineAlerts(project: Project): Promise<NotificationItem | null> {
    const settings = await this.getSettings();
    if (!settings.enableDeadlineNotifications) return null;
    if (project.status === 'Selesai') return null;
    if (!project.endDate) return null;

    const todayMs = new Date().setHours(0, 0, 0, 0);
    const deadlineMs = normalizeDateOnly(project.endDate);
    if (!deadlineMs) return null;

    const diffDays = Math.ceil((deadlineMs - todayMs) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && settings.enableOverdueNotifications) {
      return await this.addNotification({
        userId: project.userId,
        projectId: project.id,
        projectName: project.name,
        type: 'deadline_overdue',
        severity: 'critical',
        title: `Target Waktu Terlewat: ${project.name}`,
        message: `Target selesai proyek (${project.endDate}) telah terlewat ${Math.abs(diffDays)} hari yang lalu dan status masih ${project.status}.`,
        source: 'deadline_engine',
        sourceId: project.id,
        actionLabel: 'Buka Jadwal Kurva S',
        actionTarget: { tab: 'scurve-plan', projectId: project.id },
      });
    } else if (diffDays <= 1) {
      return await this.addNotification({
        userId: project.userId,
        projectId: project.id,
        projectName: project.name,
        type: 'deadline_approaching',
        severity: 'critical',
        title: `Deadline Kritis: ${project.name}`,
        message: `Batas waktu proyek tersisa ${diffDays === 0 ? 'Hari Ini' : '1 hari lagi'} (Target: ${project.endDate}).`,
        source: 'deadline_engine',
        sourceId: project.id,
        actionLabel: 'Buka Proyek',
        actionTarget: { tab: 'projects', projectId: project.id },
      });
    } else if (diffDays <= settings.deadlineReminderDays) {
      return await this.addNotification({
        userId: project.userId,
        projectId: project.id,
        projectName: project.name,
        type: 'deadline_approaching',
        severity: 'warning',
        title: `Mendekati Batas Waktu: ${project.name}`,
        message: `Target penyelesaian proyek tersisa ${diffDays} hari lagi (${project.endDate}).`,
        source: 'deadline_engine',
        sourceId: project.id,
        actionLabel: 'Buka Proyek',
        actionTarget: { tab: 'projects', projectId: project.id },
      });
    }

    return null;
  }

  /**
   * Browser Notification Dispatcher
   */
  private static async sendBrowserNotification(item: NotificationItem): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(item.title, {
          body: item.message,
          icon: '/icon-192.png',
        });
      }
    } catch {
      // Ignore if browser environment blocks notification
    }
  }

  /**
   * Request Notification Permission
   */
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
}

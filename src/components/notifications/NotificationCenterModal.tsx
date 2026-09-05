import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  NotificationItem,
  NotificationType,
  NotificationSeverity,
  NotificationSettings,
} from '../../types';
import {
  NotificationService,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../../services/notificationService';
import {
  X,
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCheck,
  Trash2,
  Settings,
  Sliders,
  ExternalLink,
  ShieldAlert,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

type FilterTab = 'all' | 'unread' | 'budget' | 'deadline' | 'revision' | 'settings';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { user, setActiveTab, setActiveProjectId, showToast } = useApp();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        NotificationService.getAll(user?.id),
        NotificationService.getSettings(),
      ]);
      setNotifications(list);
      setSettings(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    onRefresh();
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead(user?.id || 'usr_demo_1');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    onRefresh();
    showToast('Semua Dibaca', 'Seluruh notifikasi telah ditandai sebagai dibaca.', 'info');
  };

  const handleDelete = async (id: string) => {
    await NotificationService.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onRefresh();
  };

  const handleActionClick = (notif: NotificationItem) => {
    if (notif.actionTarget) {
      if (notif.actionTarget.projectId) {
        setActiveProjectId(notif.actionTarget.projectId);
      }
      if (notif.actionTarget.tab) {
        setActiveTab(notif.actionTarget.tab as any);
      }
      handleMarkAsRead(notif.id);
      onClose();
    }
  };

  const handleSaveSettings = async () => {
    await NotificationService.saveSettings(settings);
    showToast('Pengaturan Disimpan', 'Preferensi notifikasi dan ambang batas berhasil diperbarui.', 'success');
  };

  const handleEnableBrowserNotification = async () => {
    const granted = await NotificationService.requestPermission();
    if (granted) {
      setSettings({ ...settings, enableBrowserNotifications: true });
      showToast('Notifikasi Diizinkan', 'Browser diizinkan menampilkan notifikasi desktop.', 'success');
    } else {
      showToast('Izin Ditolak', 'Izin notifikasi browser diblokir atau tidak diberikan.', 'warning');
    }
  };

  // Filter items
  const filteredNotifications = notifications.filter((n) => {
    if (n.isDismissed) return false;
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'budget') return n.type.startsWith('budget');
    if (activeFilter === 'deadline') return n.type.startsWith('deadline');
    if (activeFilter === 'revision') return n.type.startsWith('revision');
    return true;
  });

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Kritis
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Peringatan
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Info className="w-3 h-3 text-blue-600" />
            Info
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--bg-elevated)]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-elevated)] w-full max-w-2xl rounded-2xl shadow-2xl border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-[var(--bg-elevated)] text-[var(--text-primary)] px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-[var(--border-primary)]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pusat Notifikasi & Pengingat
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Peringatan anggaran, deadline proyek, kurva S, revisi, dan status sinkronisasi data.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="bg-[var(--bg-elevated-hover)] border-b border-[var(--border-primary)] px-6 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center space-x-1">
            {[
              { id: 'all' as FilterTab, label: 'Semua' },
              { id: 'unread' as FilterTab, label: `Belum Dibaca (${notifications.filter((n) => !n.isRead).length})` },
              { id: 'budget' as FilterTab, label: 'Anggaran' },
              { id: 'deadline' as FilterTab, label: 'Jadwal & Deadline' },
              { id: 'revision' as FilterTab, label: 'Revisi RAB' },
              { id: 'settings' as FilterTab, label: 'Pengaturan' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === t.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-200 dark:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeFilter !== 'settings' && notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 ml-2 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeFilter === 'settings' ? (
            /* Settings Panel */
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Konfigurasi Ambang Batas Notifikasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sesuaikan sensitivitas peringatan anggaran, batas waktu proyek, dan toleransi revisi harga.
                </p>
              </div>

              {/* Budget Rules */}
              <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Notifikasi Anggaran & Plafon Biaya</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Kirim peringatan jika total RAB mendekati atau melebihi anggaran target.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableBudgetNotifications}
                    onChange={(e) => setSettings({ ...settings, enableBudgetNotifications: e.target.checked })}
                    className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </div>

                {settings.enableBudgetNotifications && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-primary)]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                        Peringatan Kuning (% Anggaran)
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={99}
                        value={settings.budgetWarningPercent}
                        onChange={(e) => setSettings({ ...settings, budgetWarningPercent: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                        Kritis Merah (% Anggaran)
                      </label>
                      <input
                        type="number"
                        min={100}
                        max={150}
                        value={settings.budgetCriticalPercent}
                        onChange={(e) => setSettings({ ...settings, budgetCriticalPercent: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Deadline Rules */}
              <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Pengingat Jadwal & Batas Waktu</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Peringatan saat tanggal target selesai proyek semakin dekat atau terlewat.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableDeadlineNotifications}
                    onChange={(e) => setSettings({ ...settings, enableDeadlineNotifications: e.target.checked })}
                    className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </div>

                {settings.enableDeadlineNotifications && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border-primary)]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-primary)] mb-1">
                        Mulai Ingatkan (Hari Sebelum)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={settings.deadlineReminderDays}
                        onChange={(e) => setSettings({ ...settings, deadlineReminderDays: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.enableOverdueNotifications}
                          onChange={(e) => setSettings({ ...settings, enableOverdueNotifications: e.target.checked })}
                          className="rounded-sm text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-semibold text-[var(--text-primary)]">Notifikasi Keterlambatan (Overdue)</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Revision Rules */}
              <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">Notifikasi Perubahan Revisi Signifikan</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Peringatkan jika terjadi perubahan harga/volume di atas batas toleransi.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableRevisionNotifications}
                    onChange={(e) => setSettings({ ...settings, enableRevisionNotifications: e.target.checked })}
                    className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                </div>

                {settings.enableRevisionNotifications && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-primary)]">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-primary)] mb-1">
                        Delta Harga (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={settings.revisionPriceChangeThresholdPercent}
                        onChange={(e) => setSettings({ ...settings, revisionPriceChangeThresholdPercent: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-primary)] mb-1">
                        Delta Volume (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={settings.revisionVolumeChangeThresholdPercent}
                        onChange={(e) => setSettings({ ...settings, revisionVolumeChangeThresholdPercent: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--text-primary)] mb-1">
                        Delta Grand Total (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={settings.revisionTotalChangeThresholdPercent}
                        onChange={(e) => setSettings({ ...settings, revisionTotalChangeThresholdPercent: Number(e.target.value) })}
                        className="w-full px-2 py-1 text-xs border border-[var(--border-primary)] rounded-lg bg-[var(--bg-elevated)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Browser Push Permission */}
              <div className="p-4 bg-[var(--bg-elevated-hover)] rounded-xl border border-[var(--border-primary)] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">Notifikasi Browser Desktop</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Izinkan browser menampilkan popup notifikasi saat aplikasi berada di latar belakang.</p>
                </div>
                <button
                  type="button"
                  onClick={handleEnableBrowserNotification}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Aktifkan Izin Browser
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-5 py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          ) : (
            /* Notification List */
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 dark:text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold">Tidak ada notifikasi pada kategori ini.</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">Semua aktivitas proyek dan anggaran berjalan normal.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all ${
                      notif.isRead
                        ? 'bg-[var(--bg-elevated)] border-[var(--border-primary)] opacity-80'
                        : 'bg-blue-50/40 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">{getSeverityBadge(notif.severity)}</div>
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              notif.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-secondary)]">
                            <span>
                              {new Date(notif.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {notif.projectName && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[var(--text-secondary)]">{notif.projectName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {notif.actionLabel && notif.actionTarget && (
                          <button
                            onClick={() => handleActionClick(notif)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <span>{notif.actionLabel}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1 text-[var(--text-secondary)] hover:text-blue-600 rounded-md"
                            title="Tandai Dibaca"
                          >
                            <CheckCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-1 text-[var(--text-secondary)] hover:text-rose-600 rounded-md"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[var(--bg-elevated-hover)] border-t border-[var(--border-primary)] px-6 py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{notifications.length} Total Catatan Notifikasi</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-elevated-hover)] transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

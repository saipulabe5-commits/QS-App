import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationService } from '../../services/notificationService';
import { NotificationItem } from '../../types';
import { NotificationCenterModal } from './NotificationCenterModal';

export const NotificationBell: React.FC = () => {
  const { user, projects, rabItems } = useApp();
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasCritical, setHasCritical] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Load notifikasi & cek alert otomatis
  const loadNotifications = async () => {
    try {
      const list = await NotificationService.getAll(user?.id);
      setNotifications(list);
      const unread = list.filter((n) => !n.isRead && !n.isDismissed);
      setUnreadCount(unread.length);
      setHasCritical(unread.some((n) => n.severity === 'critical'));
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();

    // Jalankan background check untuk budget & deadline
    const checkAlerts = async () => {
      for (const proj of projects) {
        const pItems = rabItems.filter((it) => it.projectId === proj.id);
        await NotificationService.checkBudgetAlerts(proj, pItems);
        await NotificationService.checkDeadlineAlerts(proj);
      }
      loadNotifications();
    };

    checkAlerts();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [projects, rabItems, user]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden"
        title="Pusat Notifikasi & Pengingat Proyek"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white rounded-full transition-transform scale-100 ${
              hasCritical ? 'bg-rose-600 animate-pulse' : 'bg-blue-600'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationCenterModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            loadNotifications();
          }}
          onRefresh={loadNotifications}
        />
      )}
    </>
  );
};

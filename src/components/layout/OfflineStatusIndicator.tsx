import React, { useState, useEffect } from 'react';
import { SyncService } from '../../services/syncService';
import { SyncStatusInfo } from '../../types';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SyncCenterModal } from './SyncCenterModal';

export const OfflineStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<SyncStatusInfo>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    failedCount: 0,
    conflictCount: 0,
    mode: 'cloud',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    SyncService.init();
    const unsubscribe = SyncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return () => unsubscribe();
  }, []);

  const getStatusBadge = () => {
    if (!status.isOnline) {
      return {
        bg: 'bg-[var(--traffic-yellow)]/10 text-amber-700 border-amber-300',
        icon: WifiOff,
        text: 'Mode Offline (PWA Aktif)',
        count: status.pendingCount > 0 ? `${status.pendingCount} antrian` : null,
      };
    }
    if (status.isSyncing) {
      return {
        bg: 'bg-blue-500/10 text-blue-700 border-blue-300',
        icon: RefreshCw,
        iconClass: 'animate-spin',
        text: 'Menyinkronkan...',
        count: null,
      };
    }
    if (status.conflictCount > 0) {
      return {
        bg: 'bg-rose-500/10 text-rose-700 border-rose-300',
        icon: AlertTriangle,
        text: 'Ada Konflik Data',
        count: `${status.conflictCount} konflik`,
      };
    }
    if (status.pendingCount > 0) {
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 border-indigo-300',
        icon: RefreshCw,
        text: 'Antrian Sync',
        count: `${status.pendingCount}`,
      };
    }
    return {
      bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
      icon: Wifi,
      text: 'Tersinkron',
      count: null,
    };
  };

  const badge = getStatusBadge();
  const Icon = badge.icon;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all hover:opacity-80 focus:outline-hidden ${badge.bg}`}
        title="Klik untuk membuka Pusat Sinkronisasi Offline PWA"
      >
        <Icon className={`w-3.5 h-3.5 ${badge.iconClass || ''}`} />
        <span className="hidden sm:inline">{badge.text}</span>
        {badge.count && (
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[var(--bg-elevated)]/80 border shadow-2xs">
            {badge.count}
          </span>
        )}
      </button>

      {isModalOpen && (
        <SyncCenterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          status={status}
        />
      )}
    </>
  );
};

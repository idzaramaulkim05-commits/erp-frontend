import React from 'react';
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Package,
  Radio,
  Shield,
  Volume2,
  VolumeX,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AppNotification {
  id: string;
  type: 'job' | 'info' | 'success' | 'alert';
  title: string;
  message: string;
  routeTarget?: string;
  targetId?: string;
  timestamp: Date;
}

interface NotificationToastContainerProps {
  notifications: AppNotification[];
  onDismiss: (id: string) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const NotificationToastContainer: React.FC<NotificationToastContainerProps> = ({
  notifications,
  onDismiss,
  isSoundEnabled,
  onToggleSound,
}) => {
  const navigate = useNavigate();

  if (notifications.length === 0) return null;

  const getIcon = (title: string) => {
    if (title.includes('WO') || title.includes('Teknisi') || title.includes('Instalasi')) {
      return <Wrench className="h-5 w-5 text-amber-600" />;
    }
    if (title.includes('NOC') || title.includes('PPPoE')) {
      return <Radio className="h-5 w-5 text-sky-600" />;
    }
    if (title.includes('Finance') || title.includes('Pembayaran') || title.includes('Uang')) {
      return <Wallet className="h-5 w-5 text-emerald-600" />;
    }
    if (title.includes('Gudang') || title.includes('Material') || title.includes('Retur')) {
      return <Package className="h-5 w-5 text-violet-600" />;
    }
    return <Bell className="h-5 w-5 text-emerald-600" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="group relative flex flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.18)] backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* Top Bar */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 shadow-xs">
                {getIcon(notif.title)}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">{notif.title}</h4>
                <span className="text-[10px] text-slate-400">Baru saja</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onToggleSound}
                title={isSoundEnabled ? 'Suara Notifikasi Aktif' : 'Suara Notifikasi Hening'}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                {isSoundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-600" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
              </button>
              <button
                type="button"
                onClick={() => onDismiss(notif.id)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Message Content */}
          <p className="mt-2 text-xs font-medium leading-relaxed text-slate-700">
            {notif.message}
          </p>

          {/* Action button */}
          {notif.routeTarget && (
            <div className="mt-3 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  navigate(notif.routeTarget!);
                  onDismiss(notif.id);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-slate-800"
              >
                <span>Buka Tugas</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

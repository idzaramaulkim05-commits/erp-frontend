import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

type ConfirmTone = 'default' | 'success' | 'warning' | 'danger';

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const toneMeta: Record<ConfirmTone, { icon: React.ComponentType<{ className?: string }>; accent: string; button: string }> = {
  default: {
    icon: AlertTriangle,
    accent: 'bg-slate-100 text-slate-700',
    button: 'bg-slate-950 hover:bg-slate-800',
  },
  success: {
    icon: CheckCircle2,
    accent: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    accent: 'bg-amber-100 text-amber-700',
    button: 'bg-amber-500 hover:bg-amber-400',
  },
  danger: {
    icon: ShieldAlert,
    accent: 'bg-rose-100 text-rose-700',
    button: 'bg-rose-600 hover:bg-rose-500',
  },
};

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const meta = toneMeta[tone];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start gap-4 p-6">
          <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${meta.accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black tracking-tight text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{message}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${meta.button}`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

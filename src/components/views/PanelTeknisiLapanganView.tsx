import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Hammer,
  MapPin,
  MessageCircle,
  Navigation,
  RefreshCcw,
  Route,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder } from '../../types';
import { extractCoordinatesFromUrl, getGoogleMapsDirectionUrl } from '../../utils/coordinates';

const getStatusTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'assigned':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'sedang_diinstal':
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'menunggu_qc_noc':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'dikembalikan_ke_teknisi':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'Konfirmasi Penugasan';
    case 'assigned':
      return 'Siap Jalan';
    case 'sedang_diinstal':
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'menunggu_qc_noc':
      return 'Menunggu QC NOC';
    case 'dikembalikan_ke_teknisi':
      return 'Revisi NOC';
    default:
      return status;
  }
};

const normalizeWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62') && digits.length >= 10) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `62${digits.slice(1)}`;
  return null;
};

export const PanelTeknisiLapanganView: React.FC = () => {
  const {
    currentUser,
    workOrders,
    setSelectedModule,
    isSyncing,
    refreshAll,
  } = useIOMS();

  const myWorkOrders = useMemo(
    () => workOrders.filter((workOrder) => (
      (workOrder.type === 'installation' || workOrder.type === 'maintenance' || workOrder.type === 'uninstallation')
      && workOrder.assignedTechId === currentUser.id
      && ['menunggu_konfirmasi_teknisi', 'assigned', 'sedang_diinstal', 'in_progress', 'menunggu_qc_noc', 'dikembalikan_ke_teknisi'].includes(workOrder.status)
    )),
    [currentUser.id, workOrders],
  );

  const confirmationCount = myWorkOrders.filter((wo) => wo.status === 'menunggu_konfirmasi_teknisi').length;
  const waitingCount = myWorkOrders.filter((wo) => wo.status === 'assigned').length;
  const inProgressCount = myWorkOrders.filter((wo) => wo.status === 'sedang_diinstal' || wo.status === 'in_progress').length;
  const qcCount = myWorkOrders.filter((wo) => wo.status === 'menunggu_qc_noc' || wo.status === 'dikembalikan_ke_teknisi').length;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 sm:text-lg">Panel Teknisi Lapangan</h1>
              <p className="text-[11px] font-semibold text-slate-500">Antrean tugas aktif & penugasan kerja</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshAll()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
              title="Data tersinkron otomatis live. Klik untuk refresh manual."
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Sync</span>
              <RefreshCcw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setSelectedModule('pengerjaan_instalasi_lapangan')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>Buka Pengerjaan Lapangan</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Konfirmasi WO', value: confirmationCount, icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-200' },
          { label: 'Siap Jalan', value: waitingCount, icon: Navigation, color: 'text-sky-700 bg-sky-50 border-sky-200' },
          { label: 'Sedang Jalan', value: inProgressCount, icon: Hammer, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
          { label: 'QC / Revisi', value: qcCount, icon: CheckCircle2, color: 'text-violet-700 bg-violet-50 border-violet-200' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className={`rounded-xl border p-3 ${kpi.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold">{kpi.label}</span>
                <Icon className="h-4 w-4 opacity-80" />
              </div>
              <div className="mt-1 text-2xl font-black">{kpi.value}</div>
            </div>
          );
        })}
      </section>

      {/* Active Work Orders List */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">Daftar Penugasan Aktif ({myWorkOrders.length})</h2>
          <span className="text-[11px] font-bold text-slate-400">Teknisi: {currentUser.name}</span>
        </div>

        {myWorkOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
            Tidak ada Work Order aktif saat ini.
          </div>
        ) : (
          <div className="space-y-2.5">
            {myWorkOrders.map((wo) => {
              const wa = normalizeWhatsAppNumber(wo.customerPhone);
              const coords = extractCoordinatesFromUrl(wo.shareLocationUrl);

              return (
                <div key={wo.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5 transition hover:bg-slate-50">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-slate-900">{wo.customerName}</strong>
                        <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{wo.id}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {wo.packagePlan || 'Layanan Internet'} • <span className="font-semibold text-emerald-700">{wo.region}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span>{wo.address}</span>
                      </div>
                    </div>

                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusTone(wo.status)}`}>
                      {getStatusLabel(wo.status)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                    <div className="flex items-center gap-2">
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-500"
                        >
                          <MessageCircle className="h-3 w-3" /> WA
                        </a>
                      )}
                      {coords ? (
                        <a
                          href={getGoogleMapsDirectionUrl(coords.lat, coords.lng)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <Navigation className="h-3 w-3 text-emerald-600" /> Maps
                        </a>
                      ) : wo.shareLocationUrl ? (
                        <a
                          href={wo.shareLocationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-3 w-3 text-emerald-600" /> Link
                        </a>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedModule('pengerjaan_instalasi_lapangan')}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      <span>Kerjakan WO</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

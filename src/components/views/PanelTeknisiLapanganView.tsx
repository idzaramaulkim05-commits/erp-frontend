import React, { useMemo } from 'react';
import { ClipboardList, Hammer, Hourglass, RotateCcw, Route, Wrench } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder } from '../../types';

const getStatusTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'assigned':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'sedang_diinstal':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'menunggu_qc_noc':
      return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'dikembalikan_ke_teknisi':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'WO Baru Menunggu Konfirmasi';
    case 'assigned':
      return 'Menunggu Dikerjakan';
    case 'sedang_diinstal':
      return 'Sedang Diinstal';
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'menunggu_qc_noc':
      return 'Menunggu QC NOC';
    case 'dikembalikan_ke_teknisi':
      return 'Revisi dari NOC';
    default:
      return status;
  }
};

export const PanelTeknisiLapanganView: React.FC = () => {
  const {
    currentUser,
    workOrders,
    setSelectedModule,
  } = useIOMS();

  const myWorkOrders = useMemo(
    () => workOrders.filter((workOrder) => (
      (workOrder.type === 'installation' || workOrder.type === 'maintenance')
      && workOrder.assignedTechId === currentUser.id
      && ['menunggu_konfirmasi_teknisi', 'assigned', 'sedang_diinstal', 'in_progress', 'menunggu_qc_noc', 'dikembalikan_ke_teknisi'].includes(workOrder.status)
    )),
    [currentUser.id, workOrders],
  );

  const confirmationCount = myWorkOrders.filter((workOrder) => workOrder.status === 'menunggu_konfirmasi_teknisi').length;
  const waitingCount = myWorkOrders.filter((workOrder) => workOrder.status === 'assigned').length;
  const inProgressCount = myWorkOrders.filter((workOrder) => workOrder.status === 'sedang_diinstal' || workOrder.status === 'in_progress').length;
  const qcCount = myWorkOrders.filter((workOrder) => workOrder.status === 'menunggu_qc_noc').length;
  const revisionCount = myWorkOrders.filter((workOrder) => workOrder.status === 'dikembalikan_ke_teknisi').length;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-xl">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200">Dashboard Teknisi Lapangan</div>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Summary pekerjaan dan antrean kerja saya</h1>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Total WO Saya', value: myWorkOrders.length, icon: ClipboardList, accent: 'text-slate-700 bg-slate-100' },
          { label: 'WO Baru', value: confirmationCount, icon: Hourglass, accent: 'text-amber-700 bg-amber-100' },
          { label: 'Menunggu Dikerjakan', value: waitingCount, icon: Hourglass, accent: 'text-sky-700 bg-sky-100' },
          { label: 'Sedang Dikerjakan', value: inProgressCount, icon: Hammer, accent: 'text-emerald-700 bg-emerald-100' },
          { label: 'QC / Revisi', value: qcCount + revisionCount, icon: RotateCcw, accent: 'text-violet-700 bg-violet-100' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-950">{item.value}</div>
              <div className="mt-1 text-sm font-semibold text-slate-800">{item.label}</div>
            </div>
          );
        })}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Daftar Pekerjaan Aktif</h2>
          </div>
          <button
            type="button"
            onClick={() => setSelectedModule('pengerjaan_instalasi_lapangan')}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Route className="h-4 w-4" />
            Buka Halaman Kerja Lapangan
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          {myWorkOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Belum ada WO aktif yang ditugaskan ke teknisi ini.
            </div>
          ) : myWorkOrders.map((workOrder) => (
            <div key={workOrder.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                    {workOrder.id}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(workOrder.status)}`}>
                    {getStatusLabel(workOrder.status)}
                  </span>
                </div>
                <div className="mt-3 text-sm font-bold text-slate-900">{workOrder.customerName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {workOrder.type === 'maintenance' ? 'Gangguan / Maintenance' : (workOrder.packagePlan ?? 'Paket belum tercatat')} • {workOrder.region}
                </div>
                <div className="mt-2 text-xs text-slate-500">{workOrder.address}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModule('pengerjaan_instalasi_lapangan')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                <Wrench className="h-4 w-4" />
                Kerjakan di Halaman Lapangan
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

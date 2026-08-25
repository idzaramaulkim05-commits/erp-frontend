import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, ClipboardCheck, MapPin, Phone, RefreshCcw, UserCheck, Wrench } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder } from '../../types';

const getStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'pending_lead_assignment':
      return 'Menunggu Assignment Kepala Teknisi';
    case 'menunggu_konfirmasi_teknisi':
      return 'Menunggu Konfirmasi Teknisi';
    case 'assigned':
      return 'Sudah Diassign';
    case 'sedang_diinstal':
      return 'Sedang Diinstal';
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'menunggu_qc_noc':
      return 'Menunggu QC NOC';
    case 'dikembalikan_ke_teknisi':
      return 'Revisi Teknisi';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
};

const getStatusTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'pending_lead_assignment':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'menunggu_konfirmasi_teknisi':
      return 'bg-sky-100 text-sky-700 border-sky-200';
    case 'assigned':
      return 'bg-cyan-100 text-cyan-700 border-cyan-200';
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

export const PanelKepalaTeknisiView: React.FC = () => {
  const {
    workOrders,
    users,
    assignWorkOrderToTech,
    setSelectedModule,
  } = useIOMS();
  const [techSelections, setTechSelections] = useState<Record<string, string>>({});

  const techOptions = useMemo(
    () => users.filter((user) => user.role === 'field_tech' && user.isActive !== false),
    [users],
  );

  const operationalWorkOrders = useMemo(
    () => workOrders.filter((workOrder) => ['installation', 'maintenance', 'uninstallation'].includes(workOrder.type)),
    [workOrders],
  );

  const assignmentQueue = useMemo(
    () => operationalWorkOrders.filter((workOrder) => workOrder.status === 'pending_lead_assignment'),
    [operationalWorkOrders],
  );

  const activeAssignments = useMemo(
    () => operationalWorkOrders.filter((workOrder) => ['menunggu_konfirmasi_teknisi', 'assigned', 'sedang_diinstal', 'in_progress', 'menunggu_qc_noc', 'dikembalikan_ke_teknisi'].includes(workOrder.status)),
    [operationalWorkOrders],
  );

  const handleAssign = (workOrderId: string) => {
    const techId = techSelections[workOrderId];
    if (!techId) {
      return;
    }

    assignWorkOrderToTech(workOrderId, techId);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Serah Terima WO Operasional</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Panel Kepala Teknisi</h1>
          </div>
          <button
            type="button"
            onClick={() => setSelectedModule('panel_kepala_teknisi')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Panel Assignment
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: 'Siap Assign',
            value: assignmentQueue.length,
            icon: ClipboardCheck,
            accent: 'text-amber-600 bg-amber-50',
          },
          {
            label: 'Teknisi Tersedia',
            value: techOptions.length,
            icon: UserCheck,
            accent: 'text-emerald-600 bg-emerald-50',
          },
          {
            label: 'WO Aktif',
            value: activeAssignments.length,
            icon: Wrench,
            accent: 'text-sky-600 bg-sky-50',
          },
          {
            label: 'Perlu Revisi',
            value: activeAssignments.filter((workOrder) => workOrder.status === 'dikembalikan_ke_teknisi').length,
            icon: ArrowRightLeft,
            accent: 'text-rose-600 bg-rose-50',
          },
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
        <h2 className="text-lg font-black tracking-tight text-slate-900">Queue Assignment Teknisi</h2>
        <p className="mt-2 text-sm text-slate-500">
          Pilih teknisi lapangan untuk setiap WO yang sudah siap jalan.
        </p>

        {assignmentQueue.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            Tidak ada WO yang sedang menunggu assignment kepala teknisi.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {assignmentQueue.map((workOrder) => (
              <div key={workOrder.id} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                        {workOrder.id}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600">
                        {workOrder.type === 'maintenance' ? 'WO Gangguan' : workOrder.type === 'uninstallation' ? 'WO Pencabutan' : 'WO Instalasi'}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(workOrder.status)}`}>
                        {getStatusLabel(workOrder.status)}
                      </span>
                    </div>

                    <div>
                      <div className="text-lg font-black text-slate-950">{workOrder.customerName}</div>
                      <div className="mt-1 text-sm text-slate-500">
                      {workOrder.type === 'maintenance'
                        ? (workOrder.issueSummary ?? 'WO gangguan pelanggan')
                        : workOrder.type === 'uninstallation'
                        ? 'Pencabutan alat pelanggan dan serah-terima retur ke gudang'
                        : (workOrder.packagePlan ?? 'Paket belum tercatat')}
                      </div>
                      {workOrder.type === 'maintenance' && workOrder.maintenancePayload?.replacementFlowActive ? (
                        <div className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                          Membawa alat replacement
                        </div>
                      ) : null}
                      {workOrder.type === 'uninstallation' ? (
                        <div className="mt-2 inline-flex rounded-full bg-rose-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-rose-700">
                          Wajib retur alat ke gudang
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {workOrder.customerPhone}</div>
                      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {workOrder.region}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {workOrder.address}
                    </div>
                  </div>

                  <div className="w-full max-w-sm rounded-[24px] border border-emerald-200 bg-white p-4">
                    <div className="text-sm font-black text-slate-900">Pilih Teknisi Lapangan</div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Setelah assignment, WO akan tampil di panel teknisi lapangan sebagai pekerjaan aktif yang harus dikonfirmasi teknisi.
                    </p>

                    <select
                      value={techSelections[workOrder.id] ?? ''}
                      onChange={(event) => setTechSelections((current) => ({ ...current, [workOrder.id]: event.target.value }))}
                      className="mt-4 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Pilih teknisi</option>
                      {techOptions.map((user) => (
                        <option key={user.id} value={user.id}>{user.name} • {user.roleTitle}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleAssign(workOrder.id)}
                      disabled={!techSelections[workOrder.id]}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Assign ke Teknisi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-black tracking-tight text-slate-900">Monitoring WO Lapangan</h2>
        <p className="mt-2 text-sm text-slate-500">Pantauan singkat WO yang sudah berjalan setelah assignment.</p>

        <div className="mt-5 grid gap-3">
          {activeAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Belum ada WO aktif setelah assignment.
            </div>
          ) : activeAssignments.map((workOrder) => (
            <div key={workOrder.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">{workOrder.customerName}</div>
                <div className="mt-1 text-xs text-slate-500">{workOrder.id} • {workOrder.type === 'maintenance' ? 'WO Gangguan' : workOrder.type === 'uninstallation' ? 'WO Pencabutan' : 'WO Instalasi'} • {workOrder.assignedTechName ?? 'Belum ada teknisi'}</div>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${getStatusTone(workOrder.status)}`}>
                {getStatusLabel(workOrder.status)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

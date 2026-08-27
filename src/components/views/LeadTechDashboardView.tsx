import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck2,
  MapPin,
  Phone,
  Shield,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket, WorkOrder } from '../../types';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface LeadTechDashboardViewProps {
  onSelectTicket?: (ticket: TroubleTicket) => void;
}

const getWorkOrderTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'completed':
      return 'emerald';
    case 'waiting_noc_activation':
    case 'field_submitted':
      return 'violet';
    case 'assigned':
      return 'amber';
    default:
      return 'slate';
  }
};

export const LeadTechDashboardView: React.FC<LeadTechDashboardViewProps> = () => {
  const {
    workOrders,
    tickets,
    users,
    assignWorkOrderToTech,
    approveLeadTechSOP,
  } = useIOMS();

  const [selectedTab, setSelectedTab] = useState<'pending_wo' | 'sop_review' | 'all_wo'>('pending_wo');
  const [selectedTech, setSelectedTech] = useState<{ [woId: string]: string }>({});
  const [sopChecklist, setSopChecklist] = useState({
    cablesNeatlyClamped: true,
    protectionSleeveInstalled: true,
    customerAreaCleaned: true,
    speedtestVerified: true,
  });
  const [sopNotes, setSopNotes] = useState('Pemasangan klem rapi, proteksi core terlindungi, redaman -20.2 dBm.');

  const fieldTechs = users.filter((user) => user.role === 'field_tech' || user.role === 'lead_tech');
  const ticketsWaitingSop = tickets.filter((ticket) => ticket.status === 'field_progress' && ticket.fieldWorkReport?.completedAt);
  const pendingWos = workOrders.filter((workOrder) => ['pending', 'pending_lead_assignment', 'assigned'].includes(workOrder.status));
  const waitingActivation = workOrders.filter((workOrder) => workOrder.status === 'waiting_noc_activation').length;

  const handleApproveSop = (ticketId: string) => {
    approveLeadTechSOP(ticketId, sopChecklist, sopNotes);
  };

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="Lead Technician Operations"
        title="Dispatch work order, kontrol kualitas SOP, dan kesiapan teknisi"
        subtitle="Area operasional sekunder setelah home pipeline lead tech. Halaman ini memusatkan penugasan teknisi lapangan dan approval SOP sebelum handoff akhir ke NOC."
        stats={[
          {
            label: 'Pending Dispatch',
            value: pendingWos.length,
            description: 'Work order yang masih menunggu assignment atau eksekusi awal teknisi.',
            icon: Wrench,
            accentClass: 'bg-sky-400/15 text-sky-200',
          },
          {
            label: 'SOP Review',
            value: ticketsWaitingSop.length,
            description: 'Laporan lapangan yang menunggu approval kepala teknisi.',
            icon: FileCheck2,
            accentClass: 'bg-violet-400/15 text-violet-200',
          },
          {
            label: 'Teknisi Siap',
            value: fieldTechs.length,
            description: 'Teknisi yang tersedia untuk assignment work order hari ini.',
            icon: UserCheck,
            accentClass: 'bg-emerald-400/15 text-emerald-200',
          },
          {
            label: 'Waiting NOC',
            value: waitingActivation,
            description: 'Work order yang sudah selesai lapangan dan menunggu aktivasi NOC.',
            icon: Shield,
            accentClass: 'bg-amber-400/15 text-amber-200',
          },
        ]}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTab('pending_wo')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              selectedTab === 'pending_wo' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Queue Dispatch ({pendingWos.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('sop_review')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              selectedTab === 'sop_review' ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Review SOP Lapangan ({ticketsWaitingSop.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('all_wo')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              selectedTab === 'all_wo' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Work Order ({workOrders.length})
          </button>
        </div>
      </div>

      {selectedTab === 'sop_review' && (
        <WorkspaceSectionShell
          eyebrow="SOP Review Queue"
          title="Pemeriksaan kualitas hasil lapangan sebelum handoff ke NOC"
          subtitle="Verifikasi kerapian fisik, proteksi kabel, kebersihan area, dan bukti kerja teknisi agar closing NOC tidak menerima laporan yang belum layak."
          badge={`${ticketsWaitingSop.length} menunggu approval`}
        >
          {ticketsWaitingSop.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">Semua laporan teknisi sudah dievaluasi SOP</p>
              <p className="mt-0.5 text-xs text-slate-500">Tidak ada laporan pengerjaan lapangan yang masih menunggu approval kepala teknisi.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ticketsWaitingSop.map((ticket) => {
                const report = ticket.fieldWorkReport;

                return (
                  <div key={ticket.id} className="p-5 transition-colors hover:bg-slate-50/70">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{ticket.id}</span>
                          <WorkspaceStatusPill label="FIELD SUBMITTED" tone="violet" />
                          <span className="text-xs text-slate-400">Selesai: {report?.completedAt}</span>
                        </div>

                        <div>
                          <h4 className="text-base font-black text-slate-950">{ticket.customerName}</h4>
                          <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Teknisi</span>
                            <span className="mt-1 block font-semibold text-slate-800">{ticket.assignedTechName || 'Belum tercatat'}</span>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Redaman OPM</span>
                            <span className="mt-1 block font-mono font-bold text-emerald-700">{report?.finalOpticalPowerDbm || '-'} dBm</span>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Drop Cable</span>
                            <span className="mt-1 block font-semibold text-slate-800">{report?.dropCableLengthMeters ? `${report.dropCableLengthMeters} meter` : 'Tidak ada data'}</span>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                            <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Patch Cord</span>
                            <span className="mt-1 block font-semibold text-slate-800">{report?.patchCordReplaced ? 'Diganti baru' : 'Tidak diganti'}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <span className="font-bold text-slate-800">Ringkasan tindakan lapangan:</span> {report?.actionTaken || 'Belum ada catatan teknisi.'}
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                          {[
                            { key: 'cablesNeatlyClamped', label: 'Klem kabel rapi' },
                            { key: 'protectionSleeveInstalled', label: 'Protection sleeve' },
                            { key: 'customerAreaCleaned', label: 'Area bersih' },
                            { key: 'speedtestVerified', label: 'Speedtest OK' },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                              <input
                                type="checkbox"
                                checked={sopChecklist[item.key as keyof typeof sopChecklist]}
                                onChange={(event) =>
                                  setSopChecklist({
                                    ...sopChecklist,
                                    [item.key]: event.target.checked,
                                  })
                                }
                                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="w-full shrink-0 rounded-[24px] border border-violet-200 bg-violet-50/70 p-4 xl:w-80">
                        <p className="text-sm font-black text-violet-950">Persetujuan Kepala Teknisi</p>
                        <p className="mt-1 text-xs text-violet-700">Tambahkan catatan inspeksi akhir sebelum laporan diserahkan ke NOC.</p>
                        <textarea
                          value={sopNotes}
                          onChange={(event) => setSopNotes(event.target.value)}
                          rows={5}
                          className="mt-4 w-full rounded-2xl border border-violet-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-violet-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleApproveSop(ticket.id)}
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-violet-800"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve SOP dan Kirim ke NOC
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </WorkspaceSectionShell>
      )}

      {(selectedTab === 'pending_wo' || selectedTab === 'all_wo') && (
        <WorkspaceSectionShell
          eyebrow="Dispatch Work Orders"
          title="Distribusi work order teknisi lapangan"
          subtitle="Pantau antrean penugasan, cek detail alamat, lalu arahkan teknisi yang paling siap untuk eksekusi pekerjaan."
          badge={`${selectedTab === 'pending_wo' ? pendingWos.length : workOrders.length} work order terlihat`}
        >
          <div className="divide-y divide-slate-100">
            {(selectedTab === 'pending_wo' ? pendingWos : workOrders).map((workOrder) => {
              const isWaitingWarehouse = Boolean(
                (workOrder.installationMaterialRequestId || workOrder.maintenancePayload?.replacementFlowActive) &&
                workOrder.installationMaterialRequestStatus === 'menunggu_persetujuan_gudang'
              );

              return (
                <div key={workOrder.id} className="p-5 transition-colors hover:bg-slate-50/70">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{workOrder.id}</span>
                        <WorkspaceStatusPill
                          label={workOrder.type === 'installation' ? 'PASANG BARU' : workOrder.type === 'uninstallation' ? 'CABUT ALAT' : 'MAINTENANCE'}
                          tone={workOrder.type === 'installation' ? 'emerald' : workOrder.type === 'uninstallation' ? 'rose' : 'sky'}
                        />
                        <WorkspaceStatusPill label={workOrder.status.toUpperCase()} tone={getWorkOrderTone(workOrder.status)} />
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-950">{workOrder.customerName}</h4>
                        <p className="mt-1 text-sm text-slate-500">{workOrder.address}</p>
                      </div>

                      {isWaitingWarehouse && (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                          <div>
                            <span className="font-bold">Menunggu Konfirmasi Ketersediaan Barang Gudang</span>
                            <p className="mt-0.5 text-amber-800">
                              Gudang belum mengonfirmasi ketersediaan alat/material untuk WO ini. Teknisi baru dapat ditugaskan setelah disetujui gudang.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Wilayah & ODP</span>
                          <span className="mt-1 block font-semibold text-slate-800">{workOrder.odpId} ({workOrder.region})</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Kontak Pelanggan</span>
                          <span className="mt-1 block font-semibold text-slate-800">{workOrder.customerPhone}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Jadwal</span>
                          <span className="mt-1 block font-semibold text-slate-800">{workOrder.scheduledDate}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Paket</span>
                          <span className="mt-1 block font-semibold text-slate-800">{workOrder.packagePlan || 'Belum ditentukan'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`w-full shrink-0 rounded-[24px] border p-4 xl:w-80 ${
                      isWaitingWarehouse ? 'border-slate-200 bg-slate-100/70' : 'border-slate-200 bg-slate-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-black text-slate-950">Assignment Teknisi</p>
                        {isWaitingWarehouse && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
                            Terkunci
                          </span>
                        )}
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-white p-3 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>Jadwal kerja: <strong className="text-slate-800">{workOrder.scheduledDate}</strong></span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{workOrder.odpId} ({workOrder.region})</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{workOrder.customerPhone}</span>
                          </div>
                        </div>

                        <select
                          value={selectedTech[workOrder.id] || workOrder.assignedTechId || ''}
                          disabled={isWaitingWarehouse}
                          onChange={(event) => {
                            const techId = event.target.value;
                            if (!techId) return;
                            setSelectedTech({ ...selectedTech, [workOrder.id]: techId });
                            assignWorkOrderToTech(workOrder.id, techId);
                          }}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-200/60 disabled:text-slate-400"
                        >
                          <option value="">{isWaitingWarehouse ? '-- Menunggu Konfirmasi Gudang --' : 'Pilih Teknisi'}</option>
                          {fieldTechs.map((tech) => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.roleTitle})
                            </option>
                          ))}
                        </select>

                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          {isWaitingWarehouse
                            ? 'Menunggu gudang memastikan stok barang sebelum teknisi dapat ditunjuk.'
                            : 'Teknisi terpilih akan langsung menjadi PIC work order ini.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </WorkspaceSectionShell>
      )}
    </div>
  );
};

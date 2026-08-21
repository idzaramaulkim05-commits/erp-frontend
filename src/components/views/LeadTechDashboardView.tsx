import React, { useState } from 'react';
import {
  Shield,
  Wrench,
  UserCheck,
  CheckSquare,
  Clock,
  MapPin,
  Phone,
  FileCheck2,
  AlertCircle,
  Camera,
  CheckCircle2,
  Calendar,
  Send,
  Eye
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder, TroubleTicket } from '../../types';

interface LeadTechDashboardViewProps {
  onSelectTicket?: (ticket: TroubleTicket) => void;
}

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
  
  // SOP checklist state for review modal/drawer
  const [sopReviewingTicket, setSopReviewingTicket] = useState<TroubleTicket | null>(null);
  const [sopChecklist, setSopChecklist] = useState({
    cablesNeatlyClamped: true,
    protectionSleeveInstalled: true,
    customerAreaCleaned: true,
    speedtestVerified: true,
  });
  const [sopNotes, setSopNotes] = useState('Pemasangan klem rapi, proteksi core terlindungi, redaman -20.2 dBm.');

  // Field technicians list
  const fieldTechs = users.filter((u) => u.role === 'field_tech' || u.role === 'lead_tech');

  // Tickets awaiting Lead Tech SOP approval
  const ticketsWaitingSop = tickets.filter(
    (t) => t.status === 'field_progress' && t.fieldWorkReport?.completedAt
  );

  const pendingWos = workOrders.filter((w) => ['pending', 'pending_lead_assignment', 'assigned'].includes(w.status));

  const handleApproveSop = (ticketId: string) => {
    approveLeadTechSOP(ticketId, sopChecklist, sopNotes);
    setSopReviewingTicket(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedTab('pending_wo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedTab === 'pending_wo'
                ? 'bg-sky-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Penugasan Work Order ({pendingWos.length})
          </button>
          <button
            onClick={() => setSelectedTab('sop_review')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedTab === 'sop_review'
                ? 'bg-purple-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Evaluasi SOP Hasil Lapangan ({ticketsWaitingSop.length})
          </button>
          <button
            onClick={() => setSelectedTab('all_wo')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              selectedTab === 'all_wo'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Riwayat WO ({workOrders.length})
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" />
            {fieldTechs.length} Teknisi Siap Tugas
          </span>
        </div>
      </div>

      {/* 1. SOP Review Queue Section */}
      {selectedTab === 'sop_review' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-purple-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-purple-600" />
                <span>Pemeriksaan Standar Operasional Prosedur (SOP) Lapangan</span>
              </h3>
              <p className="text-xs text-slate-500">
                Verifikasi kerapian fisik kabel, proteksi drop wire, dan foto bukti sebelum diserahkan ke NOC
              </p>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
              {ticketsWaitingSop.length} Menunggu Approval
            </span>
          </div>

          {ticketsWaitingSop.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Semua laporan teknisi sudah dievaluasi SOP</p>
              <p className="text-xs text-slate-500 mt-0.5">Tidak ada laporan pengerjaan lapangan yang pending approval.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {ticketsWaitingSop.map((ticket) => {
                const report = ticket.fieldWorkReport;
                return (
                  <div key={ticket.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Left: Detail */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            {ticket.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            Pelanggan: {ticket.customerName} ({ticket.customerId})
                          </span>
                          <span className="text-xs text-slate-400">• Selesai: {report?.completedAt}</span>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                          <p className="font-bold text-slate-800">Tindakan Lapangan Teknisi ({ticket.assignedTechName || 'Bambang I.'}):</p>
                          <p className="text-slate-600">{report?.actionTaken}</p>
                          <div className="flex flex-wrap gap-3 pt-1 text-[11px] font-semibold text-slate-700">
                            <span>Redaman OPM: <strong className="text-emerald-700">{report?.finalOpticalPowerDbm} dBm</strong></span>
                            {report?.patchCordReplaced && <span className="text-blue-700">✓ Patch Cord Diganti Baru</span>}
                            {report?.dropCableLengthMeters && <span>Drop Cable: {report.dropCableLengthMeters}m</span>}
                          </div>
                        </div>

                        {/* SOP Checklist Controls */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                          <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sopChecklist.cablesNeatlyClamped}
                              onChange={(e) => setSopChecklist({ ...sopChecklist, cablesNeatlyClamped: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-medium text-slate-800">Klem Kabel Rapi</span>
                          </label>

                          <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sopChecklist.protectionSleeveInstalled}
                              onChange={(e) => setSopChecklist({ ...sopChecklist, protectionSleeveInstalled: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-medium text-slate-800">Protection Sleeve</span>
                          </label>

                          <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sopChecklist.customerAreaCleaned}
                              onChange={(e) => setSopChecklist({ ...sopChecklist, customerAreaCleaned: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-medium text-slate-800">Area Bersih</span>
                          </label>

                          <label className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sopChecklist.speedtestVerified}
                              onChange={(e) => setSopChecklist({ ...sopChecklist, speedtestVerified: e.target.checked })}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span className="text-[11px] font-medium text-slate-800">Speedtest OK</span>
                          </label>
                        </div>
                      </div>

                      {/* Right Approval Action */}
                      <div className="flex flex-col gap-2 shrink-0 lg:w-64 bg-purple-50/60 p-3 rounded-xl border border-purple-200">
                        <span className="text-xs font-bold text-purple-900">Persetujuan Kepala Teknisi</span>
                        <input
                          type="text"
                          value={sopNotes}
                          onChange={(e) => setSopNotes(e.target.value)}
                          placeholder="Catatan persetujuan SOP..."
                          className="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden"
                        />
                        <button
                          onClick={() => handleApproveSop(ticket.id)}
                          className="w-full bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approve SOP (Kirim ke NOC)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Pending Work Orders Dispatch Section */}
      {(selectedTab === 'pending_wo' || selectedTab === 'all_wo') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-sky-600" />
              <span>Daftar Work Order (Pemasangan Baru, Maintenance & Cabut Alat)</span>
            </h3>
            <span className="text-xs text-slate-500">
              Menampilkan {workOrders.length} Work Order
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {(selectedTab === 'pending_wo' ? pendingWos : workOrders).map((wo) => {
              const typeBadge = () => {
                switch (wo.type) {
                  case 'installation':
                    return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">+ Pasang Baru</span>;
                  case 'uninstallation':
                    return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300">Cabut Perangkat</span>;
                  case 'maintenance':
                    return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-300">Maintenance FO</span>;
                }
              };

              return (
                <div key={wo.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {wo.id}
                      </span>
                      {typeBadge()}
                      <span className="text-xs text-slate-400">• Jadwal: {wo.scheduledDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{wo.customerName} ({wo.customerId})</h4>
                    <p className="text-xs text-slate-600">{wo.address}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {wo.odpId} ({wo.region})
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {wo.customerPhone}
                      </span>
                      {wo.packagePlan && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                          Paket: {wo.packagePlan}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dispatch Controls */}
                  <div className="flex items-center space-x-2 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-semibold">Tugaskan Teknisi:</span>
                      <select
                        value={selectedTech[wo.id] || wo.assignedTechId || 'USR-06'}
                        onChange={(e) => {
                          const techId = e.target.value;
                          setSelectedTech({ ...selectedTech, [wo.id]: techId });
                          assignWorkOrderToTech(wo.id, techId);
                        }}
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                      >
                        {fieldTechs.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.roleTitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          wo.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : wo.status === 'sop_submitted'
                            ? 'bg-purple-100 text-purple-800'
                            : wo.status === 'waiting_noc_activation'
                            ? 'bg-sky-100 text-sky-800'
                            : wo.status === 'field_submitted'
                            ? 'bg-violet-100 text-violet-800'
                            : wo.status === 'assigned'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {wo.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

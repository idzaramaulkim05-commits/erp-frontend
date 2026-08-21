import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  MapPin,
  Phone,
  Radio,
  User,
  Wrench,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TicketStatus, TroubleTicket } from '../../types';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface HelpdeskViewProps {
  onOpenNewTicket: () => void;
  onSelectTicket: (ticket: TroubleTicket) => void;
}

const getStatusMeta = (status: TicketStatus): { label: string; tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate' } => {
  switch (status) {
    case 'open':
    case 'in_noc_review':
      return { label: '1. NOC Review', tone: 'amber' };
    case 'assigned_to_lead':
      return { label: '2. Dispatched WO', tone: 'sky' };
    case 'field_progress':
      return { label: '3. Teknisi Lapangan', tone: 'sky' };
    case 'lead_sop_approved':
      return { label: '4. SOP Approved', tone: 'violet' };
    case 'noc_verifying':
      return { label: '5. Validasi dBm', tone: 'violet' };
    case 'closed':
      return { label: 'Selesai / Closed', tone: 'emerald' };
    default:
      return { label: status, tone: 'slate' };
  }
};

const getCategoryMeta = (category: string): { label: string; tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate' } => {
  switch (category) {
    case 'los_red_light':
      return { label: 'LOS Merah (FO)', tone: 'rose' };
    case 'slow_connection':
      return { label: 'Redaman Naik', tone: 'amber' };
    case 'wifi_issue':
      return { label: 'WiFi / Remote', tone: 'sky' };
    default:
      return { label: category, tone: 'slate' };
  }
};

export const HelpdeskView: React.FC<HelpdeskViewProps> = ({
  onOpenNewTicket,
  onSelectTicket,
}) => {
  const {
    tickets,
    searchQuery,
    selectedRegion,
    selectedOdpFilter,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');

  const openQueueCount = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_noc_review').length;
  const inProgressCount = tickets.filter((ticket) => ticket.status !== 'open' && ticket.status !== 'in_noc_review' && ticket.status !== 'closed').length;
  const closedCount = tickets.filter((ticket) => ticket.status === 'closed').length;

  const filteredTickets = tickets.filter((ticket) => {
    if (activeTab === 'open' && ticket.status !== 'open' && ticket.status !== 'in_noc_review') return false;
    if (activeTab === 'in_progress' && (ticket.status === 'open' || ticket.status === 'in_noc_review' || ticket.status === 'closed')) return false;
    if (activeTab === 'closed' && ticket.status !== 'closed') return false;

    if (selectedRegion !== 'all' && ticket.region !== selectedRegion) return false;
    if (selectedOdpFilter !== 'all' && ticket.odpId !== selectedOdpFilter) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = ticket.customerName.toLowerCase().includes(query);
      const matchId = ticket.id.toLowerCase().includes(query);
      const matchCustomerId = ticket.customerId.toLowerCase().includes(query);
      const matchOdp = ticket.odpId.toLowerCase().includes(query);
      const matchTitle = ticket.title.toLowerCase().includes(query);

      if (!matchName && !matchId && !matchCustomerId && !matchOdp && !matchTitle) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="Helpdesk Operations"
        title="Intake aduan pelanggan, pemantauan alur tiket, dan handoff ke NOC atau teknisi"
        subtitle="Workspace utama helpdesk untuk menerima gangguan, menjaga kejelasan status tiket, dan memastikan tindak lanjut menuju NOC review atau dispatch work order."
        stats={[
          {
            label: 'Total Tiket',
            value: tickets.length,
            description: 'Semua tiket gangguan dan permintaan layanan yang tercatat.',
            icon: HelpCircle,
            accentClass: 'bg-sky-400/15 text-sky-200',
          },
          {
            label: 'Menunggu NOC',
            value: openQueueCount,
            description: 'Tiket baru atau antrean yang masih menunggu review teknis NOC.',
            icon: AlertTriangle,
            accentClass: 'bg-amber-400/15 text-amber-200',
          },
          {
            label: 'Diproses',
            value: inProgressCount,
            description: 'Tiket yang sudah masuk tahap dispatch, lapangan, atau final verification.',
            icon: Activity,
            accentClass: 'bg-violet-400/15 text-violet-200',
          },
          {
            label: 'Closed',
            value: closedCount,
            description: 'Tiket yang sudah selesai ditangani dan ditutup.',
            icon: CheckCircle2,
            accentClass: 'bg-emerald-400/15 text-emerald-200',
          },
        ]}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tiket ({tickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('open')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'open' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Menunggu NOC ({openQueueCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('in_progress')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'in_progress' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Diproses ({inProgressCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('closed')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'closed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Selesai ({closedCount})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewTicket}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <HelpCircle className="h-4 w-4" />
            Buat Tiket Aduan
          </button>
        </div>
      </div>

      <WorkspaceSectionShell
        eyebrow="Ticket Worklist"
        title="Daftar tiket gangguan dan permintaan pelanggan"
        subtitle="Filter global tetap mengikuti search, wilayah, dan ODP dari shell. Area ini fokus pada detail tiket dan tindakan helpdesk yang paling sering dipakai."
        badge={`${filteredTickets.length} tiket terlihat`}
        actions={
          <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 lg:inline-flex">
            Alur: Helpdesk {'->'} NOC Review {'->'} Kepala Teknisi WO {'->'} Teknisi Lapangan {'->'} NOC Closing
          </span>
        }
      >
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada tiket pada filter ini</p>
            <p className="mt-1 text-xs text-slate-500">Semua tiket sudah tertangani atau sesuaikan kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              const statusMeta = getStatusMeta(ticket.status);
              const categoryMeta = getCategoryMeta(ticket.category);
              const canQuickHandle = ticket.status === 'open' || ticket.status === 'in_noc_review';

              return (
                <div key={ticket.id} className="p-5 transition-colors hover:bg-slate-50/70">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                          {ticket.id}
                        </span>
                        <WorkspaceStatusPill label={statusMeta.label} tone={statusMeta.tone} />
                        <WorkspaceStatusPill label={categoryMeta.label} tone={categoryMeta.tone} />
                        <span className="text-xs text-slate-400">{ticket.createdAt}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-950">{ticket.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Pelanggan</span>
                          <span className="mt-1 flex items-center gap-1 font-semibold text-slate-800">
                            <User className="h-3.5 w-3.5 text-slate-400" />
                            {ticket.customerName} ({ticket.customerId})
                          </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Kontak</span>
                          <span className="mt-1 flex items-center gap-1 font-semibold text-slate-800">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {ticket.customerPhone}
                          </span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">ODP & Wilayah</span>
                          <span className="mt-1 flex items-center gap-1 font-semibold text-slate-800">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            {ticket.odpId} ({ticket.region})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-80">
                      <p className="text-sm font-black text-slate-950">Aksi Helpdesk</p>
                      <div className="mt-4 space-y-2">
                        {canQuickHandle && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt(
                                  'Catatan penyelesaian remote NOC (misal: Reset PPPoE / Ubah Port OMCI):',
                                  'Selesai remote konfigurasi OMCI / Mikrotik.',
                                );
                                if (note) resolveTicketRemotely(ticket.id, note);
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                              title="Selesaikan secara remote via NOC tanpa kirim teknisi lapangan"
                            >
                              <Radio className="h-3.5 w-3.5" />
                              Remote Fix (NOC)
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const note = prompt(
                                  'Catatan kendala fisik untuk Kepala Teknisi:',
                                  'Kabel FO putus / redaman drop -38dBm. Mohon dispatch teknisi.',
                                );
                                if (note) escalateTicketToLeadTech(ticket.id, note);
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-sky-700"
                              title="Terbitkan WO ke Kepala Teknisi untuk perbaikan fisik"
                            >
                              <Wrench className="h-3.5 w-3.5" />
                              Teruskan ke Teknisi (WO)
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket)}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Lihat Detail & Alur
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </WorkspaceSectionShell>
    </div>
  );
};

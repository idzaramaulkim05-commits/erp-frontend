import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Layers3,
  MapPin,
  MessageCircle,
  Phone,
  User,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ExtendedTicketStatus, TroubleTicket } from '../../types';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
import { NotesActionModal } from '../modals/NotesActionModal';

interface HelpdeskViewProps {
  onOpenNewTicket: () => void;
  onSelectTicket: (ticket: TroubleTicket) => void;
}

const normalizeWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('62') && digits.length >= 10) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length >= 10) {
    return `62${digits.slice(1)}`;
  }

  return null;
};

const getStatusMeta = (status: ExtendedTicketStatus): { label: string; tone: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate' } => {
  switch (status) {
    case 'open':
    case 'in_noc_review':
      return { label: '1. NOC Review', tone: 'amber' };
    case 'assigned_to_lead':
      return { label: '2. Dispatched WO', tone: 'sky' };
    case 'field_progress':
      return { label: '3. Teknisi Lapangan', tone: 'sky' };
    case 'field_done_waiting_helpdesk_qc':
      return { label: '4. QC Helpdesk', tone: 'violet' };
    case 'menunggu_retur_gudang':
      return { label: '5. Menunggu Retur Gudang', tone: 'amber' };
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

const ITEMS_PER_PAGE = 5;

export const HelpdeskView: React.FC<HelpdeskViewProps> = ({
  onOpenNewTicket,
  onSelectTicket,
}) => {
  const {
    tickets,
    searchQuery,
    selectedRegion,
    selectedOdpFilter,
    helpdeskCloseTicket,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'qc' | 'closed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [qcTargetTicket, setQcTargetTicket] = useState<TroubleTicket | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [qcSaving, setQcSaving] = useState(false);

  const openQueueCount = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_noc_review').length;
  const inProgressCount = tickets.filter((ticket) => ['assigned_to_lead', 'field_progress', 'menunggu_retur_gudang'].includes(ticket.status)).length;
  const qcCount = tickets.filter((ticket) => ticket.status === 'field_done_waiting_helpdesk_qc').length;
  const closedCount = tickets.filter((ticket) => ticket.status === 'closed').length;

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (activeTab === 'open' && ticket.status !== 'open' && ticket.status !== 'in_noc_review') return false;
      if (activeTab === 'in_progress' && !['assigned_to_lead', 'field_progress', 'menunggu_retur_gudang'].includes(ticket.status)) return false;
      if (activeTab === 'qc' && ticket.status !== 'field_done_waiting_helpdesk_qc') return false;
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
  }, [tickets, activeTab, selectedRegion, selectedOdpFilter, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedRegion, selectedOdpFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTickets, safePage]);

  const openQcModal = (ticket: TroubleTicket) => {
    setQcTargetTicket(ticket);
    setQcNotes('Koneksi pelanggan normal kembali dan pekerjaan dinyatakan selesai.');
  };

  const closeQcModal = () => {
    if (qcSaving) return;
    setQcTargetTicket(null);
    setQcNotes('');
  };

  const submitHelpdeskQc = async () => {
    if (!qcTargetTicket || !qcNotes.trim()) {
      return;
    }

    setQcSaving(true);
    try {
      await Promise.resolve(helpdeskCloseTicket(qcTargetTicket.id, qcNotes.trim(), true));
      closeQcModal();
    } finally {
      setQcSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
              <Layers3 className="h-3.5 w-3.5" />
              Helpdesk Operations
            </span>
            <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">Ringkasan tiket helpdesk</h1>
                <p className="text-sm text-slate-300">Pantau antrean, progres lapangan, dan QC akhir dalam satu panel ringkas.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: 'Total',
                value: tickets.length,
                icon: HelpCircle,
                accentClass: 'bg-sky-400/15 text-sky-200',
              },
              {
                label: 'NOC',
                value: openQueueCount,
                icon: AlertTriangle,
                accentClass: 'bg-amber-400/15 text-amber-200',
              },
              {
                label: 'Proses',
                value: inProgressCount,
                icon: Activity,
                accentClass: 'bg-violet-400/15 text-violet-200',
              },
              {
                label: 'QC',
                value: qcCount,
                icon: CheckCircle2,
                accentClass: 'bg-fuchsia-400/15 text-fuchsia-200',
              },
              {
                label: 'Closed',
                value: closedCount,
                icon: CheckCircle2,
                accentClass: 'bg-emerald-400/15 text-emerald-200',
              },
            ].map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xs">
                  <div className={`inline-flex rounded-xl p-2 ${stat.accentClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
                      <p className="mt-1 text-2xl font-black text-white">{stat.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
              onClick={() => setActiveTab('qc')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'qc' ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              QC Helpdesk ({qcCount})
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
      >
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada tiket pada filter ini</p>
            <p className="mt-1 text-xs text-slate-500">Semua tiket sudah tertangani atau sesuaikan kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedTickets.map((ticket) => {
              const statusMeta = getStatusMeta(ticket.status);
              const categoryMeta = getCategoryMeta(ticket.category);
              const canHelpdeskQc = ticket.status === 'field_done_waiting_helpdesk_qc';
              const whatsappNumber = normalizeWhatsAppNumber(ticket.customerPhone);

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
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-800">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {ticket.customerPhone}
                            </span>
                            <a
                              href={whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined}
                              target="_blank"
                              rel="noreferrer"
                              aria-disabled={!whatsappNumber}
                              className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                                whatsappNumber
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
                              }`}
                              title={whatsappNumber ? 'Hubungi via WhatsApp' : 'Nomor WhatsApp belum valid'}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>
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
                        {canHelpdeskQc && (
                          <button
                            type="button"
                            onClick={() => openQcModal(ticket)}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-fuchsia-700"
                            title="Tutup tiket final setelah QC helpdesk selesai"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            QC Helpdesk & Close
                          </button>
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 px-5 py-4">
              <p className="text-xs font-semibold text-slate-500">
                Menampilkan <span className="font-bold text-slate-900">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-900">{Math.min(safePage * ITEMS_PER_PAGE, filteredTickets.length)}</span> dari <span className="font-bold text-slate-900">{filteredTickets.length}</span> tiket
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                    const isActive = pageNum === safePage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition shadow-2xs ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </WorkspaceSectionShell>

      <NotesActionModal
        open={qcTargetTicket !== null}
        title="Konfirmasi QC Akhir Helpdesk"
        message={
          qcTargetTicket
            ? `Tiket ${qcTargetTicket.id} untuk ${qcTargetTicket.customerName} akan ditutup final setelah QC Helpdesk selesai.`
            : ''
        }
        label="Catatan QC Akhir Helpdesk"
        value={qcNotes}
        onChange={setQcNotes}
        placeholder="Jelaskan hasil verifikasi akhir helpdesk, kondisi koneksi pelanggan, dan konfirmasi penyelesaian."
        confirmLabel="Ya, Close Ticket"
        tone="success"
        loading={qcSaving}
        onCancel={closeQcModal}
        onConfirm={() => {
          void submitHelpdeskQc();
        }}
      />
    </div>
  );
};

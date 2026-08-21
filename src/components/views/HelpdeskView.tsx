import React, { useState } from 'react';
import {
  HelpCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
  Send,
  Radio,
  Wrench,
  Search,
  ExternalLink,
  ChevronRight,
  User,
  Activity,
  MessageSquare
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket, TicketStatus } from '../../types';

interface HelpdeskViewProps {
  onOpenNewTicket: () => void;
  onSelectTicket: (ticket: TroubleTicket) => void;
}

export const HelpdeskView: React.FC<HelpdeskViewProps> = ({
  onOpenNewTicket,
  onSelectTicket,
}) => {
  const {
    tickets,
    customers,
    searchQuery,
    selectedRegion,
    selectedOdpFilter,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [selectedTicketForQuickNOC, setSelectedTicketForQuickNOC] = useState<TroubleTicket | null>(null);
  const [remoteNotes, setRemoteNotes] = useState<string>('Konfigurasi SSID / Reset PPPoE selesai.');
  const [escalateNotes, setEscalateNotes] = useState<string>('Redaman drop / kabel FO putus di tiang. Butuh Teknisi Lapangan.');

  // Filter tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Tab filter
    if (activeTab === 'open' && ticket.status !== 'open' && ticket.status !== 'in_noc_review') return false;
    if (activeTab === 'in_progress' && (ticket.status === 'open' || ticket.status === 'in_noc_review' || ticket.status === 'closed')) return false;
    if (activeTab === 'closed' && ticket.status !== 'closed') return false;

    // Region filter
    if (selectedRegion !== 'all' && ticket.region !== selectedRegion) return false;

    // ODP filter
    if (selectedOdpFilter !== 'all' && ticket.odpId !== selectedOdpFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ticket.customerName.toLowerCase().includes(q);
      const matchId = ticket.id.toLowerCase().includes(q);
      const matchCustId = ticket.customerId.toLowerCase().includes(q);
      const matchOdp = ticket.odpId.toLowerCase().includes(q);
      const matchTitle = ticket.title.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchCustId && !matchOdp && !matchTitle) return false;
    }

    return true;
  });

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
      case 'in_noc_review':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">1. NOC Review</span>;
      case 'assigned_to_lead':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-sky-300">2. Dispatched WO</span>;
      case 'field_progress':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300">3. Teknisi Lapangan</span>;
      case 'lead_sop_approved':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">4. SOP Approved</span>;
      case 'noc_verifying':
        return <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-300">5. Validasi dBm</span>;
      case 'closed':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">✓ Selesai / Closed</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{status}</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'los_red_light':
        return <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> LOS Merah (FO)</span>;
      case 'slow_connection':
        return <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Activity className="w-3 h-3" /> Redaman Naik</span>;
      case 'wifi_issue':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1"><Radio className="w-3 h-3" /> WiFi / Remote</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{category}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Tiket ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'open'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Menunggu Review NOC ({tickets.filter((t) => t.status === 'open' || t.status === 'in_noc_review').length})
          </button>
          <button
            onClick={() => setActiveTab('in_progress')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'in_progress'
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Diproses Lapangan ({tickets.filter((t) => t.status !== 'open' && t.status !== 'in_noc_review' && t.status !== 'closed').length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'closed'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Selesai ({tickets.filter((t) => t.status === 'closed').length})
          </button>
        </div>

        <button
          onClick={onOpenNewTicket}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 shrink-0"
        >
          <HelpCircle className="w-4 h-4" />
          <span>+ Buat Tiket Aduan Pelanggan</span>
        </button>
      </div>

      {/* Tickets List / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Tiket Gangguan & Permintaan Pelanggan
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
              {filteredTickets.length} Tiket
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Alur: Helpdesk ➔ NOC Review ➔ Kepala Teknisi WO ➔ Teknisi Lapangan ➔ NOC Closing
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada tiket dalam filter ini</p>
            <p className="text-xs text-slate-500 mt-1">Semua tiket gangguan sudah tertangani atau sesuaikan kata kunci pencarian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTickets.map((ticket) => {
              return (
                <div
                  key={ticket.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  {/* Left: Info Customer & Issue */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {ticket.id}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getCategoryIcon(ticket.category)}
                      <span className="text-xs text-slate-400">• {ticket.createdAt}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl">{ticket.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.customerName} ({ticket.customerId})
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.customerPhone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {ticket.odpId} ({ticket.region})
                      </span>
                    </div>
                  </div>

                  {/* Right Actions & Workflow Controls */}
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                    {/* If ticket is in NOC Review stage, allow instant quick triage */}
                    {(ticket.status === 'open' || ticket.status === 'in_noc_review') && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            const note = prompt('Catatan penyelesaian remote NOC (misal: Reset PPPoE / Ubah Port OMCI):', 'Selesai remote konfigurasi OMCI / Mikrotik.');
                            if (note) resolveTicketRemotely(ticket.id, note);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Selesaikan Secara Remote via NOC tanpa kirim teknisi lapangan"
                        >
                          <Radio className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Remote Fix (NOC)</span>
                        </button>

                        <button
                          onClick={() => {
                            const note = prompt('Catatan kendala fisik untuk Kepala Teknisi:', 'Kabel FO putus / redaman drop -38dBm. Mohon dispatch teknisi.');
                            if (note) escalateTicketToLeadTech(ticket.id, note);
                          }}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Terbitkan WO ke Kepala Teknisi untuk perbaikan fisik"
                        >
                          <Wrench className="w-3.5 h-3.5 text-sky-600" />
                          <span>Teruskan ke Teknisi (WO)</span>
                        </button>
                      </div>
                    )}

                    {/* View Full Timeline Modal Button */}
                    <button
                      onClick={() => onSelectTicket(ticket)}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>Lihat Detail & Alur</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

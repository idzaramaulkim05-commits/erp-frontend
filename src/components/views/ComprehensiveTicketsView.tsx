import React, { useState, useEffect } from 'react';
import { 
  Ticket as TicketIcon, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  MapPin, 
  Radio, 
  Wifi, 
  Scan, 
  Camera, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Send,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/apiClient';
import { ComprehensiveTicketItem, TicketLiveCheckResponse } from '../../types';
import { OcrScanModal } from '../modals/OcrScanModal';

export const ComprehensiveTicketsView: React.FC = () => {
  const [tickets, setTickets] = useState<ComprehensiveTicketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'psb' | 'gangguan' | 'dismantle'>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<ComprehensiveTicketItem | null>(null);
  const [liveCheck, setLiveCheck] = useState<TicketLiveCheckResponse | null>(null);
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets');
      const list = Array.isArray(res) ? res : (res.data || res.tickets || []);
      setTickets(list);

      const liveRes = await api.get('/tickets/live-check').catch(() => null);
      if (liveRes) setLiveCheck(liveRes);
    } catch (e) {
      console.error('Failed to load tickets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(async () => {
      try {
        const liveRes = await api.get('/tickets/live-check');
        if (liveRes) setLiveCheck(liveRes);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTickets = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchQuery = 
      t.ticket_number.toLowerCase().includes(q) ||
      t.pelanggan_nama.toLowerCase().includes(q) ||
      (t.pelanggan_username && t.pelanggan_username.toLowerCase().includes(q)) ||
      (t.nama_odp && t.nama_odp.toLowerCase().includes(q));

    if (activeTab === 'all') return matchQuery;
    return matchQuery && t.type === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready_dispatch':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">SIAP DISPOSISI TL</span>;
      case 'assigned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">DITUGASKAN TEKNISI</span>;
      case 'in_progress':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">PROSES LAPANGAN</span>;
      case 'pending_noc':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">MENUNGGU VLAN (NOC)</span>;
      case 'resolved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700">QC & VALIDASI NOC</span>;
      case 'closed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">SELESAI (CLOSED)</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Poller Notification Banner */}
      {liveCheck && liveCheck.ready_dispatch_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-amber-900 text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span>Ada {liveCheck.ready_dispatch_count} tiket/PSB baru yang siap didisposisikan ke teknisi lapangan!</span>
          </div>
          <button
            onClick={loadTickets}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
          >
            Refresh Antrean
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <TicketIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tiket Terpadu & Pasang Baru (PSB)</h1>
            <p className="text-xs text-slate-500">Alur Kerja Gangguan Fisik, PSB, Cabut Alat Dismantle, OCR Barcode ONT & Live Poller</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOcrOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
          >
            <Scan className="w-4 h-4 text-indigo-600" />
            <span>Scan OCR ONT</span>
          </button>

          <button
            onClick={loadTickets}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Tiket ({tickets.length})
            </button>
            <button
              onClick={() => setActiveTab('psb')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'psb'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pasang Baru PSB ({tickets.filter(t => t.type === 'psb').length})
            </button>
            <button
              onClick={() => setActiveTab('gangguan')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'gangguan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Gangguan ({tickets.filter(t => t.type === 'gangguan').length})
            </button>
            <button
              onClick={() => setActiveTab('dismantle')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'dismantle'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cabut Alat ({tickets.filter(t => t.type === 'dismantle').length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Tiket, Pelanggan, ODP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">No. Tiket</th>
                <th className="py-3 px-4 font-semibold">Tipe Layanan</th>
                <th className="py-3 px-4 font-semibold">Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Titik ODP</th>
                <th className="py-3 px-4 font-semibold">Teknisi Lapangan</th>
                <th className="py-3 px-4 font-semibold">Status Tiket</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-indigo-700">
                      {t.ticket_number}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span className="uppercase">{t.type}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs">{t.pelanggan_nama}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{t.pelanggan_telepon || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-teal-700">{t.nama_odp || '-'}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {t.technician_name ? (
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          {t.technician_name}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Belum Didisposisi</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(t.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada tiket pada antrean ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Inspection Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Detail Tiket</span>
                <h3 className="text-lg font-bold">#{selectedTicket.ticket_number} - {selectedTicket.pelanggan_nama}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-400 uppercase">Informasi Pelanggan</span>
                  <div>Nama: <span className="font-bold text-slate-800">{selectedTicket.pelanggan_nama}</span></div>
                  <div>Telepon: <span className="font-mono font-semibold">{selectedTicket.pelanggan_telepon || '-'}</span></div>
                  <div>Alamat: <span className="text-slate-700">{selectedTicket.pelanggan_alamat || '-'}</span></div>
                  <div>ODP: <span className="font-bold text-teal-700">{selectedTicket.nama_odp || '-'}</span></div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-400 uppercase">Status Teknis & Sinyal</span>
                  <div>Status: <span className="font-bold">{getStatusBadge(selectedTicket.status)}</span></div>
                  <div>Teknisi: <span className="font-bold text-slate-800">{selectedTicket.technician_name || '-'}</span></div>
                  <div>SN ONT: <span className="font-mono font-bold">{selectedTicket.serial_number_ont || '-'}</span></div>
                  <div>Redaman: <span className="font-mono font-bold text-emerald-600">{selectedTicket.redaman_ont || '-'}</span></div>
                </div>
              </div>

              {/* Photo Evidence from Server Storage */}
              <div className="space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider block">Foto Bukti Pengerjaan (Server Storage)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Foto Rumah', url: selectedTicket.foto_rumah },
                    { label: 'Foto ODP', url: selectedTicket.foto_odp },
                    { label: 'Foto ONT/Modem', url: selectedTicket.foto_sesudah },
                    { label: 'Foto Redaman', url: selectedTicket.foto_redaman },
                  ].map((p, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1 text-center">
                      <span className="text-[10px] font-bold text-slate-500 block truncate">{p.label}</span>
                      <div className="w-full h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                        {p.url ? (
                          <img
                            src={resolveMediaUrl(p.url)}
                            alt={p.label}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300';
                            }}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">Belum ada foto</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OCR Barcode Scanner Modal */}
      {isOcrOpen && (
        <OcrScanModal
          onSuccess={(res) => {
            setActionMessage({
              type: 'success',
              text: `OCR Berhasil! Terdeteksi Serial Number ONT: ${res.serial_number}`,
            });
          }}
          onClose={() => setIsOcrOpen(false)}
        />
      )}
    </div>
  );
};

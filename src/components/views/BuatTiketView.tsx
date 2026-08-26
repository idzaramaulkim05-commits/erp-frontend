import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Layers3,
  MapPin,
  MessageCircle,
  Phone,
  Radio,
  Search,
  Send,
  Sparkles,
  User,
  Wifi,
  Wrench,
  Zap,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket } from '../../types';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface BuatTiketViewProps {
  onSelectTicket?: (ticket: TroubleTicket) => void;
}

type TicketCategory = 'los_red_light' | 'slow_connection' | 'wifi_issue' | 'other';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

const CATEGORY_OPTIONS: Array<{
  id: TicketCategory;
  title: string;
  subtitle: string;
  icon: typeof AlertTriangle;
  colorClass: string;
  badgeTone: 'rose' | 'amber' | 'sky' | 'slate';
}> = [
  {
    id: 'los_red_light',
    title: 'LOS Merah (Kabel FO Putus/Drop)',
    subtitle: 'Lampu indikator modem merah, kabel putus tertimpa/tertarik truk, redaman drop total.',
    icon: AlertTriangle,
    colorClass: 'border-rose-300 bg-rose-50/50 hover:bg-rose-50 text-rose-950',
    badgeTone: 'rose',
  },
  {
    id: 'slow_connection',
    title: 'Koneksi Lemot / Redaman Naik',
    subtitle: 'Internet lambat, packet loss tinggi, redaman optik naik di atas batas toleransi standar.',
    icon: Radio,
    colorClass: 'border-amber-300 bg-amber-50/50 hover:bg-amber-50 text-amber-950',
    badgeTone: 'amber',
  },
  {
    id: 'wifi_issue',
    title: 'Kendala WiFi / Setting SSID',
    subtitle: 'Sinyal WiFi tidak muncul, lupa password SSID, ganti nama WiFi, atau kendala router.',
    icon: Wifi,
    colorClass: 'border-sky-300 bg-sky-50/50 hover:bg-sky-50 text-sky-950',
    badgeTone: 'sky',
  },
  {
    id: 'other',
    title: 'Lainnya / Administrasi Billing',
    subtitle: 'Kendala tagihan, status isolir keliru, atau permintaan penanganan teknis khusus lainnya.',
    icon: HelpCircle,
    colorClass: 'border-slate-300 bg-slate-50/70 hover:bg-slate-100 text-slate-950',
    badgeTone: 'slate',
  },
];

const QUICK_TEMPLATES: Array<{ label: string; title: string; category: TicketCategory; priority: TicketPriority }> = [
  { label: '🔴 LOS Merah', title: 'Lampu LOS modem merah, internet mati total', category: 'los_red_light', priority: 'high' },
  { label: '⚠️ Kabel Putus', title: 'Kabel drop fiber optik putus di dekat tiang pelanggan', category: 'los_red_light', priority: 'urgent' },
  { label: '🐢 Internet Lemot', title: 'Koneksi internet lambat dan sering RTO sejak pagi', category: 'slow_connection', priority: 'medium' },
  { label: '📶 Ganti Password WiFi', title: 'Permintaan reset dan ganti nama/password WiFi pelanggan', category: 'wifi_issue', priority: 'low' },
  { label: '⚡ Modem Mati Total', title: 'Perangkat ONT/Modem tidak menyala (indikasi adaptor/listrik)', category: 'other', priority: 'high' },
];

const normalizeWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62') && digits.length >= 10) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `62${digits.slice(1)}`;
  return null;
};

export const BuatTiketView: React.FC<BuatTiketViewProps> = ({ onSelectTicket }) => {
  const { customers, tickets, createTroubleTicket } = useIOMS();
  const navigate = useNavigate();

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [category, setCategory] = useState<TicketCategory>('los_red_light');
  const [priority, setPriority] = useState<TicketPriority>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) {
      return customers;
    }
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.odpId && c.odpId.toLowerCase().includes(q)) ||
        (c.region && c.region.toLowerCase().includes(q)),
    );
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || filteredCustomers[0] || customers[0] || null;
  }, [customers, filteredCustomers, selectedCustomerId]);

  const recentTickets = useMemo(() => {
    return [...tickets].slice(0, 5);
  }, [tickets]);

  const openQueueCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_noc_review').length;
  const inProgressCount = tickets.filter((t) => ['assigned_to_lead', 'field_progress', 'menunggu_retur_gudang'].includes(t.status)).length;
  const qcCount = tickets.filter((t) => t.status === 'field_done_waiting_helpdesk_qc').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert('Pilih pelanggan terlebih dahulu.');
      return;
    }
    if (!title.trim() || !description.trim()) {
      alert('Judul dan deskripsi keluhan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTroubleTicket({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        address: selectedCustomer.address,
        odpId: selectedCustomer.odpId,
        region: selectedCustomer.region,
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      setSuccessMessage(`Tiket keluhan untuk ${selectedCustomer.name} (${selectedCustomer.id}) berhasil dibuat dan langsung diteruskan ke stasiun 1. NOC Review.`);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
      alert('Gagal membuat tiket. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setCategory(tpl.category);
    setPriority(tpl.priority);
  };

  const whatsappNumber = selectedCustomer ? normalizeWhatsAppNumber(selectedCustomer.phone) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <section className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
              <Layers3 className="h-3.5 w-3.5" />
              Modul Intake Tiket Aduan
            </span>
            <div className="flex flex-col gap-1 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">Buat Tiket Keluhan Pelanggan</h1>
                <p className="text-sm text-slate-300">Input laporan gangguan atau permintaan teknis pelanggan untuk diteruskan otomatis ke tim NOC.</p>
              </div>

              <div className="flex items-center gap-2 pt-2 lg:pt-0">
                <button
                  type="button"
                  onClick={() => navigate('/app/helpdesk')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-xs border border-white/10"
                >
                  <HelpCircle className="h-4 w-4 text-emerald-300" />
                  <span>Buka Panel Helpdesk</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Stat Pills */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Antrean NOC Review</p>
              <p className="mt-1 text-2xl font-black text-white">{openQueueCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">Diproses Teknisi</p>
              <p className="mt-1 text-2xl font-black text-white">{inProgressCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">Menunggu QC Helpdesk</p>
              <p className="mt-1 text-2xl font-black text-white">{qcCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold text-sm text-emerald-900">Tiket Berhasil Dibuat!</strong>
              <p className="text-xs text-emerald-800">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/app/helpdesk')}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition"
            >
              Lihat di Helpdesk
            </button>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Form Input (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <WorkspaceSectionShell
            eyebrow="Form Input Tiket"
            title="Detail data pelanggan dan keluhan teknis"
          >
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Section 1: Pemilihan Pelanggan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-600" />
                    Pilih Pelanggan
                  </label>
                  <span className="text-[11px] text-slate-400">Total {customers.length} pelanggan terdaftar</span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, ID, HP, ODP..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 bg-white shadow-2xs font-semibold text-slate-800"
                    />
                  </div>

                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 bg-white shadow-2xs"
                  >
                    {filteredCustomers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id}) - {c.odpId} [{c.region}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Customer Snapshot Card */}
                {selectedCustomer && (
                  <div className="rounded-2xl border border-emerald-200/80 bg-linear-to-br from-emerald-50/60 to-slate-50/70 p-4 space-y-3 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          {selectedCustomer.id}
                        </span>
                        <strong className="text-sm font-bold text-slate-950">{selectedCustomer.name}</strong>
                      </div>

                      {whatsappNumber && (
                        <a
                          href={`https://wa.me/${whatsappNumber}?text=Halo%20Bapak%2FIbu%20${encodeURIComponent(selectedCustomer.name)}%2C%20kami%20dari%20tim%20layanan%20terkait%20keluhan%20internet...`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-500 transition"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Chat WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Kontak</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" /> {selectedCustomer.phone || '-'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Paket</span>
                        <span className="font-semibold text-emerald-800 block mt-0.5">
                          {selectedCustomer.packagePlan || 'Internet Fiber'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">ODP / Wilayah</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-slate-400" /> {selectedCustomer.odpId} ({selectedCustomer.region})
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Alamat</span>
                        <span className="font-semibold text-slate-800 truncate block mt-0.5" title={selectedCustomer.address}>
                          {selectedCustomer.address || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Kategori & Prioritas */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-900 block">Kategori Masalah / Aduan:</label>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = category === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCategory(opt.id)}
                        className={`rounded-2xl border p-3 text-left transition-all shadow-2xs ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                            : `${opt.colorClass}`
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-600' : 'text-slate-600'}`} />
                          <strong className="text-xs font-bold text-slate-900">{opt.title}</strong>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{opt.subtitle}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-900 mb-1.5 block">Tingkat Prioritas:</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { id: 'low', label: 'Rendah (Low)', desc: 'Info / Billing', tone: 'slate' },
                      { id: 'medium', label: 'Sedang (Medium)', desc: 'Lemot berkala', tone: 'sky' },
                      { id: 'high', label: 'Tinggi (High)', desc: 'Putus total', tone: 'amber' },
                      { id: 'urgent', label: 'Kritis (Urgent)', desc: 'FO Putus / Massal', tone: 'rose' },
                    ].map((p) => {
                      const isSelected = priority === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id as TicketPriority)}
                          className={`rounded-xl border p-2.5 text-center transition ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-xs">{p.label}</span>
                          <span className={`block text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                            {p.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 3: Template Cepat & Judul */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <label className="text-xs font-bold text-slate-900">Judul Ringkas Keluhan:</label>
                  <span className="text-[10px] text-slate-400">Pilih template cepat di bawah untuk auto-fill:</span>
                </div>

                {/* Quick templates chips */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      onClick={() => applyTemplate(tpl)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition"
                    >
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      <span>{tpl.label}</span>
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Contoh: Internet LOS merah sejak pukul 10:00 WIB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500 bg-white shadow-2xs"
                />
              </div>

              {/* Section 4: Deskripsi Keluhan */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-900 block">Deskripsi Lengkap & Catatan Kejadian:</label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan secara detail keluhan pelanggan, gejala lampu modem, riwayat cuaca/peristiwa (hujan deras, truk lewat, dll)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs text-slate-900 outline-none focus:border-emerald-500 bg-white shadow-2xs leading-relaxed"
                />
              </div>

              {/* Automation Info Notice */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Alur Penanganan Tiket:</strong> Tiket baru akan masuk ke antrean <strong>1. NOC Review</strong>. Tim NOC akan melakukan remote ping/OMCI diagnosis. Jika kendala fisik, NOC akan mendispatch WO ke Kepala Teknisi untuk kunjungan lapangan.
                </div>
              </div>

              {/* Form Action Controls */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTitle('');
                    setDescription('');
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Reset Form
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !description.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>{isSubmitting ? 'Menyimpan Tiket...' : 'Simpan & Teruskan ke NOC'}</span>
                </button>
              </div>
            </form>
          </WorkspaceSectionShell>
        </div>

        {/* Right Column: Recent Tickets & Guide (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Tickets Card */}
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-600" />
                Tiket Terbaru
              </span>
              <button
                type="button"
                onClick={() => navigate('/app/helpdesk')}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              >
                Lihat Semua
              </button>
            </div>

            {recentTickets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada tiket yang terdaftar.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => onSelectTicket && onSelectTicket(ticket)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                      <span className="font-mono font-bold text-slate-900">{ticket.id}</span>
                      <span>{ticket.createdAt || 'Baru'}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition truncate">
                      {ticket.title}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="truncate">{ticket.customerName}</span>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full shrink-0">
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Guide Card */}
          <div className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-900 to-slate-950 p-5 text-white shadow-xs space-y-3">
            <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-400">
              <Zap className="h-4 w-4" />
              Panduan Pembuatan Tiket
            </span>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
              <li>Pastikan nomor WhatsApp pelanggan aktif untuk kemudahan konfirmasi teknisi.</li>
              <li>Pilih kategori <strong>LOS Merah</strong> jika lampu LOS berkedip merah (kabel FO putus).</li>
              <li>Untuk keluhan massal satu wilayah, cantumkan kode ODP di judul tiket.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

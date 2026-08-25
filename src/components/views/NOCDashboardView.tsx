import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Check,
  CheckCircle2,
  Network,
  Radio,
  Send,
  ShieldCheck,
  Terminal,
  Wifi,
  Zap,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket } from '../../types';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
import { NotesActionModal } from '../modals/NotesActionModal';

interface NOCDashboardViewProps {
  onSelectTicket: (ticket: TroubleTicket) => void;
}

type NocConsoleAction = 'remote_resolve' | 'escalate';

export const NOCDashboardView: React.FC<NOCDashboardViewProps> = ({ onSelectTicket }) => {
  const {
    customers,
    tickets,
    workOrders,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();
  const navigate = useNavigate();

  const [terminalLog, setTerminalLog] = useState<string[]>(() => [
    '[OLT-ZTE-C320-SDA] Connected via Telnet/SSH (10.20.0.10:23) - OK',
    '[GPON-OLT] Auto-discovery daemon running on rack 1 slot 1...',
    '[MIKROTIK-CORE] CCR2004-16G-2S+ RADIUS / PPPoE active sessions: 842',
    '[TELEMETRY] Optical Power polling interval: 15s. All PON lasers active.',
  ]);
  const [cliCommand, setCliCommand] = useState<string>('show gpon onu state gpon-olt_1/1/1');
  const [ticketActionTarget, setTicketActionTarget] = useState<{ ticket: TroubleTicket; action: NocConsoleAction } | null>(null);
  const [ticketActionNotes, setTicketActionNotes] = useState('');
  const [ticketNeedsReplacement, setTicketNeedsReplacement] = useState(false);
  const [ticketActionSaving, setTicketActionSaving] = useState(false);
  const pendingNocTickets = tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_noc_review');
  const escalatedCount = tickets.filter((ticket) => ticket.status === 'assigned_to_lead' || ticket.status === 'field_progress').length;
  const lowSignalCustomers = customers.filter((customer) => customer.opticalPowerDbm < -25).length;
  const pendingPppoeRequests = workOrders.filter((item) => item.type === 'installation' && item.pppoeRequestStatus === 'pending_noc').length;

  const runCliSim = () => {
    if (!cliCommand.trim()) return;
    const cmd = cliCommand.trim();
    const timestamp = new Date().toLocaleTimeString();

    let output = '';
    if (cmd.includes('show gpon onu state')) {
      output = `[${timestamp}] OnuIndex: 1/1/1:1 | AdminState: enable | AuthState: authenticated | PhaseState: working | Channel: GPON`;
    } else if (cmd.includes('power') || cmd.includes('attenuation')) {
      output = `[${timestamp}] ONU Rx optical power: -20.8 dBm (Normal) | OLT Rx power: -19.4 dBm | Temperature: 42C | Voltage: 3.28V`;
    } else if (cmd.includes('ppp') || cmd.includes('mikrotik')) {
      output = `[${timestamp}] PPPoE Session sda1042@isp.net [UP] uptime 14d 02h 11m, rate: 50M/50M, remote-ip 10.20.14.42`;
    } else {
      output = `[${timestamp}] Executed: "${cmd}" -> Status: 200 OK (Device synchronized)`;
    }

    setTerminalLog((prev) => [...prev, `> ${cmd}`, output]);
    setCliCommand('');
  };

  const openTicketActionModal = (ticket: TroubleTicket, action: NocConsoleAction) => {
    setTicketActionTarget({ ticket, action });
    setTicketNeedsReplacement(false);
    setTicketActionNotes(
      action === 'remote_resolve'
        ? 'Konfigurasi OMCI selesai di-apply dan pelanggan kembali online.'
        : 'Kabel FO drop wire putus di tiang PLN dan perlu kunjungan teknisi.',
    );
  };

  const closeTicketActionModal = () => {
    if (ticketActionSaving) return;
    setTicketActionTarget(null);
    setTicketActionNotes('');
    setTicketNeedsReplacement(false);
  };

  const submitTicketAction = async () => {
    if (!ticketActionTarget || !ticketActionNotes.trim()) {
      return;
    }

    setTicketActionSaving(true);
    try {
      if (ticketActionTarget.action === 'remote_resolve') {
        await Promise.resolve(resolveTicketRemotely(ticketActionTarget.ticket.id, ticketActionNotes.trim()));
      } else {
        await Promise.resolve(
          escalateTicketToLeadTech(ticketActionTarget.ticket.id, ticketActionNotes.trim(), {
            requiresReplacementRequest: ticketNeedsReplacement,
          }),
        );
      }
      closeTicketActionModal();
    } finally {
      setTicketActionSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="NOC Operations"
        title="Triage tiket gangguan, monitoring sinyal, dan console teknis NOC"
        subtitle="Dashboard utama NOC untuk pemantauan tiket gangguan aktif, kualitas sinyal pelanggan, dan referensi perangkat inti."
        stats={[
          {
            label: 'Pending Review',
            value: pendingNocTickets.length,
            description: 'Tiket gangguan yang masih menunggu triage dan analisa remote NOC.',
            icon: ShieldCheck,
            accentClass: 'bg-sky-400/15 text-sky-200',
          },
          {
            label: 'Diteruskan ke Lapangan',
            value: escalatedCount,
            description: 'Tiket yang sudah dibuatkan WO maintenance dan sedang berjalan di lapangan.',
            icon: Send,
            accentClass: 'bg-emerald-400/15 text-emerald-200',
          },
          {
            label: 'Low Signal',
            value: lowSignalCustomers,
            description: 'Pelanggan existing dengan redaman di bawah ambang aman.',
            icon: Activity,
            accentClass: 'bg-rose-400/15 text-rose-200',
          },
          {
            label: 'Core Status',
            value: 'Synced',
            description: 'RADIUS, PPPoE, dan telemetri inti berada dalam status sinkron.',
            icon: Radio,
            accentClass: 'bg-violet-400/15 text-violet-200',
          },
          {
            label: 'Request PPPoE',
            value: pendingPppoeRequests,
            description: 'Permintaan PPPoE dari teknisi lapangan yang menunggu pengisian NOC.',
            icon: Wifi,
            accentClass: 'bg-cyan-400/15 text-cyan-200',
          },
        ]}
      />

      <WorkspaceSectionShell
        eyebrow="PPPoE"
        title="Request PPPoE"
        badge={`${pendingPppoeRequests} menunggu`}
        actions={(
          <button
            type="button"
            onClick={() => navigate('/app/request-pppoe-noc')}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Buka Request PPPoE
          </button>
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pending NOC</div>
            <div className="mt-2 text-3xl font-black text-slate-950">{pendingPppoeRequests}</div>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-5 md:col-span-2">
            <div className="text-sm font-semibold text-slate-700">
              Tekan indikator ini untuk membuka antrean pengisian username dan password PPPoE pasang baru.
            </div>
          </div>
        </div>
      </WorkspaceSectionShell>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[
          {
            code: 'ZTE',
            title: 'OLT ZTE C320 (Sidoarjo)',
            subtitle: 'IP 10.20.0.10 | Slot GTGO 8-Port',
            stats: [
              'Total ONT terdaftar: 542 Unit (GPON)',
              'Laser TX Power: +5.2 dBm (Class C++)',
              'Rata-rata redaman ODP: -20.4 dBm',
            ],
            tone: 'bg-emerald-50 text-emerald-800',
          },
          {
            code: 'HUA',
            title: 'OLT Huawei MA5608T (Waru)',
            subtitle: 'IP 10.20.0.20 | Slot GPBD 8-Port',
            stats: [
              'Total ONT terdaftar: 308 Unit (GPON)',
              'Laser TX Power: +4.8 dBm (Class C+)',
              'Rata-rata redaman ODP: -19.8 dBm',
            ],
            tone: 'bg-rose-50 text-rose-800',
          },
          {
            code: 'ROS',
            title: 'Mikrotik CCR2004 (Core BRAS)',
            subtitle: 'RouterOS v7.14 | Up 48 Days',
            stats: [
              'Active PPPoE sessions: 842 / 850 online',
              'Random password security: 10-char strict mode',
              'Aggregate bandwidth: 4.82 Gbps / 10 Gbps',
            ],
            tone: 'bg-slate-900 text-white',
          },
        ].map((card) => (
          <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-xs font-black ${card.tone}`}>
                  {card.code}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-950">{card.title}</h3>
                  <p className="text-xs text-slate-500">{card.subtitle}</p>
                </div>
              </div>
              <WorkspaceStatusPill label="ONLINE 100%" tone="emerald" />
            </div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              {card.stats.map((stat) => (
                <div key={stat} className="rounded-2xl bg-slate-50 px-3 py-2">
                  {stat}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <WorkspaceSectionShell
        eyebrow="Ticket Triage"
        title="Antrean tiket gangguan yang perlu tindakan NOC"
        subtitle="Gunakan area ini untuk triage remote, eskalasi ke kepala teknisi, dan membuka riwayat lengkap ticket."
        badge={`${pendingNocTickets.length} tiket menunggu tindakan`}
      >
        {pendingNocTickets.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Semua sinyal OLT dan tiket NOC aman</p>
            <p className="mt-0.5 text-xs text-slate-500">Tidak ada antrean tiket yang membutuhkan verifikasi teknis saat ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingNocTickets.map((ticket) => {
              const customer = customers.find((item) => item.id === ticket.customerId);

              return (
                <div key={ticket.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{ticket.id}</span>
                        <WorkspaceStatusPill
                          label="TRIAGE NOC"
                          tone="amber"
                        />
                        <span className="text-xs text-slate-400">{ticket.createdAt}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-950">{ticket.title}</h4>
                        <p className="mt-1 text-sm text-slate-500">{ticket.description}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Pelanggan</span>
                          <span className="mt-1 block font-semibold text-slate-800">{ticket.customerName} ({ticket.customerId})</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">ODP & Wilayah</span>
                          <span className="mt-1 block font-semibold text-slate-800">{ticket.odpId} ({ticket.region})</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">SN ONT</span>
                          <span className="mt-1 block font-mono font-semibold text-slate-800">{customer?.ontSerialNumber || 'ZTEGCA48B21F'}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Redaman Terakhir</span>
                          <span className={`mt-1 block font-mono font-bold ${(customer?.opticalPowerDbm || 0) < -25 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {customer?.opticalPowerDbm ? `${customer.opticalPowerDbm} dBm` : '-20.5 dBm'}
                          </span>
                        </div>
                      </div>

                    </div>

                    <div className="w-full shrink-0 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-80">
                      <p className="text-sm font-black text-slate-950">Tindakan Cepat NOC</p>
                      <div className="mt-4 space-y-3">
                        <button
                          type="button"
                          onClick={() => openTicketActionModal(ticket, 'remote_resolve')}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Selesai Remote ke Helpdesk QC
                        </button>
                        <button
                          type="button"
                          onClick={() => openTicketActionModal(ticket, 'escalate')}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-sky-700"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Kirim WO ke Kepala Teknisi
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Buka Riwayat Lengkap
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

      <WorkspaceSectionShell
        eyebrow="Console NOC"
        title="Interactive OLT / Mikrotik Console CLI"
        subtitle="Panel teknis untuk memeriksa ONU state, redaman, dan sesi PPPoE tanpa meninggalkan dashboard NOC."
        badge="ZTE ZXROS v4.1 / RouterOS 7"
      >
        <div className="overflow-hidden bg-slate-950 text-xs font-mono text-emerald-400">
          <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span className="font-bold">Live Console Simulation</span>
            </div>
            <WorkspaceStatusPill label="CORE SYNCED" tone="sky" />
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto bg-black/40 p-4">
            {terminalLog.map((line, index) => (
              <div key={`${line}-${index}`} className={line.startsWith('>') ? 'font-bold text-amber-300' : 'text-emerald-400/90'}>
                {line}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-800 bg-slate-900/90 p-3">
            <span className="select-none text-slate-400">#</span>
            <input
              type="text"
              value={cliCommand}
              onChange={(event) => setCliCommand(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && runCliSim()}
              placeholder="Ketik command seperti show gpon onu state atau mikrotik /ppp active print..."
              className="flex-1 bg-transparent text-xs text-emerald-300 placeholder-slate-600 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={runCliSim}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-500"
            >
              Execute
            </button>
          </div>
        </div>
      </WorkspaceSectionShell>

      <NotesActionModal
        open={ticketActionTarget !== null}
        title={
          ticketActionTarget?.action === 'remote_resolve'
            ? 'Konfirmasi Penyelesaian Remote NOC'
            : 'Konfirmasi Eskalasi ke Kepala Teknisi'
        }
        message={
          ticketActionTarget
            ? ticketActionTarget.action === 'remote_resolve'
              ? `Tiket ${ticketActionTarget.ticket.id} untuk ${ticketActionTarget.ticket.customerName} akan diselesaikan dari sisi NOC dan dikembalikan ke QC Helpdesk.`
              : `Tiket ${ticketActionTarget.ticket.id} untuk ${ticketActionTarget.ticket.customerName} akan diteruskan menjadi WO maintenance ke Kepala Teknisi.`
            : ''
        }
        label={ticketActionTarget?.action === 'remote_resolve' ? 'Catatan Perbaikan Remote NOC' : 'Catatan Kendala Fisik / Eskalasi'}
        value={ticketActionNotes}
        onChange={setTicketActionNotes}
        placeholder={
          ticketActionTarget?.action === 'remote_resolve'
            ? 'Jelaskan tindakan remote yang dilakukan dan hasil koneksi pelanggan.'
            : 'Jelaskan penyebab eskalasi lapangan, indikasi gangguan fisik, atau kebutuhan kunjungan teknisi.'
        }
        confirmLabel={ticketActionTarget?.action === 'remote_resolve' ? 'Ya, Selesaikan Remote' : 'Ya, Kirim ke Kepala Teknisi'}
        tone={ticketActionTarget?.action === 'remote_resolve' ? 'success' : 'warning'}
        loading={ticketActionSaving}
        onCancel={closeTicketActionModal}
        onConfirm={() => {
          void submitTicketAction();
        }}
      >
        {ticketActionTarget?.action === 'escalate' ? (
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={ticketNeedsReplacement}
              onChange={(event) => setTicketNeedsReplacement(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
            />
            <span>
              Butuh alat pengganti. Jika dicentang, sistem akan otomatis membuat request alat maintenance ke gudang sebelum pekerjaan turun ke teknisi.
            </span>
          </label>
        ) : null}
      </NotesActionModal>
    </div>
  );
};

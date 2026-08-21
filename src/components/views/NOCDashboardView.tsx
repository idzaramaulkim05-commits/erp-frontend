import React, { useState } from 'react';
import {
  Activity,
  Check,
  CheckCircle2,
  Network,
  Radio,
  Send,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket } from '../../types';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface NOCDashboardViewProps {
  onSelectTicket: (ticket: TroubleTicket) => void;
}

export const NOCDashboardView: React.FC<NOCDashboardViewProps> = ({ onSelectTicket }) => {
  const {
    customers,
    tickets,
    verifyAndCloseNOC,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();

  const [terminalLog, setTerminalLog] = useState<string[]>(() => [
    '[OLT-ZTE-C320-SDA] Connected via Telnet/SSH (10.20.0.10:23) - OK',
    '[GPON-OLT] Auto-discovery daemon running on rack 1 slot 1...',
    '[MIKROTIK-CORE] CCR2004-16G-2S+ RADIUS / PPPoE active sessions: 842',
    '[TELEMETRY] Optical Power polling interval: 15s. All PON lasers active.',
  ]);
  const [cliCommand, setCliCommand] = useState<string>('show gpon onu state gpon-olt_1/1/1');
  const [closingDbmInput, setClosingDbmInput] = useState<{ [ticketId: string]: number }>({});

  const pendingNocTickets = tickets.filter((ticket) => ticket.status === 'lead_sop_approved' || ticket.status === 'in_noc_review');
  const readyToClose = tickets.filter((ticket) => ticket.status === 'lead_sop_approved').length;
  const lowSignalCustomers = customers.filter((customer) => customer.opticalPowerDbm < -25).length;

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

  const handleCloseTicket = (ticket: TroubleTicket) => {
    const dbm = closingDbmInput[ticket.id] || -20.5;
    verifyAndCloseNOC(ticket.id, {
      opticalDbmReading: dbm,
      pppoeSessionActive: true,
      rxPowerThresholdPassed: dbm >= -25.0 && dbm <= -17.0,
      notes: `Verifikasi NOC berhasil. Nilai redaman OLT terbaca ${dbm} dBm. PPPoE aktif.`,
    });
  };

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="NOC Support Operations"
        title="Monitoring gangguan, verifikasi sinyal, dan console operasional NOC"
        subtitle="Area operasional sekunder setelah home pipeline NOC. Fokus halaman ini adalah triage tiket existing, closing teknis, dan pemantauan core/OLT."
        stats={[
          {
            label: 'Pending Review',
            value: pendingNocTickets.length,
            description: 'Tiket yang masih menunggu triage atau final validation NOC.',
            icon: ShieldCheck,
            accentClass: 'bg-sky-400/15 text-sky-200',
          },
          {
            label: 'Ready Closing',
            value: readyToClose,
            description: 'Ticket yang sudah lolos SOP lapangan dan siap ditutup.',
            icon: CheckCircle2,
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
        ]}
      />

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
        title="Stasiun verifikasi sinyal dan closing tiket NOC"
        subtitle="Tiket yang memerlukan validasi teknis, baik remote resolution maupun closing sesudah tim lapangan selesai."
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
              const isLeadSopApproved = ticket.status === 'lead_sop_approved';

              return (
                <div key={ticket.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{ticket.id}</span>
                        <WorkspaceStatusPill
                          label={isLeadSopApproved ? 'SIAP CLOSING' : 'TRIAGE NOC'}
                          tone={isLeadSopApproved ? 'violet' : 'amber'}
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

                      {ticket.leadTechApproval && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
                          <span className="font-bold">Catatan Kepala Teknisi:</span> {ticket.leadTechApproval.notes}
                        </div>
                      )}
                    </div>

                    <div className="w-full shrink-0 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-80">
                      <p className="text-sm font-black text-slate-950">{isLeadSopApproved ? 'Validasi Redaman & Close' : 'Tindakan Cepat NOC'}</p>
                      <div className="mt-4 space-y-3">
                        {isLeadSopApproved ? (
                          <>
                            <div>
                              <label className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                Nilai Redaman OLT
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  placeholder="-20.5"
                                  defaultValue={-20.5}
                                  onChange={(event) =>
                                    setClosingDbmInput({
                                      ...closingDbmInput,
                                      [ticket.id]: parseFloat(event.target.value),
                                    })
                                  }
                                  className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono font-bold text-slate-800"
                                />
                                <span className="text-xs font-mono text-slate-500">dBm</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCloseTicket(ticket)}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Validasi & Close Tiket
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const notes = prompt('Catatan perbaikan remote NOC:', 'Konfigurasi OMCI selesai di-apply.');
                                if (notes) resolveTicketRemotely(ticket.id, notes);
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Selesaikan Remote
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const notes = prompt('Catatan kendala fisik kabel/modem:', 'Kabel FO drop wire putus di tiang PLN.');
                                if (notes) escalateTicketToLeadTech(ticket.id, notes);
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-sky-700"
                            >
                              <Send className="h-3.5 w-3.5" />
                              Kirim WO ke Kepala Teknisi
                            </button>
                          </>
                        )}

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
        subtitle="Panel simulasi CLI untuk memeriksa ONU state, redaman, dan sesi PPPoE tanpa meninggalkan workspace."
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
    </div>
  );
};

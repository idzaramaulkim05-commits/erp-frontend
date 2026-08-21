import React, { useState } from 'react';
import {
  Radio,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Zap,
  ShieldCheck,
  Search,
  Check,
  Send,
  Eye
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket } from '../../types';

interface NOCDashboardViewProps {
  onSelectTicket: (ticket: TroubleTicket) => void;
}

export const NOCDashboardView: React.FC<NOCDashboardViewProps> = ({ onSelectTicket }) => {
  const {
    customers,
    tickets,
    networkOdps,
    verifyAndCloseNOC,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();

  const [selectedOlt, setSelectedOlt] = useState<'zte' | 'huawei'>('zte');
  const [terminalLog, setTerminalLog] = useState<string[]>(() => [
    '[OLT-ZTE-C320-SDA] Connected via Telnet/SSH (10.20.0.10:23) - OK',
    '[GPON-OLT] Auto-discovery daemon running on rack 1 slot 1...',
    '[MIKROTIK-CORE] CCR2004-16G-2S+ RADIUS / PPPoE active sessions: 842',
    '[TELEMETRY] Optical Power polling interval: 15s. All PON lasers active.',
  ]);
  const [cliCommand, setCliCommand] = useState<string>('show gpon onu state gpon-olt_1/1/1');
  const [closingDbmInput, setClosingDbmInput] = useState<{ [ticketId: string]: number }>({});

  // Pending NOC verification tickets (SOP approved by Lead Tech or in NOC review)
  const pendingNocTickets = tickets.filter(
    (t) => t.status === 'lead_sop_approved' || t.status === 'in_noc_review'
  );

  const runCliSim = () => {
    if (!cliCommand.trim()) return;
    const cmd = cliCommand.trim();
    const timestamp = new Date().toLocaleTimeString();

    let output = '';
    if (cmd.includes('show gpon onu state')) {
      output = `[${timestamp}] OnuIndex: 1/1/1:1 | AdminState: enable | AuthState: authenticated | PhaseState: working | Channel: GPON`;
    } else if (cmd.includes('power') || cmd.includes('attenuation')) {
      output = `[${timestamp}] ONU Rx optical power: -20.8 dBm (Normal) | OLT Rx power: -19.4 dBm | Temperature: 42°C | Voltage: 3.28V`;
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
      {/* Top OLT & Network Engine Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* OLT ZTE Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs">
                ZTE
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OLT ZTE C320 (Sidoarjo)</h4>
                <p className="text-[10px] text-slate-500">IP: 10.20.0.10 • Slot GTGO 8-Port</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE 100%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total ONT Terdaftar:</span>
              <span className="font-bold text-slate-800">542 Unit (GPON)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Laser TX Power:</span>
              <span className="font-semibold text-emerald-700">+5.2 dBm (Class C++)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Rata-rata Redaman ODP:</span>
              <span className="font-semibold text-slate-800">-20.4 dBm (SOP Normal)</span>
            </div>
          </div>
        </div>

        {/* OLT Huawei Status Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-800 font-bold text-xs">
                HUA
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">OLT Huawei MA5608T (Waru)</h4>
                <p className="text-[10px] text-slate-500">IP: 10.20.0.20 • Slot GPBD 8-Port</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ONLINE 100%
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Total ONT Terdaftar:</span>
              <span className="font-bold text-slate-800">308 Unit (GPON)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Laser TX Power:</span>
              <span className="font-semibold text-emerald-700">+4.8 dBm (Class C+)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Rata-rata Redaman ODP:</span>
              <span className="font-semibold text-slate-800">-19.8 dBm (SOP Normal)</span>
            </div>
          </div>
        </div>

        {/* Core Mikrotik PPPoE BRAS Card */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                ROS
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Mikrotik CCR2004 (Core BRAS)</h4>
                <p className="text-[10px] text-slate-500">RouterOS v7.14 • Up 48 Days</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              RADIUS SYNCED
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Active PPPoE Sessions:</span>
              <span className="font-bold text-emerald-700">842 / 850 Online</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Random Password Security:</span>
              <span className="font-semibold text-emerald-700">✓ 10-Char Strict Mode</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Aggregate Bandwidth:</span>
              <span className="font-semibold text-slate-800">4.82 Gbps / 10 Gbps</span>
            </div>
          </div>
        </div>
      </div>

      {/* NOC Ticket Triage & Signal Verification Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Stasiun Verifikasi Sinyal & Closing Tiket NOC</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tiket yang memerlukan validasi teknis (Pengecekan redaman optik & aktivasi PPPoE)
            </p>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
            {pendingNocTickets.length} Tiket Menunggu Tindakan
          </span>
        </div>

        {pendingNocTickets.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Semua sinyal OLT & tiket NOC aman</p>
            <p className="text-xs text-slate-500 mt-0.5">Tidak ada antrian tiket yang membutuhkan verifikasi teknis saat ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingNocTickets.map((ticket) => {
              const cust = customers.find((c) => c.id === ticket.customerId);
              const isLeadSopApproved = ticket.status === 'lead_sop_approved';

              return (
                <div key={ticket.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: Detail */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {ticket.id}
                        </span>
                        {isLeadSopApproved ? (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
                            ✓ SOP Disetujui Kepala Teknisi ➔ Siap Closing
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                            Menunggu Triage NOC (Remote vs Field)
                          </span>
                        )}
                        <span className="text-xs text-slate-400">• {ticket.createdAt}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                      <p className="text-xs text-slate-600">{ticket.description}</p>

                      {/* Technical metadata */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">ID / Pelanggan:</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {ticket.customerName} ({ticket.customerId})
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">ODP & Wilayah:</span>
                          <span className="font-semibold text-slate-800 block">
                            {ticket.odpId} ({ticket.region})
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">SN ONT / Model:</span>
                          <span className="font-mono font-semibold text-slate-800 block truncate">
                            {cust?.ontSerialNumber || 'ZTEGCA48B21F'}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block">Redaman Terakhir:</span>
                          <span
                            className={`font-mono font-bold ${
                              (cust?.opticalPowerDbm || 0) < -25
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {cust?.opticalPowerDbm ? `${cust.opticalPowerDbm} dBm` : '-20.5 dBm'}
                          </span>
                        </div>
                      </div>

                      {/* Lead Tech SOP Notes if available */}
                      {ticket.leadTechApproval && (
                        <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Catatan Kepala Teknisi (SOP Passed): </span>
                            <span>{ticket.leadTechApproval.notes}</span>
                            <div className="flex gap-2 text-[10px] font-semibold text-emerald-700 mt-1">
                              <span>✓ Klem Kabel Rapi</span>
                              <span>✓ Protection Sleeve Terpasang</span>
                              <span>✓ Area Pelanggan Bersih</span>
                              <span>✓ Speedtest OK</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Closing / Action Control */}
                    <div className="flex flex-col gap-2 shrink-0 lg:w-72 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">
                        {isLeadSopApproved ? 'Validasi Redaman & Close' : 'Tindakan Cepat NOC'}
                      </span>

                      {isLeadSopApproved ? (
                        <div className="space-y-2">
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                              Nilai Redaman OLT (dBm):
                            </label>
                            <div className="flex items-center space-x-1">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="-20.5"
                                defaultValue={-20.5}
                                onChange={(e) =>
                                  setClosingDbmInput({
                                    ...closingDbmInput,
                                    [ticket.id]: parseFloat(e.target.value),
                                  })
                                }
                                className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800"
                              />
                              <span className="text-xs text-slate-500 font-mono">dBm</span>
                            </div>
                            <span className="text-[9px] text-emerald-600 font-medium">
                              Standar SOP: -18 dBm s/d -24 dBm
                            </span>
                          </div>

                          <button
                            onClick={() => handleCloseTicket(ticket)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Validasi & Close Tiket (100%)</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            onClick={() => {
                              const n = prompt('Catatan perbaikan remote NOC:', 'Konfigurasi OMCI selesai di-apply.');
                              if (n) resolveTicketRemotely(ticket.id, n);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Selesaikan Remote (Tanpa WO)</span>
                          </button>

                          <button
                            onClick={() => {
                              const n = prompt('Catatan kendala fisik kabel/modem:', 'Kabel FO drop wire putus di tiang PLN.');
                              if (n) escalateTicketToLeadTech(ticket.id, n);
                            }}
                            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Kirim WO ke Kepala Teknisi</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => onSelectTicket(ticket)}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-medium text-center py-0.5"
                      >
                        Buka Riwayat Lengkap →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulated OLT / Mikrotik Live Terminal for NOC Engineers */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-emerald-400 font-mono text-xs">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">
              Interactive OLT / Mikrotik Console CLI (Simulasi)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
              ZTE ZXROS v4.1 / RouterOS 7
            </span>
          </div>
        </div>

        <div className="p-4 max-h-56 overflow-y-auto space-y-1 bg-black/40">
          {terminalLog.map((line, idx) => (
            <div
              key={idx}
              className={line.startsWith('>') ? 'text-amber-300 font-bold' : 'text-emerald-400/90'}
            >
              {line}
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center space-x-2">
          <span className="text-slate-400 select-none">#</span>
          <input
            type="text"
            value={cliCommand}
            onChange={(e) => setCliCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runCliSim()}
            placeholder="Ketik command: 'show gpon onu state', 'show pon power attenuation', atau 'mikrotik /ppp active print'..."
            className="flex-1 bg-transparent text-emerald-300 placeholder-slate-600 focus:outline-hidden text-xs"
          />
          <button
            onClick={runCliSim}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs transition-colors shrink-0"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Layers,
  Network,
  Send,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, NetworkODP, TroubleTicket, WorkOrder } from '../../types';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
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
    networkOdps,
    inventory,
    auditLogs,
    resolveTicketRemotely,
    escalateTicketToLeadTech,
  } = useIOMS();
  const navigate = useNavigate();

  const [ticketActionTarget, setTicketActionTarget] = useState<{ ticket: TroubleTicket; action: NocConsoleAction } | null>(null);
  const [ticketActionNotes, setTicketActionNotes] = useState('');
  const [ticketNeedsReplacement, setTicketNeedsReplacement] = useState(false);
  const [replacementItems, setReplacementItems] = useState<Array<{ itemName: string; quantity: number; unit: string }>>([
    { itemName: '', quantity: 1, unit: 'Unit' },
  ]);
  const [ticketActionSaving, setTicketActionSaving] = useState(false);
  const [odpFilterRegion, setOdpFilterRegion] = useState<string>('all');
  const [signalSearch, setSignalSearch] = useState<string>('');

  // 1. Real KPI Calculations
  const pendingNocTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_noc_review'),
    [tickets],
  );

  const pendingPppoeWorkOrders = useMemo(
    () => workOrders.filter((item) => item.type === 'installation' && item.pppoeRequestStatus === 'pending_noc'),
    [workOrders],
  );

  const pendingQcWorkOrders = useMemo(
    () => workOrders.filter((item) => item.status === 'menunggu_qc_noc'),
    [workOrders],
  );

  const lowSignalCustomers = useMemo(
    () => customers.filter((customer) => (customer.opticalPowerDbm || 0) < -25),
    [customers],
  );

  // 2. Real Infrastructure & ODP Aggregations
  const totalOdpPorts = useMemo(
    () => networkOdps.reduce((sum, odp) => sum + (odp.totalPorts || 0), 0),
    [networkOdps],
  );

  const usedOdpPorts = useMemo(
    () => networkOdps.reduce((sum, odp) => sum + (odp.usedPorts || 0), 0),
    [networkOdps],
  );

  const availableOdpPorts = Math.max(0, totalOdpPorts - usedOdpPorts);
  const overallPortUtilization = totalOdpPorts > 0 ? Math.round((usedOdpPorts / totalOdpPorts) * 100) : 0;

  // Group ODPs by Region
  const regionOdpStats = useMemo(() => {
    const map = new Map<string, { region: string; totalOdps: number; totalPorts: number; usedPorts: number; oltHosts: Set<string> }>();

    networkOdps.forEach((odp) => {
      const reg = odp.region || 'Lainnya';
      const existing = map.get(reg) || { region: reg, totalOdps: 0, totalPorts: 0, usedPorts: 0, oltHosts: new Set<string>() };
      existing.totalOdps += 1;
      existing.totalPorts += odp.totalPorts || 0;
      existing.usedPorts += odp.usedPorts || 0;
      if (odp.oltHost) existing.oltHosts.add(odp.oltHost);
      map.set(reg, existing);
    });

    return Array.from(map.values());
  }, [networkOdps]);

  const filteredOdps = useMemo(() => {
    if (odpFilterRegion === 'all') return networkOdps;
    return networkOdps.filter((odp) => odp.region === odpFilterRegion);
  }, [networkOdps, odpFilterRegion]);

  // 3. Real Signal Health Breakdown
  const signalOptimalCount = customers.filter((c) => (c.opticalPowerDbm || 0) >= -22).length;
  const signalWarningCount = customers.filter((c) => (c.opticalPowerDbm || 0) >= -25 && (c.opticalPowerDbm || 0) < -22).length;
  const signalCriticalCount = customers.filter((c) => (c.opticalPowerDbm || 0) < -25).length;

  const watchlistCustomers = useMemo(() => {
    let list = customers.filter((c) => (c.opticalPowerDbm || 0) < -22);
    if (signalSearch.trim()) {
      const q = signalSearch.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q)
        || c.id.toLowerCase().includes(q)
        || c.pppoeUsername.toLowerCase().includes(q)
        || (c.odpId && c.odpId.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => (a.opticalPowerDbm || 0) - (b.opticalPowerDbm || 0));
  }, [customers, signalSearch]);

  // 4. Real NOC-related Audit Logs
  const nocAuditLogs = useMemo(() => {
    return auditLogs.filter(
      (log) => log.actorRole === 'noc' || log.action.toLowerCase().includes('pppoe') || log.action.toLowerCase().includes('qc') || log.action.toLowerCase().includes('ticket'),
    ).slice(0, 8);
  }, [auditLogs]);

  // Handlers
  const handleAddReplacementItem = () => {
    setReplacementItems((prev) => [...prev, { itemName: '', quantity: 1, unit: 'Unit' }]);
  };

  const handleRemoveReplacementItem = (index: number) => {
    setReplacementItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReplacementItemChange = (index: number, field: 'itemName' | 'quantity' | 'unit', val: any) => {
    setReplacementItems((prev) => {
      const next = [...prev];
      if (field === 'itemName') {
        const invItem = inventory.find((i) => i.name === val);
        next[index] = {
          ...next[index],
          itemName: val,
          unit: invItem?.unit || next[index].unit || 'Unit',
        };
      } else {
        next[index] = {
          ...next[index],
          [field]: val,
        };
      }
      return next;
    });
  };

  const openTicketActionModal = (ticket: TroubleTicket, action: NocConsoleAction) => {
    setTicketActionTarget({ ticket, action });
    setTicketNeedsReplacement(false);
    const defaultItem = inventory.find((i) => i.category === 'ONT' || i.name.toLowerCase().includes('onu') || i.name.toLowerCase().includes('modem')) || inventory[0];
    setReplacementItems([
      {
        itemName: defaultItem?.name || '',
        quantity: 1,
        unit: defaultItem?.unit || 'Unit',
      },
    ]);
    setTicketActionNotes(
      action === 'remote_resolve'
        ? 'Konfigurasi OMCI / profiling ulang berhasil diterapkan dan koneksi pelanggan kembali normal.'
        : (ticket.description || 'Indikasi kendala fisik kabel/perangkat lapangan, diperlukan penanganan teknisi langsung.'),
    );
  };

  const closeTicketActionModal = () => {
    if (ticketActionSaving) return;
    setTicketActionTarget(null);
    setTicketActionNotes('');
    setTicketNeedsReplacement(false);
    setReplacementItems([{ itemName: '', quantity: 1, unit: 'Unit' }]);
  };

  const submitTicketAction = async () => {
    if (!ticketActionTarget || !ticketActionNotes.trim()) {
      return;
    }

    const validItems = replacementItems.filter((i) => i.itemName.trim() !== '');

    if (ticketActionTarget.action === 'escalate' && ticketNeedsReplacement && validItems.length === 0) {
      alert('Silakan pilih minimal satu alat / material pengganti dari stok gudang.');
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
            replacementItems: ticketNeedsReplacement ? validItems : [],
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
      {/* Quick Action Modules Banners */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Request PPPoE Card */}
        <div className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">Aktivasi PPPoE</h3>
                  <p className="text-xs text-slate-500">Pasang baru menunggu kredensial</p>
                </div>
              </div>
              <WorkspaceStatusPill
                label={`${pendingPppoeWorkOrders.length} PENDING`}
                tone={pendingPppoeWorkOrders.length > 0 ? 'sky' : 'neutral'}
              />
            </div>

            {pendingPppoeWorkOrders.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Tidak ada permintaan PPPoE yang tertunda saat ini.
              </p>
            ) : (
              <div className="space-y-2 py-1">
                {pendingPppoeWorkOrders.slice(0, 2).map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{wo.customerName}</span>
                      <span className="text-[11px] text-slate-400 block">{wo.id} • {wo.packagePlan || 'Paket Internet'}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-sky-700">{wo.region}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/app/request-pppoe-noc')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <span>Request PPPoE</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* QC Verifikasi Card */}
        <div className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">QC Verifikasi Pelanggan</h3>
                  <p className="text-xs text-slate-500">Hasil kerja teknisi di pelanggan</p>
                </div>
              </div>
              <WorkspaceStatusPill
                label={`${pendingQcWorkOrders.length} SIAP QC`}
                tone={pendingQcWorkOrders.length > 0 ? 'violet' : 'neutral'}
              />
            </div>

            {pendingQcWorkOrders.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Seluruh pekerjaan instalasi & perbaikan telah tuntas diverifikasi.
              </p>
            ) : (
              <div className="space-y-2 py-1">
                {pendingQcWorkOrders.slice(0, 2).map((wo) => (
                  <div key={wo.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{wo.customerName}</span>
                      <span className="text-[11px] text-slate-400 block">{wo.id} • Teknisi: {wo.assignedTechName || 'Teknisi'}</span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-violet-700">{wo.region}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/app/qc-instalasi-noc')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <span>QC Instalasi Pelanggan</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Inventory & Work Orders POP Card */}
        <div className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-950">Inventory POP</h3>
                  <p className="text-xs text-slate-500">Server cabang, OLT, Switch & Penugasan</p>
                </div>
              </div>
              <WorkspaceStatusPill
                label="HUB KONTROL"
                tone="emerald"
              />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed py-1">
              Kelola daftar perangkat terpasang di POP, buat instruksi penambahan/penggantian alat ke teknisi, dan lakukan QC crosscheck teknis on-site.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/app/inventory-pop')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-600"
            >
              <span>Buka Inventory & Mutasi POP</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Real Infrastructure & ODP Capacity Overview */}
      <WorkspaceSectionShell
        eyebrow="Distribusi Jaringan Optik"
        title="Kapasitas & Utilisasi ODP per Wilayah"
        subtitle="Data real-time kapasitas port ODP terpasang dan utilisasi pelanggan dari database."
        badge={`${networkOdps.length} ODP Terdaftar`}
      >
        <div className="space-y-6 p-5">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total ODP</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{networkOdps.length} ODP</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Kapasitas</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{totalOdpPorts} Port</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Port Terpakai</span>
              <div className="mt-1 text-2xl font-black text-emerald-700">{usedOdpPorts} Port</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Utilisasi Global</span>
              <div className="mt-1 text-2xl font-black text-slate-900">{overallPortUtilization}%</div>
            </div>
          </div>

          {/* Regional Aggregation Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {regionOdpStats.map((reg) => {
              const utilPercent = reg.totalPorts > 0 ? Math.round((reg.usedPorts / reg.totalPorts) * 100) : 0;
              const hosts = Array.from(reg.oltHosts).join(', ') || 'OLT GPON Core';

              return (
                <div
                  key={reg.region}
                  className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                        <Network className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{reg.region}</h4>
                        <span className="text-[11px] text-slate-400">{hosts}</span>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        utilPercent >= 85
                          ? 'bg-rose-100 text-rose-800'
                          : utilPercent >= 60
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {utilPercent}% Kapasitas
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total ODP: <strong>{reg.totalOdps} Unit</strong></span>
                      <span>Port: <strong>{reg.usedPorts} / {reg.totalPorts}</strong></span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full transition-all duration-500 ${
                          utilPercent >= 85
                            ? 'bg-rose-500'
                            : utilPercent >= 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, utilPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </WorkspaceSectionShell>

      {/* 4. Real Signal Health & Watchlist Telemetry */}
      <WorkspaceSectionShell
        eyebrow="Telemetri Optik Pelanggan"
        title="Kesehatan Sinyal & Watchlist Redaman Optik"
        subtitle="Pemantauan redaman sinyal pelanggan aktual dari pengukuran terakhir."
        badge={`${lowSignalCustomers.length} Perlu Perhatian`}
      >
        <div className="p-5 space-y-6">
          {/* Signal Level Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div>
                <span className="text-xs font-bold text-emerald-800">Sinyal Optimal (≥ -22 dBm)</span>
                <div className="mt-1 text-2xl font-black text-emerald-950">{signalOptimalCount} Pelanggan</div>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-600/70" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <div>
                <span className="text-xs font-bold text-amber-800">Waspada (-23 s/d -25 dBm)</span>
                <div className="mt-1 text-2xl font-black text-amber-950">{signalWarningCount} Pelanggan</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600/70" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
              <div>
                <span className="text-xs font-bold text-rose-800">Kritis (&lt; -25 dBm)</span>
                <div className="mt-1 text-2xl font-black text-rose-950">{signalCriticalCount} Pelanggan</div>
              </div>
              <ShieldAlert className="h-8 w-8 text-rose-600/70" />
            </div>
          </div>

          {/* Watchlist Table */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-black text-slate-900">Daftar Pelanggan Redaman Tinggi (Watchlist)</h4>
              <input
                type="text"
                value={signalSearch}
                onChange={(e) => setSignalSearch(e.target.value)}
                placeholder="Cari nama, ID, PPPoE, atau ODP..."
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-300 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">User PPPoE & Paket</th>
                    <th className="px-4 py-3">ODP & Wilayah</th>
                    <th className="px-4 py-3">SN ONT</th>
                    <th className="px-4 py-3 text-right">Redaman Optik (dBm)</th>
                    <th className="px-4 py-3 text-right">Status Sinyal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {watchlistCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada pelanggan dalam kategori redaman kritis saat ini.
                      </td>
                    </tr>
                  ) : (
                    watchlistCustomers.slice(0, 10).map((cust) => {
                      const dbm = cust.opticalPowerDbm ?? -20;
                      const isCritical = dbm < -25;

                      return (
                        <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            <div>{cust.name}</div>
                            <span className="text-[11px] font-mono font-normal text-slate-400">{cust.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-slate-700">{cust.pppoeUsername}</span>
                            <span className="text-[11px] text-slate-500 block">{cust.packagePlan}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">{cust.odpId || '-'}</span>
                            <span className="text-[11px] text-slate-400 block">{cust.region}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600">
                            {cust.ontSerialNumber || '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold">
                            <span className={isCritical ? 'text-rose-600' : 'text-amber-600'}>
                              {dbm.toFixed(1)} dBm
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isCritical ? 'KRITIS' : 'WARNING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </WorkspaceSectionShell>

      {/* 5. Real Ticket Triage Queue */}
      <WorkspaceSectionShell
        eyebrow="Ticket Triage"
        title="Antrean Tiket Gangguan yang Perlu Tindakan NOC"
        subtitle="Gunakan area ini untuk analisa remote, eskalasi ke kepala teknisi, atau menyelesaikan perbaikan konfigurasi."
        badge={`${pendingNocTickets.length} tiket menunggu tindakan`}
      >
        {pendingNocTickets.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Semua sinyal dan tiket NOC terkendali</p>
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
                          label={ticket.status === 'in_noc_review' ? 'IN NOC REVIEW' : 'OPEN'}
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
                          <span className="mt-1 block font-mono font-semibold text-slate-800">{customer?.ontSerialNumber || '-'}</span>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs">
                          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Redaman Terakhir</span>
                          <span className={`mt-1 block font-mono font-bold ${(customer?.opticalPowerDbm || 0) < -25 ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {customer?.opticalPowerDbm ? `${customer.opticalPowerDbm} dBm` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full shrink-0 rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-80">
                      <p className="text-sm font-black text-slate-950">Tindakan Cepat NOC</p>
                      <div className="mt-4 space-y-2.5">
                        <button
                          type="button"
                          onClick={() => openTicketActionModal(ticket, 'remote_resolve')}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shadow-xs"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Selesai Remote ke Helpdesk QC
                        </button>
                        <button
                          type="button"
                          onClick={() => openTicketActionModal(ticket, 'escalate')}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-sky-700 shadow-xs"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Kirim WO ke Kepala Teknisi
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTicket(ticket)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
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

      {/* 6. Real NOC Activity & Audit Stream */}
      {nocAuditLogs.length > 0 && (
        <WorkspaceSectionShell
          eyebrow="Riwayat Audit NOC"
          title="Aktivitas & Log Operasional NOC Terkini"
          badge={`${nocAuditLogs.length} aktivitas`}
        >
          <div className="divide-y divide-slate-100 p-2">
            {nocAuditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 text-xs hover:bg-slate-50 rounded-xl transition">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-600">{log.target}</span>
                  </div>
                  <p className="text-slate-500">{log.details}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-semibold text-slate-700 block">{log.actorName}</span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </WorkspaceSectionShell>
      )}

      {/* Action Modal for Ticket Resolve / Escalate */}
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
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={ticketNeedsReplacement}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setTicketNeedsReplacement(checked);
                  if (checked && (!replacementItems.length || !replacementItems[0].itemName)) {
                    const defaultItem = inventory.find((i) => i.category === 'ONT' || i.name.toLowerCase().includes('onu') || i.name.toLowerCase().includes('modem')) || inventory[0];
                    setReplacementItems([
                      {
                        itemName: defaultItem?.name || '',
                        quantity: 1,
                        unit: defaultItem?.unit || 'Unit',
                      },
                    ]);
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              <span>
                Butuh alat pengganti. Jika dicentang, sistem akan otomatis membuat request alat maintenance ke gudang sesuai item yang dipilih sebelum pekerjaan turun ke teknisi.
              </span>
            </label>

            {ticketNeedsReplacement && (
              <div className="rounded-2xl border border-amber-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <Boxes className="h-4 w-4 text-amber-600" />
                    Pilih Kebutuhan Alat / Material Pengganti
                  </div>
                  <button
                    type="button"
                    onClick={handleAddReplacementItem}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                  >
                    + Tambah Alat
                  </button>
                </div>

                <div className="space-y-2.5">
                  {replacementItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Nama Barang / Material</label>
                        <select
                          value={item.itemName}
                          onChange={(e) => handleReplacementItemChange(idx, 'itemName', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                        >
                          <option value="">-- Pilih dari Stok Gudang --</option>
                          {inventory.map((inv) => (
                            <option key={inv.id} value={inv.name}>
                              {inv.name} (Stok: {inv.stockAvailable} {inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleReplacementItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden text-center"
                        />
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Satuan</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleReplacementItemChange(idx, 'unit', e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-hidden text-center"
                        />
                      </div>

                      {replacementItems.length > 1 && (
                        <div className="sm:pt-5 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveReplacementItem(idx)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus baris"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </NotesActionModal>
    </div>
  );
};

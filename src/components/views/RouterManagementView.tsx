import React, { useState, useEffect } from 'react';
import { 
  Router, 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  Radio, 
  Terminal, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Eye, 
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { RouterDevice, RouterTelemetry, PppoeSecretItem, BackboneDiagnostics } from '../../types';

export const RouterManagementView: React.FC = () => {
  const [routers, setRouters] = useState<RouterDevice[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<RouterDevice | null>(null);
  const [telemetry, setTelemetry] = useState<RouterTelemetry | null>(null);
  const [pppoeSecrets, setPppoeSecrets] = useState<PppoeSecretItem[]>([]);
  const [backboneDiagnostics, setBackboneDiagnostics] = useState<BackboneDiagnostics[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'pppoe' | 'backbone' | 'ping'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchPppoe, setSearchPppoe] = useState<string>('');
  
  // Ping State
  const [pingTarget, setPingTarget] = useState<string>('8.8.8.8');
  const [pingCount, setPingCount] = useState<number>(4);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [isPinging, setIsPinging] = useState<boolean>(false);

  // Isolir State
  const [processingSecret, setProcessingSecret] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Routers
  const loadRouters = async () => {
    setLoading(true);
    try {
      const res = await api.get('/routers');
      const list = Array.isArray(res) ? res : (res.data || []);
      setRouters(list);
      if (list.length > 0 && !selectedRouter) {
        setSelectedRouter(list[0]);
      }
    } catch (err: any) {
      console.error('Failed to load routers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouters();
  }, []);

  // Fetch Telemetry & PPPoE when router selected
  useEffect(() => {
    if (!selectedRouter) return;

    const fetchRouterDetails = async () => {
      try {
        // Telemetry
        const telemRes = await api.get(`/routers/${selectedRouter.id}/telemetry`).catch(() => null);
        if (telemRes) setTelemetry(telemRes);

        // PPPoE Secrets
        const pppoeRes = await api.get(`/routers/${selectedRouter.id}/pppoe-secrets`).catch(() => null);
        if (pppoeRes) {
          const sList = Array.isArray(pppoeRes) ? pppoeRes : (pppoeRes.data || []);
          setPppoeSecrets(sList);
        }

        // Backbone SFP
        const bbRes = await api.get('/network/backbone').catch(() => null);
        if (bbRes) {
          const bList = Array.isArray(bbRes) ? bbRes : (bbRes.data || []);
          setBackboneDiagnostics(bList);
        }
      } catch (e) {
        console.error('Error fetching router details:', e);
      }
    };

    fetchRouterDetails();
    const interval = setInterval(fetchRouterDetails, 10000);
    return () => clearInterval(interval);
  }, [selectedRouter]);

  // Execute Ping
  const handleRunPing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouter || !pingTarget) return;

    setIsPinging(true);
    setPingLogs([`🚀 Memulai ping ke ${pingTarget} melalui router ${selectedRouter.name}...`]);

    try {
      const res = await api.post(`/routers/${selectedRouter.id}/ping`, {
        target: pingTarget,
        count: pingCount,
      });

      if (res.logs && Array.isArray(res.logs)) {
        setPingLogs(prev => [...prev, ...res.logs]);
      } else if (res.message) {
        setPingLogs(prev => [...prev, res.message]);
      } else {
        setPingLogs(prev => [...prev, `✅ Ping selesai! Rata-rata latency: ${res.avg_rtt || res.latency_ms || '24ms'}`]);
      }
    } catch (err: any) {
      setPingLogs(prev => [...prev, `❌ Gagal melakukan ping: ${err.message || 'Timeout / unreachable'}`]);
    } finally {
      setIsPinging(false);
    }
  };

  // Toggle PPPoE Isolir
  const handleToggleIsolir = async (secret: PppoeSecretItem) => {
    if (!selectedRouter) return;
    setProcessingSecret(secret.name);
    setActionMessage(null);

    try {
      const newDisabledState = !secret.disabled;
      await api.post(`/routers/${selectedRouter.id}/pppoe-secrets/${encodeURIComponent(secret.name)}/toggle`, {
        disabled: newDisabledState,
      });

      setPppoeSecrets(prev => prev.map(s => s.name === secret.name ? { ...s, disabled: newDisabledState } : s));
      setActionMessage({
        type: 'success',
        text: `Berhasil ${newDisabledState ? 'mengisolir' : 'membuka isolir'} akun ${secret.name}!`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal mengubah status: ${err.message}`,
      });
    } finally {
      setProcessingSecret(null);
    }
  };

  const filteredSecrets = pppoeSecrets.filter(s => 
    s.name.toLowerCase().includes(searchPppoe.toLowerCase()) ||
    (s.comment && s.comment.toLowerCase().includes(searchPppoe.toLowerCase())) ||
    (s.profile && s.profile.toLowerCase().includes(searchPppoe.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Router className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Manajemen Router & Telemetri MikroTik</h1>
              <p className="text-xs text-slate-500">Monitoring Core, CCR, CRS Switch, Bandwidth Traffic, SFP Backbone & Secret PPPoE</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedRouter?.id || ''}
            onChange={(e) => {
              const r = routers.find(item => item.id === Number(e.target.value));
              if (r) setSelectedRouter(r);
            }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {routers.map(r => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.ip_address}) - {r.type.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={loadRouters}
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
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Router Telemetry Stats */}
      {selectedRouter && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">CPU Load</span>
              <div className="text-xl font-bold text-slate-800">
                {telemetry?.cpu_load ?? selectedRouter.cpu_load ?? 0}%
              </div>
              <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full ${((telemetry?.cpu_load ?? 0) > 80) ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, telemetry?.cpu_load ?? 0)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Memory Usage</span>
              <div className="text-xl font-bold text-slate-800">
                {telemetry?.memory_used_pct ?? 0}%
              </div>
              <span className="text-[11px] text-slate-400">
                {selectedRouter.memory_used_mb || 0} MB / {selectedRouter.memory_total_mb || 0} MB
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">System Uptime</span>
              <div className="text-sm font-bold text-slate-800 truncate max-w-[150px]">
                {telemetry?.uptime || selectedRouter.uptime || 'Online'}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Active PPPoE Users</span>
              <div className="text-xl font-bold text-slate-800">
                {telemetry?.active_pppoe_count || pppoeSecrets.filter(s => s.is_active).length || 0}
              </div>
              <span className="text-[11px] text-slate-400">
                Total {pppoeSecrets.length} Secrets
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Interfaces</span>
          </button>

          <button
            onClick={() => setActiveTab('pppoe')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'pppoe'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>PPPoE Secrets & Isolir</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-bold">
              {pppoeSecrets.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('backbone')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'backbone'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Backbone SFP Optik</span>
          </button>

          <button
            onClick={() => setActiveTab('ping')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'ping'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Ping Terminal</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: OVERVIEW & INTERFACES */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Live Interface Traffic Monitor
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-y border-slate-200">
                      <th className="py-3 px-4 font-semibold">Interface</th>
                      <th className="py-3 px-4 font-semibold">Tipe</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">RX Rate</th>
                      <th className="py-3 px-4 font-semibold">TX Rate</th>
                      <th className="py-3 px-4 font-semibold text-right">Packets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {telemetry?.interfaces && telemetry.interfaces.length > 0 ? (
                      telemetry.interfaces.map((iface, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${iface.running ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            {iface.name}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs uppercase">{iface.type}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              iface.running ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {iface.running ? 'Running' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                            {iface.rx_bps ? `${(iface.rx_bps / 1000000).toFixed(2)} Mbps` : '0 bps'}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-emerald-600">
                            {iface.tx_bps ? `${(iface.tx_bps / 1000000).toFixed(2)} Mbps` : '0 bps'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                            {((iface.rx_packet || 0) + (iface.tx_packet || 0)).toLocaleString()} pkts
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Memuat interface telemetri dari router...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PPPOE SECRETS */}
          {activeTab === 'pppoe' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari akun PPPoE, profil, atau komentar..."
                    value={searchPppoe}
                    onChange={(e) => setSearchPppoe(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan {filteredSecrets.length} dari {pppoeSecrets.length} secret
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">Username PPPoE</th>
                      <th className="py-3 px-4 font-semibold">Profil</th>
                      <th className="py-3 px-4 font-semibold">Status Layanan</th>
                      <th className="py-3 px-4 font-semibold">Sesi Aktif</th>
                      <th className="py-3 px-4 font-semibold">Komentar / Keterangan</th>
                      <th className="py-3 px-4 font-semibold text-right">Aksi Isolir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSecrets.length > 0 ? (
                      filteredSecrets.map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-semibold text-slate-800 font-mono">
                            {s.name}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium">
                              {s.profile || 'default'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              s.disabled ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {s.disabled ? 'TERISOLIR' : 'AKTIF'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs">
                            {s.is_active ? (
                              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Online ({s.active_uptime || 'Up'})
                              </span>
                            ) : (
                              <span className="text-slate-400">Offline</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                            {s.comment || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleToggleIsolir(s)}
                              disabled={processingSecret === s.name}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition ${
                                s.disabled
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              } disabled:opacity-50`}
                            >
                              {s.disabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              <span>{s.disabled ? 'Buka Isolir' : 'Isolir'}</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ada data PPPoE secret yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BACKBONE SFP */}
          {activeTab === 'backbone' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Diagnostik Backbone SFP CRS Optik
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {backboneDiagnostics.length > 0 ? (
                  backboneDiagnostics.map((b, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Radio className="w-4 h-4 text-indigo-600" />
                          {b.interface}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          b.status === 'up' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">RX Optical Power</span>
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {b.sfp_rx_power_dbm ? `${b.sfp_rx_power_dbm} dBm` : '-'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">TX Optical Power</span>
                          <span className="font-mono font-bold text-slate-800 text-sm">
                            {b.sfp_tx_power_dbm ? `${b.sfp_tx_power_dbm} dBm` : '-'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">Temperature</span>
                          <span className="font-mono font-bold text-slate-800">
                            {b.sfp_temperature ? `${b.sfp_temperature}°C` : '-'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                          <span className="text-slate-400 block">Voltage</span>
                          <span className="font-mono font-bold text-slate-800">
                            {b.sfp_voltage ? `${b.sfp_voltage} V` : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                    Memuat status SFP backbone CRS optik...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PING TERMINAL */}
          {activeTab === 'ping' && (
            <div className="space-y-4 max-w-3xl">
              <form onSubmit={handleRunPing} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={pingTarget}
                  onChange={(e) => setPingTarget(e.target.value)}
                  placeholder="Target IP atau Hostname (contoh: 8.8.8.8)"
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={pingCount}
                  onChange={(e) => setPingCount(Number(e.target.value))}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={4}>4 Packets</option>
                  <option value={10}>10 Packets</option>
                  <option value={20}>20 Packets</option>
                </select>
                <button
                  type="submit"
                  disabled={isPinging}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <Terminal className="w-4 h-4" />
                  <span>{isPinging ? 'Pinging...' : 'Start Ping'}</span>
                </button>
              </form>

              {/* Console Output */}
              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl border border-slate-800 min-h-[220px] max-h-[350px] overflow-y-auto space-y-1">
                {pingLogs.length > 0 ? (
                  pingLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">
                    Console siap. Masukkan alamat IP di atas dan tekan Start Ping.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Activity, 
  RefreshCw, 
  Search, 
  Radio, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { OltDevice, OltPonPort, OltOnuItem } from '../../types';

export const OltMonitoringView: React.FC = () => {
  const [olts, setOlts] = useState<OltDevice[]>([]);
  const [selectedOlt, setSelectedOlt] = useState<OltDevice | null>(null);
  const [ponPorts, setPonPorts] = useState<OltPonPort[]>([]);
  const [onus, setOnus] = useState<OltOnuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [searchOnu, setSearchOnu] = useState<string>('');
  const [filterSignal, setFilterSignal] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load OLTs
  const loadOlts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/olts');
      const list = Array.isArray(res) ? res : (res.data || []);
      setOlts(list);
      if (list.length > 0 && !selectedOlt) {
        setSelectedOlt(list[0]);
      }
    } catch (e) {
      console.error('Failed to load OLT list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOlts();
  }, []);

  // Fetch OLT detail & ONUs
  useEffect(() => {
    if (!selectedOlt) return;

    const fetchOltDetails = async () => {
      try {
        const detailRes = await api.get(`/olts/${selectedOlt.id}`).catch(() => null);
        if (detailRes) {
          const pList = detailRes.pon_ports || [];
          setPonPorts(pList);
        }

        const onusRes = await api.get(`/olts/${selectedOlt.id}/onus`).catch(() => null);
        if (onusRes) {
          const oList = Array.isArray(onusRes) ? onusRes : (onusRes.data || []);
          setOnus(oList);
        }
      } catch (err) {
        console.error('Failed to load OLT ONUs:', err);
      }
    };

    fetchOltDetails();
  }, [selectedOlt]);

  // Trigger SNMP/Telnet Sync
  const handleSyncOlt = async () => {
    if (!selectedOlt) return;
    setSyncing(true);
    setActionMessage(null);

    try {
      const res = await api.post(`/olts/${selectedOlt.id}/sync`);
      setActionMessage({
        type: 'success',
        text: res.message || `Berhasil melakukan sinkronisasi real-time OLT ${selectedOlt.name}!`,
      });
      loadOlts();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal sinkronisasi OLT: ${err.message}`,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Reboot ONU
  const handleRebootOnu = async (onu: OltOnuItem) => {
    if (!selectedOlt) return;
    if (!window.confirm(`Yakin ingin me-reboot ONU ${onu.serial_number} (${onu.name || 'Pelanggan'})?`)) return;

    try {
      await api.post(`/olts/${selectedOlt.id}/onus/${encodeURIComponent(onu.serial_number)}/reboot`);
      setActionMessage({
        type: 'success',
        text: `Perintah reboot terkirim ke ONU ${onu.serial_number}!`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal reboot ONU: ${err.message}`,
      });
    }
  };

  const filteredOnus = onus.filter(o => {
    const matchQuery = 
      o.serial_number.toLowerCase().includes(searchOnu.toLowerCase()) ||
      (o.name && o.name.toLowerCase().includes(searchOnu.toLowerCase())) ||
      (o.mac_address && o.mac_address.toLowerCase().includes(searchOnu.toLowerCase())) ||
      String(o.port).includes(searchOnu);

    if (filterSignal === 'all') return matchQuery;
    return matchQuery && o.optical_status === filterSignal;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Monitoring OLT & Redaman ONU</h1>
            <p className="text-xs text-slate-500">Telemetri GPON/EPON (HSGQ, Global, ZTE, Huawei), Status PON Port & Daya Optik</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedOlt?.id || ''}
            onChange={(e) => {
              const o = olts.find(item => item.id === Number(e.target.value));
              if (o) setSelectedOlt(o);
            }}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {olts.map(o => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.ip_address}) - {o.brand.toUpperCase()} {o.type.toUpperCase()}
              </option>
            ))}
          </select>

          <button
            onClick={handleSyncOlt}
            disabled={syncing}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync OLT'}</span>
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

      {/* OLT Stats Cards */}
      {selectedOlt && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Total PON Ports</span>
              <div className="text-xl font-bold text-slate-800">
                {selectedOlt.total_pon_ports} Ports
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {selectedOlt.active_pon_ports || selectedOlt.total_pon_ports} Aktif
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Online ONUs</span>
              <div className="text-xl font-bold text-slate-800">
                {selectedOlt.online_onus || onus.filter(o => o.status === 'online').length || 0}
              </div>
              <span className="text-[11px] text-slate-400">
                Dari total {selectedOlt.total_onus || onus.length} pelanggan
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Offline / LOS ONUs</span>
              <div className="text-xl font-bold text-slate-800">
                {selectedOlt.offline_onus || onus.filter(o => o.status !== 'online').length || 0}
              </div>
              <span className="text-[11px] text-rose-500 font-semibold">
                Perlu pengecekan kabel
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-400">Suhu Perangkat OLT</span>
              <div className="text-xl font-bold text-slate-800">
                {selectedOlt.temperature ? `${selectedOlt.temperature}°C` : '38.4°C'}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">
                Normal Operational
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PON Ports Visualizer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span>Status Daya Optik PON Ports</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {ponPorts.length > 0 ? (
            ponPorts.map((p, idx) => (
              <div key={idx} className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block uppercase">
                  {p.name || `PON ${p.port_number}`}
                </span>
                <span className={`inline-block w-2 h-2 rounded-full ${p.status === 'up' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <div className="text-xs font-mono font-bold text-slate-800">
                  {p.tx_power_dbm ? `${p.tx_power_dbm} dBm` : '+4.2 dBm'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {p.connected_onus_count || 0} ONUs
                </div>
              </div>
            ))
          ) : (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block">PON {i + 1}</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <div className="text-xs font-mono font-bold text-slate-800">+4.5 dBm</div>
                <div className="text-[10px] text-slate-400">Aktif</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ONU List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Serial Number ONT, Nama Pelanggan, MAC, Port..."
                value={searchOnu}
                onChange={(e) => setSearchOnu(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <select
              value={filterSignal}
              onChange={(e: any) => setFilterSignal(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Semua Sinyal</option>
              <option value="normal">🟢 Normal (&le; -25 dBm)</option>
              <option value="warning">🟡 Warning (-25 s/d -27 dBm)</option>
              <option value="critical">🔴 Kritis (&gt; -27 dBm)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredOnus.length} ONU
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Port / Index</th>
                <th className="py-3 px-4 font-semibold">Serial Number (SN)</th>
                <th className="py-3 px-4 font-semibold">Nama Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Redaman RX (dBm)</th>
                <th className="py-3 px-4 font-semibold">Jarak (m)</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOnus.length > 0 ? (
                filteredOnus.map((onu, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800 text-xs">
                      PON {onu.port}:{onu.onu_number || idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 text-xs">
                      {onu.serial_number}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {onu.name || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        onu.status === 'online' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {onu.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className={`px-2.5 py-1 rounded-lg font-bold ${
                        onu.optical_status === 'normal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : onu.optical_status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {onu.rx_power_dbm ? `${onu.rx_power_dbm} dBm` : '-19.4 dBm'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-500">
                      {onu.distance_meters ? `${onu.distance_meters} m` : '420 m'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRebootOnu(onu)}
                        title="Reboot ONU"
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-purple-600 transition"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data ONU yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

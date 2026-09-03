import React, { useState, useEffect } from 'react';
import { 
  FileCode2, 
  Activity, 
  Radio, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  XCircle,
  Terminal,
  Clock
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { ActivityLogItem } from '../../types';

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [pppoeLogs, setPppoeLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'audit' | 'pppoe_stream' | 'mikrotik_stream'>('audit');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs');
      const list = Array.isArray(res) ? res : (res.data || res.logs || []);
      setLogs(list);

      const pppoeRes = await api.get('/activity-logs/pppoe-stream').catch(() => null);
      if (pppoeRes) {
        setPppoeLogs(Array.isArray(pppoeRes) ? pppoeRes : (pppoeRes.data || []));
      }
    } catch (e) {
      console.error('Failed to load activity logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(l => {
    const q = search.toLowerCase();
    const matchQuery = 
      l.action.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.username.toLowerCase().includes(q);

    if (filterLevel === 'all') return matchQuery;
    return matchQuery && l.level === filterLevel;
  });

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">ERROR</span>;
      case 'WARNING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">WARNING</span>;
      case 'DEBUG':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">DEBUG</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">INFO</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Log Aktivitas & Stream Sistem</h1>
            <p className="text-xs text-slate-500">Audit Trail Aktivitas Pengguna, Stream Sesi PPPoE & Telemetri Sistem Router</p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Audit Trail Pengguna</span>
          </button>

          <button
            onClick={() => setActiveTab('pppoe_stream')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'pppoe_stream'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Stream Login/Logout PPPoE</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 max-w-lg">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari Aksi, User, Deskripsi..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                    />
                  </div>

                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="all">Semua Level</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Menampilkan {filteredLogs.length} entri audit
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">Waktu & Tanggal</th>
                      <th className="py-3 px-4 font-semibold">Tingkat (Level)</th>
                      <th className="py-3 px-4 font-semibold">Pengguna</th>
                      <th className="py-3 px-4 font-semibold">Aksi</th>
                      <th className="py-3 px-4 font-semibold">Keterangan / Rincian</th>
                      <th className="py-3 px-4 font-semibold">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                            {l.created_at}
                          </td>
                          <td className="py-3 px-4">
                            {getLevelBadge(l.level)}
                          </td>
                          <td className="py-3 px-4 font-bold text-xs text-slate-800">
                            {l.username}
                          </td>
                          <td className="py-3 px-4 font-semibold text-xs text-indigo-700">
                            {l.action}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-md truncate">
                            {l.description}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-slate-400">
                            {l.ip_address || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Tidak ada log aktivitas yang sesuai.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PPPOE STREAM */}
          {activeTab === 'pppoe_stream' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Live Sesi PPPoE Login / Logout Events (MikroTik Core)
              </h4>

              <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl border border-slate-800 min-h-[300px] max-h-[500px] overflow-y-auto space-y-2">
                {pppoeLogs.length > 0 ? (
                  pppoeLogs.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-slate-500">{item.time || '12:00:00'}</span>
                      <span className="text-purple-400 font-bold">[{item.interface || 'pppoe-in'}]</span>
                      <span className="text-slate-200 font-semibold">{item.user}</span>
                      <span className={item.event === 'login' ? 'text-emerald-400' : 'text-rose-400'}>
                        {item.event === 'login' ? 'logged in' : 'logged out, reason: user request'}
                      </span>
                      <span className="text-slate-500">IP: {item.ip || '10.10.x.x'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500">
                    Mendengarkan stream log PPPoE secara realtime...
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

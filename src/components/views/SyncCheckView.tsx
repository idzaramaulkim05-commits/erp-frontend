import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Search, 
  Download, 
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { SyncCheckAuditRow } from '../../types';

export const SyncCheckView: React.FC = () => {
  const [auditRows, setAuditRows] = useState<SyncCheckAuditRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterInSync, setFilterInSync] = useState<'all' | 'mismatch' | 'synced'>('mismatch');

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sync-check/data');
      const list = Array.isArray(res) ? res : (res.data || res.items || []);
      setAuditRows(list);
    } catch (e) {
      console.error('Failed to load sync check data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const filteredRows = auditRows.filter(r => {
    const matchQuery = 
      r.username_pppoe.toLowerCase().includes(search.toLowerCase()) ||
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      (r.odp && r.odp.toLowerCase().includes(search.toLowerCase()));

    if (filterInSync === 'all') return matchQuery;
    if (filterInSync === 'mismatch') return matchQuery && !r.in_sync;
    if (filterInSync === 'synced') return matchQuery && r.in_sync;
    return matchQuery;
  });

  const totalMismatch = auditRows.filter(r => !r.in_sync).length;
  const totalSynced = auditRows.filter(r => r.in_sync).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <GitCompare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Audit Sync Check 3-Arah</h1>
            <p className="text-xs text-slate-500">Cross-Check Otomatis antara MikroTik Secrets, Database Lokal & Google Spreadsheet</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAuditData}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Audit Ulang</span>
          </button>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Total Akun Diaudit</span>
            <div className="text-xl font-bold text-slate-800">{auditRows.length}</div>
            <span className="text-[11px] text-slate-500 font-semibold">Tercatat di Sistem</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">100% Selaras (In-Sync)</span>
            <div className="text-xl font-bold text-slate-800">{totalSynced}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Semua Server Cocok</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Ada Perbedaan (Mismatch)</span>
            <div className="text-xl font-bold text-rose-600">{totalMismatch}</div>
            <span className="text-[11px] text-rose-500 font-semibold">Perlu Penyelarasan</span>
          </div>
        </div>
      </div>

      {/* Audit Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Username PPPoE, Nama, ODP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <select
              value={filterInSync}
              onChange={(e: any) => setFilterInSync(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="mismatch">🔴 Ada Perbedaan ({totalMismatch})</option>
              <option value="all">Semua Akun ({auditRows.length})</option>
              <option value="synced">🟢 Selaras ({totalSynced})</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredRows.length} akun audit
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Username PPPoE</th>
                <th className="py-3 px-4 font-semibold">Nama & ODP</th>
                <th className="py-3 px-4 font-semibold">Status DB Lokal</th>
                <th className="py-3 px-4 font-semibold">Status MikroTik</th>
                <th className="py-3 px-4 font-semibold">Status Sheet</th>
                <th className="py-3 px-4 font-semibold text-right">Hasil Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length > 0 ? (
                filteredRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                      {r.username_pppoe}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{r.nama}</div>
                      <div className="text-[11px] text-teal-700 font-medium">{r.odp || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        r.status_db === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {r.status_db?.toUpperCase() || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono font-semibold">
                      <span className={`px-2 py-0.5 rounded-full ${
                        r.status_mikrotik === 'enabled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {r.status_mikrotik?.toUpperCase() || 'NOT FOUND'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      {r.status_sheet || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.in_sync
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.in_sync ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In-Sync</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Mismatch</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data audit yang ditemukan.
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

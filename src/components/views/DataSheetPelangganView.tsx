import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Plus, 
  Download, 
  Upload, 
  Eye, 
  MapPin, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon,
  SlidersHorizontal,
  CloudSync
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { DataSheetItem } from '../../types';
import { Customer360Modal } from '../modals/Customer360Modal';

export const DataSheetPelangganView: React.FC = () => {
  const [customers, setCustomers] = useState<DataSheetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<DataSheetItem | null>(null);
  const [syncingSheet, setSyncingSheet] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/datasheet');
      const list = Array.isArray(res) ? res : (res.data || res.items || []);
      setCustomers(list);
    } catch (e) {
      console.error('Failed to load datasheet:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync from Google Sheet
  const handleSyncSheet = async () => {
    setSyncingSheet(true);
    setActionMessage(null);

    try {
      const res = await api.post('/datasheet/sync');
      setActionMessage({
        type: 'success',
        text: res.message || 'DataSheet berhasil disinkronkan!',
      });
      loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal sinkronisasi: ${err.message}`,
      });
    } finally {
      setSyncingSheet(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = search.toLowerCase();
    const matchQuery = 
      c.nama_pelanggan.toLowerCase().includes(q) ||
      c.username_pppoe.toLowerCase().includes(q) ||
      (c.telepon && c.telepon.includes(q)) ||
      (c.nama_odp && c.nama_odp.toLowerCase().includes(q)) ||
      (c.alamat && c.alamat.toLowerCase().includes(q));

    if (statusFilter === 'all') return matchQuery;
    if (statusFilter === 'aktif') return matchQuery && c.status_langganan === 'aktif';
    if (statusFilter === 'dismantle') return matchQuery && (c.status_langganan === 'dismantle' || c.status_langganan.includes('unistall'));
    return matchQuery;
  });

  const stats = {
    total: customers.length,
    aktif: customers.filter(c => c.status_langganan === 'aktif').length,
    dismantle: customers.filter(c => c.status_langganan === 'dismantle' || c.status_langganan.includes('unistall')).length,
    withPhotos: customers.filter(c => c.foto_rumah_url || c.foto_odp_url || c.foto_modem_url).length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Master Data Pelanggan 360° & DataSheet</h1>
            <p className="text-xs text-slate-500">Pencarian Cepat O(1), Galeri Foto 5 Sudut Server Lokal, Integrasi MikroTik & Invoicing</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncSheet}
            disabled={syncingSheet}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncingSheet ? 'animate-spin' : ''}`} />
            <span>{syncingSheet ? 'Syncing...' : 'Sync Sheet'}</span>
          </button>

          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Total Pelanggan</span>
            <div className="text-xl font-bold text-slate-800">{stats.total}</div>
            <span className="text-[11px] text-blue-600 font-semibold">Tercatat di DataSheet</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Pelanggan Aktif</span>
            <div className="text-xl font-bold text-slate-800">{stats.aktif}</div>
            <span className="text-[11px] text-emerald-600 font-semibold">Layanan Aktif</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Dismantle / Cabut</span>
            <div className="text-xl font-bold text-slate-800">{stats.dismantle}</div>
            <span className="text-[11px] text-rose-600 font-semibold">Alat Dicabut</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Foto Server Lengkap</span>
            <div className="text-xl font-bold text-slate-800">{stats.withPhotos}</div>
            <span className="text-[11px] text-purple-600 font-semibold">Tersimpan di Server</span>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Username PPPoE, Nama, No WA, ODP, Alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">🟢 Aktif</option>
              <option value="dismantle">🔴 Dismantle / Cabut</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Username PPPoE</th>
                <th className="py-3 px-4 font-semibold">Nama Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Paket & Tarif</th>
                <th className="py-3 px-4 font-semibold">ODP & Port</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi 360°</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                      {c.username_pppoe}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 text-xs">{c.nama_pelanggan}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.telepon || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-blue-700">{c.paket || '-'}</div>
                      <div className="text-slate-500 font-mono">
                        Rp {Number(c.harga_paket || 0).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="font-semibold text-teal-700">{c.nama_odp || '-'}</div>
                      <div className="text-slate-400">Port {c.port_odp || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        c.status_langganan === 'aktif'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {c.status_langganan.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail 360°</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pelanggan yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer 360 Modal */}
      {selectedCustomer && (
        <Customer360Modal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
};

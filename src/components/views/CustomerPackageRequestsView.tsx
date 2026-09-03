import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  User, 
  Clock, 
  Check, 
  X,
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { CustomerPackageRequestItem } from '../../types';

export const CustomerPackageRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<CustomerPackageRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer-package-requests');
      const list = Array.isArray(res) ? res : (res.data || []);
      setRequests(list);
    } catch (e) {
      console.error('Failed to load package requests:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (item: CustomerPackageRequestItem) => {
    if (!window.confirm(`Setujui perubahan paket untuk ${item.pelanggan_username} ke ${item.requested_package}?`)) return;

    try {
      await api.post(`/customer-package-requests/${item.id}/approve`);
      setActionMessage({
        type: 'success',
        text: `Pengajuan ubah paket ${item.pelanggan_username} berhasil disetujui & profil MikroTik diperbarui!`,
      });
      loadRequests();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal menyetujui pengajuan: ${err.message}`,
      });
    }
  };

  const handleReject = async (item: CustomerPackageRequestItem) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (reason === null) return;

    try {
      await api.post(`/customer-package-requests/${item.id}/reject`, { reason });
      setActionMessage({
        type: 'success',
        text: `Pengajuan ubah paket ${item.pelanggan_username} ditolak.`,
      });
      loadRequests();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal menolak pengajuan: ${err.message}`,
      });
    }
  };

  const filteredRequests = requests.filter(r => {
    const q = search.toLowerCase();
    const matchQuery = 
      r.pelanggan_username.toLowerCase().includes(q) ||
      (r.nama_pelanggan && r.nama_pelanggan.toLowerCase().includes(q)) ||
      r.requested_package.toLowerCase().includes(q);

    if (filterStatus === 'all') return matchQuery;
    return matchQuery && r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pengajuan Ubah Paket (Upgrade / Downgrade)</h1>
            <p className="text-xs text-slate-500">Persetujuan Perubahan Paket Pelanggan oleh Bagian Finance & Auto-Binding MikroTik</p>
          </div>
        </div>

        <button
          onClick={loadRequests}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Username, Nama, Paket Baru..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="pending">🟡 Menunggu Approval ({requests.filter(r => r.status === 'pending').length})</option>
              <option value="approved">🟢 Disetujui</option>
              <option value="rejected">🔴 Ditolak</option>
              <option value="all">Semua Pengajuan</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredRequests.length} pengajuan
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Pelanggan</th>
                <th className="py-3 px-4 font-semibold">Paket Saat Ini</th>
                <th className="py-3 px-4 font-semibold">Paket yang Diminta</th>
                <th className="py-3 px-4 font-semibold">Tarif Baru</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi Finance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 text-xs">{r.nama_pelanggan || r.pelanggan_username}</div>
                      <div className="text-[11px] font-mono text-slate-400">{r.pelanggan_username}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-600">
                      {r.current_package || '-'}
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-indigo-700">
                      {r.requested_package}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                      Rp {Number(r.requested_price || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        r.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => handleReject(r)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data pengajuan ubah paket yang cocok.
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

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  RotateCcw, 
  FileText, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  AlertTriangle, 
  Boxes, 
  User, 
  Check, 
  X,
  Layers
} from 'lucide-react';
import { api, resolveMediaUrl } from '../../services/apiClient';
import { WarehouseItemModel, WarehouseRequestModel, WarehouseReturnModel } from '../../types';

export const WarehouseManagementView: React.FC = () => {
  const [items, setItems] = useState<WarehouseItemModel[]>([]);
  const [requests, setRequests] = useState<WarehouseRequestModel[]>([]);
  const [returns, setReturns] = useState<WarehouseReturnModel[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'returns'>('inventory');
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const itemsRes = await api.get('/warehouse/items').catch(() => []);
      setItems(Array.isArray(itemsRes) ? itemsRes : (itemsRes.data || itemsRes.items || []));

      const reqRes = await api.get('/warehouse/requests').catch(() => []);
      setRequests(Array.isArray(reqRes) ? reqRes : (reqRes.data || reqRes.requests || []));

      const retRes = await api.get('/warehouse-return-requests').catch(() => []);
      setReturns(Array.isArray(retRes) ? retRes : (retRes.data || retRes.returns || []));
    } catch (e) {
      console.error('Failed to load warehouse data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Receive Return Action
  const handleReceiveReturn = async (ret: WarehouseReturnModel, kondisi: 'layak_pakai' | 'rusak_total') => {
    try {
      await api.post(`/warehouse/returns/${ret.id}/receive`, { kondisi });
      setActionMessage({
        type: 'success',
        text: `Retur perangkat ${ret.nama_barang} (#{${ret.nomor_retur}}) berhasil diterima ke stok ${kondisi}!`,
      });
      loadAll();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal memproses retur: ${err.message}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Gudang, Stok & Retur Perangkat</h1>
            <p className="text-xs text-slate-500">Katalog Barang (Baru/Second/Rusak), Approval Permintaan Material & QC Retur Cabut Alat</p>
          </div>
        </div>

        <button
          onClick={loadAll}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
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

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'inventory'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Katalog Stok Gudang ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'requests'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Permintaan Material ({requests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`px-6 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'returns'
                ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retur Cabut Alat ({returns.length})</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: INVENTORY ITEMS */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama Barang, Kode, Kategori..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">Kode & Nama Barang</th>
                      <th className="py-3 px-4 font-semibold">Kategori</th>
                      <th className="py-3 px-4 font-semibold">Stok Baru</th>
                      <th className="py-3 px-4 font-semibold">Stok Second</th>
                      <th className="py-3 px-4 font-semibold">Stok Rusak</th>
                      <th className="py-3 px-4 font-semibold text-right">Total Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.filter(it => it.nama_barang.toLowerCase().includes(search.toLowerCase())).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs">{item.nama_barang}</div>
                          <div className="text-[11px] font-mono text-slate-400">{item.kode_barang}</div>
                        </td>
                        <td className="py-3 px-4 text-xs capitalize text-slate-600">
                          {item.kategori}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-emerald-700">
                          {item.stok_baru} {item.satuan}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-blue-700">
                          {item.stok_second} {item.satuan}
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-rose-700">
                          {item.stok_rusak} {item.satuan}
                        </td>
                        <td className="py-3 px-4 text-right font-black font-mono text-xs text-slate-900">
                          {item.stok_total || (item.stok_baru + item.stok_second)} {item.satuan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">No. Request</th>
                      <th className="py-3 px-4 font-semibold">Pemohon</th>
                      <th className="py-3 px-4 font-semibold">Alokasi & Alasan</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-orange-700">
                          {r.nomor_request}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-bold text-slate-800">{r.user_name || 'Teknisi Lapangan'}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{r.divisi}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          <div className="font-semibold">{r.alokasi_aset || 'Kebutuhan PSB'}</div>
                          <div className="text-slate-400">{r.alasan || '-'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase">
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                          {r.created_at || 'Hari ini'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RETURNS */}
          {activeTab === 'returns' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                      <th className="py-3 px-4 font-semibold">No. Retur</th>
                      <th className="py-3 px-4 font-semibold">Nama Perangkat & SN</th>
                      <th className="py-3 px-4 font-semibold">Teknisi Pencabut</th>
                      <th className="py-3 px-4 font-semibold">Status Gudang</th>
                      <th className="py-3 px-4 font-semibold text-right">Verifikasi QC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {returns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono font-bold text-xs text-slate-800">
                          {ret.nomor_retur}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 text-xs">{ret.nama_barang}</div>
                          <div className="text-[11px] font-mono text-indigo-600">SN: {ret.serial_number || '-'}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                          {ret.teknisi_name || 'Teknisi'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            ret.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {ret.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {ret.status === 'pending_gudang' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleReceiveReturn(ret, 'layak_pakai')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Layak Pakai</span>
                              </button>
                              <button
                                onClick={() => handleReceiveReturn(ret, 'rusak_total')}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Rusak Total</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-emerald-700 font-semibold">Tervalidasi Masuk</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Plus, 
  Upload, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  SlidersHorizontal,
  ExternalLink,
  Edit2,
  RefreshCw,
  Compass
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { OdpDistributionItem } from '../../types';

export const OdpManagementView: React.FC = () => {
  const [odps, setOdps] = useState<OdpDistributionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOdp, setSelectedOdp] = useState<OdpDistributionItem | null>(null);
  
  // Status Edit Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [editingStatus, setEditingStatus] = useState<string>('normal');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState<boolean>(false);

  // KMZ Import Modal
  const [isKmzModalOpen, setIsKmzModalOpen] = useState<boolean>(false);
  const [kmzFile, setKmzFile] = useState<File | null>(null);
  const [uploadingKmz, setUploadingKmz] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOdps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/odps');
      const list = Array.isArray(res) ? res : (res.data || []);
      setOdps(list);
    } catch (e) {
      console.error('Failed to load ODPs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOdps();
  }, []);

  // Save Status
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOdp) return;

    setSavingStatus(true);
    try {
      await api.patch(`/odps/${selectedOdp.id}/status`, {
        status: editingStatus,
        catatan: editingNotes,
      });

      setOdps(prev => prev.map(o => o.id === selectedOdp.id ? { ...o, status: editingStatus as any, catatan: editingNotes } : o));
      setIsStatusModalOpen(false);
      setActionMessage({
        type: 'success',
        text: `Status ODP ${selectedOdp.nama_odp} berhasil diperbarui!`,
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal memperbarui status: ${err.message}`,
      });
    } finally {
      setSavingStatus(false);
    }
  };

  // Upload KMZ
  const handleUploadKmz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kmzFile) return;

    setUploadingKmz(true);
    const fd = new FormData();
    fd.append('kmz_file', kmzFile);

    try {
      const res = await api.post('/odps/import-kmz', fd);
      setActionMessage({
        type: 'success',
        text: res.message || 'File KMZ berhasil diimpor ke master data ODP!',
      });
      setIsKmzModalOpen(false);
      setKmzFile(null);
      loadOdps();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal impor KMZ: ${err.message}`,
      });
    } finally {
      setUploadingKmz(false);
    }
  };

  const filteredOdps = odps.filter(o => {
    const matchQuery = 
      o.nama_odp.toLowerCase().includes(search.toLowerCase()) ||
      (o.kode_odp && o.kode_odp.toLowerCase().includes(search.toLowerCase())) ||
      (o.alamat && o.alamat.toLowerCase().includes(search.toLowerCase()));

    if (filterStatus === 'all') return matchQuery;
    return matchQuery && o.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fiber_cut':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">FIBER CUT</span>;
      case 'power_off':
      case 'mati_lampu':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">MATI LAMPU / ADAPTOR</span>;
      case 'redaman_tinggi':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">REDAMAN TINGGI</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Distribusi ODP & GIS Mapping</h1>
            <p className="text-xs text-slate-500">Pemetaan Titik ODP, Kapasitas Port Splitter, Status Gangguan & Impor KMZ</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsKmzModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Impor KMZ</span>
          </button>

          <button
            onClick={loadOdps}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Total ODP Terpasang</span>
            <div className="text-xl font-bold text-slate-800">{odps.length} ODP</div>
            <span className="text-[11px] text-teal-600 font-semibold">Tercatat di Database</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">ODP Normal</span>
            <div className="text-xl font-bold text-slate-800">
              {odps.filter(o => o.status === 'normal').length}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">Beroperasi Baik</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">ODP Gangguan / Cut</span>
            <div className="text-xl font-bold text-slate-800">
              {odps.filter(o => o.status !== 'normal').length}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">Butuh Penanganan</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400">Titik GPS Koordinat</span>
            <div className="text-xl font-bold text-slate-800">
              {odps.filter(o => o.latitude && o.longitude).length} ODP
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">Valid di GIS Map</span>
          </div>
        </div>
      </div>

      {/* Interactive Map Visualizer Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-600" />
            <span>GIS Map View: Sebaran ODP & Titik Gangguan</span>
          </h3>
          <span className="text-xs text-slate-500">Lampung & Sekitarnya</span>
        </div>

        <div className="w-full h-64 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center border border-slate-800">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="text-center z-10 space-y-2 p-6">
            <Compass className="w-10 h-10 text-teal-400 mx-auto animate-pulse" />
            <div className="text-white font-bold text-sm">Peta Interaktif Topologi ODP GIS</div>
            <p className="text-slate-400 text-xs max-w-md">
              Menampilkan {odps.length} titik ODP dengan warna status (Hijau = Normal, Merah = Fiber Cut, Kuning = Mati Lampu).
            </p>
          </div>
        </div>
      </div>

      {/* ODP Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Nama ODP, Kode, Alamat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="normal">🟢 Normal</option>
              <option value="fiber_cut">🔴 Fiber Cut</option>
              <option value="mati_lampu">🟡 Mati Lampu / Adaptor</option>
              <option value="redaman_tinggi">🟠 Redaman Tinggi</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredOdps.length} ODP
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Nama ODP</th>
                <th className="py-3 px-4 font-semibold">Kapasitas Port</th>
                <th className="py-3 px-4 font-semibold">Status Operasional</th>
                <th className="py-3 px-4 font-semibold">Koordinat GPS</th>
                <th className="py-3 px-4 font-semibold">Alamat / Patokan</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOdps.length > 0 ? (
                filteredOdps.map((odp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-800 text-xs flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      {odp.nama_odp}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-700">{odp.kapasitas_port || 16} Port</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(odp.status)}
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">
                      {odp.latitude && odp.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${odp.latitude},${odp.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-teal-600 underline flex items-center gap-1"
                        >
                          <span>{Number(odp.latitude).toFixed(4)}, {Number(odp.longitude).toFixed(4)}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                      {odp.alamat || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOdp(odp);
                          setEditingStatus(odp.status);
                          setEditingNotes(odp.catatan || '');
                          setIsStatusModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-teal-600 transition"
                        title="Ubah Status Gangguan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada data ODP yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Status Toggle */}
      {isStatusModalOpen && selectedOdp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              Update Status ODP: {selectedOdp.nama_odp}
            </h3>

            <form onSubmit={handleSaveStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Operasional</label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="normal">🟢 Normal</option>
                  <option value="fiber_cut">🔴 Fiber Cut (Kabel Putus)</option>
                  <option value="mati_lampu">🟡 Mati Lampu / Adaptor Dicabut</option>
                  <option value="redaman_tinggi">🟠 Redaman Tinggi (Drop Signal)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan / Detail Gangguan</label>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Keterangan titik putus kabel, estimasi perbaikan, dll..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStatus}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {savingStatus ? 'Menyimpan...' : 'Simpan Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal KMZ Import */}
      {isKmzModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              Impor File KMZ Google Earth
            </h3>
            <p className="text-xs text-slate-500">
              Upload file .KMZ dari Google Earth untuk mengekstrak titik koordinat ODP otomatis.
            </p>

            <form onSubmit={handleUploadKmz} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-400 transition cursor-pointer">
                <input
                  type="file"
                  accept=".kmz,.kml"
                  onChange={(e) => setKmzFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="kmz-upload"
                />
                <label htmlFor="kmz-upload" className="cursor-pointer space-y-2 block">
                  <Upload className="w-8 h-8 text-teal-600 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">
                    {kmzFile ? kmzFile.name : 'Pilih file .kmz atau drag & drop ke sini'}
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsKmzModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!kmzFile || uploadingKmz}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {uploadingKmz ? 'Mengimpor...' : 'Proses Impor KMZ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

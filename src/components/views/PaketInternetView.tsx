import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  DollarSign, 
  Gauge, 
  Tag,
  ShieldCheck
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { PaketInternetItem } from '../../types';

export const PaketInternetView: React.FC = () => {
  const [pakets, setPakets] = useState<PaketInternetItem[]>([]);
  const [mikrotikProfiles, setMikrotikProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPaket, setEditingPaket] = useState<PaketInternetItem | null>(null);
  const [formData, setFormData] = useState({
    nama_paket: '',
    kategori: 'retail',
    kecepatan_mbps: 10,
    tarif_bulanan: 150000,
    mikrotik_profile: '',
    keterangan: '',
    is_active: true,
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/pakets');
      const list = Array.isArray(pRes) ? pRes : (pRes.data || []);
      setPakets(list);

      const profRes = await api.get('/pakets-mikrotik-profiles').catch(() => null);
      if (profRes) {
        setMikrotikProfiles(Array.isArray(profRes) ? profRes : (profRes.profiles || []));
      }
    } catch (e) {
      console.error('Failed to load packages:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingPaket(null);
    setFormData({
      nama_paket: '',
      kategori: 'retail',
      kecepatan_mbps: 10,
      tarif_bulanan: 150000,
      mikrotik_profile: mikrotikProfiles[0] || '',
      keterangan: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PaketInternetItem) => {
    setEditingPaket(p);
    setFormData({
      nama_paket: p.nama_paket,
      kategori: p.kategori || 'retail',
      kecepatan_mbps: p.kecepatan_mbps,
      tarif_bulanan: p.tarif_bulanan,
      mikrotik_profile: p.mikrotik_profile || '',
      keterangan: p.keterangan || '',
      is_active: p.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMessage(null);

    try {
      if (editingPaket) {
        await api.put(`/pakets/${editingPaket.id}`, formData);
        setActionMessage({ type: 'success', text: `Paket ${formData.nama_paket} berhasil diperbarui!` });
      } else {
        await api.post('/pakets', formData);
        setActionMessage({ type: 'success', text: `Paket ${formData.nama_paket} berhasil ditambahkan!` });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Gagal menyimpan paket: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: PaketInternetItem) => {
    if (!window.confirm(`Hapus paket ${p.nama_paket}?`)) return;
    try {
      await api.delete(`/pakets/${p.id}`);
      setActionMessage({ type: 'success', text: `Paket ${p.nama_paket} berhasil dihapus.` });
      loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: `Gagal menghapus paket: ${err.message}` });
    }
  };

  const filteredPakets = pakets.filter(p => 
    p.nama_paket.toLowerCase().includes(search.toLowerCase()) ||
    (p.mikrotik_profile && p.mikrotik_profile.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Paket Layanan Internet & Profil MikroTik</h1>
            <p className="text-xs text-slate-500">Master Paket Langganan, Kecepatan Bandwidth, Tarif Bulanan & Binding PPP Profile</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Paket</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPakets.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 uppercase tracking-wider">
                  {p.kategori || 'Retail'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {p.is_active ? 'AKTIF' : 'NONAKTIF'}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800">{p.nama_paket}</h3>
                <p className="text-xs text-slate-500">{p.keterangan || 'Paket internet unlimited tanpa FUP'}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800">
                  Rp {Number(p.tarif_bulanan).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-slate-400 font-medium">/ bulan</span>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-blue-600" />
                    Kecepatan
                  </span>
                  <span className="font-bold font-mono text-slate-800">{p.kecepatan_mbps} Mbps</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    MikroTik Profile
                  </span>
                  <span className="font-bold font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    {p.mikrotik_profile || 'default'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleOpenEdit(p)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-800">
              {editingPaket ? 'Edit Paket Internet' : 'Tambah Paket Internet Baru'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Home 20 Mbps"
                  value={formData.nama_paket}
                  onChange={(e) => setFormData({ ...formData, nama_paket: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kecepatan (Mbps)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.kecepatan_mbps}
                    onChange={(e) => setFormData({ ...formData, kecepatan_mbps: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tarif Bulanan (Rp)</label>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={formData.tarif_bulanan}
                    onChange={(e) => setFormData({ ...formData, tarif_bulanan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">MikroTik PPP Profile Binding</label>
                <select
                  value={formData.mikrotik_profile}
                  onChange={(e) => setFormData({ ...formData, mikrotik_profile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                >
                  <option value="">-- Pilih Profil MikroTik --</option>
                  {mikrotikProfiles.map((prof, idx) => (
                    <option key={idx} value={prof}>{prof}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan / Deskripsi</label>
                <textarea
                  rows={2}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Deskripsi layanan..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="paket-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded-md"
                />
                <label htmlFor="paket-active" className="text-xs font-semibold text-slate-700">
                  Aktifkan Paket (Bisa dipilih pelanggan & registrasi PSB)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Paket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

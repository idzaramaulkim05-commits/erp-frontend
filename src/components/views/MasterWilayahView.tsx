import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Key, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Search, 
  Layers,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { MasterWilayahItem, CustomerIdGenerationResult } from '../../types';

export const MasterWilayahView: React.FC = () => {
  const [wilayahList, setWilayahList] = useState<MasterWilayahItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Cascading Selection State
  const [selectedKabupaten, setSelectedKabupaten] = useState<string>('');
  const [selectedKecamatan, setSelectedKecamatan] = useState<string>('');
  const [selectedDesa, setSelectedDesa] = useState<string>('');
  
  // Generator State
  const [customerName, setCustomerName] = useState<string>('');
  const [generatedResult, setGeneratedResult] = useState<CustomerIdGenerationResult | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadWilayah = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wilayah/all');
      const list = Array.isArray(res) ? res : (res.data || []);
      setWilayahList(list);
    } catch (e) {
      console.error('Failed to load wilayah list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWilayah();
  }, []);

  // Filter Unique Kabupatens
  const kabupatens = Array.from(new Set(wilayahList.map(w => w.kabupaten_nama))).sort();
  
  // Filter Kecamatans for selected Kabupaten
  const kecamatans = Array.from(
    new Set(
      wilayahList
        .filter(w => !selectedKabupaten || w.kabupaten_nama === selectedKabupaten)
        .map(w => w.kecamatan_nama)
    )
  ).sort();

  // Filter Desas for selected Kecamatan
  const desas = wilayahList.filter(
    w => (!selectedKabupaten || w.kabupaten_nama === selectedKabupaten) &&
         (!selectedKecamatan || w.kecamatan_nama === selectedKecamatan)
  );

  // Generate ID
  const handleGenerateId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesa) return;

    setGenerating(true);
    try {
      const targetDesaObj = wilayahList.find(w => w.desa_kode === selectedDesa);
      const res = await api.post('/wilayah/generate-id', {
        desa_kode: selectedDesa,
        customer_name: customerName,
      });

      setGeneratedResult({
        customer_id: res.customer_id || res.id_customer || '18010420010001',
        pppoe_username: res.pppoe_username || res.username || `${customerName.toLowerCase().replace(/\s+/g, '')}@eonet`,
        pppoe_password_suggestion: res.pppoe_password || 'eonet12345',
        wilayah_code: targetDesaObj ? `${targetDesaObj.kecamatan_nama}, ${targetDesaObj.desa_nama}` : 'Lampung',
      });
    } catch (err: any) {
      alert(`Gagal generate ID: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredWilayah = wilayahList.filter(w => 
    w.desa_nama.toLowerCase().includes(search.toLowerCase()) ||
    w.kecamatan_nama.toLowerCase().includes(search.toLowerCase()) ||
    w.kabupaten_nama.toLowerCase().includes(search.toLowerCase()) ||
    w.desa_kode.includes(search)
  ).slice(0, 100);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Master Wilayah & Generator ID Pelanggan</h1>
            <p className="text-xs text-slate-500">Struktur Wilayah Administratif Lampung (BPS) & Generator Kode Pelanggan / PPPoE 14-Digit</p>
          </div>
        </div>

        <button
          onClick={loadWilayah}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Generator Tool Card */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-6">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm tracking-wider uppercase">
          <Sparkles className="w-5 h-5" />
          <span>Generator Kode ID Pelanggan & Kredensial PPPoE Otomatis</span>
        </div>

        <form onSubmit={handleGenerateId} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Kabupaten</label>
            <select
              value={selectedKabupaten}
              onChange={(e) => {
                setSelectedKabupaten(e.target.value);
                setSelectedKecamatan('');
                setSelectedDesa('');
              }}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Semua Kabupaten --</option>
              {kabupatens.map((k, i) => (
                <option key={i} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Kecamatan</label>
            <select
              value={selectedKecamatan}
              onChange={(e) => {
                setSelectedKecamatan(e.target.value);
                setSelectedDesa('');
              }}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Semua Kecamatan --</option>
              {kecamatans.map((k, i) => (
                <option key={i} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pilih Kelurahan / Desa *</label>
            <select
              required
              value={selectedDesa}
              onChange={(e) => setSelectedDesa(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">-- Pilih Desa --</option>
              {desas.map((d) => (
                <option key={d.id} value={d.desa_kode}>
                  {d.desa_nama} ({d.desa_kode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Calon Pelanggan</label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-4 flex justify-end">
            <button
              type="submit"
              disabled={generating || !selectedDesa}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm flex items-center gap-2 transition disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              <Key className="w-4 h-4" />
              <span>{generating ? 'Menghasilkan...' : 'Generate Customer ID & PPPoE'}</span>
            </button>
          </div>
        </form>

        {/* Generation Result Banner */}
        {generatedResult && (
          <div className="bg-slate-800/90 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold uppercase tracking-wider">
              <span>Hasil Generator Kredensial Baru</span>
              <span>Wilayah: {generatedResult.wilayah_code}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-slate-800">
              <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">ID Pelanggan (14-Digit)</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{generatedResult.customer_id}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedResult.customer_id, 'id')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  {copiedField === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Username PPPoE</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{generatedResult.pppoe_username}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedResult.pppoe_username, 'user')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  {copiedField === 'user' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Password Default</span>
                  <span className="font-mono font-bold text-sm text-slate-900">{generatedResult.pppoe_password_suggestion}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedResult.pppoe_password_suggestion, 'pass')}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  {copiedField === 'pass' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Wilayah Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Desa, Kecamatan, Kabupaten, atau Kode BPS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Total {wilayahList.length} Wilayah Administratif
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase">
                <th className="py-3 px-4 font-semibold">Kode Wilayah (BPS)</th>
                <th className="py-3 px-4 font-semibold">Provinsi</th>
                <th className="py-3 px-4 font-semibold">Kabupaten / Kota</th>
                <th className="py-3 px-4 font-semibold">Kecamatan</th>
                <th className="py-3 px-4 font-semibold">Kelurahan / Desa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWilayah.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-xs text-emerald-700">
                    {w.desa_kode}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{w.provinsi_nama}</td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-800">{w.kabupaten_nama}</td>
                  <td className="py-3 px-4 text-xs text-slate-700">{w.kecamatan_nama}</td>
                  <td className="py-3 px-4 text-xs font-bold text-slate-900">{w.desa_nama}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

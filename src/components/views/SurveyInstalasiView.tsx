import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ClipboardCheck,
  ExternalLink,
  MapPin,
  Navigation,
  Package,
  Plus,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InventoryItem, NetworkODP, ServiceRegistration } from '../../types';
import { extractCoordinatesFromUrl, getGoogleMapsDirectionUrl, getGoogleMapsPinUrl, getMapEmbedUrl } from '../../utils/coordinates';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

type MaterialDraftRow = {
  itemName: string;
  quantity: number;
  unit: string;
  inventoryId?: string;
};

const emptyMaterialRow = (): MaterialDraftRow => ({
  itemName: '',
  quantity: 1,
  unit: 'Unit',
});

const extractRequiredMaterials = (registration: ServiceRegistration): MaterialDraftRow[] => {
  const surveyData = registration.surveyData;
  if (!surveyData || typeof surveyData !== 'object' || !Array.isArray((surveyData as { requiredMaterials?: unknown[] }).requiredMaterials)) {
    return [];
  }

  return ((surveyData as { requiredMaterials: unknown[] }).requiredMaterials)
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const row = item as Record<string, unknown>;
      const itemName = typeof row.itemName === 'string' ? row.itemName.trim() : '';
      const quantity = typeof row.quantity === 'number' ? row.quantity : Number(row.quantity ?? 0);
      const unit = typeof row.unit === 'string' ? row.unit.trim() : '';

      if (!itemName || !unit || Number.isNaN(quantity) || quantity < 1) {
        return null;
      }

      return { itemName, quantity, unit };
    })
    .filter((item): item is MaterialDraftRow => item !== null);
};

export const SurveyInstalasiView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<ServiceRegistration[]>([]);
  const [odps, setOdps] = useState<NetworkODP[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<'layak' | 'tidak_layak'>('layak');
  const [notes, setNotes] = useState('');
  const [odpId, setOdpId] = useState('');
  const [requiredMaterials, setRequiredMaterials] = useState<MaterialDraftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [registrations, network, inventory] = await Promise.all([
        authFetch<{ data: ServiceRegistration[] }>('/service-registrations'),
        authFetch<{ data: NetworkODP[] }>('/network-odps'),
        authFetch<{ data: InventoryItem[] }>('/inventory'),
      ]);
      setItems(registrations.data);
      setOdps(network.data);
      setInventoryItems(inventory.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data survey & inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const queue = useMemo(
    () => items.filter((item) => ['menunggu_survey', 'survey_tidak_layak'].includes(item.status)),
    [items],
  );

  const selected = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null;

  // Extract coordinates for selected registration location
  const parsedCoords = useMemo(
    () => extractCoordinatesFromUrl(selected?.shareLocationUrl),
    [selected?.shareLocationUrl],
  );

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setOdpId(selected.odpId ?? '');
      setNotes(selected.surveyNotes ?? '');
      setResult(selected.surveyResult === 'tidak_layak' ? 'tidak_layak' : 'layak');
      setRequiredMaterials(extractRequiredMaterials(selected));
    }
  }, [selected?.id]);

  const validMaterialRows = requiredMaterials.filter((row) => row.itemName.trim() && row.unit.trim() && row.quantity >= 1);
  const hasIncompleteMaterialRows = requiredMaterials.some((row) => !row.itemName.trim() || !row.unit.trim() || row.quantity < 1);

  // Check if any material exceeds warehouse available stock
  const hasOutOfStockMaterials = requiredMaterials.some((row) => {
    const inv = inventoryItems.find((item) => item.name.toLowerCase() === row.itemName.toLowerCase());
    return inv && row.quantity > inv.stockAvailable;
  });

  const handleInventorySelect = (index: number, selectedName: string) => {
    const inv = inventoryItems.find((item) => item.name === selectedName);
    const next = [...requiredMaterials];

    if (inv) {
      next[index] = {
        ...next[index],
        itemName: inv.name,
        unit: inv.unit,
        inventoryId: inv.id,
      };
    } else {
      next[index] = {
        ...next[index],
        itemName: selectedName,
      };
    }

    setRequiredMaterials(next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (result === 'layak' && validMaterialRows.length === 0) {
      setError('Material wajib diisi untuk survey layak instalasi.');
      return;
    }
    if (result === 'layak' && hasIncompleteMaterialRows) {
      setError('Lengkapi semua baris material terlebih dahulu.');
      return;
    }
    if (result === 'layak' && hasOutOfStockMaterials) {
      setError('Terdapat material yang melebihi jumlah stok tersedia di gudang.');
      return;
    }
    setIsConfirmationOpen(true);
  };

  const confirmSubmit = async () => {
    if (!selected) return;

    setSaving(true);
    setError(null);
    try {
      await authFetch(`/service-registrations/${selected.id}/survey`, {
        method: 'POST',
        body: JSON.stringify({
          result,
          notes: notes || null,
          odp_id: odpId || null,
          odp_available: !!odpId,
          path_available: true,
          recommended_team: 'Tim Instalasi',
          required_materials: result === 'layak' ? validMaterialRows : [],
        }),
      });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan hasil survey.');
    } finally {
      setSaving(false);
      setIsConfirmationOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Tahap 3</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Survey Instalasi</h1>
            <p className="mt-1 text-sm text-slate-600">Verifikasi kelayakan lokasi pelanggan, titik ODP, jalur FO, dan estimasi material dari stok gudang.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Survey
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Queue & Right Survey Form */}
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Left: Queue List */}
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">Antrean Survey</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {queue.length} Antrean
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat antrean...
              </div>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Tidak ada item survey yang menunggu diproses.
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      item.status === 'survey_tidak_layak' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                    }`}>
                      {item.status === 'survey_tidak_layak' ? 'Tidak Layak' : 'Siap Survey'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{item.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-sans font-medium text-slate-700">{item.region}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span>{item.address}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Survey Form */}
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Form Hasil Survey Lapangan</h2>
              <p className="text-xs text-slate-500">Isi kelayakan teknis, ODP terdekat, dan material dari inventori gudang.</p>
            </div>
          </div>

          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-500">
              Pilih registrasi dari antrean survey di sebelah kiri untuk diproses.
            </div>
          ) : (
            <>
              {/* Customer Card */}
              <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-950">{selected.name}</h3>
                    <div className="mt-0.5 text-xs text-slate-500 font-mono">{selected.id} • {selected.phone}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {selected.packagePlan}
                  </span>
                </div>

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-start gap-1.5 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selected.address} ({selected.region})</span>
                  </div>
                  <div>Biaya Bulanan: <strong className="text-slate-800 font-bold">Rp {selected.monthlyFee.toLocaleString('id-ID')}</strong></div>
                  <div>Biaya Pemasangan: <strong className="text-emerald-700 font-bold">Rp {(selected.installationFee ?? 0).toLocaleString('id-ID')}</strong></div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: Perkiraan Lokasi Pelanggan (Maps & Koordinat) */}
              {/* ========================================================================= */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    Perkiraan Lokasi Pelanggan
                  </div>

                  {parsedCoords && (
                    <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                      {parsedCoords.lat.toFixed(6)}, {parsedCoords.lng.toFixed(6)}
                    </span>
                  )}
                </div>

                {parsedCoords ? (
                  <div className="space-y-3">
                    {/* OpenStreetMap Interactive Preview */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs">
                      <iframe
                        src={getMapEmbedUrl(parsedCoords.lat, parsedCoords.lng)}
                        title="Perkiraan Lokasi Pelanggan"
                        className="h-52 w-full border-0"
                        loading="lazy"
                      />
                    </div>

                    {/* Direct Action Buttons for Routing */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={getGoogleMapsDirectionUrl(parsedCoords.lat, parsedCoords.lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Buka Rute Navigasi Google Maps
                      </a>

                      <a
                        href={getGoogleMapsPinUrl(parsedCoords.lat, parsedCoords.lng)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Buka Titik Pin Google Maps
                      </a>
                    </div>
                  </div>
                ) : selected.shareLocationUrl ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600 truncate max-w-sm">
                      {selected.shareLocationUrl}
                    </span>
                    <a
                      href={selected.shareLocationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Link Lokasi Pelanggan
                    </a>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs text-slate-400">
                    Belum ada tautan lokasi / koordinat Google Maps yang dilampirkan pada registrasi ini.
                  </div>
                )}
              </div>

              {/* Form Input: Layak/Tidak Layak & ODP */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  <span>Hasil Survey</span>
                  <select
                    value={result}
                    onChange={(event) => setResult(event.target.value as 'layak' | 'tidak_layak')}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="layak">Layak Instalasi</option>
                    <option value="tidak_layak">Tidak Layak Instalasi</option>
                  </select>
                </label>

                <label className="space-y-1.5 text-xs font-bold text-slate-700">
                  <span>ODP Rekomendasi</span>
                  <select
                    value={odpId}
                    onChange={(event) => setOdpId(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Pilih ODP jika tersedia</option>
                    {odps.map((odp) => (
                      <option key={odp.id} value={odp.id}>
                        {odp.id} ({odp.region}) • {odp.usedPorts}/{odp.totalPorts} port
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block space-y-1.5 text-xs font-bold text-slate-700">
                <span>Catatan Survey & Jalur FO</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 leading-relaxed"
                  placeholder="Tuliskan detail jalur kabel FO, kondisi tiang, estimasi jarak ke ODP, dan catatan teknis lainnya..."
                />
              </label>

              {/* ========================================================================= */}
              {/* SECTION: Estimasi Kebutuhan Material dari Stok Gudang (Warehouse Sync) */}
              {/* ========================================================================= */}
              {result === 'layak' && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-emerald-600" />
                        Estimasi Kebutuhan Material (Stok Gudang)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pilih material yang tersedia di gudang untuk diteruskan menjadi permintaan barang keluar teknisi.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequiredMaterials((current) => [...current, emptyMaterialRow()])}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah Material
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {requiredMaterials.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-xs text-slate-400">
                        Belum ada material yang ditambahkan. Klik <strong>Tambah Material</strong> di atas untuk memilih barang dari stok gudang.
                      </div>
                    ) : (
                      requiredMaterials.map((item, index) => {
                        const matchedInv = inventoryItems.find((inv) => inv.name.toLowerCase() === item.itemName.toLowerCase());
                        const isOverStock = matchedInv && item.quantity > matchedInv.stockAvailable;

                        return (
                          <div
                            key={`material-${selected.id}-${index}`}
                            className={`rounded-xl border p-3.5 bg-white transition space-y-2 ${
                              isOverStock ? 'border-amber-300 ring-2 ring-amber-300/30' : 'border-slate-200'
                            }`}
                          >
                            <div className="grid gap-2.5 sm:grid-cols-[1.5fr_0.6fr_0.6fr_auto] items-end">
                              {/* Warehouse Material Dropdown */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Pilih Barang dari Gudang</label>
                                <select
                                  value={item.itemName}
                                  onChange={(e) => handleInventorySelect(index, e.target.value)}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                >
                                  <option value="">-- Pilih Item Gudang --</option>
                                  {inventoryItems.map((inv) => (
                                    <option key={inv.id} value={inv.name}>
                                      {inv.name} ({inv.code}) • Stok: {inv.stockAvailable} {inv.unit}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Jumlah (Qty)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={matchedInv?.stockAvailable || 9999}
                                  value={item.quantity}
                                  onChange={(event) => {
                                    const next = [...requiredMaterials];
                                    next[index] = { ...next[index], quantity: Number(event.target.value) || 1 };
                                    setRequiredMaterials(next);
                                  }}
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                />
                              </div>

                              {/* Unit (Locked to Inventory Unit) */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-600">Satuan</label>
                                <input
                                  value={item.unit}
                                  readOnly
                                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs text-slate-600 font-semibold outline-none cursor-not-allowed"
                                />
                              </div>

                              {/* Delete Row Button */}
                              <button
                                type="button"
                                onClick={() => setRequiredMaterials((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                                title="Hapus Material"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Stock warning */}
                            {matchedInv && (
                              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                                <span>Kategori: <strong>{matchedInv.category}</strong> • Lokasi: <strong>{matchedInv.locationRack}</strong></span>
                                {isOverStock ? (
                                  <span className="font-bold text-amber-700 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Jumlah melebihi stok gudang (Tersedia: {matchedInv.stockAvailable} {matchedInv.unit})
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium">
                                    Stok mencukupi ({matchedInv.stockAvailable} {matchedInv.unit} tersedia)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  {saving ? 'Menyimpan...' : 'Simpan Hasil Survey'}
                </button>
              </div>
            </>
          )}
        </form>
      </section>

      {/* Confirmation Modal */}
      <ConfirmActionModal
        open={isConfirmationOpen}
        title={result === 'layak' ? 'Konfirmasi Survey Layak' : 'Konfirmasi Survey Tidak Layak'}
        message={
          selected
            ? result === 'layak'
              ? `Survey untuk ${selected.name} (${selected.id}) akan disimpan sebagai layak instalasi. Estimasi material dari stok gudang akan diteruskan ke antrean barang keluar, dan sistem akan memproses pembuatan Work Order instalasi.`
              : `Survey untuk ${selected.name} (${selected.id}) akan disimpan sebagai tidak layak. Registrasi ini tidak akan dilanjutkan ke tahap instalasi sampai ada revisi atau evaluasi baru.`
            : ''
        }
        confirmLabel="Ya, Simpan Hasil Survey"
        tone={result === 'layak' ? 'success' : 'warning'}
        loading={saving}
        onCancel={() => setIsConfirmationOpen(false)}
        onConfirm={() => void confirmSubmit()}
      />
    </div>
  );
};

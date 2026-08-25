import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NetworkODP, ServiceRegistration } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

type MaterialDraftRow = {
  itemName: string;
  quantity: number;
  unit: string;
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
      const [registrations, network] = await Promise.all([
        authFetch<{ data: ServiceRegistration[] }>('/service-registrations'),
        authFetch<{ data: NetworkODP[] }>('/network-odps'),
      ]);
      setItems(registrations.data);
      setOdps(network.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data survey.');
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
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Tahap 3</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Survey Instalasi</h1>
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

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-slate-900">Antrean Survey</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat antrean...
              </div>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Tidak ada item survey yang menunggu diproses.
              </div>
            ) : queue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selected?.id === item.id
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{item.name}</div>
                <div className="mt-1 text-xs text-slate-500">{item.id} • {item.region}</div>
                <div className="mt-2 text-xs text-slate-500">{item.address}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Form Hasil Survey</h2>
            </div>
          </div>

          {!selected ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Pilih registrasi dari antrean survey untuk diproses.
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">{selected.name}</div>
                <div className="mt-1">{selected.phone} • {selected.packagePlan}</div>
                <div className="mt-1">{selected.address}</div>
                <div className="mt-1">Biaya bulanan: Rp {selected.monthlyFee.toLocaleString('id-ID')}</div>
                <div className="mt-1 font-semibold text-emerald-700">Biaya pemasangan: Rp {(selected.installationFee ?? 0).toLocaleString('id-ID')}</div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Hasil Survey</span>
                  <select
                    value={result}
                    onChange={(event) => setResult(event.target.value as 'layak' | 'tidak_layak')}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="layak">Layak Instalasi</option>
                    <option value="tidak_layak">Tidak Layak</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>ODP Rekomendasi</span>
                  <select
                    value={odpId}
                    onChange={(event) => setOdpId(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">Pilih ODP jika tersedia</option>
                    {odps.map((odp) => (
                      <option key={odp.id} value={odp.id}>{odp.id}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
                <span>Catatan Survey</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  placeholder="Tuliskan jalur tersedia, kondisi lokasi, ODP, port, dan catatan teknis lainnya..."
                />
              </label>

              {result === 'layak' && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-800">Estimasi kebutuhan material</div>
                    <button
                      type="button"
                      onClick={() => setRequiredMaterials((current) => [...current, emptyMaterialRow()])}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Tambah Material
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {requiredMaterials.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-4 text-xs font-medium text-slate-500">
                        Tambahkan estimasi material yang akan disiapkan gudang.
                      </div>
                    ) : (
                      requiredMaterials.map((item, index) => (
                        <div key={`material-${selected.id}-${index}`} className="grid gap-2 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
                          <input
                            value={item.itemName}
                            onChange={(event) => {
                              const next = [...requiredMaterials];
                              next[index] = { ...next[index], itemName: event.target.value };
                              setRequiredMaterials(next);
                            }}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                            placeholder="Nama material"
                          />
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(event) => {
                              const next = [...requiredMaterials];
                              next[index] = { ...next[index], quantity: Number(event.target.value) || 1 };
                              setRequiredMaterials(next);
                            }}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                            placeholder="Qty"
                          />
                          <input
                            value={item.unit}
                            onChange={(event) => {
                              const next = [...requiredMaterials];
                              next[index] = { ...next[index], unit: event.target.value };
                              setRequiredMaterials(next);
                            }}
                            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                            placeholder="Unit"
                          />
                          <button
                            type="button"
                            onClick={() => setRequiredMaterials((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                            className="rounded-2xl border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
                          >
                            Hapus
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Hasil Survey'}
                </button>
              </div>
            </>
          )}
        </form>
      </section>

      <ConfirmActionModal
        open={isConfirmationOpen}
        title={result === 'layak' ? 'Konfirmasi Survey Layak' : 'Konfirmasi Survey Tidak Layak'}
        message={
          selected
            ? result === 'layak'
              ? `Survey untuk ${selected.name} (${selected.id}) akan disimpan sebagai layak instalasi. Material akan diteruskan ke request gudang dan sistem akan membuat WO instalasi.`
              : `Survey untuk ${selected.name} (${selected.id}) akan disimpan sebagai tidak layak. Registrasi ini tidak akan lanjut ke pemasangan sampai ada tindak lanjut baru.`
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

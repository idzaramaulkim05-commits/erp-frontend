import React, { useEffect, useMemo, useState } from 'react';
import { Boxes, CheckCircle2, RefreshCcw, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { InstallationMaterialRequest } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

export const RequestGudangInstalasiView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<InstallationMaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [confirmationItem, setConfirmationItem] = useState<InstallationMaterialRequest | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: InstallationMaterialRequest[] }>('/installation-material-requests');
      setItems(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat request gudang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sortedItems = useMemo(
    () => items.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [items],
  );

  const waitingConfirmation = useMemo(
    () => sortedItems.filter((item) => item.status === 'menunggu_persetujuan_gudang'),
    [sortedItems],
  );

  const confirmedItems = useMemo(
    () => sortedItems.filter((item) => item.status === 'diproses_gudang'),
    [sortedItems],
  );

  const updateStatus = async (item: InstallationMaterialRequest) => {
    setSavingId(item.id);
    setError(null);
    try {
      await authFetch(`/installation-material-requests/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'diproses_gudang',
          approval_notes: noteDrafts[item.id] ?? item.approvalNotes ?? null,
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengubah status request gudang.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Tahap 4A</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Request Gudang Instalasi</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Request
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Memuat request gudang...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Menunggu Konfirmasi Gudang</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Gudang cukup memastikan ketersediaan barang. Jika tersedia, konfirmasi agar request berpindah ke daftar bawah.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                {waitingConfirmation.length} request
              </span>
            </div>

            {waitingConfirmation.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Tidak ada request yang menunggu konfirmasi gudang.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {waitingConfirmation.map((item) => (
                  <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.id} • {item.workOrderId ?? 'Belum ada WO'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                          Menunggu Konfirmasi
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                          item.requestPurpose === 'maintenance_replacement'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          {item.requestPurpose === 'maintenance_replacement' ? 'Maintenance Replacement' : 'Instalasi Baru'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Boxes className="h-4 w-4 text-slate-500" />
                        Kebutuhan Material
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {item.items.map((material) => (
                          <div key={`${item.id}-${material.itemName}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <span>{material.itemName}</span>
                            <span>{material.quantity} {material.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
                      <span>Catatan Gudang</span>
                      <input
                        value={noteDrafts[item.id] ?? item.approvalNotes ?? ''}
                        onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        placeholder="Opsional, misalnya stok siap disiapkan"
                      />
                    </label>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        Requested by {item.requestedBy}
                      </div>
                      <button
                        type="button"
                        disabled={savingId === item.id}
                        onClick={() => setConfirmationItem(item)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        <Truck className="h-4 w-4" />
                        {savingId === item.id ? 'Menyimpan...' : 'Konfirmasi Barang Tersedia'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Sudah Dikonfirmasi</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Daftar request yang sudah dikonfirmasi barangnya tersedia dan kini berada pada status `diproses_gudang`.
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                {confirmedItems.length} request
              </span>
            </div>

            {confirmedItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada request yang sudah dikonfirmasi tersedia.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {confirmedItems.map((item) => (
                  <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.id} • {item.workOrderId ?? 'Belum ada WO'}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Diproses Gudang
                          </span>
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                          item.requestPurpose === 'maintenance_replacement'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}>
                          {item.requestPurpose === 'maintenance_replacement' ? 'Maintenance Replacement' : 'Instalasi Baru'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Boxes className="h-4 w-4 text-slate-500" />
                        Kebutuhan Material
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {item.items.map((material) => (
                          <div key={`${item.id}-${material.itemName}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                            <span>{material.itemName}</span>
                            <span>{material.quantity} {material.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Requested By</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{item.requestedBy}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Approved By</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{item.approvedBy || 'Belum tercatat'}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Catatan Gudang</div>
                      <div className="mt-1">{item.approvalNotes || 'Tidak ada catatan gudang.'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <ConfirmActionModal
        open={confirmationItem !== null}
        title="Konfirmasi Barang Tersedia"
        message={
          confirmationItem
            ? `Request gudang ${confirmationItem.id} untuk ${confirmationItem.customerName} akan dikonfirmasi barangnya tersedia dan dipindahkan ke daftar "Sudah Dikonfirmasi". Pastikan catatan gudang sudah sesuai.`
            : ''
        }
        confirmLabel="Ya, Konfirmasi Tersedia"
        tone="warning"
        loading={savingId === confirmationItem?.id}
        onCancel={() => setConfirmationItem(null)}
        onConfirm={() => {
          if (!confirmationItem) return;
          void updateStatus(confirmationItem).finally(() => setConfirmationItem(null));
        }}
      />
    </div>
  );
};

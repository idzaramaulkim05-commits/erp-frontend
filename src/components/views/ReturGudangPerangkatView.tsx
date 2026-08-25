import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PackageCheck, RefreshCcw, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WarehouseReturnRequest } from '../../types';
import { NotesActionModal } from '../modals/NotesActionModal';

export const ReturGudangPerangkatView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WarehouseReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [target, setTarget] = useState<WarehouseReturnRequest | null>(null);
  const [notes, setNotes] = useState('Perangkat diterima gudang, QC retur selesai, dan stok/custody diperbarui.');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: WarehouseReturnRequest[] }>('/warehouse-return-requests');
      setItems(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat antrean retur gudang.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const waitingItems = useMemo(
    () => items.filter((item) => item.status === 'menunggu_qc_gudang'),
    [items],
  );

  const completedItems = useMemo(
    () => items.filter((item) => item.status === 'retur_selesai'),
    [items],
  );

  const handleQc = async (item: WarehouseReturnRequest) => {
    setSavingId(item.id);
    setError(null);
    try {
      await authFetch(`/warehouse-return-requests/${item.id}/qc`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyelesaikan QC retur gudang.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Gudang Return Flow</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Retur Gudang Perangkat</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              QC alat yang kembali dari pekerjaan maintenance pergantian perangkat. Ticket baru benar-benar selesai setelah retur ini ditutup gudang.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Retur
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Memuat antrean retur gudang...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Menunggu QC Gudang</h2>
                <p className="mt-2 text-sm text-slate-500">Retur replacement dan retur uninstall pelanggan dipisah di level label agar penerimaan alat tetap jelas dan konsisten.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                {waitingItems.length} retur
              </span>
            </div>

            {waitingItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Tidak ada retur perangkat yang menunggu QC gudang.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {waitingItems.map((item) => (
                  <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.id} • {item.workOrderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
                          Menunggu QC
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${item.returnType === 'uninstallation' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                          {item.returnType === 'uninstallation' ? 'Retur Uninstall' : 'Retur Replacement'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 text-sm text-slate-600">
                      {item.items.map((material) => (
                        <div key={`${item.id}-${material.itemName}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <div>
                            <div className="font-semibold text-slate-900">{material.itemName}</div>
                            <div className="text-xs text-slate-500">
                              {item.returnType === 'uninstallation'
                                ? material.returnCategory === 'returned_damaged'
                                  ? 'Alat cabutan rusak'
                                  : material.returnCategory === 'missing'
                                  ? 'Item hilang / tidak ditemukan'
                                  : 'Alat cabutan pelanggan'
                                : material.returnCategory === 'old_defective'
                                ? 'Perangkat lama / error'
                                : 'Alat pengganti tidak terpakai'}
                            </div>
                          </div>
                          <div className="text-right text-sm font-semibold text-slate-800">
                            {material.quantity} {material.unit}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTarget(item);
                        setNotes('Perangkat diterima gudang, QC retur selesai, dan stok/custody diperbarui.');
                      }}
                      disabled={savingId === item.id}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      <PackageCheck className="h-4 w-4" />
                      {savingId === item.id ? 'Memproses...' : 'QC Retur Gudang'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Retur Selesai</h2>
                <p className="mt-2 text-sm text-slate-500">Retur yang sudah diterima gudang. Untuk replacement akan melepas hold ticket, dan untuk uninstall akan menutup ticket sekaligus menyelesaikan status pelanggan.</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                {completedItems.length} retur
              </span>
            </div>

            {completedItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada retur perangkat yang selesai.
              </div>
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {completedItems.map((item) => (
                  <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                        <p className="mt-1 text-sm text-slate-500">{item.id} • {item.workOrderId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Retur Selesai
                          </span>
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${item.returnType === 'uninstallation' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                          {item.returnType === 'uninstallation' ? 'Retur Uninstall' : 'Retur Replacement'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Catatan QC Gudang</div>
                      <div className="mt-1">{item.qcNotes || 'Tidak ada catatan tambahan.'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <NotesActionModal
        open={target !== null}
        title="QC Retur Gudang"
        message={target ? `Retur perangkat ${target.id} untuk ${target.customerName} akan ditandai selesai. ${target.returnType === 'uninstallation' ? 'Ticket uninstall akan ditutup dan status pelanggan akan berubah menjadi nonaktif setelah QC ini berhasil.' : 'Ticket replacement yang tertahan akan ditutup otomatis setelah QC ini berhasil.'}` : ''}
        label="Catatan QC Gudang"
        value={notes}
        onChange={setNotes}
        tone="success"
        confirmLabel="Selesaikan Retur"
        loading={savingId === target?.id}
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          if (!target) return;
          void handleQc(target).finally(() => setTarget(null));
        }}
      />
    </div>
  );
};

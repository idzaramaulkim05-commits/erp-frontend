import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WarehouseReturnRequest } from '../../types';

export const ReturGudangPerangkatView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WarehouseReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [target, setTarget] = useState<WarehouseReturnRequest | null>(null);
  const [condition, setCondition] = useState<'layak_pakai' | 'rusak_tidak_layak'>('layak_pakai');
  const [notes, setNotes] = useState('');

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
        body: JSON.stringify({
          condition,
          device_condition: condition,
          notes,
        }),
      });
      setTarget(null);
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
              QC uji kelayakan alat yang kembali dari lapangan. Perangkat yang layak pakai akan otomatis masuk ke stok tersedia gudang, sedangkan perangkat rusak tidak akan dimasukkan ke stok.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 cursor-pointer"
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
          {/* Waiting QC Section */}
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
                  <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                          <p className="mt-1 text-sm text-slate-500 font-mono">{item.id} • {item.workOrderId}</p>
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Barang yang Dikembalikan Teknisi:
                        </span>
                        {item.items.map((material, idx) => (
                          <div key={`${item.id}-${material.itemName}-${idx}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
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
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTarget(item);
                        setCondition('layak_pakai');
                        setNotes('Perangkat telah diuji fisik & daya oleh gudang.');
                      }}
                      disabled={savingId === item.id}
                      className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 cursor-pointer shadow-xs"
                    >
                      <PackageCheck className="h-4 w-4 text-emerald-400" />
                      <span>{savingId === item.id ? 'Memproses...' : 'Uji & QC Retur Gudang'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Returns Section */}
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900">Retur Selesai</h2>
                <p className="mt-2 text-sm text-slate-500">Daftar retur yang sudah di-QC gudang beserta status kelayakan dan mutasi stok.</p>
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
                {completedItems.map((item) => {
                  const isReusable = item.items.some((i: any) => i.qcCondition === 'layak_pakai') || item.qcNotes?.includes('LAYAK PAKAI');
                  const isDefective = item.items.some((i: any) => i.qcCondition === 'rusak_tidak_layak') || item.qcNotes?.includes('RUSAK');

                  return (
                    <div key={item.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-black tracking-tight text-slate-900">{item.customerName}</h3>
                          <p className="mt-1 text-sm text-slate-500 font-mono">{item.id} • {item.workOrderId}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Retur Selesai
                            </span>
                          </span>

                          {isReusable ? (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              🟢 Layak Pakai (+ Stok)
                            </span>
                          ) : isDefective ? (
                            <span className="rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                              🔴 Rusak / Afkir (Tidak Masuk Stok)
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-1 rounded-2xl bg-white p-3.5 text-xs text-slate-600 border border-slate-200">
                        {item.items.map((mat, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1">
                            <span className="font-semibold text-slate-800">{mat.itemName}</span>
                            <span className="font-mono text-slate-600">{mat.quantity} {mat.unit}</span>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hasil & Catatan QC Gudang</div>
                        <div className="mt-1 font-medium text-slate-800 whitespace-pre-line">{item.qcNotes || 'Tidak ada catatan tambahan.'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* QC Modal with Device Condition Selection (Layak Pakai vs Rusak / Tidak Layak) */}
      {target && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Header */}
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Pemeriksaan & QC Retur Gudang</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {target.id} • {target.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              {/* Item Info Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Daftar Perangkat yang Diperiksa:
                </span>
                <div className="space-y-1.5">
                  {target.items.map((mat, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl bg-white p-2.5 border border-slate-200">
                      <span className="font-bold text-slate-900 text-xs">{mat.itemName}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 font-mono">
                        {mat.quantity} {mat.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condition Selection Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-900 block">
                  Kondisi Kelayakan Perangkat (Hasil Uji Fisik & Fungsi):
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Option 1: Layak Pakai */}
                  <div
                    onClick={() => setCondition('layak_pakai')}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition space-y-2 ${
                      condition === 'layak_pakai'
                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${condition === 'layak_pakai' ? 'bg-emerald-600 text-white' : 'border border-slate-300'}`}>
                          {condition === 'layak_pakai' && <Check className="h-3.5 w-3.5 stroke-3" />}
                        </div>
                        <span className="font-black text-slate-900 text-xs">Layak Pakai / Normal</span>
                      </div>
                    </div>
                    <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      + Masuk Stok Tersedia
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Perangkat berfungsi baik. Jumlah unit akan <strong>otomatis ditambahkan ke stok aktif gudang</strong>.
                    </p>
                  </div>

                  {/* Option 2: Rusak / Tidak Layak */}
                  <div
                    onClick={() => setCondition('rusak_tidak_layak')}
                    className={`rounded-2xl border-2 p-4 cursor-pointer transition space-y-2 ${
                      condition === 'rusak_tidak_layak'
                        ? 'border-rose-500 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full ${condition === 'rusak_tidak_layak' ? 'bg-rose-600 text-white' : 'border border-slate-300'}`}>
                          {condition === 'rusak_tidak_layak' && <Check className="h-3.5 w-3.5 stroke-3" />}
                        </div>
                        <span className="font-black text-slate-900 text-xs">Rusak / Tidak Layak</span>
                      </div>
                    </div>
                    <span className="inline-block rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                      Tidak Masuk Stok
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Perangkat mati/rusak fisik. Item <strong>TIDAK akan masuk ke stok tersedia</strong> (hanya dicatat afkir).
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Outcome Indicator */}
              {condition === 'layak_pakai' ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-950 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Stok barang akan bertambah di master stok gudang setelah konfirmasi.</span>
                </div>
              ) : (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-950 font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Perangkat tidak akan menambah stok tersedia gudang (masuk catatan barang afkir/rusak).</span>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Catatan Pengujian & Pemeriksaan Fisik:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Adaptor lengkap, port LAN 1-4 berfungsi normal, redaman stabil..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={savingId !== null}
                onClick={() => setTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={savingId !== null}
                onClick={() => void handleQc(target)}
                className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer ${
                  condition === 'layak_pakai'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {savingId !== null ? (
                  <span>Menyimpan QC...</span>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4" />
                    <span>Konfirmasi Hasil QC Retur</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardList, RefreshCcw, RotateCcw, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

type QcActionType = 'return' | 'close';

export const QCInstalasiNocView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opticalPower, setOpticalPower] = useState('-20.3');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<QcActionType | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: WorkOrder[] }>('/work-orders');
      setItems(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat antrean QC instalasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const activeQueue = useMemo(() => (
    items.filter((item) =>
      item.type === 'installation'
      && ['menunggu_qc_noc', 'dikembalikan_ke_teknisi'].includes(item.status),
    )
  ), [items]);

  const closedItems = useMemo(
    () => items.filter((item) => item.type === 'installation' && item.status === 'closed'),
    [items],
  );

  const selected = activeQueue.find((item) => item.id === selectedId) ?? activeQueue[0] ?? null;
  const summary = useMemo(() => ({
    total: activeQueue.length,
    waitingQc: activeQueue.filter((item) => item.status === 'menunggu_qc_noc').length,
    returned: activeQueue.filter((item) => item.status === 'dikembalikan_ke_teknisi').length,
    closed: closedItems.length,
  }), [activeQueue, closedItems]);

  const returnToTech = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/return-to-tech`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'QC NOC meminta revisi data ONU atau bukti instalasi.' }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengembalikan WO ke teknisi.');
    } finally {
      setSaving(false);
    }
  };

  const closeByNoc = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/noc-final-verify`, {
        method: 'POST',
        body: JSON.stringify({
          optical_dbm_reading: Number(opticalPower),
          pppoe_session_active: true,
          rx_power_threshold_passed: true,
          notes: 'QC NOC lulus. WO ditutup.',
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal close WO oleh NOC.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">NOC</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">QC Instalasi NOC</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh WO
          </button>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Total Queue</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{summary.total}</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">Menunggu QC</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{summary.waitingQc}</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-600">Dikembalikan</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{summary.returned}</div>
        </article>
        <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Closed</div>
          <div className="mt-3 text-3xl font-black text-slate-950">{summary.closed}</div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-slate-900">WO Menunggu QC</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat WO...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada WO instalasi yang masuk ke antrean QC NOC.
              </div>
            ) : activeQueue.map((item) => (
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
                <div className="text-sm font-bold text-slate-900">{item.customerName}</div>
                <div className="mt-1 text-xs text-slate-500">{item.id} • {item.status}</div>
                <div className="mt-2 text-xs text-slate-500">{item.address}</div>
                <div className="mt-2 text-xs text-slate-500">
                  Teknisi: {item.assignedTechName ?? 'Belum diassign'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Pilih work order instalasi untuk mulai review QC.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{selected.customerName}</h2>
                  <p className="text-sm text-slate-500">{selected.id} • {selected.region}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  Konteks QC
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selected.status}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Teknisi</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selected.assignedTechName ?? '-'}</div>
                  </div>
                </div>
              </div>

              <label className="mt-5 block space-y-2 text-sm font-semibold text-slate-700">
                <span>Redaman Final Verifikasi (dBm)</span>
                <input
                  value={opticalPower}
                  onChange={(event) => setOpticalPower(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPendingAction('return')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  QC Gagal
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPendingAction('close')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  QC Lulus & Close WO
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <ConfirmActionModal
        open={pendingAction !== null}
        title={pendingAction === 'return' ? 'Konfirmasi QC Gagal' : 'Konfirmasi QC Lulus & Close WO'}
        message={
          selected
            ? pendingAction === 'return'
              ? `WO ${selected.id} untuk ${selected.customerName} akan dikembalikan ke teknisi lapangan untuk revisi. Pastikan alasan revisi memang sudah final.`
              : `WO ${selected.id} untuk ${selected.customerName} akan dinyatakan lulus QC dan ditutup oleh NOC. Pastikan verifikasi redaman dan layanan sudah benar.`
            : ''
        }
        confirmLabel={pendingAction === 'return' ? 'Ya, Kembalikan ke Teknisi' : 'Ya, Luluskan & Tutup WO'}
        tone={pendingAction === 'return' ? 'warning' : 'success'}
        loading={saving}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === 'return') {
            void returnToTech().finally(() => setPendingAction(null));
            return;
          }
          if (pendingAction === 'close') {
            void closeByNoc().finally(() => setPendingAction(null));
          }
        }}
      />
    </div>
  );
};

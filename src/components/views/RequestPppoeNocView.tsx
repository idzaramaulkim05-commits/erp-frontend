import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, RefreshCcw, ShieldCheck, Wifi } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder } from '../../types';
import { NotesActionModal } from '../modals/NotesActionModal';

type PppoeActionState =
  | {
      type: 'approve';
      workOrder: WorkOrder;
    }
  | {
      type: 'reject';
      workOrder: WorkOrder;
    }
  | null;

export const RequestPppoeNocView: React.FC = () => {
  const {
    workOrders,
    approveWorkOrderPppoe,
    rejectWorkOrderPppoe,
    resetToDefaultData,
  } = useIOMS();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionState, setActionState] = useState<PppoeActionState>(null);
  const [pppoeUsername, setPppoeUsername] = useState('');
  const [pppoePassword, setPppoePassword] = useState('');
  const [vlan, setVlan] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const installationItems = useMemo(
    () => workOrders.filter((item) => item.type === 'installation'),
    [workOrders],
  );
  const pendingItems = useMemo(
    () => installationItems.filter((item) => item.pppoeRequestStatus === 'pending_noc'),
    [installationItems],
  );
  const approvedItems = useMemo(
    () => installationItems.filter((item) => item.pppoeRequestStatus === 'approved'),
    [installationItems],
  );

  const selected = pendingItems.find((item) => item.id === selectedId) ?? pendingItems[0] ?? null;

  useEffect(() => {
    if (!selected) {
      return;
    }

    setSelectedId(selected.id);
    setPppoeUsername(String(selected.networkCredentials?.pppoeUsername ?? `${selected.id.toLowerCase()}@isp.net`));
    setPppoePassword(String(selected.networkCredentials?.pppoePassword ?? ''));
    setVlan(String(selected.networkCredentials?.vlan ?? ''));
    setNotes('PPPoE pasang baru sudah diisi dan siap dipakai teknisi lapangan.');
  }, [selected?.id]);

  const openApproveModal = () => {
    if (!selected) return;
    setActionState({ type: 'approve', workOrder: selected });
  };

  const openRejectModal = () => {
    if (!selected) return;
    setNotes('Data permintaan PPPoE belum lengkap, mohon dicek ulang oleh teknisi lapangan.');
    setActionState({ type: 'reject', workOrder: selected });
  };

  const closeModal = () => {
    if (saving) return;
    setActionState(null);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!actionState) return;

    setSaving(true);
    setError(null);
    try {
      if (actionState.type === 'approve') {
        await approveWorkOrderPppoe(actionState.workOrder.id, {
          pppoeUsername,
          pppoePassword,
          vlan: vlan.trim() || null,
          notes,
        });
      } else {
        await rejectWorkOrderPppoe(actionState.workOrder.id, notes);
      }
      setActionState(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Aksi PPPoE gagal diproses.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">NOC</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Request PPPoE NOC</h1>
          </div>
          <button
            type="button"
            onClick={resetToDefaultData}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Wifi className="h-5 w-5" />
          </div>
          <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Pending NOC</div>
          <div className="mt-2 text-4xl font-black text-slate-950">{pendingItems.length}</div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Approved</div>
          <div className="mt-2 text-4xl font-black text-slate-950">{approvedItems.length}</div>
        </div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Siap Isi</div>
          <div className="mt-2 text-4xl font-black text-slate-950">{pendingItems.length > 0 ? 1 : 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Antrean PPPoE</h2>
          <div className="mt-4 space-y-3">
            {pendingItems.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                Tidak ada request PPPoE yang menunggu.
              </div>
            ) : (
              pendingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{item.id}</span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700">Pending</span>
                  </div>
                  <div className="mt-3 text-base font-black text-slate-950">{item.customerName}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.region}</div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          {selected ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{selected.id}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Pasang Baru</span>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">Request PPPoE</span>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">{selected.customerName}</h2>
                <div className="mt-2 text-sm text-slate-500">{selected.region} • {selected.packagePlan ?? '-'}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">Username PPPoE</span>
                  <input
                    type="text"
                    value={pppoeUsername}
                    onChange={(event) => setPppoeUsername(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">Password PPPoE</span>
                  <input
                    type="text"
                    value={pppoePassword}
                    onChange={(event) => setPppoePassword(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-700">VLAN</span>
                  <input
                    type="text"
                    value={vlan}
                    onChange={(event) => setVlan(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Opsional"
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Catatan NOC</span>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={openRejectModal}
                  className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
                >
                  Tolak Request
                </button>
                <button
                  type="button"
                  onClick={openApproveModal}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Simpan & Approve PPPoE
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-16 text-center text-sm text-slate-400">
              Pilih request PPPoE dari antrean.
            </div>
          )}
        </section>
      </div>

      <NotesActionModal
        open={Boolean(actionState)}
        title={actionState?.type === 'approve' ? 'Approve PPPoE' : 'Tolak Request PPPoE'}
        message={
          actionState?.type === 'approve'
            ? 'PPPoE akan dikirim kembali ke teknisi lapangan dan WO pasang baru bisa dilanjutkan ke submit akhir.'
            : 'Request PPPoE akan dikembalikan ke teknisi lapangan untuk diperbaiki.'
        }
        label="Catatan"
        value={notes}
        onChange={setNotes}
        confirmLabel={actionState?.type === 'approve' ? 'Approve' : 'Tolak'}
        tone={actionState?.type === 'approve' ? 'success' : 'danger'}
        loading={saving}
        onConfirm={handleConfirm}
        onCancel={closeModal}
      >
        {actionState?.type === 'approve' ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Username</div>
              <div className="mt-1 font-semibold">{pppoeUsername || '-'}</div>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">VLAN</div>
              <div className="mt-1 font-semibold">{vlan || '-'}</div>
            </div>
          </div>
        ) : null}
      </NotesActionModal>
    </div>
  );
};

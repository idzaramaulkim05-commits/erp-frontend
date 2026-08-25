import React, { useMemo, useState } from 'react';
import { Plus, Receipt, Trash2, Upload } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ReimbursementRequestItem } from '../../types';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface RequestRembesFormState {
  transactionDate: string;
  description: string;
  receipt: File | null;
  items: ReimbursementRequestItem[];
}

const createEmptyItem = (): ReimbursementRequestItem => ({
  itemName: '',
  quantity: 1,
  unit: 'Pcs',
  unitAmount: 0,
  subtotal: 0,
  notes: '',
});

const createInitialState = (): RequestRembesFormState => ({
  transactionDate: new Date().toISOString().slice(0, 10),
  description: '',
  receipt: null,
  items: [createEmptyItem()],
});

const statusToneMap = {
  draft: 'slate',
  pending_finance: 'amber',
  pending_management: 'violet',
  rejected: 'rose',
  approved: 'emerald',
  paid: 'sky',
} as const;

export const RequestRembesView: React.FC = () => {
  const {
    currentUser,
    reimbursementRequests,
    createReimbursementDraft,
    updateReimbursementDraft,
    submitReimbursementRequest,
  } = useIOMS();
  const [form, setForm] = useState<RequestRembesFormState>(createInitialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const myRequests = useMemo(
    () => currentUser.role === 'superadmin'
      ? reimbursementRequests
      : reimbursementRequests.filter((item) => item.requestedById === currentUser.id),
    [currentUser.id, currentUser.role, reimbursementRequests],
  );

  const totalClaim = useMemo(
    () => form.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unitAmount || 0)), 0),
    [form.items],
  );

  const updateItem = (index: number, next: Partial<ReimbursementRequestItem>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const merged = { ...item, ...next };
        return {
          ...merged,
          subtotal: (merged.quantity || 0) * (merged.unitAmount || 0),
        };
      }),
    }));
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append('transaction_date', form.transactionDate);
    payload.append('description', form.description);
    payload.append('items', JSON.stringify(
      form.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        unitAmount: item.unitAmount,
        notes: item.notes ?? '',
      })),
    ));

    if (form.receipt) {
      payload.append('receipt', form.receipt);
    }

    return payload;
  };

  const handleSave = async (mode: 'draft' | 'submit') => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = buildPayload();
      const saved = editingId
        ? await updateReimbursementDraft(editingId, payload)
        : await createReimbursementDraft(payload);

      if (mode === 'submit') {
        await submitReimbursementRequest(saved.id);
        setSuccess('Request rembes berhasil dikirim.');
      } else {
        setSuccess('Draft rembes berhasil disimpan.');
      }

      setEditingId(null);
      setForm(createInitialState());
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal memproses rembes.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (requestId: string) => {
    const selected = myRequests.find((item) => item.id === requestId);
    if (!selected) return;

    setEditingId(selected.id);
    setForm({
      transactionDate: selected.transactionDate,
      description: selected.description,
      receipt: null,
      items: selected.items.length > 0
        ? selected.items.map((item) => ({ ...item, subtotal: item.subtotal }))
        : [createEmptyItem()],
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <WorkspaceSectionShell eyebrow="Rembes" title="Request Rembes" badge={`${myRequests.length} request`}>
        <div className="grid gap-6 p-5 xl:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Tanggal Transaksi</span>
                <input
                  type="date"
                  value={form.transactionDate}
                  onChange={(event) => setForm((current) => ({ ...current, transactionDate: event.target.value }))}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Bukti Nota (Opsional)</span>
                <label className="flex h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 transition hover:border-emerald-300">
                  <Upload className="h-4 w-4 text-emerald-600" />
                  <span className="truncate">{form.receipt?.name ?? 'Pilih file'}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(event) => setForm((current) => ({ ...current, receipt: event.target.files?.[0] ?? null }))}
                  />
                </label>
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-800">Deskripsi</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Item Pengeluaran</span>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, items: [...current.items, createEmptyItem()] }))}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Item
                </button>
              </div>

              {form.items.map((item, index) => (
                <div key={`item-${index}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(event) => updateItem(index, { itemName: event.target.value })}
                      placeholder="Nama item"
                      className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 0 })}
                      placeholder="Qty"
                      className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400"
                    />
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(event) => updateItem(index, { unit: event.target.value })}
                      placeholder="Unit"
                      className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.unitAmount}
                      onChange={(event) => updateItem(index, { unitAmount: Number(event.target.value) || 0 })}
                      placeholder="Nominal"
                      className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400"
                    />
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm font-bold text-emerald-700">
                      <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      {form.items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))}
                          className="rounded-full p-1 text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <textarea
                    value={item.notes ?? ''}
                    onChange={(event) => updateItem(index, { notes: event.target.value })}
                    rows={2}
                    placeholder="Catatan item"
                    className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
              <span className="text-sm font-bold text-emerald-800">Total Klaim</span>
              <span className="text-lg font-black text-emerald-700">Rp {totalClaim.toLocaleString('id-ID')}</span>
            </div>

            {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
            {success ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

            <div className="flex flex-wrap justify-end gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(createInitialState());
                    setError(null);
                    setSuccess(null);
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                >
                  Batal Edit
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => void handleSave('draft')}
                disabled={loading}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 disabled:opacity-60"
              >
                {loading ? 'Memproses...' : 'Simpan Draft'}
              </button>
              <button
                type="button"
                onClick={() => void handleSave('submit')}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Memproses...' : 'Submit Rembes'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {myRequests.map((request) => (
              <div key={request.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{request.id}</div>
                    <div className="mt-1 text-sm text-slate-600">{request.description}</div>
                  </div>
                  <WorkspaceStatusPill
                    label={request.status.replaceAll('_', ' ').toUpperCase()}
                    tone={statusToneMap[request.status]}
                  />
                </div>

                <div className="mt-4 grid gap-2 text-xs text-slate-500">
                  <div>Tanggal: <span className="font-semibold text-slate-700">{request.transactionDate}</span></div>
                  <div>Total: <span className="font-semibold text-emerald-700">Rp {request.totalClaim.toLocaleString('id-ID')}</span></div>
                  <div>Item: <span className="font-semibold text-slate-700">{request.items.length}</span></div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {request.receiptUrl ? (
                    <a
                      href={request.receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      Nota
                    </a>
                  ) : null}
                  {request.status === 'draft' || request.status === 'rejected' ? (
                    <button
                      type="button"
                      onClick={() => handleEdit(request.id)}
                      className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                    >
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </WorkspaceSectionShell>
    </div>
  );
};

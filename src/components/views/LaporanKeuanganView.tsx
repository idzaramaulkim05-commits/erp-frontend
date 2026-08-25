import React, { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { FinanceMutation } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

const initialMutationState: Partial<FinanceMutation> = {
  transactionDate: new Date().toISOString().slice(0, 10),
  type: 'outflow',
  category: '',
  amount: 0,
  description: '',
  reference: '',
  status: 'posted',
};

export const LaporanKeuanganView: React.FC = () => {
  const {
    activeRole,
    financeMutations,
    financialLedger,
    createFinanceMutation,
    updateFinanceMutation,
    deleteFinanceMutation,
  } = useIOMS();
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    type: 'semua',
    source: 'semua',
    status: 'semua',
  });
  const [mutationForm, setMutationForm] = useState<Partial<FinanceMutation>>(initialMutationState);
  const [editingMutationId, setEditingMutationId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FinanceMutation | null>(null);
  const [loading, setLoading] = useState(false);
  const canManageMutation = activeRole === 'finance' || activeRole === 'superadmin';

  const filteredLedger = useMemo(() => financialLedger.filter((entry) => {
    if (filters.start && entry.transactionDate < filters.start) return false;
    if (filters.end && entry.transactionDate > filters.end) return false;
    if (filters.type !== 'semua' && entry.type !== filters.type) return false;
    if (filters.source !== 'semua' && entry.source !== filters.source) return false;
    if (filters.status !== 'semua' && (entry.status ?? '') !== filters.status) return false;
    return true;
  }), [filters, financialLedger]);

  const summary = useMemo(() => ({
    inflow: filteredLedger.filter((entry) => entry.type === 'inflow').reduce((sum, entry) => sum + entry.amount, 0),
    reimburseOutflow: filteredLedger.filter((entry) => entry.source === 'reimburse').reduce((sum, entry) => sum + entry.amount, 0),
    manualInflow: filteredLedger.filter((entry) => entry.source === 'manual_mutation' && entry.type === 'inflow').reduce((sum, entry) => sum + entry.amount, 0),
    manualOutflow: filteredLedger.filter((entry) => entry.source === 'manual_mutation' && entry.type === 'outflow').reduce((sum, entry) => sum + entry.amount, 0),
  }), [filteredLedger]);

  const handleSaveMutation = async () => {
    setLoading(true);
    try {
      if (editingMutationId) {
        await updateFinanceMutation(editingMutationId, mutationForm);
      } else {
        await createFinanceMutation(mutationForm);
      }
      setEditingMutationId(null);
      setMutationForm(initialMutationState);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceSectionShell eyebrow="Keuangan" title="Laporan Keuangan" badge={`${filteredLedger.length} transaksi`}>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Total Pemasukan</div>
            <div className="mt-2 text-3xl font-black text-emerald-700">Rp {summary.inflow.toLocaleString('id-ID')}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Rembes Dibayar</div>
            <div className="mt-2 text-3xl font-black text-rose-700">Rp {summary.reimburseOutflow.toLocaleString('id-ID')}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mutasi Manual Masuk</div>
            <div className="mt-2 text-3xl font-black text-sky-700">Rp {summary.manualInflow.toLocaleString('id-ID')}</div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Mutasi Manual Keluar</div>
            <div className="mt-2 text-3xl font-black text-amber-700">Rp {summary.manualOutflow.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </WorkspaceSectionShell>

      {canManageMutation ? (
        <WorkspaceSectionShell eyebrow="Mutasi Manual" title={editingMutationId ? 'Edit Mutasi' : 'Tambah Mutasi'}>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
            <input type="date" value={mutationForm.transactionDate ?? ''} onChange={(event) => setMutationForm((current) => ({ ...current, transactionDate: event.target.value }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400" />
            <select value={mutationForm.type ?? 'outflow'} onChange={(event) => setMutationForm((current) => ({ ...current, type: event.target.value as 'inflow' | 'outflow' }))} className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400">
              <option value="inflow">Inflow</option>
              <option value="outflow">Outflow</option>
            </select>
            <input type="text" value={mutationForm.category ?? ''} onChange={(event) => setMutationForm((current) => ({ ...current, category: event.target.value }))} placeholder="Kategori" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400" />
            <input type="number" min={0} value={mutationForm.amount ?? 0} onChange={(event) => setMutationForm((current) => ({ ...current, amount: Number(event.target.value) || 0 }))} placeholder="Nominal" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400" />
            <input type="text" value={mutationForm.reference ?? ''} onChange={(event) => setMutationForm((current) => ({ ...current, reference: event.target.value }))} placeholder="Referensi" className="h-11 rounded-2xl border border-slate-200 px-4 text-sm outline-none focus:border-emerald-400" />
            <button type="button" onClick={() => void handleSaveMutation()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {editingMutationId ? 'Simpan' : 'Tambah'}
            </button>
            <textarea value={mutationForm.description ?? ''} onChange={(event) => setMutationForm((current) => ({ ...current, description: event.target.value }))} placeholder="Deskripsi" rows={3} className="md:col-span-2 xl:col-span-6 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-400" />
          </div>
        </WorkspaceSectionShell>
      ) : null}

      <WorkspaceSectionShell eyebrow="Ledger" title="Transaksi" actions={
        <div className="flex flex-wrap gap-2">
          <input type="date" value={filters.start} onChange={(event) => setFilters((current) => ({ ...current, start: event.target.value }))} className="h-10 rounded-2xl border border-slate-200 px-3 text-xs outline-none" />
          <input type="date" value={filters.end} onChange={(event) => setFilters((current) => ({ ...current, end: event.target.value }))} className="h-10 rounded-2xl border border-slate-200 px-3 text-xs outline-none" />
          <select value={filters.type} onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))} className="h-10 rounded-2xl border border-slate-200 px-3 text-xs outline-none">
            <option value="semua">Semua Jenis</option>
            <option value="inflow">Inflow</option>
            <option value="outflow">Outflow</option>
          </select>
          <select value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))} className="h-10 rounded-2xl border border-slate-200 px-3 text-xs outline-none">
            <option value="semua">Semua Sumber</option>
            <option value="billing">Billing</option>
            <option value="reimburse">Rembes</option>
            <option value="manual_mutation">Mutasi Manual</option>
          </select>
        </div>
      }>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Deskripsi</th>
                <th className="px-4 py-3">Nominal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedger.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-semibold text-slate-800">{entry.transactionDate}</td>
                  <td className="px-4 py-3">{entry.source}</td>
                  <td className="px-4 py-3">{entry.category}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusPill label={entry.type.toUpperCase()} tone={entry.type === 'inflow' ? 'emerald' : 'rose'} />
                  </td>
                  <td className="px-4 py-3">{entry.description}</td>
                  <td className="px-4 py-3 font-bold text-slate-900">Rp {entry.amount.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">{entry.status ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspaceSectionShell>

      {canManageMutation ? (
        <WorkspaceSectionShell eyebrow="Mutasi Manual" title="Data Mutasi Manual" badge={`${financeMutations.length} mutasi`}>
          <div className="divide-y divide-slate-100">
            {financeMutations.map((mutation) => (
              <div key={mutation.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-black text-slate-950">{mutation.category}</div>
                  <div className="mt-1 text-xs text-slate-500">{mutation.transactionDate} • {mutation.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <WorkspaceStatusPill label={mutation.type.toUpperCase()} tone={mutation.type === 'inflow' ? 'emerald' : 'rose'} />
                  <span className="text-sm font-bold text-slate-900">Rp {mutation.amount.toLocaleString('id-ID')}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMutationId(mutation.id);
                      setMutationForm(mutation);
                    }}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(mutation)}
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </WorkspaceSectionShell>
      ) : null}

      <ConfirmActionModal
        open={!!deleteTarget}
        title="Hapus Mutasi"
        message={`Hapus mutasi ${deleteTarget?.id ?? ''}?`}
        confirmLabel="Hapus"
        tone="danger"
        loading={loading}
        onConfirm={() => {
          if (!deleteTarget) return;
          void (async () => {
            setLoading(true);
            try {
              await deleteFinanceMutation(deleteTarget.id);
              setDeleteTarget(null);
            } finally {
              setLoading(false);
            }
          })();
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

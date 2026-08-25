import React, { useMemo, useState } from 'react';
import { Receipt } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ReimbursementRequest } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

type ApprovalActionState =
  | { type: 'finance_reject' | 'finance_forward' | 'management_reject'; request: ReimbursementRequest; notes: string }
  | { type: 'finance_approve' | 'management_approve' | 'mark_paid'; request: ReimbursementRequest };

const statusToneMap = {
  draft: 'slate',
  pending_finance: 'amber',
  pending_management: 'violet',
  rejected: 'rose',
  approved: 'emerald',
  paid: 'sky',
} as const;

const groupStatuses = [
  { key: 'pending_finance', title: 'Menunggu Finance' },
  { key: 'pending_management', title: 'Diteruskan ke Management' },
  { key: 'approved', title: 'Approved Belum Dibayar' },
  { key: 'paid', title: 'Paid' },
  { key: 'rejected', title: 'Rejected' },
] as const;

export const ApprovalRembesFinanceView: React.FC = () => {
  const {
    activeRole,
    reimbursementRequests,
    financeApproveReimbursement,
    financeRejectReimbursement,
    forwardReimbursementToManagement,
    managementApproveReimbursement,
    managementRejectReimbursement,
    markReimbursementPaid,
  } = useIOMS();
  const [actionState, setActionState] = useState<ApprovalActionState | null>(null);
  const [loading, setLoading] = useState(false);
  const canFinance = activeRole === 'finance' || activeRole === 'superadmin';
  const canManagement = activeRole === 'management' || activeRole === 'superadmin';

  const grouped = useMemo(
    () => Object.fromEntries(groupStatuses.map((group) => [
      group.key,
      reimbursementRequests.filter((item) => item.status === group.key),
    ])),
    [reimbursementRequests],
  ) as Record<(typeof groupStatuses)[number]['key'], ReimbursementRequest[]>;

  const handleAction = async () => {
    if (!actionState) return;
    setLoading(true);

    try {
      if (actionState.type === 'finance_approve') {
        await financeApproveReimbursement(actionState.request.id);
      } else if (actionState.type === 'finance_reject') {
        await financeRejectReimbursement(actionState.request.id, actionState.notes);
      } else if (actionState.type === 'finance_forward') {
        await forwardReimbursementToManagement(actionState.request.id, actionState.notes);
      } else if (actionState.type === 'management_approve') {
        await managementApproveReimbursement(actionState.request.id);
      } else if (actionState.type === 'management_reject') {
        await managementRejectReimbursement(actionState.request.id, actionState.notes);
      } else {
        await markReimbursementPaid(actionState.request.id);
      }
      setActionState(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {groupStatuses.map((group) => (
        <WorkspaceSectionShell
          key={group.key}
          eyebrow="Rembes"
          title={group.title}
          badge={`${grouped[group.key].length} data`}
        >
          <div className="grid gap-4 p-5 xl:grid-cols-2">
            {grouped[group.key].length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-400 xl:col-span-2">
                Tidak ada data.
              </div>
            ) : grouped[group.key].map((request) => (
              <div key={request.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{request.id}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-700">{request.requestedByName}</div>
                    <div className="text-xs text-slate-500">{request.requesterDivision}</div>
                  </div>
                  <WorkspaceStatusPill
                    label={request.status.replaceAll('_', ' ').toUpperCase()}
                    tone={statusToneMap[request.status]}
                  />
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div>{request.description}</div>
                  <div>Tanggal: <span className="font-semibold text-slate-800">{request.transactionDate}</span></div>
                  <div>Total: <span className="font-semibold text-emerald-700">Rp {request.totalClaim.toLocaleString('id-ID')}</span></div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="space-y-2 text-xs text-slate-600">
                    {request.items.map((item) => (
                      <div key={`${request.id}-${item.id ?? item.itemName}`} className="flex items-center justify-between gap-3">
                        <span>{item.itemName} • {item.quantity} {item.unit}</span>
                        <span className="font-semibold text-slate-800">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
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

                  {canFinance && request.status === 'pending_finance' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionState({ type: 'finance_approve', request })}
                        className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionState({ type: 'finance_forward', request, notes: 'Perlu approval management.' })}
                        className="rounded-2xl bg-violet-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Teruskan
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionState({ type: 'finance_reject', request, notes: 'Mohon revisi detail rembes.' })}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {canManagement && request.status === 'pending_management' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setActionState({ type: 'management_approve', request })}
                        className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Approve Management
                      </button>
                      <button
                        type="button"
                        onClick={() => setActionState({ type: 'management_reject', request, notes: 'Belum dapat disetujui.' })}
                        className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {canFinance && request.status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => setActionState({ type: 'mark_paid', request })}
                      className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-bold text-white"
                    >
                      Tandai Paid
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </WorkspaceSectionShell>
      ))}

      <ConfirmActionModal
        open={actionState?.type === 'finance_approve' || actionState?.type === 'management_approve' || actionState?.type === 'mark_paid'}
        title={
          actionState?.type === 'mark_paid'
            ? 'Tandai Sudah Dibayar'
            : actionState?.type === 'management_approve'
            ? 'Approve Management'
            : 'Approve Finance'
        }
        message={`Lanjutkan proses untuk ${actionState?.request.id ?? '-'}.`}
        confirmLabel="Lanjutkan"
        loading={loading}
        tone="success"
        onConfirm={() => void handleAction()}
        onCancel={() => setActionState(null)}
      />

      <NotesActionModal
        open={
          actionState?.type === 'finance_reject'
          || actionState?.type === 'finance_forward'
          || actionState?.type === 'management_reject'
        }
        title={
          actionState?.type === 'finance_forward'
            ? 'Teruskan ke Management'
            : 'Catatan Keputusan'
        }
        message={`Lengkapi catatan untuk ${actionState?.request.id ?? '-'}.`}
        label="Catatan"
        value={'notes' in (actionState ?? {}) ? actionState?.notes ?? '' : ''}
        onChange={(value) => {
          if (!actionState || !('notes' in actionState)) return;
          setActionState({ ...actionState, notes: value });
        }}
        confirmLabel="Simpan"
        loading={loading}
        tone={actionState?.type === 'finance_forward' ? 'warning' : 'danger'}
        onConfirm={() => void handleAction()}
        onCancel={() => setActionState(null)}
      />
    </div>
  );
};

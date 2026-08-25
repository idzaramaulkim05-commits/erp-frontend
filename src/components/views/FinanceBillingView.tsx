import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Landmark,
  Receipt,
  UserX,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, ProcurementRequest, WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

type FinanceConfirmationState =
  | {
      type: 'customer_status';
      customer: Customer;
      nextStatus: 'uninstal_pending';
      notes: string;
    }
  | {
      type: 'customer_payment';
      customer: Customer;
      notes: string;
    }
  | {
      type: 'procurement_approve';
      request: ProcurementRequest;
      notes: string;
    }
  | {
      type: 'procurement_reject';
      request: ProcurementRequest;
      notes: string;
    }
  | {
      type: 'installation_cash';
      workOrder: WorkOrder;
      notes: string;
    }
  | {
      type: 'installation_transfer';
      workOrder: WorkOrder;
      notes: string;
    };

export const FinanceBillingView: React.FC = () => {
  const {
    customers,
    procurementRequests,
    workOrders,
    updateCustomerStatus,
    recordCustomerPayment,
    approveProcurementByFinance,
    rejectProcurementByFinance,
    confirmInstallationCashPayment,
    confirmInstallationTransferPayment,
    searchQuery,
  } = useIOMS();

  const [selectedBillingStatus, setSelectedBillingStatus] = useState<string>('all');
  const [confirmationState, setConfirmationState] = useState<FinanceConfirmationState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const filteredCustomers = customers.filter((customer) => {
    if (selectedBillingStatus === 'unpaid' && customer.billingStatus !== 'unpaid') return false;
    if (selectedBillingStatus === 'paid' && customer.billingStatus !== 'paid') return false;
    if (selectedBillingStatus === 'uninstal' && customer.status !== 'uninstal_pending' && customer.status !== 'uninstalled') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.id.toLowerCase().includes(q) ||
        customer.pppoeUsername.toLowerCase().includes(q) ||
        customer.region.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalPaidRevenue = customers
    .filter((customer) => customer.billingStatus === 'paid')
    .reduce((sum, customer) => sum + customer.monthlyFee, 0);

  const totalUnpaidReceivable = customers
    .filter((customer) => customer.billingStatus === 'unpaid')
    .reduce((sum, customer) => sum + customer.monthlyFee, 0);

  const pendingProcurementForFinance = procurementRequests.filter((request) => request.status === 'pending_finance');
  const autoUninstallPending = customers.filter((customer) => customer.status === 'uninstal_pending').length;
  const pendingInstallationPayments = workOrders.filter((item) =>
    item.type === 'installation'
    && item.installationPaymentStatus === 'pending_finance'
    && item.installationPaymentCustomerPaid === true,
  );
  const pendingInstallationCash = pendingInstallationPayments.filter((item) => item.installationPaymentMethod === 'tunai');
  const pendingInstallationTransfer = pendingInstallationPayments.filter((item) => item.installationPaymentMethod === 'transfer');

  const handleConfirmFinanceAction = async () => {
    if (!confirmationState) return;

    setConfirmLoading(true);
    try {
      if (confirmationState.type === 'customer_status') {
        await updateCustomerStatus(confirmationState.customer.id, confirmationState.nextStatus, confirmationState.notes);
      } else if (confirmationState.type === 'customer_payment') {
        await recordCustomerPayment(confirmationState.customer.id, confirmationState.notes);
      } else if (confirmationState.type === 'procurement_approve') {
        await approveProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      } else if (confirmationState.type === 'procurement_reject') {
        await rejectProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      } else if (confirmationState.type === 'installation_cash') {
        await confirmInstallationCashPayment(confirmationState.workOrder.id, confirmationState.notes);
      } else {
        await confirmInstallationTransferPayment(confirmationState.workOrder.id, confirmationState.notes);
      }
      setConfirmationState(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="Finance Operations"
        title="Billing pelanggan, pencabutan layanan, dan approval procurement"
        subtitle="Dashboard utama finance."
        stats={[
          {
            label: 'Tagihan Lunas',
            value: `Rp ${totalPaidRevenue.toLocaleString('id-ID')}`,
            description: `${customers.filter((customer) => customer.billingStatus === 'paid').length} pelanggan aktif lunas bulan ini.`,
            icon: CheckCircle2,
            accentClass: 'bg-emerald-400/15 text-emerald-200',
          },
          {
            label: 'Piutang Aktif',
            value: `Rp ${totalUnpaidReceivable.toLocaleString('id-ID')}`,
            description: `${customers.filter((customer) => customer.billingStatus === 'unpaid').length} pelanggan tertunggak.`,
            icon: AlertCircle,
            accentClass: 'bg-rose-400/15 text-rose-200',
          },
          {
            label: 'Auto Cabut',
            value: autoUninstallPending,
            description: 'Layanan existing yang sudah menunggu WO pencabutan.',
            icon: UserX,
            accentClass: 'bg-violet-400/15 text-violet-200',
          },
          {
            label: 'Procurement',
            value: pendingProcurementForFinance.length,
            description: 'Pengajuan gudang yang masih menunggu ACC finance.',
            icon: Receipt,
            accentClass: 'bg-amber-400/15 text-amber-200',
          },
        ]}
      />

      <WorkspaceSectionShell
        eyebrow="Procurement Approval"
        title="Pengesahan permintaan pengadaan gudang"
        badge={`${pendingProcurementForFinance.length} menunggu approval`}
      >
        <div className="divide-y divide-slate-100">
          {procurementRequests.map((request) => {
            const isPendingFinance = request.status === 'pending_finance';

            return (
              <div key={request.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{request.id}</span>
                    <span className="font-bold text-sm text-slate-900">{request.itemName}</span>
                    <WorkspaceStatusPill
                      label={request.status.toUpperCase()}
                      tone={
                        request.status === 'approved'
                          ? 'emerald'
                          : request.status === 'pending_management'
                          ? 'violet'
                          : request.status === 'received'
                          ? 'sky'
                          : 'amber'
                      }
                    />
                  </div>

                  <p className="text-xs text-slate-600">Alasan: {request.reason}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                    <span>Jumlah: <strong>{request.quantity} {request.unit}</strong></span>
                    <span>Total: <strong className="text-emerald-700 font-mono">Rp {request.totalAmount.toLocaleString('id-ID')}</strong></span>
                    <span>Diajukan: {request.requestedBy}</span>
                  </div>
                  {request.rejectionNotes ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      <span className="font-bold">Catatan revisi terakhir:</span> {request.rejectionNotes}
                    </div>
                  ) : null}
                </div>

                {isPendingFinance && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmationState({
                        type: 'procurement_approve',
                        request,
                        notes: 'Cash flow mencukupi untuk restock.',
                      })}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      {request.totalAmount > 5000000 ? 'Setujui & Teruskan ke Direktur' : 'Setujui Pengadaan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmationState({
                        type: 'procurement_reject',
                        request,
                        notes: 'Mohon revisi estimasi harga, qty, atau alasan kebutuhan.',
                      })}
                      className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                    >
                      Tolak & Minta Revisi
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </WorkspaceSectionShell>

      <WorkspaceSectionShell
        eyebrow="Biaya Pemasangan"
        title="Konfirmasi pemasukan instalasi baru"
        badge={`${pendingInstallationPayments.length} menunggu finance`}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Tunai dari Teknisi</h3>
                <div className="text-xs font-semibold text-slate-500">{pendingInstallationCash.length} item</div>
              </div>
            </div>

            {pendingInstallationCash.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                Tidak ada pemasangan tunai yang menunggu.
              </div>
            ) : pendingInstallationCash.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{item.id}</span>
                  <WorkspaceStatusPill label="Tunai" tone="amber" />
                </div>
                <div className="mt-3 text-base font-black text-slate-950">{item.customerName}</div>
                <div className="mt-1 text-sm text-slate-500">{item.region}</div>
                <div className="mt-3 text-sm font-semibold text-emerald-700">
                  Rp {(item.installationFeeActual ?? 0).toLocaleString('id-ID')}
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmationState({
                    type: 'installation_cash',
                    workOrder: item,
                    notes: 'Uang pemasangan tunai sudah diserahkan teknisi ke finance.',
                  })}
                  className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Pembayaran Sudah Diserahkan ke Finance
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950">Transfer Menunggu Konfirmasi Finance</h3>
                <div className="text-xs font-semibold text-slate-500">{pendingInstallationTransfer.length} item</div>
              </div>
            </div>

            {pendingInstallationTransfer.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
                Tidak ada transfer pemasangan yang menunggu.
              </div>
            ) : pendingInstallationTransfer.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{item.id}</span>
                  <WorkspaceStatusPill label="Transfer" tone="sky" />
                </div>
                <div className="mt-3 text-base font-black text-slate-950">{item.customerName}</div>
                <div className="mt-1 text-sm text-slate-500">{item.region}</div>
                <div className="mt-3 text-sm font-semibold text-emerald-700">
                  Rp {(item.installationFeeActual ?? 0).toLocaleString('id-ID')}
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmationState({
                    type: 'installation_transfer',
                    workOrder: item,
                    notes: 'Pembayaran transfer pemasangan sudah terkonfirmasi oleh finance.',
                  })}
                  className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                >
                  Pembayaran Transfer Terkonfirmasi
                </button>
              </div>
            ))}
          </div>
        </div>
      </WorkspaceSectionShell>

      <WorkspaceSectionShell
        eyebrow="Billing Existing"
        title="Data pelanggan, pembayaran, dan pemicu pencabutan perangkat"
        badge={`${filteredCustomers.length} pelanggan terlihat`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'paid', label: 'Paid' },
              { key: 'unpaid', label: 'Unpaid' },
              { key: 'uninstal', label: 'Uninstal' },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setSelectedBillingStatus(filter.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  selectedBillingStatus === filter.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">ID & Pelanggan</th>
                <th className="px-4 py-3">Paket & Tagihan</th>
                <th className="px-4 py-3">User PPPoE</th>
                <th className="px-4 py-3">Status Tagihan</th>
                <th className="px-4 py-3">Status Layanan</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{customer.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{customer.id} - {customer.region}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{customer.packagePlan}</div>
                    <div className="text-[11px] text-emerald-700 font-mono font-bold">
                      Rp {customer.monthlyFee.toLocaleString('id-ID')} / bln
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{customer.pppoeUsername}</td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusPill
                      label={customer.billingStatus.toUpperCase()}
                      tone={customer.billingStatus === 'paid' ? 'emerald' : 'rose'}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <WorkspaceStatusPill
                      label={customer.status === 'uninstal_pending' ? 'CABUT PENDING' : customer.status.toUpperCase()}
                      tone={
                        customer.status === 'active'
                          ? 'emerald'
                          : customer.status === 'uninstal_pending'
                          ? 'rose'
                          : 'amber'
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {customer.status !== 'uninstal_pending' && customer.status !== 'uninstalled' && (
                        <button
                          type="button"
                          onClick={() => setConfirmationState({
                            type: 'customer_status',
                            customer,
                            nextStatus: 'uninstal_pending',
                            notes: 'Permintaan berhenti berlangganan / tunggakan',
                          })}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                          title="Picu pencabutan modem otomatis"
                        >
                          Cabut Alat
                        </button>
                      )}

                      {customer.billingStatus === 'unpaid' && (
                        <button
                          type="button"
                          onClick={() => setConfirmationState({
                            type: 'customer_payment',
                            customer,
                            notes: 'Pembayaran pelanggan diterima dan masa aktif diperpanjang 30 hari.',
                          })}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          Set Lunas
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WorkspaceSectionShell>

      <ConfirmActionModal
        open={
          confirmationState !== null
          && confirmationState.type !== 'procurement_reject'
          && confirmationState.type !== 'installation_cash'
          && confirmationState.type !== 'installation_transfer'
        }
        title={
          confirmationState?.type === 'procurement_approve'
            ? 'Konfirmasi Approval Procurement'
            : confirmationState?.type === 'customer_payment'
            ? 'Konfirmasi Pembayaran Pelanggan'
            : 'Konfirmasi Cabut Alat'
        }
        message={
          confirmationState?.type === 'procurement_approve'
            ? `Request procurement ${confirmationState.request.id} untuk ${confirmationState.request.itemName} akan disetujui oleh Finance${confirmationState.request.totalAmount > 5000000 ? ' dan diteruskan ke Direktur' : ''}. Pastikan nominal dan kebutuhan pengadaan sudah benar.`
            : confirmationState?.type === 'customer_payment'
            ? `Pembayaran pelanggan ${confirmationState.customer.name} (${confirmationState.customer.id}) akan dicatat dan masa aktif paketnya diperpanjang 30 hari sesuai aturan billing baru.`
            : confirmationState
            ? `Layanan pelanggan ${confirmationState.customer.name} (${confirmationState.customer.id}) akan masuk ke status cabut alat. Sistem akan menyiapkan WO pencabutan perangkat untuk teknisi.`
            : ''
        }
        confirmLabel={
          confirmationState?.type === 'procurement_approve'
            ? 'Ya, Setujui'
            : confirmationState?.type === 'customer_payment'
            ? 'Ya, Catat Pembayaran'
            : 'Ya, Cabut Alat'
        }
        tone={
          confirmationState?.type === 'customer_status'
            ? 'danger'
            : 'success'
        }
        loading={confirmLoading}
        onCancel={() => setConfirmationState(null)}
        onConfirm={() => void handleConfirmFinanceAction()}
      />

      <NotesActionModal
        open={
          confirmationState?.type === 'procurement_reject'
          || confirmationState?.type === 'installation_cash'
          || confirmationState?.type === 'installation_transfer'
        }
        title={
          confirmationState?.type === 'procurement_reject'
            ? 'Tolak Pengadaan & Kembalikan ke Warehouse'
            : confirmationState?.type === 'installation_cash'
            ? 'Konfirmasi Tunai dari Teknisi'
            : 'Konfirmasi Transfer Pemasangan'
        }
        message={
          confirmationState?.type === 'procurement_reject'
            ? 'Finance akan mengembalikan request ini ke warehouse dengan status revisi. Request yang sama nanti bisa diedit dan disubmit ulang tanpa membuat ID baru.'
            : confirmationState?.type === 'installation_cash'
            ? `Setelah dikonfirmasi, pemasukan biaya pemasangan ${confirmationState.workOrder.customerName} akan masuk ke mutasi keuangan.`
            : confirmationState?.type === 'installation_transfer'
            ? `Setelah dikonfirmasi, pemasukan transfer pemasangan ${confirmationState.workOrder.customerName} akan masuk ke mutasi keuangan.`
            : ''
        }
        label={
          confirmationState?.type === 'procurement_reject'
            ? 'Catatan Revisi Finance'
            : 'Catatan Finance'
        }
        value={confirmationState?.notes ?? ''}
        onChange={(value) => {
          setConfirmationState((current) =>
            current
              ? { ...current, notes: value }
              : current,
          );
        }}
        placeholder={
          confirmationState?.type === 'procurement_reject'
            ? 'Tulis alasan penolakan, koreksi budget, atau data yang perlu direvisi warehouse.'
            : 'Tulis catatan konfirmasi finance.'
        }
        confirmLabel={
          confirmationState?.type === 'procurement_reject'
            ? 'Tolak & Kirim Revisi'
            : confirmationState?.type === 'installation_cash'
            ? 'Konfirmasi Tunai'
            : 'Konfirmasi Transfer'
        }
        cancelLabel="Batal"
        tone={confirmationState?.type === 'procurement_reject' ? 'danger' : 'success'}
        loading={confirmLoading}
        onCancel={() => setConfirmationState(null)}
        onConfirm={() => void handleConfirmFinanceAction()}
      />
    </div>
  );
};

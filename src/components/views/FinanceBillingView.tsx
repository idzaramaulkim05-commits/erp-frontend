import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Landmark,
  Receipt,
  UserX,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, MasterDataGroup, ProcurementRequest, WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { InvoiceModal } from '../modals/InvoiceModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { PaymentConfirmationModal } from '../modals/PaymentConfirmationModal';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
import { DEFAULT_PAYMENT_CHANNELS, PaymentChannelItem } from '../../utils/invoice';

type FinanceConfirmationState =
  | {
      type: 'customer_status';
      customer: Customer;
      nextStatus: 'uninstal_pending';
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
    };

export const FinanceBillingView: React.FC = () => {
  const { authFetch } = useAuth();
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
  const [installationFilter, setInstallationFilter] = useState<'all' | 'tunai' | 'transfer'>('all');
  const [confirmationState, setConfirmationState] = useState<FinanceConfirmationState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Modals for Invoice & Dynamic Payments
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState<Customer | null>(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedWoForPayment, setSelectedWoForPayment] = useState<WorkOrder | null>(null);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelItem[]>(DEFAULT_PAYMENT_CHANNELS);

  // Fetch Payment Channels from Master Data
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await authFetch<{ data: MasterDataGroup[] }>('/admin/master-data');
        const channelGroup = response.data.find((g) => g.key === 'payment_channels');
        if (channelGroup && Array.isArray(channelGroup.items) && channelGroup.items.length > 0) {
          const mapped: PaymentChannelItem[] = channelGroup.items.map((item: Record<string, unknown>) => ({
            name: String(item.name || 'Metode Pembayaran'),
            accountNumber: item.accountNumber ? String(item.accountNumber) : undefined,
            accountHolder: item.accountHolder ? String(item.accountHolder) : undefined,
            type: item.type ? String(item.type) : undefined,
          }));
          setPaymentChannels(mapped);
        }
      } catch {
        setPaymentChannels(DEFAULT_PAYMENT_CHANNELS);
      }
    };
    void fetchChannels();
  }, []);

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

  const filteredPendingInstallations = pendingInstallationPayments.filter((item) => {
    if (installationFilter === 'tunai') return item.installationPaymentMethod === 'tunai';
    if (installationFilter === 'transfer') return item.installationPaymentMethod === 'transfer';
    return true;
  });

  const handleConfirmFinanceAction = async () => {
    if (!confirmationState) return;

    setConfirmLoading(true);
    try {
      if (confirmationState.type === 'customer_status') {
        await updateCustomerStatus(confirmationState.customer.id, confirmationState.nextStatus, confirmationState.notes);
      } else if (confirmationState.type === 'procurement_approve') {
        await approveProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      } else if (confirmationState.type === 'procurement_reject') {
        await rejectProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      }
      setConfirmationState(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmCustomerPayment = async (payload: { paymentChannel: string; paidAt: string; notes: string }) => {
    if (!selectedCustomerForPayment) return;

    setConfirmLoading(true);
    try {
      await recordCustomerPayment(
        selectedCustomerForPayment.id,
        payload.notes,
        payload.paidAt,
        payload.paymentChannel,
      );
      setSelectedCustomerForPayment(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmWoInstallationPayment = async (payload: { paymentChannel: string; paidAt: string; notes: string }) => {
    if (!selectedWoForPayment) return;

    setConfirmLoading(true);
    try {
      if (selectedWoForPayment.installationPaymentMethod === 'tunai') {
        await confirmInstallationCashPayment(selectedWoForPayment.id, payload.notes, payload.paymentChannel);
      } else {
        await confirmInstallationTransferPayment(selectedWoForPayment.id, payload.notes, payload.paymentChannel);
      }
      setSelectedWoForPayment(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="Finance Operations"
        title="Billing pelanggan, konfirmasi biaya pasang baru & approval procurement"
        subtitle="Pusat kendali keuangan ISP: penagihan bulanan, penerimaan setoran pasang baru, mutasi kas/bank, dan persetujuan pengadaan barang."
        stats={[
          {
            label: 'Tagihan Lunas',
            value: `Rp ${totalPaidRevenue.toLocaleString('id-ID')}`,
            description: `${customers.filter((customer) => customer.billingStatus === 'paid').length} pelanggan aktif lunas.`,
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
            label: 'Pasang Baru Pending',
            value: `${pendingInstallationPayments.length} WO`,
            description: `${pendingInstallationCash.length} Tunai disetor teknisi, ${pendingInstallationTransfer.length} Transfer.`,
            icon: Wallet,
            accentClass: 'bg-amber-400/15 text-amber-200',
          },
          {
            label: 'Auto Cabut',
            value: autoUninstallPending,
            description: 'Layanan yang menunggu WO pencabutan.',
            icon: UserX,
            accentClass: 'bg-violet-400/15 text-violet-200',
          },
        ]}
      />

      {/* SECTION: Konfirmasi Pemasangan Pending */}
      <WorkspaceSectionShell
        eyebrow="Pemasangan Pasang Baru"
        title="Konfirmasi Pemasangan Pending (Biaya Pasang Baru)"
        badge={`${pendingInstallationPayments.length} menunggu konfirmasi finance`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `Semua (${pendingInstallationPayments.length})` },
              { key: 'tunai', label: `Tunai Teknisi (${pendingInstallationCash.length})` },
              { key: 'transfer', label: `Transfer Pelanggan (${pendingInstallationTransfer.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setInstallationFilter(tab.key as 'all' | 'tunai' | 'transfer')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  installationFilter === tab.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-5">
          {filteredPendingInstallations.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-400">
              Tidak ada biaya pemasangan baru yang sedang menunggu konfirmasi finance.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPendingInstallations.map((item) => {
                const isCash = item.installationPaymentMethod === 'tunai';
                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 transition hover:bg-white hover:shadow-md"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{item.id}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            isCash ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {isCash ? '💵 Tunai Teknisi' : '🏦 Transfer'}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-950">{item.customerName}</h4>
                        <p className="text-xs text-slate-500">{item.region} • {item.address}</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Biaya Pemasangan:</span>
                          <span className="font-bold text-emerald-700 font-mono">
                            Rp {(item.installationFeeActual ?? 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Teknisi Pelaksana:</span>
                          <span className="font-semibold text-slate-800">
                            {item.assignedTechName || 'Teknisi Lapangan'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Status Pembayaran:</span>
                          <span className="font-bold text-amber-700">Menunggu ACC Finance</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 italic">
                        {isCash
                          ? 'Uang tunai diterima teknisi di lapangan dan siap disetorkan ke kasir finance kantor.'
                          : 'Pelanggan membayar via transfer bank ke rekening kantor.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedWoForPayment(item)}
                      className={`mt-4 w-full rounded-2xl py-3 text-xs font-bold text-white transition shadow-xs flex items-center justify-center gap-2 ${
                        isCash
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-sky-600 hover:bg-sky-700'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Konfirmasi Penerimaan Uang
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </WorkspaceSectionShell>

      {/* SECTION: Procurement Approval */}
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

      {/* SECTION: Billing Existing Customers */}
      <WorkspaceSectionShell
        eyebrow="Billing Existing"
        title="Data Pelanggan, Invoice, dan Pembayaran Langganan"
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
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID & Pelanggan</th>
                <th className="px-4 py-3">Paket & Tagihan</th>
                <th className="px-4 py-3">User PPPoE</th>
                <th className="px-4 py-3">Status Tagihan</th>
                <th className="px-4 py-3">Status Layanan</th>
                <th className="px-4 py-3 text-right">Aksi Finance</th>
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
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* Invoice & WA Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCustomerForInvoice(customer)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        Invoice & WA
                      </button>

                      {customer.status !== 'uninstal_pending' && customer.status !== 'uninstalled' && (
                        <button
                          type="button"
                          onClick={() => setConfirmationState({
                            type: 'customer_status',
                            customer,
                            nextStatus: 'uninstal_pending',
                            notes: 'Permintaan berhenti berlangganan / tunggakan',
                          })}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                          title="Picu pencabutan modem otomatis"
                        >
                          Cabut Alat
                        </button>
                      )}

                      {customer.billingStatus === 'unpaid' && (
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForPayment(customer)}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700 shadow-xs"
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

      {/* Invoice & WhatsApp Copy Modal */}
      <InvoiceModal
        open={selectedCustomerForInvoice !== null}
        customer={selectedCustomerForInvoice}
        paymentChannels={paymentChannels}
        onClose={() => setSelectedCustomerForInvoice(null)}
      />

      {/* Customer Billing Payment Confirmation Modal */}
      {selectedCustomerForPayment && (
        <PaymentConfirmationModal
          open={selectedCustomerForPayment !== null}
          title="Konfirmasi Pembayaran Tagihan Pelanggan"
          customerName={selectedCustomerForPayment.name}
          customerIdOrWo={selectedCustomerForPayment.id}
          amount={selectedCustomerForPayment.monthlyFee}
          paymentType="billing"
          paymentChannels={paymentChannels}
          loading={confirmLoading}
          onCancel={() => setSelectedCustomerForPayment(null)}
          onConfirm={handleConfirmCustomerPayment}
        />
      )}

      {/* Work Order Installation Payment Confirmation Modal */}
      {selectedWoForPayment && (
        <PaymentConfirmationModal
          open={selectedWoForPayment !== null}
          title="Konfirmasi Biaya Pasang Baru"
          customerName={selectedWoForPayment.customerName}
          customerIdOrWo={selectedWoForPayment.id}
          amount={selectedWoForPayment.installationFeeActual ?? 0}
          paymentType={selectedWoForPayment.installationPaymentMethod === 'tunai' ? 'installation_cash' : 'installation_transfer'}
          paymentChannels={paymentChannels}
          defaultChannel={selectedWoForPayment.installationPaymentMethod === 'tunai' ? 'Tunai / Cash Kantor' : 'Transfer Kantor (BCA)'}
          loading={confirmLoading}
          onCancel={() => setSelectedWoForPayment(null)}
          onConfirm={handleConfirmWoInstallationPayment}
        />
      )}

      {/* Confirmation Modal for Auto-Uninstall & Procurements */}
      <ConfirmActionModal
        open={
          confirmationState !== null
          && confirmationState.type !== 'procurement_reject'
        }
        title={
          confirmationState?.type === 'procurement_approve'
            ? 'Konfirmasi Approval Procurement'
            : 'Konfirmasi Cabut Alat'
        }
        message={
          confirmationState?.type === 'procurement_approve'
            ? `Request procurement ${confirmationState.request.id} untuk ${confirmationState.request.itemName} akan disetujui oleh Finance${confirmationState.request.totalAmount > 5000000 ? ' dan diteruskan ke Direktur' : ''}. Pastikan nominal dan kebutuhan pengadaan sudah benar.`
            : confirmationState
            ? `Layanan pelanggan ${confirmationState.customer.name} (${confirmationState.customer.id}) akan masuk ke status cabut alat. Sistem akan menyiapkan WO pencabutan perangkat untuk teknisi.`
            : ''
        }
        confirmLabel={
          confirmationState?.type === 'procurement_approve'
            ? 'Ya, Setujui'
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

      {/* Rejection Notes Modal */}
      <NotesActionModal
        open={confirmationState?.type === 'procurement_reject'}
        title="Tolak Pengadaan & Kembalikan ke Warehouse"
        message="Finance akan mengembalikan request ini ke warehouse dengan status revisi. Request yang sama nanti bisa diedit dan disubmit ulang tanpa membuat ID baru."
        label="Catatan Revisi Finance"
        value={confirmationState?.notes ?? ''}
        onChange={(value) => {
          setConfirmationState((current) =>
            current
              ? { ...current, notes: value }
              : current,
          );
        }}
        placeholder="Tulis alasan penolakan, koreksi budget, atau data yang perlu direvisi warehouse."
        confirmLabel="Tolak & Kirim Revisi"
        cancelLabel="Batal"
        tone="danger"
        loading={confirmLoading}
        onCancel={() => setConfirmationState(null)}
        onConfirm={() => void handleConfirmFinanceAction()}
      />
    </div>
  );
};

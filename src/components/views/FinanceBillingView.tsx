import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';
import { MasterDataGroup, ProcurementRequest, WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { ConfirmProcurementPaymentModal } from '../modals/ConfirmProcurementPaymentModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { PaymentConfirmationModal } from '../modals/PaymentConfirmationModal';
import { ViewProofModal } from '../modals/ViewProofModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
import { DEFAULT_PAYMENT_CHANNELS, PaymentChannelItem } from '../../utils/invoice';

type FinanceConfirmationState =
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

const ITEMS_PER_PAGE = 5;

export const FinanceBillingView: React.FC = () => {
  const { authFetch } = useAuth();
  const {
    procurementRequests,
    workOrders,
    approveProcurementByFinance,
    rejectProcurementByFinance,
    confirmProcurementPayment,
    confirmInstallationCashPayment,
    confirmInstallationTransferPayment,
    searchQuery,
  } = useIOMS();

  const [installationFilter, setInstallationFilter] = useState<'all' | 'tunai' | 'transfer'>('all');
  const [procurementFilter, setProcurementFilter] = useState<
    'all' | 'pending_finance' | 'pending_management' | 'pending_payment' | 'approved' | 'rejected' | 'received'
  >('all');
  const [procurementPage, setProcurementPage] = useState<number>(1);

  const [confirmationState, setConfirmationState] = useState<FinanceConfirmationState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Modals for WO Installation Payment & Procurement
  const [selectedWoForPayment, setSelectedWoForPayment] = useState<WorkOrder | null>(null);
  const [selectedProcurementForPayment, setSelectedProcurementForPayment] = useState<ProcurementRequest | null>(null);
  const [selectedProofModal, setSelectedProofModal] = useState<{
    title: string;
    url: string;
    details?: {
      confirmedBy?: string | null;
      confirmedAt?: string | null;
      channel?: string | null;
      notes?: string | null;
    };
  } | null>(null);
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

  // Filter pending installation payments
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

  // Filter procurements based on search query
  const filteredProcurements = useMemo(() => {
    if (!searchQuery.trim()) return procurementRequests;
    const q = searchQuery.toLowerCase();
    return procurementRequests.filter((r) => {
      const cleanName = r.itemName.toLowerCase();
      const code = (r.itemCode || '').toLowerCase();
      const id = r.id.toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      const requester = (r.requestedBy || '').toLowerCase();
      return cleanName.includes(q) || code.includes(q) || id.includes(q) || reason.includes(q) || requester.includes(q);
    });
  }, [procurementRequests, searchQuery]);

  const procurementCounts = useMemo(() => ({
    pendingFinance: filteredProcurements.filter((r) => r.status === 'pending_finance'),
    pendingManagement: filteredProcurements.filter((r) => r.status === 'pending_management'),
    pendingPayment: filteredProcurements.filter((r) => r.status === 'pending_payment'),
    approved: filteredProcurements.filter((r) => r.status === 'approved'),
    rejected: filteredProcurements.filter((r) => r.status === 'rejected'),
    received: filteredProcurements.filter((r) => r.status === 'received'),
  }), [filteredProcurements]);

  // Current procurement list by filter
  const currentProcurementList = useMemo(() => {
    switch (procurementFilter) {
      case 'pending_finance':
        return procurementCounts.pendingFinance;
      case 'pending_management':
        return procurementCounts.pendingManagement;
      case 'pending_payment':
        return procurementCounts.pendingPayment;
      case 'approved':
        return procurementCounts.approved;
      case 'rejected':
        return procurementCounts.rejected;
      case 'received':
        return procurementCounts.received;
      case 'all':
      default:
        return filteredProcurements;
    }
  }, [procurementFilter, procurementCounts, filteredProcurements]);

  // Reset page when filter or search changes
  useEffect(() => {
    setProcurementPage(1);
  }, [procurementFilter, searchQuery]);

  const totalProcurementPages = Math.max(1, Math.ceil(currentProcurementList.length / ITEMS_PER_PAGE));
  const safeProcurementPage = Math.min(Math.max(1, procurementPage), totalProcurementPages);

  const paginatedProcurements = useMemo(() => {
    const startIndex = (safeProcurementPage - 1) * ITEMS_PER_PAGE;
    return currentProcurementList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentProcurementList, safeProcurementPage]);

  const handleConfirmFinanceAction = async () => {
    if (!confirmationState) return;

    setConfirmLoading(true);
    try {
      if (confirmationState.type === 'procurement_approve') {
        await approveProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      } else if (confirmationState.type === 'procurement_reject') {
        await rejectProcurementByFinance(confirmationState.request.id, confirmationState.notes);
      }
      setConfirmationState(null);
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
      {/* Top Header Card */}
      <section className="rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              <Receipt className="h-4 w-4" />
              <span>Finance Operations</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Verifikasi Biaya & Approval Pengadaan
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Pusat kendali keuangan: konfirmasi penerimaan setoran biaya pasang baru teknisi/transfer, persetujuan anggaran pengadaan, dan transfer dana dengan bukti bayar resmi.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 1: Konfirmasi Pemasangan Pending (Biaya Pasang Baru) */}
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
                    ? 'bg-slate-900 text-white shadow-xs'
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
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
              <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada biaya pemasangan baru yang sedang menunggu konfirmasi finance.</p>
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

      {/* SECTION 2: Procurement & Payment Desk (With 5-Item Pagination) */}
      <WorkspaceSectionShell
        eyebrow="Procurement & Payment Desk"
        title="Pengesahan & Konfirmasi Pembayaran Pengadaan Gudang"
        badge={`${currentProcurementList.length} pengadaan tercatat`}
        actions={
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setProcurementFilter('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({filteredProcurements.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('pending_finance')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'pending_finance'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Review Finance ({procurementCounts.pendingFinance.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('pending_payment')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'pending_payment'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Menunggu Bukti Bayar ({procurementCounts.pendingPayment.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('pending_management')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'pending_management'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Menunggu Direktur ({procurementCounts.pendingManagement.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('approved')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'approved'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Siap Dipesan ({procurementCounts.approved.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('rejected')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Revisi ({procurementCounts.rejected.length})
            </button>
            <button
              type="button"
              onClick={() => setProcurementFilter('received')}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                procurementFilter === 'received'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Selesai Diterima ({procurementCounts.received.length})
            </button>
          </div>
        }
      >
        <div className="divide-y divide-slate-100">
          {paginatedProcurements.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Tidak ada data pengadaan pada kategori ini.</p>
            </div>
          ) : (
            paginatedProcurements.map((request) => {
              const isPendingFinance = request.status === 'pending_finance';
              const isPendingPayment = request.status === 'pending_payment';

              return (
                <div
                  key={request.id}
                  className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                    isPendingPayment
                      ? 'bg-amber-50/50 hover:bg-amber-50/80 border-l-4 border-amber-500'
                      : isPendingFinance
                      ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                      : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{request.id}</span>
                      <span className="font-bold text-sm text-slate-900">{request.itemName}</span>
                      <WorkspaceStatusPill
                        label={
                          request.status === 'pending_payment'
                            ? 'MENUNGGU BUKTI BAYAR FINANCE'
                            : request.status === 'pending_management'
                            ? 'MENUNGGU ACC DIREKTUR'
                            : request.status === 'pending_finance'
                            ? 'MENUNGGU REVIEW FINANCE'
                            : request.status === 'approved'
                            ? 'SIAP DIBELI (DANA LUNAS)'
                            : request.status.toUpperCase()
                        }
                        tone={
                          request.status === 'approved'
                            ? 'emerald'
                            : request.status === 'pending_management'
                            ? 'violet'
                            : request.status === 'pending_payment'
                            ? 'amber'
                            : request.status === 'received'
                            ? 'sky'
                            : request.status === 'rejected'
                            ? 'rose'
                            : 'amber'
                        }
                      />

                      {request.paymentProofUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedProofModal({
                            title: `Bukti Bayar: ${request.itemName} (${request.id})`,
                            url: request.paymentProofUrl!,
                            details: {
                              confirmedBy: request.paymentConfirmedBy,
                              confirmedAt: request.paymentConfirmedAt,
                              channel: request.paymentChannel,
                              notes: request.paymentNotes,
                            },
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold hover:bg-emerald-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Bukti Bayar Terlampir
                        </button>
                      )}
                    </div>

                    {isPendingPayment && (
                      <div className="rounded-xl border border-amber-300 bg-amber-100/60 p-2.5 text-xs text-amber-900 flex items-center gap-2 font-medium">
                        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>
                          Telah disetujui Direktur/Pimpinan (<strong>{request.managementApproval?.by || 'Direksi'}</strong>). Finance wajib mentransfer dana ke vendor dan mengunggah bukti bayar agar barang dapat dibeli gudang.
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-600">Alasan: {request.reason}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-0.5">
                      <span>Jumlah: <strong>{request.quantity} {request.unit}</strong></span>
                      <span>Total: <strong className="text-emerald-700 font-mono">Rp {request.totalAmount.toLocaleString('id-ID')}</strong></span>
                      <span>Diajukan: {request.requestedBy} ({request.requestedAt})</span>
                      {request.paymentConfirmedBy && (
                        <span className="text-emerald-800 font-medium">
                          Dibayar: {request.paymentChannel || 'Transfer'} oleh {request.paymentConfirmedBy} ({request.paymentConfirmedAt})
                        </span>
                      )}
                    </div>
                    {request.rejectionNotes ? (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        <span className="font-bold">Catatan revisi terakhir:</span> {request.rejectionNotes}
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col sm:flex-row lg:flex-col gap-2">
                    {isPendingPayment && (
                      <button
                        type="button"
                        onClick={() => setSelectedProcurementForPayment(request)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shadow-xs"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        <span>Konfirmasi Bayar & Upload Bukti</span>
                      </button>
                    )}

                    {isPendingFinance && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {currentProcurementList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 p-4 sm:p-5">
              <p className="text-xs font-semibold text-slate-500">
                Menampilkan <span className="font-bold text-slate-900">{(safeProcurementPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-900">{Math.min(safeProcurementPage * ITEMS_PER_PAGE, currentProcurementList.length)}</span> dari <span className="font-bold text-slate-900">{currentProcurementList.length}</span> pengadaan
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safeProcurementPage <= 1}
                  onClick={() => setProcurementPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalProcurementPages }, (_, idx) => idx + 1).map((pageNum) => {
                    const isActive = pageNum === safeProcurementPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setProcurementPage(pageNum)}
                        className={`min-w-[32px] h-8 rounded-xl text-xs font-bold transition shadow-2xs ${
                          isActive
                            ? 'bg-slate-900 text-white'
                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={safeProcurementPage >= totalProcurementPages}
                  onClick={() => setProcurementPage((prev) => Math.min(totalProcurementPages, prev + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </WorkspaceSectionShell>

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

      {/* Confirmation Modal for Procurements */}
      <ConfirmActionModal
        open={
          confirmationState !== null
          && confirmationState.type !== 'procurement_reject'
        }
        title="Konfirmasi Approval Procurement"
        message={
          confirmationState?.type === 'procurement_approve'
            ? `Request procurement ${confirmationState.request.id} untuk ${confirmationState.request.itemName} akan disetujui oleh Finance${confirmationState.request.totalAmount > 5000000 ? ' dan diteruskan ke Direktur' : ''}. Pastikan nominal dan kebutuhan pengadaan sudah benar.`
            : ''
        }
        confirmLabel="Ya, Setujui"
        tone="success"
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

      {/* Confirm Procurement Payment Modal (With Proof Upload) */}
      <ConfirmProcurementPaymentModal
        isOpen={selectedProcurementForPayment !== null}
        onClose={() => setSelectedProcurementForPayment(null)}
        request={selectedProcurementForPayment}
        onConfirm={async (payload) => {
          if (!selectedProcurementForPayment) return;
          await confirmProcurementPayment(selectedProcurementForPayment.id, payload);
          setSelectedProcurementForPayment(null);
        }}
      />

      {/* View Proof of Payment Modal */}
      <ViewProofModal
        isOpen={selectedProofModal !== null}
        onClose={() => setSelectedProofModal(null)}
        title={selectedProofModal?.title || 'Bukti Pembayaran'}
        proofUrl={selectedProofModal?.url || null}
        details={selectedProofModal?.details}
      />
    </div>
  );
};

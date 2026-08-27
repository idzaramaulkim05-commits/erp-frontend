import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Eye,
  Inbox,
  Package,
  PackagePlus,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ProcurementRequest } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NewProcurementModal } from '../modals/NewProcurementModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { ViewProofModal } from '../modals/ViewProofModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface InventoryWarehouseViewProps {
  onOpenNewProcurement: () => void;
}

export const InventoryWarehouseView: React.FC<InventoryWarehouseViewProps> = ({
  onOpenNewProcurement,
}) => {
  const navigate = useNavigate();
  const {
    procurementRequests,
    receiveProcurementStock,
    markProcurementAsOrdered,
    searchQuery,
  } = useIOMS();

  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);
  const [orderedTarget, setOrderedTarget] = useState<ProcurementRequest | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<ProcurementRequest | null>(null);
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
  const [orderedNotes, setOrderedNotes] = useState('Pembelian ke vendor sudah diproses oleh kepala warehouse.');
  const [actionLoading, setActionLoading] = useState(false);

  // Filter requests based on search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return procurementRequests;
    const q = searchQuery.toLowerCase();
    return procurementRequests.filter((r) => {
      const cleanName = r.itemName.toLowerCase();
      const code = (r.itemCode || '').toLowerCase();
      const id = r.id.toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      return cleanName.includes(q) || code.includes(q) || id.includes(q) || reason.includes(q);
    });
  }, [procurementRequests, searchQuery]);

  const procurementByStatus = useMemo(
    () => ({
      pendingFinance: filteredRequests.filter((request) => request.status === 'pending_finance' || request.status === 'pending_management' || request.status === 'pending_payment'),
      rejected: filteredRequests.filter((request) => request.status === 'rejected'),
      approved: filteredRequests.filter((request) => request.status === 'approved'),
      ordered: filteredRequests.filter((request) => request.status === 'ordered'),
      received: filteredRequests.filter((request) => request.status === 'received'),
    }),
    [filteredRequests],
  );

  const renderProcurementCard = (request: ProcurementRequest) => {
    const tone =
      request.status === 'received'
        ? 'sky'
        : request.status === 'ordered'
        ? 'violet'
        : request.status === 'approved'
        ? 'emerald'
        : request.status === 'pending_payment'
        ? 'amber'
        : request.status === 'rejected'
        ? 'rose'
        : 'amber';

    const statusLabel =
      request.status === 'pending_payment'
        ? 'MENUNGGU BUKTI BAYAR FINANCE'
        : request.status === 'pending_management'
        ? 'MENUNGGU ACC DIREKTUR'
        : request.status === 'pending_finance'
        ? 'MENUNGGU REVIEW FINANCE'
        : request.status === 'approved'
        ? 'SIAP DIBELI (DANA SIAP)'
        : request.status.toUpperCase();

    return (
      <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                {request.id}
              </span>
              <span className="text-sm font-bold text-slate-900">
                {request.itemName.replace(/^(Material\s+Lainnya\s*(\/\s*Khusus)?\s*[-–—:\/]?\s*)/i, '').trim() || request.itemCode}
              </span>
              <WorkspaceStatusPill label={statusLabel} tone={tone} />

              {request.paymentProofUrl && (
                <button
                  type="button"
                  onClick={() => setSelectedProofModal({
                    title: `Bukti Bayar Pengadaan: ${request.itemName} (${request.id})`,
                    url: request.paymentProofUrl!,
                    details: {
                      confirmedBy: request.paymentConfirmedBy,
                      confirmedAt: request.paymentConfirmedAt,
                      channel: request.paymentChannel,
                      notes: request.paymentNotes,
                    },
                  })}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold hover:bg-emerald-200 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Bukti Bayar Finance</span>
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600">{request.reason}</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-white p-3 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Total</span>
                <span className="mt-1 block font-mono font-bold text-emerald-700">
                  Rp {request.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Kuantitas</span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {request.quantity} {request.unit}
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Diajukan</span>
                <span className="mt-1 block font-semibold text-slate-800">{request.requestedAt}</span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Timeline</span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {request.receivedAt || request.orderedAt || (request.paymentConfirmedAt ? `Dana dibayar ${request.paymentConfirmedAt}` : 'Menunggu proses berikutnya')}
                </span>
              </div>
            </div>

            {request.status === 'pending_payment' && (
              <div className="rounded-2xl border border-amber-300 bg-amber-100/60 p-3 text-xs text-amber-900 font-medium">
                <span className="font-bold">Menunggu Bukti Transfer Finance: </span>
                Pengadaan &gt; 5 Juta ini telah di-ACC Direktur. Saat ini menunggu Finance menyerahkan/mentransfer dana ke vendor dan mengunggah bukti bayar agar barang dapat dibeli.
              </div>
            )}

            {request.rejectionNotes ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                <span className="font-bold">Catatan revisi:</span> {request.rejectionNotes}
              </div>
            ) : null}

            {request.orderedNotes ? (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-700">
                <span className="font-bold">Catatan pembelian:</span> {request.orderedNotes}
              </div>
            ) : null}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 xl:w-72">
            {request.status === 'rejected' ? (
              <button
                type="button"
                onClick={() => setEditingRequest(request)}
                className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Revisi & Kirim Ulang
              </button>
            ) : null}

            {request.status === 'approved' ? (
              <button
                type="button"
                onClick={() => {
                  setOrderedTarget(request);
                  setOrderedNotes('Pembelian ke vendor sudah diproses oleh kepala warehouse.');
                }}
                className="rounded-2xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-violet-800"
              >
                Tandai Sedang Dibeli
              </button>
            ) : null}

            {request.status === 'ordered' ? (
              <button
                type="button"
                onClick={() => setReceiveTarget(request)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <Inbox className="h-3.5 w-3.5" />
                Terima Barang & Masukkan Stok
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <section className="rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              <Package className="h-4 w-4" />
              <span>Log Pengadaan Gudang</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Alur Pengadaan & Penerimaan Barang
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Monitoring status persetujuan pengadaan, konfirmasi pencairan dana oleh Finance, bukti transfer, proses pemesanan ke vendor, hingga penerimaan stok barang masuk (goods receipt).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/app/stok-barang')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 shadow-xs"
            >
              <Boxes className="h-4 w-4 text-sky-300" />
              <span>Lihat Stok & Material</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/request-pengadaan-barang')}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md"
            >
              <PackagePlus className="h-4 w-4" />
              <span>Buat Permintaan Barang</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Procurement Log Section */}
      <WorkspaceSectionShell
        eyebrow="Procurement Log"
        title="Riwayat Pengajuan & Penerimaan Barang Masuk"
        subtitle="Warehouse mengelola pengadaan dari revisi, approval, ordered, sampai goods receipt pada satu tempat yang konsisten."
        badge={`${filteredRequests.length} pengajuan tercatat`}
      >
        <div className="space-y-6 p-5 sm:p-6">
          {/* Section 1: Menunggu Finance / Direktur / Pembayaran */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900">Menunggu Finance / Direktur / Bukti Bayar</h3>
              <WorkspaceStatusPill label={`${procurementByStatus.pendingFinance.length} antrean`} tone="amber" />
            </div>
            {procurementByStatus.pendingFinance.length > 0 ? (
              <div className="space-y-3">
                {procurementByStatus.pendingFinance.map(renderProcurementCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Tidak ada pengajuan yang sedang menunggu approval atau pembayaran finance.
              </div>
            )}
          </section>

          {/* Section 2: Perlu Revisi */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900">Perlu Revisi</h3>
              <WorkspaceStatusPill label={`${procurementByStatus.rejected.length} ditolak`} tone="rose" />
            </div>
            {procurementByStatus.rejected.length > 0 ? (
              <div className="space-y-3">
                {procurementByStatus.rejected.map(renderProcurementCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Belum ada pengadaan yang perlu direvisi.
              </div>
            )}
          </section>

          {/* Section 3: Approved / Siap Dipesan */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900">Disetujui & Siap Dipesan (Approved)</h3>
              <WorkspaceStatusPill label={`${procurementByStatus.approved.length} siap dibeli`} tone="emerald" />
            </div>
            {procurementByStatus.approved.length > 0 ? (
              <div className="space-y-3">
                {procurementByStatus.approved.map(renderProcurementCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Tidak ada pengadaan yang sedang menunggu pemesanan ke vendor.
              </div>
            )}
          </section>

          {/* Section 4: Sedang Dibeli (Ordered) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900">Sedang Dipesan / Dibeli (Ordered)</h3>
              <WorkspaceStatusPill label={`${procurementByStatus.ordered.length} diproses`} tone="violet" />
            </div>
            {procurementByStatus.ordered.length > 0 ? (
              <div className="space-y-3">
                {procurementByStatus.ordered.map(renderProcurementCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Tidak ada pengadaan yang sedang dalam proses pengiriman vendor.
              </div>
            )}
          </section>

          {/* Section 5: Selesai Diterima (Received) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900">Selesai Diterima & Masuk Stok Gudang</h3>
              <WorkspaceStatusPill label={`${procurementByStatus.received.length} diterima`} tone="sky" />
            </div>
            {procurementByStatus.received.length > 0 ? (
              <div className="space-y-3">
                {procurementByStatus.received.map(renderProcurementCard)}
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Belum ada riwayat penerimaan barang masuk.
              </div>
            )}
          </section>
        </div>
      </WorkspaceSectionShell>

      <NewProcurementModal
        open={editingRequest !== null}
        onClose={() => setEditingRequest(null)}
        procurementRequest={editingRequest}
      />

      <NotesActionModal
        open={orderedTarget !== null}
        title="Tandai Pengadaan Sedang Dibeli"
        message="Warehouse menandai bahwa request yang sudah approved sudah diproses ke vendor dan sekarang menunggu barang datang."
        label="Catatan Pembelian"
        value={orderedNotes}
        onChange={setOrderedNotes}
        placeholder="Tulis vendor, nomor PO internal, atau catatan pembelian."
        confirmLabel="Tandai Ordered"
        cancelLabel="Batal"
        tone="warning"
        loading={actionLoading}
        onCancel={() => {
          if (actionLoading) return;
          setOrderedTarget(null);
        }}
        onConfirm={async () => {
          if (!orderedTarget) return;
          setActionLoading(true);
          try {
            await markProcurementAsOrdered(orderedTarget.id, orderedNotes);
            setOrderedTarget(null);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <ConfirmActionModal
        open={receiveTarget !== null}
        title="Terima Barang & Tambahkan ke Stok"
        message="Goods receipt ini akan menambah stok gudang secara otomatis dan menandai procurement sebagai selesai diterima."
        confirmLabel="Terima Barang"
        cancelLabel="Batal"
        tone="success"
        loading={actionLoading}
        onCancel={() => {
          if (actionLoading) return;
          setReceiveTarget(null);
        }}
        onConfirm={async () => {
          if (!receiveTarget) return;
          setActionLoading(true);
          try {
            await receiveProcurementStock(receiveTarget.id);
            setReceiveTarget(null);
          } finally {
            setActionLoading(false);
          }
        }}
      />

      {/* View Proof of Payment Modal */}
      <ViewProofModal
        isOpen={selectedProofModal !== null}
        onClose={() => setSelectedProofModal(null)}
        title={selectedProofModal?.title || 'Bukti Pembayaran Finance'}
        proofUrl={selectedProofModal?.url || null}
        details={selectedProofModal?.details}
      />
    </div>
  );
};

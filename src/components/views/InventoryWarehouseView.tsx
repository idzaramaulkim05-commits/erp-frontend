import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
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

const ITEMS_PER_PAGE = 5;

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

  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'rejected' | 'approved' | 'ordered' | 'received'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
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

  // Determine current active list based on tab
  const currentList = useMemo(() => {
    switch (activeFilter) {
      case 'pending':
        return procurementByStatus.pendingFinance;
      case 'rejected':
        return procurementByStatus.rejected;
      case 'approved':
        return procurementByStatus.approved;
      case 'ordered':
        return procurementByStatus.ordered;
      case 'received':
        return procurementByStatus.received;
      case 'all':
      default:
        return filteredRequests;
    }
  }, [activeFilter, procurementByStatus, filteredRequests]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(currentList.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRequests = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return currentList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentList, safePage]);

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
      <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 transition-colors hover:bg-slate-50">
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
              <div className="rounded-2xl bg-white p-3 text-xs shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Total</span>
                <span className="mt-1 block font-mono font-bold text-emerald-700">
                  Rp {request.totalAmount.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Kuantitas</span>
                <span className="mt-1 block font-semibold text-slate-800">
                  {request.quantity} {request.unit}
                </span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs shadow-2xs">
                <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Diajukan</span>
                <span className="mt-1 block font-semibold text-slate-800">{request.requestedAt}</span>
              </div>
              <div className="rounded-2xl bg-white p-3 text-xs shadow-2xs">
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
                className="rounded-2xl bg-violet-700 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-violet-800 shadow-xs"
              >
                Tandai Sedang Dibeli
              </button>
            ) : null}

            {request.status === 'ordered' ? (
              <button
                type="button"
                onClick={() => setReceiveTarget(request)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shadow-xs"
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

      {/* Category Tab Filters & Actions */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({filteredRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Menunggu Approval / Bayar ({procurementByStatus.pendingFinance.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('rejected')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Perlu Revisi ({procurementByStatus.rejected.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('approved')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'approved'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Siap Dipesan ({procurementByStatus.approved.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('ordered')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'ordered'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Sedang Dibeli ({procurementByStatus.ordered.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('received')}
              className={`rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                activeFilter === 'received'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Selesai Diterima ({procurementByStatus.received.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/app/request-pengadaan-barang')}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Buat Permintaan Baru</span>
          </button>
        </div>
      </div>

      {/* Main Paginated Procurement List Section */}
      <WorkspaceSectionShell
        eyebrow="Procurement Log"
        title={
          activeFilter === 'all'
            ? 'Semua Riwayat Pengajuan & Penerimaan Barang'
            : activeFilter === 'pending'
            ? 'Antrean Pengadaan Menunggu Review Finance / Direktur / Bukti Bayar'
            : activeFilter === 'rejected'
            ? 'Pengadaan yang Butuh Revisi Warehouse'
            : activeFilter === 'approved'
            ? 'Pengadaan Disetujui & Siap Dipesan ke Vendor'
            : activeFilter === 'ordered'
            ? 'Pengadaan Sedang Dipesan / Proses Pengiriman'
            : 'Riwayat Pengadaan Selesai Diterima & Masuk Stok Gudang'
        }
        subtitle="Daftar dibatasi 5 data per halaman dengan navigasi pagination untuk kemudahan pemantauan dan pengelolaan."
        badge={`${currentList.length} total pengadaan`}
      >
        <div className="space-y-4 p-4 sm:p-6">
          {paginatedRequests.length > 0 ? (
            <div className="space-y-3">
              {paginatedRequests.map(renderProcurementCard)}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              <Package className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">Tidak ada data pengadaan pada kategori ini.</p>
              <p className="text-xs text-slate-400 mt-1">Gunakan tombol Buat Permintaan Barang Baru untuk mengajukan pengadaan.</p>
            </div>
          )}

          {/* Pagination Bar */}
          {currentList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/70 p-4 rounded-2xl mt-4">
              <p className="text-xs font-semibold text-slate-500">
                Menampilkan <span className="font-bold text-slate-900">{(safePage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-slate-900">{Math.min(safePage * ITEMS_PER_PAGE, currentList.length)}</span> dari <span className="font-bold text-slate-900">{currentList.length}</span> pengadaan
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                    const isActive = pageNum === safePage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
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
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
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

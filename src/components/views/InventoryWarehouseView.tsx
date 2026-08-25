import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Inbox,
  Package,
  PackagePlus,
  Warehouse,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ProcurementRequest } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NewProcurementModal } from '../modals/NewProcurementModal';
import { NotesActionModal } from '../modals/NotesActionModal';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

interface InventoryWarehouseViewProps {
  onOpenNewProcurement: () => void;
}

export const InventoryWarehouseView: React.FC<InventoryWarehouseViewProps> = ({
  onOpenNewProcurement,
}) => {
  const {
    inventory,
    procurementRequests,
    receiveProcurementStock,
    markProcurementAsOrdered,
    searchQuery,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'stock' | 'procurement'>('stock');
  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);
  const [orderedTarget, setOrderedTarget] = useState<ProcurementRequest | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<ProcurementRequest | null>(null);
  const [orderedNotes, setOrderedNotes] = useState('Pembelian ke vendor sudah diproses oleh kepala warehouse.');
  const [actionLoading, setActionLoading] = useState(false);

  const filteredInventory = inventory.filter((item) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        item.code.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const criticalStockCount = inventory.filter((item) => item.stockAvailable <= item.minThreshold).length;
  const pendingProcurementCount = procurementRequests.filter((request) => request.status === 'pending_finance' || request.status === 'pending_management').length;
  const orderedProcurementCount = procurementRequests.filter((request) => request.status === 'ordered').length;

  const procurementByStatus = useMemo(
    () => ({
      pendingFinance: procurementRequests.filter((request) => request.status === 'pending_finance' || request.status === 'pending_management'),
      rejected: procurementRequests.filter((request) => request.status === 'rejected'),
      approved: procurementRequests.filter((request) => request.status === 'approved'),
      ordered: procurementRequests.filter((request) => request.status === 'ordered'),
      received: procurementRequests.filter((request) => request.status === 'received'),
    }),
    [procurementRequests],
  );

  const renderProcurementCard = (request: ProcurementRequest) => {
    const tone =
      request.status === 'received'
        ? 'sky'
        : request.status === 'ordered'
        ? 'violet'
        : request.status === 'approved'
        ? 'emerald'
        : request.status === 'rejected'
        ? 'rose'
        : 'amber';

    return (
      <div key={request.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                {request.id}
              </span>
              <span className="text-sm font-bold text-slate-900">{request.itemName}</span>
              <WorkspaceStatusPill label={request.status.toUpperCase()} tone={tone} />
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
                  {request.receivedAt || request.orderedAt || 'Menunggu proses berikutnya'}
                </span>
              </div>
            </div>

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
      <WorkspaceOpsHero
        eyebrow="Warehouse Operations"
        title="Kontrol stok gudang, material lapangan, dan penerimaan barang masuk"
        subtitle="Workspace utama inventory untuk memantau kesiapan material, mengawasi stok kritis, dan menindaklanjuti procurement sampai barang diterima ke gudang."
        stats={[
          {
            label: 'Total Item',
            value: inventory.length,
            description: 'Jumlah item inventaris aktif yang tercatat di gudang.',
            icon: Package,
            accentClass: 'bg-sky-400/15 text-sky-200',
          },
          {
            label: 'Stok Kritis',
            value: criticalStockCount,
            description: 'Item yang stok siap pakainya sudah menyentuh ambang minimum.',
            icon: AlertTriangle,
            accentClass: 'bg-rose-400/15 text-rose-200',
          },
          {
            label: 'Pending Procurement',
            value: pendingProcurementCount,
            description: 'Permintaan barang yang masih menunggu approval finance atau manajemen.',
            icon: Warehouse,
            accentClass: 'bg-amber-400/15 text-amber-200',
          },
          {
            label: 'Ready Stock-In',
            value: orderedProcurementCount,
            description: 'Pengadaan yang sudah dibeli dan menunggu goods receipt ke stok.',
            icon: Inbox,
            accentClass: 'bg-emerald-400/15 text-emerald-200',
          },
        ]}
      />

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('stock')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'stock' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Stok Barang & Material ({inventory.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('procurement')}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                activeTab === 'procurement' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Permintaan Pengadaan ({procurementRequests.length})
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenNewProcurement}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <PackagePlus className="h-4 w-4" />
            Buat Permintaan Barang Baru
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <WorkspaceSectionShell
          eyebrow="Stock Overview"
          title="Katalog inventaris dan kondisi stok gudang"
          subtitle="Pencatatan modem, patch cord, kabel drop, perangkat pasif, dan material lapangan yang dipakai untuk operasional harian."
          badge={`${filteredInventory.length} item terlihat`}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode & Nama Barang</th>
                  <th className="px-4 py-3">Kategori & Brand</th>
                  <th className="px-4 py-3">Lokasi Rak</th>
                  <th className="px-4 py-3 text-center">Stok Ready</th>
                  <th className="px-4 py-3 text-center">Terpasang</th>
                  <th className="px-4 py-3">Harga Satuan</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const isLowStock = item.stockAvailable <= item.minThreshold;

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{item.brand}</div>
                        <div className="text-[11px] text-slate-500">{item.category}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{item.locationRack}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-extrabold text-slate-900">
                          {item.stockAvailable} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-500">
                        {item.stockInUse} {item.unit}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <WorkspaceStatusPill
                          label={isLowStock ? `Stok Kritis (<= ${item.minThreshold})` : 'Aman'}
                          tone={isLowStock ? 'rose' : 'emerald'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </WorkspaceSectionShell>
      ) : (
        <WorkspaceSectionShell
          eyebrow="Procurement Log"
          title="Riwayat pengajuan dan penerimaan barang masuk"
          subtitle="Warehouse mengelola pengadaan dari revisi, approval, ordered, sampai goods receipt pada satu tempat yang konsisten."
          badge={`${procurementRequests.length} pengajuan terlihat`}
        >
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">Menunggu Finance / Manajemen</h3>
                <WorkspaceStatusPill label={`${procurementByStatus.pendingFinance.length} antrean`} tone="amber" />
              </div>
              {procurementByStatus.pendingFinance.length > 0 ? (
                <div className="space-y-3">
                  {procurementByStatus.pendingFinance.map(renderProcurementCard)}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Tidak ada pengajuan yang sedang menunggu approval.
                </div>
              )}
            </section>

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

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">Approved</h3>
                <WorkspaceStatusPill label={`${procurementByStatus.approved.length} siap dibeli`} tone="emerald" />
              </div>
              {procurementByStatus.approved.length > 0 ? (
                <div className="space-y-3">
                  {procurementByStatus.approved.map(renderProcurementCard)}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Belum ada pengadaan approved yang siap ditandai ordered.
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">Sedang Dibeli / Ordered</h3>
                <WorkspaceStatusPill label={`${procurementByStatus.ordered.length} menunggu barang`} tone="violet" />
              </div>
              {procurementByStatus.ordered.length > 0 ? (
                <div className="space-y-3">
                  {procurementByStatus.ordered.map(renderProcurementCard)}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Belum ada pengadaan yang sedang dibeli.
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">Sudah Diterima</h3>
                <WorkspaceStatusPill label={`${procurementByStatus.received.length} selesai`} tone="sky" />
              </div>
              {procurementByStatus.received.length > 0 ? (
                <div className="space-y-3">
                  {procurementByStatus.received.map(renderProcurementCard)}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Belum ada pengadaan yang selesai diterima.
                </div>
              )}
            </section>
          </div>
        </WorkspaceSectionShell>
      )}

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
    </div>
  );
};

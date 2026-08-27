import React, { useState } from 'react';
import {
  TrendingUp,
  CheckCircle2,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ProcurementRequest } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';

type ManagementDecisionState =
  | {
      type: 'approve';
      request: ProcurementRequest;
      notes: string;
    }
  | {
      type: 'reject';
      request: ProcurementRequest;
      notes: string;
    }
  | null;

export const ManagementDashboardView: React.FC = () => {
  const {
    customers,
    tickets,
    procurementRequests,
    approveProcurementByManagement,
    rejectProcurementByManagement,
  } = useIOMS();
  const [decisionState, setDecisionState] = useState<ManagementDecisionState>(null);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const totalRevenue = customers
    .filter((c) => c.billingStatus === 'paid')
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  const activeCount = customers.filter((c) => c.status === 'active').length;
  const churnCount = customers.filter((c) => c.status === 'uninstal_pending' || c.status === 'uninstalled').length;
  const closedTicketsCount = tickets.filter((t) => t.status === 'closed').length;

  const pendingManagementCapex = procurementRequests.filter(
    (p) => p.status === 'pending_management'
  );

  const handleDecision = async () => {
    if (!decisionState) return;

    setDecisionLoading(true);
    try {
      if (decisionState.type === 'approve') {
        await approveProcurementByManagement(decisionState.request.id, decisionState.notes);
      } else {
        await rejectProcurementByManagement(decisionState.request.id, decisionState.notes);
      }
      setDecisionState(null);
    } finally {
      setDecisionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Welcome & Focus Statement */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mb-1 inline-block">
            Analytical Executive Dashboard
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            Laporan Kinerja Bisnis & Manajemen Operasional ISP
          </h2>
          <p className="text-xs text-slate-500 max-w-2xl">
            Tampilan analitis eksekutif untuk Direktur & Pimpinan. Fokus pada kesehatan arus kas, kepuasan pelanggan, serta pengesahan belanja modal (Capex) besar.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Pertumbuhan Bulan Ini</span>
            <span className="text-base font-extrabold text-emerald-600 flex items-center justify-end gap-1">
              <TrendingUp className="w-4 h-4" /> +14.2% MoM
            </span>
          </div>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Estimasi Pendapatan Bulan Ini</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>96.4% Terkumpul dari Billing</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Pelanggan Aktif</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {activeCount} Pelanggan
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            Tingkat Churn Rendah ({churnCount} Putus)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Penyelesaian Gangguan (SLA)</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {closedTicketsCount} / {tickets.length} Tiket
          </p>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            Rata-rata 2.1 Jam / Tiket (SOP Passed)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Pengajuan Capex Pending</span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1">
            {pendingManagementCapex.length} Pengajuan
          </p>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">
            Butuh Tanda Tangan Direksi
          </div>
        </div>
      </div>

      {/* Executive Capex Sign-off Station */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-purple-50/40 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-700" />
              <span>Pengesahan Anggaran Belanja Modal (&gt; Rp 5.000.000) oleh Pimpinan</span>
            </h3>
            <p className="text-xs text-slate-500">
              Sesuai SOP bisnis: Pengadaan skala besar bernilai puluhan juta wajib mendapatkan persetujuan Direktur.
            </p>
          </div>
          <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-full">
            {pendingManagementCapex.length} Menunggu ACC Direksi
          </span>
        </div>

        {pendingManagementCapex.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada pengajuan Capex yang pending</p>
            <p className="text-xs text-slate-500 mt-0.5">Semua permohonan belanja modal sudah diproses.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingManagementCapex.map((req) => (
              <div
                key={req.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {req.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{req.itemName}</h4>
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Menunggu ACC Pimpinan
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">Alasan: {req.reason}</p>

                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-900 max-w-xl">
                    <span className="font-bold">Verifikasi Finance ({req.financeApproval?.by}): </span>
                    <span>{req.financeApproval?.notes}</span>
                  </div>

                  {req.rejectionNotes ? (
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-800 max-w-xl">
                      <span className="font-bold">Catatan revisi terakhir: </span>
                      <span>{req.rejectionNotes}</span>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                    <span>Jumlah: <strong>{req.quantity} {req.unit}</strong></span>
                    <span>Total Capex: <strong className="text-emerald-700 font-mono text-sm">Rp {req.totalAmount.toLocaleString('id-ID')}</strong></span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionState({
                      type: 'approve',
                      request: req,
                      notes: 'Capex disetujui untuk pengadaan stok operasional.',
                    })}
                    className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Pengeluaran Capex (ACC Direktur)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionState({
                      type: 'reject',
                      request: req,
                      notes: 'Mohon revisi justifikasi pembelian, quantity, atau estimasi harga.',
                    })}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100"
                  >
                    Tolak & Kembalikan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmActionModal
        open={decisionState?.type === 'approve'}
        title="Konfirmasi Approval Capex (ACC Direktur)"
        message={
          decisionState?.type === 'approve'
            ? `Pengajuan ${decisionState.request.id} untuk ${decisionState.request.itemName} senilai Rp ${decisionState.request.totalAmount.toLocaleString('id-ID')} akan disetujui Direktur dan diteruskan kembali ke Finance untuk proses pembayaran serta pelampiran bukti transfer resmi.`
            : ''
        }
        confirmLabel="Ya, ACC & Kirim ke Finance"
        cancelLabel="Batal"
        tone="success"
        loading={decisionLoading}
        onCancel={() => setDecisionState(null)}
        onConfirm={() => void handleDecision()}
      />

      <NotesActionModal
        open={decisionState?.type === 'reject'}
        title="Tolak Pengajuan Capex"
        message="Request procurement ini akan dikembalikan ke warehouse dengan status revisi pada ID yang sama."
        label="Catatan Revisi Atasan"
        value={decisionState?.type === 'reject' ? decisionState.notes : ''}
        onChange={(value) => {
          setDecisionState((current) =>
            current?.type === 'reject'
              ? { ...current, notes: value }
              : current,
          );
        }}
        placeholder="Tulis alasan penolakan atau poin revisi yang harus dilengkapi warehouse."
        confirmLabel="Tolak Pengajuan"
        cancelLabel="Batal"
        tone="danger"
        loading={decisionLoading}
        onCancel={() => setDecisionState(null)}
        onConfirm={() => void handleDecision()}
      />
    </div>
  );
};

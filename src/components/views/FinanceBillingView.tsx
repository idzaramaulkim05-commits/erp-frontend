import React, { useState } from 'react';
import {
  DollarSign,
  Layers,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserX,
  CreditCard,
  Building2,
  TrendingUp,
  Receipt,
  FileCheck2,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, CustomerStatus } from '../../types';

export const FinanceBillingView: React.FC = () => {
  const {
    customers,
    procurementRequests,
    updateCustomerStatus,
    approveProcurementByFinance,
    searchQuery,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'billing' | 'procurement_approvals'>('billing');
  const [selectedBillingStatus, setSelectedBillingStatus] = useState<string>('all');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (selectedBillingStatus === 'unpaid' && c.billingStatus !== 'unpaid') return false;
    if (selectedBillingStatus === 'paid' && c.billingStatus !== 'paid') return false;
    if (selectedBillingStatus === 'uninstal' && c.status !== 'uninstal_pending' && c.status !== 'uninstalled') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.pppoeUsername.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalPaidRevenue = customers
    .filter((c) => c.billingStatus === 'paid')
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  const totalUnpaidReceivable = customers
    .filter((c) => c.billingStatus === 'unpaid')
    .reduce((sum, c) => sum + c.monthlyFee, 0);

  const pendingProcurementForFinance = procurementRequests.filter(
    (p) => p.status === 'pending_finance'
  );

  return (
    <div className="space-y-6">
      {/* Top Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Tagihan Terbayar (Bulan Ini)</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">
            Rp {totalPaidRevenue.toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {customers.filter((c) => c.billingStatus === 'paid').length} Pelanggan Aktif Lunas
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Piutang / Belum Bayar (Isolir)</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-rose-700">
            Rp {totalUnpaidReceivable.toLocaleString('id-ID')}
          </p>
          <span className="text-[11px] text-rose-600 font-medium">
            {customers.filter((c) => c.billingStatus === 'unpaid').length} Pelanggan Tertunggak
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pengajuan Anggaran Menunggu ACC</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">
            {pendingProcurementForFinance.length} Request
          </p>
          <span className="text-[11px] text-amber-600 font-medium">
            Dari Bagian Gudang & Logistik
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Manajemen Status Tagihan & Auto-Cabut ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('procurement_approvals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'procurement_approvals'
              ? 'bg-emerald-700 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Approval Pengadaan Gudang ({pendingProcurementForFinance.length})
        </button>
      </div>

      {/* 1. Billing & Auto-Trigger Cabut Table */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Data Pelanggan, Pembayaran & Pemicu Pencabutan Perangkat
              </h3>
              <p className="text-xs text-slate-500">
                Mengubah status ke <strong>Uninstal</strong> akan otomatis menerbitkan Work Order Cabut Alat ke Kepala Teknisi.
              </p>
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <button
                onClick={() => setSelectedBillingStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  selectedBillingStatus === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setSelectedBillingStatus('paid')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  selectedBillingStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setSelectedBillingStatus('unpaid')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  selectedBillingStatus === 'unpaid' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => setSelectedBillingStatus('uninstal')}
                className={`px-2.5 py-1 rounded-lg font-semibold ${
                  selectedBillingStatus === 'uninstal' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Uninstal
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">ID & Pelanggan</th>
                  <th className="px-4 py-3">Paket & Tagihan</th>
                  <th className="px-4 py-3">User PPPoE</th>
                  <th className="px-4 py-3">Status Tagihan</th>
                  <th className="px-4 py-3">Status Layanan</th>
                  <th className="px-4 py-3 text-right">Ubah Status (Auto-Trigger)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{cust.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust.id} • {cust.region}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{cust.packagePlan}</div>
                        <div className="text-[11px] text-emerald-700 font-mono font-bold">
                          Rp {cust.monthlyFee.toLocaleString('id-ID')} / bln
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {cust.pppoeUsername}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            cust.billingStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {cust.billingStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : cust.status === 'uninstal_pending'
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cust.status === 'uninstal_pending' ? 'CABUT PENDING' : cust.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {cust.status !== 'uninstal_pending' && cust.status !== 'uninstalled' && (
                            <button
                              onClick={() => {
                                if (confirm(`Apakah Anda yakin ingin memutus & cabut alat pelanggan ${cust.name}? Ini akan otomatis membuat WO Cabut Perangkat untuk Teknisi.`)) {
                                  updateCustomerStatus(cust.id, 'uninstal_pending', 'Permintaan berhenti berlangganan / tunggakan');
                                }
                              }}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded-lg font-bold text-[10px] transition-colors"
                              title="Picu Pencabutan Modem Otomatis"
                            >
                              Cabut Alat
                            </button>
                          )}

                          {cust.billingStatus === 'unpaid' && (
                            <button
                              onClick={() => updateCustomerStatus(cust.id, 'active', 'Pelanggan sudah transfer pembayaran')}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg font-bold text-[10px] transition-colors"
                            >
                              Set Lunas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Procurement Approval for Finance */}
      {activeTab === 'procurement_approvals' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Pengesahan Permintaan Pengadaan Barang dari Gudang
            </h3>
            <p className="text-xs text-slate-500">
              Nominal rutin (&le; Rp 5.000.000) langsung disetujui Finance. Nominal besar (&gt; Rp 5.000.000) diteruskan ke Direktur/Manajemen.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {procurementRequests.map((req) => {
              const isPendingFinance = req.status === 'pending_finance';
              return (
                <div key={req.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {req.id}
                      </span>
                      <span className="font-bold text-sm text-slate-900">{req.itemName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'pending_management'
                            ? 'bg-purple-100 text-purple-800'
                            : req.status === 'received'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">Alasan: {req.reason}</p>
                    <div className="flex gap-3 text-xs text-slate-500 pt-1">
                      <span>Jumlah: <strong>{req.quantity} {req.unit}</strong></span>
                      <span>Total: <strong className="text-emerald-700 font-mono">Rp {req.totalAmount.toLocaleString('id-ID')}</strong></span>
                      <span>Diajukan: {req.requestedBy}</span>
                    </div>
                  </div>

                  {isPendingFinance && (
                    <button
                      onClick={() => approveProcurementByFinance(req.id, 'Cash flow mencukupi untuk restock.')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs shrink-0"
                    >
                      {req.totalAmount > 5000000 ? 'Setujui & Teruskan ke Direktur' : 'Setujui Pengadaan (ACC)'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

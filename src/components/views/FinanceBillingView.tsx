import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Receipt,
  UserX,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { WorkspaceOpsHero, WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

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

  return (
    <div className="space-y-6">
      <WorkspaceOpsHero
        eyebrow="Finance Support Operations"
        title="Billing, piutang, dan procurement pendukung finance"
        subtitle="Area operasional sekunder setelah home pipeline finance. Fokus halaman ini adalah billing existing, auto-cabut layanan, dan approval procurement gudang."
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

      <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === 'billing' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manajemen Tagihan & Auto-Cabut ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('procurement_approvals')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === 'procurement_approvals' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Approval Procurement ({pendingProcurementForFinance.length})
          </button>
        </div>
      </div>

      {activeTab === 'billing' && (
        <WorkspaceSectionShell
          eyebrow="Billing Existing"
          title="Data pelanggan, pembayaran, dan pemicu pencabutan perangkat"
          subtitle="Mengubah status ke uninstal akan otomatis menerbitkan work order cabut alat ke kepala teknisi."
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
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin memutus & cabut alat pelanggan ${customer.name}? Ini akan otomatis membuat WO Cabut Perangkat untuk Teknisi.`)) {
                                updateCustomerStatus(customer.id, 'uninstal_pending', 'Permintaan berhenti berlangganan / tunggakan');
                              }
                            }}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700 transition-colors hover:bg-rose-100"
                            title="Picu pencabutan modem otomatis"
                          >
                            Cabut Alat
                          </button>
                        )}

                        {customer.billingStatus === 'unpaid' && (
                          <button
                            type="button"
                            onClick={() => updateCustomerStatus(customer.id, 'active', 'Pelanggan sudah transfer pembayaran')}
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
      )}

      {activeTab === 'procurement_approvals' && (
        <WorkspaceSectionShell
          eyebrow="Procurement Approval"
          title="Pengesahan permintaan pengadaan gudang"
          subtitle="Nominal rutin langsung disetujui finance, nominal besar diteruskan ke direktur atau manajemen."
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
                  </div>

                  {isPendingFinance && (
                    <button
                      type="button"
                      onClick={() => approveProcurementByFinance(request.id, 'Cash flow mencukupi untuk restock.')}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700 shrink-0"
                    >
                      {request.totalAmount > 5000000 ? 'Setujui & Teruskan ke Direktur' : 'Setujui Pengadaan'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </WorkspaceSectionShell>
      )}
    </div>
  );
};

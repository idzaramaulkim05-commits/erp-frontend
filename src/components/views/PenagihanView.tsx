import React, { useMemo, useState } from 'react';
import { ChevronDown, RotateCcw, Search } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getReferenceActiveUntil = (customer: Customer): string | null =>
  customer.serviceActiveUntil ?? customer.billingDueDate ?? null;

const getRemainingDays = (activeUntil?: string | null): number | null => {
  if (!activeUntil) {
    return null;
  }

  const dueDate = new Date(activeUntil);
  if (Number.isNaN(dueDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return Math.ceil((dueDate.getTime() - today.getTime()) / DAY_IN_MS);
};

const getActiveState = (customer: Customer): {
  label: string;
  key: 'aktif' | 'hampir_habis' | 'expired' | 'unknown';
  tone: 'emerald' | 'amber' | 'rose';
  remainingDays: number | null;
} => {
  const remainingDays = getRemainingDays(getReferenceActiveUntil(customer));

  if (remainingDays === null) {
    return { label: 'BELUM ADA MASA AKTIF', key: 'unknown', tone: 'amber', remainingDays };
  }

  if (remainingDays < 0) {
    return { label: `EXPIRED ${Math.abs(remainingDays)} HARI`, key: 'expired', tone: 'rose', remainingDays };
  }

  if (remainingDays <= 5) {
    return { label: `AKTIF ${remainingDays} HARI`, key: 'hampir_habis', tone: 'amber', remainingDays };
  }

  return { label: `AKTIF ${remainingDays} HARI`, key: 'aktif', tone: 'emerald', remainingDays };
};

export const PenagihanView: React.FC = () => {
  const { customers, recordCustomerPayment } = useIOMS();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'semua' | 'paid' | 'unpaid' | 'pending'>('semua');
  const [activeStateFilter, setActiveStateFilter] = useState<'semua' | 'aktif' | 'hampir_habis' | 'expired'>('semua');
  const [regionFilter, setRegionFilter] = useState('semua');

  const regionOptions = useMemo<string[]>(
    () => Array.from<string>(new Set(customers.map((customer) => customer.region).filter((region): region is string => Boolean(region))))
      .sort((a, b) => a.localeCompare(b)),
    [customers],
  );

  const filteredCustomers = customers.filter((customer) => {
    const activeState = getActiveState(customer);

    if (billingStatusFilter !== 'semua' && customer.billingStatus !== billingStatusFilter) {
      return false;
    }

    if (activeStateFilter !== 'semua' && activeState.key !== activeStateFilter) {
      return false;
    }

    if (regionFilter !== 'semua' && customer.region !== regionFilter) {
      return false;
    }

    if (!searchTerm.trim()) {
      return true;
    }

    const q = searchTerm.toLowerCase();
    return (
      customer.id.toLowerCase().includes(q) ||
      customer.name.toLowerCase().includes(q) ||
      customer.phone.toLowerCase().includes(q) ||
      customer.pppoeUsername.toLowerCase().includes(q) ||
      customer.region.toLowerCase().includes(q)
    );
  });

  const activeCount = customers.filter((customer) => {
    const remainingDays = getRemainingDays(getReferenceActiveUntil(customer));
    return remainingDays !== null && remainingDays >= 0;
  }).length;
  const expiredCount = customers.filter((customer) => {
    const remainingDays = getRemainingDays(getReferenceActiveUntil(customer));
    return remainingDays !== null && remainingDays < 0;
  }).length;
  const unpaidCount = customers.filter((customer) => customer.billingStatus === 'unpaid').length;
  const hasAnyFilter = searchTerm.trim() !== '' || billingStatusFilter !== 'semua' || activeStateFilter !== 'semua' || regionFilter !== 'semua';

  const handleConfirmPayment = async () => {
    if (!selectedCustomer) {
      return;
    }

    setConfirmLoading(true);
    try {
      await recordCustomerPayment(
        selectedCustomer.id,
        'Pembayaran pelanggan dicatat dari modul penagihan dan menambah masa aktif 30 hari.',
      );
      setSelectedCustomer(null);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <WorkspaceSectionShell
        eyebrow="Billing 30 Hari"
        title="Daftar pelanggan dan masa aktif paket"
        badge={`${filteredCustomers.length} pelanggan terlihat`}
        actions={(
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setBillingStatusFilter('semua');
              setActiveStateFilter('semua');
              setRegionFilter('semua');
            }}
            disabled={!hasAnyFilter}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition-colors ${
              hasAnyFilter
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        )}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="grid gap-3 xl:grid-cols-[1.35fr_0.7fr_0.8fr_0.9fr]">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari ID pelanggan, nama, nomor HP, PPPoE, atau wilayah..."
                className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
              />
            </label>

            <div className="relative">
              <select
                value={billingStatusFilter}
                onChange={(event) => setBillingStatusFilter(event.target.value as 'semua' | 'paid' | 'unpaid' | 'pending')}
                className="h-full min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="semua">Status Tagihan: Semua</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={activeStateFilter}
                onChange={(event) => setActiveStateFilter(event.target.value as 'semua' | 'aktif' | 'hampir_habis' | 'expired')}
                className="h-full min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="semua">Masa Aktif: Semua</option>
                <option value="aktif">Aktif</option>
                <option value="hampir_habis">Hampir Habis</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={regionFilter}
                onChange={(event) => setRegionFilter(event.target.value)}
                className="h-full min-h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="semua">Wilayah: Semua</option>
                {regionOptions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Paket</th>
                <th className="px-4 py-3">Status Tagihan</th>
                <th className="px-4 py-3">Masa Aktif Mulai</th>
                <th className="px-4 py-3">Masa Aktif Sampai</th>
                <th className="px-4 py-3">Pembayaran Terakhir</th>
                <th className="px-4 py-3">Status Aktif</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                const activeState = getActiveState(customer);

                return (
                  <tr key={customer.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{customer.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{customer.packagePlan}</div>
                      <div className="font-mono text-[11px] text-emerald-700">
                        Rp {customer.monthlyFee.toLocaleString('id-ID')} / 30 hari
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <WorkspaceStatusPill
                        label={customer.billingStatus.toUpperCase()}
                        tone={customer.billingStatus === 'paid' ? 'emerald' : customer.billingStatus === 'pending' ? 'sky' : 'rose'}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(customer.serviceStartedAt ?? customer.installedDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(getReferenceActiveUntil(customer))}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(customer.lastPaymentDate)}</td>
                    <td className="px-4 py-3">
                      <WorkspaceStatusPill label={activeState.label} tone={activeState.tone} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(customer)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
                      >
                        Bayar / Perpanjang 30 Hari
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            {customers.length === 0
              ? 'Belum ada data pelanggan yang masuk ke modul penagihan.'
              : 'Tidak ada pelanggan yang cocok dengan search atau filter penagihan saat ini.'}
          </div>
        )}
      </WorkspaceSectionShell>

      <ConfirmActionModal
        open={selectedCustomer !== null}
        title="Konfirmasi Pembayaran Pelanggan"
        message={
          selectedCustomer
            ? `Pembayaran pelanggan ${selectedCustomer.name} (${selectedCustomer.id}) akan dicatat. Sistem akan memperpanjang masa aktif 30 hari dari akhir masa aktif saat ini jika masih aktif, atau dari tanggal bayar bila sudah expired.`
            : ''
        }
        confirmLabel="Ya, Catat Pembayaran"
        tone="success"
        loading={confirmLoading}
        onCancel={() => setSelectedCustomer(null)}
        onConfirm={() => void handleConfirmPayment()}
      />
    </div>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Receipt,
  RotateCcw,
  Search,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, MasterDataGroup } from '../../types';
import { InvoiceModal } from '../modals/InvoiceModal';
import { PaymentConfirmationModal } from '../modals/PaymentConfirmationModal';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';
import { DEFAULT_PAYMENT_CHANNELS, PaymentChannelItem } from '../../utils/invoice';

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
  const { authFetch } = useAuth();
  const { customers, recordCustomerPayment } = useIOMS();
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
  const [selectedCustomerForInvoice, setSelectedCustomerForInvoice] = useState<Customer | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelItem[]>(DEFAULT_PAYMENT_CHANNELS);

  const [searchTerm, setSearchTerm] = useState('');
  const [billingStatusFilter, setBillingStatusFilter] = useState<'semua' | 'paid' | 'unpaid' | 'pending'>('semua');
  const [activeStateFilter, setActiveStateFilter] = useState<'semua' | 'aktif' | 'hampir_habis' | 'expired'>('semua');
  const [regionFilter, setRegionFilter] = useState('semua');

  // Load payment channels from Master Data
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
        // Fallback to default channels
        setPaymentChannels(DEFAULT_PAYMENT_CHANNELS);
      }
    };
    void fetchChannels();
  }, []);

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

  const paidCustomers = customers.filter((c) => c.billingStatus === 'paid');
  const unpaidCustomers = customers.filter((c) => c.billingStatus === 'unpaid');
  const expiringCustomers = customers.filter((c) => {
    const remaining = getRemainingDays(getReferenceActiveUntil(c));
    return remaining !== null && remaining <= 5 && remaining >= 0;
  });

  const totalPaidRevenue = paidCustomers.reduce((sum, c) => sum + c.monthlyFee, 0);
  const totalUnpaidReceivable = unpaidCustomers.reduce((sum, c) => sum + c.monthlyFee, 0);

  const hasAnyFilter = searchTerm.trim() !== '' || billingStatusFilter !== 'semua' || activeStateFilter !== 'semua' || regionFilter !== 'semua';

  const handleConfirmPayment = async (payload: { paymentChannel: string; paidAt: string; notes: string }) => {
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

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pendapatan Lunas</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">Rp {totalPaidRevenue.toLocaleString('id-ID')}</div>
          <p className="mt-1 text-xs text-slate-500">{paidCustomers.length} pelanggan telah lunas</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Piutang Belum Bayar</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">Rp {totalUnpaidReceivable.toLocaleString('id-ID')}</div>
          <p className="mt-1 text-xs text-slate-500">{unpaidCustomers.length} pelanggan belum lunas</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hampir Habis (≤5 Hari)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{expiringCustomers.length} Pelanggan</div>
          <p className="mt-1 text-xs text-slate-500">Segera kirimkan pesan tagihan invoice</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Channel Pembayaran</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">{paymentChannels.length} Channel</div>
          <p className="mt-1 text-xs text-slate-500">BCA, Mandiri, MMS, SIS BRO, Kas, QRIS</p>
        </div>
      </div>

      {/* Main Table Shell */}
      <WorkspaceSectionShell
        eyebrow="Penagihan & Invoicing"
        title="Daftar Tagihan Pelanggan, Kirim Invoice WA & Konfirmasi Pembayaran"
        badge={`${filteredCustomers.length} pelanggan ditampilkan`}
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
        {/* Filter Toolbar */}
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
                <option value="paid">Lunas (Paid)</option>
                <option value="unpaid">Belum Bayar (Unpaid)</option>
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
                <option value="hampir_habis">Hampir Habis (≤5 Hari)</option>
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

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Paket & Biaya</th>
                <th className="px-4 py-3">Status Tagihan</th>
                <th className="px-4 py-3">Masa Aktif Mulai</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Pembayaran Terakhir</th>
                <th className="px-4 py-3">Status Aktif</th>
                <th className="px-4 py-3 text-right">Aksi Penagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((customer) => {
                const activeState = getActiveState(customer);

                return (
                  <tr key={customer.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{customer.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{customer.id} • {customer.phone}</div>
                      <div className="text-[11px] text-slate-500">{customer.region}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{customer.packagePlan}</div>
                      <div className="font-mono text-[11px] text-emerald-700 font-bold">
                        Rp {customer.monthlyFee.toLocaleString('id-ID')} / 30 hr
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <WorkspaceStatusPill
                        label={customer.billingStatus.toUpperCase()}
                        tone={customer.billingStatus === 'paid' ? 'emerald' : customer.billingStatus === 'pending' ? 'sky' : 'rose'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{formatDate(customer.serviceStartedAt ?? customer.installedDate)}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{formatDate(getReferenceActiveUntil(customer))}</td>
                    <td className="px-4 py-3.5 text-slate-600">{formatDate(customer.lastPaymentDate)}</td>
                    <td className="px-4 py-3.5">
                      <WorkspaceStatusPill label={activeState.label} tone={activeState.tone} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Button Invoice & Copy WA Message */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForInvoice(customer)}
                          title="Lihat Invoice & Salin Pesan WA"
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                          Invoice & WA
                        </button>

                        {/* Button Pay & Extend */}
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerForPayment(customer)}
                          className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 shadow-xs"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Bayar
                        </button>
                      </div>
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

      {/* Invoice & WhatsApp Copy Modal */}
      <InvoiceModal
        open={selectedCustomerForInvoice !== null}
        customer={selectedCustomerForInvoice}
        paymentChannels={paymentChannels}
        onClose={() => setSelectedCustomerForInvoice(null)}
      />

      {/* Payment Confirmation Modal with Dynamic Channels */}
      {selectedCustomerForPayment && (
        <PaymentConfirmationModal
          open={selectedCustomerForPayment !== null}
          title="Konfirmasi Pembayaran Tagihan"
          customerName={selectedCustomerForPayment.name}
          customerIdOrWo={selectedCustomerForPayment.id}
          amount={selectedCustomerForPayment.monthlyFee}
          paymentType="billing"
          paymentChannels={paymentChannels}
          loading={confirmLoading}
          onCancel={() => setSelectedCustomerForPayment(null)}
          onConfirm={handleConfirmPayment}
        />
      )}
    </div>
  );
};

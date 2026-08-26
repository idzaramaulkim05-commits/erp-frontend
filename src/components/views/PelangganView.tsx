import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownUp,
  CalendarClock,
  Download,
  Eye,
  FileSpreadsheet,
  MapPin,
  Phone,
  Plus,
  Search,
  UploadCloud,
  UserX,
  Wifi,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, CustomerStatus } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { CustomerExcelImportModal } from '../modals/CustomerExcelImportModal';

type CustomerStatusTab = 'semua' | 'aktif' | 'nonaktif';
type CustomerSortKey = 'name' | 'due_date';

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

const formatCurrency = (value: number): string => `Rp ${value.toLocaleString('id-ID')}`;

const getInitials = (name: string): string => (
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'P'
);

const getDueDate = (customer: Customer): string | null => customer.serviceActiveUntil ?? customer.billingDueDate ?? null;

const isCustomerInactive = (status: CustomerStatus): boolean => (
  status === 'pause' || status === 'uninstal_pending' || status === 'uninstalled'
);

const getStatusLabel = (status: CustomerStatus): string => {
  if (status === 'active') return 'Aktif';
  if (status === 'pause') return 'Pause';
  if (status === 'uninstal_pending') return 'Cabut Pending';
  if (status === 'uninstalled') return 'Nonaktif';
  return status.toUpperCase();
};

const getStatusToneClass = (status: CustomerStatus): string => {
  if (status === 'active') return 'bg-emerald-100 text-emerald-700';
  if (status === 'pause') return 'bg-amber-100 text-amber-700';
  if (status === 'uninstal_pending') return 'bg-rose-100 text-rose-700';
  if (status === 'uninstalled') return 'bg-slate-200 text-slate-700';
  return 'bg-sky-100 text-sky-700';
};

const buildPrintDocument = (customers: Customer[]): string => {
  const rows = customers.map((customer, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${customer.id}</td>
      <td>${customer.name}</td>
      <td>${customer.phone}</td>
      <td>${customer.packagePlan}</td>
      <td>${customer.region}</td>
      <td>${getStatusLabel(customer.status)}</td>
      <td>${formatDate(getDueDate(customer))}</td>
    </tr>
  `).join('');

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Export Data Pelanggan</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #0f172a;
          }
          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }
          p {
            margin: 0 0 24px;
            color: #475569;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 10px 12px;
            text-align: left;
            font-size: 12px;
          }
          th {
            background: #e2e8f0;
          }
        </style>
      </head>
      <body>
        <h1>Daftar Pelanggan</h1>
        <p>Total ${customers.length} pelanggan terfilter.</p>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>ID</th>
              <th>Nama</th>
              <th>Telepon</th>
              <th>Paket</th>
              <th>Wilayah</th>
              <th>Status</th>
              <th>Jatuh Tempo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
};

const CustomerDetailModal: React.FC<{
  customer: Customer | null;
  onClose: () => void;
}> = ({ customer, onClose }) => {
  if (!customer) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-indigo-600 text-2xl font-black text-white">
                {getInitials(customer.name)}
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">{customer.name}</h3>
                <p className="mt-1 font-mono text-sm text-slate-500">{customer.pppoeUsername || customer.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Identitas</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold text-slate-900">ID:</span> {customer.id}</div>
              <div><span className="font-semibold text-slate-900">Telepon:</span> {customer.phone}</div>
              <div><span className="font-semibold text-slate-900">NIK:</span> {customer.nik}</div>
              <div><span className="font-semibold text-slate-900">Alamat:</span> {customer.address}</div>
              <div><span className="font-semibold text-slate-900">Wilayah:</span> {customer.region}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Layanan</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold text-slate-900">Paket:</span> {customer.packagePlan}</div>
              <div><span className="font-semibold text-slate-900">Biaya:</span> {formatCurrency(customer.monthlyFee)}</div>
              <div><span className="font-semibold text-slate-900">Status:</span> {getStatusLabel(customer.status)}</div>
              <div><span className="font-semibold text-slate-900">Billing:</span> {customer.billingStatus.toUpperCase()}</div>
              <div><span className="font-semibold text-slate-900">Jatuh Tempo:</span> {formatDate(getDueDate(customer))}</div>
              <div><span className="font-semibold text-slate-900">Instalasi:</span> {formatDate(customer.installedDate)}</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Koneksi</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold text-slate-900">PPPoE Username:</span> {customer.pppoeUsername || '-'}</div>
              <div><span className="font-semibold text-slate-900">PPPoE Password:</span> {customer.pppoePassword || '-'}</div>
              <div><span className="font-semibold text-slate-900">IP Address:</span> {customer.ipAddress || '-'}</div>
              <div><span className="font-semibold text-slate-900">Optical Power:</span> {customer.opticalPowerDbm ?? '-'} dBm</div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Perangkat</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div><span className="font-semibold text-slate-900">ONT Brand:</span> {customer.ontBrand || '-'}</div>
              <div><span className="font-semibold text-slate-900">ONT Model:</span> {customer.ontModel || '-'}</div>
              <div><span className="font-semibold text-slate-900">Serial Number:</span> {customer.ontSerialNumber || '-'}</div>
              <div><span className="font-semibold text-slate-900">ODP:</span> {customer.odpId || '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PelangganView: React.FC = () => {
  const navigate = useNavigate();
  const { customers, updateCustomerStatus, activeRole, currentUser } = useIOMS();
  const isSuperadmin = activeRole === 'superadmin' || currentUser?.role === 'superadmin';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<CustomerStatusTab>('semua');
  const [sortKey, setSortKey] = useState<CustomerSortKey>('name');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<Customer | null>(null);
  const [uninstallLoading, setUninstallLoading] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const rows = customers.filter((customer) => {
      if (statusTab === 'aktif' && customer.status !== 'active') {
        return false;
      }

      if (statusTab === 'nonaktif' && !isCustomerInactive(customer.status)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        customer.address.toLowerCase().includes(query) ||
        customer.pppoeUsername.toLowerCase().includes(query) ||
        customer.id.toLowerCase().includes(query)
      );
    });

    return [...rows].sort((left, right) => {
      if (sortKey === 'due_date') {
        const leftTime = new Date(getDueDate(left) ?? '9999-12-31').getTime();
        const rightTime = new Date(getDueDate(right) ?? '9999-12-31').getTime();
        return leftTime - rightTime;
      }

      return left.name.localeCompare(right.name, 'id');
    });
  }, [customers, searchTerm, sortKey, statusTab]);

  const activeCustomers = customers.filter((customer) => customer.status === 'active').length;
  const inactiveCustomers = customers.filter((customer) => isCustomerInactive(customer.status)).length;

  const handleExport = () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintDocument(filteredCustomers));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleConfirmUninstall = async () => {
    if (!uninstallTarget) {
      return;
    }

    setUninstallLoading(true);
    try {
      await updateCustomerStatus(
        uninstallTarget.id,
        'uninstal_pending',
        'Pencabutan alat dipicu dari modul pelanggan. Sistem akan membuat ticket uninstall, WO pencabutan, dan antrean retur gudang.',
      );
      setUninstallTarget(null);
    } finally {
      setUninstallLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-linear-to-br from-sky-50 via-white to-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 px-6 py-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Daftar Pelanggan</h1>
            <p className="mt-2 text-base text-slate-600">
              Total {customers.length} pelanggan terdaftar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:from-emerald-700 hover:to-teal-700 shadow-xs"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Import Excel
              </button>
            )}
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/registrasi-pelanggan-baru')}
              className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-sky-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:from-sky-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Aktivasi Baru
            </button>
          </div>
        </div>
      </section>

      {isSuperadmin && (
        <section className="rounded-3xl border border-emerald-200/90 bg-linear-to-r from-emerald-50/90 via-teal-50/60 to-white p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    Superadmin Only
                  </span>
                  <h3 className="text-sm font-bold text-slate-950">Panel Import Data Pelanggan via Excel</h3>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Unggah file excel untuk menambahkan banyak pelanggan sekaligus lengkap dengan pengecekan kelayakan, validasi nomor HP, ODP, dan konfirmasi sebelum import.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const csvContent =
                    '\uFEFF' +
                    'Nama Pelanggan,NIK,Nomor HP,Alamat,Wilayah,Paket Layanan,Tarif Bulanan,ODP ID,Status Pembayaran\n' +
                    'Budi Santoso,3201123456780001,081234567890,Jl. Mawar No. 12 RT 01 RW 02,Denpasar,Home 50 Mbps,300000,ODP-DPS-01,Lunas\n' +
                    'Siti Aminah,3201987654320002,081987654321,Jl. Melati No. 45,Badung,Home 30 Mbps,200000,ODP-BDG-01,Lunas\n' +
                    'I Wayan Koster,5101012345670003,082134567899,Jl. Gatot Subroto No. 88,Denpasar,Business 100 Mbps,500000,,Lunas\n';

                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'template_import_pelanggan.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Template</span>
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload & Cek Data</span>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama, telepon, alamat, atau username PPPoE..."
                className="w-full bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              {[
                { key: 'semua', label: 'Semua' },
                { key: 'aktif', label: 'Aktif' },
                { key: 'nonaktif', label: 'Nonaktif' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key as CustomerStatusTab)}
                  className={`rounded-2xl px-6 py-3 text-sm font-bold transition ${
                    statusTab === tab.key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold">Urutkan:</span>
            <button
              type="button"
              onClick={() => setSortKey('name')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold transition ${
                sortKey === 'name'
                  ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ArrowDownUp className="h-4 w-4" />
              Nama
            </button>
            <button
              type="button"
              onClick={() => setSortKey('due_date')}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 font-semibold transition ${
                sortKey === 'due_date'
                  ? 'bg-sky-100 text-sky-700 ring-1 ring-sky-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CalendarClock className="h-4 w-4" />
              Jatuh Tempo
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-4 xl:grid-cols-4 lg:grid-cols-3 sm:grid-cols-2">
        {filteredCustomers.map((customer) => (
          <article
            key={customer.id}
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.11)]"
          >
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-sky-500 to-indigo-600 text-lg font-black text-white">
                    {getInitials(customer.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-black leading-tight tracking-tight text-slate-950 break-words">
                      {customer.name}
                    </h3>
                    <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                      {customer.pppoeUsername || customer.id}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusToneClass(customer.status)}`}>
                  {getStatusLabel(customer.status)}
                </span>
              </div>
            </div>

            <div className="space-y-3 px-4 py-4 text-slate-700">
              <div className="flex items-start gap-2.5 text-sm">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{customer.phone}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <div>{customer.packagePlan}</div>
                  <div className="mt-0.5 text-sm font-semibold text-emerald-700">{formatCurrency(customer.monthlyFee)}</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>{customer.address || customer.region}</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>Jatuh tempo: {formatDate(getDueDate(customer))}</span>
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(customer)}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Detail
                </button>
                <button
                  type="button"
                  onClick={() => setUninstallTarget(customer)}
                  disabled={customer.status === 'uninstal_pending' || customer.status === 'uninstalled'}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserX className="h-3.5 w-3.5" />
                  {customer.status === 'uninstal_pending'
                    ? 'Pending'
                    : customer.status === 'uninstalled'
                    ? 'Closed'
                    : 'Cabut'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {filteredCustomers.length === 0 && (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <h3 className="text-lg font-black text-slate-900">
            {customers.length === 0 ? 'Belum ada pelanggan terdaftar' : 'Tidak ada pelanggan yang cocok'}
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            {customers.length === 0
              ? 'Data pelanggan akan muncul di sini setelah proses registrasi dan aktivasi selesai.'
              : 'Coba ubah kata pencarian, status layanan, atau urutan data untuk melihat hasil lain.'}
          </p>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Total Pelanggan</p>
          <p className="mt-3 text-3xl font-black text-slate-950">{customers.length}</p>
          <p className="mt-1 text-sm text-slate-500">Seluruh customer yang sudah terbentuk di sistem.</p>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Layanan Aktif</p>
          <p className="mt-3 text-3xl font-black text-emerald-700">{activeCustomers}</p>
          <p className="mt-1 text-sm text-slate-500">Customer yang saat ini masih berstatus aktif.</p>
        </div>
        <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Layanan Nonaktif</p>
          <p className="mt-3 text-3xl font-black text-rose-700">{inactiveCustomers}</p>
          <p className="mt-1 text-sm text-slate-500">Customer dengan status pause, cabut pending, atau nonaktif.</p>
        </div>
      </div>

      <CustomerDetailModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      <ConfirmActionModal
        open={uninstallTarget !== null}
        title="Konfirmasi Pencabutan Alat"
        message={
          uninstallTarget
            ? `Pelanggan ${uninstallTarget.name} akan diproses ke status cabut pending. Sistem akan membuat ticket uninstall, WO pencabutan ke Kepala Teknisi, dan ticket baru benar-benar selesai setelah alat diterima gudang.`
            : ''
        }
        confirmLabel="Ya, Proses Uninstall"
        tone="danger"
        loading={uninstallLoading}
        onCancel={() => setUninstallTarget(null)}
        onConfirm={() => {
          void handleConfirmUninstall();
        }}
      />
      <CustomerExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  MessageCircle,
  Printer,
  X,
} from 'lucide-react';
import { Customer } from '../../types';
import {
  DEFAULT_PAYMENT_CHANNELS,
  formatCurrency,
  generateBillingWhatsAppMessage,
  generateInvoiceNumber,
  PaymentChannelItem,
} from '../../utils/invoice';

interface InvoiceModalProps {
  open: boolean;
  customer: Customer | null;
  paymentChannels?: PaymentChannelItem[];
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  open,
  customer,
  paymentChannels = DEFAULT_PAYMENT_CHANNELS,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open || !customer) return null;

  const invoiceNumber = generateInvoiceNumber(customer);
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const activeUntilFormatted = customer.serviceActiveUntil
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(customer.serviceActiveUntil))
    : customer.billingDueDate
    ? new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(customer.billingDueDate))
    : '30 Hari Sejak Aktivasi';

  const waMessage = generateBillingWhatsAppMessage(customer, invoiceNumber, paymentChannels);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(waMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = waMessage;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const cleanPhone = customer.phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-[32px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Invoice Tagihan Internet</h2>
              <p className="text-xs text-slate-400 font-mono">{invoiceNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Invoice Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner Info */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ditagihkan Kepada:</span>
              <div className="mt-1 text-sm font-black text-slate-950">{customer.name}</div>
              <div className="text-xs text-slate-600 font-mono mt-0.5">{customer.id} • {customer.phone}</div>
              <div className="text-xs text-slate-500 mt-1">{customer.address || customer.region}</div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Informasi Tagihan:</span>
              <div className="mt-1 text-xs font-semibold text-slate-700">Tanggal: {todayFormatted}</div>
              <div className="text-xs font-semibold text-slate-700">Jatuh Tempo: {activeUntilFormatted}</div>
              <div className="mt-2">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  customer.billingStatus === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {customer.billingStatus === 'paid' ? 'LUNAS (PAID)' : 'MENUNGGU PEMBAYARAN'}
                </span>
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Deskripsi Layanan</th>
                  <th className="px-4 py-3 text-center">Periode</th>
                  <th className="px-4 py-3 text-right">Biaya Bulanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{customer.packagePlan}</div>
                    <div className="text-slate-500 text-[11px]">PPPoE: {customer.pppoeUsername}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-700 font-medium">30 Hari</td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">{formatCurrency(customer.monthlyFee)}</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-slate-700 uppercase tracking-wider text-xs">Total Pembayaran</td>
                  <td className="px-4 py-3 text-right text-base text-emerald-700 font-black">{formatCurrency(customer.monthlyFee)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Channels Reference */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">Rekening Pembayaran Resmi:</h4>
            <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {paymentChannels.map((channel) => (
                <div key={channel.name} className="rounded-xl border border-emerald-200/80 bg-white p-2.5">
                  <div className="font-bold text-slate-900">{channel.name}</div>
                  {channel.accountNumber && channel.accountNumber !== '-' ? (
                    <div className="font-mono text-emerald-700 font-bold mt-0.5">{channel.accountNumber}</div>
                  ) : null}
                  {channel.accountHolder ? (
                    <div className="text-[11px] text-slate-500">a/n {channel.accountHolder}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Text Preview Box */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Preview Pesan WhatsApp:</span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1 text-xs font-bold text-white transition hover:bg-slate-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Tersalin!' : 'Salin Pesan'}
              </button>
            </div>
            <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3 font-sans text-xs leading-relaxed text-slate-700">
              {waMessage}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <Printer className="h-4 w-4" />
            Cetak Invoice
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Pesan Berhasil Disalin!' : 'Salin Pesan Tagihan'}
            </button>

            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Kirim ke WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

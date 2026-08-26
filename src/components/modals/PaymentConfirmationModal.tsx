import React, { useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  Landmark,
  X,
} from 'lucide-react';
import {
  DEFAULT_PAYMENT_CHANNELS,
  formatCurrency,
  PaymentChannelItem,
} from '../../utils/invoice';

interface PaymentConfirmationModalProps {
  open: boolean;
  title: string;
  customerName: string;
  customerIdOrWo: string;
  amount: number;
  paymentType?: 'billing' | 'installation_cash' | 'installation_transfer';
  paymentChannels?: PaymentChannelItem[];
  defaultChannel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (payload: { paymentChannel: string; paidAt: string; notes: string }) => Promise<void>;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  open,
  title,
  customerName,
  customerIdOrWo,
  amount,
  paymentType = 'billing',
  paymentChannels = DEFAULT_PAYMENT_CHANNELS,
  defaultChannel,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const [channel, setChannel] = useState(
    defaultChannel || paymentChannels[0]?.name || 'Transfer Kantor (BCA)',
  );
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({
      paymentChannel: channel,
      paidAt,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-950">{title}</h3>
              <p className="text-xs text-slate-500 font-mono">{customerIdOrWo} • {customerName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Summary Card */}
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                {paymentType === 'billing' ? 'Nominal Tagihan Bulanan' : 'Nominal Biaya Pasang Baru'}
              </span>
              <div className="text-xl font-black text-emerald-950 mt-0.5">{formatCurrency(amount)}</div>
            </div>
            <div className="rounded-xl bg-emerald-600/10 px-3 py-1.5 text-xs font-bold text-emerald-800">
              {paymentType === 'billing' ? '+30 Hari Aktif' : 'Pemasangan Lunas'}
            </div>
          </div>

          {/* Payment Channel Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Channel / Rekening Penerimaan Uang:
            </label>
            <div className="relative">
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition"
              >
                {paymentChannels.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} {c.accountNumber && c.accountNumber !== '-' ? `(${c.accountNumber})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              *Pilihan channel diambil dari Master Data referensi keuangan dan otomatis dicatat ke Laporan Keuangan.
            </p>
          </div>

          {/* Date Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Tanggal Penerimaan / Pembayaran:
            </label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition"
            />
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Catatan Pembayaran (Opsional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Disetor tunai oleh teknisi Bambang / Transfer via m-banking ref #12345"
              rows={2}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition placeholder:text-slate-400"
            />
          </div>

          {/* Ledger notice */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
            ℹ️ Konfirmasi ini otomatis membuat entri mutasi pemasukan di <strong>Laporan Keuangan</strong> dengan kategori dan channel yang dipilih.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Konfirmasi & Catat Pemasukan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Printer, CheckCircle2, Building2, Phone, Calendar, User, Wifi } from 'lucide-react';
import { InvoiceItem } from '../../types';

interface InvoicePrintModalProps {
  invoice: InvoiceItem;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 print:border-none print:shadow-none print:rounded-none">
        
        {/* Actions Bar (Hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <span className="text-sm font-bold">Kwitansi Pembayaran #{invoice.nomor_invoice}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kwitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 space-y-6 text-slate-800" id="printable-receipt">
          {/* Company Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="text-2xl font-black text-indigo-700 tracking-wider">EONET ISP</div>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                PT. EONET Solusi Telekomunikasi<br />
                Penyedia Layanan Internet Dedicated & Broadband<br />
                WhatsApp CS: 0812-3456-7890
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                {invoice.status_bayar === 'paid' ? 'LUNAS (PAID)' : 'TAGIHAN (UNPAID)'}
              </span>
              <div className="font-mono text-sm font-bold text-slate-900 mt-2">
                #{invoice.nomor_invoice}
              </div>
              <div className="text-xs text-slate-500">
                Periode: {invoice.periode_formatted || `Bulan ${invoice.periode_bulan}/${invoice.periode_tahun}`}
              </div>
            </div>
          </div>

          {/* Customer & Billing Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Ditagihkan Kepada:</span>
              <div className="text-sm font-bold text-slate-900">{invoice.nama_pelanggan || invoice.pelanggan_username}</div>
              <div className="font-mono text-slate-600">ID / Username: {invoice.pelanggan_username}</div>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">Rincian Pembayaran:</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Bayar:</span>
                <span className="font-semibold text-slate-800 uppercase">{invoice.metode_bayar || 'Transfer / Tunai'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tgl Pembayaran:</span>
                <span className="font-semibold text-slate-800">{invoice.dibayar_pada || '-'}</span>
              </div>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3 px-4">Deskripsi Layanan</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">Biaya Langganan Internet EONET</div>
                    <div className="text-slate-500 text-[11px]">Periode {invoice.periode_formatted || `${invoice.periode_bulan}/${invoice.periode_tahun}`}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    Rp {Number(invoice.total_tagihan).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold text-sm border-t border-slate-200">
                  <td className="py-3 px-4 text-slate-800">TOTAL PEMBAYARAN</td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-700 font-black">
                    Rp {Number(invoice.total_dibayar || invoice.total_tagihan).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Signature */}
          <div className="pt-8 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Terima kasih telah berlangganan layanan internet EONET.</p>
              <p className="text-[10px] text-slate-400">Kwitansi ini adalah bukti pembayaran yang sah dan dicetak secara otomatis oleh sistem.</p>
            </div>

            <div className="text-center space-y-12">
              <span>Petugas Kasir / Finance</span>
              <div className="border-b border-slate-400 w-36 mx-auto font-bold text-slate-800">
                EONET Finance
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

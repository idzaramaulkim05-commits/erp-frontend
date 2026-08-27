import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { ProcurementRequest } from '../../types';

interface ConfirmProcurementPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest | null;
  onConfirm: (payload: { paymentProof: File; paymentChannel: string; notes: string }) => Promise<void>;
}

const PAYMENT_CHANNELS = [
  'Transfer Bank BCA (Kas Utama)',
  'Transfer Bank Mandiri (Operasional)',
  'Transfer Bank BRI',
  'Transfer Bank BNI',
  'Kas Kecil Tunai (Petty Cash)',
  'Kartu Debit / Kredit Corporate',
  'QRIS / Dompet Digital Bisnis',
];

export const ConfirmProcurementPaymentModal: React.FC<ConfirmProcurementPaymentModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirm,
}) => {
  const [paymentChannel, setPaymentChannel] = useState<string>(PAYMENT_CHANNELS[0]);
  const [notes, setNotes] = useState<string>('Uang telah ditransfer/diserahkan oleh Finance ke vendor.');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !request) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran file bukti bayar maksimal 5 MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Wajib melampirkan file bukti bayar / transfer kirim uang!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onConfirm({
        paymentProof: selectedFile,
        paymentChannel,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal mengonfirmasi pembayaran pengadaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="text-sm font-bold">Konfirmasi Pembayaran Pengadaan</h3>
              <p className="text-[11px] text-emerald-200">Verifikasi pencairan uang & upload bukti transfer resmi Finance</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-emerald-300">
                {request.id}
              </span>
              <span className="font-bold text-emerald-800 text-sm font-mono">
                Rp {request.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="text-slate-800 font-semibold text-sm">
              {request.itemName}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
              <div>
                <span className="text-slate-400 block">Kuantitas:</span>
                <strong>{request.quantity} {request.unit}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Pemohon:</span>
                <strong>{request.requestedBy}</strong>
              </div>
            </div>

            {request.managementApproval?.by && (
              <div className="flex items-center gap-1.5 text-[11px] text-purple-800 bg-purple-100/70 px-2.5 py-1 rounded-xl">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>
                  Telah disetujui Direktur/Manajemen (<strong>{request.managementApproval.by}</strong>
                  {request.managementApproval.at ? ` - ${request.managementApproval.at}` : ''})
                </span>
              </div>
            )}
          </div>

          {/* Error alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Peringatan:</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Upload Bukti Bayar / Transfer */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-900">
              1. Lampirkan Bukti Bayar / Kirim Uang (Wajib) *:
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                selectedFile
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {previewUrl ? (
                <div className="space-y-2 flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Preview Bukti Bayar"
                    className="max-h-36 rounded-xl object-contain border border-emerald-300 shadow-xs"
                  />
                  <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
                  </span>
                  <span className="text-[10px] text-slate-500 underline">Klik untuk mengganti foto/file</span>
                </div>
              ) : selectedFile ? (
                <div className="space-y-1 flex flex-col items-center">
                  <FileText className="w-10 h-10 text-emerald-600" />
                  <span className="font-bold text-slate-900 text-xs">{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB (PDF Dokumen)</span>
                  <span className="text-[10px] text-slate-500 underline mt-1">Klik untuk mengganti file</span>
                </div>
              ) : (
                <div className="space-y-1 py-3">
                  <UploadCloud className="w-9 h-9 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-800">Klik di sini untuk upload Bukti Transfer / Struk Bayar</p>
                  <p className="text-[10px] text-slate-400">Format yang didukung: JPG, PNG, WEBP, PDF (Maksimal 5 MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Saluran Pembayaran */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-900">
              2. Rekening / Sumber Pembayaran *:
            </label>
            <select
              value={paymentChannel}
              onChange={(e) => setPaymentChannel(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            >
              {PAYMENT_CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Catatan Pembayaran */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-900">
              3. Catatan Transaksi / No. Referensi Pembayaran:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: No Ref Transfer KlikBCA 20260827-0988. Dana Rp 7.500.000 sudah diserahkan ke vendor."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi Uang Sudah Dibayarkan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

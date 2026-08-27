import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface ViewProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  proofUrl: string | null;
  details?: {
    confirmedBy?: string | null;
    confirmedAt?: string | null;
    channel?: string | null;
    notes?: string | null;
  };
}

export const ViewProofModal: React.FC<ViewProofModalProps> = ({
  isOpen,
  onClose,
  title,
  proofUrl,
  details,
}) => {
  if (!isOpen || !proofUrl) return null;

  const isPdf = proofUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-[11px] text-slate-300">Lampiran bukti pembayaran / transfer resmi Finance</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {details && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Dikonfirmasi Oleh</span>
                <strong className="text-slate-800">{details.confirmedBy || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Waktu Bayar</span>
                <strong className="text-slate-800">{details.confirmedAt || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Metode Bayar</span>
                <strong className="text-emerald-700">{details.channel || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Catatan</span>
                <strong className="text-slate-700 truncate block">{details.notes || '-'}</strong>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-slate-100 p-2 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-auto">
            {isPdf ? (
              <div className="text-center py-10 space-y-3">
                <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Dokumen PDF Terlampir</p>
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Dokumen PDF di Tab Baru
                </a>
              </div>
            ) : (
              <img
                src={proofUrl}
                alt="Bukti Pembayaran"
                className="max-h-[460px] max-w-full rounded-xl object-contain shadow-xs"
              />
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href={proofUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
            >
              <Download className="w-4 h-4" />
              Download File Bukti
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  CheckCircle2,
  FileCheck,
  MessageCircle,
  Printer,
  User,
  Wifi,
  X,
} from 'lucide-react';
import { WorkOrder } from '../../types';

interface BeritaAcaraModalProps {
  open: boolean;
  workOrder: WorkOrder | null;
  macAddress: string;
  opticalPower: string;
  installationFee: string;
  paymentMethod: string;
  technicianName?: string;
  onClose: () => void;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  open,
  workOrder,
  macAddress,
  opticalPower,
  installationFee,
  paymentMethod,
  technicianName = 'Tim Teknisi Lapangan',
  onClose,
}) => {
  if (!open || !workOrder) return null;

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const maskNik = (nik?: string | null): string => {
    if (!nik || nik.trim() === '') return '351XXX001';
    const clean = nik.replace(/\D/g, '');
    if (clean.length < 6) return clean ? `${clean.slice(0, 3)}XXX` : '351XXX001';
    const prefix = clean.slice(0, 3);
    const suffix = clean.slice(-3);
    return `${prefix}XXX${suffix}`;
  };

  const cleanPhone = (workOrder.customerPhone ?? '').replace(/[^0-9]/g, '').replace(/^0/, '62');
  const waMessage =
    `*BERITA ACARA AKTIVASI LAYANAN INTERNET*\n\n` +
    `No. Berita Acara: BA-${workOrder.id}\n` +
    `Tanggal: ${todayFormatted}\n\n` +
    `*Data Pelanggan:*\n` +
    `• Nama: ${workOrder.customerName}\n` +
    `• NIK: ${maskNik(workOrder.customerNik || (workOrder.surveySnapshot as Record<string, unknown>)?.nik as string)}\n` +
    `• Kontak: ${workOrder.customerPhone}\n` +
    `• Alamat: ${workOrder.address}\n` +
    `• Paket: ${workOrder.packagePlan ?? 'Home Fiber'}\n\n` +
    `*Data Teknis & Perangkat:*\n` +
    `• MAC Address Router: ${macAddress || '-'}\n` +
    `• Redaman OPM: ${opticalPower ? `${opticalPower} dBm` : '-'}\n` +
    `• Titik ODP: ${workOrder.odpId || '-'}\n` +
    `• Biaya Pasang: Rp ${Number(installationFee || 0).toLocaleString('id-ID')} (${paymentMethod === 'tunai' ? 'Tunai' : paymentMethod === 'transfer' ? 'Transfer' : 'Sesuai Tagihan'})\n\n` +
    `*Teknisi Pelaksana:* ${technicianName}\n\n` +
    `Dengan ini pelanggan menyatakan bahwa layanan internet telah terpasang dengan baik, koneksi aktif normal, dan menyetujui aktivasi layanan.\n` +
    `Terima kasih telah menggunakan layanan PT Solusi Jaringan Nusantara!`;

  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="flex max-h-[94vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800 bg-emerald-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight sm:text-base">Berita Acara Aktivasi & Serah Terima</h2>
              <p className="text-[11px] text-emerald-300 font-mono">BA-{workOrder.id} • {todayFormatted}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-300 hover:bg-emerald-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-slate-800">
          {/* Company Brand Header */}
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black tracking-tight text-slate-950">PT SOLUSI JARINGAN NUSANTARA</h3>
              <p className="text-[11px] text-slate-500">Divisi Operasional & Field Engineering</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Terpasang & Aktif
            </span>
          </div>

          {/* Customer & Location */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-600" /> Identitas Pelanggan
            </span>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Pelanggan</span>
                <strong className="text-sm font-bold text-slate-950">{workOrder.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">NIK (No. KTP)</span>
                <strong className="text-sm font-mono font-bold text-slate-900">
                  {maskNik(workOrder.customerNik || (workOrder.surveySnapshot as Record<string, unknown>)?.nik as string)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Nomor Telepon / WhatsApp</span>
                <strong className="text-slate-900 font-mono">{workOrder.customerPhone || '-'}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Jenis Kelamin</span>
                <span className="font-semibold text-slate-800">{workOrder.customerGender || 'Laki-laki'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px]">Alamat Pemasangan</span>
                <span className="font-semibold text-slate-900">{workOrder.address} ({workOrder.region})</span>
              </div>
            </div>
          </div>

          {/* Technical Specs & Device */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-slate-600" /> Data Teknis & Perangkat
            </span>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-3 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Paket Internet</span>
                <strong className="text-xs font-bold text-slate-900">{workOrder.packagePlan || 'Home Fiber'}</strong>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Titik ODP</span>
                <strong className="text-xs font-bold text-emerald-800 font-mono">{workOrder.odpId || '-'}</strong>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Redaman OPM</span>
                <strong className="text-xs font-bold text-emerald-800 font-mono">{opticalPower ? `${opticalPower} dBm` : '-'}</strong>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200 sm:col-span-2">
                <span className="text-slate-400 block text-[10px] font-bold">MAC Address Router / ONT</span>
                <strong className="text-xs font-mono font-bold text-slate-950">{macAddress || '-'}</strong>
              </div>
              <div className="rounded-xl bg-white p-3 border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold">Biaya Pemasangan</span>
                <strong className="text-xs font-bold text-slate-900">
                  Rp {Number(installationFee || 0).toLocaleString('id-ID')}
                </strong>
                <span className="text-[10px] text-slate-500 block">({paymentMethod || 'Belum dipilih'})</span>
              </div>
            </div>
          </div>

          {/* Statement & Agreement */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-[11px] text-emerald-950 space-y-2">
            <p className="font-semibold leading-relaxed">
              Pernyataan Serah Terima:
            </p>
            <p className="leading-relaxed text-slate-700">
              Pelanggan telah menerima instalasi jaringan internet fiber dalam kondisi baik, perangkat router telah terpasang dan berfungsi normal, serta telah menerima petunjuk penggunaan layanan dari teknisi.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-center text-xs">
            <div className="space-y-12">
              <span className="text-slate-500 block text-[11px]">Teknisi Lapangan,</span>
              <strong className="block border-t border-dashed border-slate-300 pt-1 font-bold text-slate-900">
                {technicianName}
              </strong>
            </div>
            <div className="space-y-12">
              <span className="text-slate-500 block text-[11px]">Pelanggan,</span>
              <strong className="block border-t border-dashed border-slate-300 pt-1 font-bold text-slate-900">
                {workOrder.customerName}
              </strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Cetak Dokumen</span>
          </button>

          <div className="flex items-center gap-2">
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Kirim ke WhatsApp</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

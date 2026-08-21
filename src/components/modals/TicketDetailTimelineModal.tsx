import React from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  User,
  Radio,
  Wrench,
  ShieldCheck,
  Camera,
  MapPin,
  Phone,
  FileCheck2,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { TroubleTicket } from '../../types';

interface TicketDetailTimelineModalProps {
  ticket: TroubleTicket | null;
  onClose: () => void;
}

export const TicketDetailTimelineModal: React.FC<TicketDetailTimelineModalProps> = ({
  ticket,
  onClose,
}) => {
  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
                {ticket.id}
              </span>
              <h3 className="text-sm font-bold">{ticket.title}</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pelanggan: {ticket.customerName} ({ticket.customerId}) • {ticket.odpId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with 5-Step Lifecycle Timeline */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Customer Metadata Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Wilayah / ODP</span>
              <span className="font-bold text-slate-800">{ticket.region} ({ticket.odpId})</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Nomor Kontak</span>
              <span className="font-bold text-slate-800">{ticket.customerPhone}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Prioritas</span>
              <span className="font-bold text-rose-700 uppercase">{ticket.priority}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">Status Saat Ini</span>
              <span className="font-bold text-emerald-700">{ticket.status.toUpperCase()}</span>
            </div>
          </div>

          {/* Timeline Milestones */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rekam Jejak Operasional & Alur Tiket (Audit Trail)
            </h4>

            {/* Step 1: Helpdesk Intake */}
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="w-0.5 h-full bg-emerald-200 mt-1" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Helpdesk / CS Intake</span>
                  <span className="text-[10px] text-slate-400">{ticket.createdAt}</span>
                </div>
                <p className="text-slate-600">{ticket.description}</p>
                <span className="text-[10px] text-slate-500 font-semibold block pt-1">
                  Operator: Rina Kartika (Helpdesk)
                </span>
              </div>
            </div>

            {/* Step 2: NOC Triage / Escalation */}
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="w-0.5 h-full bg-sky-200 mt-1" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">NOC Technical Triage</span>
                  <span className="text-[10px] text-slate-400">Tahap Sinyal</span>
                </div>
                <p className="text-slate-600">
                  {ticket.remoteResolveNotes
                    ? `Penyelesaian Remote: ${ticket.remoteResolveNotes}`
                    : 'Diagnosis OLT: Redaman terputus (Optical LOS Merah). Terbit Work Order fisik ke Kepala Teknisi.'}
                </p>
                <span className="text-[10px] text-slate-500 font-semibold block pt-1">
                  Engineer: Dimas Prasetyo (NOC Lead)
                </span>
              </div>
            </div>

            {/* Step 3: Field Technician Execution */}
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="w-0.5 h-full bg-amber-200 mt-1" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Pengerjaan di Lokasi (Teknisi Lapangan)</span>
                  <span className="text-[10px] text-slate-400">
                    {ticket.fieldWorkReport?.completedAt || 'Dalam Proses'}
                  </span>
                </div>

                {ticket.fieldWorkReport ? (
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-700 font-medium">
                      Tindakan: {ticket.fieldWorkReport.actionTaken}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Nilai Redaman OPM:</span>
                        <strong className="text-emerald-700 font-mono">
                          {ticket.fieldWorkReport.finalOpticalPowerDbm} dBm
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Drop Cable Terpakai:</span>
                        <strong>{ticket.fieldWorkReport.dropCableLengthMeters} Meter</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Patch Cord:</span>
                        <strong>{ticket.fieldWorkReport.patchCordReplaced ? 'Diganti Baru' : 'Lama'}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Menunggu teknisi lapangan mengirim laporan on-site.</p>
                )}
              </div>
            </div>

            {/* Step 4: Lead Tech SOP Review */}
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div className="w-0.5 h-full bg-purple-200 mt-1" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Evaluasi SOP oleh Kepala Teknisi</span>
                  <span className="text-[10px] text-slate-400">
                    {ticket.leadTechApproval?.approvedAt || 'Menunggu Review'}
                  </span>
                </div>

                {ticket.leadTechApproval ? (
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-700">Catatan: {ticket.leadTechApproval.notes}</p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold text-purple-800">
                      <span>✓ Klem Kabel Rapi</span>
                      <span>✓ Protection Sleeve Terpasang</span>
                      <span>✓ Area Bersih</span>
                      <span>✓ Speedtest Sesuai Paket</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Menunggu pemeriksaan standar fisik oleh Kepala Teknisi.</p>
                )}
              </div>
            </div>

            {/* Step 5: NOC Closing */}
            <div className="flex space-x-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </div>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Verifikasi Redaman OLT & Closing (NOC)</span>
                  <span className="text-[10px] text-slate-400">
                    {ticket.nocFinalVerification?.verifiedAt || 'Tahap Terakhir'}
                  </span>
                </div>

                {ticket.nocFinalVerification ? (
                  <div className="space-y-1 text-xs">
                    <p className="text-teal-800 font-semibold">
                      {ticket.nocFinalVerification.notes}
                    </p>
                    <div className="flex gap-3 text-[10px] font-mono text-slate-600">
                      <span>Redaman OLT: {ticket.nocFinalVerification.opticalDbmReading} dBm</span>
                      <span>PPPoE Session: UP / Active</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">NOC akan memvalidasi pembacaan laser OLT sebelum menutup tiket.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Tutup Jendela
          </button>
        </div>
      </div>
    </div>
  );
};

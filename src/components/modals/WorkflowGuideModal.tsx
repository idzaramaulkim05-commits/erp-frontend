import React, { useState } from 'react';
import {
  X,
  Workflow,
  Radio,
  HelpCircle,
  Shield,
  Smartphone,
  Layers,
  Grid,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface WorkflowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkflowGuideModal: React.FC<WorkflowGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeWorkflow, setActiveWorkflow] = useState<number>(1);

  if (!isOpen) return null;

  const workflows = [
    {
      id: 1,
      title: '1. Registrasi & Pasang Baru Otomatis',
      category: 'Sales -> Finance -> NOC -> Lapangan',
      icon: Layers,
      color: 'emerald',
      steps: [
        { label: 'Form Registrasi', desc: 'Input identitas, NIK, alamat, dan paket bandwidth pelanggan.' },
        { label: 'Auto PPPoE & Password', desc: 'Sistem otomatis membangkitkan username PPPoE dan password acak 10 digit.' },
        { label: 'Auto WO Pasang Baru', desc: 'Otomatis menerbitkan Work Order Pemasangan Baru ke antrean Kepala Teknisi.' },
        { label: 'Instalasi & Verifikasi OLT', desc: 'Teknisi pasang kabel & ONT, NOC validasi redaman laser dBm.' }
      ]
    },
    {
      id: 2,
      title: '2. Trouble Ticketing 5-Fase Terpadu',
      category: 'Helpdesk -> NOC -> Lapangan -> Lead Tech -> NOC Closing',
      icon: HelpCircle,
      color: 'blue',
      steps: [
        { label: 'Helpdesk Intake', desc: 'CS input aduan pelanggan (LOS Alarm, Redaman Naik, WiFi Problem) dengan nomor tiket TIK-XXXX.' },
        { label: 'NOC Diagnostic', desc: 'NOC cek status OLT & Mikrotik BRAS. Jika masalah config, remote fix langsung. Jika fisik, eskalasi ke WO.' },
        { label: 'Teknisi Lapangan', desc: 'Teknisi input nilai OPM dBm, meteran drop wire, dan upload 3 foto bukti on-site.' },
        { label: 'Lead Tech SOP Check', desc: 'Kepala Teknisi verifikasi 4 checklist SOP fisik sebelum pengesahan.' },
        { label: 'NOC Final Closing', desc: 'NOC konfirmasi Rx Power OLT & sesi PPPoE aktif sebelum tiket ditutup 100% selesai.' }
      ]
    },
    {
      id: 3,
      title: '3. Auto-Trigger Pencabutan Alat (Uninstal)',
      category: 'Finance -> Auto WO Lapangan -> Gudang -> NOC',
      icon: Shield,
      color: 'rose',
      steps: [
        { label: 'Status Uninstal di Finance', desc: 'Pelanggan menunggak/berhenti langganan diubah statusnya menjadi Uninstal.' },
        { label: 'Auto-Trigger WO Cabut', desc: 'Sistem otomatis menerbitkan Work Order Pencabutan Modem ke Teknisi Lapangan.' },
        { label: 'Pengembalian ke Gudang', desc: 'Modem ONT & adaptor diserahkan ke Gudang untuk pembersihan & QC ulang.' },
        { label: 'NOC Release Binding', desc: 'NOC menghapus username PPPoE di Mikrotik dan unbind SN di OLT.' }
      ]
    },
    {
      id: 4,
      title: '4. Pengadaan Barang Multi-Tier (Procurement)',
      category: 'Gudang -> Finance (<= 5Jt) -> Direksi (> 5Jt)',
      icon: Grid,
      color: 'purple',
      steps: [
        { label: 'Pengajuan Gudang', desc: 'Gudang mengajukan restock ONT ZTE/Huawei, patch cord, atau kabel drop core.' },
        { label: 'Verifikasi Finance', desc: 'Finance memeriksa anggaran. Jika total pengadaan <= Rp 5.000.000, Finance langsung setujui.' },
        { label: 'ACC Eksekutif Direktur', desc: 'Jika pengadaan Capex > Rp 5.000.000, diteruskan ke Dashboard Direksi untuk tanda tangan eksekutif.' },
        { label: 'Stok Masuk Otomatis', desc: 'Barang datang dan otomatis menambah jumlah stok siap pakai di gudang.' }
      ]
    },
    {
      id: 5,
      title: '5. Papan Koordinasi Antar-Divisi (Kanban)',
      category: 'Seluruh 8 Divisi Operasional',
      icon: Workflow,
      color: 'cyan',
      steps: [
        { label: 'Pencatatan Task', desc: 'Mencegah instruksi lisan hilang. Task memiliki prioritas, deadline, dan divisi penanggung jawab.' },
        { label: 'Status Real-Time', desc: 'Pergerakan kolom To-Do -> In Progress -> Review -> Selesai.' },
        { label: 'Log Transparan', desc: 'Setiap update tercatat untuk audit kinerja operasional harian.' }
      ]
    },
    {
      id: 6,
      title: '6. Standar 12 Warna Core Fiber & Port Binding',
      category: 'Infrastruktur Jaringan ODC / ODP',
      icon: Radio,
      color: 'amber',
      steps: [
        { label: 'Standar TIA/EIA-598', desc: '12 Kode Warna Core: Biru, Oranye, Hijau, Cokelat, Abu-abu, Putih, Merah, Hitam, Kuning, Ungu, Pink, Tosca.' },
        { label: 'Port Binding ID Pelanggan', desc: 'Setiap port ODP terikat ke satu ID Pelanggan untuk mencegah sabotase atau over-capacity.' },
        { label: 'Pemetaan Koordinat', desc: 'Visualisasi titik koordinat ODP di lapangan mempermudah penanganan kabel putus.' }
      ]
    }
  ];

  const currentWf = workflows.find((w) => w.id === activeWorkflow) || workflows[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Panduan 6 Alur Kerja Bisnis Standar ISP</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                IOMS Standard Operating Procedures & Integrated Workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Selector */}
        <div className="bg-slate-950 px-6 py-2.5 flex space-x-2 border-b border-slate-800 shrink-0 overflow-x-auto text-xs font-mono">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setActiveWorkflow(wf.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                activeWorkflow === wf.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              Alur #{wf.id}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {currentWf.category}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 tracking-tight">{currentWf.title}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentWf.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors space-y-1.5 relative overflow-hidden"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h5 className="text-xs font-bold text-slate-900">{step.label}</h5>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Semua tahapan di atas telah terotomatisasi dan saling terhubung di IOMS.</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Status: Production Verified</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};

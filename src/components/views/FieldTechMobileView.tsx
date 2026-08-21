import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  Phone,
  Radio,
  ShieldCheck,
  TimerReset,
  UserRound,
  Wrench,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { Customer, WorkOrder } from '../../types';

type WorkQueueFilter = 'all' | 'pending_lead_assignment' | 'assigned' | 'in_progress';

const getWorkOrderStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'pending':
    case 'pending_lead_assignment':
      return 'Menunggu Kepala Teknisi';
    case 'assigned':
      return 'Siap Dikerjakan';
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'sop_submitted':
      return 'Menunggu Review Lead';
    case 'field_submitted':
      return 'Laporan Terkirim';
    case 'waiting_noc_activation':
      return 'Menunggu Verifikasi NOC';
    case 'approved':
      return 'Disetujui';
    case 'completed':
      return 'Selesai';
    default:
      return status;
  }
};

const getWorkOrderStatusTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'pending':
    case 'pending_lead_assignment':
      return 'bg-amber-100 text-amber-800 border border-amber-200';
    case 'assigned':
      return 'bg-sky-100 text-sky-800 border border-sky-200';
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    case 'waiting_noc_activation':
      return 'bg-violet-100 text-violet-800 border border-violet-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
};

const getWorkOrderTypeLabel = (type: WorkOrder['type']) => {
  switch (type) {
    case 'installation':
      return 'Instalasi';
    case 'maintenance':
      return 'Maintenance';
    case 'uninstallation':
      return 'Cabut Alat';
    default:
      return type;
  }
};

const getCustomerByWorkOrder = (customers: Customer[], workOrder: WorkOrder | null) => {
  if (!workOrder) {
    return null;
  }

  return customers.find((customer) => customer.id === workOrder.customerId) ?? null;
};

export const FieldTechMobileView: React.FC = () => {
  const {
    currentUser,
    workOrders,
    customers,
    submitFieldTechReport,
  } = useIOMS();

  const [queueFilter, setQueueFilter] = useState<WorkQueueFilter>('all');
  const [activeWoId, setActiveWoId] = useState<string | null>(null);
  const [showPppoePassword, setShowPppoePassword] = useState<boolean>(false);
  const [opticalDbm, setOpticalDbm] = useState<number>(-20.2);
  const [cableLength, setCableLength] = useState<number>(110);
  const [actionNotes, setActionNotes] = useState<string>('Selesai pasang drop wire 110m, redaman -20.2 dBm di ONT, modem menyala hijau.');
  const [patchCordReplaced, setPatchCordReplaced] = useState<boolean>(true);
  const [hasPhotoKtp, setHasPhotoKtp] = useState<boolean>(true);
  const [hasPhotoOpm, setHasPhotoOpm] = useState<boolean>(true);
  const [hasPhotoModem, setHasPhotoModem] = useState<boolean>(true);
  const [signatureName, setSignatureName] = useState<string>(`${currentUser.name} (${currentUser.roleTitle})`);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const myAssignedWos = useMemo(
    () => workOrders.filter((workOrder) => (
      workOrder.status === 'pending' ||
      workOrder.status === 'pending_lead_assignment' ||
      workOrder.status === 'assigned' ||
      workOrder.status === 'in_progress'
    )),
    [workOrders],
  );

  const completedWos = useMemo(
    () => workOrders.filter((workOrder) => workOrder.status === 'completed' || workOrder.status === 'approved').slice(0, 3),
    [workOrders],
  );

  const filteredWos = useMemo(() => {
    if (queueFilter === 'all') {
      return myAssignedWos;
    }

    return myAssignedWos.filter((workOrder) => workOrder.status === queueFilter);
  }, [myAssignedWos, queueFilter]);

  useEffect(() => {
    if (activeWoId && myAssignedWos.some((workOrder) => workOrder.id === activeWoId)) {
      return;
    }

    const preferredWorkOrder = myAssignedWos.find((workOrder) => workOrder.status === 'in_progress')
      ?? myAssignedWos[0]
      ?? null;

    setActiveWoId(preferredWorkOrder?.id ?? null);
  }, [activeWoId, myAssignedWos]);

  const activeWo = myAssignedWos.find((workOrder) => workOrder.id === activeWoId) ?? null;
  const activeCustomer = getCustomerByWorkOrder(customers, activeWo);
  const todayTaskCount = myAssignedWos.length;
  const inProgressCount = myAssignedWos.filter((workOrder) => workOrder.status === 'in_progress').length;
  const pendingCount = myAssignedWos.filter((workOrder) => ['pending', 'pending_lead_assignment', 'assigned'].includes(workOrder.status)).length;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeWo) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitFieldTechReport(activeWo.id, true, {
        actionTaken: actionNotes,
        patchCordReplaced,
        dropCableLengthMeters: cableLength,
        finalOpticalPowerDbm: opticalDbm,
        photoKtp: hasPhotoKtp ? 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&auto=format&fit=crop&q=80' : undefined,
        photoOpticalPowerMeter: hasPhotoOpm ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80' : undefined,
        photoModemInstallation: hasPhotoModem ? 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=300&auto=format&fit=crop&q=80' : undefined,
        signature: signatureName,
      });

      setIsSubmitting(false);
      setShowPppoePassword(false);
    }, 600);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl overflow-hidden">
        <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[1.4fr,0.9fr] lg:items-end">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              <Radio className="h-3.5 w-3.5" />
              Workspace Teknisi Produksi
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                Dashboard tugas lapangan untuk pekerjaan hari ini
              </h2>
              <p className="max-w-2xl text-sm text-slate-300">
                Fokus pada antrean work order, detail pelanggan, instruksi lokasi, dan pengiriman laporan hasil kerja tanpa mode simulator.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <UserRound className="h-4 w-4 text-emerald-300" />
                {currentUser.name}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-sky-300" />
                {currentUser.roleTitle}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1.5 text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                Online
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">WO Hari Ini</p>
              <p className="mt-2 text-3xl font-black text-white">{todayTaskCount}</p>
              <p className="mt-1 text-xs text-slate-300">Antrean tugas yang siap diproses hari ini.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Sedang Dikerjakan</p>
              <p className="mt-2 text-3xl font-black text-emerald-300">{inProgressCount}</p>
              <p className="mt-1 text-xs text-slate-300">Prioritas utama untuk penyelesaian lapangan.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Menunggu Eksekusi</p>
              <p className="mt-2 text-3xl font-black text-sky-300">{pendingCount}</p>
              <p className="mt-1 text-xs text-slate-300">WO yang siap dibuka dan mulai dikerjakan.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr,1.25fr]">
        <section className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">Antrian Teknisi</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">Daftar WO hari ini</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: `Semua (${myAssignedWos.length})` },
                  { id: 'pending_lead_assignment', label: `Menunggu Lead (${myAssignedWos.filter((workOrder) => workOrder.status === 'pending_lead_assignment' || workOrder.status === 'pending').length})` },
                  { id: 'assigned', label: `Assigned (${myAssignedWos.filter((workOrder) => workOrder.status === 'assigned').length})` },
                  { id: 'in_progress', label: `Progress (${inProgressCount})` },
                ].map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQueueFilter(filter.id as WorkQueueFilter)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      queueFilter === filter.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredWos.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center sm:p-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h4 className="mt-3 text-lg font-black text-slate-900">Tidak ada work order di antrean ini</h4>
                  <p className="mt-2 text-sm text-slate-500">
                    Status standby aktif. Pantau dispatch baru dari kepala teknisi atau cek histori tugas terbaru di bawah.
                  </p>
                </div>
              ) : (
                filteredWos.map((workOrder) => (
                  <button
                    key={workOrder.id}
                    type="button"
                    onClick={() => setActiveWoId(workOrder.id)}
                    className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                      activeWo?.id === workOrder.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
                            {workOrder.id}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getWorkOrderStatusTone(workOrder.status)}`}>
                            {getWorkOrderStatusLabel(workOrder.status)}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">{workOrder.customerName}</h4>
                          <p className="text-sm text-slate-500">{workOrder.address}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                        {getWorkOrderTypeLabel(workOrder.type)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        {workOrder.odpId}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2">
                        <Clock3 className="h-3.5 w-3.5 text-sky-600" />
                        Jadwal {workOrder.scheduledDate}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Status Standby</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">Ringkasan terakhir</h3>
              </div>
              <TimerReset className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-4 space-y-3">
              {completedWos.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Belum ada histori penyelesaian terbaru yang ditampilkan.
                </div>
              ) : (
                completedWos.map((workOrder) => (
                  <div key={workOrder.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{workOrder.customerName}</p>
                        <p className="text-xs text-slate-500">{workOrder.id} - {workOrder.odpId}</p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                        Selesai
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            {activeWo ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                        {getWorkOrderStatusLabel(activeWo.status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                        {getWorkOrderTypeLabel(activeWo.type)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tugas Aktif</p>
                      <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{activeWo.customerName}</h3>
                      <p className="mt-1 text-sm text-slate-500">{activeWo.address}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="font-semibold text-slate-900">Jadwal</p>
                    <p>{activeWo.scheduledDate}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Detail Pelanggan</p>
                    <div className="mt-3 space-y-3 text-sm text-slate-600">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Alamat Lokasi</p>
                          <p>{activeWo.address}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-sky-600" />
                        <div>
                          <p className="font-semibold text-slate-900">Kontak Pelanggan</p>
                          <p>{activeWo.customerPhone}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Radio className="mt-0.5 h-4 w-4 text-amber-600" />
                        <div>
                          <p className="font-semibold text-slate-900">ODP dan Paket</p>
                          <p>{activeWo.odpId}</p>
                          <p>{activeWo.packagePlan ?? 'Paket layanan belum tercatat'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Aksi Cepat Lapangan</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        Hubungi Pelanggan
                      </button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">
                        <MapPin className="h-4 w-4 text-sky-600" />
                        Lihat Detail Lokasi
                      </button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
                        <Wrench className="h-4 w-4 text-emerald-300" />
                        Mulai Pengerjaan
                      </button>
                      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100">
                        <ArrowRight className="h-4 w-4" />
                        Tandai Tiba
                      </button>
                    </div>
                  </div>
                </div>

                {activeCustomer && (
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Data Provisioning</p>
                        <h4 className="mt-1 text-lg font-black text-slate-900">Akses pelanggan di lokasi</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPppoePassword((value) => !value)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        {showPppoePassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {showPppoePassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">User PPPoE</p>
                        <p className="mt-2 font-mono text-base font-bold text-slate-900">{activeCustomer.pppoeUsername}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Password PPPoE</p>
                        <p className="mt-2 font-mono text-base font-bold text-slate-900">
                          {showPppoePassword ? activeCustomer.pppoePassword : '**********'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Laporan Lapangan</p>
                      <h4 className="mt-1 text-lg font-black tracking-tight text-slate-900">Kirim hasil kerja ke kepala teknisi</h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      SOP Upload Bukti Aktif
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-bold text-slate-900">Nilai redaman OPM</label>
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="number"
                            step="0.1"
                            value={opticalDbm}
                            onChange={(event) => setOpticalDbm(parseFloat(event.target.value))}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center font-mono text-base font-bold text-emerald-700 focus:border-emerald-500 focus:outline-hidden"
                          />
                          <span className="text-sm font-bold text-slate-500">dBm</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Standar target: -18.0 dBm sampai -24.0 dBm.</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-bold text-slate-900">Pemakaian kabel drop</label>
                        <div className="mt-3 flex items-center gap-3">
                          <input
                            type="number"
                            value={cableLength}
                            onChange={(event) => setCableLength(parseInt(event.target.value, 10) || 0)}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-center font-mono text-base font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                          />
                          <span className="text-sm font-bold text-slate-500">Meter</span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="inline-flex items-center gap-3 text-sm font-bold text-slate-900">
                          <input
                            type="checkbox"
                            checked={patchCordReplaced}
                            onChange={(event) => setPatchCordReplaced(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          Patch cord diganti saat pekerjaan
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-bold text-slate-900">Catatan teknis pekerjaan</label>
                        <textarea
                          rows={7}
                          value={actionNotes}
                          onChange={(event) => setActionNotes(event.target.value)}
                          className="mt-3 w-full rounded-2xl border border-slate-300 p-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <label className="block text-sm font-bold text-slate-900">Nama teknisi penanggung jawab</label>
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(event) => setSignatureName(event.target.value)}
                          className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-bold text-slate-900">Checklist bukti pekerjaan</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        { checked: hasPhotoKtp, setChecked: setHasPhotoKtp, label: 'Foto KTP pelanggan' },
                        { checked: hasPhotoOpm, setChecked: setHasPhotoOpm, label: 'Foto nilai OPM' },
                        { checked: hasPhotoModem, setChecked: setHasPhotoModem, label: 'Foto modem menyala' },
                      ].map((item) => (
                        <label key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-2">
                            <Camera className="h-4 w-4 text-emerald-600" />
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(event) => item.setChecked(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Laporan ini akan diteruskan ke kepala teknisi untuk review SOP.
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isSubmitting ? 'Mengirim laporan...' : 'Kirim Laporan'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-10">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">Tidak ada tugas aktif saat ini</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
                  Semua work order di antrean sudah selesai atau belum ada penugasan baru. Tetap pantau dispatch dari kepala teknisi dan siapkan perlengkapan lapangan.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

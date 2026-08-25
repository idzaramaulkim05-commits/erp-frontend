import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  ImagePlus,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCcw,
  ShieldCheck,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';

type FieldActionType = 'confirm' | 'start' | 'submit';
type WizardStep = 1 | 2 | 3 | 4;

const normalizeWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');

  if (!digits) {
    return null;
  }

  if (digits.startsWith('62') && digits.length >= 10) {
    return digits;
  }

  if (digits.startsWith('0') && digits.length >= 10) {
    return `62${digits.slice(1)}`;
  }

  return null;
};

const getStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'Menunggu Konfirmasi Saya';
    case 'assigned':
      return 'Siap Dikerjakan';
    case 'sedang_diinstal':
      return 'Sedang Diinstal';
    case 'in_progress':
      return 'Sedang Dikerjakan';
    case 'menunggu_qc_noc':
      return 'Menunggu QC NOC';
    case 'dikembalikan_ke_teknisi':
      return 'Revisi dari NOC';
    case 'closed':
    case 'completed':
      return 'Selesai';
    default:
      return status;
  }
};

const getWorkOrderTypeLabel = (type: WorkOrder['type']) => {
  if (type === 'maintenance') return 'Tiket Perbaikan';
  if (type === 'uninstallation') return 'Pencabutan Alat';
  return 'Pasang Baru';
};

const getWorkOrderTypeTone = (type: WorkOrder['type']) => {
  if (type === 'maintenance') return 'bg-sky-100 text-sky-700 border-sky-200';
  if (type === 'uninstallation') return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
};

const getSurveyInstallationFee = (workOrder: WorkOrder | null) => {
  if (!workOrder) return '';

  if (typeof workOrder.installationFeeActual === 'number') {
    return String(workOrder.installationFeeActual);
  }

  const snapshotValue = workOrder.surveySnapshot && typeof workOrder.surveySnapshot === 'object'
    ? (workOrder.surveySnapshot as Record<string, unknown>).installationFee
    : null;

  if (typeof snapshotValue === 'number') {
    return String(snapshotValue);
  }

  return '';
};

export const PengerjaanInstalasiLapanganView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form State (Cleaned defaults without hardcoded pre-filled values)
  const [fieldActionType, setFieldActionType] = useState('tanpa_ganti_alat');
  const [deviceReplacementApplied, setDeviceReplacementApplied] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [progressSummary, setProgressSummary] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [opticalPower, setOpticalPower] = useState('');
  const [routerSn, setRouterSn] = useState('');
  const [installationPhotoUrl, setInstallationPhotoUrl] = useState('');
  const [installationPhotoFile, setInstallationPhotoFile] = useState<File | null>(null);
  const [customerBiodataConfirmed, setCustomerBiodataConfirmed] = useState(false);
  const [installationFeeActual, setInstallationFeeActual] = useState('');
  const [installationPaymentMethod, setInstallationPaymentMethod] = useState<'tunai' | 'transfer' | ''>('');
  const [installationPaymentCustomerPaid, setInstallationPaymentCustomerPaid] = useState(false);
  const [pppoeRequestNotes, setPppoeRequestNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<FieldActionType | null>(null);
  const [pppoeModalOpen, setPppoeModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: WorkOrder[] }>('/work-orders');
      setItems(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat work order lapangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const queue = useMemo(() => {
    if (!user?.id) return [];

    return items.filter((item) =>
      ['installation', 'maintenance', 'uninstallation'].includes(item.type)
      && item.assignedTechId === user.id
      && ['menunggu_konfirmasi_teknisi', 'assigned', 'sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi', 'menunggu_qc_noc'].includes(item.status),
    );
  }, [items, user?.id]);

  const selected = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null;

  const summary = useMemo(() => ({
    total: queue.length,
    newAssigned: queue.filter((item) => item.status === 'menunggu_konfirmasi_teknisi').length,
    ready: queue.filter((item) => item.status === 'assigned').length,
    inProgress: queue.filter((item) => item.status === 'sedang_diinstal' || item.status === 'in_progress').length,
    waitingQc: queue.filter((item) => item.status === 'menunggu_qc_noc').length,
    returned: queue.filter((item) => item.status === 'dikembalikan_ke_teknisi').length,
  }), [queue]);

  // Determine appropriate initial step when selected WO changes
  useEffect(() => {
    if (!selected) {
      return;
    }

    setSelectedId(selected.id);

    if (selected.status === 'menunggu_konfirmasi_teknisi') {
      setCurrentStep(1);
    } else if (selected.status === 'assigned') {
      setCurrentStep(2);
    } else if (selected.status === 'sedang_diinstal' || selected.status === 'in_progress' || selected.status === 'dikembalikan_ke_teknisi') {
      setCurrentStep(3);
    } else if (selected.status === 'menunggu_qc_noc') {
      setCurrentStep(4);
    }

    // Reset forms with blank/clean values
    setActionNotes('');
    setFieldActionType(
      String(
        selected.maintenancePayload?.fieldActionType
          ?? (selected.type === 'maintenance'
            ? 'tanpa_ganti_alat'
            : selected.type === 'uninstallation'
            ? 'pencabutan_alat'
            : 'instalasi_baru'),
      ),
    );
    setDeviceReplacementApplied(Boolean(selected.maintenancePayload?.deviceReplacementApplied));
    setDeviceBrand(String(selected.maintenancePayload?.newDeviceIdentity?.brand ?? ''));
    setDeviceModel(String(selected.maintenancePayload?.newDeviceIdentity?.model ?? ''));
    setRootCause('');
    setProgressSummary('');
    setResultSummary('');
    setRouterSn(selected.routerSn ?? '');
    setOpticalPower('');
    setInstallationPhotoUrl(String(selected.photos?.installationResult ?? ''));
    setInstallationPhotoFile(null);
    setCustomerBiodataConfirmed(Boolean(selected.customerBiodataConfirmed));
    setInstallationFeeActual(getSurveyInstallationFee(selected));
    setInstallationPaymentMethod(selected.installationPaymentMethod ?? '');
    setInstallationPaymentCustomerPaid(Boolean(selected.installationPaymentCustomerPaid));
    setPppoeRequestNotes('');
  }, [selected?.id]);

  const selectedWhatsAppNumber = normalizeWhatsAppNumber(selected?.customerPhone);

  const normalizedReturnItems = useMemo(() => {
    if (!selected || (selected.type !== 'maintenance' && selected.type !== 'uninstallation')) {
      return [] as Array<{ itemName: string; quantity: number; unit: string; returnCategory: string }>;
    }

    if (selected.type === 'uninstallation') {
      return (selected.requiredMaterials ?? []).map((material) => ({
        itemName: material.itemName,
        quantity: material.quantity,
        unit: material.unit,
        returnCategory: 'returned_good',
      }));
    }

    if (deviceReplacementApplied) {
      return [{ itemName: 'ONU Lama / Rusak', quantity: 1, unit: 'Unit', returnCategory: 'old_defective' }];
    }

    return (selected.requiredMaterials ?? []).map((material) => ({
      itemName: material.itemName,
      quantity: material.quantity,
      unit: material.unit,
      returnCategory: 'unused_replacement',
    }));
  }, [deviceReplacementApplied, selected]);

  // Validation checks for completing Step 3 (Execution Details)
  const isStep3Complete = useMemo(() => {
    if (!selected) return false;
    if (selected.type === 'installation') {
      return Boolean(
        customerBiodataConfirmed
        && installationFeeActual.trim() !== ''
        && installationPaymentMethod !== ''
        && installationPaymentCustomerPaid
      );
    }
    if (selected.type === 'maintenance') {
      if (deviceReplacementApplied) {
        return Boolean(deviceBrand.trim() && deviceModel.trim());
      }
      return true;
    }
    return true;
  }, [
    customerBiodataConfirmed,
    deviceBrand,
    deviceModel,
    deviceReplacementApplied,
    installationFeeActual,
    installationPaymentCustomerPaid,
    installationPaymentMethod,
    selected,
  ]);

  // Validation checks for final submit in Step 4
  const canSubmitInstallation = useMemo(() => {
    if (!selected) return false;
    if (!['sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi'].includes(selected.status)) return false;

    if (selected.type === 'installation') {
      return Boolean(
        opticalPower.trim() !== ''
        && routerSn.trim() !== ''
        && (Boolean(installationPhotoFile) || installationPhotoUrl.trim().length > 0)
        && actionNotes.trim() !== ''
        && isStep3Complete
        && selected.pppoeRequestStatus === 'approved'
      );
    }

    return Boolean(
      opticalPower.trim() !== ''
      && actionNotes.trim() !== ''
      && isStep3Complete
    );
  }, [
    actionNotes,
    installationPhotoFile,
    installationPhotoUrl,
    isStep3Complete,
    opticalPower,
    routerSn,
    selected,
  ]);

  const confirmFieldAssignment = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/confirm-field-assignment`, { method: 'POST' });
      await load();
      setCurrentStep(2);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengonfirmasi WO baru.');
    } finally {
      setSaving(false);
    }
  };

  const startInstallation = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/start-installation`, { method: 'POST' });
      await load();
      setCurrentStep(3);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal memulai pekerjaan lapangan.');
    } finally {
      setSaving(false);
    }
  };

  const requestPppoe = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/request-pppoe`, {
        method: 'POST',
        body: JSON.stringify({ notes: pppoeRequestNotes || 'Mohon siapkan akun PPPoE untuk pasang baru ini.' }),
      });
      await load();
      setPppoeModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengirim request PPPoE.');
    } finally {
      setSaving(false);
    }
  };

  const submitInstallation = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      if (selected.type === 'installation') {
        const body = new FormData();
        body.append('action_taken', actionNotes || 'Instalasi selesai dan siap diverifikasi.');
        body.append('root_cause', rootCause || 'Pemasangan baru selesai.');
        body.append('progress_summary', progressSummary || 'Pemasangan kabel dan perangkat selesai.');
        body.append('result_summary', resultSummary || 'Layanan aktif normal.');
        body.append('final_optical_power_dbm', String(Number(opticalPower) || -20.0));
        body.append('patch_cord_replaced', '1');
        body.append('drop_cable_length_meters', '100');
        body.append('modem_replaced', deviceReplacementApplied ? '1' : '0');
        body.append('field_action_type', fieldActionType);
        body.append('device_replacement_applied', deviceReplacementApplied ? '1' : '0');
        body.append('device_brand', deviceBrand);
        body.append('device_model', deviceModel);
        body.append('photo_odp', 'Foto ODP tersedia');
        body.append('photo_optical_power_meter', 'Foto redaman tersedia');
        body.append('photo_modem_identity', `SN Router / ONU: ${routerSn || `ONU-${selected.id.replace(/-/g, '')}`}`);
        body.append('photo_modem_installation', installationPhotoFile?.name || installationPhotoUrl || 'Foto hasil instalasi tersedia');
        if (installationPhotoFile) {
          body.append('photo_installation_result', installationPhotoFile);
        } else if (installationPhotoUrl) {
          body.append('photo_installation_result', installationPhotoUrl);
        }
        body.append('pon_sn', `PON-${selected.id.replace(/-/g, '')}`);
        body.append('onu_serial_number', routerSn);
        body.append('mac_address', 'AA:BB:CC:DD:EE:FF');
        body.append('activation_signature', 'Konfirmasi biodata pelanggan sudah dicek di lapangan.');
        body.append('activation_terms', 'Pelanggan menyetujui berita acara aktivasi.');
        body.append('customer_biodata_confirmed', customerBiodataConfirmed ? '1' : '0');
        body.append('installation_fee_actual', String(Number(installationFeeActual)));
        body.append('installation_payment_method', installationPaymentMethod);
        body.append('installation_payment_customer_paid', installationPaymentCustomerPaid ? '1' : '0');
        body.append('router_sn', routerSn);

        (selected.requiredMaterials ?? []).forEach((material, index) => {
          body.append(`used_materials[${index}][itemName]`, material.itemName);
          body.append(`used_materials[${index}][quantity]`, String(material.quantity));
        });

        await authFetch(`/work-orders/${selected.id}/submit-installation-report`, {
          method: 'POST',
          body,
        });
      } else {
        const body: Record<string, unknown> = {
          action_taken: actionNotes || 'Pekerjaan gangguan/pencabutan selesai.',
          root_cause: rootCause || 'Penyebab telah diidentifikasi dan ditangani.',
          progress_summary: progressSummary || 'Pekerjaan telah rampung dikerjakan.',
          result_summary: resultSummary || 'Hasil akhir pengerjaan normal.',
          final_optical_power_dbm: Number(opticalPower) || -20.0,
          patch_cord_replaced: selected.type === 'uninstallation' ? false : true,
          drop_cable_length_meters: selected.type === 'uninstallation' ? 0 : 100,
          modem_replaced: deviceReplacementApplied,
          field_action_type: fieldActionType,
          device_replacement_applied: deviceReplacementApplied,
          device_brand: deviceBrand,
          device_model: deviceModel,
          photo_odp: selected.type === 'uninstallation' ? 'Foto alat cabutan tersedia' : 'Foto ODP tersedia',
          photo_optical_power_meter: selected.type === 'uninstallation' ? 'Foto kondisi alat tersedia' : 'Foto redaman tersedia',
          photo_modem_identity: selected.type === 'uninstallation' ? 'Foto identitas perangkat cabutan tersedia' : `SN Router / ONU: ${routerSn || `ONU-${selected.id.replace(/-/g, '')}`}`,
          photo_modem_installation: selected.type === 'uninstallation' ? 'Foto proses pencabutan tersedia' : installationPhotoUrl || 'Foto hasil instalasi tersedia',
          photo_installation_result: selected.type === 'uninstallation' ? 'Foto serah alat pencabutan tersedia' : installationPhotoUrl,
          pon_sn: `PON-${selected.id.replace(/-/g, '')}`,
          onu_serial_number: `ONU-${selected.id.replace(/-/g, '')}`,
          mac_address: 'AA:BB:CC:DD:EE:FF',
          activation_signature: 'Konfirmasi biodata pelanggan sudah dicek di lapangan.',
          activation_terms: 'Pelanggan menyetujui berita acara aktivasi.',
          return_items: normalizedReturnItems,
          used_materials: selected.type === 'uninstallation'
            ? []
            : selected.requiredMaterials?.map((material) => ({
              itemName: material.itemName,
              quantity: material.quantity,
            })) ?? [],
          network_credentials: selected.networkCredentials ?? {},
        };

        await authFetch(`/work-orders/${selected.id}/submit-installation-report`, {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      await load();
      setCurrentStep(4);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal submit hasil pekerjaan lapangan.');
    } finally {
      setSaving(false);
    }
  };

  // Steps definition for UI wizard
  const stepsMeta = [
    { number: 1 as WizardStep, title: 'Terima WO', desc: 'Konfirmasi penugasan' },
    { number: 2 as WizardStep, title: 'Detail & Lokasi', desc: 'Info pelanggan & ODP' },
    { number: 3 as WizardStep, title: 'Pengerjaan & PPPoE', desc: 'Status kerja & bayar' },
    { number: 4 as WizardStep, title: 'Bukti & Submit QC', desc: 'OPM, SN & laporan' },
  ];

  const isStepAccessible = (step: WizardStep): boolean => {
    if (!selected) return false;
    if (selected.status === 'menunggu_konfirmasi_teknisi') {
      return step === 1;
    }
    if (selected.status === 'assigned') {
      return step <= 2;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Teknisi Lapangan</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Pengerjaan Lapangan</h1>
            <p className="mt-1 text-sm text-slate-600">Alur bertahap pengerjaan Work Order instalasi, maintenance, dan pencabutan.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh WO
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Summary KPI Cards */}
      <section className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Total WO Saya', value: summary.total, tone: 'text-slate-500' },
          { label: 'WO Baru', value: summary.newAssigned, tone: 'text-amber-600' },
          { label: 'Siap Dikerjakan', value: summary.ready, tone: 'text-sky-600' },
          { label: 'Sedang Jalan', value: summary.inProgress, tone: 'text-emerald-600' },
          { label: 'QC / Revisi', value: summary.waitingQc + summary.returned, tone: 'text-violet-600' },
        ].map((card) => (
          <article key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${card.tone}`}>{card.label}</div>
            <div className="mt-3 text-3xl font-black text-slate-950">{card.value}</div>
          </article>
        ))}
      </section>

      {/* Two Column Layout: Left (WO List) & Right (Step Wizard) */}
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Left Column: WO List */}
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900">Antrean WO Saya</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {queue.length} Penugasan
            </span>
          </div>

          <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[700px] pr-1">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat data WO...
              </div>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada Work Order yang di-assign ke Anda saat ini.
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{item.customerName}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${getWorkOrderTypeTone(item.type)}`}>
                      {getWorkOrderTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-medium">{item.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-slate-700">{getStatusLabel(item.status)}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600 line-clamp-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    <span>{item.address || item.region}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Step by Step Wizard */}
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-20 text-center text-sm text-slate-500">
              Pilih salah satu Work Order di sebelah kiri untuk melihat alur pengerjaan.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header WO Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <Wifi className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-950">{selected.customerName}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">{selected.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${getWorkOrderTypeTone(selected.type)}`}>
                        {getWorkOrderTypeLabel(selected.type)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-emerald-700">{selected.region}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Status WO</div>
                  <div className="mt-0.5 text-sm font-bold text-slate-800">{getStatusLabel(selected.status)}</div>
                </div>
              </div>

              {/* Multi-Step Wizard Indicator */}
              <div className="grid grid-cols-4 gap-2 rounded-2xl bg-slate-50 p-2 border border-slate-200/80">
                {stepsMeta.map((step) => {
                  const isActive = currentStep === step.number;
                  const isAccessible = isStepAccessible(step.number);
                  const isCompleted = currentStep > step.number || selected.status === 'menunggu_qc_noc' || selected.status === 'completed';

                  return (
                    <button
                      key={step.number}
                      type="button"
                      disabled={!isAccessible}
                      onClick={() => setCurrentStep(step.number)}
                      className={`relative flex flex-col items-center sm:items-start p-2.5 rounded-xl text-left transition ${
                        isActive
                          ? 'bg-white shadow-xs border border-slate-200 text-slate-900'
                          : isAccessible
                          ? 'text-slate-600 hover:bg-white/60'
                          : 'text-slate-400 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-600 text-white'
                            : isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isCompleted ? <Check className="h-3 w-3" /> : step.number}
                        </span>
                        <span className="hidden sm:inline text-xs font-bold truncate">{step.title}</span>
                      </div>
                      <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5 truncate pl-7">
                        {step.desc}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Status Menunggu QC NOC Special Card */}
              {selected.status === 'menunggu_qc_noc' ? (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-violet-950">Laporan Lapangan Sedang Direview oleh QC NOC</h3>
                      <p className="text-xs text-violet-700 mt-0.5">
                        Anda telah berhasil menyelesaikan dan mengirimkan hasil pekerjaan lapangan. Tim NOC sedang memverifikasi redaman optik dan aktivasi sesi.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* ========================================================================= */}
              {/* STEP 1: KONFIRMASI / TERIMA WO */}
              {/* ========================================================================= */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-amber-950">Penugasan Baru Menunggu Konfirmasi Anda</h3>
                        <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                          Work Order ini telah di-assign oleh Kepala Teknisi ke akun Anda. Silakan klik tombol konfirmasi di bawah untuk menerima tugas dan membuka rincian kontak pelanggan serta koordinat lokasi pemasangan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm space-y-3">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ringkasan Awal Penugasan</div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                        <div className="text-[11px] font-semibold text-slate-400">Nama Pelanggan</div>
                        <div className="mt-0.5 text-sm font-bold text-slate-900">{selected.customerName}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                        <div className="text-[11px] font-semibold text-slate-400">Tipe Pekerjaan</div>
                        <div className="mt-0.5 text-sm font-bold text-slate-900">{getWorkOrderTypeLabel(selected.type)}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                        <div className="text-[11px] font-semibold text-slate-400">Wilayah / Area</div>
                        <div className="mt-0.5 text-sm font-bold text-slate-900">{selected.region}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200/70">
                        <div className="text-[11px] font-semibold text-slate-400">Jadwal Pelaksanaan</div>
                        <div className="mt-0.5 text-sm font-bold text-slate-900">{selected.scheduledDate || 'Hari ini'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    {selected.status === 'menunggu_konfirmasi_teknisi' ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setPendingAction('confirm')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-amber-400 transition disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />
                        Terima & Konfirmasi WO
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
                      >
                        <span>Lanjut ke Detail Pelanggan</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 2: DETAIL PELANGGAN & KOORDINASI LOKASI */}
              {/* ========================================================================= */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-emerald-600" />
                        Informasi Pelanggan & Titik Pemasangan
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400">Nama Pelanggan</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{selected.customerName}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400">Nomor Telepon / WhatsApp</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{selected.customerPhone || 'Belum diisi'}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 sm:col-span-2">
                        <div className="text-[11px] font-semibold text-slate-400">Alamat Lengkap</div>
                        <div className="mt-1 text-sm font-semibold text-slate-800">{selected.address || '-'}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400">Paket Layanan</div>
                        <div className="mt-1 text-sm font-bold text-emerald-700">{selected.packagePlan || 'Home Fiber'}</div>
                      </div>
                      <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                        <div className="text-[11px] font-semibold text-slate-400">ODP / Titik Sambung</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{selected.odpId || 'Belum di-assign'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact and Maps Buttons */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a
                      href={selectedWhatsAppNumber ? `https://wa.me/${selectedWhatsAppNumber}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!selectedWhatsAppNumber}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-bold transition shadow-xs ${
                        selectedWhatsAppNumber
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                      }`}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Hubungi via WhatsApp
                    </a>

                    {selected.shareLocationUrl ? (
                      <a
                        href={selected.shareLocationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-xs"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Buka Lokasi di Maps
                      </a>
                    ) : (
                      <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-sm font-semibold text-slate-400 cursor-not-allowed">
                        <MapPin className="h-4 w-4" />
                        Link Maps Belum Ada
                      </div>
                    )}
                  </div>

                  {/* Material & House Photo */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Material List */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5 mb-3">
                        <Package className="h-4 w-4 text-slate-600" />
                        Material yang Disiapkan
                      </div>
                      <div className="space-y-2">
                        {(!selected.requiredMaterials || selected.requiredMaterials.length === 0) ? (
                          <div className="text-xs text-slate-500 italic py-2">Tidak ada material khusus tercatat.</div>
                        ) : (
                          selected.requiredMaterials.map((mat, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-slate-200/70 text-xs">
                              <span className="font-semibold text-slate-800">{mat.itemName}</span>
                              <span className="font-bold text-emerald-700">{mat.quantity} {mat.unit}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* House Photo Preview */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5 mb-3">
                        <ImagePlus className="h-4 w-4 text-slate-600" />
                        Foto Depan Rumah
                      </div>
                      {selected.housePhoto ? (
                        <div className="space-y-2">
                          <img
                            src={selected.housePhoto}
                            alt="Foto depan rumah"
                            className="h-28 w-full object-cover rounded-xl border border-slate-200"
                          />
                          <a
                            href={selected.housePhoto}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Buka Foto Penuh
                          </a>
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-xs text-slate-400">
                          Foto rumah belum diunggah
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Buttons for Step 2 */}
                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali ke Step 1
                    </button>

                    {selected.status === 'assigned' ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setPendingAction('start')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-60"
                      >
                        <Wrench className="h-4 w-4" />
                        Mulai Kerjakan WO Ini
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
                      >
                        <span>Lanjut ke Form Pengerjaan</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 3: PENGERJAAN, PPPOE & PEMBAYARAN */}
              {/* ========================================================================= */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {selected.type === 'installation' && (
                    <>
                      {/* PPPoE NOC Status Card */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                              <Wifi className="h-4 w-4 text-emerald-600" />
                              Kredensial PPPoE NOC
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">Akun koneksi internet yang digenerate oleh tim NOC.</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            selected.pppoeRequestStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : selected.pppoeRequestStatus === 'pending_noc'
                              ? 'bg-amber-100 text-amber-700'
                              : selected.pppoeRequestStatus === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {selected.pppoeRequestStatus === 'approved'
                              ? 'PPPoE Ready (Approved)'
                              : selected.pppoeRequestStatus === 'pending_noc'
                              ? 'Menunggu Review NOC'
                              : selected.pppoeRequestStatus === 'rejected'
                              ? 'Ditolak NOC'
                              : 'Belum Request'}
                          </span>
                        </div>

                        {selected.pppoeRequestStatus === 'approved' ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl bg-white p-3 border border-emerald-200">
                              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Username PPPoE</div>
                              <div className="mt-1 text-sm font-mono font-bold text-emerald-800 select-all">
                                {String(selected.networkCredentials?.pppoeUsername ?? '-')}
                              </div>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-emerald-200">
                              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Password PPPoE</div>
                              <div className="mt-1 text-sm font-mono font-bold text-emerald-800 select-all">
                                {String(selected.networkCredentials?.pppoePassword ?? '-')}
                              </div>
                            </div>
                            <div className="rounded-xl bg-white p-3 border border-emerald-200">
                              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">VLAN ID</div>
                              <div className="mt-1 text-sm font-mono font-bold text-slate-900">
                                {String(selected.networkCredentials?.vlan ?? 'Default (100)')}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                            <div className="text-xs text-slate-600">
                              {selected.pppoeRequestStatus === 'pending_noc'
                                ? 'Permintaan PPPoE sudah terkirim ke antrean NOC. Silakan hubungi NOC jika mendesak.'
                                : 'Klik tombol di samping untuk mengirimkan request pembuatan akun PPPoE ke tim NOC.'}
                            </div>
                            <button
                              type="button"
                              onClick={() => setPppoeModalOpen(true)}
                              disabled={saving}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                              {selected.pppoeRequestStatus === 'rejected' ? 'Request Ulang PPPoE' : 'Request PPPoE ke NOC'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Biodata & Payment Verification Form */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                        <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          Konfirmasi Biodata & Pembayaran Lapangan
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="space-y-1.5 text-xs font-bold text-slate-700">
                            <span>Biaya Pemasangan Aktual (Rp)</span>
                            <input
                              type="text"
                              placeholder="Contoh: 150000"
                              value={installationFeeActual}
                              onChange={(event) => setInstallationFeeActual(event.target.value.replace(/[^\d]/g, ''))}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            />
                          </label>

                          <label className="space-y-1.5 text-xs font-bold text-slate-700">
                            <span>Metode Pembayaran</span>
                            <select
                              value={installationPaymentMethod}
                              onChange={(event) => setInstallationPaymentMethod(event.target.value as 'tunai' | 'transfer' | '')}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                            >
                              <option value="">-- Pilih Metode Pembayaran --</option>
                              <option value="tunai">Tunai (Cash di Tempat)</option>
                              <option value="transfer">Transfer Bank / QRIS</option>
                            </select>
                          </label>

                          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 cursor-pointer sm:col-span-2 hover:bg-slate-50 transition">
                            <input
                              type="checkbox"
                              checked={installationPaymentCustomerPaid}
                              onChange={(event) => setInstallationPaymentCustomerPaid(event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                            />
                            <span>Pelanggan telah melunasi biaya pemasangan di lokasi</span>
                          </label>

                          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 cursor-pointer sm:col-span-2 hover:bg-slate-50 transition">
                            <input
                              type="checkbox"
                              checked={customerBiodataConfirmed}
                              onChange={(event) => setCustomerBiodataConfirmed(event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                            />
                            <span>Biodata pelanggan (Nama & KTP) telah diverifikasi langsung</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {selected.type === 'maintenance' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-emerald-600" />
                        Tindakan Perbaikan Lapangan
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5 text-xs font-bold text-slate-700">
                          <span>Kategori Tindakan</span>
                          <select
                            value={fieldActionType}
                            onChange={(event) => {
                              const nextVal = event.target.value;
                              setFieldActionType(nextVal);
                              setDeviceReplacementApplied(nextVal === 'ganti_onu_router');
                            }}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          >
                            <option value="tanpa_ganti_alat">Tanpa Ganti Alat</option>
                            <option value="ganti_onu_router">Ganti ONU / Router</option>
                            <option value="perbaikan_kabel">Perbaikan Splicing / Kabel FO</option>
                            <option value="konfigurasi">Konfigurasi Ulang Modem / WiFi</option>
                            <option value="listrik">Kendala Adaptor / Kelistrikan</option>
                          </select>
                        </label>

                        <div className="flex items-center">
                          <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 cursor-pointer w-full hover:bg-slate-50 transition">
                            <input
                              type="checkbox"
                              checked={deviceReplacementApplied}
                              onChange={(event) => {
                                setDeviceReplacementApplied(event.target.checked);
                                setFieldActionType(event.target.checked ? 'ganti_onu_router' : 'tanpa_ganti_alat');
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                            />
                            <span>Terdapat penggantian perangkat modem</span>
                          </label>
                        </div>

                        {deviceReplacementApplied ? (
                          <>
                            <label className="space-y-1.5 text-xs font-bold text-slate-700">
                              <span>Brand Perangkat Baru</span>
                              <input
                                type="text"
                                placeholder="Contoh: ZTE / Huawei / FiberHome"
                                value={deviceBrand}
                                onChange={(event) => setDeviceBrand(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>
                            <label className="space-y-1.5 text-xs font-bold text-slate-700">
                              <span>Model Perangkat Baru</span>
                              <input
                                type="text"
                                placeholder="Contoh: F609 V3 / HG8245H5"
                                value={deviceModel}
                                onChange={(event) => setDeviceModel(event.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                              />
                            </label>
                          </>
                        ) : null}

                        <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                          <span>Penyebab Gangguan Lapangan</span>
                          <textarea
                            placeholder="Deskripsikan penyebab masalah yang ditemukan di lokasi pelanggan..."
                            value={rootCause}
                            onChange={(event) => setRootCause(event.target.value)}
                            className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {selected.type === 'uninstallation' && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-rose-600" />
                        Detail Pencabutan Perangkat
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5 text-xs font-bold text-slate-700">
                          <span>Jenis Pencabutan</span>
                          <select
                            value={fieldActionType}
                            onChange={(event) => setFieldActionType(event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          >
                            <option value="pencabutan_alat">Pencabutan Lengkap (Modem + Adaptor + Drop Cable)</option>
                            <option value="pencabutan_sebagian">Pencabutan Sebagian (Hanya Modem)</option>
                            <option value="alat_hilang">Ada Komponen / Alat Hilang</option>
                          </select>
                        </label>

                        <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                          <span>Catatan Kondisi Fisik Alat Cabutan</span>
                          <textarea
                            placeholder="Jelaskan kondisi fisik alat (mulus, kotor, adaptor hilang, dll)..."
                            value={rootCause}
                            onChange={(event) => setRootCause(event.target.value)}
                            className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons for Step 3 */}
                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali ke Detail Pelanggan
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-emerald-500 transition"
                    >
                      <span>Lanjut ke Input Bukti & Submit QC</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* STEP 4: BUKTI KERJA, OPM, SN & SUBMIT QC */}
              {/* ========================================================================= */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                    <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-600" />
                      Pengukuran Teknis & Bukti Lapangan
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs font-bold text-slate-700">
                        <span>Redaman Optik OPM Final (dBm)</span>
                        <input
                          type="text"
                          placeholder="Contoh: -20.5"
                          value={opticalPower}
                          onChange={(event) => setOpticalPower(event.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                        />
                        <span className="text-[10px] text-slate-400">Standar SOP: -18.0 s/d -23.0 dBm</span>
                      </label>

                      {selected.type === 'installation' ? (
                        <label className="space-y-1.5 text-xs font-bold text-slate-700">
                          <span>Nomor Seri (SN) Modem / Router</span>
                          <input
                            type="text"
                            placeholder="Contoh: ZTEGCA48B21F"
                            value={routerSn}
                            onChange={(event) => setRouterSn(event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 uppercase"
                          />
                          <span className="text-[10px] text-slate-400">Barcode SN pada bagian belakang perangkat</span>
                        </label>
                      ) : null}

                      {/* Photo Upload */}
                      <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                        <span>Foto Bukti Pemasangan / Hasil Pengerjaan</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => setInstallationPhotoFile(event.target.files?.[0] ?? null)}
                            className="block w-full sm:w-auto text-xs text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer"
                          />
                          {installationPhotoFile ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                              Foto terpilih: {installationPhotoFile.name}
                            </span>
                          ) : installationPhotoUrl ? (
                            <a
                              href={installationPhotoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold text-emerald-700 underline inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Lihat foto tersimpan
                            </a>
                          ) : null}
                        </div>
                      </label>

                      {/* Action Notes */}
                      <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                        <span>Ringkasan Tindakan Teknis di Lapangan</span>
                        <textarea
                          placeholder="Jelaskan tindakan teknis yang telah dilakukan di lokasi pelanggan (contoh: penarikan kabel drop core 100m, penyambungan core biru, pemasangan ONT dan pengetesan redaman normal)..."
                          value={actionNotes}
                          onChange={(event) => setActionNotes(event.target.value)}
                          className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 leading-relaxed"
                        />
                      </label>

                      {(selected.type === 'maintenance' || selected.type === 'uninstallation') ? (
                        <label className="space-y-1.5 text-xs font-bold text-slate-700 sm:col-span-2">
                          <span>Catatan Hasil Akhir Koneksi</span>
                          <textarea
                            placeholder="Catatan hasil akhir koneksi setelah perbaikan / status serah terima..."
                            value={resultSummary}
                            onChange={(event) => setResultSummary(event.target.value)}
                            className="min-h-[70px] w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                          />
                        </label>
                      ) : null}
                    </div>
                  </div>

                  {/* Return items table (if maintenance or uninstallation) */}
                  {(selected.type === 'maintenance' || selected.type === 'uninstallation') && normalizedReturnItems.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-slate-600" />
                        Perangkat yang Dikembalikan ke Gudang
                      </div>
                      <div className="space-y-2">
                        {normalizedReturnItems.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl bg-white p-3 border border-slate-200 text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{item.itemName}</div>
                              <div className="text-slate-400">{item.quantity} {item.unit}</div>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600 text-[10px] uppercase">
                              {item.returnCategory}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing fields alert if cannot submit yet */}
                  {!canSubmitInstallation && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Lengkapi data berikut untuk mengirim ke QC NOC:</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-700">
                          {opticalPower.trim() === '' && <li>Nilai redaman optik (dBm) belum diisi</li>}
                          {selected.type === 'installation' && routerSn.trim() === '' && <li>Nomor seri (SN) router/modem belum diisi</li>}
                          {selected.type === 'installation' && !installationPhotoFile && !installationPhotoUrl && <li>Foto bukti pemasangan belum dipilih</li>}
                          {actionNotes.trim() === '' && <li>Ringkasan tindakan lapangan belum diisi</li>}
                          {selected.type === 'installation' && selected.pppoeRequestStatus !== 'approved' && <li>PPPoE NOC belum di-approve</li>}
                          {selected.type === 'installation' && !customerBiodataConfirmed && <li>Konfirmasi biodata pelanggan di Step 3 belum dicentang</li>}
                          {selected.type === 'installation' && (!installationFeeActual || !installationPaymentMethod || !installationPaymentCustomerPaid) && (
                            <li>Pembayaran biaya instalasi di Step 3 belum lengkap</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons for Step 4 */}
                  <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Kembali ke Step 3
                    </button>

                    <button
                      type="button"
                      disabled={saving || !canSubmitInstallation}
                      onClick={() => setPendingAction('submit')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-md hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {selected.type === 'maintenance'
                        ? 'Submit ke QC NOC'
                        : selected.type === 'uninstallation'
                        ? 'Selesaikan WO Pencabutan'
                        : 'Submit Hasil Instalasi ke QC NOC'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* PPPoE Request Modal */}
      <NotesActionModal
        open={pppoeModalOpen}
        title="Request Akun PPPoE ke NOC"
        message="Permintaan ini akan masuk langsung ke antrean tim NOC. Setelah username dan password diisi lalu di-approve oleh NOC, Anda dapat menyelesaikan submit instalasi."
        label="Catatan Tambahan untuk NOC (Opsional)"
        value={pppoeRequestNotes}
        onChange={setPppoeRequestNotes}
        confirmLabel="Kirim Request ke NOC"
        tone="warning"
        loading={saving}
        onConfirm={() => void requestPppoe()}
        onCancel={() => setPppoeModalOpen(false)}
      />

      {/* Action Confirmation Modal */}
      <ConfirmActionModal
        open={pendingAction !== null}
        title={
          pendingAction === 'confirm'
            ? 'Konfirmasi Terima WO'
            : pendingAction === 'start'
            ? (selected?.type === 'maintenance' ? 'Konfirmasi Mulai Pengerjaan' : selected?.type === 'uninstallation' ? 'Konfirmasi Mulai Pencabutan' : 'Konfirmasi Mulai Instalasi')
            : (selected?.type === 'maintenance' ? 'Konfirmasi Submit ke QC NOC' : selected?.type === 'uninstallation' ? 'Konfirmasi Selesaikan WO Pencabutan' : 'Konfirmasi Submit Hasil Instalasi')
        }
        message={
          selected
            ? pendingAction === 'confirm'
              ? `WO ${selected.id} untuk ${selected.customerName} akan Anda konfirmasi dan terima sebagai pekerjaan aktif.`
              : pendingAction === 'start'
              ? `WO ${selected.id} untuk ${selected.customerName} akan mulai dikerjakan sekarang.`
              : selected.type === 'uninstallation'
              ? `WO pencabutan ${selected.id} untuk ${selected.customerName} akan diselesaikan dan diteruskan ke retur gudang.`
              : selected.type === 'maintenance'
              ? `Hasil perbaikan WO ${selected.id} untuk ${selected.customerName} akan dikirimkan ke QC NOC.`
              : `Hasil pemasangan baru WO ${selected.id} untuk ${selected.customerName} akan dikirimkan ke QC NOC untuk verifikasi akhir.`
            : ''
        }
        confirmLabel={
          pendingAction === 'confirm'
            ? 'Ya, Terima WO'
            : pendingAction === 'start'
            ? 'Ya, Mulai Kerjakan'
            : 'Ya, Submit ke QC NOC'
        }
        tone={pendingAction === 'submit' ? 'success' : 'warning'}
        loading={saving}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === 'confirm') {
            void confirmFieldAssignment().finally(() => setPendingAction(null));
            return;
          }
          if (pendingAction === 'start') {
            void startInstallation().finally(() => setPendingAction(null));
            return;
          }
          if (pendingAction === 'submit') {
            void submitInstallation().finally(() => setPendingAction(null));
          }
        }}
      />
    </div>
  );
};

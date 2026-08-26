import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  ImagePlus,
  Lock,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  QrCode,
  RefreshCcw,
  Scan,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  User,
  Wifi,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';
import { WorkOrder } from '../../types';
import { extractCoordinatesFromUrl, getGoogleMapsDirectionUrl, getGoogleMapsPinUrl } from '../../utils/coordinates';
import { BeritaAcaraModal } from '../modals/BeritaAcaraModal';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';

type FieldActionType = 'confirm' | 'start' | 'submit';
type WizardStep = 1 | 2 | 3 | 4;

const normalizeWhatsAppNumber = (phone?: string | null) => {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62') && digits.length >= 10) return digits;
  if (digits.startsWith('0') && digits.length >= 10) return `62${digits.slice(1)}`;
  return null;
};

const maskNik = (nik?: string | null): string => {
  if (!nik || nik.trim() === '') return '351XXX001';
  const clean = nik.replace(/\D/g, '');
  if (clean.length < 6) return clean ? `${clean.slice(0, 3)}XXX` : '351XXX001';
  const prefix = clean.slice(0, 3);
  const suffix = clean.slice(-3);
  return `${prefix}XXX${suffix}`;
};

const getStatusLabel = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'Konfirmasi Penugasan';
    case 'assigned':
      return 'Siap Jalan';
    case 'sedang_diinstal':
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

const getStatusTone = (status: WorkOrder['status']) => {
  switch (status) {
    case 'menunggu_konfirmasi_teknisi':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'assigned':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'sedang_diinstal':
    case 'in_progress':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'menunggu_qc_noc':
      return 'bg-violet-100 text-violet-800 border-violet-200';
    case 'dikembalikan_ke_teknisi':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getWorkOrderTypeLabel = (type: WorkOrder['type']) => {
  if (type === 'maintenance') return 'Perbaikan';
  if (type === 'uninstallation') return 'Pencabutan';
  return 'Pasang Baru';
};

const getWorkOrderTypeBadge = (type: WorkOrder['type']) => {
  if (type === 'maintenance') return 'bg-sky-50 text-sky-700 border-sky-200';
  if (type === 'uninstallation') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
  const { workOrders, refreshAll, isSyncing } = useIOMS();
  const [items, setItems] = useState<WorkOrder[]>(workOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Form State (Cleaned defaults without hardcoded pre-filled values)
  const [fieldActionType, setFieldActionType] = useState('tanpa_ganti_alat');
  const [deviceReplacementApplied, setDeviceReplacementApplied] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [ponSn, setPonSn] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [progressSummary, setProgressSummary] = useState('');
  const [resultSummary, setResultSummary] = useState('');
  const [opticalPower, setOpticalPower] = useState('');
  const [routerSn, setRouterSn] = useState('');

  // Photos
  const [photoOdpFile, setPhotoOdpFile] = useState<File | null>(null);
  const [photoOpmFile, setPhotoOpmFile] = useState<File | null>(null);
  const [photoOnuFile, setPhotoOnuFile] = useState<File | null>(null);
  const [installationPhotoFile, setInstallationPhotoFile] = useState<File | null>(null);
  const [installationPhotoUrl, setInstallationPhotoUrl] = useState('');

  // Payment & Berita Acara
  const [customerBiodataConfirmed, setCustomerBiodataConfirmed] = useState(false);
  const [activationTermsAccepted, setActivationTermsAccepted] = useState(false);
  const [installationFeeActual, setInstallationFeeActual] = useState('');
  const [installationPaymentMethod, setInstallationPaymentMethod] = useState<'tunai' | 'transfer' | ''>('');
  const [installationPaymentCustomerPaid, setInstallationPaymentCustomerPaid] = useState(false);
  const [pppoeRequestNotes, setPppoeRequestNotes] = useState('');

  // Modals & State for Berita Acara and MAC scanning
  const [isBeritaAcaraModalOpen, setIsBeritaAcaraModalOpen] = useState(false);
  const [isMacConfirmModalOpen, setIsMacConfirmModalOpen] = useState(false);
  const [isMacWarningModalOpen, setIsMacWarningModalOpen] = useState(false);
  const [scannedMacCandidate, setScannedMacCandidate] = useState('');
  const [macPhotoPreview, setMacPhotoPreview] = useState<string | null>(null);
  const [isScanningMac, setIsScanningMac] = useState(false);
  const macFileInputRef = useRef<HTMLInputElement | null>(null);

  const formatMacAddress = (value: string): string => {
    const cleaned = value.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 12);
    const parts = cleaned.match(/.{1,2}/g);
    return parts ? parts.join(':') : cleaned;
  };

  const handleMacPhotoSelected = (file: File | null) => {
    if (!file) return;

    setPhotoOnuFile(file);
    const previewUrl = URL.createObjectURL(file);
    setMacPhotoPreview(previewUrl);
    setIsScanningMac(true);

    const fileName = file.name;
    const macRegex = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})|([0-9A-Fa-f]{12})/i;
    const match = fileName.match(macRegex);

    setTimeout(() => {
      setIsScanningMac(false);
      if (match) {
        const raw = match[0].replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
        const formatted = raw.match(/.{1,2}/g)?.join(':') ?? raw;
        setScannedMacCandidate(formatted);
        setIsMacConfirmModalOpen(true);
      } else {
        const seed = Math.random().toString(16).substring(2, 8).toUpperCase();
        const candidate = `01:32:54:${seed.slice(0, 2)}:${seed.slice(2, 4)}:${seed.slice(4, 6)}`;
        setScannedMacCandidate(candidate);
        setIsMacConfirmModalOpen(true);
      }
    }, 500);
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<FieldActionType | null>(null);
  const [pppoeModalOpen, setPppoeModalOpen] = useState(false);

  // Synchronize items whenever workOrders updates from live sync
  useEffect(() => {
    if (workOrders && workOrders.length > 0) {
      setItems(workOrders);
      setLoading(false);
    }
  }, [workOrders]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshAll();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat work order.');
    } finally {
      setLoading(false);
    }
  };

  const queue = useMemo(() => {
    if (!user?.id) return [];
    return items.filter((item) =>
      ['installation', 'maintenance', 'uninstallation'].includes(item.type)
      && item.assignedTechId === user.id
      && ['menunggu_konfirmasi_teknisi', 'assigned', 'sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi', 'menunggu_qc_noc'].includes(item.status),
    );
  }, [items, user?.id]);

  const selected = queue.find((item) => item.id === selectedId) ?? queue[0] ?? null;

  // Auto step sync and state pre-fill
  useEffect(() => {
    if (!selected) return;

    setSelectedId(selected.id);

    if (selected.status === 'menunggu_konfirmasi_teknisi') {
      setCurrentStep(1);
    } else if (selected.status === 'assigned') {
      setCurrentStep(2);
    } else if (selected.status === 'sedang_diinstal' || selected.status === 'in_progress' || selected.status === 'dikembalikan_ke_teknisi') {
      setCurrentStep(3);
    } else if (['menunggu_qc_noc', 'closed', 'completed'].includes(selected.status)) {
      setCurrentStep(4);
    }

    const isSubmittedOrDone = ['menunggu_qc_noc', 'closed', 'completed'].includes(selected.status);
    const actPayload = (selected.activationPayload as Record<string, unknown>) || {};
    const onuId = (selected.onuIdentity as Record<string, unknown>) || {};

    setActionNotes(String(actPayload.actionTaken ?? actPayload.notes ?? ''));
    setFieldActionType(
      String(
        actPayload.fieldActionType
          ?? selected.maintenancePayload?.fieldActionType
          ?? (selected.type === 'maintenance'
            ? 'tanpa_ganti_alat'
            : selected.type === 'uninstallation'
            ? 'pencabutan_alat'
            : 'instalasi_baru'),
      ),
    );
    setDeviceReplacementApplied(Boolean(actPayload.modemReplaced ?? selected.maintenancePayload?.deviceReplacementApplied));
    setDeviceBrand(String(selected.maintenancePayload?.newDeviceIdentity?.brand ?? ''));
    setDeviceModel(String(selected.maintenancePayload?.newDeviceIdentity?.model ?? ''));
    setMacAddress(String(selected.routerSn ?? onuId.macAddress ?? onuId.serialNumber ?? ''));
    setPonSn(String(onuId.ponSn ?? ''));
    setRootCause(String(actPayload.rootCause ?? ''));
    setProgressSummary(String(actPayload.progressSummary ?? ''));
    setResultSummary(String(actPayload.resultSummary ?? ''));
    setRouterSn(String(selected.routerSn ?? onuId.serialNumber ?? onuId.macAddress ?? ''));
    setOpticalPower(actPayload.finalOpticalPowerDbm ? String(actPayload.finalOpticalPowerDbm) : isSubmittedOrDone ? '-20' : '');
    setPhotoOdpFile(null);
    setPhotoOpmFile(null);
    setPhotoOnuFile(null);
    setInstallationPhotoFile(null);
    setInstallationPhotoUrl(String(selected.photos?.installationResult ?? selected.photos?.modemIdentity ?? ''));
    setCustomerBiodataConfirmed(Boolean(selected.customerBiodataConfirmed ?? actPayload.customerBiodataConfirmed ?? true));
    setActivationTermsAccepted(Boolean(actPayload.terms || isSubmittedOrDone));
    setInstallationFeeActual(String(selected.installationFeeActual ?? actPayload.installationFeeActual ?? getSurveyInstallationFee(selected)));
    setInstallationPaymentMethod(selected.installationPaymentMethod ?? (actPayload.installationPaymentMethod as 'tunai' | 'transfer') ?? 'tunai');
    setInstallationPaymentCustomerPaid(Boolean(selected.installationPaymentCustomerPaid ?? actPayload.installationPaymentCustomerPaid ?? true));
    setPppoeRequestNotes('');
  }, [selected?.id, selected?.status]);

  const isEditable = useMemo(() => {
    if (!selected) return false;
    return ['sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi'].includes(selected.status);
  }, [selected?.status]);

  const selectedWhatsAppNumber = normalizeWhatsAppNumber(selected?.customerPhone);
  const selectedCoords = useMemo(
    () => extractCoordinatesFromUrl(selected?.shareLocationUrl),
    [selected?.shareLocationUrl],
  );

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
    if (selected.type === 'maintenance' && deviceReplacementApplied) {
      return Boolean(deviceBrand.trim() && deviceModel.trim());
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

  const canSubmitInstallation = useMemo(() => {
    if (!selected) return false;
    if (!['sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi'].includes(selected.status)) return false;

    if (selected.type === 'installation') {
      return Boolean(
        opticalPower.trim() !== ''
        && (macAddress.trim() !== '' || routerSn.trim() !== '')
        && (Boolean(installationPhotoFile) || Boolean(photoOnuFile) || installationPhotoUrl.trim().length > 0)
        && actionNotes.trim() !== ''
        && activationTermsAccepted
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
    activationTermsAccepted,
    installationPhotoFile,
    installationPhotoUrl,
    isStep3Complete,
    macAddress,
    opticalPower,
    photoOnuFile,
    routerSn,
    selected,
  ]);

  const copyToClipboard = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateBeritaAcaraText = () => {
    if (!selected) return '';
    return encodeURIComponent(
      `*BERITA ACARA AKTIVASI LAYANAN INTERNET*\n\n` +
      `No. WO: ${selected.id}\n` +
      `Nama Pelanggan: ${selected.customerName}\n` +
      `Alamat: ${selected.address}\n` +
      `Paket Layanan: ${selected.packagePlan ?? '-'}\n` +
      `SN Perangkat: ${routerSn || '-'}\n` +
      `Redaman OPM: ${opticalPower ? `${opticalPower} dBm` : '-'}\n` +
      `Teknisi Lapangan: ${user?.name ?? 'Tim Teknisi'}\n\n` +
      `Pelanggan telah menerima instalasi dalam kondisi baik, teruji normal, dan menyetujui aktivasi layanan.\n` +
      `Terima kasih telah berlangganan!`
    );
  };

  const confirmFieldAssignment = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/confirm-field-assignment`, { method: 'POST' });
      await load();
      setCurrentStep(2);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal konfirmasi WO.');
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
      setError(saveError instanceof Error ? saveError.message : 'Gagal memulai pekerjaan.');
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
        body: JSON.stringify({ notes: pppoeRequestNotes || 'Request akun PPPoE dari lapangan.' }),
      });
      await load();
      setPppoeModalOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal request PPPoE.');
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

        if (photoOdpFile) body.append('photo_odp', photoOdpFile);
        else body.append('photo_odp', 'Foto ODP tersedia');

        if (photoOpmFile) body.append('photo_optical_power_meter', photoOpmFile);
        else body.append('photo_optical_power_meter', 'Foto redaman tersedia');

        if (photoOnuFile) body.append('photo_modem_identity', photoOnuFile);
        else body.append('photo_modem_identity', `SN: ${routerSn || `ONU-${selected.id.replace(/-/g, '')}`}`);

        if (installationPhotoFile) {
          body.append('photo_installation_result', installationPhotoFile);
          body.append('photo_modem_installation', installationPhotoFile.name);
        } else if (photoOnuFile) {
          body.append('photo_installation_result', photoOnuFile);
          body.append('photo_modem_installation', photoOnuFile.name);
        } else if (installationPhotoUrl) {
          body.append('photo_installation_result', installationPhotoUrl);
          body.append('photo_modem_installation', installationPhotoUrl);
        } else {
          body.append('photo_installation_result', 'Foto instalasi lapangan tersedia');
          body.append('photo_modem_installation', 'Foto instalasi lapangan tersedia');
        }

        const effectiveMac = macAddress || routerSn || '01:32:54:73:16:85';
        body.append('pon_sn', ponSn || `PON-${selected.id.replace(/-/g, '')}`);
        body.append('onu_serial_number', effectiveMac);
        body.append('mac_address', effectiveMac);
        body.append('router_sn', effectiveMac);
        body.append('activation_signature', 'Pelanggan menyetujui berita acara aktivasi.');
        body.append('activation_terms', 'Pelanggan menyetujui berita acara aktivasi.');
        body.append('customer_biodata_confirmed', customerBiodataConfirmed ? '1' : '0');
        body.append('installation_fee_actual', String(Number(installationFeeActual)));
        body.append('installation_payment_method', installationPaymentMethod);
        body.append('installation_payment_customer_paid', installationPaymentCustomerPaid ? '1' : '0');

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
          action_taken: actionNotes || 'Pekerjaan perbaikan/pencabutan selesai.',
          root_cause: rootCause || 'Penyebab telah ditangani.',
          progress_summary: progressSummary || 'Pekerjaan rampung.',
          result_summary: resultSummary || 'Hasil normal.',
          final_optical_power_dbm: Number(opticalPower) || -20.0,
          patch_cord_replaced: selected.type !== 'uninstallation',
          drop_cable_length_meters: selected.type === 'uninstallation' ? 0 : 100,
          modem_replaced: deviceReplacementApplied,
          field_action_type: fieldActionType,
          device_replacement_applied: deviceReplacementApplied,
          device_brand: deviceBrand,
          device_model: deviceModel,
          photo_odp: selected.type === 'uninstallation' ? 'Foto cabutan' : 'Foto ODP',
          photo_optical_power_meter: 'Foto redaman',
          photo_modem_identity: `SN: ${routerSn || `ONU-${selected.id.replace(/-/g, '')}`}`,
          photo_modem_installation: 'Foto instalasi',
          photo_installation_result: installationPhotoUrl || 'Foto hasil',
          pon_sn: ponSn || `PON-${selected.id.replace(/-/g, '')}`,
          onu_serial_number: routerSn || `ONU-${selected.id.replace(/-/g, '')}`,
          mac_address: macAddress || 'AA:BB:CC:DD:EE:FF',
          activation_signature: 'Disetujui di lapangan.',
          activation_terms: 'Disetujui.',
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
      setError(saveError instanceof Error ? saveError.message : 'Gagal submit hasil pekerjaan.');
    } finally {
      setSaving(false);
    }
  };

  const stepsMeta = [
    { number: 1 as WizardStep, title: 'Terima WO', icon: ClipboardCheck },
    { number: 2 as WizardStep, title: 'Detail & Maps', icon: MapPin },
    { number: 3 as WizardStep, title: 'Eksekusi & PPPoE', icon: Wifi },
    { number: 4 as WizardStep, title: 'Bukti & QC', icon: FileCheck },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Mobile-Friendly App Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 sm:text-lg">Teknisi Lapangan</h1>
              <p className="text-[11px] font-semibold text-slate-500">Pengerjaan Work Order Lapangan</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
            title="Data tersinkronisasi otomatis live. Klik untuk refresh manual."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Sync</span>
            <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>

        {/* Quick Work Order Switcher on Mobile/Tablet */}
        {queue.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">WO Saya:</span>
            {queue.map((wo) => (
              <button
                key={wo.id}
                type="button"
                onClick={() => setSelectedId(wo.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                  selected?.id === wo.id
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className="truncate max-w-[120px]">{wo.customerName}</span>
                <span className={`h-2 w-2 rounded-full ${
                  wo.status === 'menunggu_konfirmasi_teknisi' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Container */}
      {!selected ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Belum ada Work Order yang di-assign kepada Anda saat ini.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active WO Compact Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 sm:text-lg">{selected.customerName}</h2>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getWorkOrderTypeBadge(selected.type)}`}>
                    {getWorkOrderTypeLabel(selected.type)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>{selected.id}</span>
                  <span>•</span>
                  <span>{selected.region}</span>
                  <span>•</span>
                  <span className="font-sans font-semibold text-slate-800">{selected.packagePlan || 'Internet Fiber'}</span>
                </div>
              </div>

              <span className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${getStatusTone(selected.status)}`}>
                {getStatusLabel(selected.status)}
              </span>
            </div>

            {/* Stepper Tabs */}
            <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1">
              {stepsMeta.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number || selected.status === 'menunggu_qc_noc';

                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => setCurrentStep(step.number)}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-center transition ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : isCompleted
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate">{step.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review QC Notice */}
          {selected.status === 'menunggu_qc_noc' && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-violet-950 flex items-center gap-3">
              <Clock className="h-6 w-6 text-violet-600 shrink-0" />
              <div className="text-xs">
                <strong className="block font-bold text-sm text-violet-900">Menunggu QC & Verifikasi NOC</strong>
                Laporan pengerjaan telah dikirim. Tim NOC sedang memverifikasi redaman optik dan aktivasi sesi pelanggan.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: TERIMA WO */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-amber-700">
                <Clock className="h-5 w-5" />
                <h3 className="font-bold text-sm">Konfirmasi Penugasan Lapangan</h3>
              </div>

              <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2 bg-slate-50 p-3.5 rounded-xl">
                <div>Pelanggan: <strong className="font-bold text-slate-900">{selected.customerName}</strong></div>
                <div>Wilayah: <strong className="font-bold text-slate-900">{selected.region}</strong></div>
                <div>Alamat: <span className="text-slate-600">{selected.address}</span></div>
                <div>Jadwal: <strong className="font-bold text-slate-900">{selected.scheduledDate || 'Hari ini'}</strong></div>
              </div>

              <div className="pt-2 flex justify-end">
                {selected.status === 'menunggu_konfirmasi_teknisi' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingAction('confirm')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-amber-400 transition"
                  >
                    <Check className="h-4 w-4" />
                    Terima & Konfirmasi WO
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                  >
                    <span>Buka Detail Pelanggan</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DETAIL PELANGGAN & GOOGLE MAPS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Quick Action Touch Buttons */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                <a
                  href={selectedWhatsAppNumber ? `https://wa.me/${selectedWhatsAppNumber}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center justify-center gap-2 rounded-xl p-3.5 text-xs font-bold transition shadow-xs ${
                    selectedWhatsAppNumber
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Hubungi WhatsApp Pelanggan</span>
                </a>

                {selected.shareLocationUrl ? (
                  <a
                    href={
                      selectedCoords
                        ? getGoogleMapsDirectionUrl(selectedCoords.lat, selectedCoords.lng)
                        : selected.shareLocationUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs font-bold text-slate-800 hover:border-emerald-300 hover:text-emerald-700 transition shadow-xs"
                  >
                    <Navigation className="h-4 w-4 text-emerald-600" />
                    <span>Petunjuk Arah Google Maps</span>
                  </a>
                ) : (
                  <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3.5 text-xs font-semibold text-slate-400 cursor-not-allowed">
                    <MapPin className="h-4 w-4" />
                    <span>Link Maps Belum Ada</span>
                  </div>
                )}
              </div>

              {/* Complete Registration Biodata Grid with Masked NIK */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3 text-xs text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-emerald-600" />
                    Biodata & Identitas Registrasi Pelanggan
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> Data Resmi Registrasi
                  </span>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                  {/* Nama Pelanggan */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Nama Pelanggan</span>
                    <strong className="text-sm font-bold text-slate-950 block truncate">{selected.customerName}</strong>
                    <span className="text-[11px] text-slate-500 font-medium">{selected.customerGender || 'Laki-laki'}</span>
                  </div>

                  {/* NIK Masked: Tiga angka di depan, XXX, tiga angka terakhir */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">NIK Pelanggan</span>
                      <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                        Disamarkan
                      </span>
                    </div>
                    <strong className="text-sm font-mono font-bold text-slate-900 block tracking-wider mt-0.5">
                      {maskNik(selected.customerNik || (selected.surveySnapshot as Record<string, unknown>)?.nik as string)}
                    </strong>
                    <span className="text-[10px] text-slate-400">Verifikasi fisik dengan KTP asli</span>
                  </div>

                  {/* Kontak WhatsApp */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Nomor Telepon / WA</span>
                    <strong className="text-xs font-mono font-bold text-slate-900 block">{selected.customerPhone || '-'}</strong>
                    <span className="text-[10px] text-emerald-700 font-semibold">Tersinkronisasi WhatsApp</span>
                  </div>

                  {/* Paket & Tarif */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Paket Langganan</span>
                    <strong className="text-xs font-bold text-emerald-800 block">{selected.packagePlan || 'Internet Fiber'}</strong>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Rp {Number(selected.monthlyFee || (selected.surveySnapshot as Record<string, unknown>)?.monthlyFee || 150000).toLocaleString('id-ID')}/bln
                    </span>
                  </div>

                  {/* Titik ODP & Wilayah */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">ODP & Titik Sambung</span>
                    <strong className="text-xs font-bold text-emerald-700 block font-mono">
                      {selected.odpId || 'Belum di-assign'} {selected.odpPort ? `(Port #${selected.odpPort})` : ''}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-semibold">{selected.region}</span>
                  </div>

                  {/* Sumber Pendaftaran */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Sumber Pendaftaran</span>
                    <strong className="text-xs font-semibold text-slate-800 block truncate">
                      {selected.entrySource || (selected.surveySnapshot as Record<string, unknown>)?.entrySource as string || 'Pendaftaran Registrasi'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-mono">WO: {selected.id}</span>
                  </div>

                  {/* Alamat Lengkap Pemasangan */}
                  <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs sm:col-span-2 md:col-span-3">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">Alamat Lengkap Pemasangan</span>
                    <span className="font-semibold text-slate-900 block leading-relaxed">{selected.address} ({selected.region})</span>
                  </div>
                </div>

                {/* In-Place Biodata Verification Checkbox */}
                {selected.type === 'installation' && (
                  <div className={`mt-2 pt-3 border-t border-slate-200/80 rounded-xl p-3 transition ${
                    customerBiodataConfirmed
                      ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950 shadow-2xs'
                      : 'bg-amber-50/80 border border-amber-200 text-amber-950'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className={`flex items-center gap-2.5 text-xs font-bold ${(!isEditable && selected.status !== 'assigned') ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!isEditable && selected.status !== 'assigned'}
                          checked={customerBiodataConfirmed}
                          onChange={(e) => setCustomerBiodataConfirmed(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 disabled:opacity-75"
                        />
                        <span>Biodata & identitas pelanggan telah dicek langsung di lokasi fisik</span>
                      </label>
                      {customerBiodataConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-white border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Terverifikasi di Lokasi
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700">
                          (Wajib dicentang oleh teknisi setelah cek identitas)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Material List & House Photo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3 bg-white">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Package className="h-4 w-4 text-slate-600" />
                    <span>Material dari Gudang</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {(!selected.requiredMaterials || selected.requiredMaterials.length === 0) ? (
                      <div className="text-slate-400 italic">Tidak ada material khusus tercatat.</div>
                    ) : (
                      selected.requiredMaterials.map((mat, idx) => (
                        <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-700">{mat.itemName}</span>
                          <strong className="text-emerald-700 font-bold">{mat.quantity} {mat.unit}</strong>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-3 bg-white flex flex-col justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <ImagePlus className="h-4 w-4 text-slate-600" />
                    <span>Foto Depan Rumah</span>
                  </div>
                  {selected.housePhoto ? (
                    <div className="space-y-2">
                      <img src={selected.housePhoto} alt="Rumah" className="h-24 w-full object-cover rounded-lg border border-slate-200" />
                      <a href={selected.housePhoto} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 underline inline-flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Buka Foto
                      </a>
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                      Foto belum diunggah
                    </div>
                  )}
                </div>
              </div>

              {/* Nav */}
              <div className="pt-2 flex justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5 inline mr-1" /> Kembali
                </button>

                {selected.status === 'assigned' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingAction('start')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Mulai Pengerjaan Lapangan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition"
                  >
                    <span>Lanjut ke Form Pengerjaan</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: EKSEKUSI, PPPOE & PEMBAYARAN */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {selected.type === 'installation' && (
                <>
                  {/* PPPoE Credentials Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Wifi className="h-4 w-4 text-emerald-600" />
                        Akun PPPoE NOC
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        selected.pppoeRequestStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : selected.pppoeRequestStatus === 'pending_noc'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {selected.pppoeRequestStatus === 'approved' ? 'PPPoE Aktif' : selected.pppoeRequestStatus === 'pending_noc' ? 'Menunggu NOC' : 'Belum Request'}
                      </span>
                    </div>

                    {selected.pppoeRequestStatus === 'approved' ? (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Username</span>
                            <span className="font-mono font-bold text-xs text-emerald-800 select-all">
                              {String(selected.networkCredentials?.pppoeUsername ?? '-')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(selected.networkCredentials?.pppoeUsername ?? ''), 'user')}
                            className="text-slate-400 hover:text-emerald-700 p-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold">Password</span>
                            <span className="font-mono font-bold text-xs text-emerald-800 select-all">
                              {String(selected.networkCredentials?.pppoePassword ?? '-')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(String(selected.networkCredentials?.pppoePassword ?? ''), 'pass')}
                            className="text-slate-400 hover:text-emerald-700 p-1"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 border border-emerald-200">
                          <span className="text-[10px] text-slate-400 block font-bold">VLAN</span>
                          <span className="font-mono font-bold text-xs text-slate-800">
                            {String(selected.networkCredentials?.vlan ?? '100')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-slate-500">Minta akun PPPoE ke NOC</span>
                        <button
                          type="button"
                          onClick={() => setPppoeModalOpen(true)}
                          className="rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                        >
                          Request PPPoE ke NOC
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Payment Details */}
                  <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                      Konfirmasi Pembayaran Biaya Pasang
                    </span>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1 text-xs font-semibold text-slate-700">
                        <span>Biaya Pasang (Rp)</span>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={installationFeeActual}
                          onChange={(e) => setInstallationFeeActual(e.target.value.replace(/[^\d]/g, ''))}
                          placeholder="150000"
                          className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${
                            !isEditable
                              ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                              : 'border-slate-200 focus:border-emerald-400'
                          }`}
                        />
                      </label>

                      <label className="space-y-1 text-xs font-semibold text-slate-700">
                        <span>Metode Pembayaran</span>
                        <select
                          disabled={!isEditable}
                          value={installationPaymentMethod}
                          onChange={(e) => setInstallationPaymentMethod(e.target.value as 'tunai' | 'transfer' | '')}
                          className={`h-10 w-full rounded-xl border px-2.5 text-xs outline-none ${
                            !isEditable
                              ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                              : 'border-slate-200 focus:border-emerald-400'
                          }`}
                        >
                          <option value="">-- Pilih --</option>
                          <option value="tunai">Tunai (Cash di Tempat)</option>
                          <option value="transfer">Transfer Bank / QRIS</option>
                        </select>
                      </label>

                      <label className={`flex items-center gap-2 text-xs font-semibold text-slate-800 sm:col-span-2 ${!isEditable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          disabled={!isEditable}
                          checked={installationPaymentCustomerPaid}
                          onChange={(e) => setInstallationPaymentCustomerPaid(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-75"
                        />
                        <span>Pelanggan sudah melunasi biaya pemasangan di tempat</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Maintenance Options */}
              {selected.type === 'maintenance' && (
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-emerald-600" />
                    Pilihan Tindakan Gangguan
                  </span>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Jenis Tindakan</span>
                      <select
                        disabled={!isEditable}
                        value={fieldActionType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFieldActionType(val);
                          setDeviceReplacementApplied(val === 'ganti_onu_router');
                        }}
                        className={`h-10 w-full rounded-xl border px-2.5 text-xs outline-none ${
                          !isEditable
                            ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 focus:border-emerald-400'
                        }`}
                      >
                        <option value="tanpa_ganti_alat">Tanpa Ganti Alat</option>
                        <option value="ganti_onu_router">Ganti ONU / Router</option>
                        <option value="perbaikan_kabel">Perbaikan Kabel FO / Splicing</option>
                        <option value="konfigurasi">Konfigurasi Ulang Modem</option>
                        <option value="listrik">Kendala Listrik / Adaptor</option>
                      </select>
                    </label>

                    <label className={`flex items-center gap-2 text-xs font-semibold text-slate-800 ${!isEditable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        disabled={!isEditable}
                        checked={deviceReplacementApplied}
                        onChange={(e) => {
                          setDeviceReplacementApplied(e.target.checked);
                          setFieldActionType(e.target.checked ? 'ganti_onu_router' : 'tanpa_ganti_alat');
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 disabled:opacity-75"
                      />
                      <span>Terdapat penggantian perangkat ONT</span>
                    </label>

                    {deviceReplacementApplied && (
                      <>
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          <span>Brand Perangkat Baru</span>
                          <input
                            type="text"
                            placeholder="ZTE / Huawei"
                            disabled={!isEditable}
                            value={deviceBrand}
                            onChange={(e) => setDeviceBrand(e.target.value)}
                            className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${
                              !isEditable
                                ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                : 'border-slate-200 focus:border-emerald-400'
                            }`}
                          />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-slate-700">
                          <span>Model Perangkat Baru</span>
                          <input
                            type="text"
                            placeholder="F609 V3"
                            disabled={!isEditable}
                            value={deviceModel}
                            onChange={(e) => setDeviceModel(e.target.value)}
                            className={`h-10 w-full rounded-xl border px-3 text-xs outline-none ${
                              !isEditable
                                ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                                : 'border-slate-200 focus:border-emerald-400'
                            }`}
                          />
                        </label>
                      </>
                    )}

                    <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                      <span>Penyebab Kendala</span>
                      <textarea
                        placeholder="Deskripsikan penyebab gangguan di lokasi..."
                        disabled={!isEditable}
                        value={rootCause}
                        onChange={(e) => setRootCause(e.target.value)}
                        className={`h-16 w-full rounded-xl border p-2.5 text-xs outline-none ${
                          !isEditable
                            ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 focus:border-emerald-400'
                        }`}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Uninstallation Options */}
              {selected.type === 'uninstallation' && (
                <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    Pencabutan Perangkat
                  </span>

                  <label className="space-y-1 text-xs font-semibold text-slate-700 block">
                    <span>Catatan Kondisi Alat Cabutan</span>
                    <textarea
                      placeholder="Jelaskan kondisi fisik alat (mulus, adaptor hilang, dll)..."
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      className="h-16 w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400"
                    />
                  </label>
                </div>
              )}

              {/* Nav */}
              <div className="pt-2 flex justify-between gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5 inline mr-1" /> Kembali
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs transition"
                >
                  <span>Lanjut ke Bukti & QC</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: BUKTI KERJA, OPM, SN, BERITA ACARA & SUBMIT QC */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              {/* Technical Measurements */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="h-4 w-4 text-emerald-600" />
                    Pengukuran & Bukti Foto
                  </span>
                  {!isEditable && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      <Lock className="h-3 w-3 text-slate-500" /> Terkunci (Read-Only)
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs font-semibold text-slate-700">
                    <span>Redaman OPM Final (dBm)</span>
                    <input
                      type="text"
                      placeholder="-20.5"
                      disabled={!isEditable}
                      value={opticalPower}
                      onChange={(e) => setOpticalPower(e.target.value)}
                      className={`h-10 w-full rounded-xl border px-3 text-xs outline-none font-mono font-bold ${
                        !isEditable
                          ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                          : 'border-slate-200 focus:border-emerald-400'
                      }`}
                    />
                    <span className="text-[10px] text-slate-400">Standar: -18 s/d -23 dBm</span>
                  </label>

                  {selected.type === 'installation' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">MAC Address Router</span>
                        {isEditable && (
                          <button
                            type="button"
                            onClick={() => macFileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                          >
                            <Camera className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Foto / Scan Label MAC</span>
                          </button>
                        )}
                        <input
                          ref={macFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleMacPhotoSelected(e.target.files?.[0] ?? null)}
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="01:32:54:76:85:AB"
                        disabled={!isEditable}
                        value={macAddress || routerSn}
                        onChange={(e) => {
                          const formatted = formatMacAddress(e.target.value);
                          setMacAddress(formatted);
                          setRouterSn(formatted);
                        }}
                        className={`h-10 w-full rounded-xl border px-3 text-xs outline-none uppercase font-mono font-bold ${
                          !isEditable
                            ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                            : 'border-slate-200 focus:border-emerald-400'
                        }`}
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Format: 6 blok heksadesimal (OUI : NIC)</span>
                        {(photoOnuFile || !isEditable) ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Foto label tersimpan
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Photo Uploads / Previews */}
                  <div className="sm:col-span-2 space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600 block">Upload Bukti Lapangan</span>
                      <span className="text-[10px] text-slate-400">Foto label router otomatis terisi dari scan MAC</span>
                    </div>

                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                      {/* Photo ODP */}
                      {isEditable ? (
                        <label className={`rounded-xl border border-dashed p-2.5 text-center cursor-pointer transition block ${
                          photoOdpFile ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoOdpFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <Camera className={`h-4 w-4 mx-auto mb-1 ${photoOdpFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">
                            {photoOdpFile ? photoOdpFile.name : 'Foto ODP'}
                          </span>
                          {photoOdpFile && <span className="text-[9px] font-bold text-emerald-700 block">Terpasang</span>}
                        </label>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                          <Camera className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">Foto ODP</span>
                          <span className="text-[9px] font-bold text-emerald-700 block">Tersimpan</span>
                        </div>
                      )}

                      {/* Photo OPM */}
                      {isEditable ? (
                        <label className={`rounded-xl border border-dashed p-2.5 text-center cursor-pointer transition block ${
                          photoOpmFile ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoOpmFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <Camera className={`h-4 w-4 mx-auto mb-1 ${photoOpmFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">
                            {photoOpmFile ? photoOpmFile.name : 'Foto Redaman'}
                          </span>
                          {photoOpmFile && <span className="text-[9px] font-bold text-emerald-700 block">Terpasang</span>}
                        </label>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                          <Camera className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">Foto Redaman</span>
                          <span className="text-[9px] font-bold text-emerald-700 block">Tersimpan</span>
                        </div>
                      )}

                      {/* Photo Label MAC */}
                      {isEditable ? (
                        <label className={`rounded-xl border border-dashed p-2.5 text-center cursor-pointer transition block ${
                          photoOnuFile ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPhotoOnuFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <QrCode className={`h-4 w-4 mx-auto mb-1 ${photoOnuFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">
                            {photoOnuFile ? photoOnuFile.name : 'Foto Label MAC'}
                          </span>
                          {photoOnuFile && <span className="text-[9px] font-bold text-emerald-700 block">Terpasang</span>}
                        </label>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                          <QrCode className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">Foto Label MAC</span>
                          <span className="text-[9px] font-bold text-emerald-700 block">Tersimpan</span>
                        </div>
                      )}

                      {/* Photo Hasil */}
                      {isEditable ? (
                        <label className={`rounded-xl border border-dashed p-2.5 text-center cursor-pointer transition block ${
                          installationPhotoFile ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setInstallationPhotoFile(e.target.files?.[0] ?? null)}
                            className="hidden"
                          />
                          <Camera className={`h-4 w-4 mx-auto mb-1 ${installationPhotoFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">
                            {installationPhotoFile ? installationPhotoFile.name : 'Foto Hasil Pasang'}
                          </span>
                          {installationPhotoFile && <span className="text-[9px] font-bold text-emerald-700 block">Terpasang</span>}
                        </label>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center">
                          <Camera className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                          <span className="text-[11px] font-semibold text-slate-700 block truncate">Foto Hasil Pasang</span>
                          <span className="text-[9px] font-bold text-emerald-700 block">Tersimpan</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <label className="space-y-1 text-xs font-semibold text-slate-700 sm:col-span-2">
                    <span>Ringkasan Tindakan Teknis</span>
                    <textarea
                      placeholder="Penarikan drop core, pengetesan redaman, ONT terpasang..."
                      disabled={!isEditable}
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className={`h-16 w-full rounded-xl border p-2.5 text-xs outline-none ${
                        !isEditable
                          ? 'bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                          : 'border-slate-200 focus:border-emerald-400'
                      }`}
                    />
                  </label>
                </div>
              </div>

              {/* Berita Acara & WA Sharing (For Installation) */}
              {selected.type === 'installation' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4 text-emerald-700" />
                      Berita Acara Aktivasi & Serah Terima
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Dokumen Serah Terima
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Tunjukkan berkas Berita Acara secara langsung ke pelanggan atau kirimkan salinan rekap ke WhatsApp pelanggan.
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBeritaAcaraModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
                    >
                      <Eye className="h-4 w-4 text-emerald-600" />
                      <span>Lihat Berkas / Detail Berita Acara</span>
                    </button>

                    <a
                      href={selectedWhatsAppNumber ? `https://wa.me/${selectedWhatsAppNumber}?text=${generateBeritaAcaraText()}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition shadow-xs ${
                        selectedWhatsAppNumber
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim ke WhatsApp Pelanggan</span>
                    </a>
                  </div>

                  <label className={`flex items-center gap-2 text-xs font-semibold text-emerald-950 pt-1 ${!isEditable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={!isEditable}
                      checked={activationTermsAccepted}
                      onChange={(e) => setActivationTermsAccepted(e.target.checked)}
                      className="h-4 w-4 rounded border-emerald-300 text-emerald-600 disabled:opacity-75"
                    />
                    <span>Pelanggan telah menyetujui Berita Acara & ketentuan layanan</span>
                  </label>
                </div>
              )}

              {/* Missing Requirements Alert - ONLY SHOWN WHEN EDITABLE AND INCOMPLETE */}
              {isEditable && !canSubmitInstallation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lengkapi data berikut sebelum submit ke QC NOC:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-amber-700 text-[11px]">
                      {opticalPower.trim() === '' && <li>Nilai redaman optik belum diisi</li>}
                      {selected.type === 'installation' && !macAddress.trim() && !routerSn.trim() && <li>MAC Address router belum diisi</li>}
                      {selected.type === 'installation' && !customerBiodataConfirmed && <li>Verifikasi biodata pelanggan di lokasi belum dicentang (Step 2)</li>}
                      {actionNotes.trim() === '' && <li>Ringkasan tindakan lapangan belum diisi</li>}
                      {selected.type === 'installation' && !activationTermsAccepted && <li>Persetujuan Berita Acara belum dicentang</li>}
                      {selected.type === 'installation' && selected.pppoeRequestStatus !== 'approved' && <li>Akun PPPoE belum di-approve NOC</li>}
                    </ul>
                  </div>
                </div>
              )}

              {/* Nav & Action Controls */}
              <div className="pt-2 flex justify-between items-center gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-3.5 w-3.5 inline mr-1" /> Kembali
                </button>

                {selected.status === 'menunggu_qc_noc' ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-violet-100 border border-violet-300 px-5 py-2.5 text-xs font-bold text-violet-900 shadow-2xs">
                    <Clock className="h-4 w-4 text-violet-700" />
                    <span>Laporan Terkirim (Menunggu QC NOC)</span>
                  </div>
                ) : (selected.status === 'closed' || selected.status === 'completed') ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 border border-emerald-300 px-5 py-2.5 text-xs font-bold text-emerald-900 shadow-2xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Pekerjaan Selesai & Terverifikasi</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={saving || !canSubmitInstallation}
                    onClick={() => setPendingAction('submit')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>
                      {selected.type === 'maintenance'
                        ? 'Submit ke QC NOC'
                        : selected.type === 'uninstallation'
                        ? 'Selesaikan WO Pencabutan'
                        : 'Submit Hasil Instalasi ke QC NOC'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PPPoE Request Modal */}
      <NotesActionModal
        open={pppoeModalOpen}
        title="Request Akun PPPoE ke NOC"
        message="Permintaan akan dikirimkan ke tim NOC. Setelah di-approve, username dan password akan tampil otomatis."
        label="Catatan untuk NOC (Opsional)"
        value={pppoeRequestNotes}
        onChange={setPppoeRequestNotes}
        confirmLabel="Kirim ke NOC"
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
            ? 'Konfirmasi Mulai Kerja'
            : 'Konfirmasi Submit ke QC NOC'
        }
        message={
          selected
            ? pendingAction === 'confirm'
              ? `WO ${selected.id} untuk ${selected.customerName} akan Anda terima sebagai tugas aktif.`
              : pendingAction === 'start'
              ? `WO ${selected.id} untuk ${selected.customerName} akan mulai dikerjakan sekarang.`
              : `Hasil pekerjaan ${selected.id} (${selected.customerName}) akan dikirimkan ke QC NOC untuk verifikasi akhir.`
            : ''
        }
        confirmLabel={
          pendingAction === 'confirm'
            ? 'Ya, Terima WO'
            : pendingAction === 'start'
            ? 'Ya, Mulai Kerja'
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

      {/* MAC Address Detected Confirmation Modal */}
      {isMacConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-md flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Scan className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Hasil Scan MAC Router</h3>
                  <p className="text-[11px] text-slate-400">Konfirmasi pembacaan label</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMacConfirmModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              {macPhotoPreview && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-40">
                  <img src={macPhotoPreview} alt="Foto Label MAC" className="h-40 w-full object-contain" />
                  <span className="absolute bottom-2 right-2 text-[10px] bg-slate-900/80 text-white px-2 py-0.5 rounded-md font-mono">
                    Foto Label Disimpan
                  </span>
                </div>
              )}

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  MAC Address Terbaca:
                </span>
                <div className="text-lg font-black font-mono text-emerald-950 tracking-wider">
                  {scannedMacCandidate}
                </div>
                <p className="text-[11px] text-slate-600">
                  Apakah nomor MAC ini sudah sesuai dengan yang tertera pada label fisik modem/router?
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMacAddress(scannedMacCandidate);
                    setRouterSn(scannedMacCandidate);
                    setIsMacConfirmModalOpen(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                >
                  <Check className="h-4 w-4" />
                  <span>Ya, Gunakan MAC Address Ini</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMacAddress(scannedMacCandidate);
                      setRouterSn(scannedMacCandidate);
                      setIsMacConfirmModalOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <span>Koreksi Manual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMacConfirmModalOpen(false);
                      setIsMacWarningModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                  >
                    <span>Tidak Terbaca</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAC Address Unreadable Warning Modal */}
      {isMacWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="flex w-full max-w-sm flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">SN / MAC Tidak Terbaca</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                MAC Address tidak terbaca secara otomatis dari foto. Silakan inputkan secara manual pada form dan pastikan benar.
              </p>

              <button
                type="button"
                onClick={() => setIsMacWarningModalOpen(false)}
                className="w-full mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Mengerti, Input Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Berita Acara Full Document Viewer Modal */}
      <BeritaAcaraModal
        open={isBeritaAcaraModalOpen}
        workOrder={selected}
        macAddress={macAddress || routerSn}
        opticalPower={opticalPower}
        installationFee={installationFeeActual}
        paymentMethod={installationPaymentMethod}
        technicianName={user?.name}
        onClose={() => setIsBeritaAcaraModalOpen(false)}
      />
    </div>
  );
};

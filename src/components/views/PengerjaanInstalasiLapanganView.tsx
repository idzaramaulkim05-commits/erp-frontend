import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, ImagePlus, MessageCircle, RefreshCcw, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';

type FieldActionType = 'confirm' | 'start' | 'submit';

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
  const [fieldActionType, setFieldActionType] = useState('tanpa_ganti_alat');
  const [deviceReplacementApplied, setDeviceReplacementApplied] = useState(false);
  const [deviceBrand, setDeviceBrand] = useState('ZTE');
  const [deviceModel, setDeviceModel] = useState('F670L');
  const [actionNotes, setActionNotes] = useState('Instalasi selesai dan siap dikirim ke QC NOC.');
  const [rootCause, setRootCause] = useState('Penyebab gangguan telah diidentifikasi di lapangan.');
  const [progressSummary, setProgressSummary] = useState('Pengecekan dan perbaikan lapangan sedang / sudah dilakukan sesuai kebutuhan.');
  const [resultSummary, setResultSummary] = useState('Layanan kembali normal dan siap diverifikasi lebih lanjut.');
  const [opticalPower, setOpticalPower] = useState('-20.3');
  const [routerSn, setRouterSn] = useState('');
  const [installationPhotoUrl, setInstallationPhotoUrl] = useState('');
  const [installationPhotoFile, setInstallationPhotoFile] = useState<File | null>(null);
  const [customerBiodataConfirmed, setCustomerBiodataConfirmed] = useState(false);
  const [installationFeeActual, setInstallationFeeActual] = useState('');
  const [installationPaymentMethod, setInstallationPaymentMethod] = useState<'tunai' | 'transfer' | ''>('');
  const [installationPaymentCustomerPaid, setInstallationPaymentCustomerPaid] = useState(false);
  const [pppoeRequestNotes, setPppoeRequestNotes] = useState('Mohon siapkan PPPoE untuk pasang baru ini.');
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

  useEffect(() => {
    if (!selected) {
      return;
    }

    setSelectedId(selected.id);
    setActionNotes(
      selected.type === 'maintenance'
        ? 'Pekerjaan gangguan selesai dan siap dikirim ke QC NOC.'
        : selected.type === 'uninstallation'
        ? 'Pencabutan alat pelanggan selesai dan siap dikirim ke antrean retur gudang.'
        : 'Instalasi selesai dan siap dikirim ke QC NOC.',
    );
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
    setDeviceBrand(String(selected.maintenancePayload?.newDeviceIdentity?.brand ?? 'ZTE'));
    setDeviceModel(String(selected.maintenancePayload?.newDeviceIdentity?.model ?? 'F670L'));
    setRootCause('Penyebab gangguan telah diidentifikasi di lapangan.');
    setProgressSummary('Pengecekan dan perbaikan lapangan sedang / sudah dilakukan sesuai kebutuhan.');
    setResultSummary('Layanan kembali normal dan siap diverifikasi lebih lanjut.');
    setRouterSn(selected.routerSn ?? String(selected.onuIdentity?.serialNumber ?? ''));
    setInstallationPhotoUrl(String(selected.photos?.installationResult ?? ''));
    setInstallationPhotoFile(null);
    setCustomerBiodataConfirmed(Boolean(selected.customerBiodataConfirmed));
    setInstallationFeeActual(getSurveyInstallationFee(selected));
    setInstallationPaymentMethod(selected.installationPaymentMethod ?? '');
    setInstallationPaymentCustomerPaid(Boolean(selected.installationPaymentCustomerPaid));
    setPppoeRequestNotes('Mohon siapkan PPPoE untuk pasang baru ini.');
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
      return [{ itemName: 'ONU Lama / Error', quantity: 1, unit: 'Unit', returnCategory: 'old_defective' }];
    }

    return (selected.requiredMaterials ?? []).map((material) => ({
      itemName: material.itemName,
      quantity: material.quantity,
      unit: material.unit,
      returnCategory: 'unused_replacement',
    }));
  }, [deviceReplacementApplied, selected]);

  const canSubmitInstallation = useMemo(() => {
    if (!selected) return false;
    if (!['sedang_diinstal', 'in_progress', 'dikembalikan_ke_teknisi'].includes(selected.status)) return false;
    if (selected.type !== 'installation') return true;

    return Boolean(
      routerSn.trim()
      && (Boolean(installationPhotoFile) || installationPhotoUrl.trim().length > 0)
      && customerBiodataConfirmed
      && installationFeeActual.trim()
      && installationPaymentMethod
      && installationPaymentCustomerPaid
      && selected.pppoeRequestStatus === 'approved',
    );
  }, [
    customerBiodataConfirmed,
    installationFeeActual,
    installationPaymentCustomerPaid,
    installationPaymentMethod,
    installationPhotoFile,
    installationPhotoUrl,
    routerSn,
    selected,
  ]);

  const startInstallation = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/start-installation`, { method: 'POST' });
      await load();
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
        body: JSON.stringify({ notes: pppoeRequestNotes }),
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
        body.append('action_taken', actionNotes);
        body.append('root_cause', rootCause);
        body.append('progress_summary', progressSummary);
        body.append('result_summary', resultSummary);
        body.append('final_optical_power_dbm', String(Number(opticalPower)));
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
          action_taken: actionNotes,
          root_cause: rootCause,
          progress_summary: progressSummary,
          result_summary: resultSummary,
          final_optical_power_dbm: Number(opticalPower),
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
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal submit hasil pekerjaan lapangan.');
    } finally {
      setSaving(false);
    }
  };

  const confirmFieldAssignment = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/confirm-field-assignment`, { method: 'POST' });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengonfirmasi WO baru.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Teknisi Lapangan</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Pengerjaan Lapangan</h1>
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
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        {[
          { label: 'Total WO Saya', value: summary.total, tone: 'text-slate-500' },
          { label: 'WO Baru', value: summary.newAssigned, tone: 'text-amber-600' },
          { label: 'Siap Dikerjakan', value: summary.ready, tone: 'text-amber-600' },
          { label: 'Sedang Jalan', value: summary.inProgress, tone: 'text-sky-600' },
          { label: 'QC / Revisi', value: summary.waitingQc + summary.returned, tone: 'text-violet-600' },
        ].map((card) => (
          <article key={card.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`text-[11px] font-bold uppercase tracking-[0.18em] ${card.tone}`}>{card.label}</div>
            <div className="mt-3 text-3xl font-black text-slate-950">{card.value}</div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-slate-900">WO Saya</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat WO...
              </div>
            ) : queue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada WO yang di-assign ke Anda saat ini.
              </div>
            ) : (
              queue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    selected?.id === item.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.customerName}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getWorkOrderTypeTone(item.type)}`}>
                      {getWorkOrderTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{item.id}</span>
                    <span className="text-slate-300">•</span>
                    <span>{getStatusLabel(item.status)}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{item.address}</div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
              Pilih work order lapangan untuk mulai pengerjaan.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Wifi className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{selected.customerName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{selected.id}</span>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getWorkOrderTypeTone(selected.type)}`}>
                      {getWorkOrderTypeLabel(selected.type)}
                    </span>
                    <span>{selected.region}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  Konteks pekerjaan
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Status</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{getStatusLabel(selected.status)}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Teknisi</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selected.assignedTechName ?? '-'}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Nomor Pelanggan</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selected.customerPhone || 'Belum tersedia'}</div>
                  </div>
                  <div className="rounded-xl bg-white px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Share Location</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{selected.shareLocationUrl || 'Belum tersedia'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={selectedWhatsAppNumber ? `https://wa.me/${selectedWhatsAppNumber}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!selectedWhatsAppNumber}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    selectedWhatsAppNumber
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  Hubungi via WhatsApp
                </a>
                <a
                  href={selected.housePhoto || undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!selected.housePhoto}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    selected.housePhoto
                      ? 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700'
                      : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  <ImagePlus className="h-4 w-4" />
                  {selected.housePhoto ? 'Buka Foto Depan Rumah' : 'Foto Rumah Belum Ada'}
                </a>
              </div>

              {selected.type === 'installation' && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-900">PPPoE NOC</div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      selected.pppoeRequestStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-700'
                        : selected.pppoeRequestStatus === 'pending_noc'
                        ? 'bg-amber-100 text-amber-700'
                        : selected.pppoeRequestStatus === 'rejected'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {selected.pppoeRequestStatus === 'approved'
                        ? 'Approved'
                        : selected.pppoeRequestStatus === 'pending_noc'
                        ? 'Menunggu NOC'
                        : selected.pppoeRequestStatus === 'rejected'
                        ? 'Ditolak NOC'
                        : 'Belum Request'}
                    </span>
                  </div>

                  {selected.pppoeRequestStatus === 'approved' ? (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-white px-3 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Username</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {String(selected.networkCredentials?.pppoeUsername ?? '-')}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Password</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {String(selected.networkCredentials?.pppoePassword ?? '-')}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white px-3 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">VLAN</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">
                          {String(selected.networkCredentials?.vlan ?? '-')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setPppoeModalOpen(true)}
                        disabled={saving || selected.status === 'menunggu_konfirmasi_teknisi'}
                        className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {selected.pppoeRequestStatus === 'rejected' ? 'Request Ulang PPPoE ke NOC' : 'Request PPPoE ke NOC'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-slate-700">
                  <span>Redaman Final (dBm)</span>
                  <input
                    value={opticalPower}
                    onChange={(event) => setOpticalPower(event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>

                {selected.type === 'installation' ? (
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>SN Router / ONU</span>
                    <input
                      value={routerSn}
                      onChange={(event) => setRouterSn(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                ) : null}
              </div>

              {selected.type === 'installation' && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Foto Pemasangan</span>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setInstallationPhotoFile(event.target.files?.[0] ?? null)}
                        className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-emerald-700"
                      />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {installationPhotoFile?.name
                          ?? (installationPhotoUrl ? 'Foto pemasangan sudah tersimpan' : 'Belum ada foto pemasangan')}
                      </div>
                      {installationPhotoUrl ? (
                        <a
                          href={installationPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-600"
                        >
                          <ImagePlus className="h-4 w-4" />
                          Buka foto tersimpan
                        </a>
                      ) : null}
                    </div>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Biaya Pemasangan Aktual</span>
                    <input
                      value={installationFeeActual}
                      onChange={(event) => setInstallationFeeActual(event.target.value.replace(/[^\d]/g, ''))}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Metode Pembayaran</span>
                    <select
                      value={installationPaymentMethod}
                      onChange={(event) => setInstallationPaymentMethod(event.target.value as 'tunai' | 'transfer' | '')}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="">Pilih metode pembayaran</option>
                      <option value="tunai">Tunai</option>
                      <option value="transfer">Transfer</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Status Bayar Pelanggan</span>
                    <label className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={installationPaymentCustomerPaid}
                        onChange={(event) => setInstallationPaymentCustomerPaid(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                      />
                      Pelanggan sudah membayar di lapangan
                    </label>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                    <span>Konfirmasi Biodata</span>
                    <label className="flex min-h-[56px] items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800">
                      <input
                        type="checkbox"
                        checked={customerBiodataConfirmed}
                        onChange={(event) => setCustomerBiodataConfirmed(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                      />
                      Biodata pelanggan sudah dicek langsung ke pelanggan
                    </label>
                  </label>
                </div>
              )}

              {selected.type === 'maintenance' && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Action Pekerjaan</span>
                    <select
                      value={fieldActionType}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setFieldActionType(nextValue);
                        setDeviceReplacementApplied(nextValue === 'ganti_onu_router');
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="tanpa_ganti_alat">Tanpa Ganti Alat</option>
                      <option value="ganti_onu_router">Ganti ONU / Router</option>
                      <option value="perbaikan_kabel">Perbaikan Kabel</option>
                      <option value="konfigurasi">Konfigurasi</option>
                      <option value="listrik">Kendala Listrik / Adaptor</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Penyebab Kendala</span>
                    <textarea
                      value={rootCause}
                      onChange={(event) => setRootCause(event.target.value)}
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Progress Perbaikan</span>
                    <textarea
                      value={progressSummary}
                      onChange={(event) => setProgressSummary(event.target.value)}
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              )}

              {selected.type === 'uninstallation' && (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Action Pencabutan</span>
                    <select
                      value={fieldActionType}
                      onChange={(event) => setFieldActionType(event.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    >
                      <option value="pencabutan_alat">Pencabutan Alat Lengkap</option>
                      <option value="pencabutan_sebagian">Pencabutan Sebagian</option>
                      <option value="alat_hilang">Ada Item Hilang</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-slate-700">
                    <span>Catatan Kondisi Alat</span>
                    <textarea
                      value={rootCause}
                      onChange={(event) => setRootCause(event.target.value)}
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </div>
              )}

              {selected.type === 'maintenance' && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-black text-slate-900">Status Pergantian Perangkat</div>
                    <label className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={deviceReplacementApplied}
                        onChange={(event) => {
                          setDeviceReplacementApplied(event.target.checked);
                          setFieldActionType(event.target.checked ? 'ganti_onu_router' : 'tanpa_ganti_alat');
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                      />
                      Ganti perangkat
                    </label>
                  </div>

                  {deviceReplacementApplied ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm font-semibold text-slate-700">
                        <span>Brand Perangkat Baru</span>
                        <input
                          value={deviceBrand}
                          onChange={(event) => setDeviceBrand(event.target.value)}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>
                      <label className="space-y-2 text-sm font-semibold text-slate-700">
                        <span>Model Perangkat Baru</span>
                        <input
                          value={deviceModel}
                          onChange={(event) => setDeviceModel(event.target.value)}
                          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              )}

              <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
                <span>{selected.type === 'maintenance' ? 'Ringkasan Tindakan & Hasil Perbaikan' : 'Ringkasan Tindakan Lapangan'}</span>
                <textarea
                  value={actionNotes}
                  onChange={(event) => setActionNotes(event.target.value)}
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {(selected.type === 'maintenance' || selected.type === 'uninstallation') ? (
                <label className="mt-4 block space-y-2 text-sm font-semibold text-slate-700">
                  <span>{selected.type === 'uninstallation' ? 'Catatan Pencabutan & Serah Terima' : 'Hasil Akhir Koneksi'}</span>
                  <textarea
                    value={resultSummary}
                    onChange={(event) => setResultSummary(event.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              ) : null}

              {(selected.type === 'maintenance' || selected.type === 'uninstallation') ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <ImagePlus className="h-4 w-4 text-slate-500" />
                    Retur ke Gudang
                  </div>
                  <div className="mt-3 space-y-2">
                    {normalizedReturnItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
                        Belum ada item retur yang perlu dicatat.
                      </div>
                    ) : (
                      normalizedReturnItems.map((item) => (
                        <div key={`${item.itemName}-${item.returnCategory}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                          <div>
                            <div className="font-semibold text-slate-900">{item.itemName}</div>
                            <div className="text-xs text-slate-500">{item.quantity} {item.unit}</div>
                          </div>
                          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.returnCategory}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {selected.status === 'menunggu_konfirmasi_teknisi' ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setPendingAction('confirm')}
                    className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    Konfirmasi Terima WO
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={saving || selected.status === 'menunggu_konfirmasi_teknisi' || selected.status === 'menunggu_qc_noc'}
                  onClick={() => setPendingAction('start')}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
                >
                  {selected.type === 'maintenance' ? 'Mulai Pengerjaan' : selected.type === 'uninstallation' ? 'Mulai Pencabutan' : 'Mulai Instalasi'}
                </button>
                <button
                  type="button"
                  disabled={saving || !canSubmitInstallation}
                  onClick={() => setPendingAction('submit')}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {selected.type === 'maintenance' ? 'Submit ke QC NOC' : selected.type === 'uninstallation' ? 'Selesaikan WO Pencabutan' : 'Submit Hasil Instalasi'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <NotesActionModal
        open={pppoeModalOpen}
        title="Request PPPoE ke NOC"
        message="Request ini akan masuk ke antrean NOC. Setelah username dan password diisi lalu di-approve oleh NOC, teknisi baru bisa submit hasil instalasi akhir."
        label="Catatan Request"
        value={pppoeRequestNotes}
        onChange={setPppoeRequestNotes}
        confirmLabel="Kirim Request"
        tone="warning"
        loading={saving}
        onConfirm={() => void requestPppoe()}
        onCancel={() => setPppoeModalOpen(false)}
      />

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
              ? `WO ${selected.id} untuk ${selected.customerName} akan Anda konfirmasi sebagai pekerjaan baru.`
              : pendingAction === 'start'
              ? `WO ${selected.id} untuk ${selected.customerName} akan masuk ke status pekerjaan aktif.`
              : selected.type === 'uninstallation'
              ? `WO ${selected.id} untuk ${selected.customerName} akan diselesaikan di sisi teknisi lapangan dan masuk ke antrean retur gudang.`
              : selected.type === 'maintenance'
              ? `WO ${selected.id} untuk ${selected.customerName} akan dikirim ke QC NOC.`
              : `WO ${selected.id} untuk ${selected.customerName} akan dikirim ke QC NOC setelah seluruh data pasang baru dinyatakan lengkap.`
            : ''
        }
        confirmLabel={
          pendingAction === 'confirm'
            ? 'Ya, Konfirmasi WO'
            : pendingAction === 'start'
            ? (selected?.type === 'maintenance' ? 'Ya, Mulai Pengerjaan' : selected?.type === 'uninstallation' ? 'Ya, Mulai Pencabutan' : 'Ya, Mulai Instalasi')
            : (selected?.type === 'maintenance' ? 'Ya, Submit ke QC NOC' : selected?.type === 'uninstallation' ? 'Ya, Selesaikan WO' : 'Ya, Submit ke QC')
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

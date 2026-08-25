import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  Edit3,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  RefreshCcw,
  Send,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MasterDataGroup, ServiceRegistration } from '../../types';
import { extractCoordinatesFromUrl, getGoogleMapsDirectionUrl } from '../../utils/coordinates';

interface RegistrationFormState {
  name: string;
  nik: string;
  gender: string;
  phone: string;
  address: string;
  region: string;
  packagePlan: string;
  monthlyFee: string;
  installationFee: string;
  shareLocationUrl: string;
}

const emptyForm: RegistrationFormState = {
  name: '',
  nik: '',
  gender: '',
  phone: '',
  address: '',
  region: '',
  packagePlan: '',
  monthlyFee: '',
  installationFee: '',
  shareLocationUrl: '',
};

interface RegionOption {
  name: string;
}

interface ServicePackageOption {
  name: string;
  monthlyFee: number;
}

export const RegistrasiPelangganBaruView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [items, setItems] = useState<ServiceRegistration[]>([]);
  const [masterGroups, setMasterGroups] = useState<MasterDataGroup[]>([]);
  const [form, setForm] = useState<RegistrationFormState>(emptyForm);
  const [editingItem, setEditingItem] = useState<ServiceRegistration | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [housePhotoFile, setHousePhotoFile] = useState<File | null>(null);
  const [housePhotoPreview, setHousePhotoPreview] = useState<string | null>(null);
  const housePhotoInputRef = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [registrations, masterData] = await Promise.all([
        authFetch<{ data: ServiceRegistration[] }>('/service-registrations'),
        authFetch<{ data: MasterDataGroup[] }>('/admin/master-data'),
      ]);
      setItems(registrations.data);
      setMasterGroups(masterData.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat registrasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  // Limit recent registrations to 5 items only as requested
  const recentItems = useMemo(
    () => items
      .filter((item) => item.status !== 'perlu_perbaikan_data')
      .slice()
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
      .slice(0, 5),
    [items],
  );

  // Filter registrations that were returned by validator for revision
  const rejectedItems = useMemo(
    () => items
      .filter((item) => item.status === 'perlu_perbaikan_data' || item.validationStatus === 'needs_revision')
      .slice()
      .sort((a, b) => (b.updatedAt ?? b.createdAt ?? '').localeCompare(a.updatedAt ?? a.createdAt ?? '')),
    [items],
  );

  const regions = useMemo<RegionOption[]>(() => {
    const group = masterGroups.find((item) => item.key === 'regions');
    return (group?.items ?? [])
      .filter((item): item is RegionOption => typeof item?.name === 'string' && item.name.trim() !== '');
  }, [masterGroups]);

  const servicePackages = useMemo<ServicePackageOption[]>(() => {
    const group = masterGroups.find((item) => item.key === 'service_packages');
    return (group?.items ?? [])
      .filter((item): item is ServicePackageOption => (
        typeof item?.name === 'string'
        && item.name.trim() !== ''
        && typeof item?.monthlyFee === 'number'
      ));
  }, [masterGroups]);

  const selectedPackage = servicePackages.find((item) => item.name === form.packagePlan) ?? null;
  const hasRegionOptions = regions.length > 0;
  const hasServicePackageOptions = servicePackages.length > 0;
  const canSubmit = hasRegionOptions && hasServicePackageOptions && !saving;

  // Real-time coordinates check for shareLocationUrl
  const parsedCoords = useMemo(() => extractCoordinatesFromUrl(form.shareLocationUrl), [form.shareLocationUrl]);

  useEffect(() => {
    if (!housePhotoFile) {
      setHousePhotoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(housePhotoFile);
    setHousePhotoPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [housePhotoFile]);

  const handleChange = (key: keyof RegistrationFormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleRegionChange = (value: string) => {
    setForm((current) => ({ ...current, region: value }));
  };

  const handlePackageChange = (value: string) => {
    const nextPackage = servicePackages.find((item) => item.name === value) ?? null;

    setForm((current) => ({
      ...current,
      packagePlan: value,
      monthlyFee: nextPackage ? String(nextPackage.monthlyFee) : '',
    }));
  };

  const handleHousePhotoChange = (file: File | null) => {
    setHousePhotoFile(file);
  };

  const startEditRejected = (item: ServiceRegistration) => {
    setEditingItem(item);
    setForm({
      name: item.name ?? '',
      nik: item.nik ?? '',
      gender: item.gender ?? 'Laki-laki',
      phone: item.phone ?? '',
      address: item.address ?? '',
      region: item.region ?? '',
      packagePlan: item.packagePlan ?? '',
      monthlyFee: String(item.monthlyFee ?? ''),
      installationFee: String(item.installationFee ?? 0),
      shareLocationUrl: item.shareLocationUrl ?? '',
    });
    setHousePhotoFile(null);
    setHousePhotoPreview(item.housePhoto ?? null);
    setError(null);
    setSuccess(null);

    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setHousePhotoFile(null);
    setHousePhotoPreview(null);
    if (housePhotoInputRef.current) {
      housePhotoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = new FormData();
      payload.set('name', form.name);
      payload.set('nik', form.nik);
      payload.set('gender', form.gender);
      payload.set('phone', form.phone);
      payload.set('address', form.address);
      payload.set('region', form.region);
      payload.set('package_plan', form.packagePlan);
      payload.set('monthly_fee', String(Number(form.monthlyFee) || 0));
      payload.set('installation_fee', String(Number(form.installationFee) || 0));
      payload.set('entry_source', 'internal');

      if (form.shareLocationUrl) {
        payload.set('share_location_url', form.shareLocationUrl);
      }

      if (housePhotoFile) {
        payload.set('house_photo', housePhotoFile);
      }

      if (editingItem) {
        // Update and resubmit the rejected/needs_revision registration
        payload.set('resubmit', '1');
        await authFetch(`/service-registrations/${editingItem.id}/update`, {
          method: 'POST',
          body: payload,
        });

        setSuccess(`Registrasi ${editingItem.id} berhasil diperbaiki dan dikirim ulang ke antrean validasi.`);
        setEditingItem(null);
      } else {
        // Create brand new registration and submit to validation
        const created = await authFetch<{ data: ServiceRegistration }>('/service-registrations', {
          method: 'POST',
          body: payload,
        });

        await authFetch(`/service-registrations/${created.data.id}/submit`, { method: 'POST' });
        setSuccess(`Registrasi ${created.data.id} berhasil dibuat dan dikirim ke validasi awal.`);
      }

      setForm(emptyForm);
      setHousePhotoFile(null);
      setHousePhotoPreview(null);
      if (housePhotoInputRef.current) {
        housePhotoInputRef.current.value = '';
      }
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan registrasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Internal Only</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Registrasi Pelanggan Baru</h1>
            <p className="mt-1 text-sm text-slate-600">Pendaftaran pelanggan baru, input titik koordinat Google Maps, dan perbaikan berkas registrasi.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Data
          </button>
        </div>
      </section>

      {/* SECTION: Registrasi Perlu Perbaikan / Ditolak Validasi */}
      {rejectedItems.length > 0 && (
        <section className="rounded-[30px] border border-amber-300 bg-amber-50/70 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-amber-950">
                  Registrasi Perlu Perbaikan ({rejectedItems.length})
                </h2>
                <p className="text-xs text-amber-800">
                  Registrasi berikut dikembalikan oleh tim validasi karena memerlukan kelengkapan data. Klik tombol perbaiki untuk melengkapi dan mengirim ulang.
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-200/80 px-3 py-1 text-xs font-bold text-amber-900">
              Antrean Revisi
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rejectedItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition ${
                  editingItem?.id === item.id ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                      {item.id}
                    </span>
                    <h3 className="mt-1 text-base font-bold text-slate-900">{item.name}</h3>
                    <div className="mt-0.5 text-xs text-slate-500">{item.packagePlan} • {item.region}</div>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700">
                    Perlu Revisi
                  </span>
                </div>

                {/* Validation Note Banner */}
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    Catatan Tim Validasi:
                  </div>
                  <div className="mt-1 text-amber-800 leading-relaxed font-medium">
                    {item.validationNotes || 'Data perlu dilengkapi kembali sesuai SOP registrasi.'}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {item.phone}
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditRejected(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-600 shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    {editingItem?.id === item.id ? 'Sedang Diedit' : 'Perbaiki Data'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid: Form Left, Recent Registrations Right */}
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${
                editingItem ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {editingItem ? <Edit3 className="h-5 w-5" /> : <ClipboardPlus className="h-5 w-5" />}
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  {editingItem ? `Perbaikan Registrasi: ${editingItem.id}` : 'Form Registrasi Internal'}
                </h2>
                <p className="text-xs text-slate-500">
                  {editingItem
                    ? 'Perbaiki data yang kurang sesuai catatan validator, lalu simpan & kirim ulang.'
                    : 'Input identitas calon pelanggan, paket layanan, dan titik lokasi koordinat.'}
                </p>
              </div>
            </div>

            {editingItem && (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="h-3.5 w-3.5" />
                Batal Perbaikan
              </button>
            )}
          </div>

          {/* Banner Active Revision */}
          {editingItem && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Revisi Diminta:
              </div>
              <p className="font-medium text-amber-800 pl-5 leading-relaxed">
                {editingItem.validationNotes || 'Lengkapi data pelanggan yang belum sesuai.'}
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['name', 'Nama Pelanggan', 'Contoh: Ahmad Fauzi'],
              ['nik', 'NIK (16 Digit)', 'Contoh: 3515082405891001'],
              ['phone', 'Nomor HP / WhatsApp', 'Contoh: 081234567890'],
            ].map(([key, label, placeholder]) => (
              <label key={key} className="space-y-2 text-sm font-semibold text-slate-700">
                <span>{label}</span>
                <input
                  value={form[key as keyof RegistrationFormState]}
                  onChange={(event) => handleChange(key as keyof RegistrationFormState, event.target.value)}
                  placeholder={placeholder}
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                  required
                />
              </label>
            ))}

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Jenis Kelamin</span>
              <select
                value={form.gender}
                onChange={(event) => handleChange('gender', event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Wilayah</span>
              <select
                value={form.region}
                onChange={(event) => handleRegionChange(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
                disabled={!hasRegionOptions}
              >
                <option value="">{hasRegionOptions ? 'Pilih wilayah' : 'Master wilayah belum tersedia'}</option>
                {regions.map((region) => (
                  <option key={region.name} value={region.name}>{region.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Paket Layanan</span>
              <select
                value={form.packagePlan}
                onChange={(event) => handlePackageChange(event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
                disabled={!hasServicePackageOptions}
              >
                <option value="">{hasServicePackageOptions ? 'Pilih paket layanan' : 'Master paket belum tersedia'}</option>
                {servicePackages.map((servicePackage) => (
                  <option key={servicePackage.name} value={servicePackage.name}>{servicePackage.name}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Biaya Bulanan</span>
              <input
                value={selectedPackage ? `Rp ${selectedPackage.monthlyFee.toLocaleString('id-ID')}` : ''}
                readOnly
                disabled
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none"
                placeholder="Otomatis mengikuti paket"
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Biaya Pemasangan (Rp)</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={form.installationFee}
                onChange={(event) => handleChange('installationFee', event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                placeholder="Contoh: 150000"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Alamat Lengkap</span>
              <textarea
                value={form.address}
                onChange={(event) => handleChange('address', event.target.value)}
                placeholder="Contoh: Jl. Pahlawan No. 45, RT 02/RW 03, Kelurahan Sidokare"
                className="min-h-[100px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            {/* Google Maps Share Location Input with Coordinate Detection */}
            <div className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <label className="block space-y-1">
                <span>Share Location URL / Titik Koordinat Google Maps</span>
                <input
                  value={form.shareLocationUrl}
                  onChange={(event) => handleChange('shareLocationUrl', event.target.value)}
                  placeholder="https://www.google.com/maps/@-5.7311232,105.5979851,13z... atau -5.7311232, 105.5979851"
                  className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {/* Coordinate Extraction Badge & Route Preview */}
              {parsedCoords ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>
                      Koordinat Terdeteksi: <strong className="font-mono font-bold">{parsedCoords.lat.toFixed(6)}, {parsedCoords.lng.toFixed(6)}</strong>
                    </span>
                  </div>
                  <a
                    href={getGoogleMapsDirectionUrl(parsedCoords.lat, parsedCoords.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Cek Rute Navigasi
                  </a>
                </div>
              ) : form.shareLocationUrl ? (
                <div className="text-xs text-slate-500 italic pl-1">
                  Format link Google Maps tercatat.
                </div>
              ) : null}
            </div>

            {/* Photo Upload */}
            <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
              <span>Foto Depan Rumah</span>
              <input
                ref={housePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleHousePhotoChange(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="text-xs text-slate-500">
                Opsional. Upload foto depan rumah format JPG, PNG, atau WEBP (maks 5 MB).
              </div>
              {housePhotoPreview && (
                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">
                    {housePhotoFile ? `File baru: ${housePhotoFile.name}` : 'Foto rumah saat ini'}
                  </div>
                  <img
                    src={housePhotoPreview}
                    alt="Preview foto depan rumah"
                    className="mt-2 h-40 w-full rounded-xl object-cover border border-slate-200"
                  />
                </div>
              )}
            </label>
          </div>

          {(!hasRegionOptions || !hasServicePackageOptions) && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Master wilayah dan paket layanan belum tersedia. Lengkapi data di Master Data terlebih dahulu.
            </div>
          )}

          {(error || success) && (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm flex items-center gap-2 ${
              error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {error ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
              <span>{error ?? success}</span>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {editingItem ? 'Perbaikan oleh' : 'Disubmit oleh'}{' '}
              <span className="font-bold text-slate-700">{user?.name ?? 'User aktif'}</span>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
                editingItem ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-950 hover:bg-slate-800'
              }`}
            >
              <Send className="h-4 w-4" />
              {saving
                ? 'Menyimpan...'
                : editingItem
                ? 'Simpan Perbaikan & Kirim Ulang ke Validasi'
                : 'Simpan & Kirim ke Validasi'}
            </button>
          </div>
        </form>

        {/* Right Column: Registrasi Terbaru (Maksimal 5) */}
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-slate-900">Registrasi Terbaru</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                5 Terakhir
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Daftar registrasi pelanggan yang baru saja didaftarkan.</p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Memuat registrasi...
              </div>
            ) : recentItems.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Belum ada registrasi baru yang tersimpan.
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {recentItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{item.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500 font-mono">{item.id} • {item.packagePlan}</div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {item.phone}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {item.region}</div>
                      <div className="font-semibold text-emerald-700">Biaya pasang: Rp {(item.installationFee ?? 0).toLocaleString('id-ID')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 text-xs text-slate-400 text-center border-t border-slate-100 pt-4">
            Total seluruh registrasi tercatat: <strong className="text-slate-700 font-bold">{items.length}</strong>
          </div>
        </div>
      </section>
    </div>
  );
};

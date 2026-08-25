import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardPlus, MapPin, Phone, RefreshCcw, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MasterDataGroup, ServiceRegistration } from '../../types';

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

  const recentItems = useMemo(
    () => items.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')).slice(0, 8),
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
      payload.set('monthly_fee', String(Number(form.monthlyFee)));
      payload.set('installation_fee', String(Number(form.installationFee)));
      payload.set('entry_source', 'internal');

      if (form.shareLocationUrl) {
        payload.set('share_location_url', form.shareLocationUrl);
      }

      if (housePhotoFile) {
        payload.set('house_photo', housePhotoFile);
      }

      const created = await authFetch<{ data: ServiceRegistration }>('/service-registrations', {
        method: 'POST',
        body: payload,
      });

      await authFetch(`/service-registrations/${created.data.id}/submit`, { method: 'POST' });
      setForm(emptyForm);
      setHousePhotoFile(null);
      if (housePhotoInputRef.current) {
        housePhotoInputRef.current.value = '';
      }
      setSuccess(`Registrasi ${created.data.id} berhasil dibuat dan dikirim ke validasi awal.`);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan registrasi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Internal Only</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Registrasi Pelanggan Baru</h1>
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ClipboardPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Form Registrasi Internal</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ['name', 'Nama Pelanggan'],
              ['nik', 'NIK'],
              ['phone', 'Nomor HP / WhatsApp'],
            ].map(([key, label]) => (
              <label key={key} className="space-y-2 text-sm font-semibold text-slate-700">
                <span>{label}</span>
                <input
                  value={form[key as keyof RegistrationFormState]}
                  onChange={(event) => handleChange(key as keyof RegistrationFormState, event.target.value)}
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
              <span>Paket</span>
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
              <span>Biaya Pemasangan</span>
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
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Share Location URL</span>
              <input
                value={form.shareLocationUrl}
                onChange={(event) => handleChange('shareLocationUrl', event.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold text-slate-700">
              <span>Foto Depan Rumah</span>
              <input
                ref={housePhotoInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => handleHousePhotoChange(event.target.files?.[0] ?? null)}
                className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-700 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />
              <div className="text-xs text-slate-500">
                Opsional. Upload 1 foto rumah depan format JPG, PNG, atau WEBP dengan ukuran maksimal 5 MB.
              </div>
              {housePhotoFile && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600">File terpilih</div>
                  <div className="mt-1 text-sm text-slate-800">{housePhotoFile.name}</div>
                  {housePhotoPreview && (
                    <img
                      src={housePhotoPreview}
                      alt="Preview foto depan rumah"
                      className="mt-3 h-40 w-full rounded-2xl object-cover"
                    />
                  )}
                </div>
              )}
            </label>
          </div>

          {(!hasRegionOptions || !hasServicePackageOptions) && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {!hasRegionOptions && !hasServicePackageOptions
                ? 'Master wilayah dan paket layanan belum tersedia. Lengkapi data di Master Data terlebih dahulu.'
                : !hasRegionOptions
                ? 'Master wilayah belum tersedia. Lengkapi data di Master Data terlebih dahulu.'
                : 'Master paket layanan belum tersedia. Lengkapi data di Master Data terlebih dahulu.'}
            </div>
          )}

          {(error || success) && (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
              error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
              {error ?? success}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              Disubmit oleh <span className="font-semibold text-slate-700">{user?.name ?? 'User aktif'}</span>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {saving ? 'Menyimpan...' : 'Simpan & Kirim ke Validasi'}
            </button>
          </div>
        </form>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight text-slate-900">Registrasi Terbaru</h2>

          {loading ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Memuat registrasi...
            </div>
          ) : recentItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              Belum ada registrasi baru yang tersimpan.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recentItems.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.id} • {item.packagePlan}</div>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <div className="text-sm text-slate-600">Jenis kelamin: {item.gender}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {item.phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {item.region}</div>
                    <div className="text-sm font-semibold text-emerald-700">Biaya pemasangan: Rp {(item.installationFee ?? 0).toLocaleString('id-ID')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

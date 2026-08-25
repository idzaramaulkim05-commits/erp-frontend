import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCcw, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ServiceRegistration } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

interface ValidationConfirmationState {
  registrationId: string;
  registrationName: string;
  isValid: boolean;
}

const maskNik = (nik?: string | null) => {
  const normalizedNik = (nik ?? '').trim();

  if (normalizedNik.length === 0) {
    return 'Belum diisi';
  }

  if (normalizedNik.length <= 3) {
    return 'X'.repeat(normalizedNik.length);
  }

  if (normalizedNik.length <= 6) {
    return `${normalizedNik.slice(0, 1)}${'X'.repeat(Math.max(normalizedNik.length - 2, 1))}${normalizedNik.slice(-1)}`;
  }

  return `${normalizedNik.slice(0, 3)}${'X'.repeat(normalizedNik.length - 6)}${normalizedNik.slice(-3)}`;
};

export const ValidasiRegistrasiView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<ServiceRegistration[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<ValidationConfirmationState | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: ServiceRegistration[] }>('/service-registrations');
      setItems(response.data);
      setImageErrors({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat data validasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const queue = useMemo(
    () => items.filter((item) => ['menunggu_validasi', 'perlu_perbaikan_data', 'draft'].includes(item.status)),
    [items],
  );

  const submitDecision = async (registrationId: string, isValid: boolean) => {
    setSubmittingId(registrationId);
    setError(null);
    try {
      await authFetch(`/service-registrations/${registrationId}/validate`, {
        method: 'POST',
        body: JSON.stringify({
          is_valid: isValid,
          notes: notes[registrationId] || null,
        }),
      });
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Gagal menyimpan validasi.');
    } finally {
      setSubmittingId(null);
    }
  };

  const confirmationMessage = confirmationState
    ? confirmationState.isValid
      ? `Registrasi ${confirmationState.registrationName} (${confirmationState.registrationId}) akan dilanjutkan ke tahap survey instalasi. Pastikan data pelanggan sudah lengkap sebelum melanjutkan.`
      : `Registrasi ${confirmationState.registrationName} (${confirmationState.registrationId}) akan dikembalikan ke antrean perbaikan data. Pastikan catatan revisi sudah jelas agar tindak lanjut tidak salah.`
    : '';

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-700">Tahap 2</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Validasi Registrasi</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Antrean
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Memuat antrean validasi...
        </div>
      ) : queue.length === 0 ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-500">
          Tidak ada registrasi yang menunggu validasi saat ini.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {queue.map((item) => (
            <div key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.id} • {item.packagePlan} • {item.region}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700">
                  {item.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div><span className="font-semibold text-slate-800">NIK:</span> {maskNik(item.nik)}</div>
                <div><span className="font-semibold text-slate-800">HP:</span> {item.phone}</div>
                <div><span className="font-semibold text-slate-800">Alamat:</span> {item.address}</div>
                <div><span className="font-semibold text-slate-800">Biaya Bulanan:</span> Rp {item.monthlyFee.toLocaleString('id-ID')}</div>
                <div><span className="font-semibold text-slate-800">Biaya Pemasangan:</span> Rp {(item.installationFee ?? 0).toLocaleString('id-ID')}</div>
                <div><span className="font-semibold text-slate-800">Share Location:</span> {item.shareLocationUrl || 'Belum diisi'}</div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">Foto Depan Rumah</div>
                {item.housePhoto && !imageErrors[item.id] ? (
                  <a
                    href={item.housePhoto}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-200"
                  >
                    <img
                      src={item.housePhoto}
                      alt={`Foto depan rumah ${item.name}`}
                      className="h-52 w-full object-cover"
                      onError={() => setImageErrors((current) => ({ ...current, [item.id]: true }))}
                    />
                  </a>
                ) : (
                  <div className="mt-3 flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 text-center text-sm text-slate-500">
                    {item.housePhoto
                      ? 'Foto pelanggan gagal dimuat. Periksa file upload atau URL storage.'
                      : 'Foto depan rumah belum diupload.'}
                  </div>
                )}
              </div>

              <textarea
                value={notes[item.id] ?? ''}
                onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                placeholder="Catatan validasi / alasan revisi data..."
                className="mt-4 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={submittingId === item.id}
                  onClick={() => setConfirmationState({
                    registrationId: item.id,
                    registrationName: item.name,
                    isValid: true,
                  })}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Lanjut ke Survey
                </button>
                <button
                  type="button"
                  disabled={submittingId === item.id}
                  onClick={() => setConfirmationState({
                    registrationId: item.id,
                    registrationName: item.name,
                    isValid: false,
                  })}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Kembalikan untuk Perbaikan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmActionModal
        open={confirmationState !== null}
        title={confirmationState?.isValid ? 'Konfirmasi Lanjut ke Survey' : 'Konfirmasi Kembalikan untuk Perbaikan'}
        message={confirmationMessage}
        confirmLabel={confirmationState?.isValid ? 'Ya, Lanjutkan' : 'Ya, Kembalikan'}
        tone={confirmationState?.isValid ? 'success' : 'warning'}
        loading={submittingId === confirmationState?.registrationId}
        onCancel={() => setConfirmationState(null)}
        onConfirm={() => {
          if (!confirmationState) return;
          void submitDecision(confirmationState.registrationId, confirmationState.isValid).finally(() => {
            setConfirmationState(null);
          });
        }}
      />
    </div>
  );
};

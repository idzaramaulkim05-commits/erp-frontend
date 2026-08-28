import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Lock,
  Camera,
  Check,
  ShieldCheck,
  Building2,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  LoaderCircle,
  Calendar,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
];

export const PengaturanProfilView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useIOMS();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword) {
      if (!currentPassword) {
        setErrorMsg('Harap masukkan kata sandi saat ini untuk mengganti kata sandi.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Kata sandi baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await updateProfile({
        name,
        phone,
        avatar,
        ...(newPassword ? { current_password: currentPassword, new_password: newPassword } : {}),
      });

      addNotification({
        type: 'success',
        title: 'Profil Berhasil Disimpan',
        message: 'Informasi akun Anda telah berhasil diperbarui.',
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 border border-emerald-200">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  Akun Pribadi
                </span>
                <span className="text-xs text-slate-500">{user.division}</span>
              </div>
              <h1 className="text-xl font-black text-slate-950 mt-1">Pengaturan Profil & Keamanan</h1>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identitas & Avatar */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            <span>Foto & Identitas Pengguna</span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl bg-slate-50 p-5 border border-slate-100">
            <div className="relative group shrink-0">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={name}
                className="h-24 w-24 rounded-3xl object-cover ring-4 ring-emerald-400/40 shadow-lg"
              />
              <label className="absolute inset-0 flex items-center justify-center rounded-3xl bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Camera className="h-6 w-6" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h3 className="font-extrabold text-slate-950 text-base">{user.name}</h3>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Building2 className="h-3.5 w-3.5" /> {user.division} &bull; <strong className="text-slate-700">{user.roleTitle}</strong>
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1.5 font-semibold">
                  Pilih avatar siap pakai:
                </span>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`relative h-8 w-8 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        avatar === preset ? 'border-emerald-500 scale-110 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="preset" className="h-full w-full object-cover" />
                      {avatar === preset && (
                        <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Nomor Telepon / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Email Akun (Terkunci)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Peranan / Role</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={user.roleTitle}
                  className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Keamanan & Password */}
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>Ganti Kata Sandi (Password)</span>
          </h2>

          <p className="text-xs text-slate-500">
            Kosongkan form kata sandi di bawah ini jika Anda tidak bermaksud mengganti kata sandi.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Kata Sandi Saat Ini</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Password lama"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Kata Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Konfirmasi Sandi Baru</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit button bar */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-md disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Menyimpan Perubahan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Simpan Semua Pengaturan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  X,
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { addNotification } = useIOMS();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
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
    if (user && isOpen) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

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
        setErrorMsg('Harap masukkan password saat ini untuk mengganti password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Password baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi password baru tidak cocok.');
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
        message: 'Data profil akun Anda telah diperbarui.',
      });

      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memperbarui profil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Pengaturan Profil & Keamanan Akun</h3>
              <p className="text-[11px] text-slate-400">Kelola identitas, foto profil, dan kata sandi login</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/75 px-6 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Informasi Pribadi & Foto
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-xs font-bold transition border-b-2 cursor-pointer ${
              activeTab === 'security'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Keamanan & Ganti Sandi
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {activeTab === 'profile' ? (
            <>
              {/* Avatar section */}
              <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="relative group shrink-0">
                  <img
                    src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={name}
                    className="h-20 w-20 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-md"
                  />
                  <label className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/60 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <Building2 className="h-3 w-3" /> {user.division} ({user.roleTitle})
                    </p>
                  </div>

                  {/* Preset Avatar Selection */}
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1.5 font-semibold">
                      Atau pilih avatar siap pakai:
                    </span>
                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`relative h-7 w-7 rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                            avatar === preset ? 'border-emerald-500 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt="preset" className="h-full w-full object-cover" />
                          {avatar === preset && (
                            <div className="absolute inset-0 bg-emerald-500/40 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal info form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap Anda"
                      className="w-full rounded-xl border border-slate-200 pl-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Nomor Telepon / WhatsApp</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08123456789"
                        className="w-full rounded-xl border border-slate-200 pl-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Email Akun (Read-only)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        disabled
                        value={user.email}
                        className="w-full rounded-xl border border-slate-200 pl-9 p-2.5 text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Readonly Identity summary */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Role Akses: <strong className="text-slate-800">{user.roleTitle}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>Status: Akun Aktif</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Security tab */}
              <div className="space-y-3.5">
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-800 flex items-start gap-2">
                  <Lock className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Untuk menjaga keamanan sistem, gunakan kata sandi yang kuat dengan kombinasi huruf dan angka. Kosongkan form jika Anda tidak ingin mengganti kata sandi.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Kata Sandi Saat Ini</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi saat ini"
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Kata Sandi Baru</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full rounded-xl border border-slate-200 pl-9 pr-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
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

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 block">Konfirmasi Sandi Baru</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi baru"
                        className="w-full rounded-xl border border-slate-200 pl-9 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

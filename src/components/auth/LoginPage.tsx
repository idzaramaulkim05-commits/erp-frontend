import React, { useState } from 'react';
import { KeyRound, Mail, Shield, Wifi, LoaderCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, forgotPassword, status, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await login(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotError(null);
    setForgotMessage(null);
    try {
      const message = await forgotPassword(forgotEmail);
      setForgotMessage(message);
    } catch (forgotPasswordError) {
      setForgotError(forgotPasswordError instanceof Error ? forgotPasswordError.message : 'Gagal mengirim reset password.');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#d1fae5,_transparent_35%),linear-gradient(135deg,#f8fafc,#ecfeff_35%,#f8fafc_70%)] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] bg-white/90 backdrop-blur rounded-[32px] shadow-[0_30px_100px_rgba(15,23,42,0.15)] border border-white">
        <section className="hidden lg:flex flex-col justify-between bg-slate-950 text-white rounded-l-[32px] p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.35),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.25),_transparent_35%)]" />
          <div className="relative space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Wifi className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-emerald-300 font-semibold">Internal Operations</p>
              <h1 className="text-4xl font-black tracking-tight mt-3">IOMS Production Access</h1>
              <p className="mt-4 text-slate-300 max-w-lg leading-relaxed">
                Akses sistem operasional internal ISP untuk helpdesk, NOC, finance, gudang, dan manajemen.
              </p>
            </div>
          </div>
          <div className="relative grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <Shield className="w-5 h-5 text-emerald-300 mb-3" />
              <p className="text-sm font-bold">RBAC Terkontrol</p>
              <p className="text-xs text-slate-400 mt-1">Hak akses modul dan aksi sensitif dibatasi per divisi.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <KeyRound className="w-5 h-5 text-sky-300 mb-3" />
              <p className="text-sm font-bold">Session Aman</p>
              <p className="text-xs text-slate-400 mt-1">Login berbasis token dan sesi invalid akan diarahkan ulang.</p>
            </div>
          </div>
        </section>

        <section className="p-6 sm:p-10 lg:p-12">
          <div className="max-w-md mx-auto">
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-700 font-semibold">Internal Ops</p>
                <h1 className="text-xl font-black text-slate-900">IOMS Login</h1>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-semibold">Secure Sign In</p>
              <h2 className="text-3xl font-black text-slate-950 mt-3">Masuk ke dashboard produksi</h2>
              <p className="text-sm text-slate-500 mt-3">Gunakan email perusahaan dan password akun operasional Anda.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 mb-2 block">Email</span>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    placeholder="nama@perusahaan.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700 mb-2 block">Password</span>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                    placeholder="Masukkan password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || status === 'loading'}
                className="w-full rounded-2xl bg-slate-950 hover:bg-slate-900 disabled:opacity-70 text-white font-bold py-3.5 transition-colors flex items-center justify-center gap-2"
              >
                {(isSubmitting || status === 'loading') ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                <span>Masuk ke Sistem</span>
              </button>
            </form>

            <div className="mt-5">
              <button
                onClick={() => setShowForgot((value) => !value)}
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Lupa password?
              </button>
            </div>

            {showForgot && (
              <form onSubmit={handleForgotPassword} className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 mb-2 block">Email akun</span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="nama@perusahaan.com"
                  />
                </label>
                {forgotMessage && <div className="text-sm text-emerald-700">{forgotMessage}</div>}
                {forgotError && <div className="text-sm text-rose-700">{forgotError}</div>}
                <button type="submit" className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 text-sm">
                  Kirim link reset
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

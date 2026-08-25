import React from 'react';
import { BadgeCheck, BadgeInfo, Route, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useIOMS } from '../../context/IOMSContext';

const DebugRow: React.FC<{
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
}> = ({ label, value, tone = 'default' }) => {
  const toneClass = tone === 'success'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : tone === 'warning'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className={`inline-flex w-fit max-w-full rounded-xl border px-3 py-2 text-sm font-semibold ${toneClass}`}>
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
};

export const AboutView: React.FC = () => {
  const location = useLocation();
  const {
    currentUser,
    activeRole,
    selectedModule,
    navigationConfig,
  } = useIOMS();

  const allowedModuleKeys = navigationConfig?.allowedModuleKeys ?? [];
  const isAboutMapped = allowedModuleKeys.includes('about');
  const aboutModule = navigationConfig?.modules.find((module) => module.key === 'about') ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-6 py-8 text-white sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-100">
            <BadgeInfo className="h-3.5 w-3.5" />
            Modul Uji Mapping
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight">
            About
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/90 sm:text-base">
            Halaman ini dipakai untuk memverifikasi alur Master Data Modul, Modul To Role, navbar, dan route frontend
            sudah terhubung dengan benar pada runtime aplikasi.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DebugRow label="Role Login Aktif" value={String(activeRole)} />
        <DebugRow label="User Login" value={`${currentUser.name} • ${currentUser.email}`} />
        <DebugRow label="Route Aktif" value={location.pathname} />
        <DebugRow label="Module Key Aktif" value={selectedModule} />
        <DebugRow
          label="Status Mapping About"
          value={isAboutMapped ? 'about sudah ada di allowedModuleKeys runtime' : 'about belum ada di allowedModuleKeys runtime'}
          tone={isAboutMapped ? 'success' : 'warning'}
        />
        <DebugRow
          label="Sumber Kontrol Visibilitas"
          value="Master Data Modul + Modul To Role"
          tone="default"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Allowed Module Keys Runtime</h2>
              <p className="text-sm text-slate-500">Data ini datang dari payload navigasi backend untuk sesi login aktif.</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {allowedModuleKeys.length > 0 ? allowedModuleKeys.map((moduleKey) => (
              <span
                key={moduleKey}
                className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold ${
                  moduleKey === 'about'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                {moduleKey}
              </span>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                Tidak ada module key yang masuk runtime untuk role ini. Jika memang belum dimapping, navbar seharusnya tetap kosong.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Route className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Status Modul About</h2>
              <p className="text-sm text-slate-500">Ringkasan apakah modul ini sudah ikut terbaca pada payload navigasi.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Module Key</div>
              <div className="mt-2 font-semibold text-slate-900">about</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Route Target</div>
              <div className="mt-2 font-semibold text-slate-900">/app/about</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Payload Backend</div>
              <div className="mt-2 font-semibold text-slate-900">
                {aboutModule ? `${aboutModule.label} • ${aboutModule.routeTarget}` : 'Belum muncul di navigation payload aktif'}
              </div>
            </div>
            <div className={`rounded-2xl border p-4 ${
              isAboutMapped ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-6">
                  Setelah link ini didaftarkan di Master Data Modul dan Anda mapping role-nya di Modul To Role, menu
                  <span className="font-bold"> About </span>
                  akan muncul otomatis di navbar untuk role yang sesuai.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

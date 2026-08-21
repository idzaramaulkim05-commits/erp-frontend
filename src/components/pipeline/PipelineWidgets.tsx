import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Layers3, type LucideIcon } from 'lucide-react';
import { PipelineActionState, PipelineRoleDashboardSection, PipelineStageItem, ServiceRegistration } from '../../types';

export const WorkspaceSummaryCard: React.FC<{
  label: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  accentClass: string;
}> = ({ label, value, description, icon: Icon, accentClass }) => (
  <div className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-xs">
    <div className={`inline-flex rounded-2xl p-2.5 ${accentClass}`}>
      <Icon className="h-4 w-4" />
    </div>
    <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-1 text-3xl font-black text-white">{value}</p>
    <p className="mt-1 text-xs text-slate-300">{description}</p>
  </div>
);

export const WorkspaceOpsHero: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string | number; description: string; icon: LucideIcon; accentClass: string }>;
}> = ({ eyebrow, title, subtitle, stats }) => (
  <section className="rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
    <div className="grid gap-6 xl:grid-cols-[1.15fr,0.95fr] xl:items-end">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200">
          <Layers3 className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm text-slate-300">{subtitle}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
        {stats.map((stat) => (
          <WorkspaceSummaryCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  </section>
);

export const WorkspaceSectionShell: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ eyebrow, title, subtitle, badge, actions, children }) => (
  <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
    <div className="border-b border-slate-100 px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {badge && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {badge}
            </span>
          )}
          {actions}
        </div>
      </div>
    </div>
    <div>{children}</div>
  </section>
);

export const WorkspaceStatusPill: React.FC<{
  label: string;
  tone?: 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';
}> = ({ label, tone = 'slate' }) => {
  const toneClass =
    tone === 'emerald'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : tone === 'rose'
      ? 'bg-rose-100 text-rose-800'
      : tone === 'sky'
      ? 'bg-sky-100 text-sky-800'
      : tone === 'violet'
      ? 'bg-violet-100 text-violet-800'
      : 'bg-slate-100 text-slate-800';

  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${toneClass}`}>{label}</span>;
};

export const PipelineRoleSummary: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  summaryStats: Array<{ label: string; value: number; icon: LucideIcon; accentClass: string }>;
  cta?: {
    label: string;
    onClick: () => void;
  };
}> = ({ eyebrow, title, subtitle, summaryStats, cta }) => (
  <section className="rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
    <div className="grid gap-6 xl:grid-cols-[1.2fr,0.9fr] xl:items-end">
      <div className="space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-200">
          <Layers3 className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
          <p className="max-w-2xl text-sm text-slate-300">{subtitle}</p>
        </div>
        {cta && (
          <button
            type="button"
            onClick={cta.onClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-50"
          >
            <ArrowRight className="h-4 w-4 text-emerald-600" />
            {cta.label}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/6 p-4 backdrop-blur-xs">
              <div className={`inline-flex rounded-2xl p-2.5 ${stat.accentClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export const PipelineStageBoard: React.FC<{
  stages: PipelineStageItem[];
  activeFilter: 'all' | string;
  onSelect: (stageId: string) => void;
}> = ({ stages, activeFilter, onSelect }) => (
  <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">Stage Board</p>
        <h2 className="mt-1 text-lg font-black text-slate-950">Pipeline per tahap</h2>
      </div>
      <button
        type="button"
        onClick={() => onSelect('all')}
        className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
          activeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Semua Tahap
      </button>
    </div>

    <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {stages.map((stage) => (
        <button
          key={stage.id}
          type="button"
          onClick={() => onSelect(stage.id)}
          className={`rounded-[26px] border p-4 text-left transition-all ${
            activeFilter === stage.id
              ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/10'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-slate-950">{stage.label}</p>
              <p className="mt-1 text-xs text-slate-500">{stage.description}</p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${stage.accentClass}`}>
              {stage.count}
            </span>
          </div>
        </button>
      ))}
    </div>
  </section>
);

export const PipelineStageCard: React.FC<{
  registration: ServiceRegistration;
  statusLabel: string;
  actionSlot?: React.ReactNode;
}> = ({ registration, statusLabel, actionSlot }) => (
  <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">
          {registration.id}
        </span>
        <h3 className="mt-3 text-base font-black text-slate-950">{registration.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{registration.address}</p>
      </div>
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        {statusLabel}
      </span>
    </div>

    <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
      <div className="rounded-2xl bg-slate-50 px-3 py-2">
        <span className="font-bold text-slate-700">Paket:</span> {registration.packagePlan}
      </div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2">
        <span className="font-bold text-slate-700">ODP:</span> {registration.odpId}
      </div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2">
        <span className="font-bold text-slate-700">Telepon:</span> {registration.phone}
      </div>
      <div className="rounded-2xl bg-slate-50 px-3 py-2">
        <span className="font-bold text-slate-700">Biaya:</span> Rp {registration.monthlyFee.toLocaleString('id-ID')}
      </div>
    </div>

    {actionSlot && <div className="mt-4">{actionSlot}</div>}
  </div>
);

export const PipelineActionPanel: React.FC<{
  title: string;
  note?: string;
  actions: Array<{
    key: string;
    state: PipelineActionState;
    onClick?: () => void;
  }>;
}> = ({ title, note, actions }) => (
  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-black text-slate-950">{title}</p>
        {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      </div>
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {actions.map((action) => {
        const toneClass =
          action.state.tone === 'success'
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : action.state.tone === 'danger'
            ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            : action.state.tone === 'muted'
            ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            : 'bg-slate-900 text-white hover:bg-slate-800';

        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            disabled={action.state.disabled}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
          >
            {action.state.label}
          </button>
        );
      })}
    </div>
  </div>
);

export const PipelineSecondarySection: React.FC<{
  title: string;
  description: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  icon?: LucideIcon;
  children: React.ReactNode;
}> = ({ title, description, ctaLabel, onCtaClick, icon: Icon = Clock3, children }) => (
  <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
          <Icon className="h-3.5 w-3.5" />
          Panel Pendukung
        </div>
        <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {ctaLabel && onCtaClick && (
        <button
          type="button"
          onClick={onCtaClick}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4 text-emerald-600" />
        </button>
      )}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

export const PipelineSectionGrid: React.FC<{
  sections: PipelineRoleDashboardSection[];
  statusLabels: Record<string, string>;
  renderActionSlot?: (registration: ServiceRegistration) => React.ReactNode;
}> = ({ sections, statusLabels, renderActionSlot }) => (
  <section className="space-y-4">
    {sections.map((section) => (
      <div key={section.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{section.title}</p>
            <p className="mt-1 text-sm text-slate-500">{section.description}</p>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
            {section.items.length}
          </span>
        </div>

        {section.items.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            Tidak ada item pada stage ini.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            {section.items.map((registration) => (
              <PipelineStageCard
                key={registration.id}
                registration={registration}
                statusLabel={statusLabels[registration.status] ?? registration.status}
                actionSlot={renderActionSlot?.(registration)}
              />
            ))}
          </div>
        )}
      </div>
    ))}
  </section>
);

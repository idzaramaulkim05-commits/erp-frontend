import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  Network,
  Search,
  ShieldCheck,
  UserRoundPlus,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ServiceRegistration, UserRole } from '../../types';

const statusLabels: Record<ServiceRegistration['status'], string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_finance: 'Menunggu Finance',
  finance_approved: 'Finance Approved',
  finance_rejected: 'Finance Rejected',
  pending_noc: 'Menunggu NOC',
  noc_approved: 'NOC Approved',
  noc_rejected: 'NOC Rejected',
  ready_for_dispatch: 'Siap Dispatch',
  field_in_progress: 'Field Progress',
  field_submitted: 'Laporan Masuk',
  noc_final_verifying: 'Final Verify NOC',
  completed: 'Selesai',
  cancelled: 'Cancelled',
};

const roleHeadlines: Record<UserRole, { title: string; subtitle: string }> = {
  superadmin: {
    title: 'Pipeline Registrasi Lintas Divisi',
    subtitle: 'Kontrol penuh terhadap antrean sales, finance, NOC, dan dispatch instalasi baru.',
  },
  management: {
    title: 'Pipeline Registrasi',
    subtitle: 'Ringkasan jalur registrasi baru.',
  },
  sales: {
    title: 'Sales Acquisition Pipeline',
    subtitle: 'Input prospek pelanggan baru dan kirim registrasi ke finance untuk diproses.',
  },
  noc: {
    title: 'NOC Provisioning Queue',
    subtitle: 'Validasi ODP, generate PPPoE, approve teknis, dan final verify instalasi baru.',
  },
  helpdesk: {
    title: 'Registrasi Baru',
    subtitle: 'Pemantauan terbatas untuk alur registrasi baru.',
  },
  lead_tech: {
    title: 'Dispatch Instalasi Baru',
    subtitle: 'Assign work order hasil approval dan monitor antrean pemasangan baru.',
  },
  field_tech: {
    title: 'Registrasi Baru',
    subtitle: 'Workspace ini tidak dipakai untuk teknisi lapangan.',
  },
  finance: {
    title: 'Finance Approval Queue',
    subtitle: 'Review kelayakan deposit, biaya instalasi, dan approval registrasi pelanggan baru.',
  },
  inventory: {
    title: 'Registrasi Baru',
    subtitle: 'Pemantauan terbatas untuk alur registrasi baru.',
  },
};

export const ServiceRegistrationsView: React.FC = () => {
  const {
    activeRole,
    searchQuery,
    serviceRegistrations,
    workOrders,
    users,
    assignWorkOrderToTech,
    submitServiceRegistration,
    financeApproveServiceRegistration,
    financeRejectServiceRegistration,
    generateRegistrationPppoe,
    nocApproveServiceRegistration,
    nocRejectServiceRegistration,
    createInstallationWorkOrderFromRegistration,
    nocFinalVerifyInstallation,
  } = useIOMS();

  const [selectedTech, setSelectedTech] = useState<Record<string, string>>({});
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | ServiceRegistration['status']>('all');

  const visibleRegistrations = useMemo(() => {
    let rows = [...serviceRegistrations];

    if (activeRole === 'sales') {
      rows = rows.filter((item) => ['draft', 'pending_finance', 'finance_rejected', 'pending_noc', 'noc_rejected', 'ready_for_dispatch', 'field_submitted', 'completed'].includes(item.status));
    }

    if (activeRole === 'finance') {
      rows = rows.filter((item) => ['pending_finance', 'finance_rejected', 'pending_noc', 'completed'].includes(item.status));
    }

    if (activeRole === 'noc') {
      rows = rows.filter((item) => ['pending_noc', 'noc_approved', 'noc_rejected', 'ready_for_dispatch', 'field_submitted', 'completed'].includes(item.status));
    }

    if (activeRole === 'lead_tech') {
      rows = rows.filter((item) => item.workOrderId !== null || item.status === 'ready_for_dispatch');
    }

    if (localStatusFilter !== 'all') {
      rows = rows.filter((item) => item.status === localStatusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((item) => (
        `${item.id} ${item.name} ${item.phone} ${item.region} ${item.odpId} ${item.packagePlan}`.toLowerCase().includes(q)
      ));
    }

    return rows;
  }, [activeRole, localStatusFilter, searchQuery, serviceRegistrations]);

  const fieldTechs = users.filter((user) => user.role === 'field_tech');

  const stageStats = useMemo(() => ({
    draft: serviceRegistrations.filter((item) => item.status === 'draft').length,
    pendingFinance: serviceRegistrations.filter((item) => item.status === 'pending_finance').length,
    pendingNoc: serviceRegistrations.filter((item) => item.status === 'pending_noc').length,
    readyDispatch: serviceRegistrations.filter((item) => item.status === 'ready_for_dispatch').length,
    finalVerify: serviceRegistrations.filter((item) => item.status === 'field_submitted').length,
    completed: serviceRegistrations.filter((item) => item.status === 'completed').length,
  }), [serviceRegistrations]);

  const handleLeadAssign = (registration: ServiceRegistration, techId: string) => {
    if (!registration.workOrderId) return;
    setSelectedTech((current) => ({ ...current, [registration.id]: techId }));
    assignWorkOrderToTech(registration.workOrderId, techId);
  };

  const handleNocFinalVerify = (registration: ServiceRegistration) => {
    if (!registration.workOrderId) return;

    nocFinalVerifyInstallation(registration.workOrderId, {
      opticalDbmReading: -20.4,
      pppoeSessionActive: true,
      rxPowerThresholdPassed: true,
      notes: 'Aktivasi pasang baru diverifikasi NOC. Redaman dan sesi PPPoE normal.',
    });
  };

  const getRoleActions = (registration: ServiceRegistration) => {
    if (activeRole === 'sales' && registration.status === 'draft') {
      return (
        <button
          onClick={() => submitServiceRegistration(registration.id)}
          className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700"
        >
          Submit ke Finance
        </button>
      );
    }

    if (activeRole === 'finance' && registration.status === 'pending_finance') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            onClick={() => financeApproveServiceRegistration(registration.id, 'Deposit dan nilai paket disetujui finance.')}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Approve Finance
          </button>
          <button
            onClick={() => financeRejectServiceRegistration(registration.id, 'Dokumen pembayaran atau biaya instalasi belum valid.')}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            Reject
          </button>
        </div>
      );
    }

    if (activeRole === 'noc' && registration.status === 'pending_noc') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          {!registration.pppoeUsername && (
            <button
              onClick={() => generateRegistrationPppoe(registration.id)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"
            >
              Generate PPPoE
            </button>
          )}
          <button
            onClick={() => nocApproveServiceRegistration(registration.id, 'ODP dan port valid untuk pemasangan baru.')}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Approve NOC
          </button>
          <button
            onClick={() => nocRejectServiceRegistration(registration.id, 'Port ODP penuh atau redaman awal tidak memenuhi syarat.')}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
          >
            Reject NOC
          </button>
        </div>
      );
    }

    if (activeRole === 'noc' && registration.status === 'noc_approved' && !registration.workOrderId) {
      return (
        <button
          onClick={() => createInstallationWorkOrderFromRegistration(registration.id)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Create WO Instalasi
        </button>
      );
    }

    if (activeRole === 'noc' && registration.status === 'field_submitted' && registration.workOrderId) {
      return (
        <button
          onClick={() => handleNocFinalVerify(registration)}
          className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
        >
          Final Verify NOC
        </button>
      );
    }

    if (activeRole === 'lead_tech' && registration.workOrderId) {
      const linkedWorkOrder = workOrders.find((item) => item.id === registration.workOrderId);
      if (!linkedWorkOrder || !['pending_lead_assignment', 'assigned'].includes(linkedWorkOrder.status)) {
        return <span className="text-xs font-semibold text-slate-500">Menunggu progres lapangan</span>;
      }

      return (
        <select
          value={selectedTech[registration.id] || linkedWorkOrder.assignedTechId || fieldTechs[0]?.id || ''}
          onChange={(event) => handleLeadAssign(registration, event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800"
        >
          {fieldTechs.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.name}
            </option>
          ))}
        </select>
      );
    }

    if (activeRole === 'superadmin') {
      return <span className="text-xs font-semibold text-slate-500">Pantau lintas tahap</span>;
    }

    return <span className="text-xs font-semibold text-slate-500">Tidak ada aksi</span>;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">Sales {'->'} Finance {'->'} NOC {'->'} Lapangan</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{roleHeadlines[activeRole].title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">{roleHeadlines[activeRole].subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Search className="h-4 w-4 text-slate-400" />
            <span>{visibleRegistrations.length} registrasi terlihat untuk role ini</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          { label: 'Draft', value: stageStats.draft, icon: ClipboardList, tone: 'bg-slate-100 text-slate-700' },
          { label: 'Finance Queue', value: stageStats.pendingFinance, icon: CreditCard, tone: 'bg-amber-100 text-amber-700' },
          { label: 'NOC Queue', value: stageStats.pendingNoc, icon: Network, tone: 'bg-sky-100 text-sky-700' },
          { label: 'Dispatch', value: stageStats.readyDispatch, icon: BriefcaseBusiness, tone: 'bg-violet-100 text-violet-700' },
          { label: 'Final Verify', value: stageStats.finalVerify, icon: ShieldCheck, tone: 'bg-emerald-100 text-emerald-700' },
          { label: 'Completed', value: stageStats.completed, icon: BadgeCheck, tone: 'bg-emerald-100 text-emerald-700' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-2xl px-3 py-3 ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        {(['all', 'draft', 'pending_finance', 'pending_noc', 'noc_approved', 'ready_for_dispatch', 'field_submitted', 'completed'] as const).map((statusKey) => (
          <button
            key={statusKey}
            onClick={() => setLocalStatusFilter(statusKey)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition ${
              localStatusFilter === statusKey ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {statusKey === 'all' ? 'Semua' : statusLabels[statusKey]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="hidden grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.8fr_0.9fr] gap-3 border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid">
          <span>Pelanggan</span>
          <span>Paket / ODP</span>
          <span>Finance</span>
          <span>NOC</span>
          <span>WO / PPPoE</span>
          <span className="text-right">Aksi</span>
        </div>

        <div className="divide-y divide-slate-100">
          {visibleRegistrations.map((registration) => {
            const linkedWorkOrder = registration.workOrderId
              ? workOrders.find((workOrder) => workOrder.id === registration.workOrderId)
              : null;

            return (
              <div key={registration.id} className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1fr_0.8fr_0.8fr_0.7fr_0.8fr_0.9fr] xl:items-center">
                <div>
                  <p className="font-bold text-slate-900">{registration.name}</p>
                  <p className="text-xs text-slate-500">{registration.id} • {registration.phone}</p>
                  <p className="mt-1 text-xs text-slate-500">{registration.address}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{registration.packagePlan}</p>
                  <p className="text-xs text-slate-500">{registration.odpId}</p>
                  <p className="text-xs font-semibold text-emerald-700">Rp {registration.monthlyFee.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${registration.financeStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : registration.financeStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {registration.financeStatus.toUpperCase()}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">{registration.financeNotes || '-'}</p>
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${registration.nocStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' : registration.nocStatus === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'}`}>
                    {registration.nocStatus.toUpperCase()}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">{statusLabels[registration.status]}</p>
                </div>
                <div>
                  <p className="font-mono text-xs font-bold text-slate-800">{registration.pppoeUsername || '-'}</p>
                  <p className="mt-1 text-xs text-slate-500">{registration.workOrderId || 'WO belum dibuat'}</p>
                  {linkedWorkOrder && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">{linkedWorkOrder.status}</p>
                  )}
                </div>
                <div className="flex justify-end">
                  {getRoleActions(registration)}
                </div>
              </div>
            );
          })}

          {visibleRegistrations.length === 0 && (
            <div className="px-6 py-14 text-center">
              <UserRoundPlus className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada registrasi pada antrean ini</p>
              <p className="mt-1 text-xs text-slate-500">Gunakan form registrasi baru atau ubah filter status untuk melihat data lain.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

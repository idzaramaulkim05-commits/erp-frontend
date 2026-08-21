import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Network,
  Radio,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundPlus,
  Wrench,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import {
  PipelineActionState,
  PipelineRoleDashboardSection,
  PipelineStageItem,
  ServiceRegistration,
  ServiceRegistrationStatus,
  UserRole,
  WorkOrder,
} from '../../types';
import {
  PipelineActionPanel,
  PipelineRoleSummary,
  PipelineSecondarySection,
  PipelineSectionGrid,
  PipelineStageBoard,
} from '../pipeline/PipelineWidgets';

interface ServiceRegistrationsViewProps {
  onOpenNewRegistration?: () => void;
}

const statusLabels: Record<ServiceRegistrationStatus, string> = {
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

const roleHeadlines: Record<UserRole, { title: string; subtitle: string; eyebrow: string }> = {
  superadmin: {
    title: 'Pipeline Registrasi Lintas Divisi',
    subtitle: 'Kontrol menyeluruh terhadap handoff sales, finance, NOC, dispatch, hingga final verify instalasi baru.',
    eyebrow: 'Full Pipeline Command',
  },
  management: {
    title: 'Ringkasan Registrasi Pasang Baru',
    subtitle: 'Pantau jalur registrasi baru dari awal hingga aktivasi selesai.',
    eyebrow: 'Executive Visibility',
  },
  sales: {
    title: 'Sales Acquisition Pipeline',
    subtitle: 'Kelola draft prospek, kirim ke finance, dan pantau progres pasang baru sampai aktif.',
    eyebrow: 'Sales to Finance',
  },
  noc: {
    title: 'NOC Provisioning Queue',
    subtitle: 'Validasi ODP, generate PPPoE, buat WO instalasi, dan tutup aktivasi melalui final verify.',
    eyebrow: 'NOC to Aktivasi',
  },
  helpdesk: {
    title: 'Monitoring Registrasi Baru',
    subtitle: 'Pemantauan terbatas terhadap alur registrasi pasang baru.',
    eyebrow: 'Read Only',
  },
  lead_tech: {
    title: 'Dispatch Instalasi Baru',
    subtitle: 'Atur assignment teknisi untuk WO hasil approval dan pantau antrean lapangan sampai siap ditutup NOC.',
    eyebrow: 'Lead to Lapangan',
  },
  field_tech: {
    title: 'Registrasi Baru',
    subtitle: 'Role teknisi lapangan tidak memakai dashboard ini sebagai workspace utama.',
    eyebrow: 'Standby',
  },
  finance: {
    title: 'Finance Approval Queue',
    subtitle: 'Review biaya, deposit, dan approval registrasi baru sebelum diteruskan ke NOC.',
    eyebrow: 'Finance Gate',
  },
  inventory: {
    title: 'Monitoring Registrasi Baru',
    subtitle: 'Pemantauan terbatas terhadap alur registrasi pasang baru.',
    eyebrow: 'Read Only',
  },
};

const metricTone = {
  slate: 'bg-white/10 text-slate-100',
  amber: 'bg-amber-400/15 text-amber-200',
  sky: 'bg-sky-400/15 text-sky-200',
  emerald: 'bg-emerald-400/15 text-emerald-200',
  violet: 'bg-violet-400/15 text-violet-200',
} as const;

const normalizeRegistrationScope = (role: UserRole, registrations: ServiceRegistration[]) => {
  if (role === 'sales') {
    return registrations.filter((item) =>
      ['draft', 'pending_finance', 'finance_rejected', 'pending_noc', 'noc_rejected', 'ready_for_dispatch', 'field_submitted', 'completed'].includes(item.status),
    );
  }

  if (role === 'finance') {
    return registrations.filter((item) =>
      ['pending_finance', 'finance_rejected', 'pending_noc', 'completed'].includes(item.status),
    );
  }

  if (role === 'noc') {
    return registrations.filter((item) =>
      ['pending_noc', 'noc_approved', 'noc_rejected', 'ready_for_dispatch', 'field_submitted', 'completed'].includes(item.status),
    );
  }

  if (role === 'lead_tech') {
    return registrations.filter((item) => item.workOrderId !== null || item.status === 'ready_for_dispatch');
  }

  return registrations;
};

const getSummaryStats = (
  role: UserRole,
  registrations: ServiceRegistration[],
  linkedWorkOrders: Record<string, WorkOrder | undefined>,
) => {
  if (role === 'sales') {
    return [
      { label: 'Draft Aktif', value: registrations.filter((item) => item.status === 'draft').length, icon: ClipboardList, accentClass: metricTone.slate },
      { label: 'Menunggu Finance', value: registrations.filter((item) => item.status === 'pending_finance').length, icon: CreditCard, accentClass: metricTone.amber },
      { label: 'Butuh Revisi', value: registrations.filter((item) => ['finance_rejected', 'noc_rejected'].includes(item.status)).length, icon: AlertCircle, accentClass: metricTone.violet },
      { label: 'Selesai Aktif', value: registrations.filter((item) => item.status === 'completed').length, icon: CheckCircle2, accentClass: metricTone.emerald },
    ];
  }

  if (role === 'finance') {
    return [
      { label: 'Pending Approval', value: registrations.filter((item) => item.status === 'pending_finance').length, icon: CreditCard, accentClass: metricTone.amber },
      { label: 'Rejected', value: registrations.filter((item) => item.status === 'finance_rejected').length, icon: AlertCircle, accentClass: metricTone.violet },
      { label: 'Lolos ke NOC', value: registrations.filter((item) => item.status === 'pending_noc').length, icon: Network, accentClass: metricTone.sky },
      { label: 'Completed', value: registrations.filter((item) => item.status === 'completed').length, icon: BadgeCheck, accentClass: metricTone.emerald },
    ];
  }

  if (role === 'noc') {
    return [
      { label: 'Pending NOC', value: registrations.filter((item) => item.status === 'pending_noc').length, icon: Network, accentClass: metricTone.sky },
      { label: 'PPPoE Siap', value: registrations.filter((item) => item.status === 'pending_noc' && !!item.pppoeUsername).length, icon: Radio, accentClass: metricTone.slate },
      { label: 'Siap Buat WO', value: registrations.filter((item) => item.status === 'noc_approved' && !item.workOrderId).length, icon: BriefcaseBusiness, accentClass: metricTone.violet },
      { label: 'Final Verify', value: registrations.filter((item) => item.status === 'field_submitted').length, icon: ShieldCheck, accentClass: metricTone.emerald },
    ];
  }

  if (role === 'lead_tech') {
    return [
      { label: 'Ready Dispatch', value: registrations.filter((item) => item.status === 'ready_for_dispatch').length, icon: ClipboardList, accentClass: metricTone.violet },
      { label: 'Belum Assign', value: registrations.filter((item) => linkedWorkOrders[item.id]?.status === 'pending_lead_assignment').length, icon: UserCheck, accentClass: metricTone.amber },
      { label: 'Sudah Di-assign', value: registrations.filter((item) => linkedWorkOrders[item.id]?.status === 'assigned').length, icon: Wrench, accentClass: metricTone.sky },
      { label: 'Menunggu NOC', value: registrations.filter((item) => ['field_submitted', 'completed'].includes(item.status)).length, icon: ShieldCheck, accentClass: metricTone.emerald },
    ];
  }

  return [
    { label: 'Draft', value: registrations.filter((item) => item.status === 'draft').length, icon: ClipboardList, accentClass: metricTone.slate },
    { label: 'Finance Queue', value: registrations.filter((item) => item.status === 'pending_finance').length, icon: CreditCard, accentClass: metricTone.amber },
    { label: 'NOC Queue', value: registrations.filter((item) => item.status === 'pending_noc').length, icon: Network, accentClass: metricTone.sky },
    { label: 'Completed', value: registrations.filter((item) => item.status === 'completed').length, icon: BadgeCheck, accentClass: metricTone.emerald },
  ];
};

const getStagesForRole = (role: UserRole, registrations: ServiceRegistration[], linkedWorkOrders: Record<string, WorkOrder | undefined>): PipelineStageItem[] => {
  if (role === 'sales') {
    return [
      { id: 'sales_draft', label: 'Draft Registrasi', description: 'Prospek belum dikirim ke finance.', count: registrations.filter((item) => item.status === 'draft').length, statuses: ['draft'], accentClass: 'bg-slate-100 text-slate-700' },
      { id: 'sales_finance', label: 'Menunggu Finance', description: 'Draft sudah masuk antrean approval biaya.', count: registrations.filter((item) => item.status === 'pending_finance').length, statuses: ['pending_finance'], accentClass: 'bg-amber-100 text-amber-700' },
      { id: 'sales_revision', label: 'Perlu Revisi', description: 'Ditolak finance atau NOC dan perlu tindak lanjut sales.', count: registrations.filter((item) => ['finance_rejected', 'noc_rejected'].includes(item.status)).length, statuses: ['finance_rejected', 'noc_rejected'], accentClass: 'bg-rose-100 text-rose-700' },
      { id: 'sales_done', label: 'Aktivasi Selesai', description: 'Pelanggan sudah selesai melalui seluruh tahapan.', count: registrations.filter((item) => item.status === 'completed').length, statuses: ['completed'], accentClass: 'bg-emerald-100 text-emerald-700' },
    ];
  }

  if (role === 'finance') {
    return [
      { id: 'finance_pending', label: 'Approval Masuk', description: 'Registrasi baru menunggu verifikasi biaya/deposit.', count: registrations.filter((item) => item.status === 'pending_finance').length, statuses: ['pending_finance'], accentClass: 'bg-amber-100 text-amber-700' },
      { id: 'finance_rejected', label: 'Ditolak Finance', description: 'Data pembayaran belum valid dan perlu follow up.', count: registrations.filter((item) => item.status === 'finance_rejected').length, statuses: ['finance_rejected'], accentClass: 'bg-rose-100 text-rose-700' },
      { id: 'finance_forwarded', label: 'Diteruskan ke NOC', description: 'Registrasi yang lolos finance dan menunggu tahap teknis.', count: registrations.filter((item) => item.status === 'pending_noc').length, statuses: ['pending_noc'], accentClass: 'bg-sky-100 text-sky-700' },
      { id: 'finance_completed', label: 'Closed Loop', description: 'Pelanggan sudah aktif sebagai hasil registrasi.', count: registrations.filter((item) => item.status === 'completed').length, statuses: ['completed'], accentClass: 'bg-emerald-100 text-emerald-700' },
    ];
  }

  if (role === 'noc') {
    return [
      { id: 'noc_pending', label: 'Validasi Teknis', description: 'Antrean cek ODP, port, dan kesiapan provisioning.', count: registrations.filter((item) => item.status === 'pending_noc').length, statuses: ['pending_noc'], accentClass: 'bg-sky-100 text-sky-700' },
      { id: 'noc_ready_wo', label: 'Approved Siap WO', description: 'Registrasi sudah lolos NOC dan perlu dibuatkan WO.', count: registrations.filter((item) => item.status === 'noc_approved').length, statuses: ['noc_approved'], accentClass: 'bg-violet-100 text-violet-700' },
      { id: 'noc_final', label: 'Menunggu Final Verify', description: 'Hasil lapangan masuk dan siap diverifikasi NOC.', count: registrations.filter((item) => item.status === 'field_submitted').length, statuses: ['field_submitted'], accentClass: 'bg-emerald-100 text-emerald-700' },
      { id: 'noc_closed', label: 'Selesai Aktif', description: 'Aktivasi selesai dan sesi layanan dinyatakan normal.', count: registrations.filter((item) => item.status === 'completed').length, statuses: ['completed'], accentClass: 'bg-slate-100 text-slate-700' },
    ];
  }

  if (role === 'lead_tech') {
    return [
      { id: 'lead_dispatch', label: 'Ready Dispatch', description: 'Registrasi baru siap dijadikan antrean assignment teknisi.', count: registrations.filter((item) => item.status === 'ready_for_dispatch').length, statuses: ['ready_for_dispatch'], accentClass: 'bg-violet-100 text-violet-700' },
      { id: 'lead_unassigned', label: 'WO Belum Assign', description: 'WO sudah terbit tetapi belum dipilih teknisi pelaksananya.', count: registrations.filter((item) => linkedWorkOrders[item.id]?.status === 'pending_lead_assignment').length, statuses: ['ready_for_dispatch'], accentClass: 'bg-amber-100 text-amber-700' },
      { id: 'lead_assigned', label: 'Sudah Di-assign', description: 'WO sudah dialokasikan dan siap atau sedang dikerjakan lapangan.', count: registrations.filter((item) => ['assigned', 'in_progress'].includes(linkedWorkOrders[item.id]?.status ?? '')).length, statuses: ['ready_for_dispatch'], accentClass: 'bg-sky-100 text-sky-700' },
      { id: 'lead_handoff', label: 'Handoff ke NOC', description: 'Hasil lapangan sudah masuk dan menunggu verifikasi akhir.', count: registrations.filter((item) => item.status === 'field_submitted').length, statuses: ['field_submitted'], accentClass: 'bg-emerald-100 text-emerald-700' },
    ];
  }

  return [
    { id: 'all_draft', label: 'Draft', description: 'Registrasi yang belum diproses.', count: registrations.filter((item) => item.status === 'draft').length, statuses: ['draft'], accentClass: 'bg-slate-100 text-slate-700' },
    { id: 'all_finance', label: 'Finance', description: 'Registrasi yang menunggu approval finance.', count: registrations.filter((item) => item.status === 'pending_finance').length, statuses: ['pending_finance'], accentClass: 'bg-amber-100 text-amber-700' },
    { id: 'all_noc', label: 'NOC', description: 'Registrasi yang berada di tahap NOC.', count: registrations.filter((item) => ['pending_noc', 'noc_approved'].includes(item.status)).length, statuses: ['pending_noc', 'noc_approved'], accentClass: 'bg-sky-100 text-sky-700' },
    { id: 'all_done', label: 'Completed', description: 'Registrasi yang sudah selesai aktif.', count: registrations.filter((item) => item.status === 'completed').length, statuses: ['completed'], accentClass: 'bg-emerald-100 text-emerald-700' },
  ];
};

const createSectionsFromStages = (
  stages: PipelineStageItem[],
  registrations: ServiceRegistration[],
  linkedWorkOrders: Record<string, WorkOrder | undefined>,
  stageFilter: string,
): PipelineRoleDashboardSection[] => {
  const selectedStages = stageFilter === 'all' ? stages : stages.filter((stage) => stage.id === stageFilter);

  return selectedStages.map((stage) => ({
    id: stage.id,
    title: stage.label,
    description: stage.description,
    items: registrations.filter((registration) => {
      if (stage.id === 'lead_unassigned') {
        return linkedWorkOrders[registration.id]?.status === 'pending_lead_assignment';
      }

      if (stage.id === 'lead_assigned') {
        return ['assigned', 'in_progress'].includes(linkedWorkOrders[registration.id]?.status ?? '');
      }

      return stage.statuses.includes(registration.status);
    }).slice(0, 4),
  }));
};

const getStatusFilterForRole = (role: UserRole): Array<'all' | ServiceRegistrationStatus> => {
  if (role === 'sales') return ['all', 'draft', 'pending_finance', 'finance_rejected', 'noc_rejected', 'completed'];
  if (role === 'finance') return ['all', 'pending_finance', 'finance_rejected', 'pending_noc', 'completed'];
  if (role === 'noc') return ['all', 'pending_noc', 'noc_approved', 'field_submitted', 'completed'];
  if (role === 'lead_tech') return ['all', 'ready_for_dispatch', 'field_submitted', 'completed'];
  return ['all', 'draft', 'pending_finance', 'pending_noc', 'ready_for_dispatch', 'field_submitted', 'completed'];
};

export const ServiceRegistrationsView: React.FC<ServiceRegistrationsViewProps> = ({ onOpenNewRegistration }) => {
  const {
    activeRole,
    searchQuery,
    setSelectedModule,
    serviceRegistrations,
    workOrders,
    users,
    tickets,
    customers,
    procurementRequests,
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
  const [localStatusFilter, setLocalStatusFilter] = useState<'all' | ServiceRegistrationStatus>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('all');

  const linkedWorkOrders = useMemo(
    () =>
      serviceRegistrations.reduce<Record<string, WorkOrder | undefined>>((accumulator, registration) => {
        accumulator[registration.id] = registration.workOrderId
          ? workOrders.find((workOrder) => workOrder.id === registration.workOrderId)
          : undefined;
        return accumulator;
      }, {}),
    [serviceRegistrations, workOrders],
  );

  const scopedRegistrations = useMemo(() => normalizeRegistrationScope(activeRole, serviceRegistrations), [activeRole, serviceRegistrations]);

  const searchedRegistrations = useMemo(() => {
    let rows = [...scopedRegistrations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((item) =>
        `${item.id} ${item.name} ${item.phone} ${item.region} ${item.odpId} ${item.packagePlan} ${item.pppoeUsername ?? ''}`.toLowerCase().includes(q),
      );
    }

    if (localStatusFilter !== 'all') {
      rows = rows.filter((item) => item.status === localStatusFilter);
    }

    return rows;
  }, [localStatusFilter, scopedRegistrations, searchQuery]);

  const stages = useMemo(() => getStagesForRole(activeRole, searchedRegistrations, linkedWorkOrders), [activeRole, searchedRegistrations, linkedWorkOrders]);
  const detailSections = useMemo(
    () => createSectionsFromStages(stages, searchedRegistrations, linkedWorkOrders, selectedStageFilter),
    [stages, searchedRegistrations, linkedWorkOrders, selectedStageFilter],
  );

  const detailRegistrations = useMemo(() => {
    if (selectedStageFilter === 'all') {
      return searchedRegistrations;
    }

    const selectedStage = stages.find((stage) => stage.id === selectedStageFilter);
    if (!selectedStage) {
      return searchedRegistrations;
    }

    return searchedRegistrations.filter((registration) => {
      if (selectedStage.id === 'lead_unassigned') {
        return linkedWorkOrders[registration.id]?.status === 'pending_lead_assignment';
      }

      if (selectedStage.id === 'lead_assigned') {
        return ['assigned', 'in_progress'].includes(linkedWorkOrders[registration.id]?.status ?? '');
      }

      return selectedStage.statuses.includes(registration.status);
    });
  }, [linkedWorkOrders, searchedRegistrations, selectedStageFilter, stages]);

  const fieldTechs = users.filter((user) => user.role === 'field_tech');
  const summaryStats = useMemo(() => getSummaryStats(activeRole, scopedRegistrations, linkedWorkOrders), [activeRole, scopedRegistrations, linkedWorkOrders]);

  const secondaryMetrics = useMemo(() => ({
    finance: {
      unpaidCustomers: customers.filter((customer) => customer.billingStatus === 'unpaid').length,
      uninstalPending: customers.filter((customer) => customer.status === 'uninstal_pending').length,
      pendingProcurement: procurementRequests.filter((request) => request.status === 'pending_finance').length,
    },
    noc: {
      pendingReview: tickets.filter((ticket) => ticket.status === 'in_noc_review').length,
      readyToClose: tickets.filter((ticket) => ticket.status === 'lead_sop_approved').length,
      lowSignal: customers.filter((customer) => customer.opticalPowerDbm < -25).length,
    },
    lead: {
      sopReview: tickets.filter((ticket) => ticket.status === 'field_progress' && ticket.fieldWorkReport?.completedAt).length,
      dispatchQueue: workOrders.filter((workOrder) => ['pending', 'pending_lead_assignment', 'assigned'].includes(workOrder.status)).length,
      waitingNoc: workOrders.filter((workOrder) => workOrder.status === 'waiting_noc_activation').length,
    },
  }), [customers, procurementRequests, tickets, workOrders]);

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

  const renderActionSlot = (registration: ServiceRegistration) => {
    if (activeRole === 'sales' && registration.status === 'draft') {
      return (
        <PipelineActionPanel
          title="Aksi Sales"
          note="Draft siap dikirim ke finance untuk review biaya dan deposit."
          actions={[
            {
              key: 'submit-finance',
              state: { label: 'Submit ke Finance', tone: 'primary' },
              onClick: () => submitServiceRegistration(registration.id),
            },
          ]}
        />
      );
    }

    if (activeRole === 'finance' && registration.status === 'pending_finance') {
      return (
        <PipelineActionPanel
          title="Keputusan Finance"
          note="Tentukan apakah registrasi ini siap diteruskan ke NOC."
          actions={[
            {
              key: 'approve-finance',
              state: { label: 'Approve Finance', tone: 'success' },
              onClick: () => financeApproveServiceRegistration(registration.id, 'Deposit dan nilai paket disetujui finance.'),
            },
            {
              key: 'reject-finance',
              state: { label: 'Reject', tone: 'danger' },
              onClick: () => financeRejectServiceRegistration(registration.id, 'Dokumen pembayaran atau biaya instalasi belum valid.'),
            },
          ]}
        />
      );
    }

    if (activeRole === 'noc' && registration.status === 'pending_noc') {
      const actions = [
        !registration.pppoeUsername
          ? {
              key: 'generate-pppoe',
              state: { label: 'Generate PPPoE', tone: 'muted' as const },
              onClick: () => generateRegistrationPppoe(registration.id),
            }
          : null,
        {
          key: 'approve-noc',
          state: { label: 'Approve NOC', tone: 'success' as const },
          onClick: () => nocApproveServiceRegistration(registration.id, 'ODP dan port valid untuk pemasangan baru.'),
        },
        {
          key: 'reject-noc',
          state: { label: 'Reject NOC', tone: 'danger' as const },
          onClick: () => nocRejectServiceRegistration(registration.id, 'Port ODP penuh atau redaman awal tidak memenuhi syarat.'),
        },
      ].filter(Boolean) as Array<{ key: string; state: PipelineActionState; onClick?: () => void }>;

      return (
        <PipelineActionPanel
          title="Provisioning NOC"
          note="Lengkapi PPPoE dan putuskan hasil validasi teknis."
          actions={actions}
        />
      );
    }

    if (activeRole === 'noc' && registration.status === 'noc_approved' && !registration.workOrderId) {
      return (
        <PipelineActionPanel
          title="Penerbitan WO"
          note="Registrasi sudah lolos NOC dan siap dikonversi menjadi work order instalasi."
          actions={[
            {
              key: 'create-wo',
              state: { label: 'Create WO Instalasi', tone: 'primary' },
              onClick: () => createInstallationWorkOrderFromRegistration(registration.id),
            },
          ]}
        />
      );
    }

    if (activeRole === 'noc' && registration.status === 'field_submitted' && registration.workOrderId) {
      return (
        <PipelineActionPanel
          title="Final Verify NOC"
          note="Laporan lapangan sudah masuk dan siap divalidasi untuk aktivasi akhir."
          actions={[
            {
              key: 'final-verify',
              state: { label: 'Final Verify NOC', tone: 'success' },
              onClick: () => handleNocFinalVerify(registration),
            },
          ]}
        />
      );
    }

    if (activeRole === 'lead_tech' && registration.workOrderId) {
      const linkedWorkOrder = linkedWorkOrders[registration.id];

      if (!linkedWorkOrder || !['pending_lead_assignment', 'assigned'].includes(linkedWorkOrder.status)) {
        return (
          <PipelineActionPanel
            title="Status Dispatch"
            note="Work order ini sudah bergerak ke lapangan atau menunggu tahap berikutnya."
            actions={[
              {
                key: 'dispatch-note',
                state: { label: 'Menunggu progres lapangan', tone: 'muted', disabled: true },
              },
            ]}
          />
        );
      }

      return (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Assign Teknisi</p>
          <p className="mt-1 text-xs text-slate-500">Pilih teknisi lapangan yang akan menerima WO ini.</p>
          <select
            value={selectedTech[registration.id] || linkedWorkOrder.assignedTechId || fieldTechs[0]?.id || ''}
            onChange={(event) => handleLeadAssign(registration, event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-800"
          >
            {fieldTechs.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.roleTitle})
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  const renderTableAction = (registration: ServiceRegistration) => {
    if (activeRole === 'sales' && registration.status === 'draft') {
      return (
        <button
          type="button"
          onClick={() => submitServiceRegistration(registration.id)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Submit
        </button>
      );
    }

    if (activeRole === 'finance' && registration.status === 'pending_finance') {
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => financeApproveServiceRegistration(registration.id, 'Deposit dan nilai paket disetujui finance.')}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Approve
          </button>
          <button
            type="button"
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
              type="button"
              onClick={() => generateRegistrationPppoe(registration.id)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              PPPoE
            </button>
          )}
          <button
            type="button"
            onClick={() => nocApproveServiceRegistration(registration.id, 'ODP dan port valid untuk pemasangan baru.')}
            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
          >
            Approve
          </button>
        </div>
      );
    }

    if (activeRole === 'noc' && registration.status === 'noc_approved' && !registration.workOrderId) {
      return (
        <button
          type="button"
          onClick={() => createInstallationWorkOrderFromRegistration(registration.id)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
        >
          Create WO
        </button>
      );
    }

    if (activeRole === 'noc' && registration.status === 'field_submitted' && registration.workOrderId) {
      return (
        <button
          type="button"
          onClick={() => handleNocFinalVerify(registration)}
          className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
        >
          Final Verify
        </button>
      );
    }

    if (activeRole === 'lead_tech' && registration.workOrderId) {
      const linkedWorkOrder = linkedWorkOrders[registration.id];
      if (!linkedWorkOrder || !['pending_lead_assignment', 'assigned'].includes(linkedWorkOrder.status)) {
        return <span className="text-xs font-semibold text-slate-500">Menunggu progres</span>;
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

    return <span className="text-xs font-semibold text-slate-500">Tidak ada aksi</span>;
  };

  const renderSecondarySection = () => {
    if (activeRole === 'finance') {
      return (
        <PipelineSecondarySection
          title="Billing Umum & Procurement Finance"
          description="Panel ini tetap menjaga konteks pekerjaan finance di luar pasang baru."
          ctaLabel="Buka Finance Desk"
          onCtaClick={() => setSelectedModule('finance')}
          icon={CreditCard}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Pelanggan Unpaid</p>
              <p className="mt-2 text-3xl font-black text-rose-700">{secondaryMetrics.finance.unpaidCustomers}</p>
              <p className="mt-1 text-xs text-slate-500">Billing umum yang masih perlu follow up.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Auto Cabut Pending</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{secondaryMetrics.finance.uninstalPending}</p>
              <p className="mt-1 text-xs text-slate-500">Layanan existing yang menuju proses pencabutan alat.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Procurement Pending</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{secondaryMetrics.finance.pendingProcurement}</p>
              <p className="mt-1 text-xs text-slate-500">Permintaan gudang yang masih perlu approval finance.</p>
            </div>
          </div>
        </PipelineSecondarySection>
      );
    }

    if (activeRole === 'noc') {
      return (
        <PipelineSecondarySection
          title="Gangguan Operasional & Ticket NOC"
          description="Pipeline pasang baru tetap menjadi home, sementara tiket gangguan lama tetap terlihat sebagai panel pendukung."
          ctaLabel="Buka NOC Console"
          onCtaClick={() => setSelectedModule('noc')}
          icon={Network}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Review NOC</p>
              <p className="mt-2 text-3xl font-black text-amber-700">{secondaryMetrics.noc.pendingReview}</p>
              <p className="mt-1 text-xs text-slate-500">Ticket gangguan yang masih perlu triage NOC.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Siap Closing</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{secondaryMetrics.noc.readyToClose}</p>
              <p className="mt-1 text-xs text-slate-500">Ticket gangguan yang sudah lolos SOP dan menunggu close.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Redaman Kritis</p>
              <p className="mt-2 text-3xl font-black text-rose-700">{secondaryMetrics.noc.lowSignal}</p>
              <p className="mt-1 text-xs text-slate-500">Pelanggan existing dengan optical power di bawah batas aman.</p>
            </div>
          </div>
        </PipelineSecondarySection>
      );
    }

    if (activeRole === 'lead_tech') {
      return (
        <PipelineSecondarySection
          title="WO Umum & SOP Lapangan"
          description="Dispatch pasang baru menjadi fokus utama, sementara WO maintenance dan review SOP lama tetap dipantau di panel ini."
          ctaLabel="Buka Lead Workspace"
          onCtaClick={() => setSelectedModule('lead_tech')}
          icon={UserCheck}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">SOP Review</p>
              <p className="mt-2 text-3xl font-black text-purple-700">{secondaryMetrics.lead.sopReview}</p>
              <p className="mt-1 text-xs text-slate-500">Laporan lapangan gangguan yang masih perlu approval kepala teknisi.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">WO Dispatch</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{secondaryMetrics.lead.dispatchQueue}</p>
              <p className="mt-1 text-xs text-slate-500">Antrean WO umum yang masih menunggu alokasi atau progres awal.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Waiting NOC</p>
              <p className="mt-2 text-3xl font-black text-emerald-700">{secondaryMetrics.lead.waitingNoc}</p>
              <p className="mt-1 text-xs text-slate-500">WO yang sudah dikirim dari lapangan dan menunggu aktivasi akhir.</p>
            </div>
          </div>
        </PipelineSecondarySection>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <PipelineRoleSummary
        eyebrow={roleHeadlines[activeRole].eyebrow}
        title={roleHeadlines[activeRole].title}
        subtitle={roleHeadlines[activeRole].subtitle}
        summaryStats={summaryStats}
        cta={activeRole === 'sales' && onOpenNewRegistration ? { label: 'Buat Registrasi Baru', onClick: onOpenNewRegistration } : undefined}
      />

      <PipelineStageBoard
        stages={stages}
        activeFilter={selectedStageFilter}
        onSelect={setSelectedStageFilter}
      />

      <div className="flex flex-wrap items-center gap-2 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
          <Search className="h-3.5 w-3.5 text-slate-400" />
          {detailRegistrations.length} registrasi terlihat
        </div>
        {getStatusFilterForRole(activeRole).map((statusKey) => (
          <button
            key={statusKey}
            type="button"
            onClick={() => setLocalStatusFilter(statusKey)}
            className={`rounded-full px-3 py-2 text-xs font-bold transition-colors ${
              localStatusFilter === statusKey ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {statusKey === 'all' ? 'Semua Status' : statusLabels[statusKey]}
          </button>
        ))}
      </div>

      <PipelineSectionGrid
        sections={detailSections}
        statusLabels={statusLabels}
        renderActionSlot={renderActionSlot}
      />

      <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Worklist Detail</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Daftar registrasi terfilter</h2>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {detailRegistrations.length} item
            </span>
          </div>
        </div>

        <div className="hidden grid-cols-[1fr_0.85fr_0.8fr_0.8fr_0.9fr_0.95fr] gap-3 border-b border-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 xl:grid">
          <span>Pelanggan</span>
          <span>Paket / ODP</span>
          <span>Finance</span>
          <span>NOC</span>
          <span>WO / PPPoE</span>
          <span className="text-right">Aksi Cepat</span>
        </div>

        <div className="divide-y divide-slate-100">
          {detailRegistrations.map((registration) => {
            const linkedWorkOrder = linkedWorkOrders[registration.id];

            return (
              <div key={registration.id} className="grid gap-4 px-5 py-4 text-sm xl:grid-cols-[1fr_0.85fr_0.8fr_0.8fr_0.9fr_0.95fr] xl:items-center">
                <div>
                  <p className="font-bold text-slate-900">{registration.name}</p>
                  <p className="text-xs text-slate-500">{registration.id} - {registration.phone}</p>
                  <p className="mt-1 text-xs text-slate-500">{registration.address}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{registration.packagePlan}</p>
                  <p className="text-xs text-slate-500">{registration.odpId}</p>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">Rp {registration.monthlyFee.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    registration.financeStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : registration.financeStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {registration.financeStatus.toUpperCase()}
                  </span>
                  <p className="mt-2 text-xs text-slate-500">{registration.financeNotes || '-'}</p>
                </div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    registration.nocStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : registration.nocStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}>
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
                <div className="flex flex-wrap justify-end gap-2">
                  {renderTableAction(registration)}
                </div>
              </div>
            );
          })}

          {detailRegistrations.length === 0 && (
            <div className="px-6 py-14 text-center">
              <UserRoundPlus className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">Belum ada registrasi pada antrean ini</p>
              <p className="mt-1 text-xs text-slate-500">Gunakan filter lain atau buat registrasi baru untuk melihat pipeline pasang baru.</p>
            </div>
          )}
        </div>
      </section>

      {renderSecondarySection()}
    </div>
  );
};

import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppModule,
  NavigationConfig,
  UserRole,
  UserProfile,
  ServiceRegistration,
  Customer,
  TroubleTicket,
  WorkOrder,
  InventoryItem,
  ProcurementRequest,
  InterDivisionTask,
  NetworkODP,
  ActivityAuditLog,
  CustomerStatus,
  FinanceMutation,
  FinancialLedgerEntry,
  ReimbursementRequest,
} from '../types';
import { AppNotification } from '../components/NotificationToastContainer';
import { playNotificationChime, requestBrowserNotificationPermission, showBrowserNotification } from '../utils/audioAlert';
import { INITIAL_USERS } from '../data/initialData';
import { useAuth } from './AuthContext';
import { getResolvedAllowedModules } from '../config/roleWorkspace';
import { getDefaultRouteForRole, getModuleFromPathname, getRoutePathForModule } from '../routing/moduleRoutes';

interface IOMSContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  users: UserProfile[];
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;
  isSplitScreenView: boolean;
  setIsSplitScreenView: (val: boolean) => void;
  selectedModule: AppModule;
  setSelectedModule: (module: AppModule) => void;
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  selectedOdpFilter: string;
  setSelectedOdpFilter: (odp: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  viewFormat: 'table' | 'grid' | 'kanban' | 'map';
  setViewFormat: (fmt: 'table' | 'grid' | 'kanban' | 'map') => void;
  navigationConfig: NavigationConfig | null;
  customers: Customer[];
  serviceRegistrations: ServiceRegistration[];
  tickets: TroubleTicket[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
  procurementRequests: ProcurementRequest[];
  reimbursementRequests: ReimbursementRequest[];
  financeMutations: FinanceMutation[];
  financialLedger: FinancialLedgerEntry[];
  tasks: InterDivisionTask[];
  networkOdps: NetworkODP[];
  auditLogs: ActivityAuditLog[];
  createServiceRegistration: (payload: Partial<ServiceRegistration>) => void;
  submitServiceRegistration: (registrationId: string) => void;
  financeApproveServiceRegistration: (registrationId: string, notes?: string) => void;
  financeRejectServiceRegistration: (registrationId: string, notes?: string) => void;
  generateRegistrationPppoe: (registrationId: string) => void;
  nocApproveServiceRegistration: (registrationId: string, notes?: string, odpPortCandidate?: number) => void;
  nocRejectServiceRegistration: (registrationId: string, notes?: string) => void;
  createInstallationWorkOrderFromRegistration: (registrationId: string) => void;
  createCustomer: (customerData: Partial<Customer>, initialDepositPaid: boolean) => void;
  updateCustomerStatus: (customerId: string, status: CustomerStatus, notes?: string) => Promise<void>;
  recordCustomerPayment: (customerId: string, notes?: string, paidAt?: string, paymentChannel?: string) => Promise<void>;
  createTroubleTicket: (ticketData: Partial<TroubleTicket>) => void;
  resolveTicketRemotely: (ticketId: string, notes: string) => void;
  escalateTicketToLeadTech: (
    ticketId: string,
    nocNotes: string,
    options?: {
      requiresReplacementRequest?: boolean;
      replacementItems?: Array<{
        itemName: string;
        quantity: number;
        unit: string;
      }>;
    }
  ) => void;
  helpdeskCloseTicket: (ticketId: string, notes: string, connectionNormal: boolean) => void;
  createWorkOrder: (woData: Partial<WorkOrder>) => void;
  assignWorkOrderToTech: (woId: string, techId: string) => void;
  requestWorkOrderPppoe: (workOrderId: string, notes?: string) => Promise<void>;
  approveWorkOrderPppoe: (
    workOrderId: string,
    payload: {
      pppoeUsername: string;
      pppoePassword: string;
      vlan?: string | null;
      notes?: string;
    },
  ) => Promise<void>;
  rejectWorkOrderPppoe: (workOrderId: string, notes: string) => Promise<void>;
  confirmInstallationCashPayment: (workOrderId: string, notes?: string, paymentChannel?: string) => Promise<void>;
  confirmInstallationTransferPayment: (workOrderId: string, notes?: string, paymentChannel?: string) => Promise<void>;
  submitFieldTechReport: (
    woOrTicketId: string,
    isWorkOrder: boolean,
    report: {
      actionTaken: string;
      patchCordReplaced?: boolean;
      dropCableLengthMeters?: number;
      finalOpticalPowerDbm: number;
      modemReplaced?: boolean;
      newOntSerialNumber?: string;
      photoKtp?: string;
      photoOpticalPowerMeter?: string;
      photoModemInstallation?: string;
      signature?: string;
    }
  ) => void;
  approveLeadTechSOP: (
    ticketId: string,
    sopChecklist: {
      cablesNeatlyClamped: boolean;
      protectionSleeveInstalled: boolean;
      customerAreaCleaned: boolean;
      speedtestVerified: boolean;
    },
    notes?: string
  ) => void;
  verifyAndCloseNOC: (
    ticketId: string,
    verification: {
      opticalDbmReading: number;
      pppoeSessionActive: boolean;
      rxPowerThresholdPassed: boolean;
      notes?: string;
    }
  ) => void;
  nocFinalVerifyInstallation: (
    workOrderId: string,
    verification: {
      opticalDbmReading: number;
      pppoeSessionActive: boolean;
      rxPowerThresholdPassed: boolean;
      notes?: string;
    }
  ) => void;
  createProcurementRequest: (req: Partial<ProcurementRequest>) => void;
  updateProcurementRequest: (reqId: string, req: Partial<ProcurementRequest>) => Promise<void>;
  approveProcurementByFinance: (reqId: string, notes?: string) => Promise<void>;
  rejectProcurementByFinance: (reqId: string, notes: string) => Promise<void>;
  approveProcurementByManagement: (reqId: string, notes?: string) => void;
  rejectProcurementByManagement: (reqId: string, notes: string) => Promise<void>;
  confirmProcurementPayment: (
    reqId: string,
    payload: { paymentProof?: File | string; paymentChannel?: string; notes?: string }
  ) => Promise<void>;
  markProcurementAsOrdered: (reqId: string, notes?: string) => Promise<void>;
  receiveProcurementStock: (reqId: string) => void;
  createReimbursementDraft: (payload: FormData) => Promise<ReimbursementRequest>;
  updateReimbursementDraft: (requestId: string, payload: FormData) => Promise<ReimbursementRequest>;
  submitReimbursementRequest: (requestId: string) => Promise<void>;
  financeApproveReimbursement: (requestId: string, notes?: string) => Promise<void>;
  financeRejectReimbursement: (requestId: string, notes: string) => Promise<void>;
  forwardReimbursementToManagement: (requestId: string, notes: string) => Promise<void>;
  managementApproveReimbursement: (requestId: string, notes?: string) => Promise<void>;
  managementRejectReimbursement: (requestId: string, notes: string) => Promise<void>;
  markReimbursementPaid: (requestId: string, notes?: string) => Promise<void>;
  createFinanceMutation: (payload: Partial<FinanceMutation>) => Promise<void>;
  updateFinanceMutation: (mutationId: string, payload: Partial<FinanceMutation>) => Promise<void>;
  deleteFinanceMutation: (mutationId: string) => Promise<void>;
  createInterDivisionTask: (task: Partial<InterDivisionTask>) => void;
  createTask: (task: Partial<InterDivisionTask>) => void;
  updateTaskStatus: (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done', resolutionNotes?: string) => void;
  resetToDefaultData: () => void;
  triggerCelebration: () => void;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isSoundEnabled: boolean;
  toggleSoundEnabled: () => void;
  refreshAll: () => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
}

const IOMSContext = createContext<IOMSContextType | undefined>(undefined);

const emptyUser: UserProfile = INITIAL_USERS[0];

const withAvatarFallback = (users: UserProfile[]): UserProfile[] =>
  users.map((user) => {
    const fallback = INITIAL_USERS.find((candidate) => candidate.role === user.role);
    return {
      ...user,
      avatar: user.avatar || fallback?.avatar || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    };
  });

const unwrapCollection = <T,>(payload: unknown): T[] => {
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
};

const unwrapResource = <T,>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

export const IOMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authFetch, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);
  const [isSplitScreenView, setIsSplitScreenView] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedOdpFilter, setSelectedOdpFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '2026-08-01', end: '2026-08-15' });
  const [viewFormat, setViewFormat] = useState<'table' | 'grid' | 'kanban' | 'map'>('table');
  const [navigationConfig, setNavigationConfig] = useState<NavigationConfig | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceRegistrations, setServiceRegistrations] = useState<ServiceRegistration[]>([]);
  const [tickets, setTickets] = useState<TroubleTicket[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [reimbursementRequests, setReimbursementRequests] = useState<ReimbursementRequest[]>([]);
  const [financeMutations, setFinanceMutations] = useState<FinanceMutation[]>([]);
  const [financialLedger, setFinancialLedger] = useState<FinancialLedgerEntry[]>([]);
  const [tasks, setTasks] = useState<InterDivisionTask[]>([]);
  const [networkOdps, setNetworkOdps] = useState<NetworkODP[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityAuditLog[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ioms_sound_alert_enabled') !== 'false';
  });

  const isFirstLoadRef = React.useRef(true);
  const prevWorkOrdersRef = React.useRef<WorkOrder[]>([]);
  const prevRegistrationsRef = React.useRef<ServiceRegistration[]>([]);
  const prevTicketsRef = React.useRef<TroubleTicket[]>([]);
  const prevProcurementsRef = React.useRef<ProcurementRequest[]>([]);

  const toggleSoundEnabled = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('ioms_sound_alert_enabled', String(next));
      return next;
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const requestNotificationPermission = async () => {
    return requestBrowserNotificationPermission();
  };

  const currentUser = user ?? emptyUser;
  const activeRole = currentUser.role;
  const selectedModule = useMemo<AppModule>(() => {
    const moduleFromRoute = getModuleFromPathname(location.pathname);
    if (moduleFromRoute) {
      return moduleFromRoute;
    }

    const fallbackPath = getDefaultRouteForRole(activeRole, currentUser.dashboardModuleKey, navigationConfig);
    return getModuleFromPathname(fallbackPath) ?? 'dashboard';
  }, [activeRole, currentUser.dashboardModuleKey, location.pathname, navigationConfig]);

  const setSelectedModule = (module: AppModule) => {
    const nextPath = getRoutePathForModule(module);
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#0284c7', '#f59e0b']
      });
    } catch {
      // ignore
    }
  };

  const apiRequest = async <T,>(path: string, init?: RequestInit): Promise<T> => {
    return authFetch<T>(path, init);
  };

  const refreshAll = async () => {
    if (!user) return;
    setIsSyncing(true);

    try {
      const canViewFinanceLedger = ['superadmin', 'finance', 'management'].includes(activeRole);
      const [
        usersPayload,
        customersPayload,
        registrationsPayload,
        ticketsPayload,
        workOrdersPayload,
        inventoryPayload,
        procurementPayload,
        reimbursementPayload,
        financeMutationPayload,
        financialLedgerPayload,
        tasksPayload,
        odpsPayload,
        auditPayload,
        navigationPayload,
      ] = await Promise.all([
        apiRequest<unknown>('/users'),
        apiRequest<unknown>('/customers'),
        apiRequest<unknown>('/service-registrations'),
        apiRequest<unknown>('/tickets'),
        apiRequest<unknown>('/work-orders'),
        apiRequest<unknown>('/inventory'),
        apiRequest<unknown>('/procurements'),
        apiRequest<unknown>('/reimbursements'),
        canViewFinanceLedger ? apiRequest<unknown>('/finance-mutations') : Promise.resolve({ data: [] }),
        canViewFinanceLedger ? apiRequest<unknown>('/financial-ledger') : Promise.resolve({ data: [] }),
        apiRequest<unknown>('/tasks'),
        apiRequest<unknown>('/network-odps'),
        apiRequest<unknown>('/audit-logs'),
        apiRequest<{ data: NavigationConfig }>('/auth/navigation'),
      ]);

      const nextUsers = withAvatarFallback(unwrapCollection<UserProfile>(usersPayload));
      const nextCustomers = unwrapCollection<Customer>(customersPayload);
      const nextRegistrations = unwrapCollection<ServiceRegistration>(registrationsPayload);
      const nextTickets = unwrapCollection<TroubleTicket>(ticketsPayload);
      const nextWorkOrders = unwrapCollection<WorkOrder>(workOrdersPayload);
      const nextInventory = unwrapCollection<InventoryItem>(inventoryPayload);
      const nextProcurements = unwrapCollection<ProcurementRequest>(procurementPayload);
      const nextReimbursements = unwrapCollection<ReimbursementRequest>(reimbursementPayload);
      const nextFinanceMutations = unwrapCollection<FinanceMutation>(financeMutationPayload);
      const nextFinancialLedger = unwrapCollection<FinancialLedgerEntry>(financialLedgerPayload);
      const nextTasks = unwrapCollection<InterDivisionTask>(tasksPayload);
      const nextNetworkOdps = unwrapCollection<NetworkODP>(odpsPayload);
      const nextAuditLogs = unwrapCollection<ActivityAuditLog>(auditPayload);

      setUsers(nextUsers.length > 0 ? nextUsers : INITIAL_USERS);
      setCustomers(nextCustomers);
      setServiceRegistrations(nextRegistrations);
      setTickets(nextTickets);
      setWorkOrders(nextWorkOrders);
      setInventory(nextInventory);
      setProcurementRequests(nextProcurements);
      setReimbursementRequests(nextReimbursements);
      setFinanceMutations(nextFinanceMutations);
      setFinancialLedger(nextFinancialLedger);
      setTasks(nextTasks);
      setNetworkOdps(nextNetworkOdps);
      setAuditLogs(nextAuditLogs);
      setNavigationConfig(navigationPayload.data);

      // Diffing Engine: Detect new incoming jobs/actions for active role
      if (!isFirstLoadRef.current && currentUser?.id) {
        const newNotifs: AppNotification[] = [];

        // 1. FIELD TECH: New WO assigned to this technician or revised
        if (activeRole === 'field_tech') {
          const myPrevWos = prevWorkOrdersRef.current.filter((w) => w.assignedTechId === currentUser.id);
          const myNextWos = nextWorkOrders.filter((w) => w.assignedTechId === currentUser.id || (!w.assignedTechId && w.status === 'assigned'));

          myNextWos.forEach((w) => {
            const prev = myPrevWos.find((pw) => pw.id === w.id);
            if (!prev) {
              newNotifs.push({
                id: `notif-wo-${w.id}-${Date.now()}`,
                type: 'job',
                title: '🛠️ Tugas WO Baru Diterima',
                message: `${w.id}: ${w.customerName} - ${w.type === 'installation' ? 'Pasang Baru' : 'Maintenance'} (${w.region})`,
                routeTarget: '/app/pengerjaan-instalasi-lapangan',
                targetId: w.id,
                timestamp: new Date(),
              });
            } else if (prev.status !== w.status && w.status === 'dikembalikan_ke_teknisi') {
              newNotifs.push({
                id: `notif-wo-rev-${w.id}-${Date.now()}`,
                type: 'alert',
                title: '⚠️ WO Dikembalikan NOC (Revisi)',
                message: `${w.id}: ${w.customerName} - ${w.qcNotes || 'Perlu perbaikan lapangan'}`,
                routeTarget: '/app/pengerjaan-instalasi-lapangan',
                targetId: w.id,
                timestamp: new Date(),
              });
            }
          });
        }

        // 2. LEAD TECH: New registrations needing survey or WOs needing assignment
        if (activeRole === 'lead_tech' || activeRole === 'superadmin') {
          const pendingWos = nextWorkOrders.filter((w) => w.status === 'pending_lead_assignment');
          const prevPendingWos = prevWorkOrdersRef.current.filter((w) => w.status === 'pending_lead_assignment');
          if (pendingWos.length > prevPendingWos.length) {
            const newest = pendingWos[0];
            newNotifs.push({
              id: `notif-lead-wo-${Date.now()}`,
              type: 'job',
              title: '📋 WO Baru Siap Ditugaskan',
              message: `${newest.id}: ${newest.customerName} (${newest.packagePlan}) menunggu penugasan teknisi.`,
              routeTarget: '/app/panel-kepala-teknisi',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }

          const pendingSurveys = nextRegistrations.filter((r) => r.status === 'menunggu_survey');
          const prevPendingSurveys = prevRegistrationsRef.current.filter((r) => r.status === 'menunggu_survey');
          if (pendingSurveys.length > prevPendingSurveys.length) {
            const newest = pendingSurveys[0];
            newNotifs.push({
              id: `notif-lead-surv-${Date.now()}`,
              type: 'job',
              title: '🗺️ Registrasi Siap Disurvey',
              message: `${newest.id}: ${newest.name} (${newest.region}) siap ditinjau survey lokasi.`,
              routeTarget: '/app/survey-instalasi',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }
        }

        // 3. NOC: PPPoE request or QC verification
        if (activeRole === 'noc' || activeRole === 'superadmin') {
          const pppoeReqs = nextWorkOrders.filter((w) => w.pppoeRequestStatus === 'pending_noc');
          const prevPppoeReqs = prevWorkOrdersRef.current.filter((w) => w.pppoeRequestStatus === 'pending_noc');
          if (pppoeReqs.length > prevPppoeReqs.length) {
            const newest = pppoeReqs[0];
            newNotifs.push({
              id: `notif-noc-pppoe-${Date.now()}`,
              type: 'job',
              title: '⚡ Request PPPoE Masuk',
              message: `Teknisi ${newest.assignedTechName || 'Lapangan'} meminta kredensial PPPoE untuk ${newest.customerName}.`,
              routeTarget: '/app/request-pppoe-noc',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }

          const qcWos = nextWorkOrders.filter((w) => w.status === 'menunggu_qc_noc');
          const prevQcWos = prevWorkOrdersRef.current.filter((w) => w.status === 'menunggu_qc_noc');
          if (qcWos.length > prevQcWos.length) {
            const newest = qcWos[0];
            newNotifs.push({
              id: `notif-noc-qc-${Date.now()}`,
              type: 'job',
              title: '🔍 WO Selesai - Siap QC NOC',
              message: `${newest.id}: ${newest.customerName} telah selesai dikerjakan & menunggu verifikasi QC.`,
              routeTarget: '/app/qc-instalasi-noc',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }
        }

        // 4. FINANCE: Pending installation payment or procurement approval
        if (activeRole === 'finance' || activeRole === 'superadmin') {
          const pendingPayments = nextWorkOrders.filter((w) => w.installationPaymentStatus === 'pending_finance' && w.installationPaymentCustomerPaid);
          const prevPendingPayments = prevWorkOrdersRef.current.filter((w) => w.installationPaymentStatus === 'pending_finance' && w.installationPaymentCustomerPaid);
          if (pendingPayments.length > prevPendingPayments.length) {
            const newest = pendingPayments[0];
            newNotifs.push({
              id: `notif-fin-pay-${Date.now()}`,
              type: 'job',
              title: '💰 Konfirmasi Biaya Pasang Baru',
              message: `${newest.id}: ${newest.customerName} - Rp ${(newest.installationFeeActual ?? 0).toLocaleString('id-ID')} (${newest.installationPaymentMethod === 'tunai' ? 'Disetor Teknisi' : 'Transfer'})`,
              routeTarget: '/app/penagihan',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }

          const pendingProc = nextProcurements.filter((p) => p.status === 'pending_finance');
          const prevPendingProc = prevProcurementsRef.current.filter((p) => p.status === 'pending_finance');
          if (pendingProc.length > prevPendingProc.length) {
            const newest = pendingProc[0];
            newNotifs.push({
              id: `notif-fin-proc-${Date.now()}`,
              type: 'job',
              title: '📑 Pengajuan Pengadaan Gudang Masuk',
              message: `${newest.id}: ${newest.itemName} (${newest.quantity} ${newest.unit}) - Rp ${newest.totalAmount.toLocaleString('id-ID')}`,
              routeTarget: '/app/finance',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }
        }

        // 5. HELPDESK: Registrations needing validation or resolved tickets
        if (activeRole === 'helpdesk' || activeRole === 'superadmin') {
          const waitingVal = nextRegistrations.filter((r) => r.status === 'menunggu_validasi');
          const prevWaitingVal = prevRegistrationsRef.current.filter((r) => r.status === 'menunggu_validasi');
          if (waitingVal.length > prevWaitingVal.length) {
            const newest = waitingVal[0];
            newNotifs.push({
              id: `notif-hd-reg-${Date.now()}`,
              type: 'job',
              title: '📞 Registrasi Baru Menunggu Validasi',
              message: `${newest.id}: ${newest.name} (${newest.packagePlan}) baru didaftarkan.`,
              routeTarget: '/app/validasi-registrasi',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }
        }

        // 6. INVENTORY: Return requests
        if (activeRole === 'inventory' || activeRole === 'superadmin') {
          const returWos = nextWorkOrders.filter((w) => w.maintenancePayload?.warehouseReturnStatus === 'menunggu_qc_gudang');
          const prevReturWos = prevWorkOrdersRef.current.filter((w) => w.maintenancePayload?.warehouseReturnStatus === 'menunggu_qc_gudang');
          if (returWos.length > prevReturWos.length) {
            const newest = returWos[0];
            newNotifs.push({
              id: `notif-wh-retur-${Date.now()}`,
              type: 'job',
              title: '📦 Retur Perangkat Masuk ke Gudang',
              message: `${newest.id}: Retur alat untuk ${newest.customerName} menunggu QC gudang.`,
              routeTarget: '/app/retur-gudang-perangkat',
              targetId: newest.id,
              timestamp: new Date(),
            });
          }
        }

        if (newNotifs.length > 0) {
          playNotificationChime('job');
          setNotifications((prev) => [...newNotifs, ...prev].slice(0, 8));

          const first = newNotifs[0];
          showBrowserNotification(first.title, first.message, () => {
            if (first.routeTarget) navigate(first.routeTarget);
          });
        }
      }

      prevWorkOrdersRef.current = nextWorkOrders;
      prevRegistrationsRef.current = nextRegistrations;
      prevTicketsRef.current = nextTickets;
      prevProcurementsRef.current = nextProcurements;
      isFirstLoadRef.current = false;
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Failed to sync IOMS data', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Smart Polling Interval: Auto-sync every 6s when active, 15s when idle
  useEffect(() => {
    if (!user) return;

    void refreshAll();

    // Polling interval
    const intervalMs = document.visibilityState === 'visible' ? 6000 : 15000;
    const timer = setInterval(() => {
      void refreshAll();
    }, intervalMs);

    // Instant sync when user tabs back into the browser or unlocks screen
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void refreshAll();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [user, activeRole]);

  useEffect(() => {
    setIsMobileDeviceView(activeRole === 'field_tech');

    if (activeRole !== 'noc') {
      setIsSplitScreenView(false);
    }
  }, [activeRole, navigationConfig]);

  const runMutation = (work: () => Promise<void>) => {
    return (async () => {
      try {
        await work();
      } catch (error) {
        console.error(error);
        if (error instanceof Error && error.message.includes('Sesi Anda telah berakhir')) {
          await logout();
        }
      }
    })();
  };

  const runStrictMutation = async <T,>(work: () => Promise<T>): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('Sesi Anda telah berakhir')) {
        await logout();
      }
      throw error;
    }
  };

  const createServiceRegistration = (payload: Partial<ServiceRegistration>) => runMutation(async () => {
    await apiRequest('/service-registrations', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name,
        nik: payload.nik,
        phone: payload.phone,
        address: payload.address,
        region: payload.region,
        package_plan: payload.packagePlan,
        monthly_fee: payload.monthlyFee,
        odp_id: payload.odpId,
      }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const submitServiceRegistration = (registrationId: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await refreshAll();
  });

  const financeApproveServiceRegistration = (registrationId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/finance-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const financeRejectServiceRegistration = (registrationId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/finance-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const generateRegistrationPppoe = (registrationId: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/generate-pppoe`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await refreshAll();
  });

  const nocApproveServiceRegistration = (registrationId: string, notes?: string, odpPortCandidate?: number) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/noc-approve`, {
      method: 'POST',
      body: JSON.stringify({
        notes,
        odp_port_candidate: odpPortCandidate,
      }),
    });
    await refreshAll();
  });

  const nocRejectServiceRegistration = (registrationId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/noc-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const createInstallationWorkOrderFromRegistration = (registrationId: string) => runMutation(async () => {
    await apiRequest(`/service-registrations/${registrationId}/create-work-order`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await refreshAll();
  });

  const createCustomer = (customerData: Partial<Customer>, initialDepositPaid: boolean) => runMutation(async () => {
    await apiRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: customerData.name,
        nik: customerData.nik,
        phone: customerData.phone,
        address: customerData.address,
        region: customerData.region,
        package_plan: customerData.packagePlan,
        monthly_fee: customerData.monthlyFee,
        odp_id: customerData.odpId,
        initial_deposit_paid: initialDepositPaid,
      }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const updateCustomerStatus = (customerId: string, status: CustomerStatus, notes?: string) => runMutation(async () => {
    await apiRequest(`/customers/${customerId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
    await refreshAll();
  });

  const recordCustomerPayment = (customerId: string, notes?: string, paidAt?: string, paymentChannel?: string) => runMutation(async () => {
    await apiRequest(`/customers/${customerId}/record-payment`, {
      method: 'POST',
      body: JSON.stringify({ notes, paid_at: paidAt, payment_channel: paymentChannel }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const createTroubleTicket = (ticketData: Partial<TroubleTicket>) => runMutation(async () => {
    await apiRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        customer_id: ticketData.customerId,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
      }),
    });
    await refreshAll();
  });

  const resolveTicketRemotely = (ticketId: string, notes: string) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/remote-resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const escalateTicketToLeadTech = (
    ticketId: string,
    nocNotes: string,
    options?: {
      requiresReplacementRequest?: boolean;
      replacementItems?: Array<{
        itemName: string;
        quantity: number;
        unit: string;
      }>;
    },
  ) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({
        notes: nocNotes,
        requires_replacement_request: options?.requiresReplacementRequest ?? false,
        replacement_items: options?.replacementItems?.map((it) => ({
          item_name: it.itemName,
          quantity: it.quantity,
          unit: it.unit,
        })) ?? [],
      }),
    });
    await refreshAll();
  });

  const helpdeskCloseTicket = (ticketId: string, notes: string, connectionNormal: boolean) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/helpdesk-close`, {
      method: 'POST',
      body: JSON.stringify({ notes, connection_normal: connectionNormal }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const createWorkOrder = (_woData: Partial<WorkOrder>) => {
    console.warn('Manual work order creation is not implemented in phase 1 API.');
  };

  const assignWorkOrderToTech = (woId: string, techId: string) => runMutation(async () => {
    await apiRequest(`/work-orders/${woId}/assign-tech`, {
      method: 'POST',
      body: JSON.stringify({ tech_id: techId }),
    });
    await refreshAll();
  });

  const requestWorkOrderPppoe = (workOrderId: string, notes?: string) => runStrictMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/request-pppoe`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const approveWorkOrderPppoe = (
    workOrderId: string,
    payload: {
      pppoeUsername: string;
      pppoePassword: string;
      vlan?: string | null;
      notes?: string;
    },
  ) => runStrictMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/approve-pppoe`, {
      method: 'POST',
      body: JSON.stringify({
        pppoe_username: payload.pppoeUsername,
        pppoe_password: payload.pppoePassword,
        vlan: payload.vlan,
        notes: payload.notes,
      }),
    });
    await refreshAll();
  });

  const rejectWorkOrderPppoe = (workOrderId: string, notes: string) => runStrictMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/reject-pppoe`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const confirmInstallationCashPayment = (workOrderId: string, notes?: string, paymentChannel?: string) => runStrictMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/confirm-installation-cash`, {
      method: 'POST',
      body: JSON.stringify({ notes, payment_channel: paymentChannel }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const confirmInstallationTransferPayment = (workOrderId: string, notes?: string, paymentChannel?: string) => runStrictMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/confirm-installation-transfer`, {
      method: 'POST',
      body: JSON.stringify({ notes, payment_channel: paymentChannel }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const submitFieldTechReport = (woOrTicketId: string, isWorkOrder: boolean, report: {
    actionTaken: string;
    patchCordReplaced?: boolean;
    dropCableLengthMeters?: number;
    finalOpticalPowerDbm: number;
    modemReplaced?: boolean;
    newOntSerialNumber?: string;
    photoKtp?: string;
    photoOpticalPowerMeter?: string;
    photoModemInstallation?: string;
    signature?: string;
  }) => runMutation(async () => {
    if (!isWorkOrder) return;

    await apiRequest(`/work-orders/${woOrTicketId}/submit-report`, {
      method: 'POST',
      body: JSON.stringify({
        action_taken: report.actionTaken,
        patch_cord_replaced: report.patchCordReplaced,
        drop_cable_length_meters: report.dropCableLengthMeters,
        final_optical_power_dbm: report.finalOpticalPowerDbm,
        modem_replaced: report.modemReplaced,
        new_ont_serial_number: report.newOntSerialNumber,
        photo_ktp: report.photoKtp,
        photo_optical_power_meter: report.photoOpticalPowerMeter,
        photo_modem_installation: report.photoModemInstallation,
        signature: report.signature,
      }),
    });
    await refreshAll();
  });

  const approveLeadTechSOP = (ticketId: string, sopChecklist: {
    cablesNeatlyClamped: boolean;
    protectionSleeveInstalled: boolean;
    customerAreaCleaned: boolean;
    speedtestVerified: boolean;
  }, notes?: string) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/lead-approve`, {
      method: 'POST',
      body: JSON.stringify({
        sop_checklist: sopChecklist,
        notes,
      }),
    });
    await refreshAll();
  });

  const verifyAndCloseNOC = (ticketId: string, verification: {
    opticalDbmReading: number;
    pppoeSessionActive: boolean;
    rxPowerThresholdPassed: boolean;
    notes?: string;
  }) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/noc-close`, {
      method: 'POST',
      body: JSON.stringify({
        optical_dbm_reading: verification.opticalDbmReading,
        pppoe_session_active: verification.pppoeSessionActive,
        rx_power_threshold_passed: verification.rxPowerThresholdPassed,
        notes: verification.notes,
      }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const nocFinalVerifyInstallation = (workOrderId: string, verification: {
    opticalDbmReading: number;
    pppoeSessionActive: boolean;
    rxPowerThresholdPassed: boolean;
    notes?: string;
  }) => runMutation(async () => {
    await apiRequest(`/work-orders/${workOrderId}/noc-final-verify`, {
      method: 'POST',
      body: JSON.stringify({
        optical_dbm_reading: verification.opticalDbmReading,
        pppoe_session_active: verification.pppoeSessionActive,
        rx_power_threshold_passed: verification.rxPowerThresholdPassed,
        notes: verification.notes,
      }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const createProcurementRequest = (req: Partial<ProcurementRequest>) => runMutation(async () => {
    await apiRequest('/procurements', {
      method: 'POST',
      body: JSON.stringify({
        item_code: req.itemCode,
        item_name: req.itemName,
        quantity: req.quantity,
        unit: req.unit,
        unit_price: req.unitPrice,
        reason: req.reason,
      }),
    });
    await refreshAll();
  });

  const updateProcurementRequest = (reqId: string, req: Partial<ProcurementRequest>) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}`, {
      method: 'PUT',
      body: JSON.stringify({
        item_code: req.itemCode,
        item_name: req.itemName,
        quantity: req.quantity,
        unit: req.unit,
        unit_price: req.unitPrice,
        reason: req.reason,
      }),
    });
    await refreshAll();
  });

  const approveProcurementByFinance = (reqId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/finance-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const rejectProcurementByFinance = (reqId: string, notes: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/finance-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const approveProcurementByManagement = (reqId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/management-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const rejectProcurementByManagement = (reqId: string, notes: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/management-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const confirmProcurementPayment = (
    reqId: string,
    payload: { paymentProof?: File | string; paymentChannel?: string; notes?: string }
  ) => runStrictMutation(async () => {
    const isFile = typeof File !== 'undefined' && payload.paymentProof instanceof File;
    let body: any;
    if (isFile) {
      const formData = new FormData();
      formData.append('payment_proof', payload.paymentProof as File);
      if (payload.paymentChannel) formData.append('payment_channel', payload.paymentChannel);
      if (payload.notes) formData.append('notes', payload.notes);
      body = formData;
    } else {
      body = JSON.stringify({
        payment_proof: payload.paymentProof,
        payment_channel: payload.paymentChannel,
        notes: payload.notes,
      });
    }

    await apiRequest(`/procurements/${reqId}/confirm-payment`, {
      method: 'POST',
      body,
    });
    await refreshAll();
    triggerCelebration();
  });

  const markProcurementAsOrdered = (reqId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/mark-ordered`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const receiveProcurementStock = (reqId: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/receive`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await refreshAll();
  });

  const createReimbursementDraft = (payload: FormData) => runStrictMutation(async () => {
    const response = await apiRequest<unknown>('/reimbursements', {
      method: 'POST',
      body: payload,
    });
    await refreshAll();
    return unwrapResource<ReimbursementRequest>(response);
  });

  const updateReimbursementDraft = (requestId: string, payload: FormData) => runStrictMutation(async () => {
    const response = await apiRequest<unknown>(`/reimbursements/${requestId}`, {
      method: 'POST',
      body: payload,
    });
    await refreshAll();
    return unwrapResource<ReimbursementRequest>(response);
  });

  const submitReimbursementRequest = (requestId: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/submit`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    await refreshAll();
  });

  const financeApproveReimbursement = (requestId: string, notes?: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/finance-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const financeRejectReimbursement = (requestId: string, notes: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/finance-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const forwardReimbursementToManagement = (requestId: string, notes: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/forward-to-management`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const managementApproveReimbursement = (requestId: string, notes?: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/management-approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const managementRejectReimbursement = (requestId: string, notes: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/management-reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
  });

  const markReimbursementPaid = (requestId: string, notes?: string) => runStrictMutation(async () => {
    await apiRequest(`/reimbursements/${requestId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    await refreshAll();
    triggerCelebration();
  });

  const createFinanceMutation = (payload: Partial<FinanceMutation>) => runStrictMutation(async () => {
    await apiRequest('/finance-mutations', {
      method: 'POST',
      body: JSON.stringify({
        transaction_date: payload.transactionDate,
        type: payload.type,
        category: payload.category,
        amount: payload.amount,
        description: payload.description,
        reference: payload.reference,
        status: payload.status,
      }),
    });
    await refreshAll();
  });

  const updateFinanceMutation = (mutationId: string, payload: Partial<FinanceMutation>) => runStrictMutation(async () => {
    await apiRequest(`/finance-mutations/${mutationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        transaction_date: payload.transactionDate,
        type: payload.type,
        category: payload.category,
        amount: payload.amount,
        description: payload.description,
        reference: payload.reference,
        status: payload.status,
      }),
    });
    await refreshAll();
  });

  const deleteFinanceMutation = (mutationId: string) => runStrictMutation(async () => {
    await apiRequest(`/finance-mutations/${mutationId}`, {
      method: 'DELETE',
    });
    await refreshAll();
  });

  const createInterDivisionTask = (task: Partial<InterDivisionTask>) => runMutation(async () => {
    await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        from_division: task.fromDivision,
        to_division: task.toDivision,
        priority: task.priority,
        due_date: task.dueDate,
        assigned_to: task.assignedTo,
        related_customer_id: task.relatedCustomerId,
        related_ticket_id: task.relatedTicketId,
      }),
    });
    await refreshAll();
  });
  const createTask = createInterDivisionTask;

  const updateTaskStatus = (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done', resolutionNotes?: string) => runMutation(async () => {
    await apiRequest(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        resolution_notes: resolutionNotes,
      }),
    });
    await refreshAll();
  });

  const resetToDefaultData = () => {
    runMutation(async () => {
      await refreshAll();
    });
  };

  return (
    <IOMSContext.Provider
      value={{
        currentUser,
        activeRole,
        users,
        isMobileDeviceView,
        setIsMobileDeviceView,
        isSplitScreenView,
        setIsSplitScreenView,
        selectedModule,
        setSelectedModule,
        selectedRegion,
        setSelectedRegion,
        selectedOdpFilter,
        setSelectedOdpFilter,
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,
        viewFormat,
        setViewFormat,
        navigationConfig,
        customers,
        serviceRegistrations,
        tickets,
        workOrders,
        inventory,
        procurementRequests,
        reimbursementRequests,
        financeMutations,
        financialLedger,
        tasks,
        networkOdps,
        auditLogs,
        createServiceRegistration,
        submitServiceRegistration,
        financeApproveServiceRegistration,
        financeRejectServiceRegistration,
        generateRegistrationPppoe,
        nocApproveServiceRegistration,
        nocRejectServiceRegistration,
        createInstallationWorkOrderFromRegistration,
        createCustomer,
        updateCustomerStatus,
        recordCustomerPayment,
        createTroubleTicket,
        resolveTicketRemotely,
        escalateTicketToLeadTech,
        helpdeskCloseTicket,
        createWorkOrder,
        assignWorkOrderToTech,
        requestWorkOrderPppoe,
        approveWorkOrderPppoe,
        rejectWorkOrderPppoe,
        confirmInstallationCashPayment,
        confirmInstallationTransferPayment,
        submitFieldTechReport,
        approveLeadTechSOP,
        verifyAndCloseNOC,
        nocFinalVerifyInstallation,
        createProcurementRequest,
        updateProcurementRequest,
        approveProcurementByFinance,
        rejectProcurementByFinance,
        approveProcurementByManagement,
        rejectProcurementByManagement,
        confirmProcurementPayment,
        markProcurementAsOrdered,
        receiveProcurementStock,
        createReimbursementDraft,
        updateReimbursementDraft,
        submitReimbursementRequest,
        financeApproveReimbursement,
        financeRejectReimbursement,
        forwardReimbursementToManagement,
        managementApproveReimbursement,
        managementRejectReimbursement,
        markReimbursementPaid,
        createFinanceMutation,
        updateFinanceMutation,
        deleteFinanceMutation,
        createInterDivisionTask,
        createTask,
        updateTaskStatus,
        resetToDefaultData,
        triggerCelebration,
        isSyncing,
        lastSyncedAt,
        notifications,
        dismissNotification,
        clearAllNotifications,
        isSoundEnabled,
        toggleSoundEnabled,
        refreshAll,
        requestNotificationPermission,
      }}
    >
      {children}
    </IOMSContext.Provider>
  );
};

export const useIOMS = () => {
  const context = useContext(IOMSContext);
  if (!context) {
    throw new Error('useIOMS must be used within an IOMSProvider');
  }
  return context;
};

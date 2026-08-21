import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  AppModule,
  UserRole,
  UserProfile,
  Customer,
  TroubleTicket,
  WorkOrder,
  InventoryItem,
  ProcurementRequest,
  InterDivisionTask,
  NetworkODP,
  ActivityAuditLog,
  CustomerStatus
} from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { useAuth } from './AuthContext';
import { getDefaultModuleForRole, isModuleAllowedForRole } from '../config/roleWorkspace';

interface IOMSContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  users: UserProfile[];
  isMobileDeviceView: boolean;
  setIsMobileDeviceView: (val: boolean) => void;
  isSplitScreenView: boolean;
  setIsSplitScreenView: (val: boolean) => void;
  selectedModule: AppModule;
  setSelectedModule: React.Dispatch<React.SetStateAction<AppModule>>;
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
  customers: Customer[];
  tickets: TroubleTicket[];
  workOrders: WorkOrder[];
  inventory: InventoryItem[];
  procurementRequests: ProcurementRequest[];
  tasks: InterDivisionTask[];
  networkOdps: NetworkODP[];
  auditLogs: ActivityAuditLog[];
  createCustomer: (customerData: Partial<Customer>, initialDepositPaid: boolean) => void;
  updateCustomerStatus: (customerId: string, status: CustomerStatus, notes?: string) => void;
  createTroubleTicket: (ticketData: Partial<TroubleTicket>) => void;
  resolveTicketRemotely: (ticketId: string, notes: string) => void;
  escalateTicketToLeadTech: (ticketId: string, nocNotes: string) => void;
  createWorkOrder: (woData: Partial<WorkOrder>) => void;
  assignWorkOrderToTech: (woId: string, techId: string) => void;
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
  createProcurementRequest: (req: Partial<ProcurementRequest>) => void;
  approveProcurementByFinance: (reqId: string, notes?: string) => void;
  approveProcurementByManagement: (reqId: string, notes?: string) => void;
  receiveProcurementStock: (reqId: string) => void;
  createInterDivisionTask: (task: Partial<InterDivisionTask>) => void;
  createTask: (task: Partial<InterDivisionTask>) => void;
  updateTaskStatus: (taskId: string, newStatus: 'todo' | 'in_progress' | 'review' | 'done', resolutionNotes?: string) => void;
  resetToDefaultData: () => void;
  triggerCelebration: () => void;
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

export const IOMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, authFetch, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [isMobileDeviceView, setIsMobileDeviceView] = useState<boolean>(false);
  const [isSplitScreenView, setIsSplitScreenView] = useState<boolean>(false);
  const [selectedModule, setSelectedModule] = useState<AppModule>(getDefaultModuleForRole(emptyUser.role));
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedOdpFilter, setSelectedOdpFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '2026-08-01', end: '2026-08-15' });
  const [viewFormat, setViewFormat] = useState<'table' | 'grid' | 'kanban' | 'map'>('table');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<TroubleTicket[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>([]);
  const [tasks, setTasks] = useState<InterDivisionTask[]>([]);
  const [networkOdps, setNetworkOdps] = useState<NetworkODP[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityAuditLog[]>([]);
  const currentUser = user ?? emptyUser;
  const activeRole = currentUser.role;

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
    const [
      usersPayload,
      customersPayload,
      ticketsPayload,
      workOrdersPayload,
      inventoryPayload,
      procurementPayload,
      tasksPayload,
      odpsPayload,
      auditPayload,
    ] = await Promise.all([
      apiRequest<unknown>('/users'),
      apiRequest<unknown>('/customers'),
      apiRequest<unknown>('/tickets'),
      apiRequest<unknown>('/work-orders'),
      apiRequest<unknown>('/inventory'),
      apiRequest<unknown>('/procurements'),
      apiRequest<unknown>('/tasks'),
      apiRequest<unknown>('/network-odps'),
      apiRequest<unknown>('/audit-logs'),
    ]);

    const nextUsers = withAvatarFallback(unwrapCollection<UserProfile>(usersPayload));
    setUsers(nextUsers.length > 0 ? nextUsers : INITIAL_USERS);
    setCustomers(unwrapCollection<Customer>(customersPayload));
    setTickets(unwrapCollection<TroubleTicket>(ticketsPayload));
    setWorkOrders(unwrapCollection<WorkOrder>(workOrdersPayload));
    setInventory(unwrapCollection<InventoryItem>(inventoryPayload));
    setProcurementRequests(unwrapCollection<ProcurementRequest>(procurementPayload));
    setTasks(unwrapCollection<InterDivisionTask>(tasksPayload));
    setNetworkOdps(unwrapCollection<NetworkODP>(odpsPayload));
    setAuditLogs(unwrapCollection<ActivityAuditLog>(auditPayload));
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      try {
        await refreshAll();
      } catch (error) {
        console.error('Failed to initialize IOMS frontend', error);
      }
    })();
  }, [user]);

  useEffect(() => {
    const nextDefaultModule = getDefaultModuleForRole(activeRole);
    setIsMobileDeviceView(activeRole === 'field_tech');

    if (activeRole !== 'noc') {
      setIsSplitScreenView(false);
    }

    setSelectedModule((currentModule) => (
      isModuleAllowedForRole(activeRole, currentModule) ? currentModule : nextDefaultModule
    ));
  }, [activeRole]);

  const runMutation = (work: () => Promise<void>) => {
    void (async () => {
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

  const escalateTicketToLeadTech = (ticketId: string, nocNotes: string) => runMutation(async () => {
    await apiRequest(`/tickets/${ticketId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ notes: nocNotes }),
    });
    await refreshAll();
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

  const approveProcurementByFinance = (reqId: string, notes?: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/finance-approve`, {
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

  const receiveProcurementStock = (reqId: string) => runMutation(async () => {
    await apiRequest(`/procurements/${reqId}/receive`, {
      method: 'POST',
      body: JSON.stringify({}),
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
        customers,
        tickets,
        workOrders,
        inventory,
        procurementRequests,
        tasks,
        networkOdps,
        auditLogs,
        createCustomer,
        updateCustomerStatus,
        createTroubleTicket,
        resolveTicketRemotely,
        escalateTicketToLeadTech,
        createWorkOrder,
        assignWorkOrderToTech,
        submitFieldTechReport,
        approveLeadTechSOP,
        verifyAndCloseNOC,
        createProcurementRequest,
        approveProcurementByFinance,
        approveProcurementByManagement,
        receiveProcurementStock,
        createInterDivisionTask,
        createTask,
        updateTaskStatus,
        resetToDefaultData,
        triggerCelebration,
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

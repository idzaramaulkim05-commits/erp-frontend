export type KnownUserRole =
  | 'superadmin'
  | 'management'
  | 'sales'
  | 'noc'
  | 'helpdesk'
  | 'lead_tech'
  | 'field_tech'
  | 'finance'
  | 'inventory';

export type UserRole = KnownUserRole | (string & {});

export type AppModule =
  | 'dashboard'
  | 'service_registrations'
  | 'helpdesk'
  | 'noc'
  | 'lead_tech'
  | 'field_tech'
  | 'finance'
  | 'inventory'
  | 'kanban'
  | 'network_map'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_master'
  | 'admin_modules'
  | 'admin_module_roles'
  | 'admin_mappings'
  | 'admin_audit';

export type ImplementedAppModule = AppModule;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  division: string;
  avatar: string;
  phone: string;
  isOnline: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export type ServiceRegistrationStatus =
  | 'draft'
  | 'submitted'
  | 'pending_finance'
  | 'finance_approved'
  | 'finance_rejected'
  | 'pending_noc'
  | 'noc_approved'
  | 'noc_rejected'
  | 'ready_for_dispatch'
  | 'field_in_progress'
  | 'field_submitted'
  | 'noc_final_verifying'
  | 'completed'
  | 'cancelled';

export interface ServiceRegistration {
  id: string;
  name: string;
  nik: string;
  phone: string;
  address: string;
  region: string;
  packagePlan: string;
  monthlyFee: number;
  odpId: string;
  odpPortCandidate?: number | null;
  status: ServiceRegistrationStatus;
  financeStatus: 'pending' | 'approved' | 'rejected';
  financeNotes?: string | null;
  financeApprovedBy?: string | null;
  financeApprovedAt?: string | null;
  nocStatus: 'pending' | 'approved' | 'rejected';
  nocNotes?: string | null;
  nocApprovedBy?: string | null;
  nocApprovedAt?: string | null;
  pppoeUsername?: string | null;
  pppoePassword?: string | null;
  generatedAt?: string | null;
  customerId?: string | null;
  workOrderId?: string | null;
  requestedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PipelineStageItem {
  id: string;
  label: string;
  description: string;
  count: number;
  statuses: ServiceRegistrationStatus[];
  accentClass: string;
}

export interface PipelineRoleDashboardSection {
  id: string;
  title: string;
  description: string;
  items: ServiceRegistration[];
}

export interface PipelineActionState {
  label: string;
  tone: 'primary' | 'success' | 'danger' | 'muted';
  disabled?: boolean;
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  onlineUsers: number;
  auditCount: number;
  masterDataGroupCount: number;
  servicePackageCount: number;
  regionCount: number;
  inventoryReferenceCount: number;
  workflowReferenceCount: number;
  latestAuditLogs: AdminAuditItem[];
}

export interface AdminUser extends UserProfile {
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RoleMeta {
  role: UserRole;
  roleTitle: string;
  division: string;
  description?: string | null;
  isActive: boolean;
  sortOrder?: number;
}

export interface NavigationHead {
  key: string;
  label: string;
  order: number;
  isActive: boolean;
}

export interface AdminModule {
  key: string;
  label: string;
  description: string;
  navigationHeadKey: string;
  order: number;
  routeTarget: string;
  quickAction: 'new_ticket' | 'new_customer' | 'new_task' | 'new_procurement' | null;
  viewFormats: Array<'table' | 'grid' | 'kanban' | 'map'>;
  isActive: boolean;
  showInNavbar: boolean;
  adminOnlyDashboard: boolean;
}

export interface RoleModuleMapping {
  role: UserRole;
  moduleKey: string;
  isVisible: boolean;
  orderOverride?: number | null;
}

export interface NavigationConfig {
  role: UserRole;
  heads: NavigationHead[];
  modules: AdminModule[];
  allowedModuleKeys: string[];
}

export interface MasterDataGroup {
  key: string;
  label: string;
  items: Array<Record<string, string | number | boolean | null>>;
  editableFields: string[];
  updatedAt?: string | null;
}

export interface SystemSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  division: string;
  isOnline: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface AdminAuditItem {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export type CustomerStatus = 'active' | 'unpaid' | 'pause' | 'uninstal_pending' | 'uninstalled';

export interface Customer {
  id: string; // e.g. "CUST-1042"
  name: string;
  nik: string;
  phone: string;
  address: string;
  region: string; // e.g. "Sidoarjo Kota", "Krian", "Waru", "Gedangan"
  packagePlan: string; // "Home 20 Mbps", "Home 50 Mbps", "Gamer 100 Mbps", "Business 200 Mbps"
  monthlyFee: number; // in IDR
  pppoeUsername: string; // e.g. "cust1042@isp.net"
  pppoePassword: string; // Randomized secure password
  ipAddress: string; // e.g. "10.20.14.88"
  ontBrand: 'ZTE' | 'Huawei' | 'FiberHome';
  ontModel: string; // "ZTE F609", "Huawei HG8245H5", "ZTE F670L"
  ontSerialNumber: string; // e.g. "ZTEGCA48B21F"
  odcId: string; // e.g. "ODC-SDA-01"
  odpId: string; // e.g. "ODP-SDA-01/08"
  odpPort: number; // 1 to 16
  fiberCoreColor: string; // "Biru", "Oranye", "Hijau", "Cokelat", "Abu-abu", "Putih", "Merah", "Hitam"
  opticalPowerDbm: number; // e.g. -21.4 (Normal SOP is -18 dBm to -24 dBm)
  status: CustomerStatus;
  billingStatus: 'paid' | 'unpaid' | 'pending';
  billingDueDate: string;
  ktpImage?: string;
  installedDate: string;
  assignedTechnician?: string;
  lastPaymentDate?: string;
}

export type TicketCategory =
  | 'los_red_light' // Lampu LOS Merah (FO Putus / Patah)
  | 'slow_connection' // Redaman Naik / Lambat
  | 'no_internet_pon_on' // PON Hijau tapi tidak ada internet (PPPoE / Config)
  | 'wifi_issue' // Ganti Password WiFi / SSID
  | 'relocation' // Pindah Titik / Relokasi Modem
  | 'billing_query' // Masalah Pembayaran / Bukti Transfer
  | 'uninstallation'; // Pencabutan Perangkat

export type TicketStatus =
  | 'open' // Helpdesk create
  | 'in_noc_review' // NOC assessing remote vs field
  | 'assigned_to_lead' // Escalated to Lead Tech
  | 'field_progress' // Field Tech working on site
  | 'lead_sop_approved' // Lead Tech checked physical SOP
  | 'noc_verifying' // NOC checking optical dBm & PPPoE session
  | 'closed' // Ticket verified & completed
  | 'cancelled';

export interface TroubleTicket {
  id: string; // e.g. "TKT-2026-0881"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  region: string;
  odpId: string;
  category: TicketCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TicketStatus;
  createdAt: string;
  createdBy: string;
  assignedTo?: string; // Lead Tech or Field Tech
  assignedTechName?: string;
  canBeResolvedRemotely?: boolean;
  nocDiagnosticNotes?: string;
  fieldWorkReport?: {
    actionTaken: string;
    patchCordReplaced: boolean;
    dropCableLengthMeters?: number;
    initialOpticalPowerDbm?: number;
    finalOpticalPowerDbm?: number;
    modemReplaced?: boolean;
    newOntSerialNumber?: string;
    photoKtp?: string;
    photoOpticalPowerMeter?: string;
    photoModemInstallation?: string;
    completedAt?: string;
    technicianSignature?: string;
  };
  leadTechApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: string;
    sopChecklist: {
      cablesNeatlyClamped: boolean;
      protectionSleeveInstalled: boolean;
      customerAreaCleaned: boolean;
      speedtestVerified: boolean;
    };
    notes?: string;
  };
  nocFinalVerification?: {
    verified: boolean;
    verifiedBy: string;
    verifiedAt: string;
    opticalDbmReading: number;
    pppoeSessionActive: boolean;
    rxPowerThresholdPassed: boolean;
    notes?: string;
  };
}

export type WorkOrderType = 'installation' | 'maintenance' | 'uninstallation';
export type WorkOrderStatus =
  | 'pending'
  | 'pending_lead_assignment'
  | 'assigned'
  | 'in_progress'
  | 'sop_submitted'
  | 'field_submitted'
  | 'waiting_noc_activation'
  | 'approved'
  | 'completed';

export interface WorkOrder {
  id: string; // e.g. "WO-2026-0412"
  type: WorkOrderType;
  customerId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  region: string;
  odpId: string;
  assignedLead: string;
  assignedTechId?: string;
  assignedTechName?: string;
  ticketId?: string;
  serviceRegistrationId?: string;
  status: WorkOrderStatus;
  scheduledDate: string;
  packagePlan?: string;
  requiredMaterials: {
    itemName: string;
    quantity: number;
    unit: string;
  }[];
  usedMaterials?: {
    itemName: string;
    quantity: number;
    serialNumbers?: string[];
  }[];
  photos?: {
    ktp?: string;
    opmReading?: string;
    installedDevice?: string;
  };
  finalVerification?: {
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    opticalDbmReading?: number;
    pppoeSessionActive?: boolean;
    rxPowerThresholdPassed?: boolean;
    notes?: string;
  };
  sopVerifiedByLead?: boolean;
  nocActivated?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface InventoryItem {
  id: string; // e.g. "INV-MODEM-01"
  code: string;
  name: string;
  category: 'ONT' | 'Patch Cord' | 'Drop Cable' | 'ODP' | 'ODC' | 'SFP' | 'Tool & Meter';
  brand: string;
  model: string;
  stockAvailable: number;
  stockInUse: number;
  stockReserved: number;
  minThreshold: number;
  unit: string; // "Unit", "Pcs", "Meter", "Roll"
  unitPrice: number; // in IDR
  locationRack: string; // e.g. "Rak A-02", "Gudang Utama"
  serialNumbers?: {
    sn: string;
    status: 'available' | 'assigned_to_cust' | 'in_field_tech' | 'defective' | 'returned_reusable';
    currentCustId?: string;
    assignedTech?: string;
  }[];
}

export interface ProcurementRequest {
  id: string; // e.g. "REQ-2026-0034"
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending_finance' | 'pending_management' | 'approved' | 'rejected' | 'ordered' | 'received';
  financeApproval?: {
    approved: boolean;
    by: string;
    at: string;
    requiresManagementApproval: boolean;
    notes?: string;
  };
  managementApproval?: {
    approved: boolean;
    by: string;
    at: string;
    notes?: string;
  };
  receivedAt?: string;
}

export interface InterDivisionTask {
  id: string; // e.g. "TASK-091"
  title: string;
  description: string;
  fromDivision: string; // "Helpdesk", "NOC", "Finance", "Gudang", "Teknisi"
  toDivision: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done';
  relatedCustomerId?: string;
  relatedTicketId?: string;
  createdAt: string;
  dueDate: string;
  createdBy: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface NetworkODP {
  id: string; // "ODP-SDA-01/01"
  odcId: string;
  region: string;
  totalPorts: number;
  usedPorts: number;
  splitterRatio: string; // "1:8" or "1:16"
  oltHost: string; // "OLT-ZTE-C320-SDA"
  ponSlot: string; // "GPON 1/1/2"
  fiberCoreColor: string; // e.g. "Biru"
  latitude: number;
  longitude: number;
  address: string;
  portMappings: {
    portNumber: number;
    customerId?: string;
    customerName?: string;
    pppoeUsername?: string;
    opticalPowerDbm?: number;
    status: 'empty' | 'active' | 'faulty';
  }[];
}

export interface ActivityAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

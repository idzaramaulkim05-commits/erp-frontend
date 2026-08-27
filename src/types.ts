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
  | 'about'
  | 'pelanggan'
  | 'penagihan'
  | 'request_pppoe_noc'
  | 'request_rembes'
  | 'approval_rembes_finance'
  | 'laporan_keuangan'
  | 'retur_gudang_perangkat'
  | 'panel_kepala_teknisi'
  | 'panel_teknisi_lapangan'
  | 'pengerjaan_instalasi_lapangan'
  | 'qc_instalasi_noc'
  | 'registrasi_pelanggan_baru'
  | 'validasi_registrasi'
  | 'survey_instalasi'
  | 'request_gudang_instalasi'
  | 'aktivasi_instalasi'
  | 'service_registrations'
  | 'helpdesk'
  | 'buat_tiket'
  | 'noc'
  | 'lead_tech'
  | 'field_tech'
  | 'finance'
  | 'inventory'
  | 'request_pengadaan_barang'
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
  dashboardModuleKey?: AppModule | null;
  avatar: string;
  phone: string;
  isOnline: boolean;
  isActive?: boolean;
  lastLoginAt?: string | null;
}

export type ServiceRegistrationStatus =
  | 'draft'
  | 'menunggu_validasi'
  | 'perlu_perbaikan_data'
  | 'menunggu_survey'
  | 'survey_layak'
  | 'survey_tidak_layak'
  | 'siap_wo_instalasi'
  | 'sedang_diinstal'
  | 'menunggu_qc_noc'
  | 'selesai'
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
  gender: string;
  phone: string;
  address: string;
  region: string;
  packagePlan: string;
  monthlyFee: number;
  installationFee?: number | null;
  odpId?: string | null;
  entrySource?: string | null;
  shareLocationUrl?: string | null;
  housePhoto?: string | null;
  odpPortCandidate?: number | null;
  status: ServiceRegistrationStatus;
  validationStatus?: string | null;
  validationNotes?: string | null;
  validatedBy?: string | null;
  validatedAt?: string | null;
  surveyStatus?: string | null;
  surveyResult?: 'layak' | 'tidak_layak' | null;
  surveyNotes?: string | null;
  surveyedBy?: string | null;
  surveyedAt?: string | null;
  surveyData?: Record<string, unknown>;
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
  installationMaterialRequestId?: string | null;
  activationReport?: Record<string, unknown>;
  activationDocument?: Record<string, unknown>;
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
  dashboardModuleKey?: AppModule | null;
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
  serviceStartedAt?: string | null;
  serviceActiveUntil?: string | null;
  ktpImage?: string;
  installedDate: string;
  assignedTechnician?: string;
  lastPaymentDate?: string;
}

export type ReimbursementStatus =
  | 'draft'
  | 'pending_finance'
  | 'pending_management'
  | 'rejected'
  | 'approved'
  | 'paid';

export interface ReimbursementRequestItem {
  id?: number;
  itemName: string;
  quantity: number;
  unit: string;
  unitAmount: number;
  subtotal: number;
  notes?: string | null;
}

export interface ReimbursementRequest {
  id: string;
  requestedById: string;
  requestedByName?: string | null;
  requesterRole: UserRole;
  requesterDivision: string;
  transactionDate: string;
  description: string;
  totalClaim: number;
  status: ReimbursementStatus;
  receiptPath?: string | null;
  receiptUrl?: string | null;
  financeNotes?: string | null;
  managementNotes?: string | null;
  financeReviewedBy?: string | null;
  financeReviewedAt?: string | null;
  managementReviewedBy?: string | null;
  managementReviewedAt?: string | null;
  paidBy?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items: ReimbursementRequestItem[];
}

export interface FinanceMutation {
  id: string;
  transactionDate: string;
  type: 'inflow' | 'outflow';
  category: string;
  amount: number;
  description: string;
  reference?: string | null;
  status?: string | null;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface FinancialLedgerEntry {
  id: string;
  transactionDate: string;
  source: 'billing' | 'reimburse' | 'manual_mutation' | string;
  type: 'inflow' | 'outflow';
  category: string;
  amount: number;
  description: string;
  reference?: string | null;
  status?: string | null;
  actorName?: string | null;
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
  | 'field_done_waiting_helpdesk_qc' // Field work or remote fix done, waiting helpdesk QC
  | 'lead_sop_approved' // Lead Tech checked physical SOP
  | 'noc_verifying' // NOC checking optical dBm & PPPoE session
  | 'closed' // Ticket verified & completed
  | 'cancelled';
export type ExtendedTicketStatus = TicketStatus | 'menunggu_retur_gudang';

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
  status: ExtendedTicketStatus;
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
  replacementContext?: {
    requiresReplacementRequest?: boolean;
    requestedItems?: Array<{
      itemName: string;
      quantity: number;
      unit: string;
    }>;
    returnType?: 'replacement' | 'uninstallation' | string;
    outboundRequestStatus?: string | null;
    warehouseReturnStatus?: string | null;
    holdTicketUntilWarehouseReturn?: boolean;
  };
}

export type WorkOrderType = 'installation' | 'maintenance' | 'uninstallation';
export type WorkOrderStatus =
  | 'pending'
  | 'pending_lead_assignment'
  | 'menunggu_konfirmasi_teknisi'
  | 'assigned'
  | 'in_progress'
  | 'sedang_diinstal'
  | 'menunggu_qc_noc'
  | 'dikembalikan_ke_teknisi'
  | 'closed'
  | 'sop_submitted'
  | 'field_submitted'
  | 'waiting_noc_activation'
  | 'approved'
  | 'completed';

export interface WorkOrder {
  id: string; // e.g. "WO-2026-0412"
  type: WorkOrderType;
  customerId?: string | null;
  customerName: string;
  customerNik?: string | null;
  customerGender?: string | null;
  customerPhone: string;
  address: string;
  region: string;
  odpId?: string | null;
  odpPort?: number | null;
  monthlyFee?: number | null;
  entrySource?: string | null;
  shareLocationUrl?: string | null;
  housePhoto?: string | null;
  assignedLead: string;
  assignedTechId?: string;
  assignedTechName?: string;
  ticketId?: string;
  serviceRegistrationId?: string;
  installationMaterialRequestId?: string | null;
  warehouseReturnRequestId?: string | null;
  status: WorkOrderStatus;
  scheduledDate: string;
  packagePlan?: string;
  installationFeeActual?: number | null;
  installationPaymentMethod?: 'tunai' | 'transfer' | null;
  installationPaymentStatus?: 'pending_finance' | 'confirmed_finance' | null;
  installationPaymentCustomerPaid?: boolean;
  installationPaymentConfirmedAt?: string | null;
  installationPaymentConfirmedBy?: string | null;
  installationPaymentNotes?: string | null;
  customerBiodataConfirmed?: boolean;
  routerSn?: string | null;
  pppoeRequestStatus?: 'not_requested' | 'pending_noc' | 'approved' | 'rejected' | null;
  pppoeRequestedAt?: string | null;
  pppoeRequestedBy?: string | null;
  pppoeApprovedAt?: string | null;
  pppoeApprovedBy?: string | null;
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
    odp?: string;
    opmReading?: string;
    installedDevice?: string;
    modemIdentity?: string;
    installationResult?: string;
  };
  surveySnapshot?: Record<string, unknown>;
  activationPayload?: Record<string, unknown>;
  onuIdentity?: {
    ponSn?: string;
    serialNumber?: string;
    macAddress?: string;
    source?: string;
  };
  networkCredentials?: Record<string, unknown>;
  maintenancePayload?: {
    replacementFlowActive?: boolean;
    replacementRecommendedByNoc?: boolean;
    replacementRequestedItems?: Array<{ itemName: string; quantity: number; unit: string }>;
    fieldActionType?: string | null;
    deviceReplacementApplied?: boolean;
    uninstallationFlowActive?: boolean;
    replacementSummary?: string | null;
    oldDeviceSnapshot?: Record<string, unknown> | null;
    newDeviceIdentity?: Record<string, unknown> | null;
    returnItems?: Array<{
      itemName: string;
      quantity: number;
      unit: string;
      returnCategory?: string;
      serialNumbers?: string[];
    }>;
    warehouseReturnStatus?: string | null;
  };
  warehouseReturnStatus?: string | null;
  qcStatus?: string | null;
  qcNotes?: string | null;
  returnedToTechAt?: string | null;
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

export interface InstallationMaterialRequest {
  id: string;
  serviceRegistrationId?: string | null;
  workOrderId?: string | null;
  ticketId?: string | null;
  customerName: string;
  requestedBy: string;
  requestPurpose?: string | null;
  status: 'menunggu_persetujuan_gudang' | 'diproses_gudang' | 'siap_diserahkan' | 'diserahkan_ke_teknisi' | 'ditolak' | string;
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
  }>;
  approvalNotes?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  deliveredBy?: string | null;
  deliveredAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WarehouseReturnRequest {
  id: string;
  workOrderId: string;
  ticketId?: string | null;
  customerId?: string | null;
  customerName: string;
  submittedBy?: string | null;
  returnType?: 'replacement' | 'uninstallation' | string;
  status: 'menunggu_qc_gudang' | 'retur_selesai' | string;
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    returnCategory?: string;
    serialNumbers?: string[];
  }>;
  qcNotes?: string | null;
  receivedBy?: string | null;
  receivedAt?: string | null;
  closedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  orderedBy?: string | null;
  orderedAt?: string | null;
  orderedNotes?: string | null;
  rejectionNotes?: string | null;
  lastRejectedBy?: string | null;
  lastRejectedAt?: string | null;
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

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
  | 'stok_barang'
  | 'inventory_pop'
  | 'request_pengadaan_barang'
  | 'kanban'
  | 'network_map'
  | 'router_management'
  | 'olt_monitoring'
  | 'odp_management'
  | 'paket_internet'
  | 'master_wilayah'
  | 'datasheet_360'
  | 'sync_check'
  | 'billing_invoices'
  | 'package_requests'
  | 'warehouse_management'
  | 'comprehensive_tickets'
  | 'settings_isp'
  | 'activity_logs'
  | 'admin_users'
  | 'admin_roles'
  | 'admin_master'
  | 'admin_modules'
  | 'admin_module_roles'
  | 'admin_mappings'
  | 'admin_audit'
  | 'performa_karyawan'
  | 'pengaturan_profil';

export type ImplementedAppModule = AppModule;

export interface KpiMetric {
  label: string;
  value: string | number;
  unit: string;
}

export interface EmployeeRecentActivity {
  id: string;
  action: string;
  target?: string | null;
  details?: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
}

export interface EmployeePerformanceItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: UserRole;
  roleTitle: string;
  division: string;
  isOnline: boolean;
  lastLoginAt?: string | null;
  kpiScore: number;
  status: string;
  totalAssignedTasks: number;
  totalCompletedTasks: number;
  activeTasksCount: number;
  kpiMetrics: KpiMetric[];
  recentActivities: EmployeeRecentActivity[];
}

export interface EmployeePerformanceSummary {
  totalEmployees: number;
  averageKpiScore: number;
  totalCompletedTasksThisMonth: number;
  slaPerformanceRate: string;
  topPerformers: EmployeePerformanceItem[];
}

export interface EmployeePerformanceApiResponse {
  summary: EmployeePerformanceSummary;
  employees: EmployeePerformanceItem[];
}

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
  macAddress?: string;
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
  installationMaterialRequestStatus?: string | null;
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

export type ProcurementStatus = 'pending_finance' | 'pending_management' | 'pending_payment' | 'approved' | 'rejected' | 'ordered' | 'received';

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
  status: ProcurementStatus;
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
  paymentConfirmedAt?: string | null;
  paymentConfirmedBy?: string | null;
  paymentProofUrl?: string | null;
  paymentChannel?: string | null;
  paymentNotes?: string | null;
  paymentDetails?: {
    confirmed_by?: string;
    confirmed_at?: string;
    proof_url?: string;
    channel?: string;
    notes?: string;
  } | null;
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

export interface PopDevice {
  id: string;
  networkPopId: string;
  inventoryItemId?: string | null;
  category: string; // 'OLT' | 'Switch Core' | 'Switch Distribution' | 'Router / BRAS' | 'Rectifier' | 'Baterai Bank' | 'UPS' | 'SFP Module' | 'Server' | 'ODF / Patch Panel' | 'Environment / CCTV' | 'Material / Spare'
  brand: string;
  model: string;
  serialNumber?: string | null;
  macAddress?: string | null;
  ipManagement?: string | null;
  rackPosition?: string | null;
  powerSource?: string | null;
  status: 'active' | 'backup' | 'standby' | 'maintenance' | 'faulty' | 'decommissioned';
  installedAt?: string | null;
  installedBy?: string | null;
  lastCheckedAt?: string | null;
  specifications?: Record<string, any>;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NetworkPop {
  id: string; // e.g. "POP-SDA-01"
  name: string;
  code: string;
  region: string;
  clusterCode?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  picName?: string | null;
  picPhone?: string | null;
  powerBackupInfo?: string | null;
  rackCapacity?: string | null;
  status: 'active' | 'maintenance' | 'inactive';
  notes?: string | null;
  devicesCount?: number;
  activeDevicesCount?: number;
  devices?: PopDevice[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PopWorkOrder {
  id: string; // e.g. "WO-POP-2026-001"
  networkPopId: string;
  popName?: string;
  popRegion?: string;
  actionType: 'add_device' | 'replace_device' | 'modify_config' | 'remove_device';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending_lead_tech' | 'assigned_to_tech' | 'in_progress' | 'waiting_noc_qc' | 'completed' | 'rejected_by_noc' | 'cancelled';
  targetDeviceId?: string | null;
  targetDeviceInfo?: {
    id?: string;
    category?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    macAddress?: string;
    rackPosition?: string;
  } | null;
  newDevicePayload?: {
    category?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    macAddress?: string;
    ipManagement?: string;
    rackPosition?: string;
    powerSource?: string;
    specifications?: Record<string, any>;
    inventoryItemId?: string;
  } | null;
  materialsFromWarehouse?: {
    itemName: string;
    quantity: number;
    unit: string;
  }[] | null;
  assignedLeadName?: string | null;
  assignedTechId?: string | null;
  assignedTechName?: string | null;
  scheduledDate?: string | null;
  fieldReport?: {
    installedAt?: string;
    rackUnit?: string;
    serialNumber?: string;
    macAddress?: string;
    ipAddress?: string;
    testResult?: string;
    technicianNotes?: string;
    photos?: string[];
    submittedBy?: string;
  } | null;
  nocInstruction?: {
    createdBy?: string;
    createdAt?: string;
    vlan?: number | string;
    targetManagementIp?: string;
    configurationGuide?: string;
    notes?: string;
  } | null;
  nocQcResult?: {
    verified?: boolean;
    verifiedBy?: string;
    verifiedAt?: string;
    pingTestSuccess?: boolean;
    snmpActive?: boolean;
    rxTxPowerDbm?: string;
    qcNotes?: string;
    rejectionNotes?: string;
  } | null;
  warehouseReturnStatus?: 'none' | 'pending_qc' | 'retur_selesai' | null;
  createdBy: string;
  pop?: NetworkPop;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 12 CORE DOMAIN INTERFACES FOR PARITY
// ==========================================

export interface RouterDevice {
  id: number;
  name: string;
  ip_address: string;
  username: string;
  port: number;
  type: string;
  is_active: boolean;
  status: 'connected' | 'disconnected' | 'error';
  last_seen?: string | null;
  latency_ms?: number | null;
  cpu_load?: number | null;
  memory_used_mb?: number | null;
  memory_total_mb?: number | null;
  uptime?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RouterTelemetry {
  online: boolean;
  cpu_load?: number;
  memory_free?: number;
  memory_total?: number;
  memory_used_pct?: number;
  uptime?: string;
  board_name?: string;
  version?: string;
  active_pppoe_count?: number;
  interfaces?: Array<{
    name: string;
    type: string;
    running: boolean;
    rx_bps?: number;
    tx_bps?: number;
    rx_packet?: number;
    tx_packet?: number;
  }>;
}

export interface PppoeSecretItem {
  name: string;
  service?: string;
  profile?: string;
  caller_id?: string;
  disabled: boolean;
  comment?: string;
  is_active?: boolean;
  active_uptime?: string;
  active_ip?: string;
  active_mac?: string;
}

export interface BackboneDiagnostics {
  interface: string;
  status: 'up' | 'down';
  sfp_temperature?: number;
  sfp_voltage?: number;
  sfp_tx_power_dbm?: number;
  sfp_rx_power_dbm?: number;
  optical_status?: 'normal' | 'warning' | 'critical';
  rx_bps?: number;
  tx_bps?: number;
}

export interface OltDevice {
  id: number;
  name: string;
  brand: string;
  type: 'gpon' | 'epon';
  ip_address: string;
  snmp_port?: number;
  snmp_community?: string;
  telnet_port?: number;
  telnet_username?: string;
  status: 'online' | 'offline' | 'unreachable';
  total_pon_ports: number;
  active_pon_ports?: number;
  total_onus?: number;
  online_onus?: number;
  offline_onus?: number;
  temperature?: number | null;
  last_synced_at?: string | null;
  pon_ports?: OltPonPort[];
}

export interface OltPonPort {
  id?: number;
  port_number: number;
  name: string;
  status: 'up' | 'down';
  tx_power_dbm?: number;
  rx_power_avg_dbm?: number;
  connected_onus_count: number;
  temperature?: number;
  voltage?: number;
}

export interface OltOnuItem {
  id?: number;
  onu_index?: string;
  port: number;
  onu_number?: number;
  serial_number: string;
  name?: string;
  status: 'online' | 'offline' | 'los' | 'dying_gasp';
  rx_power_dbm?: number;
  tx_power_dbm?: number;
  distance_meters?: number;
  ip_address?: string;
  mac_address?: string;
  optical_status: 'normal' | 'warning' | 'critical';
  last_online_at?: string;
}

export interface OdpDistributionItem {
  id: number;
  nama_odp: string;
  kode_odp?: string;
  olt_id?: number;
  olt_name?: string;
  pon_port?: number;
  kapasitas_port: number;
  used_ports?: number;
  latitude: number;
  longitude: number;
  status: 'normal' | 'fiber_cut' | 'power_off' | 'mati_lampu' | 'redaman_tinggi';
  alamat?: string;
  catatan?: string;
  foto_odp?: string;
  updated_at?: string;
}

export interface PaketInternetItem {
  id: number;
  nama_paket: string;
  kategori?: string;
  kecepatan_mbps: number;
  tarif_bulanan: number;
  mikrotik_profile?: string;
  keterangan?: string;
  is_active: boolean;
  total_subscribers?: number;
}

export interface MasterWilayahItem {
  id: number;
  provinsi_kode: string;
  provinsi_nama: string;
  kabupaten_kode: string;
  kabupaten_nama: string;
  kecamatan_kode: string;
  kecamatan_nama: string;
  desa_kode: string;
  desa_nama: string;
}

export interface CustomerIdGenerationResult {
  customer_id: string;
  pppoe_username: string;
  pppoe_password_suggestion: string;
  wilayah_code: string;
}

export interface DataSheetItem {
  id: number;
  username_pppoe: string;
  nama_pelanggan: string;
  nik_ktp?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  nama_odp?: string | null;
  port_odp?: string | null;
  olt_server?: string | null;
  paket?: string | null;
  harga_paket?: number | null;
  biaya_pasang?: number | null;
  tanggal_instalasi?: string | null;
  tanggal_jatuh_tempo?: string | null;
  status_langganan: 'aktif' | 'isolir' | 'dismantle' | 'batal' | string;
  status_pembayaran?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  pon_sn?: string | null;
  serial_number?: string | null;
  vlan?: string | null;
  lokasi_maps?: string | null;
  sales_name?: string | null;
  foto_rumah_url?: string | null;
  foto_odp_url?: string | null;
  foto_modem_url?: string | null;
  foto_redaman_url?: string | null;
  foto_ktp_url?: string | null;
  foto_label_kabel_url?: string | null;
  foto_dokumen_url?: string | null;
  raw_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface SyncCheckAuditRow {
  key: string;
  username_pppoe: string;
  nama: string;
  odp: string;
  paket: string;
  status_db: string;
  status_mikrotik?: string;
  status_sheet?: string;
  in_sync: boolean;
  discrepancy_details?: string[];
}

export interface InvoiceItem {
  id: number;
  nomor_invoice: string;
  pelanggan_username: string;
  nama_pelanggan?: string;
  periode_bulan: number;
  periode_tahun: number;
  periode_formatted?: string;
  harga_paket: number;
  total_tagihan: number;
  total_dibayar: number;
  sisa_piutang: number;
  status_bayar: 'unpaid' | 'paid' | 'partial' | 'cancelled';
  status_layanan: 'active' | 'isolated' | 'dismantled';
  jatuh_tempo?: string;
  dibayar_pada?: string | null;
  metode_bayar?: string | null;
  bukti_bayar?: string | null;
  bukti_bayar_resolved?: string | null;
  catatan?: string | null;
  whatsapp_sent_at?: string | null;
}

export interface CustomerPackageRequestItem {
  id: number;
  pelanggan_username: string;
  nama_pelanggan?: string;
  current_package?: string;
  requested_package: string;
  requested_price: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
}

export interface WarehouseItemModel {
  id: number;
  kode_barang: string;
  nama_barang: string;
  kategori: string;
  satuan: string;
  stok_baru: number;
  stok_second: number;
  stok_rusak: number;
  stok_total: number;
  min_stok: number;
  harga_satuan?: number;
  foto?: string;
  status: 'aktif' | 'nonaktif';
}

export interface WarehouseRequestModel {
  id: number;
  nomor_request: string;
  tipe_request: string;
  kategori_kebutuhan: string;
  ticket_id?: number | null;
  user_id: number;
  user_name?: string;
  divisi: string;
  alasan?: string;
  alokasi_aset?: string;
  status: 'pending_divisi' | 'pending_finance' | 'pending_gudang' | 'approved_ready' | 'received' | 'rejected';
  items?: Array<{
    id: number;
    warehouse_item_id: number;
    nama_barang: string;
    qty_diminta: number;
    qty_disetujui: number;
    kondisi: 'baru' | 'second';
  }>;
  created_at?: string;
}

export interface WarehouseReturnModel {
  id: number;
  nomor_retur: string;
  ticket_id?: number | null;
  ticket_number?: string | null;
  teknisi_id: number;
  teknisi_name?: string;
  pelanggan_nama?: string;
  nama_barang: string;
  serial_number?: string;
  mac_address?: string;
  kondisi: 'layak_pakai' | 'rusak_bisa_servis' | 'rusak_total';
  foto_barang?: string;
  foto_barang_resolved?: string;
  status: 'pending_gudang' | 'received' | 'rejected';
  catatan_teknisi?: string;
  catatan_gudang?: string;
  created_at?: string;
}

export interface ComprehensiveTicketItem {
  id: number;
  ticket_number: string;
  type: 'gangguan' | 'psb' | 'dismantle' | 'relokasi';
  type_label?: string;
  status: string;
  status_label?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  pelanggan_nama: string;
  pelanggan_username?: string;
  pelanggan_telepon?: string;
  pelanggan_alamat?: string;
  keluhan?: string;
  paket?: string;
  paket_layanan?: string;
  odp_id?: number;
  nama_odp?: string;
  port_odp?: string;
  olt_id?: number;
  nama_olt?: string;
  latitude?: number | string;
  longitude?: number | string;
  shareloc_url?: string;
  assigned_to?: number | null;
  technician_name?: string;
  created_by?: number;
  creator_name?: string;
  validated_by?: number;
  validator_name?: string;
  vlan?: string;
  ip_address?: string;
  serial_number_ont?: string;
  mac_ont?: string;
  redaman_ont?: string;
  foto_rumah?: string;
  foto_sebelum?: string;
  foto_sesudah?: string;
  foto_odp?: string;
  foto_redaman?: string;
  foto_label_kabel?: string;
  foto_dokumen?: string;
  bukti_pembayaran?: string;
  foto_rumah_resolved?: string;
  foto_sebelum_resolved?: string;
  foto_sesudah_resolved?: string;
  foto_odp_resolved?: string;
  foto_redaman_resolved?: string;
  foto_label_kabel_resolved?: string;
  foto_dokumen_resolved?: string;
  bukti_pembayaran_resolved?: string;
  biaya_instalasi?: number;
  payment_status?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  closed_at?: string;
}

export interface TicketLiveCheckResponse {
  total_active_tickets: number;
  pending_noc_count: number;
  ready_dispatch_count: number;
  in_progress_count: number;
  pending_qc_count: number;
  pending_gudang_count: number;
  last_ticket_id: number;
  latest_ticket?: ComprehensiveTicketItem | null;
  server_timestamp: string;
}

export interface IspSettingModel {
  id?: number;
  nama_isp?: string;
  logo_url?: string;
  telepon_support?: string;
  alamat_kantor?: string;
  mikrotik_ip?: string;
  mikrotik_user?: string;
  mikrotik_port?: number;
  mikrotik_interface_wan?: string;
  mikrotik_interface_pppoe?: string;
  fonnte_token?: string;
  fonnte_group_noc?: string;
  fonnte_group_teknisi?: string;
  fonnte_group_billing?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  google_sheet_url?: string;
  google_sheet_webhook_url?: string;
  sheet_tab_pelanggan_fix?: string;
}

export interface ActivityLogItem {
  id: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
  action: string;
  description: string;
  username: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}



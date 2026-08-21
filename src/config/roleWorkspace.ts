import { AppModule, UserRole } from '../types';

export type RoleShellMode = 'admin' | 'analytics' | 'compact' | 'standalone';
export type QuickActionType = 'new_ticket' | 'new_customer' | 'new_task' | 'new_procurement' | null;

export interface ModuleMeta {
  id: AppModule;
  label: string;
  description: string;
  searchPlaceholder?: string;
  quickAction: QuickActionType;
  viewFormats: Array<'table' | 'grid' | 'kanban' | 'map'>;
}

export interface RoleWorkspaceConfig {
  role: UserRole;
  title: string;
  subtitle: string;
  shellMode: RoleShellMode;
  defaultModule: AppModule;
  allowedModules: AppModule[];
  homeLabel: string;
  navigationLabel: string;
  workspaceLabel: string;
  showSearchShortcut: boolean;
  showSidebarNavigation: boolean;
}

export const MODULE_META: Record<AppModule, ModuleMeta> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Ringkasan utama workspace.',
    quickAction: null,
    viewFormats: ['grid', 'table'],
  },
  helpdesk: {
    id: 'helpdesk',
    label: 'Helpdesk & Ticketing',
    description: 'Aduan pelanggan, intake tiket, dan alur helpdesk.',
    searchPlaceholder: 'Cari pelanggan, nomor tiket, atau nomor aduan...',
    quickAction: 'new_ticket',
    viewFormats: ['table', 'grid'],
  },
  noc: {
    id: 'noc',
    label: 'NOC Console',
    description: 'Triage teknis, verifikasi sinyal, dan closing tiket.',
    searchPlaceholder: 'Cari tiket, ODP, user PPPoE, atau serial ONT...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  lead_tech: {
    id: 'lead_tech',
    label: 'Lead Technician Workspace',
    description: 'Assign work order, review SOP, dan monitoring teknisi.',
    searchPlaceholder: 'Cari WO, pelanggan, atau teknisi lapangan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  field_tech: {
    id: 'field_tech',
    label: 'Portal Teknisi Lapangan',
    description: 'Eksekusi WO, bukti kerja, dan laporan on-site.',
    quickAction: null,
    viewFormats: ['table'],
  },
  finance: {
    id: 'finance',
    label: 'Finance Desk',
    description: 'Billing pelanggan dan approval procurement finance.',
    searchPlaceholder: 'Cari pelanggan, tagihan, PPPoE user, atau status layanan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  inventory: {
    id: 'inventory',
    label: 'Warehouse Console',
    description: 'Stok barang, serial aset, dan permintaan pengadaan.',
    searchPlaceholder: 'Cari barang, kode item, brand, atau serial number...',
    quickAction: 'new_procurement',
    viewFormats: ['table', 'grid'],
  },
  kanban: {
    id: 'kanban',
    label: 'Kanban Koordinasi',
    description: 'Koordinasi tugas antar divisi internal.',
    searchPlaceholder: 'Cari task, divisi asal/tujuan, atau tenggat kerja...',
    quickAction: 'new_task',
    viewFormats: ['kanban', 'table'],
  },
  network_map: {
    id: 'network_map',
    label: 'Peta Jaringan',
    description: 'ODP, port binding, dan visualisasi mapping pelanggan.',
    searchPlaceholder: 'Cari ID ODP, ODC, pelanggan, atau port splitter...',
    quickAction: null,
    viewFormats: ['map', 'grid'],
  },
  admin_users: {
    id: 'admin_users',
    label: 'Manajemen Akun',
    description: 'CRUD akun login, status aktif, dan reset password.',
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_roles: {
    id: 'admin_roles',
    label: 'Role & Hak Akses',
    description: 'Pemetaan role dan division aplikasi.',
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_master: {
    id: 'admin_master',
    label: 'Master Data',
    description: 'Referensi paket, wilayah, inventory, dan workflow.',
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_mappings: {
    id: 'admin_mappings',
    label: 'Mapping Infrastruktur',
    description: 'ODP, port binding, dan relasi entitas aplikasi.',
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_audit: {
    id: 'admin_audit',
    label: 'Audit & Session',
    description: 'Jejak aktivitas dan sesi user online.',
    quickAction: null,
    viewFormats: ['table'],
  },
};

export const ROLE_WORKSPACES: Record<UserRole, RoleWorkspaceConfig> = {
  superadmin: {
    role: 'superadmin',
    title: 'System Administration',
    subtitle: 'Master data, akun login, role, mapping, dan audit aplikasi.',
    shellMode: 'admin',
    defaultModule: 'dashboard',
    allowedModules: ['dashboard', 'admin_users', 'admin_roles', 'admin_master', 'admin_mappings', 'admin_audit'],
    homeLabel: 'System Overview',
    navigationLabel: 'Modul Administrasi Sistem',
    workspaceLabel: 'Admin Menu',
    showSearchShortcut: false,
    showSidebarNavigation: true,
  },
  management: {
    role: 'management',
    title: 'Executive Dashboard',
    subtitle: 'Analitik bisnis, approval manajemen, dan monitoring kinerja.',
    shellMode: 'analytics',
    defaultModule: 'dashboard',
    allowedModules: ['dashboard'],
    homeLabel: 'Executive Overview',
    navigationLabel: 'Ringkasan Manajemen',
    workspaceLabel: 'Executive View',
    showSearchShortcut: false,
    showSidebarNavigation: false,
  },
  helpdesk: {
    role: 'helpdesk',
    title: 'Portal Helpdesk',
    subtitle: 'Intake aduan pelanggan dan tindak lanjut tiket.',
    shellMode: 'compact',
    defaultModule: 'helpdesk',
    allowedModules: ['helpdesk', 'kanban'],
    homeLabel: 'Workspace Helpdesk',
    navigationLabel: 'Modul Helpdesk',
    workspaceLabel: 'Helpdesk Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  noc: {
    role: 'noc',
    title: 'NOC Console',
    subtitle: 'Verifikasi teknis, telemetri jaringan, dan peta ODP.',
    shellMode: 'compact',
    defaultModule: 'noc',
    allowedModules: ['noc', 'network_map', 'kanban'],
    homeLabel: 'Workspace NOC',
    navigationLabel: 'Modul NOC',
    workspaceLabel: 'NOC Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  lead_tech: {
    role: 'lead_tech',
    title: 'Lead Technician Workspace',
    subtitle: 'Penugasan WO, monitoring teknisi, dan review SOP lapangan.',
    shellMode: 'compact',
    defaultModule: 'lead_tech',
    allowedModules: ['lead_tech', 'kanban'],
    homeLabel: 'Workspace Lead Tech',
    navigationLabel: 'Modul Kepala Teknisi',
    workspaceLabel: 'Lead Tech Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  field_tech: {
    role: 'field_tech',
    title: 'Portal Teknisi Lapangan',
    subtitle: 'Work order saya, data pelanggan, dan laporan on-site.',
    shellMode: 'standalone',
    defaultModule: 'field_tech',
    allowedModules: ['field_tech'],
    homeLabel: 'Portal Teknisi',
    navigationLabel: 'Workspace Teknisi',
    workspaceLabel: 'Field Tech',
    showSearchShortcut: false,
    showSidebarNavigation: false,
  },
  finance: {
    role: 'finance',
    title: 'Finance Desk',
    subtitle: 'Billing pelanggan, piutang, dan approval procurement finance.',
    shellMode: 'compact',
    defaultModule: 'finance',
    allowedModules: ['finance', 'kanban'],
    homeLabel: 'Workspace Finance',
    navigationLabel: 'Modul Finance',
    workspaceLabel: 'Finance Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  inventory: {
    role: 'inventory',
    title: 'Warehouse Console',
    subtitle: 'Stok gudang, inventaris, dan pengadaan barang.',
    shellMode: 'compact',
    defaultModule: 'inventory',
    allowedModules: ['inventory', 'kanban'],
    homeLabel: 'Workspace Gudang',
    navigationLabel: 'Modul Gudang',
    workspaceLabel: 'Warehouse Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
};

export const getRoleWorkspace = (role: UserRole): RoleWorkspaceConfig => ROLE_WORKSPACES[role];

export const getDefaultModuleForRole = (role: UserRole): AppModule => ROLE_WORKSPACES[role].defaultModule;

export const isModuleAllowedForRole = (role: UserRole, module: AppModule): boolean =>
  ROLE_WORKSPACES[role].allowedModules.includes(module);

export const getAllowedModulesForRole = (role: UserRole): ModuleMeta[] =>
  ROLE_WORKSPACES[role].allowedModules.map((moduleId) => MODULE_META[moduleId]);

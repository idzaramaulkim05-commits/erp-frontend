import { AppModule, KnownUserRole, NavigationConfig, UserRole } from '../types';

export type RoleShellMode = 'admin' | 'analytics' | 'compact' | 'standalone';
export type QuickActionType = 'new_ticket' | 'new_customer' | 'new_task' | 'new_procurement' | null;
export type NavigationCategoryId = 'dashboards' | 'operasional' | 'koordinasi' | 'infrastruktur' | 'administrasi';

export interface NavigationCategoryMeta {
  id: NavigationCategoryId;
  label: string;
  searchLabel: string;
  order: number;
}

export interface ModuleMeta {
  id: AppModule;
  label: string;
  description: string;
  navigationCategory: NavigationCategoryId;
  navigationOrder: number;
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

export const SUPERADMIN_DASHBOARD_MODULES: AppModule[] = [
  'admin_users',
  'admin_roles',
  'admin_master',
  'admin_modules',
  'admin_module_roles',
  'admin_mappings',
  'admin_audit',
];

export const NAVIGATION_CATEGORIES: Record<NavigationCategoryId, NavigationCategoryMeta> = {
  dashboards: {
    id: 'dashboards',
    label: 'Dashboards',
    searchLabel: 'Cari dashboard...',
    order: 1,
  },
  operasional: {
    id: 'operasional',
    label: 'Operasional',
    searchLabel: 'Cari modul operasional...',
    order: 2,
  },
  koordinasi: {
    id: 'koordinasi',
    label: 'Koordinasi',
    searchLabel: 'Cari modul koordinasi...',
    order: 3,
  },
  infrastruktur: {
    id: 'infrastruktur',
    label: 'Infrastruktur',
    searchLabel: 'Cari modul infrastruktur...',
    order: 4,
  },
  administrasi: {
    id: 'administrasi',
    label: 'Administrasi Sistem',
    searchLabel: 'Cari modul administrasi...',
    order: 5,
  },
};

export const MODULE_META: Record<AppModule, ModuleMeta> = {
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Ringkasan utama workspace.',
    navigationCategory: 'dashboards',
    navigationOrder: 1,
    quickAction: null,
    viewFormats: ['grid', 'table'],
  },
  service_registrations: {
    id: 'service_registrations',
    label: 'Registrasi Pasang Baru',
    description: 'Pipeline sales, finance, NOC, dan dispatch untuk pelanggan baru.',
    navigationCategory: 'operasional',
    navigationOrder: 1,
    searchPlaceholder: 'Cari registrasi, nama pelanggan, ODP, atau status approval...',
    quickAction: 'new_customer',
    viewFormats: ['table', 'grid'],
  },
  helpdesk: {
    id: 'helpdesk',
    label: 'Helpdesk & Ticketing',
    description: 'Aduan pelanggan, intake tiket, dan alur helpdesk.',
    navigationCategory: 'operasional',
    navigationOrder: 2,
    searchPlaceholder: 'Cari pelanggan, nomor tiket, atau nomor aduan...',
    quickAction: 'new_ticket',
    viewFormats: ['table', 'grid'],
  },
  noc: {
    id: 'noc',
    label: 'NOC Console',
    description: 'Triage teknis, verifikasi sinyal, dan closing tiket.',
    navigationCategory: 'operasional',
    navigationOrder: 3,
    searchPlaceholder: 'Cari tiket, ODP, user PPPoE, atau serial ONT...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  lead_tech: {
    id: 'lead_tech',
    label: 'Lead Technician Workspace',
    description: 'Assign work order, review SOP, dan monitoring teknisi.',
    navigationCategory: 'operasional',
    navigationOrder: 4,
    searchPlaceholder: 'Cari WO, pelanggan, atau teknisi lapangan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  field_tech: {
    id: 'field_tech',
    label: 'Portal Teknisi Lapangan',
    description: 'Eksekusi WO, bukti kerja, dan laporan on-site.',
    navigationCategory: 'operasional',
    navigationOrder: 5,
    quickAction: null,
    viewFormats: ['table'],
  },
  finance: {
    id: 'finance',
    label: 'Finance Desk',
    description: 'Billing pelanggan dan approval procurement finance.',
    navigationCategory: 'operasional',
    navigationOrder: 6,
    searchPlaceholder: 'Cari pelanggan, tagihan, PPPoE user, atau status layanan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  inventory: {
    id: 'inventory',
    label: 'Warehouse Console',
    description: 'Stok barang, serial aset, dan permintaan pengadaan.',
    navigationCategory: 'operasional',
    navigationOrder: 7,
    searchPlaceholder: 'Cari barang, kode item, brand, atau serial number...',
    quickAction: 'new_procurement',
    viewFormats: ['table', 'grid'],
  },
  kanban: {
    id: 'kanban',
    label: 'Kanban Koordinasi',
    description: 'Koordinasi tugas antar divisi internal.',
    navigationCategory: 'koordinasi',
    navigationOrder: 1,
    searchPlaceholder: 'Cari task, divisi asal/tujuan, atau tenggat kerja...',
    quickAction: 'new_task',
    viewFormats: ['kanban', 'table'],
  },
  network_map: {
    id: 'network_map',
    label: 'Peta Jaringan',
    description: 'ODP, port binding, dan visualisasi mapping pelanggan.',
    navigationCategory: 'infrastruktur',
    navigationOrder: 1,
    searchPlaceholder: 'Cari ID ODP, ODC, pelanggan, atau port splitter...',
    quickAction: null,
    viewFormats: ['map', 'grid'],
  },
  admin_users: {
    id: 'admin_users',
    label: 'Manajemen Akun',
    description: 'CRUD akun login, status aktif, dan reset password.',
    navigationCategory: 'administrasi',
    navigationOrder: 1,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_roles: {
    id: 'admin_roles',
    label: 'Role & Hak Akses',
    description: 'Pemetaan role dan division aplikasi.',
    navigationCategory: 'administrasi',
    navigationOrder: 2,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_master: {
    id: 'admin_master',
    label: 'Master Data',
    description: 'Referensi paket, wilayah, inventory, dan workflow.',
    navigationCategory: 'administrasi',
    navigationOrder: 3,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_modules: {
    id: 'admin_modules',
    label: 'Master Data Modul',
    description: 'Daftar modul aplikasi, kepala navigasi, dan link akses internal.',
    navigationCategory: 'administrasi',
    navigationOrder: 4,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_module_roles: {
    id: 'admin_module_roles',
    label: 'Modul To Role',
    description: 'Mapping modul terhadap role untuk menentukan menu navigasi.',
    navigationCategory: 'administrasi',
    navigationOrder: 5,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_mappings: {
    id: 'admin_mappings',
    label: 'Mapping Infrastruktur',
    description: 'ODP, port binding, dan relasi entitas aplikasi.',
    navigationCategory: 'administrasi',
    navigationOrder: 6,
    quickAction: null,
    viewFormats: ['table'],
  },
  admin_audit: {
    id: 'admin_audit',
    label: 'Audit & Session',
    description: 'Jejak aktivitas dan sesi user online.',
    navigationCategory: 'administrasi',
    navigationOrder: 7,
    quickAction: null,
    viewFormats: ['table'],
  },
};

const FALLBACK_ROLE_WORKSPACE: RoleWorkspaceConfig = {
  role: 'custom_role',
  title: 'Role Workspace',
  subtitle: 'Workspace generik untuk role hasil master data dan mapping navigasi.',
  shellMode: 'compact',
  defaultModule: 'dashboard',
  allowedModules: ['dashboard'],
  homeLabel: 'Dashboards',
  navigationLabel: 'Mapped Navigation',
  workspaceLabel: 'Role Menu',
  showSearchShortcut: true,
  showSidebarNavigation: true,
};

export const ROLE_WORKSPACES: Record<KnownUserRole, RoleWorkspaceConfig> = {
  superadmin: {
    role: 'superadmin',
    title: 'System Administration',
    subtitle: 'Master data, akun login, role, mapping, dan audit aplikasi.',
    shellMode: 'admin',
    defaultModule: 'dashboard',
    allowedModules: ['dashboard', 'service_registrations', 'helpdesk', 'noc', 'lead_tech', 'field_tech', 'finance', 'inventory', 'kanban', 'network_map', 'admin_users', 'admin_roles', 'admin_master', 'admin_modules', 'admin_module_roles', 'admin_mappings', 'admin_audit'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Modul Administrasi Sistem',
    workspaceLabel: 'Admin Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  sales: {
    role: 'sales',
    title: 'Sales Pipeline Workspace',
    subtitle: 'Dashboard pasang baru untuk prospek, draft registrasi, dan handoff ke finance.',
    shellMode: 'compact',
    defaultModule: 'service_registrations',
    allowedModules: ['service_registrations', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline Sales',
    workspaceLabel: 'Sales Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  management: {
    role: 'management',
    title: 'Executive Dashboard',
    subtitle: 'Analitik bisnis, approval manajemen, dan monitoring kinerja.',
    shellMode: 'analytics',
    defaultModule: 'dashboard',
    allowedModules: ['dashboard'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Ringkasan Manajemen',
    workspaceLabel: 'Executive View',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  helpdesk: {
    role: 'helpdesk',
    title: 'Portal Helpdesk',
    subtitle: 'Intake aduan pelanggan dan tindak lanjut tiket.',
    shellMode: 'compact',
    defaultModule: 'helpdesk',
    allowedModules: ['helpdesk', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Modul Helpdesk',
    workspaceLabel: 'Helpdesk Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  noc: {
    role: 'noc',
    title: 'NOC Pipeline Console',
    subtitle: 'Home pasang baru untuk validasi ODP, PPPoE, dispatch, dan final verify instalasi.',
    shellMode: 'compact',
    defaultModule: 'service_registrations',
    allowedModules: ['noc', 'service_registrations', 'network_map', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline NOC',
    workspaceLabel: 'NOC Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  lead_tech: {
    role: 'lead_tech',
    title: 'Lead Technician Pipeline',
    subtitle: 'Home pasang baru untuk dispatch, assignment teknisi, dan kontrol antrean lapangan.',
    shellMode: 'compact',
    defaultModule: 'service_registrations',
    allowedModules: ['lead_tech', 'service_registrations', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline Lead Tech',
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
    homeLabel: 'Dashboards',
    navigationLabel: 'Workspace Teknisi',
    workspaceLabel: 'Field Tech',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  finance: {
    role: 'finance',
    title: 'Finance Approval Pipeline',
    subtitle: 'Home pasang baru untuk review biaya, deposit, dan approval registrasi baru.',
    shellMode: 'compact',
    defaultModule: 'service_registrations',
    allowedModules: ['finance', 'service_registrations', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline Finance',
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
    homeLabel: 'Dashboards',
    navigationLabel: 'Modul Gudang',
    workspaceLabel: 'Warehouse Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
};

export const getRoleWorkspace = (role: UserRole): RoleWorkspaceConfig => (
  ROLE_WORKSPACES[role as KnownUserRole] ?? { ...FALLBACK_ROLE_WORKSPACE, role }
);

export const getDefaultModuleForRole = (role: UserRole): AppModule => getRoleWorkspace(role).defaultModule;

export const getResolvedAllowedModules = (role: UserRole, navigationConfig?: NavigationConfig | null): AppModule[] => {
  const fallbackModules = getRoleWorkspace(role).allowedModules;
  const mappedModules = navigationConfig?.allowedModuleKeys?.length
    ? navigationConfig.allowedModuleKeys.filter((moduleKey): moduleKey is AppModule => Object.prototype.hasOwnProperty.call(MODULE_META, moduleKey))
    : fallbackModules;

  if (role === 'superadmin') {
    return Array.from(new Set([...mappedModules, ...SUPERADMIN_DASHBOARD_MODULES]));
  }

  return mappedModules;
};

export const isModuleAllowedForRole = (role: UserRole, module: AppModule): boolean =>
  getRoleWorkspace(role).allowedModules.includes(module);

export const getAllowedModulesForRole = (role: UserRole): ModuleMeta[] => {
  const workspace = getRoleWorkspace(role);
  const moduleIds = role === 'superadmin'
    ? workspace.allowedModules.filter((moduleId) => !SUPERADMIN_DASHBOARD_MODULES.includes(moduleId))
    : workspace.allowedModules;

  return moduleIds.map((moduleId) => MODULE_META[moduleId]);
};

export const getNavigationSectionsForRole = (role: UserRole) => {
  const modules = getAllowedModulesForRole(role);
  const grouped = modules.reduce<Record<NavigationCategoryId, ModuleMeta[]>>((accumulator, moduleMeta) => {
    const categoryId = moduleMeta.navigationCategory;
    accumulator[categoryId] = [...(accumulator[categoryId] ?? []), moduleMeta].sort((left, right) => left.navigationOrder - right.navigationOrder);
    return accumulator;
  }, {} as Record<NavigationCategoryId, ModuleMeta[]>);

  return Object.values(NAVIGATION_CATEGORIES)
    .sort((left, right) => left.order - right.order)
    .map((category) => ({
      ...category,
      modules: grouped[category.id] ?? [],
    }))
    .filter((category) => category.modules.length > 0);
};

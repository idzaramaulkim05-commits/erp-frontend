import { AppModule, KnownUserRole, NavigationConfig, UserRole } from '../types';

export type RoleShellMode = 'admin' | 'analytics' | 'compact' | 'standalone';
export type QuickActionType = 'new_ticket' | 'new_customer' | 'new_task' | 'new_procurement' | null;
export type NavigationCategoryId = 'dashboards' | 'operasional' | 'koordinasi' | 'infrastruktur' | 'administrasi' | 'keuangan';

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

export interface NavigationSectionModule {
  id: AppModule;
  label: string;
  description: string;
  routeTarget?: string;
}

export interface NavigationSection {
  id: string;
  label: string;
  searchLabel: string;
  order: number;
  modules: NavigationSectionModule[];
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

export const ROLE_DASHBOARD_MODULE_OPTIONS: AppModule[] = [
  'dashboard',
  'about',
  'pelanggan',
  'penagihan',
  'request_pppoe_noc',
  'request_rembes',
  'approval_rembes_finance',
  'laporan_keuangan',
  'retur_gudang_perangkat',
  'panel_kepala_teknisi',
  'panel_teknisi_lapangan',
  'pengerjaan_instalasi_lapangan',
  'qc_instalasi_noc',
  'registrasi_pelanggan_baru',
  'validasi_registrasi',
  'survey_instalasi',
  'request_gudang_instalasi',
  'aktivasi_instalasi',
  'service_registrations',
  'helpdesk',
  'buat_tiket',
  'noc',
  'lead_tech',
  'inventory',
  'stok_barang',
  'inventory_pop',
  'request_pengadaan_barang',
  'kanban',
  'network_map',
];

const MODULE_ROUTE_FALLBACK_MAP: Record<AppModule, string> = {
  dashboard: '/app/dashboard',
  about: '/app/about',
  pelanggan: '/app/pelanggan',
  penagihan: '/app/penagihan',
  request_pppoe_noc: '/app/request-pppoe-noc',
  request_rembes: '/app/request-rembes',
  approval_rembes_finance: '/app/approval-rembes-finance',
  laporan_keuangan: '/app/laporan-keuangan',
  retur_gudang_perangkat: '/app/retur-gudang-perangkat',
  panel_kepala_teknisi: '/app/panel-kepala-teknisi',
  panel_teknisi_lapangan: '/app/panel-teknisi-lapangan',
  pengerjaan_instalasi_lapangan: '/app/pengerjaan-instalasi-lapangan',
  qc_instalasi_noc: '/app/qc-instalasi-noc',
  registrasi_pelanggan_baru: '/app/registrasi-pelanggan-baru',
  validasi_registrasi: '/app/validasi-registrasi',
  survey_instalasi: '/app/survey-instalasi',
  request_gudang_instalasi: '/app/request-gudang-instalasi',
  aktivasi_instalasi: '/app/aktivasi-instalasi',
  service_registrations: '/app/service-registrations',
  helpdesk: '/app/helpdesk',
  buat_tiket: '/app/buat-tiket',
  noc: '/app/noc',
  lead_tech: '/app/lead-tech',
  field_tech: '/app/field-tech',
  finance: '/app/finance',
  inventory: '/app/inventory',
  stok_barang: '/app/stok-barang',
  inventory_pop: '/app/inventory-pop',
  request_pengadaan_barang: '/app/request-pengadaan-barang',
  kanban: '/app/kanban',
  network_map: '/app/network-map',
  admin_users: '/app/admin/users',
  admin_roles: '/app/admin/roles',
  admin_master: '/app/admin/master',
  admin_modules: '/app/admin/modules',
  admin_module_roles: '/app/admin/module-roles',
  admin_mappings: '/app/admin/mappings',
  admin_audit: '/app/admin/audit',
};

const isFallbackImplementedAppModule = (moduleKey: string): moduleKey is AppModule => (
  Object.prototype.hasOwnProperty.call(MODULE_ROUTE_FALLBACK_MAP, moduleKey)
);

const getFallbackRoutePathForModule = (module: AppModule): string => MODULE_ROUTE_FALLBACK_MAP[module];

const resolveFallbackRouteTarget = (routeTarget: string | null | undefined, moduleKey?: string): string => {
  if (routeTarget?.startsWith('/app/')) {
    return routeTarget;
  }

  if (routeTarget && isFallbackImplementedAppModule(routeTarget)) {
    return getFallbackRoutePathForModule(routeTarget);
  }

  if (moduleKey && isFallbackImplementedAppModule(moduleKey)) {
    return getFallbackRoutePathForModule(moduleKey);
  }

  return MODULE_ROUTE_FALLBACK_MAP.dashboard;
};

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
  keuangan: {
    id: 'keuangan',
    label: 'Keuangan',
    searchLabel: 'Cari modul keuangan...',
    order: 6,
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
  about: {
    id: 'about',
    label: 'About',
    description: 'Halaman uji mapping role, route aktif, dan status akses modul.',
    navigationCategory: 'dashboards',
    navigationOrder: 2,
    quickAction: null,
    viewFormats: ['grid', 'table'],
  },
  pelanggan: {
    id: 'pelanggan',
    label: 'Pelanggan',
    description: 'Daftar seluruh pelanggan aktif hasil registrasi dan aktivasi layanan.',
    navigationCategory: 'operasional',
    navigationOrder: 1,
    searchPlaceholder: 'Cari ID pelanggan, nama, nomor HP, wilayah, atau paket...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  penagihan: {
    id: 'penagihan',
    label: 'Penagihan',
    description: 'Monitoring masa aktif 30 hari, status tagihan, dan aksi perpanjang paket.',
    navigationCategory: 'operasional',
    navigationOrder: 2,
    searchPlaceholder: 'Cari pelanggan, masa aktif, status tagihan, atau pembayaran terakhir...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  request_pppoe_noc: {
    id: 'request_pppoe_noc',
    label: 'Request PPPoE NOC',
    description: 'Antrean request PPPoE dari teknisi lapangan.',
    navigationCategory: 'operasional',
    navigationOrder: 3,
    searchPlaceholder: 'Cari WO pasang baru, pelanggan, wilayah, atau status request PPPoE...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  request_rembes: {
    id: 'request_rembes',
    label: 'Request Rembes',
    description: 'Pengajuan rembes pegawai.',
    navigationCategory: 'keuangan',
    navigationOrder: 1,
    searchPlaceholder: 'Cari rembes, pemohon, divisi, atau status...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  approval_rembes_finance: {
    id: 'approval_rembes_finance',
    label: 'Approval Rembes Finance',
    description: 'Review, approval, dan pencairan rembes.',
    navigationCategory: 'keuangan',
    navigationOrder: 2,
    searchPlaceholder: 'Cari request rembes, pemohon, atau status approval...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  laporan_keuangan: {
    id: 'laporan_keuangan',
    label: 'Laporan Keuangan',
    description: 'Ledger billing, rembes, dan mutasi.',
    navigationCategory: 'keuangan',
    navigationOrder: 4,
    searchPlaceholder: 'Cari mutasi, billing, rembes, atau referensi transaksi...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  retur_gudang_perangkat: {
    id: 'retur_gudang_perangkat',
    label: 'Retur Gudang Perangkat',
    description: 'QC retur perangkat lama/error dan alat pengganti yang tidak terpakai dari pekerjaan maintenance.',
    navigationCategory: 'operasional',
    navigationOrder: 3,
    searchPlaceholder: 'Cari retur perangkat, WO maintenance, pelanggan, atau status QC gudang...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  panel_kepala_teknisi: {
    id: 'panel_kepala_teknisi',
    label: 'Panel Kepala Teknisi',
    description: 'Antrean pemasangan siap jalan, distribusi WO, dan kontrol assignment teknisi.',
    navigationCategory: 'operasional',
    navigationOrder: 5,
    searchPlaceholder: 'Cari WO siap assign, pelanggan, wilayah, atau teknisi tujuan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  panel_teknisi_lapangan: {
    id: 'panel_teknisi_lapangan',
    label: 'Panel Teknisi Lapangan',
    description: 'Dashboard ringkas teknisi lapangan berisi summary tugas dan daftar pekerjaan aktif.',
    navigationCategory: 'dashboards',
    navigationOrder: 3,
    quickAction: null,
    viewFormats: ['grid', 'table'],
  },
  pengerjaan_instalasi_lapangan: {
    id: 'pengerjaan_instalasi_lapangan',
    label: 'Pengerjaan Instalasi Lapangan',
    description: 'Halaman kerja teknisi lapangan untuk memulai instalasi, melengkapi bukti, dan submit hasil pekerjaan.',
    navigationCategory: 'operasional',
    navigationOrder: 6,
    searchPlaceholder: 'Cari WO saya, pelanggan, wilayah, atau status pemasangan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  qc_instalasi_noc: {
    id: 'qc_instalasi_noc',
    label: 'QC Instalasi NOC',
    description: 'Antrean QC dan approval instalasi untuk review hasil pekerjaan teknisi lapangan.',
    navigationCategory: 'operasional',
    navigationOrder: 7,
    searchPlaceholder: 'Cari WO QC, pelanggan, teknisi, atau status review...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  registrasi_pelanggan_baru: {
    id: 'registrasi_pelanggan_baru',
    label: 'Registrasi Pelanggan Baru',
    description: 'Intake internal pelanggan baru, paket, lokasi, dan data awal instalasi.',
    navigationCategory: 'operasional',
    navigationOrder: 4,
    searchPlaceholder: 'Cari nama pelanggan, nomor HP, paket, atau wilayah...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  validasi_registrasi: {
    id: 'validasi_registrasi',
    label: 'Validasi Registrasi',
    description: 'Antrean verifikasi kelengkapan data registrasi sebelum survey.',
    navigationCategory: 'operasional',
    navigationOrder: 5,
    searchPlaceholder: 'Cari registrasi yang menunggu validasi atau revisi data...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  survey_instalasi: {
    id: 'survey_instalasi',
    label: 'Survey Instalasi',
    description: 'Kelayakan instalasi, ODP, jalur, dan kebutuhan teknis survey.',
    navigationCategory: 'operasional',
    navigationOrder: 6,
    searchPlaceholder: 'Cari pelanggan survey, jalur, ODP, atau status layak...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  request_gudang_instalasi: {
    id: 'request_gudang_instalasi',
    label: 'Request Gudang Instalasi',
    description: 'Permintaan material instalasi dan status penyerahan perangkat.',
    navigationCategory: 'operasional',
    navigationOrder: 8,
    searchPlaceholder: 'Cari request gudang, WO, pelanggan, atau status material...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  aktivasi_instalasi: {
    id: 'aktivasi_instalasi',
    label: 'Aktivasi Instalasi',
    description: 'Alias kompatibilitas untuk mengarahkan role ke modul kerja lapangan atau QC NOC yang baru.',
    navigationCategory: 'operasional',
    navigationOrder: 9,
    searchPlaceholder: 'Alias kompatibilitas aktivasi instalasi.',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  service_registrations: {
    id: 'service_registrations',
    label: 'Registrasi Pasang Baru',
    description: 'Pipeline sales, finance, NOC, dan dispatch untuk pelanggan baru.',
    navigationCategory: 'operasional',
    navigationOrder: 10,
    searchPlaceholder: 'Cari registrasi, nama pelanggan, ODP, atau status approval...',
    quickAction: 'new_customer',
    viewFormats: ['table', 'grid'],
  },
  helpdesk: {
    id: 'helpdesk',
    label: 'Helpdesk & Ticketing',
    description: 'Aduan pelanggan, intake tiket, dan alur helpdesk.',
    navigationCategory: 'operasional',
    navigationOrder: 8,
    searchPlaceholder: 'Cari pelanggan, nomor tiket, atau nomor aduan...',
    quickAction: 'new_ticket',
    viewFormats: ['table', 'grid'],
  },
  buat_tiket: {
    id: 'buat_tiket',
    label: 'Buat Tiket',
    description: 'Modul pembuatan tiket gangguan dan aduan pelanggan baru.',
    navigationCategory: 'operasional',
    navigationOrder: 9,
    searchPlaceholder: 'Pilih pelanggan, kategori masalah, atau input keluhan...',
    quickAction: 'new_ticket',
    viewFormats: ['grid', 'table'],
  },
  noc: {
    id: 'noc',
    label: 'NOC Console',
    description: 'Triage teknis, verifikasi sinyal, dan closing tiket.',
    navigationCategory: 'operasional',
    navigationOrder: 9,
    searchPlaceholder: 'Cari tiket, ODP, user PPPoE, atau serial ONT...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  lead_tech: {
    id: 'lead_tech',
    label: 'Lead Technician Workspace',
    description: 'Assign work order, review SOP, dan monitoring teknisi.',
    navigationCategory: 'operasional',
    navigationOrder: 10,
    searchPlaceholder: 'Cari WO, pelanggan, atau teknisi lapangan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  field_tech: {
    id: 'field_tech',
    label: 'Portal Teknisi Lapangan',
    description: 'Eksekusi WO, bukti kerja, dan laporan on-site.',
    navigationCategory: 'operasional',
    navigationOrder: 11,
    quickAction: null,
    viewFormats: ['table'],
  },
  finance: {
    id: 'finance',
    label: 'Finance Desk',
    description: 'Billing pelanggan dan approval procurement finance.',
    navigationCategory: 'operasional',
    navigationOrder: 12,
    searchPlaceholder: 'Cari pelanggan, tagihan, PPPoE user, atau status layanan...',
    quickAction: null,
    viewFormats: ['table', 'grid'],
  },
  inventory: {
    id: 'inventory',
    label: 'Pengadaan Barang',
    description: 'Log riwayat pengadaan, approval finance/direktur, status pembayaran, dan penerimaan barang masuk ke gudang.',
    navigationCategory: 'operasional',
    navigationOrder: 13,
    searchPlaceholder: 'Cari request pengadaan, nama barang, pemohon, atau status...',
    quickAction: 'new_procurement',
    viewFormats: ['table', 'grid'],
  },
  stok_barang: {
    id: 'stok_barang',
    label: 'Stok & Material Gudang',
    description: 'Katalog master inventaris gudang, kuantitas stok siap pakai, barang terpasang, dan monitoring stok kritis.',
    navigationCategory: 'operasional',
    navigationOrder: 14,
    searchPlaceholder: 'Cari nama barang, kode item, kategori, brand, atau lokasi rak...',
    quickAction: 'new_procurement',
    viewFormats: ['table', 'grid'],
  },
  request_pengadaan_barang: {
    id: 'request_pengadaan_barang',
    label: 'Permintaan Barang',
    description: 'Modul pengajuan pengadaan barang baru, restock inventaris gudang, dan estimasi anggaran.',
    navigationCategory: 'operasional',
    navigationOrder: 15,
    searchPlaceholder: 'Pilih katalog barang, isi jumlah pengadaan, atau alasan kebutuhan...',
    quickAction: 'new_procurement',
    viewFormats: ['grid', 'table'],
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
  inventory_pop: {
    id: 'inventory_pop',
    label: 'Inventory POP',
    description: 'Manajemen server cabang, inventori perangkat terpasang (OLT, Switch, Power), dan alur instruksi kerja POP.',
    navigationCategory: 'infrastruktur',
    navigationOrder: 2,
    searchPlaceholder: 'Cari POP, server cabang, perangkat terpasang, atau penugasan...',
    quickAction: null,
    viewFormats: ['grid', 'table'],
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
    allowedModules: ['dashboard', 'about', 'pelanggan', 'penagihan', 'request_pppoe_noc', 'request_rembes', 'approval_rembes_finance', 'laporan_keuangan', 'retur_gudang_perangkat', 'panel_kepala_teknisi', 'panel_teknisi_lapangan', 'pengerjaan_instalasi_lapangan', 'qc_instalasi_noc', 'registrasi_pelanggan_baru', 'validasi_registrasi', 'survey_instalasi', 'request_gudang_instalasi', 'aktivasi_instalasi', 'service_registrations', 'helpdesk', 'buat_tiket', 'noc', 'lead_tech', 'field_tech', 'finance', 'inventory', 'stok_barang', 'inventory_pop', 'request_pengadaan_barang', 'kanban', 'network_map', 'admin_users', 'admin_roles', 'admin_master', 'admin_modules', 'admin_module_roles', 'admin_mappings', 'admin_audit'],
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
    allowedModules: ['service_registrations', 'registrasi_pelanggan_baru', 'buat_tiket', 'request_rembes', 'kanban'],
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
    allowedModules: ['dashboard', 'buat_tiket', 'stok_barang', 'inventory_pop', 'request_pengadaan_barang', 'request_rembes', 'approval_rembes_finance', 'laporan_keuangan'],
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
    allowedModules: ['helpdesk', 'buat_tiket', 'registrasi_pelanggan_baru', 'validasi_registrasi', 'request_rembes', 'kanban'],
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
    allowedModules: ['noc', 'buat_tiket', 'request_pppoe_noc', 'qc_instalasi_noc', 'service_registrations', 'inventory_pop', 'request_rembes', 'network_map', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline NOC',
    workspaceLabel: 'NOC Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  lead_tech: {
    role: 'lead_tech',
    title: 'Panel Kepala Teknisi',
    subtitle: 'Serah terima pemasangan siap jalan, kontrol distribusi WO, dan assignment teknisi lapangan.',
    shellMode: 'compact',
    defaultModule: 'panel_kepala_teknisi',
    allowedModules: ['panel_kepala_teknisi', 'lead_tech', 'stok_barang', 'inventory_pop', 'request_pengadaan_barang', 'validasi_registrasi', 'survey_instalasi', 'request_rembes', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Panel Kepala Teknisi',
    workspaceLabel: 'Lead Tech Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  field_tech: {
    role: 'field_tech',
    title: 'Panel Teknisi Lapangan',
    subtitle: 'Ringkasan pekerjaan saya, antrean tugas aktif, dan akses ke halaman kerja instalasi.',
    shellMode: 'standalone',
    defaultModule: 'panel_teknisi_lapangan',
    allowedModules: ['panel_teknisi_lapangan', 'pengerjaan_instalasi_lapangan', 'field_tech', 'inventory_pop', 'request_rembes'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Panel Teknisi',
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
    allowedModules: ['finance', 'pelanggan', 'penagihan', 'stok_barang', 'request_pengadaan_barang', 'request_rembes', 'approval_rembes_finance', 'laporan_keuangan', 'service_registrations', 'kanban'],
    homeLabel: 'Dashboards',
    navigationLabel: 'Pipeline Finance',
    workspaceLabel: 'Finance Menu',
    showSearchShortcut: true,
    showSidebarNavigation: true,
  },
  inventory: {
    role: 'inventory',
    title: 'Pengadaan Barang Gudang',
    subtitle: 'Monitoring alur pengadaan, approval finance/direktur, bukti transfer, dan penerimaan stok.',
    shellMode: 'compact',
    defaultModule: 'inventory',
    allowedModules: ['inventory', 'stok_barang', 'inventory_pop', 'request_pengadaan_barang', 'retur_gudang_perangkat', 'request_gudang_instalasi', 'request_rembes', 'kanban'],
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

export const getDashboardModuleForRole = (
  role: UserRole,
  preferredDashboardModule?: string | null,
): AppModule => {
  if (role === 'superadmin') {
    return 'dashboard';
  }

  if (
    preferredDashboardModule &&
    isFallbackImplementedAppModule(preferredDashboardModule) &&
    !SUPERADMIN_DASHBOARD_MODULES.includes(preferredDashboardModule)
  ) {
    return preferredDashboardModule;
  }

  return getDefaultModuleForRole(role);
};

export const getResolvedAllowedModules = (role: UserRole, navigationConfig?: NavigationConfig | null): AppModule[] => {
  const fallbackModules = getRoleWorkspace(role).allowedModules;
  const hasNavigationConfig = navigationConfig !== undefined && navigationConfig !== null;
  const mappedModules = navigationConfig?.allowedModuleKeys?.filter((moduleKey): moduleKey is AppModule => (
    Object.prototype.hasOwnProperty.call(MODULE_META, moduleKey)
  )) ?? [];
  const resolvedModules = hasNavigationConfig ? mappedModules : fallbackModules;

  if (role === 'superadmin') {
    return Array.from(new Set(['dashboard', ...resolvedModules, ...SUPERADMIN_DASHBOARD_MODULES]));
  }

  return resolvedModules;
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

export const getNavigationSections = (role: UserRole, navigationConfig?: NavigationConfig | null): NavigationSection[] => {
  if (navigationConfig) {
    const configuredSections = navigationConfig.heads
      .sort((left, right) => left.order - right.order)
      .map((head) => ({
        id: head.key,
        label: head.label,
        searchLabel: head.label,
        order: head.order,
        modules: navigationConfig.modules
          .filter((module) =>
            module.navigationHeadKey === head.key &&
            navigationConfig.allowedModuleKeys.includes(module.key) &&
            isFallbackImplementedAppModule(module.key),
          )
          .sort((left, right) => left.order - right.order)
          .map((module) => ({
            id: module.key as AppModule,
            label: module.label,
            description: module.description,
            routeTarget: resolveFallbackRouteTarget(module.routeTarget, module.key),
          })),
      }))
      .filter((head) => head.modules.length > 0);

    if (configuredSections.length > 0) {
      return configuredSections;
    }

    return role === 'superadmin'
      ? getNavigationSectionsForRole(role).map((section) => ({
          ...section,
          modules: section.modules
            .filter((module) => !SUPERADMIN_DASHBOARD_MODULES.includes(module.id))
            .map((module) => ({
              id: module.id,
              label: module.label,
              description: module.description,
              routeTarget: getFallbackRoutePathForModule(module.id),
            })),
        }))
        .filter((section) => section.modules.length > 0)
      : [];
  }

  return getNavigationSectionsForRole(role).map((section) => ({
    ...section,
    modules: section.modules.map((module) => ({
      id: module.id,
      label: module.label,
      description: module.description,
      routeTarget: getFallbackRoutePathForModule(module.id),
    })),
  }));
};

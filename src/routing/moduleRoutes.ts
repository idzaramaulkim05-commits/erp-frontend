import { AppModule, ImplementedAppModule, NavigationConfig, UserRole } from '../types';
import { getDashboardModuleForRole } from '../config/roleWorkspace';

export const MODULE_ROUTE_MAP: Record<AppModule, string> = {
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

const ROUTE_MODULE_ENTRIES = Object.entries(MODULE_ROUTE_MAP) as Array<[AppModule, string]>;

export const isImplementedAppModule = (moduleKey: string): moduleKey is ImplementedAppModule => (
  Object.prototype.hasOwnProperty.call(MODULE_ROUTE_MAP, moduleKey)
);

export const getRoutePathForModule = (module: AppModule): string => MODULE_ROUTE_MAP[module];

export const getModuleFromPathname = (pathname: string): AppModule | null => {
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    decoded = pathname;
  }

  const normalized = decoded.replace(/\/+$/, '') || '/';

  if (normalized === '/app/admin') {
    return 'dashboard';
  }

  // 1. Direct match
  const match = ROUTE_MODULE_ENTRIES.find(([, routePath]) => routePath === normalized);
  if (match) return match[0];

  // 2. Normalized dash / space / underscore match
  const sanitized = normalized.toLowerCase().replace(/[\s_]+/g, '-');
  const sanitizedMatch = ROUTE_MODULE_ENTRIES.find(([, routePath]) => routePath.toLowerCase().replace(/[\s_]+/g, '-') === sanitized);
  if (sanitizedMatch) return sanitizedMatch[0];

  // 3. Match against module key directly (e.g. /app/retur_gudang_perangkat)
  const strippedKey = normalized.replace(/^\/app\//, '').replace(/[-\s]+/g, '_');
  if (isImplementedAppModule(strippedKey)) {
    return strippedKey;
  }

  return null;
};

export const isKnownModuleRouteTarget = (routeTarget: string): routeTarget is AppModule => isImplementedAppModule(routeTarget);

export const resolveModuleRouteTarget = (routeTarget: string | null | undefined, moduleKey?: string): string => {
  if (routeTarget?.startsWith('/app/')) {
    return routeTarget;
  }

  if (routeTarget && isKnownModuleRouteTarget(routeTarget)) {
    return getRoutePathForModule(routeTarget);
  }

  if (moduleKey && isImplementedAppModule(moduleKey)) {
    return getRoutePathForModule(moduleKey);
  }

  return MODULE_ROUTE_MAP.dashboard;
};

export const getDefaultRouteForRole = (
  role: UserRole,
  preferredDashboardModule?: string | null,
  navigationConfig?: NavigationConfig | null,
): string => {
  void navigationConfig;
  return getRoutePathForModule(getDashboardModuleForRole(role, preferredDashboardModule));
};

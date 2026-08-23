import { AppModule, ImplementedAppModule, NavigationConfig, UserRole } from '../types';
import { getDefaultModuleForRole, getResolvedAllowedModules } from '../config/roleWorkspace';

export const MODULE_ROUTE_MAP: Record<AppModule, string> = {
  dashboard: '/app/dashboard',
  service_registrations: '/app/service-registrations',
  helpdesk: '/app/helpdesk',
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
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/app/admin') {
    return 'dashboard';
  }

  const match = ROUTE_MODULE_ENTRIES.find(([, routePath]) => routePath === normalized);
  return match?.[0] ?? null;
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

export const getDefaultRouteForRole = (role: UserRole, navigationConfig?: NavigationConfig | null): string => {
  const fallbackModule = getDefaultModuleForRole(role);
  const allowedModules = getResolvedAllowedModules(role, navigationConfig);
  const preferredModule = allowedModules.includes(fallbackModule)
    ? fallbackModule
    : allowedModules[0] ?? fallbackModule;

  return getRoutePathForModule(preferredModule);
};

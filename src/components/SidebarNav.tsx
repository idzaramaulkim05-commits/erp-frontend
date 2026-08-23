import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Columns,
  ClipboardList,
  Code2,
  Database,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Package,
  Radio,
  ScrollText,
  Shield,
  Sparkles,
  UserCog,
  Users,
  Wifi,
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';
import { useAuth } from '../context/AuthContext';
import { AppModule } from '../types';
import { getNavigationSectionsForRole, getRoleWorkspace } from '../config/roleWorkspace';
import { getRoutePathForModule, isImplementedAppModule, resolveModuleRouteTarget } from '../routing/moduleRoutes';

interface SidebarNavProps {
  onOpenTechSpecs: () => void;
  onOpenWorkflowGuide: () => void;
}

const moduleIcons: Record<AppModule, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  service_registrations: ClipboardList,
  helpdesk: HelpCircle,
  noc: Radio,
  lead_tech: Shield,
  field_tech: Shield,
  finance: Radio,
  inventory: Package,
  kanban: Columns,
  network_map: Wifi,
  admin_users: Users,
  admin_roles: UserCog,
  admin_master: Database,
  admin_modules: Database,
  admin_module_roles: Columns,
  admin_mappings: Wifi,
  admin_audit: ScrollText,
};

export const SidebarNav: React.FC<SidebarNavProps> = ({
  onOpenTechSpecs,
  onOpenWorkflowGuide,
}) => {
  const {
    currentUser,
    activeRole,
    selectedModule,
    navigationConfig,
  } = useIOMS();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const navigationSections = navigationConfig && navigationConfig.heads.length > 0
    ? navigationConfig.heads
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
              isImplementedAppModule(module.key),
            )
            .sort((left, right) => left.order - right.order)
            .map((module) => ({
              id: module.key as AppModule,
              label: module.label,
              description: module.description,
              routeTarget: resolveModuleRouteTarget(module.routeTarget, module.key),
            })),
        }))
        .filter((head) => head.modules.length > 0)
    : getNavigationSectionsForRole(activeRole);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white text-slate-700 z-30 select-none">
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl font-bold text-white shadow-sm ${
            roleWorkspace.shellMode === 'admin' ? 'bg-emerald-700 shadow-emerald-500/20' : 'bg-slate-900 shadow-slate-400/20'
          }`}>
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-slate-900">
              PT Solusi Jaringan Nusantara
            </h1>
            <p className="text-xs text-slate-500">{roleWorkspace.title}</p>
          </div>
        </div>
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            {roleWorkspace.workspaceLabel}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-800">
            {roleWorkspace.subtitle}
          </div>
        </div>

        {navigationSections.map((section) => (
          <div key={section.id}>
            <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {section.label}
            </div>
            <div className="space-y-1">
              {section.modules.map((item) => {
                const moduleId = item.id as AppModule;
                const Icon = moduleIcons[moduleId];
                const routeTarget = 'routeTarget' in item ? item.routeTarget : getRoutePathForModule(moduleId);
                const isActive = location.pathname === routeTarget || selectedModule === moduleId;

                return (
                  <button
                    key={moduleId}
                    onClick={() => navigate(routeTarget)}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-1 border-t border-slate-200 pt-4">
          <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            System & Guides
          </div>

          <button
            onClick={onOpenWorkflowGuide}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{activeRole === 'superadmin' ? 'Admin Playbook' : 'Panduan 6 Alur Kerja'}</span>
          </button>

          <button
            onClick={onOpenTechSpecs}
            className="flex w-full items-center gap-2.5 rounded-2xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Backend Spec (Laravel)</span>
          </button>
        </div>
      </nav>

      <div className="mt-auto space-y-3 border-t border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-2 ring-emerald-100"
          />
          <div className="overflow-hidden">
            <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="truncate">{roleWorkspace.title}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

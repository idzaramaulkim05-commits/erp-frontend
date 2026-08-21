import React from 'react';
import {
  Activity,
  Code2,
  Columns,
  Database,
  HelpCircle,
  Layers,
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
import { getAllowedModulesForRole, getRoleWorkspace } from '../config/roleWorkspace';

interface SidebarNavProps {
  onOpenTechSpecs: () => void;
  onOpenWorkflowGuide: () => void;
}

const moduleIcons: Record<AppModule, React.ComponentType<{ className?: string }>> = {
  dashboard: Activity,
  helpdesk: HelpCircle,
  noc: Radio,
  lead_tech: Shield,
  field_tech: Shield,
  finance: Layers,
  inventory: Package,
  kanban: Columns,
  network_map: Wifi,
  admin_users: Users,
  admin_roles: UserCog,
  admin_master: Database,
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
    setSelectedModule,
  } = useIOMS();
  const { logout } = useAuth();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const allowedModules = getAllowedModulesForRole(activeRole);

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800 text-slate-300 font-sans z-30 select-none">
      <div className="p-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-sm ${
            roleWorkspace.shellMode === 'admin' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-500 shadow-blue-500/30'
          }`}>
            {roleWorkspace.shellMode === 'admin' ? 'S' : 'I'}
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight font-mono">
              IOMS <span className="text-blue-400 text-xs font-normal">v1.0</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">{roleWorkspace.title}</p>
          </div>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-950 animate-pulse" />
      </div>

      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto font-sans">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2 px-2 font-mono">
          {roleWorkspace.workspaceLabel}
        </div>

        {allowedModules.map((item) => {
          const Icon = moduleIcons[item.id];
          const isActive = selectedModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-xs font-medium text-left ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border-l-4 border-blue-500 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
            </button>
          );
        })}

        <div className="pt-4 mt-2 border-t border-slate-800/80 space-y-1">
          <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2 px-2 font-mono">
            System & Guides
          </div>

          <button
            onClick={onOpenWorkflowGuide}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-all text-xs text-left"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{activeRole === 'superadmin' ? 'Admin Playbook' : 'Panduan 6 Alur Kerja'}</span>
          </button>

          <button
            onClick={onOpenTechSpecs}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-all text-xs text-left font-mono"
          >
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span>Backend Spec (Laravel)</span>
          </button>
        </div>
      </nav>

      <div className="p-3.5 mt-auto border-t border-slate-800 bg-slate-950/40 space-y-3">
        <div className="flex items-center gap-2.5 overflow-hidden p-1.5">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="truncate">{roleWorkspace.title}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => void logout()}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

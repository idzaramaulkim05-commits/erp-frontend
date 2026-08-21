import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CircleOff,
  Code2,
  Columns,
  Database,
  Grid,
  HelpCircle,
  KeyRound,
  Layers,
  LogOut,
  Package,
  Radio,
  ScrollText,
  Search,
  Shield,
  Sparkles,
  Sun,
  UserCog,
  Users,
  Wifi,
} from 'lucide-react';
import { ChangePasswordModal } from './auth/ChangePasswordModal';
import { useIOMS } from '../context/IOMSContext';
import { useAuth } from '../context/AuthContext';
import { AppModule } from '../types';
import { getAllowedModulesForRole, getRoleWorkspace } from '../config/roleWorkspace';

interface HeaderNavbarProps {
  onOpenArchSpecs: () => void;
  onOpenWorkflowGuide?: () => void;
  onToggleSidebar?: () => void;
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

const UserAvatar: React.FC<{ src?: string; alt: string; fallback: string; size?: string }> = ({
  src,
  alt,
  fallback,
  size = 'w-9 h-9',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${size} rounded-full bg-slate-900 text-white ring-2 ring-emerald-400 flex items-center justify-center font-bold text-xs shrink-0`}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${size} rounded-full object-cover ring-2 ring-emerald-400 shrink-0`}
    />
  );
};

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenArchSpecs,
  onOpenWorkflowGuide,
}) => {
  const {
    currentUser,
    activeRole,
    selectedModule,
    setSelectedModule,
    tickets,
    procurementRequests,
    users,
    auditLogs,
  } = useIOMS();
  const { logout } = useAuth();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const roleWorkspace = getRoleWorkspace(activeRole);
  const allowedModules = getAllowedModulesForRole(activeRole);
  const activeModule = allowedModules.some((item) => item.id === selectedModule)
    ? selectedModule
    : roleWorkspace.defaultModule;
  const activeModuleMeta = allowedModules.find((item) => item.id === activeModule);
  const isStandaloneWorkspace = roleWorkspace.shellMode === 'standalone';

  const onlineUsers = users.filter((user) => user.isOnline).length;
  const inactiveUsers = users.filter((user) => user.isActive === false).length;
  const openLosTickets = tickets.filter((ticket) => ticket.category === 'los_red_light' && ticket.status !== 'closed').length;
  const pendingCapex = procurementRequests.filter((procurement) => procurement.status === 'pending_management' || procurement.status === 'pending_finance').length;
  const totalAlerts = activeRole === 'superadmin'
    ? inactiveUsers + onlineUsers
    : openLosTickets + pendingCapex;

  const accountFallback = useMemo(
    () => currentUser.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    [currentUser.name],
  );

  const notificationBody = activeRole === 'superadmin' ? (
    <>
      <div className="p-3 hover:bg-emerald-50/50 transition-colors flex items-start space-x-2.5">
        <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">{onlineUsers} User Sedang Online</p>
          <p className="text-[11px] text-slate-500">Pantau akses aplikasi dan aktivitas session internal.</p>
        </div>
      </div>
      <div className="p-3 hover:bg-rose-50/50 transition-colors flex items-start space-x-2.5">
        <CircleOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">{inactiveUsers} Akun Dalam Status Nonaktif</p>
          <p className="text-[11px] text-slate-500">Tinjau akun yang diblokir, perlu reset, atau butuh reaktivasi.</p>
        </div>
      </div>
      <div className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2.5">
        <ScrollText className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">{auditLogs.length} Aktivitas Audit Termuat</p>
          <p className="text-[11px] text-slate-500">Jejak auth, perubahan status, dan update master data tersedia.</p>
        </div>
      </div>
    </>
  ) : (
    <>
      {openLosTickets > 0 && (
        <div className="p-3 hover:bg-rose-50/50 transition-colors flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">{openLosTickets} Tiket Alarm LOS Merah</p>
            <p className="text-[11px] text-slate-500">Gangguan teknis yang masih perlu tindak lanjut.</p>
          </div>
        </div>
      )}
      {pendingCapex > 0 && (
        <div className="p-3 hover:bg-amber-50/50 transition-colors flex items-start space-x-2.5">
          <Layers className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">{pendingCapex} Pengadaan Menunggu Approval</p>
            <p className="text-[11px] text-slate-500">Pantau approval procurement lintas divisi.</p>
          </div>
        </div>
      )}
      <div className="p-3 hover:bg-slate-50 transition-colors flex items-start space-x-2.5">
        <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">{activeModuleMeta?.label ?? roleWorkspace.title}</p>
          <p className="text-[11px] text-slate-500">{activeModuleMeta?.description ?? roleWorkspace.subtitle}</p>
        </div>
      </div>
    </>
  );

  const accountMenu = (
    <div
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      onMouseLeave={() => setShowAccountMenu(false)}
    >
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-900 truncate">{currentUser.name}</p>
        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mt-2">{roleWorkspace.title}</p>
      </div>
      <div className="space-y-1 mt-2">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            setIsChangePasswordOpen(true);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-slate-700 hover:bg-slate-50"
        >
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <span>Ubah password</span>
        </button>
        <button
          onClick={() => {
            setShowAccountMenu(false);
            void logout();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs text-rose-700 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
      <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between px-2">
        <button
          onClick={() => {
            setShowAccountMenu(false);
            onOpenArchSpecs();
          }}
          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Spesifikasi React+Laravel</span>
        </button>
        {onOpenWorkflowGuide && (
          <button
            onClick={() => {
              setShowAccountMenu(false);
              onOpenWorkflowGuide();
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeRole === 'superadmin' ? 'Admin Playbook' : '6 Alur Kerja'}</span>
          </button>
        )}
      </div>
    </div>
  );

  const notificationMenu = (
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
      onMouseLeave={() => setShowNotifications(false)}
    >
      <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          {roleWorkspace.title}
        </span>
        <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
          {totalAlerts} Alert
        </span>
      </div>
      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
        {notificationBody}
      </div>
    </div>
  );

  const rightActions = (
    <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
      <button
        className="h-10 w-10 flex items-center justify-center text-amber-500 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        title="Mode Tampilan"
      >
        <Sun className="w-5 h-5" />
      </button>

      <div className="w-7 h-5 rounded-sm overflow-hidden border border-slate-200 flex flex-col shrink-0" title="Bahasa Indonesia">
        <div className="h-1/2 bg-red-600 w-full" />
        <div className="h-1/2 bg-white w-full" />
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="h-10 w-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
          title={roleWorkspace.title}
        >
          <Bell className="w-5 h-5" />
          {totalAlerts > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
        {showNotifications && notificationMenu}
      </div>

      <div className="relative shrink-0">
        <button
          onClick={() => setShowAccountMenu(!showAccountMenu)}
          className="h-10 pl-2 pr-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-2"
        >
          <span className="hidden lg:block max-w-48 truncate text-sm font-semibold text-slate-700">
            {roleWorkspace.title}
          </span>
          <UserAvatar
            src={currentUser.avatar}
            alt={currentUser.name}
            fallback={accountFallback}
          />
        </button>
        {showAccountMenu && accountMenu}
      </div>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-2xs">
        {isStandaloneWorkspace ? (
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs text-white bg-linear-to-br from-emerald-600 to-teal-500 shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex w-8 h-8 bg-emerald-100 rounded-full items-center justify-center border border-emerald-300 shrink-0">
                  <span className="text-emerald-700 font-extrabold text-xs">ISP</span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">PT Solusi Jaringan Nusantara</h1>
                  <p className="text-[11px] text-slate-500 font-medium truncate">{roleWorkspace.title}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-end xl:min-w-0">
                <div className="flex flex-wrap gap-3 xl:justify-end">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 min-w-[180px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Workspace Aktif</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{activeModuleMeta?.label ?? roleWorkspace.homeLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 min-w-[180px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Akses</p>
                    <p className="text-sm font-bold text-emerald-900 truncate">Siap kerja lapangan</p>
                  </div>
                </div>
                <div className="xl:pl-2">
                  {rightActions}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs text-white shrink-0 ${
                roleWorkspace.shellMode === 'admin'
                  ? 'bg-linear-to-br from-slate-950 to-emerald-700'
                  : 'bg-linear-to-br from-emerald-600 to-teal-500'
              }`}>
                {roleWorkspace.shellMode === 'admin' ? <Shield className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
              </div>

              <div className="hidden sm:flex w-8 h-8 bg-emerald-100 rounded-full items-center justify-center border border-emerald-300 shrink-0">
                <span className="text-emerald-700 font-extrabold text-xs">ISP</span>
              </div>

              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 leading-tight truncate">PT Solusi Jaringan Nusantara</h1>
                <p className="text-[11px] text-slate-500 font-medium truncate">{roleWorkspace.title}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 flex-1">
              <button
                onClick={() => setSelectedModule(roleWorkspace.defaultModule)}
                className={`flex flex-col items-center group transition-colors cursor-pointer ${
                  activeModule === roleWorkspace.defaultModule ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] uppercase font-bold tracking-wider">{roleWorkspace.homeLabel}</span>
              </button>

              {roleWorkspace.showSidebarNavigation && allowedModules.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowNavMenu(!showNavMenu)}
                    className="flex flex-col items-center text-slate-500 hover:text-slate-800 transition-colors group cursor-pointer"
                  >
                    <Grid className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Navigation</span>
                  </button>

                  {showNavMenu && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onMouseLeave={() => setShowNavMenu(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {roleWorkspace.navigationLabel}
                      </div>
                      <div className="space-y-1 mt-1 max-h-80 overflow-y-auto">
                        {allowedModules.map((item) => {
                          const Icon = moduleIcons[item.id];
                          const isActive = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedModule(item.id);
                                setShowNavMenu(false);
                              }}
                              className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <div className="min-w-0">
                                <p className="text-xs font-bold leading-tight truncate">{item.label}</p>
                                <p className="text-[10px] text-slate-400">{item.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {roleWorkspace.showSearchShortcut && activeModuleMeta?.searchPlaceholder && (
                <button
                  onClick={() => {
                    const el = document.getElementById('main-search-input');
                    if (el) el.focus();
                  }}
                  className="flex flex-col items-center text-slate-500 hover:text-slate-800 transition-colors group cursor-pointer"
                >
                  <Search className="w-5 h-5 mb-0.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Search</span>
                </button>
              )}
            </div>

            <div className="shrink-0">
              {rightActions}
            </div>
          </div>
        )}
      </header>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

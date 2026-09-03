import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeInfo,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Columns,
  Database,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  PlusCircle,
  Radio,
  Receipt,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  Server,
  Shield,
  Trash2,
  UserCog,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  Wrench,
  X,
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';
import { useAuth } from '../context/AuthContext';
import { AppModule } from '../types';
import {
  getNavigationSections,
  getRoleWorkspace,
} from '../config/roleWorkspace';
import { getDefaultRouteForRole, getRoutePathForModule } from '../routing/moduleRoutes';
import { ProfileSettingsModal } from './modals/ProfileSettingsModal';

interface HeaderNavbarProps {
  onOpenArchSpecs: () => void;
  onOpenWorkflowGuide: () => void;
  onOpenProfileSettings?: () => void;
  onToggleSidebar: () => void;
}

const moduleIcons: Record<AppModule, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  about: BadgeInfo,
  pelanggan: Users,
  penagihan: Activity,
  request_pppoe_noc: Radio,
  request_rembes: Receipt,
  approval_rembes_finance: CheckCircle2,
  laporan_keuangan: ScrollText,
  retur_gudang_perangkat: RotateCcw,
  panel_kepala_teknisi: Shield,
  panel_teknisi_lapangan: ClipboardList,
  pengerjaan_instalasi_lapangan: Wrench,
  qc_instalasi_noc: CheckCircle2,
  registrasi_pelanggan_baru: ClipboardList,
  validasi_registrasi: Shield,
  survey_instalasi: Radio,
  request_gudang_instalasi: Package,
  aktivasi_instalasi: Activity,
  service_registrations: ClipboardList,
  helpdesk: HelpCircle,
  buat_tiket: PlusCircle,
  noc: Radio,
  lead_tech: Shield,
  field_tech: Shield,
  finance: Activity,
  inventory: Package,
  stok_barang: Boxes,
  inventory_pop: Server,
  request_pengadaan_barang: PackagePlus,
  kanban: Columns,
  network_map: Wifi,
  admin_users: Users,
  admin_roles: UserCog,
  admin_master: Database,
  admin_modules: Database,
  admin_module_roles: Columns,
  admin_mappings: Wifi,
  admin_audit: ScrollText,
  performa_karyawan: BarChart3,
  pengaturan_profil: UserCog,
};

const shellBadgeClasses: Record<string, string> = {
  admin: 'bg-emerald-950 text-emerald-100 ring-emerald-500/20',
  analytics: 'bg-sky-950 text-sky-100 ring-sky-500/20',
  compact: 'bg-slate-900 text-white ring-slate-300/10',
  standalone: 'bg-slate-900 text-white ring-slate-300/10',
};

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  onOpenArchSpecs,
  onOpenWorkflowGuide,
  onOpenProfileSettings,
  onToggleSidebar,
}) => {
  const {
    currentUser,
    activeRole,
    selectedModule,
    navigationConfig,
    isSyncing,
    notifications,
    dismissNotification,
    clearAllNotifications,
    isSoundEnabled,
    toggleSoundEnabled,
    refreshAll,
    requestNotificationPermission,
  } = useIOMS();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const homeRoute = getDefaultRouteForRole(activeRole, currentUser.dashboardModuleKey, navigationConfig);
  const navigationSections = getNavigationSections(activeRole, navigationConfig);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState('');
  const navigationRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const navigationSearchRef = useRef<HTMLInputElement | null>(null);

  const filteredSections = useMemo(() => {
    const query = navigationQuery.trim().toLowerCase();
    if (!query) {
      return navigationSections;
    }

    return navigationSections
      .map((section) => ({
        ...section,
        modules: section.modules.filter((moduleMeta) => {
          const haystack = `${moduleMeta.label} ${moduleMeta.description} ${section.label}`.toLowerCase();
          return haystack.includes(query);
        }),
      }))
      .filter((section) => section.modules.length > 0);
  }, [navigationQuery, navigationSections]);

  const sectionCount = filteredSections.length;

  const modalMaxWidthClass = useMemo(() => {
    if (sectionCount <= 1) return 'max-w-md';
    if (sectionCount === 2) return 'max-w-2xl';
    if (sectionCount === 3) return 'max-w-4xl';
    return 'max-w-5xl';
  }, [sectionCount]);

  const gridColsClass = useMemo(() => {
    if (sectionCount === 1) return 'grid-cols-1';
    if (sectionCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (sectionCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  }, [sectionCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (navigationRef.current && !navigationRef.current.contains(target)) {
        setIsNavigationOpen(false);
      }

      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }

      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isNavigationOpen) {
        setIsNavigationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNavigationOpen]);

  useEffect(() => {
    if (!isNavigationOpen) {
      setNavigationQuery('');
      return;
    }

    window.setTimeout(() => navigationSearchRef.current?.focus(), 50);
  }, [isNavigationOpen]);

  const openNavigationMenu = () => {
    setIsNavigationOpen(true);
    setIsAccountMenuOpen(false);
  };

  const handleSelectModule = (moduleId: AppModule, routeTarget?: string) => {
    const nextPath = routeTarget ?? getRoutePathForModule(moduleId);
    navigate(nextPath);
    setIsNavigationOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 lg:hidden"
            aria-label="Buka navigasi samping"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 shadow-sm ${shellBadgeClasses[roleWorkspace.shellMode]}`}>
            <Shield className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="truncate text-[clamp(1.1rem,1vw+0.9rem,1.6rem)] font-black tracking-tight text-slate-900">
              PT Solusi Jaringan Nusantara
            </div>
            <div className="truncate text-sm font-medium text-slate-500">
              {roleWorkspace.title}
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={() => navigate(homeRoute)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              location.pathname === homeRoute
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{roleWorkspace.homeLabel}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNavigationOpen((current) => !current)}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isNavigationOpen
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Navigation</span>
              <ChevronDown className={`h-4 w-4 transition ${isNavigationOpen ? 'rotate-180' : ''}`} />
            </button>

            {isNavigationOpen && (
              <div
                className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 p-4 pt-16 sm:pt-20 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setIsNavigationOpen(false);
                  }
                }}
              >
                <div
                  ref={navigationRef}
                  className="w-full max-w-5xl overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] transition-all animate-in zoom-in-95 duration-150"
                >
                  {/* Top Search Bar */}
                  <div className="border-b border-slate-100 px-6 py-4 bg-white">
                    <div className="relative w-full max-w-xl mx-auto">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={navigationSearchRef}
                        type="text"
                        value={navigationQuery}
                        onChange={(event) => setNavigationQuery(event.target.value)}
                        placeholder="Search navigation..."
                        className="h-11 w-full rounded-full border border-slate-200 bg-white pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/60"
                      />
                      {navigationQuery && (
                        <button
                          type="button"
                          onClick={() => setNavigationQuery('')}
                          className="absolute right-3.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Kosongkan pencarian"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Scrollable Clean Columns */}
                  <div className="flex overflow-x-auto p-6 pt-5 divide-x divide-slate-100/90 max-h-[70vh]">
                    {filteredSections.length > 0 ? (
                      filteredSections.map((section) => (
                        <div
                          key={section.id}
                          className="min-w-[210px] max-w-[250px] shrink-0 px-5 first:pl-2 last:pr-2 flex flex-col space-y-3"
                        >
                          {/* Category Header */}
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#1e293b]">
                            {section.label}
                          </div>

                          {/* Menu Items List */}
                          <div className="space-y-1">
                            {section.modules.map((moduleMeta) => {
                              const moduleId = moduleMeta.id as AppModule;
                              const routeTarget = 'routeTarget' in moduleMeta ? moduleMeta.routeTarget : getRoutePathForModule(moduleId);
                              const isActive = location.pathname === routeTarget || selectedModule === moduleId;

                              return (
                                <button
                                  key={moduleId}
                                  type="button"
                                  onClick={() => handleSelectModule(moduleId, routeTarget)}
                                  className={`group flex w-full items-center gap-2.5 py-1.5 px-2 text-left transition rounded-lg ${
                                    isActive
                                      ? 'text-indigo-600 bg-indigo-50/70 font-bold'
                                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 font-normal'
                                  }`}
                                >
                                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition ${
                                    isActive
                                      ? 'text-indigo-600'
                                      : 'text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5'
                                  }`} />
                                  <span className="truncate text-[12.5px] leading-relaxed">
                                    {moduleMeta.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="w-full flex min-h-[180px] items-center justify-center p-6 text-center text-slate-400 text-xs">
                        Tidak ada menu navigasi yang cocok dengan "{navigationQuery}".
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={openNavigationMenu}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Live Sync Status & Manual Refresh */}
          <button
            type="button"
            onClick={() => void refreshAll()}
            disabled={isSyncing}
            title="Sinkronisasi live data otomatis. Klik untuk refresh manual sekarang."
            className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/50"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-900 font-bold">Live Sync</span>
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={toggleSoundEnabled}
            title={isSoundEnabled ? 'Suara Notifikasi Tugas: AKTIF (Klik untuk nonaktifkan)' : 'Suara Notifikasi: HENING (Klik untuk aktifkan)'}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border shadow-sm transition ${
              isSoundEnabled
                ? 'border-emerald-200 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50'
                : 'border-slate-200 bg-white text-slate-400 hover:text-slate-600'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="h-5 w-5 text-emerald-600" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotifMenuOpen((cur) => !cur);
                void requestNotificationPermission();
              }}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
              aria-label="Notifikasi"
            >
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                  {notifications.length}
                </span>
              )}
            </button>

            {isNotifMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 sm:w-96 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_50px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-emerald-600" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Notifikasi Pekerjaan Live</h4>
                  </div>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllNotifications}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      Bersihkan
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500/60 mx-auto mb-2" />
                      Tidak ada tugas baru tertunda.
                      <div className="text-[11px] text-slate-400 mt-1">Data tersinkronisasi otomatis setiap 6 detik.</div>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50 p-3 transition hover:bg-slate-100/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-black text-slate-900">{notif.title}</h5>
                          <button
                            type="button"
                            onClick={() => dismissNotification(notif.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                        {notif.routeTarget && (
                          <div className="mt-2.5 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                navigate(notif.routeTarget!);
                                setIsNotifMenuOpen(false);
                                dismissNotification(notif.id);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-950 px-3 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                            >
                              <span>Buka Tugas</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={accountRef}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-emerald-200"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-10 w-10 rounded-2xl object-cover ring-2 ring-emerald-200"
              />
              <div className="hidden text-left lg:block">
                <div className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                  {roleWorkspace.title}
                </div>
                <div className="max-w-[220px] truncate text-xs text-slate-500">
                  {currentUser.name}
                </div>
              </div>
              <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition lg:block ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isAccountMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-80 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_50px_rgba(15,23,42,0.16)]">
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-14 w-14 rounded-2xl object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</div>
                    <div className="truncate text-xs text-slate-500">{currentUser.email}</div>
                    <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {currentUser.roleTitle}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Divisi</div>
                    <div className="mt-1 font-semibold text-slate-800">{currentUser.division}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      if (onOpenProfileSettings) {
                        onOpenProfileSettings();
                      } else {
                        setIsProfileModalOpen(true);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:border-emerald-300 hover:text-emerald-700 cursor-pointer"
                  >
                    <UserCog className="h-4 w-4 text-emerald-600" />
                    <span>Pengaturan Profil & Sandi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      void logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-300" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};

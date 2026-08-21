import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  ClipboardList,
  ChevronDown,
  Columns,
  Database,
  HelpCircle,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Radio,
  ScrollText,
  Search,
  Shield,
  UserCog,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';
import { useAuth } from '../context/AuthContext';
import { AppModule } from '../types';
import {
  getNavigationSectionsForRole,
  getRoleWorkspace,
} from '../config/roleWorkspace';

interface HeaderNavbarProps {
  onOpenArchSpecs: () => void;
  onOpenWorkflowGuide: () => void;
  onToggleSidebar: () => void;
}

const moduleIcons: Record<AppModule, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  service_registrations: ClipboardList,
  helpdesk: HelpCircle,
  noc: Radio,
  lead_tech: Shield,
  field_tech: Shield,
  finance: Activity,
  inventory: Package,
  kanban: Columns,
  network_map: Wifi,
  admin_users: Users,
  admin_roles: UserCog,
  admin_master: Database,
  admin_mappings: Wifi,
  admin_audit: ScrollText,
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
  onToggleSidebar,
}) => {
  const {
    currentUser,
    activeRole,
    selectedModule,
    setSelectedModule,
  } = useIOMS();
  const { logout } = useAuth();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const navigationSections = getNavigationSectionsForRole(activeRole);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState('');
  const navigationRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (navigationRef.current && !navigationRef.current.contains(target)) {
        setIsNavigationOpen(false);
      }

      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleSelectModule = (moduleId: AppModule) => {
    setSelectedModule(moduleId);
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
            onClick={() => handleSelectModule(roleWorkspace.defaultModule)}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              selectedModule === roleWorkspace.defaultModule
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>{roleWorkspace.homeLabel}</span>
          </button>

          <div className="relative" ref={navigationRef}>
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
              <div className="absolute left-1/2 top-[calc(100%+16px)] z-50 w-[min(1080px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_70px_rgba(15,23,42,0.18)]">
                <div className="border-b border-slate-100 px-6 py-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={navigationSearchRef}
                      type="text"
                      value={navigationQuery}
                      onChange={(event) => setNavigationQuery(event.target.value)}
                      placeholder="Search navigation..."
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    />
                    {navigationQuery && (
                      <button
                        type="button"
                        onClick={() => setNavigationQuery('')}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                        aria-label="Kosongkan pencarian"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid max-h-[70vh] grid-cols-1 gap-x-0 overflow-y-auto p-6 md:grid-cols-2 xl:grid-cols-5">
                  {filteredSections.length > 0 ? (
                    filteredSections.map((section) => (
                      <div
                        key={section.id}
                        className="min-w-0 border-b border-slate-100 px-0 py-4 md:px-4 xl:border-b-0 xl:border-r xl:border-slate-100 xl:py-0"
                      >
                        <div className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-700">
                          {section.label}
                        </div>
                        <div className="space-y-1">
                          {section.modules.map((moduleMeta) => {
                            const Icon = moduleIcons[moduleMeta.id];
                            const isActive = selectedModule === moduleMeta.id;

                            return (
                              <button
                                key={moduleMeta.id}
                                type="button"
                                onClick={() => handleSelectModule(moduleMeta.id)}
                                className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  <Icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold">{moduleMeta.label}</span>
                                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                                    {moduleMeta.description}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
                      <div>
                        <div className="text-base font-semibold text-slate-800">Menu tidak ditemukan</div>
                        <div className="mt-2 text-sm text-slate-500">
                          Coba kata kunci lain untuk mencari workspace atau fitur yang diizinkan untuk role ini.
                        </div>
                      </div>
                    </div>
                  )}
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
          <button
            type="button"
            onClick={onOpenWorkflowGuide}
            className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 xl:inline-flex"
          >
            Panduan
          </button>

          <button
            type="button"
            onClick={onOpenArchSpecs}
            className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 xl:inline-flex"
          >
            Backend
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-amber-500 shadow-sm transition hover:border-amber-200 hover:bg-amber-50"
            aria-label="Theme"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
            </svg>
          </button>

          <div className="hidden h-11 items-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm sm:flex">
            ID
          </div>

          <button
            type="button"
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

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
                      void logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
    </header>
  );
};

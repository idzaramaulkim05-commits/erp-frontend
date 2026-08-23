import React from 'react';
import {
  Calendar,
  ChevronDown,
  Columns,
  Grid as GridIcon,
  List,
  MapPin,
  Plus,
  Search,
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';
import { MODULE_META, getAllowedModulesForRole, getResolvedAllowedModules, getRoleWorkspace } from '../config/roleWorkspace';

interface SearchAndFilterBarProps {
  onOpenNewTicket: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewTask: () => void;
  onOpenNewProcurement: () => void;
}

const formatToggleBaseClass =
  'inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-slate-600 transition-colors';

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  onOpenNewTicket,
  onOpenNewCustomer,
  onOpenNewTask,
  onOpenNewProcurement,
}) => {
  const {
    activeRole,
    viewFormat,
    setViewFormat,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    selectedModule,
    selectedRegion,
    setSelectedRegion,
    selectedOdpFilter,
    setSelectedOdpFilter,
    networkOdps,
    navigationConfig,
  } = useIOMS();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const allowedModules = navigationConfig && getResolvedAllowedModules(activeRole, navigationConfig).length > 0
    ? getResolvedAllowedModules(activeRole, navigationConfig)
        .map((moduleKey) => {
          const backendModule = navigationConfig.modules.find((module) => module.key === moduleKey);
          const fallbackModule = MODULE_META[moduleKey];

          return {
            ...fallbackModule,
            label: backendModule?.label ?? fallbackModule.label,
            description: backendModule?.description ?? fallbackModule.description,
            quickAction: backendModule?.quickAction ?? fallbackModule.quickAction,
            viewFormats: backendModule?.viewFormats ?? fallbackModule.viewFormats,
          };
        })
    : getAllowedModulesForRole(activeRole);
  const activeModule = allowedModules.find((item) => item.id === selectedModule) ?? allowedModules[0];
  const availableViewFormats = activeModule?.viewFormats ?? ['table'];
  const searchPlaceholder = activeModule?.searchPlaceholder ?? roleWorkspace.subtitle;

  const regionOptions = Array.from(new Set(networkOdps.map((item) => item.region))).sort();
  const odpOptions = networkOdps
    .filter((item) => selectedRegion === 'all' || item.region === selectedRegion)
    .map((item) => item.id);

  const showViewControls = availableViewFormats.length > 1;
  const showRegionFilter = activeModule?.id === 'helpdesk' || activeModule?.id === 'network_map';
  const showOdpFilter = activeModule?.id === 'helpdesk';
  const showDateRange = roleWorkspace.shellMode === 'compact';

  const quickActionLabel =
    activeModule?.quickAction === 'new_ticket'
      ? 'Buat Tiket'
      : activeModule?.quickAction === 'new_customer'
      ? 'Registrasi Baru'
      : activeModule?.quickAction === 'new_task'
      ? 'Buat Task'
      : activeModule?.quickAction === 'new_procurement'
      ? 'Permintaan Barang'
      : null;

  const handleQuickAction = () => {
    switch (activeModule?.quickAction) {
      case 'new_ticket':
        onOpenNewTicket();
        break;
      case 'new_task':
        onOpenNewTask();
        break;
      case 'new_procurement':
        onOpenNewProcurement();
        break;
      case 'new_customer':
        onOpenNewCustomer();
        break;
      default:
        break;
    }
  };

  const hasQuickAction = activeModule?.quickAction !== null;

  return (
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">Workspace Toolbar</p>
            <h3 className="mt-1 text-lg font-black text-slate-950">{activeModule?.label}</h3>
            <p className="mt-1 text-sm text-slate-500">{activeModule?.description ?? roleWorkspace.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showViewControls && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {availableViewFormats.length} format tampilan
              </span>
            )}
            {hasQuickAction && quickActionLabel && (
              <button
                type="button"
                onClick={handleQuickAction}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                title={`Tambah data untuk ${activeModule?.label}`}
              >
                <Plus className="h-4 w-4 text-emerald-300" />
                {quickActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 2xl:grid-cols-[auto_auto_1fr]">
        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">View Controls</p>
          <div className="flex flex-wrap items-center gap-2">
            {availableViewFormats.includes('table') && (
              <button
                type="button"
                onClick={() => setViewFormat('table')}
                title="Tampilan tabel"
                className={`${formatToggleBaseClass} ${
                  viewFormat === 'table'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            )}
            {availableViewFormats.includes('grid') && (
              <button
                type="button"
                onClick={() => setViewFormat('grid')}
                title="Tampilan grid"
                className={`${formatToggleBaseClass} ${
                  viewFormat === 'grid'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <GridIcon className="h-4 w-4" />
              </button>
            )}
            {availableViewFormats.includes('kanban') && (
              <button
                type="button"
                onClick={() => setViewFormat('kanban')}
                title="Tampilan kanban"
                className={`${formatToggleBaseClass} ${
                  viewFormat === 'kanban'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <Columns className="h-4 w-4" />
              </button>
            )}
            {availableViewFormats.includes('map') && (
              <button
                type="button"
                onClick={() => setViewFormat('map')}
                title="Tampilan peta"
                className={`${formatToggleBaseClass} ${
                  viewFormat === 'map'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-100'
                }`}
              >
                <MapPin className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Filters & Dates</p>

          {showDateRange && (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(event) => setDateRange({ ...dateRange, start: event.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-hidden"
                />
              </label>

              <div className="flex items-center justify-center rounded-2xl bg-white px-3 text-xs font-bold text-slate-400">
                {'->'}
              </div>

              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(event) => setDateRange({ ...dateRange, end: event.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-slate-800 focus:outline-hidden"
                />
              </label>
            </div>
          )}

          {(showRegionFilter || showOdpFilter) && (
            <div className={`grid gap-2 ${showRegionFilter && showOdpFilter ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              {showRegionFilter && (
                <div className="relative">
                  <select
                    value={selectedRegion}
                    onChange={(event) => {
                      setSelectedRegion(event.target.value);
                      setSelectedOdpFilter('all');
                    }}
                    className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="all">Wilayah: Semua Cluster</option>
                    {regionOptions.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              )}

              {showOdpFilter && (
                <div className="relative">
                  <select
                    value={selectedOdpFilter}
                    onChange={(event) => setSelectedOdpFilter(event.target.value)}
                    className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="all">ODP: Semua ODP</option>
                    {odpOptions.map((odpId) => (
                      <option key={odpId} value={odpId}>
                        {odpId}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Search Workspace</p>
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('main-search-input')?.focus()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <Search className="h-4 w-4" />
              Cari Data
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

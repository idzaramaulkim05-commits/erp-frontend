import React from 'react';
import {
  Calendar,
  Columns,
  Grid as GridIcon,
  List,
  MapPin,
  Plus,
  Search,
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';
import { getAllowedModulesForRole, getRoleWorkspace } from '../config/roleWorkspace';

interface SearchAndFilterBarProps {
  onOpenNewTicket: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewTask: () => void;
  onOpenNewProcurement: () => void;
}

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
  } = useIOMS();

  const roleWorkspace = getRoleWorkspace(activeRole);
  const allowedModules = getAllowedModulesForRole(activeRole);
  const activeModule = allowedModules.find((item) => item.id === selectedModule) ?? allowedModules[0];
  const availableViewFormats = activeModule?.viewFormats ?? ['table'];
  const searchPlaceholder = activeModule?.searchPlaceholder ?? roleWorkspace.subtitle;

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
    <div className="bg-white rounded-3xl p-3 sm:p-4 mb-5 border border-slate-200 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center space-x-1.5">
          {availableViewFormats.includes('table') && (
            <button
              onClick={() => setViewFormat('table')}
              title="Tampilan Tabel / List"
              className={`p-2.5 rounded-xl border transition-colors ${
                viewFormat === 'table'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          )}
          {availableViewFormats.includes('grid') && (
            <button
              onClick={() => setViewFormat('grid')}
              title="Tampilan Grid"
              className={`p-2.5 rounded-xl border transition-colors ${
                viewFormat === 'grid'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
          )}
          {availableViewFormats.includes('kanban') && (
            <button
              onClick={() => setViewFormat('kanban')}
              title="Tampilan Kanban"
              className={`p-2.5 rounded-xl border transition-colors ${
                viewFormat === 'kanban'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
          )}
          {availableViewFormats.includes('map') && (
            <button
              onClick={() => setViewFormat('map')}
              title="Tampilan Peta"
              className={`p-2.5 rounded-xl border transition-colors ${
                viewFormat === 'map'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 shadow-2xs hover:border-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800 cursor-pointer"
            />
          </div>

          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
            →
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 shadow-2xs hover:border-slate-300">
            <Calendar className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative flex-1 flex items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="main-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-r-0 border-slate-200 focus:border-emerald-500 rounded-l-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden transition-all"
            />
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('main-search-input');
              if (el) el.focus();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-2.5 rounded-r-2xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Cari Data</span>
          </button>
        </div>

        {hasQuickAction && (
          <button
            onClick={handleQuickAction}
            className="ml-2 bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-2xl shadow-xs transition-colors shrink-0 hidden sm:flex items-center justify-center"
            title={`Tambah data untuk ${activeModule?.label}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

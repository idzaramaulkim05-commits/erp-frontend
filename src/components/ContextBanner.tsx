import React from 'react';
import {
  Activity,
  Radio,
  HelpCircle,
  Shield,
  Layers,
  Grid,
  Wifi,
  ChevronDown,
  Server,
  Zap
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';

export const ContextBanner: React.FC = () => {
  const {
    selectedModule,
    selectedRegion,
    setSelectedRegion,
    selectedOdpFilter,
    setSelectedOdpFilter,
    networkOdps,
  } = useIOMS();

  const [isTelemetryActive, setIsTelemetryActive] = React.useState(true);
  const [networkStatusFilter, setNetworkStatusFilter] = React.useState('all');

  const getModuleTitle = () => {
    switch (selectedModule) {
      case 'helpdesk':
        return 'Helpdesk & Layanan Aduan Pelanggan';
      case 'noc':
        return 'Network Operations Center (NOC) & GPON OLT';
      case 'lead_tech':
        return 'Manajemen Work Order & Standar SOP Teknisi';
      case 'finance':
        return 'Billing, Keuangan & Otomatisasi Isolir';
      case 'inventory':
        return 'Gudang, Inventaris Aset & Pengadaan';
      case 'kanban':
        return 'Papan Tugas & Koordinasi Lintas Divisi';
      case 'network_map':
        return 'Peta Topologi Infrastruktur ODC / ODP';
      default:
        return 'Dashboard Operasional Jaringan ISP';
    }
  };

  return (
    <div className="bg-[#155e42] text-white rounded-3xl p-4 sm:p-6 mb-4 shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Left Graphic Illustration: ISP Fiber Optic, OLT & Router Graphics */}
      <div className="flex items-center space-x-4 shrink-0">
        <div className="relative w-28 h-20 sm:w-36 sm:h-24 bg-white/10 rounded-2xl p-2 flex items-center justify-center border border-white/20 shadow-inner">
          <div className="relative flex items-end justify-center space-x-1.5 w-full h-full">
            {/* OLT / Switch Rack Device */}
            <div className="w-10 h-14 bg-slate-900 rounded-lg border border-slate-700 p-1 flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between px-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1 bg-slate-700 rounded-full flex space-x-0.5 px-0.5">
                  <div className="w-1 h-full bg-emerald-500 rounded-full"></div>
                  <div className="w-1 h-full bg-emerald-500 rounded-full"></div>
                  <div className="w-1 h-full bg-blue-500 rounded-full"></div>
                </div>
                <div className="w-full h-1 bg-slate-700 rounded-full"></div>
                <div className="w-full h-1 bg-slate-700 rounded-full"></div>
              </div>
              <div className="text-[7px] text-emerald-400 font-mono text-center font-bold">
                GPON
              </div>
            </div>

            {/* OPM Laser Meter / Diagnostic Tablet */}
            <div className="w-12 h-16 bg-slate-800 rounded-lg border-2 border-emerald-400/60 p-1 flex flex-col justify-between shadow-md">
              <div className="bg-emerald-950/80 rounded px-1 py-0.5 flex items-center justify-between border border-emerald-500/30">
                <span className="text-[7px] font-mono text-emerald-400 font-bold">-19dBm</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              </div>
              <div className="space-y-0.5 px-0.5">
                <div className="w-full h-1 bg-emerald-600/40 rounded"></div>
                <div className="w-2/3 h-1 bg-emerald-600/30 rounded"></div>
              </div>
              <div className="text-[7px] text-white font-mono text-center font-semibold bg-emerald-700 rounded py-0.5">
                LASER OK
              </div>
            </div>

            {/* Fiber Optic Drop Cable Sleeve Indicators */}
            <div className="flex flex-col space-y-1">
              <div className="w-2.5 h-6 bg-blue-400 rounded-xs shadow-xs" title="Core 1: Biru"></div>
              <div className="w-2.5 h-4 bg-orange-400 rounded-xs shadow-xs" title="Core 2: Oranye"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle & Right Controls: Title with Router/Radio icon, Dropdown Wilayah, Dropdown Status, Telemetry Toggle */}
      <div className="flex-1 flex flex-wrap items-center justify-end gap-3 sm:gap-4 w-full md:w-auto">
        {/* Module Title with Network Icon */}
        <div className="flex items-center space-x-2 mr-auto md:mr-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Radio className="w-4 h-4 text-emerald-300" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {getModuleTitle()}
          </h2>
        </div>

        {/* Dropdown 1: Pilih Wilayah / Cluster ODC */}
        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="appearance-none bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-xl pl-4 pr-9 py-2.5 shadow-sm border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">Wilayah: Semua Cluster</option>
            <option value="Sidoarjo Kota">Sidoarjo Kota</option>
            <option value="Waru">Waru</option>
            <option value="Gedangan">Gedangan</option>
            <option value="Krian">Krian</option>
            <option value="Banjar">Banjar</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Dropdown 2: Filter Status Jaringan / Tiket */}
        <div className="relative">
          <select
            value={networkStatusFilter}
            onChange={(e) => setNetworkStatusFilter(e.target.value)}
            className="appearance-none bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-xl pl-4 pr-9 py-2.5 shadow-sm border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer"
          >
            <option value="all">Status: Semua Kondisi</option>
            <option value="normal">Normal (Laser & PPPoE OK)</option>
            <option value="warning">Redaman Tinggi (&gt; -27 dBm)</option>
            <option value="los">Alarm LOS Fiber Merah</option>
            <option value="unpaid">Terisolir (Billing Unpaid)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Toggle Switch: Live Telemetry SNMP OLT */}
        <div className="flex items-center space-x-2.5 bg-black/15 px-3 py-1.5 rounded-2xl border border-white/15">
          <button
            onClick={() => setIsTelemetryActive(!isTelemetryActive)}
            className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
              isTelemetryActive ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          >
            <div
              className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform ${
                isTelemetryActive ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-white whitespace-nowrap flex items-center gap-1.5">
            SNMP Telemetry
            <span className={`w-1.5 h-1.5 rounded-full ${isTelemetryActive ? 'bg-emerald-300 animate-pulse' : 'bg-slate-400'}`}></span>
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Wifi,
  MapPin,
  Server,
  Layers,
  Radio,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { NetworkODP } from '../../types';

export const NetworkMappingView: React.FC = () => {
  const { networkOdps, customers, selectedRegion } = useIOMS();
  const [activeOdpId, setActiveOdpId] = useState<string>(networkOdps[0]?.id || 'ODP-SDA-01/01');

  const selectedOdp = networkOdps.find((o) => o.id === activeOdpId) || networkOdps[0];

  const fiberColors = [
    { num: 1, name: 'Biru', hex: '#2563eb' },
    { num: 2, name: 'Oranye', hex: '#ea580c' },
    { num: 3, name: 'Hijau', hex: '#16a34a' },
    { num: 4, name: 'Cokelat', hex: '#78350f' },
    { num: 5, name: 'Abu-abu', hex: '#64748b' },
    { num: 6, name: 'Putih', hex: '#e2e8f0' },
    { num: 7, name: 'Merah', hex: '#dc2626' },
    { num: 8, name: 'Hitam', hex: '#0f172a' },
    { num: 9, name: 'Kuning', hex: '#ca8a04' },
    { num: 10, name: 'Ungu / Violet', hex: '#9333ea' },
    { num: 11, name: 'Pink / Rose', hex: '#db2777' },
    { num: 12, name: 'Tosca / Aqua', hex: '#0d9488' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Architecture Summary Banner */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-600" />
            <span>Pemetaan Infrastruktur ODC, ODP & Port Pelanggan</span>
          </h3>
          <p className="text-xs text-slate-500">
            Standarisasi 12 Core Fiber Optic & Binding ID Pelanggan per Port untuk mencegah 'Modem Pindah Gelap'.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
          <Server className="w-4 h-4 text-emerald-600" />
          <span>Core GPON Class C++ Protected</span>
        </div>
      </div>

      {/* Main Grid: Left ODP Selector & Right Port Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: ODP List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Daftar ODP Terdaftar ({networkOdps.length})
          </span>

          <div className="space-y-2">
            {networkOdps.map((odp) => {
              const isSelected = odp.id === activeOdpId;
              const hasFaultyPort = odp.portMappings.some((p) => p.status === 'faulty');

              return (
                <button
                  key={odp.id}
                  onClick={() => setActiveOdpId(odp.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900">{odp.id}</span>
                    {hasFaultyPort ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                        LOS Alarm
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Normal
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{odp.address}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                    <span>ODC: {odp.odcId}</span>
                    <span className="font-semibold text-slate-700">
                      Terpakai: {odp.usedPorts} / {odp.totalPorts} Port
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 12-Core Standard Legend */}
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-700 block mb-2">
              Standar 12 Warna Core Fiber:
            </span>
            <div className="grid grid-cols-4 gap-1.5 text-[9px] font-semibold text-slate-700">
              {fiberColors.map((c) => (
                <div key={c.num} className="flex items-center space-x-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="truncate">{c.num}. {c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Selected ODP Detailed Port Box Inspection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-base font-extrabold text-slate-900">
                    {selectedOdp.id}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                    Splitter {selectedOdp.splitterRatio}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lokasi Tiang: {selectedOdp.address} • {selectedOdp.region}
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-slate-400 block text-[10px]">Jalur Uplink OLT:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {selectedOdp.oltHost} • {selectedOdp.ponSlot}
                </span>
              </div>
            </div>

            {/* Visual Port Box Representation */}
            <div>
              <span className="text-xs font-bold text-slate-800 mb-3 block">
                Visualisasi Port Splitter Box ({selectedOdp.usedPorts} Port Aktif / {selectedOdp.totalPorts} Total Port)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {selectedOdp.portMappings.map((port) => {
                  const isActive = port.status === 'active';
                  const isFaulty = port.status === 'faulty';
                  const isEmpty = port.status === 'empty';

                  return (
                    <div
                      key={port.portNumber}
                      className={`p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : isFaulty
                          ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30'
                          : 'bg-slate-50 border-slate-200 border-dashed text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono font-bold text-xs">Port {port.portNumber}</span>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                        {isFaulty && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                        {isEmpty && (
                          <span className="text-[10px] text-slate-400">Kosong</span>
                        )}
                      </div>

                      {isEmpty ? (
                        <div className="py-2 text-center text-[10px] text-slate-400">
                          Siap Pasang Baru
                        </div>
                      ) : (
                        <div className="space-y-0.5 text-[11px]">
                          <p className="font-bold text-slate-900 truncate">
                            {port.customerName}
                          </p>
                          <p className="font-mono text-[10px] text-slate-500 truncate">
                            {port.customerId}
                          </p>
                          <div className="pt-1 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Redaman:</span>
                            <span
                              className={`font-mono font-bold ${
                                isFaulty ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {port.opticalPowerDbm} dBm
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

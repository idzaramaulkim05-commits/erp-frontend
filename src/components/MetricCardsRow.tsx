import React from 'react';
import {
  HelpCircle,
  Radio,
  Wrench,
  DollarSign,
  Package,
  Users,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';
import { useIOMS } from '../context/IOMSContext';

export const MetricCardsRow: React.FC = () => {
  const {
    activeRole,
    selectedModule,
    setSelectedModule,
    customers,
    tickets,
    workOrders,
    inventory,
  } = useIOMS();

  // Calculated metrics
  const activeCustCount = customers.filter((c) => c.status === 'active').length;
  const unpaidCustCount = customers.filter((c) => c.status === 'unpaid').length;
  const uninstalPendingCount = customers.filter((c) => c.status === 'uninstal_pending').length;

  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_noc_review').length;
  const closedTickets = tickets.filter((t) => t.status === 'closed').length;

  const activeWoCount = workOrders.filter((w) => w.status === 'assigned' || w.status === 'in_progress').length;
  const completedWoCount = workOrders.filter((w) => w.status === 'completed').length;

  const totalModemStock = inventory
    .filter((i) => i.category === 'ONT')
    .reduce((acc, curr) => acc + curr.stockAvailable, 0);
  const totalPatchCord = inventory
    .filter((i) => i.category === 'Patch Cord')
    .reduce((acc, curr) => acc + curr.stockAvailable, 0);

  const paidCustCount = customers.filter((c) => c.billingStatus === 'paid').length;

  const cards = [
    {
      id: 'helpdesk',
      headerTitle: 'Helpdesk Aduan',
      metric1: { value: openTickets, label: 'Tiket Gangguan Open' },
      metric2: { value: closedTickets, label: 'Tiket Selesai Ditutup' },
      moduleTarget: 'helpdesk',
      isActive: selectedModule === 'helpdesk' || (selectedModule === 'dashboard' && activeRole === 'helpdesk'),
      icon1Color: 'bg-sky-100 text-sky-600',
      icon2Color: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'noc',
      headerTitle: 'NOC & Core GPON',
      metric1: { value: activeCustCount, label: 'Sesi PPPoE Online' },
      metric2: { value: 16, label: 'Port PON OLT Normal' },
      moduleTarget: 'noc',
      isActive: selectedModule === 'noc' || (selectedModule === 'dashboard' && activeRole === 'noc'),
      icon1Color: 'bg-sky-100 text-sky-600',
      icon2Color: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'lead_tech',
      headerTitle: 'Work Order Lapangan',
      metric1: { value: activeWoCount, label: 'WO On-Site Berjalan' },
      metric2: { value: completedWoCount || 14, label: 'WO Lolos Verifikasi SOP' },
      moduleTarget: 'lead_tech',
      isActive: selectedModule === 'lead_tech' || (selectedModule === 'dashboard' && (activeRole === 'lead_tech' || activeRole === 'field_tech')),
      icon1Color: 'bg-sky-100 text-sky-600',
      icon2Color: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'finance',
      headerTitle: 'Billing & Keuangan',
      metric1: { value: paidCustCount, label: 'Tagihan Lunas Terbayar' },
      metric2: { value: uninstalPendingCount || 4, label: 'Antrean WO Cabut Alat' },
      moduleTarget: 'finance',
      isActive: selectedModule === 'finance' || (selectedModule === 'dashboard' && activeRole === 'finance'),
      icon1Color: 'bg-sky-100 text-sky-600',
      icon2Color: 'bg-emerald-100 text-emerald-600',
    },
    {
      id: 'inventory',
      headerTitle: 'Gudang & Inventaris',
      metric1: { value: totalModemStock, label: 'Modem ONT Ready Stok' },
      metric2: { value: totalPatchCord, label: 'Patch Cord & Kabel Drop' },
      moduleTarget: 'inventory',
      isActive: selectedModule === 'inventory' || (selectedModule === 'dashboard' && activeRole === 'inventory'),
      icon1Color: 'bg-sky-100 text-sky-600',
      icon2Color: 'bg-emerald-100 text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-4">
      {cards.map((card) => {
        return (
          <button
            key={card.id}
            onClick={() => setSelectedModule(card.moduleTarget)}
            className={`text-left bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 group relative shadow-2xs hover:shadow-md cursor-pointer ${
              card.isActive
                ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/10'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Clean Section Title */}
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-3 tracking-tight">
              {card.headerTitle}
            </h3>

            <div className="space-y-2.5">
              {/* Row 1: Big Number + Pill with description + circular sky icon */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 font-sans w-7 shrink-0">
                  {card.metric1.value}
                </span>
                <div className="flex-1 bg-slate-100/90 rounded-full px-3 py-1 flex items-center justify-between min-w-0">
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    {card.metric1.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full ${card.icon1Color} flex items-center justify-center shrink-0 ml-1.5`}>
                    <Activity className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Row 2: Big Number + Pill with description + circular emerald check icon */}
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 font-sans w-7 shrink-0">
                  {card.metric2.value}
                </span>
                <div className="flex-1 bg-slate-100/90 rounded-full px-3 py-1 flex items-center justify-between min-w-0">
                  <span className="text-[11px] font-semibold text-slate-700 truncate">
                    {card.metric2.label}
                  </span>
                  <div className={`w-5 h-5 rounded-full ${card.icon2Color} flex items-center justify-center shrink-0 ml-1.5`}>
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

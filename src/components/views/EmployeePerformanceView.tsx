import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Award,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
  Calendar,
  X,
  Layers,
  BarChart3,
  Filter,
  Wrench,
  Wifi,
  Radio,
  FileCheck,
  PackageCheck,
  DollarSign,
  Headphones,
  ShoppingBag,
  LoaderCircle,
  Briefcase,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  EmployeePerformanceApiResponse,
  EmployeePerformanceItem,
  EmployeePerformanceSummary,
} from '../../types';

export const EmployeePerformanceView: React.FC = () => {
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EmployeePerformanceApiResponse | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformanceItem | null>(null);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await authFetch<EmployeePerformanceApiResponse>('/employee-performance');
      setData(res);
    } catch (err) {
      console.error('Failed to fetch employee performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPerformanceData();
  }, []);

  const divisionsList = [
    { id: 'all', label: 'Semua Divisi' },
    { id: 'Teknisi Lapangan', label: 'Teknisi Lapangan' },
    { id: 'Network Operation Center', label: 'NOC' },
    { id: 'Kepala Teknisi & Perencanaan', label: 'Lead Tech' },
    { id: 'Customer Service & Helpdesk', label: 'Helpdesk' },
    { id: 'Sales & Pemasaran', label: 'Sales' },
    { id: 'Gudang & Logistik', label: 'Gudang' },
    { id: 'Keuangan & Akuntansi', label: 'Finance' },
  ];

  const filteredEmployees = useMemo(() => {
    if (!data?.employees) return [];
    return data.employees.filter((emp) => {
      const matchDivision =
        selectedDivision === 'all' ||
        emp.division.toLowerCase() === selectedDivision.toLowerCase() ||
        emp.role.toLowerCase() === selectedDivision.toLowerCase();

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.roleTitle.toLowerCase().includes(q) ||
        emp.division.toLowerCase().includes(q);

      return matchDivision && matchSearch;
    });
  }, [data, selectedDivision, searchQuery]);

  const summary: EmployeePerformanceSummary = data?.summary || {
    totalEmployees: 0,
    averageKpiScore: 0,
    totalCompletedTasksThisMonth: 0,
    slaPerformanceRate: '0%',
    topPerformers: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 border border-emerald-200">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  Executive Analytics
                </span>
                <span className="text-xs text-slate-500">Kinerja & Produktivitas Tim ISP</span>
              </div>
              <h1 className="text-xl font-black text-slate-950 mt-1">Lihat Performa Karyawan</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchPerformanceData()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-600" />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Karyawan Aktif</span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{summary.totalEmployees}</span>
            <span className="text-xs font-semibold text-slate-500">Orang</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Semua divisi operasional aktif</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Rata-rata Skor KPI Tim</span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{summary.averageKpiScore}</span>
            <span className="text-xs font-semibold text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Kategori Sangat Baik (High Performing)</span>
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tugas & WO Selesai</span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{summary.totalCompletedTasksThisMonth}</span>
            <span className="text-xs font-semibold text-slate-500">Pekerjaan</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Termasuk instalasi baru, maintenance, & QC
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tingkat Kepatuhan SLA</span>
            <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{summary.slaPerformanceRate}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Penyelesaian tepat waktu sesuai standar SOP
          </div>
        </div>
      </div>

      {/* Leaderboard Top Performers Podium */}
      {summary.topPerformers && summary.topPerformers.length > 0 && (
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xl">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-sm font-black uppercase tracking-wider">Top Performer Karyawan Bulan Ini</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Penghargaan produktivitas dan kualitas pengerjaan tertinggi antar divisi
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {summary.topPerformers.map((top, idx) => (
              <div
                key={top.id}
                onClick={() => setSelectedEmployee(top)}
                className="relative flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 transition hover:border-amber-400/50 hover:bg-slate-800/80 cursor-pointer"
              >
                <div className="relative shrink-0">
                  <img
                    src={top.avatar}
                    alt={top.name}
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-amber-400/60"
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950">
                    #{idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-white text-xs">{top.name}</h3>
                  <p className="truncate text-[11px] text-slate-400">{top.division}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-bold">Skor KPI: {top.kpiScore}</span>
                    <span className="text-slate-400">{top.totalCompletedTasks} Tugas</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama karyawan, divisi, atau email..."
              className="w-full rounded-xl border border-slate-200 pl-10 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500">
            Menampilkan <strong>{filteredEmployees.length}</strong> karyawan
          </div>
        </div>

        {/* Division Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
          {divisionsList.map((div) => (
            <button
              key={div.id}
              type="button"
              onClick={() => setSelectedDivision(div.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                selectedDivision === div.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {div.label}
            </button>
          ))}
        </div>
      </div>

      {/* Employee Performance Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
            <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Memuat data performa karyawan...</span>
          </div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Tidak ada karyawan yang sesuai dengan filter pencarian.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                {/* Employee Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-slate-100"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                          emp.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                      <p className="text-[11px] text-slate-500">{emp.roleTitle}</p>
                      <span className="inline-block mt-0.5 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {emp.division}
                      </span>
                    </div>
                  </div>

                  {/* KPI Score Badge */}
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-700 font-extrabold text-xs">
                      <Award className="h-3.5 w-3.5" />
                      <span>{emp.kpiScore}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Skor KPI</span>
                  </div>
                </div>

                {/* Metrics Badges */}
                <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs">
                  {emp.kpiMetrics.slice(0, 4).map((metric, mIdx) => (
                    <div key={mIdx} className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 font-medium block truncate">
                        {metric.label}
                      </span>
                      <span className="font-black text-slate-900 text-xs">
                        {metric.value} <span className="text-[10px] font-normal text-slate-500">{metric.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action: View Detailed History */}
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(emp)}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Lihat Riwayat & Aktivitas</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: DETAIL REKAM JEJAK & PEKERJAAN KARYAWAN */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <img
                  src={selectedEmployee.avatar}
                  alt={selectedEmployee.name}
                  className="h-10 w-10 rounded-xl object-cover ring-2 ring-emerald-400"
                />
                <div>
                  <h3 className="text-sm font-bold">{selectedEmployee.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedEmployee.roleTitle} &bull; {selectedEmployee.division}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Contact and Status Info */}
              <div className="grid gap-3 sm:grid-cols-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Email</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedEmployee.email}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Telepon</span>
                  <span className="font-bold text-slate-800 block">{selectedEmployee.phone}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold block">Status Kerja</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
                    <CheckCircle2 className="h-3 w-3" /> {selectedEmployee.status}
                  </span>
                </div>
              </div>

              {/* Complete KPI Metrics Breakdown */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" />
                  <span>Rincian Metrik & KPI ({selectedEmployee.roleTitle})</span>
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedEmployee.kpiMetrics.map((kpi, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-2xs"
                    >
                      <span className="text-slate-600">{kpi.label}</span>
                      <span className="font-extrabold text-slate-950">
                        {kpi.value} <span className="text-[10px] font-normal text-slate-400">{kpi.unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Audit Activities / Work Log */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <span>Riwayat Pekerjaan & Aktivitas Terakhir</span>
                </h4>
                {selectedEmployee.recentActivities && selectedEmployee.recentActivities.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedEmployee.recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{act.action}</span>
                          <span className="text-[10px] text-slate-400">{act.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-600">{act.details}</p>
                        {act.target && (
                          <span className="inline-block rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[9px] font-mono text-slate-600">
                            Ref: {act.target}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 text-xs">
                    Belum ada log aktivitas tercatat untuk karyawan ini.
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedEmployee(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

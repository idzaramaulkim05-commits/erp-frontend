import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Network,
  RefreshCw,
  Plus,
  Save,
  Database,
  Activity,
  CircleOff,
  Wifi,
  History,
  Server,
  Search,
  ArrowRight,
  FolderKanban,
  Layers3,
  Boxes,
  ClipboardList,
} from 'lucide-react';
import {
  AdminAuditItem,
  AdminOverview,
  AdminUser,
  MasterDataGroup,
  SystemSession,
  NetworkODP,
  AppModule,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';

interface SuperadminDashboardViewProps {
  selectedModule: string;
}

type AdminMappingPayload = {
  networkSummary: {
    totalOdps: number;
    totalPorts: number;
    usedPorts: number;
    availablePorts: number;
  };
  odps: NetworkODP[];
  roleDivisionMap: Array<Record<string, string | number | boolean | null>>;
};

type OverviewListItem = {
  id: string;
  label: string;
  subtitle: string;
  count: number;
  targetModule: AppModule;
};

type OverviewCardItem = {
  id: string;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  targetModule: AppModule;
};

const emptyOverview: AdminOverview = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  onlineUsers: 0,
  auditCount: 0,
  masterDataGroupCount: 0,
  servicePackageCount: 0,
  regionCount: 0,
  inventoryReferenceCount: 0,
  workflowReferenceCount: 0,
  latestAuditLogs: [],
};

const moduleTitles: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'System Administration Overview',
    description: 'Kontrol utama untuk akun login, referensi master data, mapping aplikasi, dan audit sistem web.',
  },
  admin_users: {
    title: 'Manajemen Akun Login',
    description: 'Kelola akun, role, division, status aktif, reset password, dan visibilitas session user.',
  },
  admin_roles: {
    title: 'Role & Hak Akses',
    description: 'Tinjau pemetaan role dan division yang dipakai aplikasi sebagai dasar kontrol akses.',
  },
  admin_master: {
    title: 'Master Data Referensi',
    description: 'Kelola region, paket layanan, referensi inventaris, dan referensi workflow lintas modul.',
  },
  admin_mappings: {
    title: 'Mapping Infrastruktur',
    description: 'Pantau summary ODP, kapasitas port, dan relasi mapping role/division aplikasi.',
  },
  admin_audit: {
    title: 'Audit & Session',
    description: 'Lihat jejak aktivitas superadmin, auth event, perubahan master data, dan status user online.',
  },
};

const roleOptions = [
  { value: 'superadmin', label: 'Super Administrator', division: 'IT & System Development' },
  { value: 'management', label: 'Direktur Operasional & Bisnis', division: 'Executive Management' },
  { value: 'noc', label: 'Senior Network Engineer', division: 'Network Operation Center' },
  { value: 'helpdesk', label: 'Customer Care & Helpdesk', division: 'Customer Service & Helpdesk' },
  { value: 'lead_tech', label: 'Kepala Teknisi Lapangan', division: 'Field Operations & Dispatch' },
  { value: 'field_tech', label: 'Teknisi Instalasi & FO', division: 'Field Operations' },
  { value: 'finance', label: 'Finance & Billing Specialist', division: 'Finance, Billing & Accounting' },
  { value: 'inventory', label: 'Logistik & Asset Inventory', division: 'Warehouse & Asset Logistics' },
];

export const SuperadminDashboardView: React.FC<SuperadminDashboardViewProps> = ({ selectedModule }) => {
  const { authFetch } = useAuth();
  const { setSelectedModule } = useIOMS();
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [masterGroups, setMasterGroups] = useState<MasterDataGroup[]>([]);
  const [sessions, setSessions] = useState<SystemSession[]>([]);
  const [mappingPayload, setMappingPayload] = useState<AdminMappingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupKey, setSelectedGroupKey] = useState('regions');
  const [draftGroups, setDraftGroups] = useState<Record<string, Array<Record<string, string | number | boolean | null>>>>({});
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'inventory',
    roleTitle: 'Logistik & Asset Inventory',
    division: 'Warehouse & Asset Logistics',
    phone: '',
    password: '',
    passwordConfirmation: '',
    isActive: true,
  });
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', passwordConfirmation: '' });
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewPayload, usersPayload, masterPayload, mappingResponse, sessionsPayload] = await Promise.all([
        authFetch<{ data: AdminOverview }>('/admin/overview'),
        authFetch<{ data: AdminUser[] }>('/admin/users'),
        authFetch<{ data: MasterDataGroup[] }>('/admin/master-data'),
        authFetch<{ data: AdminMappingPayload }>('/admin/mappings'),
        authFetch<{ data: SystemSession[] }>('/admin/sessions'),
      ]);

      setOverview(overviewPayload.data);
      setUsers(usersPayload.data);
      setMasterGroups(masterPayload.data);
      setMappingPayload(mappingResponse.data);
      setSessions(sessionsPayload.data);
      setDraftGroups(
        Object.fromEntries(masterPayload.data.map((group) => [group.key, group.items.map((item) => ({ ...item }))]))
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat dashboard superadmin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  useEffect(() => {
    const firstGroup = masterGroups[0]?.key;
    if (firstGroup && !masterGroups.some((group) => group.key === selectedGroupKey)) {
      setSelectedGroupKey(firstGroup);
    }
  }, [masterGroups, selectedGroupKey]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.email, user.role, user.division].some((value) => value.toLowerCase().includes(query))
    );
  }, [searchQuery, users]);

  const currentGroup = masterGroups.find((group) => group.key === selectedGroupKey) ?? null;
  const currentGroupDraft = currentGroup ? draftGroups[currentGroup.key] ?? [] : [];

  const sessionSummary = useMemo(
    () => ({
      online: sessions.filter((session) => session.isOnline).length,
      inactive: sessions.filter((session) => !session.isActive).length,
    }),
    [sessions]
  );

  const overviewListItems = useMemo<OverviewListItem[]>(() => {
    const mappingCount = mappingPayload?.roleDivisionMap.length ?? 0;

    const masterGroupItems = [...masterGroups]
      .sort((left, right) => right.items.length - left.items.length)
      .slice(0, 4)
      .map((group) => ({
        id: group.key,
        label: group.label,
        subtitle: `${group.key} reference`,
        count: group.items.length,
        targetModule: 'admin_master' as AppModule,
      }));

    return [
      ...masterGroupItems,
      {
        id: 'account-admin',
        label: 'Manajemen Akun',
        subtitle: 'login_user_admin',
        count: users.length,
        targetModule: 'admin_users',
      },
      {
        id: 'role-admin',
        label: 'Role & Hak Akses',
        subtitle: 'role_division_map',
        count: mappingCount,
        targetModule: 'admin_roles',
      },
      {
        id: 'audit-session',
        label: 'Audit & Session',
        subtitle: 'system_activity_log',
        count: Math.max(overview.auditCount, sessions.length),
        targetModule: 'admin_audit',
      },
    ].slice(0, 6);
  }, [mappingPayload, masterGroups, overview.auditCount, sessions.length, users.length]);

  const overviewCardItems = useMemo<OverviewCardItem[]>(() => ([
    {
      id: 'regions-mapping',
      title: 'Region & Cluster',
      count: overview.regionCount,
      icon: FolderKanban,
      targetModule: 'admin_master',
    },
    {
      id: 'package-mapping',
      title: 'Paket Layanan',
      count: overview.servicePackageCount,
      icon: Boxes,
      targetModule: 'admin_master',
    },
    {
      id: 'role-mapping',
      title: 'Role To Division',
      count: mappingPayload?.roleDivisionMap.length ?? 0,
      icon: Layers3,
      targetModule: 'admin_roles',
    },
    {
      id: 'odp-mapping',
      title: 'ODP & Port Binding',
      count: mappingPayload?.networkSummary.totalOdps ?? 0,
      icon: Network,
      targetModule: 'admin_mappings',
    },
    {
      id: 'account-mapping',
      title: 'Loginuser To Modul',
      count: users.length,
      icon: Users,
      targetModule: 'admin_users',
    },
    {
      id: 'audit-review',
      title: 'Audit & Session',
      count: overview.auditCount,
      icon: ClipboardList,
      targetModule: 'admin_audit',
    },
  ]), [mappingPayload, overview.auditCount, overview.regionCount, overview.servicePackageCount, users.length]);

  const filteredOverviewList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return overviewListItems;
    }

    return overviewListItems.filter((item) => {
      const haystack = `${item.label} ${item.subtitle}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [overviewListItems, searchQuery]);

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      role: 'inventory',
      roleTitle: 'Logistik & Asset Inventory',
      division: 'Warehouse & Asset Logistics',
      phone: '',
      password: '',
      passwordConfirmation: '',
      isActive: true,
    });
  };

  const openCreateUser = () => {
    resetUserForm();
    setIsUserFormOpen(true);
  };

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.roleTitle,
      division: user.division,
      phone: user.phone ?? '',
      password: '',
      passwordConfirmation: '',
      isActive: user.isActive,
    });
    setIsUserFormOpen(true);
  };

  const handleRoleChange = (role: string) => {
    const selected = roleOptions.find((option) => option.value === role);
    setUserForm((state) => ({
      ...state,
      role,
      roleTitle: selected?.label ?? state.roleTitle,
      division: selected?.division ?? state.division,
    }));
  };

  const saveUser = async () => {
    setFeedback(null);
    const payload = {
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      role_title: userForm.roleTitle,
      division: userForm.division,
      phone: userForm.phone,
      is_active: userForm.isActive,
      ...(editingUser
        ? {}
        : {
            password: userForm.password,
            password_confirmation: userForm.passwordConfirmation,
          }),
    };

    try {
      if (editingUser) {
        await authFetch(`/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch('/admin/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsUserFormOpen(false);
      resetUserForm();
      setFeedback(editingUser ? 'Profil akun berhasil diperbarui.' : 'Akun baru berhasil dibuat.');
      await loadAdminData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan akun.');
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    setFeedback(null);
    try {
      await authFetch(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.isActive }),
      });
      setFeedback(`Status akun ${user.name} berhasil diperbarui.`);
      await loadAdminData();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status akun.');
    }
  };

  const resetUserPassword = async () => {
    if (!passwordTarget) return;

    setFeedback(null);
    try {
      await authFetch(`/admin/users/${passwordTarget.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          password: passwordForm.password,
          password_confirmation: passwordForm.passwordConfirmation,
        }),
      });
      setPasswordTarget(null);
      setPasswordForm({ password: '', passwordConfirmation: '' });
      setFeedback(`Password akun ${passwordTarget.name} berhasil direset.`);
      await loadAdminData();
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Gagal mereset password akun.');
    }
  };

  const updateGroupField = (rowIndex: number, field: string, value: string) => {
    if (!currentGroup) return;
    setDraftGroups((state) => ({
      ...state,
      [currentGroup.key]: (state[currentGroup.key] ?? []).map((item, index) =>
        index === rowIndex ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addGroupRow = () => {
    if (!currentGroup) return;
    const newItem = Object.fromEntries(currentGroup.editableFields.map((field) => [field, '']));
    setDraftGroups((state) => ({
      ...state,
      [currentGroup.key]: [...(state[currentGroup.key] ?? []), newItem],
    }));
  };

  const saveCurrentGroup = async () => {
    if (!currentGroup) return;

    setFeedback(null);
    try {
      await authFetch(`/admin/master-data/${currentGroup.key}`, {
        method: 'PUT',
        body: JSON.stringify({
          label: currentGroup.label,
          items: currentGroupDraft,
        }),
      });
      setFeedback(`Master data ${currentGroup.label} berhasil diperbarui.`);
      await loadAdminData();
    } catch (groupError) {
      setError(groupError instanceof Error ? groupError.message : 'Gagal memperbarui master data.');
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.9fr_0.95fr]">
        <div className="overflow-hidden rounded-[34px] border border-emerald-300/60 bg-linear-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-6 text-white shadow-[0_22px_50px_rgba(16,185,129,0.25)] lg:p-8">
          <div className="flex h-full flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
            <div className="flex items-start gap-4 lg:w-[28%]">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/25 ring-8 ring-white/10">
                <ShieldCheck className="h-9 w-9" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-50/90">System Administration</p>
                <h2 className="text-2xl font-black tracking-tight">Master Data</h2>
                <p className="max-w-sm text-sm text-emerald-50/85">
                  Data master aplikasi, akun login, dan struktur referensi operasional dikelola penuh dari workspace ini.
                </p>
              </div>
            </div>

            <div className="hidden w-px bg-white/20 lg:block" />

            <div className="grid flex-1 gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black">Master Data</h3>
                  <p className="mt-1 text-sm text-emerald-50/85">
                    Kelola wilayah, paket layanan, referensi inventaris, dan workflow utama aplikasi.
                  </p>
                </div>
                <div className="rounded-3xl bg-white/12 p-4 backdrop-blur-sm">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-50/70">Total Grup Referensi</p>
                      <p className="mt-2 text-4xl font-black">{overview.masterDataGroupCount}</p>
                    </div>
                    <div className="text-right text-sm text-emerald-50/85">
                      <p>{overview.regionCount} wilayah</p>
                      <p>{overview.servicePackageCount} paket</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedModule('admin_master')}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-bold text-emerald-700 shadow-lg shadow-emerald-900/10 transition hover:bg-emerald-50"
                >
                  Tambah Data Master
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black">Mapping Data</h3>
                  <p className="mt-1 text-sm text-emerald-50/85">
                    Proses pencocokan role, ODP, port binding, dan relasi data antar modul sistem.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setSelectedModule('admin_mappings')}
                    className="rounded-3xl bg-white/12 p-4 text-left backdrop-blur-sm transition hover:bg-white/18"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-50/70">ODP Aktif</p>
                    <p className="mt-2 text-3xl font-black">{mappingPayload?.networkSummary.totalOdps ?? 0}</p>
                    <p className="mt-2 text-sm text-emerald-50/80">Mapping Infrastruktur</p>
                  </button>
                  <button
                    onClick={() => setSelectedModule('admin_roles')}
                    className="rounded-3xl bg-white/12 p-4 text-left backdrop-blur-sm transition hover:bg-white/18"
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-50/70">Role Mapping</p>
                    <p className="mt-2 text-3xl font-black">{mappingPayload?.roleDivisionMap.length ?? 0}</p>
                    <p className="mt-2 text-sm text-emerald-50/80">Role & Hak Akses</p>
                  </button>
                </div>
                <button
                  onClick={() => void loadAdminData()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.08)] lg:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari Master Data..."
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-16 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm"
              aria-label="Cari data admin"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900">Data Master</h3>
            <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white">
              {filteredOverviewList.length} Tabel
            </span>
          </div>

          <div className="mt-4 max-h-[560px] space-y-4 overflow-y-auto pr-1">
            {filteredOverviewList.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedModule(item.targetModule)}
                className="flex w-full items-center gap-4 rounded-[26px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                  <Database className="h-7 w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-slate-900">{item.label}</p>
                  <p className="truncate text-sm text-slate-500">{item.subtitle}</p>
                </div>
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  {item.count}
                </span>
              </button>
            ))}

            {filteredOverviewList.length === 0 && (
              <div className="rounded-[26px] border border-dashed border-slate-200 bg-slate-50 px-5 py-12 text-center">
                <p className="text-sm font-semibold text-slate-700">Data admin tidak ditemukan</p>
                <p className="mt-1 text-xs text-slate-500">Coba kata kunci lain untuk mencari master data atau modul admin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-slate-900">Mapping Data Master</h3>
          <p className="mt-1 text-sm text-slate-500">Launcher cepat ke area administrasi sistem yang paling sering digunakan superadmin.</p>
        </div>
        <span className="rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white">
          {overviewCardItems.length} Tabel
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {overviewCardItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="rounded-[30px] border border-slate-200 bg-white p-6 text-center shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-sky-100 via-white to-emerald-100 ring-1 ring-slate-200">
                <Icon className="h-9 w-9 text-emerald-700" />
              </div>
              <p className="mt-5 text-lg font-bold text-slate-900">{item.title}</p>
              <span className="mt-3 inline-flex rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                {item.count}
              </span>
              <button
                onClick={() => setSelectedModule(item.targetModule)}
                className="mx-auto mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 px-6 text-sm font-bold text-white transition hover:bg-sky-600"
              >
                Lihat Data
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Akun', value: overview.totalUsers, icon: Users, tone: 'text-sky-700 bg-sky-50 border-sky-100' },
          { label: 'Akun Nonaktif', value: overview.inactiveUsers, icon: CircleOff, tone: 'text-rose-700 bg-rose-50 border-rose-100' },
          { label: 'User Online', value: overview.onlineUsers, icon: Wifi, tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
          { label: 'Audit Tercatat', value: overview.auditCount, icon: History, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className={`inline-flex rounded-2xl border px-3 py-3 ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-950">Akun login internal</h3>
            <p className="text-sm text-slate-500">Kelola akun aktif, role, division, dan tindakan admin sensitif.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, email, role, division..."
              className="w-72 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
            <button
              onClick={openCreateUser}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-[1.2fr_1.2fr_0.7fr_1fr_0.8fr_1fr] gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Division</span>
          <span>Status</span>
          <span>Aksi</span>
        </div>
        <div className="divide-y divide-slate-100">
          {filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-[1.2fr_1.2fr_0.7fr_1fr_0.8fr_1fr] gap-3 px-5 py-4 text-sm items-center">
              <div>
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.id}</p>
              </div>
              <div className="text-slate-600">{user.email}</div>
              <div>
                <p className="font-semibold text-slate-800">{user.role}</p>
                <p className="text-xs text-slate-500">{user.roleTitle}</p>
              </div>
              <div className="text-slate-600">{user.division}</div>
              <div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
                <p className="mt-1 text-xs text-slate-500">{user.isOnline ? 'Online' : 'Offline'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEditUser(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  Edit
                </button>
                <button onClick={() => setPasswordTarget(user)} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  Reset Password
                </button>
                <button onClick={() => void toggleUserStatus(user)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${user.isActive ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                  {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRoleMapping = () => {
    const roleGroup = masterGroups.find((group) => group.key === 'role_division_map');
    const rows = draftGroups.role_division_map ?? roleGroup?.items ?? [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div>
            <h3 className="text-lg font-black text-slate-950">Role policy & division mapping</h3>
            <p className="text-sm text-slate-500">Fondasi role system yang dipakai frontend dan backend untuk kontrol akses.</p>
          </div>
          <button onClick={() => setSelectedGroupKey('role_division_map')} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
            Sinkronkan ke Master Data
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {rows.map((row, index) => (
            <div key={`${row.role ?? 'role'}-${index}`} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">{String(row.role ?? '').replace('_', ' ')}</p>
              <input
                value={String(row.roleTitle ?? '')}
                onChange={(event) => updateGroupField(index, 'roleTitle', event.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
              />
              <input
                value={String(row.division ?? '')}
                onChange={(event) => updateGroupField(index, 'division', event.target.value)}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
            </div>
          ))}
        </div>
        <button onClick={() => void saveCurrentGroup()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
          <Save className="w-4 h-4" />
          Simpan Role Mapping
        </button>
      </div>
    );
  };

  const renderMasterData = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[0.35fr_0.65fr] gap-6">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Kelompok master data</h3>
          <div className="mt-4 space-y-2">
            {masterGroups.map((group) => (
              <button
                key={group.key}
                onClick={() => setSelectedGroupKey(group.key)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${selectedGroupKey === group.key ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <p className="font-semibold">{group.label}</p>
                <p className="text-xs text-slate-500 mt-1">{group.items.length} item referensi</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-950">{currentGroup?.label ?? 'Master Data'}</h3>
              <p className="text-sm text-slate-500">Edit data referensi yang menjadi sumber dropdown dan mapping aplikasi.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={addGroupRow} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Tambah Baris</button>
              <button onClick={() => void saveCurrentGroup()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {currentGroupDraft.map((row, rowIndex) => (
              <div key={`${currentGroup?.key ?? 'group'}-${rowIndex}`} className="grid md:grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {currentGroup?.editableFields.map((field) => (
                  <label key={field} className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{field}</span>
                    <input
                      value={String(row[field] ?? '')}
                      onChange={(event) => updateGroupField(rowIndex, field, event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMappings = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { label: 'ODP Terdaftar', value: mappingPayload?.networkSummary.totalOdps ?? 0, icon: Network },
          { label: 'Total Port', value: mappingPayload?.networkSummary.totalPorts ?? 0, icon: Server },
          { label: 'Port Terpakai', value: mappingPayload?.networkSummary.usedPorts ?? 0, icon: Activity },
          { label: 'Port Tersedia', value: mappingPayload?.networkSummary.availablePorts ?? 0, icon: Wifi },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <Icon className="w-5 h-5 text-emerald-700" />
              <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </div>
      <div className="grid xl:grid-cols-[1fr_0.9fr] gap-6">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Ringkasan ODP & port binding</h3>
          <div className="mt-5 space-y-3">
            {mappingPayload?.odps.map((odp) => (
              <div key={odp.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{odp.id}</p>
                    <p className="text-xs text-slate-500">{odp.region} · {odp.oltHost} · {odp.ponSlot}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {odp.usedPorts}/{odp.totalPorts} Port
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Role to division map</h3>
          <div className="mt-5 space-y-3">
            {mappingPayload?.roleDivisionMap.map((item, index) => (
              <div key={`${item.role ?? 'map'}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">{String(item.roleTitle ?? item.role ?? '-')}</p>
                <p className="text-xs text-slate-500 mt-1">{String(item.division ?? '-')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Audit trail terbaru</h3>
          <div className="mt-5 space-y-3">
            {overview.latestAuditLogs.map((item: AdminAuditItem) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.action}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.actorName} · {item.actorRole} · {item.timestamp}</p>
                    <p className="text-xs text-slate-600 mt-2">{item.details}</p>
                  </div>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white">{item.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Session user</h3>
          <div className="mt-4 flex gap-3">
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">Online: {sessionSummary.online}</div>
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">Nonaktif: {sessionSummary.inactive}</div>
          </div>
          <div className="mt-5 space-y-3 max-h-[540px] overflow-y-auto">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{session.name}</p>
                    <p className="text-xs text-slate-500">{session.email}</p>
                    <p className="text-xs text-slate-500 mt-1">{session.division}</p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${session.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {session.isOnline ? 'Online' : 'Offline'}
                    </span>
                    <p className="mt-2 text-[11px] text-slate-500">{session.lastLoginAt ?? 'Belum login'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderByModule = () => {
    switch (selectedModule) {
      case 'admin_users':
        return renderUserManagement();
      case 'admin_roles':
        return renderRoleMapping();
      case 'admin_master':
        return renderMasterData();
      case 'admin_mappings':
        return renderMappings();
      case 'admin_audit':
        return renderAudit();
      default:
        return renderOverview();
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-sm text-slate-500">
        Memuat workspace superadmin...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">System Admin Workspace</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{moduleTitles[selectedModule]?.title ?? moduleTitles.dashboard.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">{moduleTitles[selectedModule]?.description ?? moduleTitles.dashboard.description}</p>
          </div>
          {feedback && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>}
          {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
        </div>
      </div>

      {renderByModule()}

      {isUserFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Admin User Form</p>
                <h3 className="mt-1 text-lg font-black">{editingUser ? 'Edit akun login' : 'Tambah akun login'}</h3>
              </div>
              <button onClick={() => setIsUserFormOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-4">
              <input value={userForm.name} onChange={(event) => setUserForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nama user" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={userForm.email} onChange={(event) => setUserForm((state) => ({ ...state, email: event.target.value }))} placeholder="Email login" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <select value={userForm.role} onChange={(event) => handleRoleChange(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.value}</option>)}
              </select>
              <input value={userForm.roleTitle} onChange={(event) => setUserForm((state) => ({ ...state, roleTitle: event.target.value }))} placeholder="Role title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={userForm.division} onChange={(event) => setUserForm((state) => ({ ...state, division: event.target.value }))} placeholder="Division" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={userForm.phone} onChange={(event) => setUserForm((state) => ({ ...state, phone: event.target.value }))} placeholder="Phone" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              {!editingUser && (
                <>
                  <input type="password" value={userForm.password} onChange={(event) => setUserForm((state) => ({ ...state, password: event.target.value }))} placeholder="Password awal" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                  <input type="password" value={userForm.passwordConfirmation} onChange={(event) => setUserForm((state) => ({ ...state, passwordConfirmation: event.target.value }))} placeholder="Konfirmasi password" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
                </>
              )}
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={userForm.isActive} onChange={(event) => setUserForm((state) => ({ ...state, isActive: event.target.checked }))} />
                Akun aktif
              </label>
            </div>
            <div className="px-6 pb-6 flex justify-end">
              <button onClick={() => void saveUser()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="w-4 h-4" />
                Simpan Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Reset Password</p>
                <h3 className="mt-1 text-lg font-black">{passwordTarget.name}</h3>
              </div>
              <button onClick={() => setPasswordTarget(null)} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="p-6 space-y-4">
              <input type="password" value={passwordForm.password} onChange={(event) => setPasswordForm((state) => ({ ...state, password: event.target.value }))} placeholder="Password baru" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input type="password" value={passwordForm.passwordConfirmation} onChange={(event) => setPasswordForm((state) => ({ ...state, passwordConfirmation: event.target.value }))} placeholder="Konfirmasi password baru" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <button onClick={() => void resetUserPassword()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <KeyRound className="w-4 h-4" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

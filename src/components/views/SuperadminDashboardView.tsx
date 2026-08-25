import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Database,
  KeyRound,
  Layers3,
  Network,
  Plus,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  Users,
  Wifi,
} from 'lucide-react';
import {
  AdminModule,
  AdminOverview,
  AdminUser,
  AppModule,
  MasterDataGroup,
  NavigationHead,
  RoleMeta,
  RoleModuleMapping,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';
import { MODULE_META, ROLE_DASHBOARD_MODULE_OPTIONS } from '../../config/roleWorkspace';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';

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
  odps: Array<{
    id: string;
    region: string;
    oltHost: string;
    ponSlot: string;
    usedPorts: number;
    totalPorts: number;
  }>;
  roleDivisionMap: Array<Record<string, string | number | boolean | null>>;
};

type StatusConfirmationState =
  | { type: 'user'; user: AdminUser }
  | { type: 'role'; role: RoleMeta };

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
    description: 'Kontrol utama untuk akun login, master data, modul navigasi, mapping role, dan audit sistem web.',
  },
  admin_users: {
    title: 'Master Akun Login',
    description: 'Kelola akun login, status aktif, reset password, dan metadata user aplikasi.',
  },
  admin_roles: {
    title: 'Master Data Role',
    description: 'Lihat role system yang ada dan ubah metadata role seperti role title dan division.',
  },
  admin_master: {
    title: 'Master Data Referensi',
    description: 'Kelola referensi wilayah, paket layanan, inventory, dan workflow aplikasi.',
  },
  admin_modules: {
    title: 'Master Data Modul',
    description: 'Kelola kepala navigasi, nama modul, deskripsi modul, urutan, dan link akses internal.',
  },
  admin_module_roles: {
    title: 'Modul To Role',
    description: 'Tentukan modul apa saja yang tampil pada navigasi untuk setiap role system.',
  },
  admin_mappings: {
    title: 'Mapping Infrastruktur',
    description: 'Pantau summary ODP, kapasitas port, dan relasi data infrastruktur aplikasi.',
  },
  admin_audit: {
    title: 'Audit & Session',
    description: 'Lihat jejak aktivitas admin dan status user online dalam sistem.',
  },
};

const defaultUserForm = {
  name: '',
  email: '',
  role: 'inventory',
  phone: '',
  password: '',
  passwordConfirmation: '',
  isActive: true,
};

const defaultRoleForm: RoleMeta = {
  role: '',
  roleTitle: '',
  division: '',
  dashboardModuleKey: 'dashboard',
  description: '',
  isActive: true,
  sortOrder: 0,
};

const defaultModuleForm = {
  key: '',
  label: '',
  description: '',
  navigationHeadKey: '',
  order: 0,
  routeTarget: '',
  quickAction: null as AdminModule['quickAction'],
  viewFormats: [] as Array<'table' | 'grid' | 'kanban' | 'map'>,
  isActive: true,
  showInNavbar: true,
  adminOnlyDashboard: false,
};

const defaultModuleFormErrors = {
  key: '',
  label: '',
  navigationHeadKey: '',
  routeTarget: '',
};

const createBlankHead = (order: number): NavigationHead => ({
  key: '',
  label: '',
  order,
  isActive: true,
});

const HEAD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const normalizeNavigationHeadKey = (value: string) => {
  const ascii = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

  const normalized = ascii.replace(/^[^a-z]+/, '');

  if (normalized === 'oprasional') {
    return 'operasional';
  }

  return normalized;
};

export const SuperadminDashboardView: React.FC<SuperadminDashboardViewProps> = ({ selectedModule }) => {
  const { authFetch } = useAuth();
  const { setSelectedModule } = useIOMS();

  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleMeta[]>([]);
  const [masterGroups, setMasterGroups] = useState<MasterDataGroup[]>([]);
  const [mappingPayload, setMappingPayload] = useState<AdminMappingPayload | null>(null);
  const [navigationHeads, setNavigationHeads] = useState<NavigationHead[]>([]);
  const [adminModules, setAdminModules] = useState<AdminModule[]>([]);
  const [roleModuleMappings, setRoleModuleMappings] = useState<RoleModuleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupKey, setSelectedGroupKey] = useState('regions');
  const [draftGroups, setDraftGroups] = useState<Record<string, Array<Record<string, string | number | boolean | null>>>>({});
  const [roleDrafts, setRoleDrafts] = useState<Record<string, RoleMeta>>({});
  const [moduleDrafts, setModuleDrafts] = useState<Record<string, AdminModule>>({});
  const [headDrafts, setHeadDrafts] = useState<Record<string, NavigationHead>>({});
  const [selectedMappingRole, setSelectedMappingRole] = useState<RoleMeta['role']>('helpdesk');
  const [mappingDrafts, setMappingDrafts] = useState<Record<string, RoleModuleMapping[]>>({});
  const [statusConfirmation, setStatusConfirmation] = useState<StatusConfirmationState | null>(null);
  const [statusConfirmationLoading, setStatusConfirmationLoading] = useState(false);

  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState(defaultUserForm);
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleMeta | null>(null);
  const [roleForm, setRoleForm] = useState<RoleMeta>(defaultRoleForm);
  const [passwordTarget, setPasswordTarget] = useState<AdminUser | null>(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', passwordConfirmation: '' });
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<AdminModule | null>(null);
  const [moduleForm, setModuleForm] = useState(defaultModuleForm);
  const [moduleFormErrors, setModuleFormErrors] = useState(defaultModuleFormErrors);

  const loadAdminData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        overviewPayload,
        usersPayload,
        rolesPayload,
        masterPayload,
        modulesPayload,
        mappingsPayload,
        navigationConfigPayload,
        infraMappingsPayload,
      ] = await Promise.all([
        authFetch<{ data: AdminOverview }>('/admin/overview'),
        authFetch<{ data: AdminUser[] }>('/admin/users'),
        authFetch<{ data: RoleMeta[] }>('/admin/roles'),
        authFetch<{ data: MasterDataGroup[] }>('/admin/master-data'),
        authFetch<{ data: { heads: NavigationHead[]; modules: AdminModule[] } }>('/admin/modules'),
        authFetch<{ data: { roles: RoleMeta[]; heads: NavigationHead[]; modules: AdminModule[]; mappings: RoleModuleMapping[] } }>('/admin/module-role-mappings'),
        authFetch<{ data: { heads: NavigationHead[]; modules: AdminModule[]; roleMappings: RoleModuleMapping[] } }>('/admin/navigation-config'),
        authFetch<{ data: AdminMappingPayload }>('/admin/mappings'),
      ]);

      setOverview(overviewPayload.data);
      setUsers(usersPayload.data);
      setRoles(rolesPayload.data);
      setMasterGroups(masterPayload.data.filter((group) => group.key !== 'role_division_map'));
      setNavigationHeads(modulesPayload.data.heads);
      setAdminModules(modulesPayload.data.modules);
      setRoleModuleMappings(mappingsPayload.data.mappings);
      setMappingPayload(infraMappingsPayload.data);

      setRoleDrafts(
        Object.fromEntries(rolesPayload.data.map((role) => [role.role, { ...role }]))
      );
      setDraftGroups(
        Object.fromEntries(masterPayload.data.map((group) => [group.key, group.items.map((item) => ({ ...item }))]))
      );
      setHeadDrafts(
        Object.fromEntries(modulesPayload.data.heads.map((head) => [head.key, { ...head }]))
      );
      setModuleDrafts(
        Object.fromEntries(modulesPayload.data.modules.map((module) => [module.key, { ...module }]))
      );

      const mappingsByRole = rolesPayload.data.reduce<Record<string, RoleModuleMapping[]>>((accumulator, role) => {
        accumulator[role.role] = mappingsPayload.data.mappings
          .filter((mapping) => mapping.role === role.role)
          .map((mapping) => ({ ...mapping }));
        return accumulator;
      }, {});
      setMappingDrafts(mappingsByRole);
      if (!rolesPayload.data.some((role) => role.role === selectedMappingRole)) {
        const nextRole = rolesPayload.data.find((role) => role.role !== 'superadmin')?.role ?? rolesPayload.data[0]?.role ?? 'helpdesk';
        setSelectedMappingRole(nextRole);
      }

      const nextNavigationHeads = navigationConfigPayload.data.heads;
      if (nextNavigationHeads.length > 0 && !nextNavigationHeads.some((head) => head.key === selectedGroupKey)) {
        setSelectedGroupKey(masterPayload.data[0]?.key ?? 'regions');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat workspace superadmin.');
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
  const headDraftEntries = Object.entries(headDrafts) as Array<[string, NavigationHead]>;
  const currentHeadDrafts = Object.values(headDrafts) as NavigationHead[];
  const normalizedHeadDrafts = currentHeadDrafts
    .map((head) => ({
      key: normalizeNavigationHeadKey(head.key.trim()),
      label: head.label.trim(),
      order: Number.isFinite(head.order) ? head.order : 0,
      isActive: head.isActive,
    }))
    .filter((head) => head.key !== '' || head.label !== '');
  const hasInvalidHeadDraft = normalizedHeadDrafts.some((head) => head.key === '' || head.label === '');
  const canSaveNavigationHeads = normalizedHeadDrafts.length > 0 && !hasInvalidHeadDraft;
  const availableNavigationHeads = navigationHeads.filter((head) => head.key.trim() !== '');

  const selectedRoleMappingDraft = mappingDrafts[selectedMappingRole] ?? [];
  const activeRoles = roles.filter((role) => role.isActive);
  const nonSuperadminRoles = roles.filter((role) => role.role !== 'superadmin');
  const selectedUserRoleMeta = roles.find((role) => role.role === userForm.role) ?? null;
  const availableUserRoles = selectedUserRoleMeta && !activeRoles.some((role) => role.role === selectedUserRoleMeta.role)
    ? [selectedUserRoleMeta, ...activeRoles]
    : activeRoles;

  const overviewCards = [
    { label: 'Master Akun', value: overview.totalUsers, target: 'admin_users' as AppModule, icon: Users },
    { label: 'Master Role', value: roles.length, target: 'admin_roles' as AppModule, icon: ShieldCheck },
    { label: 'Master Data Modul', value: adminModules.length, target: 'admin_modules' as AppModule, icon: Database },
    { label: 'Modul To Role', value: roleModuleMappings.length, target: 'admin_module_roles' as AppModule, icon: Layers3 },
  ];

  const resetUserForm = () => {
    setEditingUser(null);
    setUserForm({
      ...defaultUserForm,
      role: activeRoles[0]?.role ?? defaultUserForm.role,
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
      phone: user.phone,
      password: '',
      passwordConfirmation: '',
      isActive: user.isActive,
    });
    setIsUserFormOpen(true);
  };

  const saveUser = async () => {
    setFeedback(null);
    try {
      const payload = {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        phone: userForm.phone,
        is_active: userForm.isActive,
        ...(editingUser
          ? {}
          : {
              password: userForm.password,
              password_confirmation: userForm.passwordConfirmation,
            }),
      };

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

      setFeedback(editingUser ? 'Profil akun berhasil diperbarui.' : 'Akun login baru berhasil dibuat.');
      setIsUserFormOpen(false);
      resetUserForm();
      await loadAdminData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal menyimpan akun.');
    }
  };

  const toggleUserStatus = async (user: AdminUser) => {
    setStatusConfirmationLoading(true);
    try {
      await authFetch(`/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !user.isActive }),
      });
      setFeedback(`Status akun ${user.name} berhasil diperbarui.`);
      await loadAdminData();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status akun.');
    } finally {
      setStatusConfirmationLoading(false);
    }
  };

  const resetUserPassword = async () => {
    if (!passwordTarget) return;

    try {
      await authFetch(`/admin/users/${passwordTarget.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({
          password: passwordForm.password,
          password_confirmation: passwordForm.passwordConfirmation,
        }),
      });
      setFeedback(`Password akun ${passwordTarget.name} berhasil direset.`);
      setPasswordTarget(null);
      setPasswordForm({ password: '', passwordConfirmation: '' });
    } catch (passwordError) {
      setError(passwordError instanceof Error ? passwordError.message : 'Gagal mereset password akun.');
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      ...defaultRoleForm,
      dashboardModuleKey: 'dashboard',
      sortOrder: roles.length + 1,
    });
    setIsRoleFormOpen(true);
  };

  const openEditRole = (role: RoleMeta) => {
    setEditingRole(role);
    setRoleForm({
      role: role.role,
      roleTitle: role.roleTitle,
      division: role.division,
      dashboardModuleKey: role.dashboardModuleKey ?? 'dashboard',
      description: role.description ?? '',
      isActive: role.isActive,
      sortOrder: role.sortOrder ?? 0,
    });
    setIsRoleFormOpen(true);
  };

  const saveRole = async () => {
    try {
      const payload = {
        role: roleForm.role,
        role_title: roleForm.roleTitle,
        division: roleForm.division,
        dashboard_module_key: roleForm.dashboardModuleKey ?? 'dashboard',
        description: roleForm.description ?? '',
        sort_order: roleForm.sortOrder ?? 0,
        is_active: roleForm.isActive,
      };

      if (editingRole) {
        await authFetch(`/admin/roles/${editingRole.role}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch('/admin/roles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setFeedback(editingRole ? `Role ${editingRole.role} berhasil diperbarui.` : `Role ${roleForm.role} berhasil dibuat.`);
      setIsRoleFormOpen(false);
      setEditingRole(null);
      setRoleForm(defaultRoleForm);
      await loadAdminData();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Gagal menyimpan role.');
    }
  };

  const toggleRoleStatus = async (role: RoleMeta) => {
    setStatusConfirmationLoading(true);
    try {
      await authFetch(`/admin/roles/${role.role}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !role.isActive }),
      });
      setFeedback(`Status role ${role.role} berhasil diperbarui.`);
      await loadAdminData();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Gagal memperbarui status role.');
    } finally {
      setStatusConfirmationLoading(false);
    }
  };

  const updateGroupField = (rowIndex: number, field: string, value: string) => {
    if (!currentGroup) return;

    setDraftGroups((state) => ({
      ...state,
      [currentGroup.key]: (state[currentGroup.key] ?? []).map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      ),
    }));
  };

  const addGroupRow = () => {
    if (!currentGroup) return;
    const nextRow = Object.fromEntries(currentGroup.editableFields.map((field) => [field, '']));
    setDraftGroups((state) => ({
      ...state,
      [currentGroup.key]: [...(state[currentGroup.key] ?? []), nextRow],
    }));
  };

  const saveCurrentGroup = async () => {
    if (!currentGroup) return;

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

  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm(defaultModuleForm);
    setModuleFormErrors(defaultModuleFormErrors);
    setIsModuleFormOpen(true);
  };

  const openEditModule = (module: AdminModule) => {
    setEditingModule(module);
    setModuleForm({ ...module });
    setModuleFormErrors(defaultModuleFormErrors);
    setIsModuleFormOpen(true);
  };

  const validateModuleForm = () => {
    const nextErrors = {
      key: '',
      label: '',
      navigationHeadKey: '',
      routeTarget: '',
    };

    if (!editingModule && !/^[a-z][a-z0-9_]*$/.test(moduleForm.key.trim())) {
      nextErrors.key = 'Key modul wajib huruf kecil, angka, atau underscore, dan harus diawali huruf.';
    }

    if (!moduleForm.label.trim()) {
      nextErrors.label = 'Label modul wajib diisi.';
    }

    if (!moduleForm.navigationHeadKey.trim()) {
      nextErrors.navigationHeadKey = 'Kepala navigasi wajib dipilih.';
    }

    if (!/^\/app(?:\/[a-z0-9-]+)+$/.test(moduleForm.routeTarget.trim())) {
      nextErrors.routeTarget = 'Route target harus berupa path internal, misalnya /app/helpdesk.';
    }

    setModuleFormErrors(nextErrors);
    return Object.values(nextErrors).every((value) => value === '');
  };

  const normalizeModuleErrorMessage = (message: string) => {
    if (message.includes('selected navigation head key is invalid') || message.includes('navigation head key')) {
      return 'Kepala navigasi yang dipilih tidak valid. Simpan atau perbaiki data head navigasi terlebih dahulu.';
    }

    if (message.includes('module key')) {
      return 'Key modul sudah dipakai. Gunakan key lain yang unik.';
    }

    if (message.includes('Route target sudah dipakai')) {
      return 'Route target sudah dipakai modul lain.';
    }

    if (message.includes('Route target harus berupa path internal')) {
      return 'Route target harus diawali /app/, misalnya /app/helpdesk.';
    }

    if (message.includes('Modul sistem inti tidak boleh dihapus')) {
      return 'Modul sistem inti tidak boleh dihapus dari master modul.';
    }

    if (message.includes('Modul tidak bisa dihapus karena masih dipakai relasi data lain')) {
      return 'Modul tidak bisa dihapus karena masih dipakai relasi data lain. Lepaskan dependensinya terlebih dahulu.';
    }

    return message;
  };

  const saveModule = async () => {
    setError(null);
    setFeedback(null);

    if (!validateModuleForm()) {
      setError('Periksa kembali field modul yang masih belum valid.');
      return;
    }

    if (availableNavigationHeads.length === 0) {
      setError('Belum ada kepala navigasi yang valid. Tambahkan atau simpan kepala navigasi terlebih dahulu.');
      return;
    }

    try {
      const payload = {
        key: moduleForm.key.trim(),
        label: moduleForm.label.trim(),
        description: moduleForm.description.trim(),
        navigation_head_key: moduleForm.navigationHeadKey,
        order: moduleForm.order,
        route_target: moduleForm.routeTarget.trim(),
        quick_action: moduleForm.quickAction,
        view_formats: moduleForm.viewFormats,
        is_active: moduleForm.isActive,
        show_in_navbar: moduleForm.showInNavbar,
        admin_only_dashboard: moduleForm.adminOnlyDashboard,
      };

      if (editingModule) {
        await authFetch(`/admin/modules/${editingModule.key}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch('/admin/modules', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setFeedback(editingModule ? 'Master modul berhasil diperbarui.' : 'Master modul baru berhasil dibuat.');
      setIsModuleFormOpen(false);
      setEditingModule(null);
      setModuleForm(defaultModuleForm);
      setModuleFormErrors(defaultModuleFormErrors);
      await loadAdminData();
    } catch (moduleError) {
      setError(normalizeModuleErrorMessage(moduleError instanceof Error ? moduleError.message : 'Gagal menyimpan modul.'));
    }
  };

  const deleteModule = async (module: AdminModule) => {
    const confirmed = window.confirm(
      `Hapus modul ${module.label} (${module.key})?\n\nJika modul ini masih dimapping ke role, mapping terkait akan ikut terhapus otomatis. Modul sistem inti tetap tidak bisa dihapus.`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setFeedback(null);

    try {
      await authFetch(`/admin/modules/${module.key}`, {
        method: 'DELETE',
      });
      setFeedback(`Modul ${module.label} berhasil dihapus.`);
      if (editingModule?.key === module.key) {
        setIsModuleFormOpen(false);
        setEditingModule(null);
        setModuleForm(defaultModuleForm);
        setModuleFormErrors(defaultModuleFormErrors);
      }
      await loadAdminData();
    } catch (moduleError) {
      setError(normalizeModuleErrorMessage(moduleError instanceof Error ? moduleError.message : 'Gagal menghapus modul.'));
    }
  };

  const saveNavigationHeads = async () => {
    setError(null);
    setFeedback(null);

    if (normalizedHeadDrafts.length === 0) {
      setError('Belum ada kepala navigasi. Tambahkan head terlebih dahulu.');
      return;
    }

    if (hasInvalidHeadDraft) {
      setError('Setiap kepala navigasi wajib memiliki key dan label sebelum disimpan.');
      return;
    }

    const hasInvalidHeadKeyFormat = normalizedHeadDrafts.some((head) => !HEAD_KEY_PATTERN.test(head.key));
    if (hasInvalidHeadKeyFormat) {
      setError('Key kepala navigasi hanya boleh huruf kecil, angka, dan underscore, serta harus diawali huruf.');
      return;
    }

    try {
      await authFetch('/admin/navigation-config', {
        method: 'PUT',
        body: JSON.stringify({
          heads: normalizedHeadDrafts.map((head) => ({
            key: head.key,
            label: head.label,
            order: head.order,
            is_active: head.isActive,
          })),
        }),
      });
      setFeedback('Kepala navigasi berhasil diperbarui.');
      await loadAdminData();
    } catch (headError) {
      const message = headError instanceof Error ? headError.message : 'Gagal memperbarui kepala navigasi.';
      setError(message.includes('heads field') ? 'Minimal harus ada satu kepala navigasi.' : message);
    }
  };

  const addNavigationHeadDraft = () => {
    const nextOrder = currentHeadDrafts.length > 0
      ? Math.max(...currentHeadDrafts.map((head) => head.order || 0)) + 1
      : 1;
    const draftId = `draft_head_${Date.now()}`;
    const nextHead = createBlankHead(nextOrder);

    setHeadDrafts((state) => ({
      ...state,
      [draftId]: nextHead,
    }));
    setError(null);
    setFeedback('Head baru ditambahkan. Lengkapi key dan label lalu simpan.');
  };

  const saveRoleModuleMappings = async () => {
    try {
      await authFetch(`/admin/module-role-mappings/${selectedMappingRole}`, {
        method: 'PUT',
        body: JSON.stringify({
          mappings: selectedRoleMappingDraft.map((mapping) => ({
            module_key: mapping.moduleKey,
            is_visible: mapping.isVisible,
            order_override: mapping.orderOverride ?? null,
          })),
        }),
      });
      setFeedback(`Mapping modul untuk role ${selectedMappingRole} berhasil diperbarui.`);
      await loadAdminData();
    } catch (mappingError) {
      setError(mappingError instanceof Error ? mappingError.message : 'Gagal memperbarui mapping modul terhadap role.');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-emerald-300/60 bg-linear-to-br from-emerald-400 via-emerald-500 to-emerald-600 p-6 text-white shadow-[0_22px_50px_rgba(16,185,129,0.25)] lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-50/90">System Administration</p>
            <h2 className="text-3xl font-black tracking-tight">Master role, modul, dan navigasi aplikasi</h2>
            <p className="max-w-2xl text-sm text-emerald-50/85">
              Workspace ini menjadi pusat kontrol akun login, master referensi, kepala navigasi, dan mapping modul terhadap setiap role system.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setSelectedModule('admin_master')} className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-emerald-700">
                Buka Master Data
              </button>
              <button onClick={() => setSelectedModule('admin_module_roles')} className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                Buka Modul To Role
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {overviewCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.label}
                  onClick={() => setSelectedModule(card.target)}
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur-sm transition hover:bg-white/15"
                >
                  <Icon className="h-5 w-5 text-emerald-50" />
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-50/70">{card.label}</p>
                  <p className="mt-1 text-3xl font-black">{card.value}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">Akses cepat administrasi</h3>
              <p className="text-sm text-slate-500">Shortcut untuk area admin yang paling sering dipakai superadmin.</p>
            </div>
            <button onClick={() => void loadAdminData()} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {[
              { title: 'Master Akun', subtitle: 'Akun login dan status aktif', target: 'admin_users' as AppModule, count: users.length, icon: Users },
              { title: 'Master Data Role', subtitle: 'Role title dan division', target: 'admin_roles' as AppModule, count: roles.length, icon: ShieldCheck },
              { title: 'Master Data Modul', subtitle: 'Nama modul dan link akses', target: 'admin_modules' as AppModule, count: adminModules.length, icon: Database },
              { title: 'Modul To Role', subtitle: 'Visibilitas menu per role', target: 'admin_module_roles' as AppModule, count: roleModuleMappings.length, icon: Layers3 },
              { title: 'Mapping Infrastruktur', subtitle: 'Relasi data ODP dan entitas aplikasi', target: 'admin_mappings' as AppModule, count: mappingPayload?.odps.length ?? 0, icon: Network },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.title} onClick={() => setSelectedModule(item.target)} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:bg-white">
                  <Icon className="h-5 w-5 text-emerald-700" />
                  <p className="mt-4 text-base font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{item.count}</span>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <h3 className="text-lg font-black text-slate-950">Arah pengelolaan master</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-600">
            <p>Gunakan <span className="font-semibold text-slate-900">Master Role</span> sebagai sumber role akun login, lalu pakai <span className="font-semibold text-slate-900">Master Data Modul</span> untuk mendaftarkan fitur dan link akses internal.</p>
            <p>Setelah modul dibuat, tentukan role yang boleh mengaksesnya melalui <span className="font-semibold text-slate-900">Modul To Role</span>. Menu master admin tidak ditampilkan di navbar global.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Daftar akun login</h3>
            <p className="text-sm text-slate-500">Kelola akun aktif, role, division, dan tindakan admin sensitif.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama, email, role, division..."
              className="min-w-[280px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            />
            <button onClick={openCreateUser} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Tambah Akun
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)] xl:grid-cols-[1.2fr_1fr_1fr_0.9fr]">
            <div>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-700">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user.role}</p>
              <p className="text-xs text-slate-500">{user.roleTitle}</p>
            </div>
            <div>
              <p className="text-sm text-slate-700">{user.division}</p>
              <p className="text-xs text-slate-500 mt-1">{user.phone}</p>
            </div>
            <div className="flex flex-wrap items-start gap-2 xl:justify-end">
              <button onClick={() => openEditUser(user)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                Edit
              </button>
              <button onClick={() => setPasswordTarget(user)} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                Reset Password
              </button>
              <button onClick={() => setStatusConfirmation({ type: 'user', user })} className={`rounded-xl px-3 py-2 text-xs font-semibold ${user.isActive ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRoleMeta = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Master data role</h3>
            <p className="text-sm text-slate-500">Role digunakan untuk akun login dan menjadi dasar mapping modul ke setiap role system.</p>
          </div>
          <button onClick={openCreateRole} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Tambah Role
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {roles.map((role) => {
          return (
            <div key={role.role} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <div className="grid gap-4 xl:grid-cols-[0.8fr_1fr_1fr_1fr_1.1fr_auto] xl:items-end">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{role.role}</p>
                  <p className="mt-2 text-sm text-slate-500">{role.isActive ? 'Role aktif' : 'Role nonaktif'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Role Title</p>
                  <p className="mt-1 font-semibold text-slate-900">{role.roleTitle}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Division</p>
                  <p className="mt-1 font-semibold text-slate-900">{role.division}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Halaman Dashboard</p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {MODULE_META[role.dashboardModuleKey ?? 'dashboard']?.label ?? (role.dashboardModuleKey ?? 'dashboard')}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Deskripsi</p>
                  <p className="mt-1 text-slate-700">{role.description || '-'}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button onClick={() => openEditRole(role)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                    Edit
                  </button>
                  <button onClick={() => setStatusConfirmation({ type: 'role', role })} className={`rounded-xl px-3 py-2 text-xs font-semibold ${role.isActive ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {role.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderMasterData = () => (
    <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
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
              <p className="mt-1 text-xs text-slate-500">{group.items.length} item referensi</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">{currentGroup?.label ?? 'Master Data'}</h3>
            <p className="text-sm text-slate-500">Edit data referensi yang menjadi sumber dropdown dan referensi workflow.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={addGroupRow} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">Tambah Baris</button>
            <button onClick={() => void saveCurrentGroup()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              Simpan
            </button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {currentGroupDraft.map((row, rowIndex) => (
            <div key={`${currentGroup?.key ?? 'group'}-${rowIndex}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
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
  );

  const renderModuleMaster = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Kepala navigasi</h3>
            <p className="text-sm text-slate-500">Struktur kepala navigasi yang akan membungkus modul-modul di navbar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={addNavigationHeadDraft} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <Plus className="h-4 w-4" />
              Tambah Head
            </button>
            <button
              onClick={() => void saveNavigationHeads()}
              disabled={!canSaveNavigationHeads}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save className="h-4 w-4" />
              Simpan Head
            </button>
          </div>
        </div>

        {currentHeadDrafts.length === 0 ? (
          <div className="mt-5 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-base font-bold text-slate-900">Belum ada kepala navigasi</p>
            <p className="mt-2 text-sm text-slate-500">
              Tambahkan minimal satu head navigasi agar modul bisa dikelompokkan dan disimpan dengan benar.
            </p>
            <button onClick={addNavigationHeadDraft} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" />
              Tambah Head Pertama
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {headDraftEntries.map(([draftKey, draft]) => (
              <div key={draftKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {(() => {
                  const isNewHeadDraft = draftKey.startsWith('draft_head_');
                  return (
                    <>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {draft.key.trim() || 'head_baru'}
                </p>
                <input
                  value={draft.key}
                  onChange={(event) => {
                    if (!isNewHeadDraft) return;
                    setHeadDrafts((state) => ({
                      ...state,
                      [draftKey]: { ...draft, key: normalizeNavigationHeadKey(event.target.value) },
                    }));
                    setError(null);
                  }}
                  placeholder="Key head, contoh: operasional"
                  readOnly={!isNewHeadDraft}
                  className={`mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm ${!isNewHeadDraft ? 'cursor-not-allowed bg-slate-100 text-slate-500' : ''}`}
                />
                <input
                  value={draft.label}
                  onChange={(event) => setHeadDrafts((state) => ({ ...state, [draftKey]: { ...draft, label: event.target.value } }))}
                  placeholder="Label head"
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
                <input
                  type="number"
                  value={draft.order}
                  onChange={(event) => setHeadDrafts((state) => ({ ...state, [draftKey]: { ...draft, order: Number(event.target.value) } }))}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
                />
                <label className="mt-3 flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(event) => setHeadDrafts((state) => ({ ...state, [draftKey]: { ...draft, isActive: event.target.checked } }))}
                  />
                  Head aktif
                </label>
                {!isNewHeadDraft && (
                  <p className="mt-2 text-xs text-slate-500">Key head existing bersifat kode internal dan tidak bisa diubah dari sini.</p>
                )}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Daftar modul aplikasi</h3>
            <p className="text-sm text-slate-500">Nama modul, target route internal, head navigasi, urutan, dan visibilitas modul.</p>
          </div>
          <button onClick={openCreateModule} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            Tambah Modul
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {adminModules.map((module) => (
            <div key={module.key} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-[1fr_0.9fr_0.7fr_auto]">
              <div>
                <p className="text-sm font-bold text-slate-900">{module.label}</p>
                <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">{module.key} {'->'} {module.routeTarget}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${module.showInNavbar ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {module.showInNavbar ? 'Tampil di Navbar' : 'Dashboard Only'}
                  </span>
                  {module.adminOnlyDashboard && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                      Admin Tool
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Navigation Head</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{module.navigationHeadKey}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Order</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{module.order}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => openEditModule(module)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
                  Edit Modul
                </button>
                <button
                  onClick={() => void deleteModule(module)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderModuleToRole = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-950">Mapping modul terhadap role</h3>
            <p className="text-sm text-slate-500">Pilih role, lalu atur menu apa saja yang tampil di bawah kepala navigasi untuk role tersebut.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMappingRole}
              onChange={(event) => setSelectedMappingRole(event.target.value as RoleMeta['role'])}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              {nonSuperadminRoles.map((role) => (
                <option key={role.role} value={role.role}>{role.role}</option>
              ))}
            </select>
            <button onClick={() => void saveRoleModuleMappings()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              Simpan Mapping
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {navigationHeads
          .slice()
          .sort((left, right) => left.order - right.order)
          .map((head) => {
            const modulesUnderHead = adminModules
              .filter((module) => module.navigationHeadKey === head.key && module.showInNavbar)
              .sort((left, right) => left.order - right.order);

            return (
              <div key={head.key} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">{head.key}</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{head.label}</h4>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {modulesUnderHead.length} modul
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {modulesUnderHead.map((module) => {
                    const existing = selectedRoleMappingDraft.find((mapping) => mapping.moduleKey === module.key);
                    const checked = existing?.isVisible ?? false;

                    return (
                      <label key={module.key} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{module.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const nextVisible = event.target.checked;
                            setMappingDrafts((state) => {
                              const current = state[selectedMappingRole] ?? [];
                              const withoutCurrent = current.filter((mapping) => mapping.moduleKey !== module.key);
                              return {
                                ...state,
                                [selectedMappingRole]: [
                                  ...withoutCurrent,
                                  {
                                    role: selectedMappingRole,
                                    moduleKey: module.key,
                                    isVisible: nextVisible,
                                    orderOverride: existing?.orderOverride ?? module.order,
                                  },
                                ],
                              };
                            });
                          }}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderMappings = () => (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'ODP Terdaftar', value: mappingPayload?.networkSummary.totalOdps ?? 0, icon: Network },
          { label: 'Total Port', value: mappingPayload?.networkSummary.totalPorts ?? 0, icon: Server },
          { label: 'Port Terpakai', value: mappingPayload?.networkSummary.usedPorts ?? 0, icon: Activity },
          { label: 'Port Tersedia', value: mappingPayload?.networkSummary.availablePorts ?? 0, icon: Wifi },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <Icon className="h-5 w-5 text-emerald-700" />
              <p className="mt-4 text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{item.value}</p>
            </div>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
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
                <p className="mt-1 text-xs text-slate-500">{String(item.division ?? '-')}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <h3 className="text-lg font-black text-slate-950">Menu audit tidak ditampilkan</h3>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Halaman audit tidak lagi diekspos dari dashboard utama maupun navbar global. Jika modul ini masih dipertahankan secara internal, aksesnya dilakukan secara langsung melalui route admin yang sesuai.
        </div>
      </div>
    </div>
  );

  const renderByModule = () => {
    switch (selectedModule) {
      case 'admin_users':
        return renderUserManagement();
      case 'admin_roles':
        return renderRoleMeta();
      case 'admin_master':
        return renderMasterData();
      case 'admin_modules':
        return renderModuleMaster();
      case 'admin_module_roles':
        return renderModuleToRole();
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
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
        Memuat workspace superadmin...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">System Admin Workspace</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{moduleTitles[selectedModule]?.title ?? moduleTitles.dashboard.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">{moduleTitles[selectedModule]?.description ?? moduleTitles.dashboard.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {feedback && <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>}
            {error && <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          </div>
        </div>
      </div>

      {renderByModule()}

      {isUserFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Admin User Form</p>
                <h3 className="mt-1 text-lg font-black">{editingUser ? 'Edit akun login' : 'Tambah akun login'}</h3>
              </div>
              <button onClick={() => setIsUserFormOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <input value={userForm.name} onChange={(event) => setUserForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nama user" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={userForm.email} onChange={(event) => setUserForm((state) => ({ ...state, email: event.target.value }))} placeholder="Email login" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <select value={userForm.role} onChange={(event) => setUserForm((state) => ({ ...state, role: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                {availableUserRoles.map((role) => <option key={role.role} value={role.role}>{role.role}</option>)}
              </select>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Role title</p>
                <p className="mt-2 font-semibold">{selectedUserRoleMeta?.roleTitle ?? '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Division</p>
                <p className="mt-2 font-semibold">{selectedUserRoleMeta?.division ?? '-'}</p>
              </div>
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
            <div className="flex justify-end px-6 pb-6">
              <button onClick={() => void saveUser()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                Simpan Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {isRoleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Master Role Form</p>
                <h3 className="mt-1 text-lg font-black">{editingRole ? 'Edit role system' : 'Tambah role system'}</h3>
              </div>
              <button onClick={() => setIsRoleFormOpen(false)} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <input
                value={roleForm.role}
                onChange={(event) => setRoleForm((state) => ({ ...state, role: event.target.value }))}
                placeholder="Role key"
                disabled={Boolean(editingRole)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <input
                value={roleForm.roleTitle}
                onChange={(event) => setRoleForm((state) => ({ ...state, roleTitle: event.target.value }))}
                placeholder="Role title"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <input
                value={roleForm.division}
                onChange={(event) => setRoleForm((state) => ({ ...state, division: event.target.value }))}
                placeholder="Division"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <select
                value={roleForm.dashboardModuleKey ?? 'dashboard'}
                onChange={(event) => setRoleForm((state) => ({ ...state, dashboardModuleKey: event.target.value as RoleMeta['dashboardModuleKey'] }))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              >
                {ROLE_DASHBOARD_MODULE_OPTIONS.map((moduleKey) => (
                  <option key={moduleKey} value={moduleKey}>
                    {MODULE_META[moduleKey].label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={roleForm.sortOrder ?? 0}
                onChange={(event) => setRoleForm((state) => ({ ...state, sortOrder: Number(event.target.value) }))}
                placeholder="Sort order"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />
              <textarea
                value={roleForm.description ?? ''}
                onChange={(event) => setRoleForm((state) => ({ ...state, description: event.target.value }))}
                placeholder="Deskripsi role"
                className="min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:col-span-2"
              />
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={roleForm.isActive} onChange={(event) => setRoleForm((state) => ({ ...state, isActive: event.target.checked }))} />
                Role aktif
              </label>
            </div>
            <div className="flex justify-end px-6 pb-6">
              <button onClick={() => void saveRole()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                Simpan Role
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Reset Password</p>
                <h3 className="mt-1 text-lg font-black">{passwordTarget.name}</h3>
              </div>
              <button onClick={() => setPasswordTarget(null)} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="space-y-4 p-6">
              <input type="password" value={passwordForm.password} onChange={(event) => setPasswordForm((state) => ({ ...state, password: event.target.value }))} placeholder="Password baru" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input type="password" value={passwordForm.passwordConfirmation} onChange={(event) => setPasswordForm((state) => ({ ...state, passwordConfirmation: event.target.value }))} placeholder="Konfirmasi password baru" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <button onClick={() => void resetUserPassword()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <KeyRound className="h-4 w-4" />
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {isModuleFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-slate-950 px-6 py-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Master Modul Form</p>
                <h3 className="mt-1 text-lg font-black">{editingModule ? 'Edit modul navigasi' : 'Tambah modul navigasi'}</h3>
              </div>
              <button onClick={() => { setIsModuleFormOpen(false); setModuleFormErrors(defaultModuleFormErrors); }} className="rounded-full bg-white/10 px-3 py-1 text-sm">Tutup</button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {!editingModule && (
                <div>
                  <input value={moduleForm.key} onChange={(event) => { setModuleForm((state) => ({ ...state, key: event.target.value })); setModuleFormErrors((state) => ({ ...state, key: '' })); }} placeholder="module_key" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm ${moduleFormErrors.key ? 'border-rose-300' : 'border-slate-200'}`} />
                  {moduleFormErrors.key && <p className="mt-2 text-xs font-medium text-rose-600">{moduleFormErrors.key}</p>}
                </div>
              )}
              <div>
                <input value={moduleForm.label} onChange={(event) => { setModuleForm((state) => ({ ...state, label: event.target.value })); setModuleFormErrors((state) => ({ ...state, label: '' })); }} placeholder="Label modul" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm ${moduleFormErrors.label ? 'border-rose-300' : 'border-slate-200'}`} />
                {moduleFormErrors.label && <p className="mt-2 text-xs font-medium text-rose-600">{moduleFormErrors.label}</p>}
              </div>
              <input value={moduleForm.description} onChange={(event) => setModuleForm((state) => ({ ...state, description: event.target.value }))} placeholder="Deskripsi modul" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:col-span-2" />
              <div>
                <select value={moduleForm.navigationHeadKey} onChange={(event) => { setModuleForm((state) => ({ ...state, navigationHeadKey: event.target.value })); setModuleFormErrors((state) => ({ ...state, navigationHeadKey: '' })); }} className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm ${moduleFormErrors.navigationHeadKey ? 'border-rose-300' : 'border-slate-200'}`}>
                  <option value="">Pilih kepala navigasi</option>
                  {availableNavigationHeads.map((head) => <option key={head.key} value={head.key}>{head.label}</option>)}
                </select>
                {moduleFormErrors.navigationHeadKey && <p className="mt-2 text-xs font-medium text-rose-600">{moduleFormErrors.navigationHeadKey}</p>}
              </div>
              <input type="number" value={moduleForm.order} onChange={(event) => setModuleForm((state) => ({ ...state, order: Number(event.target.value) }))} placeholder="Urutan" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <div>
                <input value={moduleForm.routeTarget} onChange={(event) => { setModuleForm((state) => ({ ...state, routeTarget: event.target.value })); setModuleFormErrors((state) => ({ ...state, routeTarget: '' })); }} placeholder="/app/helpdesk" className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm ${moduleFormErrors.routeTarget ? 'border-rose-300' : 'border-slate-200'}`} />
                {moduleFormErrors.routeTarget && <p className="mt-2 text-xs font-medium text-rose-600">{moduleFormErrors.routeTarget}</p>}
              </div>
              <select value={moduleForm.quickAction ?? ''} onChange={(event) => setModuleForm((state) => ({ ...state, quickAction: (event.target.value || null) as AdminModule['quickAction'] }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="">Tanpa quick action</option>
                <option value="new_ticket">new_ticket</option>
                <option value="new_customer">new_customer</option>
                <option value="new_task">new_task</option>
                <option value="new_procurement">new_procurement</option>
              </select>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">View formats</p>
                <div className="mt-3 flex flex-wrap gap-4">
                  {(['table', 'grid', 'kanban', 'map'] as const).map((format) => (
                    <label key={format} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={moduleForm.viewFormats.includes(format)}
                        onChange={(event) => setModuleForm((state) => ({
                          ...state,
                          viewFormats: event.target.checked
                            ? [...state.viewFormats, format]
                            : state.viewFormats.filter((item) => item !== format),
                        }))}
                      />
                      {format}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={moduleForm.showInNavbar} disabled={moduleForm.adminOnlyDashboard} onChange={(event) => setModuleForm((state) => ({ ...state, showInNavbar: event.target.checked }))} />
                Tampilkan di navbar
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={moduleForm.adminOnlyDashboard} onChange={(event) => setModuleForm((state) => ({ ...state, adminOnlyDashboard: event.target.checked, showInNavbar: event.target.checked ? false : state.showInNavbar }))} />
                Admin tool dashboard only
              </label>
            </div>
            <div className="flex justify-end px-6 pb-6">
              <button onClick={() => void saveModule()} disabled={availableNavigationHeads.length === 0} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                <Save className="h-4 w-4" />
                Simpan Modul
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={statusConfirmation !== null}
        title={
          statusConfirmation?.type === 'user'
            ? statusConfirmation.user.isActive ? 'Konfirmasi Nonaktifkan Akun' : 'Konfirmasi Aktifkan Akun'
            : statusConfirmation?.role.isActive
            ? 'Konfirmasi Nonaktifkan Role'
            : 'Konfirmasi Aktifkan Role'
        }
        message={
          statusConfirmation?.type === 'user'
            ? statusConfirmation.user.isActive
              ? `Akun ${statusConfirmation.user.name} (${statusConfirmation.user.email}) akan dinonaktifkan. User tidak akan bisa memakai aplikasi sampai statusnya diaktifkan kembali.`
              : `Akun ${statusConfirmation.user.name} (${statusConfirmation.user.email}) akan diaktifkan kembali agar bisa login dan memakai aplikasi.`
            : statusConfirmation?.role
            ? statusConfirmation.role.isActive
              ? `Role ${statusConfirmation.role.role} akan dinonaktifkan. Role ini tidak lagi tersedia sebagai role aktif aplikasi.`
              : `Role ${statusConfirmation.role.role} akan diaktifkan kembali dan bisa dipakai sebagai role aktif aplikasi.`
            : ''
        }
        confirmLabel={
          statusConfirmation?.type === 'user'
            ? statusConfirmation.user.isActive ? 'Ya, Nonaktifkan Akun' : 'Ya, Aktifkan Akun'
            : statusConfirmation?.role?.isActive
            ? 'Ya, Nonaktifkan Role'
            : 'Ya, Aktifkan Role'
        }
        tone={
          statusConfirmation?.type === 'user'
            ? statusConfirmation.user.isActive ? 'danger' : 'success'
            : statusConfirmation?.role?.isActive
            ? 'danger'
            : 'success'
        }
        loading={statusConfirmationLoading}
        onCancel={() => setStatusConfirmation(null)}
        onConfirm={() => {
          if (!statusConfirmation) return;
          if (statusConfirmation.type === 'user') {
            void toggleUserStatus(statusConfirmation.user).finally(() => setStatusConfirmation(null));
            return;
          }
          void toggleRoleStatus(statusConfirmation.role).finally(() => setStatusConfirmation(null));
        }}
      />
    </div>
  );
};

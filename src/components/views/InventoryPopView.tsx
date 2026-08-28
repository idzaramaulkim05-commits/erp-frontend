import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Cpu,
  Edit,
  FileCheck2,
  HardDrive,
  Layers,
  MapPin,
  Network,
  Package,
  PackageCheck,
  PackagePlus,
  Phone,
  Plus,
  QrCode,
  Radio,
  RefreshCcw,
  Search,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NetworkPop, PopDevice, PopWorkOrder, UserProfile } from '../../types';

export const InventoryPopView: React.FC = () => {
  const { authFetch, user } = useAuth();

  // State
  const [pops, setPops] = useState<NetworkPop[]>([]);
  const [workOrders, setWorkOrders] = useState<PopWorkOrder[]>([]);
  const [techUsers, setTechUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [mainTab, setMainTab] = useState<'daftar_pop' | 'detail_pop' | 'penugasan_pop'>('daftar_pop');
  const [selectedPopId, setSelectedPopId] = useState<string | null>(null);
  const [popDetailSubTab, setPopDetailSubTab] = useState<'perangkat' | 'riwayat_wo' | 'topologi'>('perangkat');
  const [deviceCategoryFilter, setDeviceCategoryFilter] = useState<string>('all');
  const [popSearch, setPopSearch] = useState('');
  const [popRegionFilter, setPopRegionFilter] = useState('all');
  const [woStatusFilter, setWoStatusFilter] = useState<string>('all');

  // Modals state
  const [isNewPopModalOpen, setIsNewPopModalOpen] = useState(false);
  const [isNewWoModalOpen, setIsNewWoModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isFieldReportModalOpen, setIsFieldReportModalOpen] = useState(false);
  const [isNocQcModalOpen, setIsNocQcModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  const [activeWo, setActiveWo] = useState<PopWorkOrder | null>(null);
  const [editingDevice, setEditingDevice] = useState<PopDevice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Forms State
  const [newPopForm, setNewPopForm] = useState({
    name: '',
    code: '',
    region: 'Sidoarjo Kota',
    cluster_code: 'SDA',
    address: '',
    pic_name: '',
    pic_phone: '',
    power_backup_info: 'Rectifier 48V + Baterai Lithium 100Ah',
    rack_capacity: '42U (Terpakai 12U)',
    notes: '',
  });

  const [newWoForm, setNewWoForm] = useState({
    network_pop_id: '',
    action_type: 'add_device' as 'add_device' | 'replace_device' | 'modify_config' | 'remove_device',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    target_device_id: '',
    category: 'OLT',
    brand: '',
    model: '',
    serial_number: '',
    mac_address: '',
    ip_management: '',
    rack_position: 'Rack 1 - Unit U10',
    power_source: 'Rectifier 48V Port 1',
    warehouse_materials: '',
    noc_instruction_guide: '',
    target_vlan: '',
  });

  const [assignForm, setAssignForm] = useState({
    assigned_tech_id: '',
    scheduled_date: '',
  });

  const [fieldReportForm, setFieldReportForm] = useState({
    rack_unit: '',
    serial_number: '',
    mac_address: '',
    ip_address: '',
    test_result: '',
    technician_notes: '',
  });

  const [nocQcForm, setNocQcForm] = useState({
    ping_test_success: true,
    snmp_active: true,
    rx_tx_power_dbm: '+6.2 dBm',
    qc_notes: '',
  });

  const [deviceForm, setDeviceForm] = useState({
    category: 'OLT',
    brand: '',
    model: '',
    serial_number: '',
    mac_address: '',
    ip_management: '',
    rack_position: '',
    power_source: '',
    status: 'active' as 'active' | 'backup' | 'standby' | 'maintenance' | 'faulty',
    notes: '',
  });

  // Load data
  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [popsRes, woRes, usersRes] = await Promise.all([
        authFetch<{ data: NetworkPop[] }>('/pops'),
        authFetch<{ data: PopWorkOrder[] }>('/pop-work-orders'),
        authFetch<{ data: UserProfile[] }>('/users'),
      ]);
      setPops(popsRes.data || []);
      setWorkOrders(woRes.data || []);
      setTechUsers(
        (usersRes.data || []).filter(
          (u) => u.role === 'field_tech' || u.role === 'lead_tech' || u.role === 'noc',
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data Inventory POP.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  // Selected Pop Detail
  const selectedPop = useMemo(() => {
    if (!selectedPopId) return null;
    return pops.find((p) => p.id === selectedPopId) || null;
  }, [pops, selectedPopId]);

  // Filtered POPs
  const filteredPops = useMemo(() => {
    return pops.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(popSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(popSearch.toLowerCase()) ||
        p.address.toLowerCase().includes(popSearch.toLowerCase());
      const matchRegion = popRegionFilter === 'all' || p.region === popRegionFilter;
      return matchSearch && matchRegion;
    });
  }, [pops, popSearch, popRegionFilter]);

  // Filtered Devices in Selected Pop
  const filteredDevices = useMemo(() => {
    if (!selectedPop?.devices) return [];
    return selectedPop.devices.filter((d) => {
      if (deviceCategoryFilter === 'all') return true;
      return d.category.toLowerCase().includes(deviceCategoryFilter.toLowerCase());
    });
  }, [selectedPop, deviceCategoryFilter]);

  // Filtered Work Orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (woStatusFilter === 'all') return true;
      return wo.status === woStatusFilter;
    });
  }, [workOrders, woStatusFilter]);

  // Distinct Regions
  const distinctRegions = useMemo(() => {
    const set = new Set<string>();
    pops.forEach((p) => {
      if (p.region) set.add(p.region);
    });
    return Array.from(set);
  }, [pops]);

  // Summary Metrics
  const totalDevicesCount = useMemo(() => {
    return pops.reduce((sum, p) => sum + (p.devicesCount || p.devices?.length || 0), 0);
  }, [pops]);

  const activeWorkOrdersCount = useMemo(() => {
    return workOrders.filter((w) => w.status !== 'completed' && w.status !== 'cancelled').length;
  }, [workOrders]);

  const waitingNocQcCount = useMemo(() => {
    return workOrders.filter((w) => w.status === 'waiting_noc_qc').length;
  }, [workOrders]);

  // Handlers
  const handleOpenDetail = (pop: NetworkPop) => {
    setSelectedPopId(pop.id);
    setPopDetailSubTab('perangkat');
    setMainTab('detail_pop');
  };

  const handleCreatePop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await authFetch('/pops', {
        method: 'POST',
        body: JSON.stringify(newPopForm),
      });
      setIsNewPopModalOpen(false);
      setNewPopForm({
        name: '',
        code: '',
        region: 'Sidoarjo Kota',
        cluster_code: 'SDA',
        address: '',
        pic_name: '',
        pic_phone: '',
        power_backup_info: 'Rectifier 48V + Baterai Lithium 100Ah',
        rack_capacity: '42U (Terpakai 12U)',
        notes: '',
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan POP baru.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const warehouseMaterialsParsed = newWoForm.warehouse_materials
        ? newWoForm.warehouse_materials.split('\n').filter(Boolean).map((line) => {
            const parts = line.split(',');
            return {
              itemName: parts[0]?.trim() || line.trim(),
              quantity: parseInt(parts[1]?.trim() || '1', 10),
              unit: parts[2]?.trim() || 'Unit',
            };
          })
        : [];

      await authFetch('/pop-work-orders', {
        method: 'POST',
        body: JSON.stringify({
          network_pop_id: newWoForm.network_pop_id,
          action_type: newWoForm.action_type,
          title: newWoForm.title,
          description: newWoForm.description,
          priority: newWoForm.priority,
          target_device_id: newWoForm.target_device_id || null,
          new_device_payload: {
            category: newWoForm.category,
            brand: newWoForm.brand,
            model: newWoForm.model,
            serialNumber: newWoForm.serial_number,
            macAddress: newWoForm.mac_address,
            ipManagement: newWoForm.ip_management,
            rackPosition: newWoForm.rack_position,
            powerSource: newWoForm.power_source,
          },
          materials_from_warehouse: warehouseMaterialsParsed,
          noc_instruction: {
            vlan: newWoForm.target_vlan,
            configurationGuide: newWoForm.noc_instruction_guide,
          },
        }),
      });

      setIsNewWoModalOpen(false);
      setMainTab('penugasan_pop');
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat instruksi penugasan POP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignTech = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWo) return;
    setSubmitting(true);
    try {
      await authFetch(`/pop-work-orders/${activeWo.id}/assign-tech`, {
        method: 'POST',
        body: JSON.stringify(assignForm),
      });
      setIsAssignModalOpen(false);
      setActiveWo(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menugaskan teknisi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWork = async (wo: PopWorkOrder) => {
    try {
      await authFetch(`/pop-work-orders/${wo.id}/start`, {
        method: 'POST',
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memulai pekerjaan.');
    }
  };

  const handleSubmitFieldReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWo) return;
    setSubmitting(true);
    try {
      await authFetch(`/pop-work-orders/${activeWo.id}/submit-field-report`, {
        method: 'POST',
        body: JSON.stringify({
          ...fieldReportForm,
          photos: ['storage/pop/pemasangan_rak_' + Date.now() + '.jpg'],
        }),
      });
      setIsFieldReportModalOpen(false);
      setActiveWo(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal submit laporan lapangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNocQcApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWo) return;
    setSubmitting(true);
    try {
      await authFetch(`/pop-work-orders/${activeWo.id}/noc-qc-approve`, {
        method: 'POST',
        body: JSON.stringify(nocQcForm),
      });
      setIsNocQcModalOpen(false);
      setActiveWo(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyetujui QC penugasan POP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPop) return;
    setSubmitting(true);
    try {
      if (editingDevice) {
        await authFetch(`/pops/${selectedPop.id}/devices/${editingDevice.id}`, {
          method: 'PUT',
          body: JSON.stringify(deviceForm),
        });
      } else {
        await authFetch(`/pops/${selectedPop.id}/devices`, {
          method: 'POST',
          body: JSON.stringify(deviceForm),
        });
      }
      setIsDeviceModalOpen(false);
      setEditingDevice(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perangkat POP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = async (device: PopDevice) => {
    if (!selectedPop) return;
    if (!window.confirm(`Hapus perangkat ${device.model} (${device.id}) dari ${selectedPop.name}?`)) return;
    try {
      await authFetch(`/pops/${selectedPop.id}/devices/${device.id}`, {
        method: 'DELETE',
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus perangkat.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                <Server className="h-3 w-3" /> Server Cabang & Network Hub
              </span>
              <span className="text-[11px] font-bold text-slate-400">Node Management Hub</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Inventory POP & Server Cabang
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Sistem inventaris server cabang, monitoring perangkat aktif/pasif (OLT, Switch Core, Router, Power/Rectifier), dan alur instruksi kerja POP yang menghubungkan <strong>NOC</strong>, <strong>Kepala Teknisi</strong>, <strong>Teknisi Lapangan</strong>, dan <strong>Gudang</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void loadAll()}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition shadow-2xs cursor-pointer"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewWoForm({
                  network_pop_id: selectedPopId || (pops[0]?.id ?? ''),
                  action_type: 'add_device',
                  title: '',
                  description: '',
                  priority: 'medium',
                  target_device_id: '',
                  category: 'OLT',
                  brand: '',
                  model: '',
                  serial_number: '',
                  mac_address: '',
                  ip_management: '',
                  rack_position: 'Rack 1 - Unit U10',
                  power_source: 'Rectifier 48V Port 1',
                  warehouse_materials: '',
                  noc_instruction_guide: '',
                  target_vlan: '',
                });
                setIsNewWoModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs cursor-pointer"
            >
              <PackagePlus className="h-4 w-4" />
              <span>+ Instruksi POP Baru (NOC)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewPopModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah POP Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total POP Cabang</span>
              <Server className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{pops.length} <span className="text-xs font-medium text-slate-500">Site</span></div>
            <span className="text-[10px] text-slate-500">Server cabang aktif di seluruh wilayah</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Perangkat Terpasang</span>
              <Cpu className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{totalDevicesCount} <span className="text-xs font-medium text-slate-500">Unit</span></div>
            <span className="text-[10px] text-slate-500">OLT, Switch, Router & Power Bank</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Penugasan Aktif</span>
              <Wrench className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{activeWorkOrdersCount} <span className="text-xs font-medium text-slate-500">WO</span></div>
            <span className="text-[10px] text-slate-500">Sedang diproses teknisi & lead tech</span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Menunggu QC NOC</span>
              <ShieldCheck className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">{waitingNocQcCount} <span className="text-xs font-medium text-slate-500">Antrean</span></div>
            <span className="text-[10px] text-slate-500">Siap di-crosscheck & masuk inventori</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setMainTab('daftar_pop')}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition cursor-pointer ${
            mainTab === 'daftar_pop'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Daftar Server Cabang (POP)</span>
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-700">
            {pops.length}
          </span>
        </button>

        {selectedPop && (
          <button
            type="button"
            onClick={() => setMainTab('detail_pop')}
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition cursor-pointer ${
              mainTab === 'detail_pop'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Detail & Inventori: {selectedPop.name}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setMainTab('penugasan_pop')}
          className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition cursor-pointer ${
            mainTab === 'penugasan_pop'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Penugasan & Mutasi Alat POP</span>
          {waitingNocQcCount > 0 && (
            <span className="ml-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white">
              {waitingNocQcCount} QC
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="rounded-[30px] border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Memuat data inventori POP & perangkat jaringan...
        </div>
      ) : (
        <>
          {/* TAB 1: DAFTAR POP */}
          {mainTab === 'daftar_pop' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={popSearch}
                    onChange={(e) => setPopSearch(e.target.value)}
                    placeholder="Cari nama POP, kode, alamat, atau cluster..."
                    className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 text-xs outline-none focus:border-emerald-400 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Wilayah:</span>
                  <select
                    value={popRegionFilter}
                    onChange={(e) => setPopRegionFilter(e.target.value)}
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-400"
                  >
                    <option value="all">Semua Wilayah</option>
                    {distinctRegions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* POP Grid Cards */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                {filteredPops.map((pop) => {
                  const popWos = workOrders.filter((w) => w.networkPopId === pop.id);
                  const activeWos = popWos.filter((w) => w.status !== 'completed' && w.status !== 'cancelled');

                  return (
                    <div
                      key={pop.id}
                      className="flex flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition duration-150"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                                {pop.code}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                                {pop.region}
                              </span>
                            </div>
                            <h3 className="mt-1 text-base font-black text-slate-900">{pop.name}</h3>
                            <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{pop.address}</span>
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              pop.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pop.status === 'maintenance'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {pop.status === 'active' ? '🟢 Aktif' : pop.status === 'maintenance' ? '🟠 Maintenance' : '⚪ Inaktif'}
                          </span>
                        </div>

                        {/* Capacity & Specs Box */}
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Kapasitas Rak</span>
                            <span className="font-semibold text-slate-800">{pop.rackCapacity || '24U'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Perangkat Terpasang</span>
                            <span className="font-black text-emerald-700">
                              {pop.devices?.length || pop.devicesCount || 0} Unit
                            </span>
                          </div>
                          <div className="col-span-2 border-t border-slate-200/60 pt-1.5 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Sistem Daya & Baterai</span>
                            <span className="text-[11px] font-medium text-slate-700 line-clamp-1">{pop.powerBackupInfo || '-'}</span>
                          </div>
                        </div>

                        {/* PIC info */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            PIC: <strong>{pop.picName || 'NOC Team'}</strong>
                          </span>
                          {activeWos.length > 0 && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              {activeWos.length} WO Aktif
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(pop)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Inventori Perangkat</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setNewWoForm((prev) => ({
                              ...prev,
                              network_pop_id: pop.id,
                              title: `Instalasi di ${pop.name}`,
                            }));
                            setIsNewWoModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition cursor-pointer"
                        >
                          <PackagePlus className="h-3.5 w-3.5" />
                          <span>+ Penugasan</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: DETAIL POP & INVENTORI */}
          {mainTab === 'detail_pop' && selectedPop && (
            <div className="space-y-5">
              {/* Top Navigation & Info Header */}
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setMainTab('daftar_pop')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Kembali ke Daftar POP</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDevice(null);
                        setDeviceForm({
                          category: 'OLT',
                          brand: '',
                          model: '',
                          serial_number: '',
                          mac_address: '',
                          ip_management: '',
                          rack_position: 'Rack 1 - Unit U',
                          power_source: 'Rectifier 48V',
                          status: 'active',
                          notes: '',
                        });
                        setIsDeviceModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Tambah Perangkat Manual</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewWoForm((prev) => ({
                          ...prev,
                          network_pop_id: selectedPop.id,
                          title: `Pekerjaan Perangkat di ${selectedPop.name}`,
                        }));
                        setIsNewWoModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                    >
                      <PackagePlus className="h-3.5 w-3.5" />
                      <span>+ Instruksi NOC (Alur Kerja)</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-800">
                        {selectedPop.code}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{selectedPop.region}</span>
                    </div>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">{selectedPop.name}</h2>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedPop.address}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Kapasitas Rak</span>
                      <span className="font-bold text-slate-800">{selectedPop.rackCapacity || '24U'}</span>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">PIC Penanggung Jawab</span>
                      <span className="font-bold text-slate-800">{selectedPop.picName || 'NOC'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs */}
              <div className="flex gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setPopDetailSubTab('perangkat')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                    popDetailSubTab === 'perangkat'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Perangkat Terpasang ({selectedPop.devices?.length || 0})
                </button>

                <button
                  type="button"
                  onClick={() => setPopDetailSubTab('riwayat_wo')}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
                    popDetailSubTab === 'riwayat_wo'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Riwayat Penugasan & Mutasi
                </button>
              </div>

              {/* SUB-TAB 1: PERANGKAT TERPASANG */}
              {popDetailSubTab === 'perangkat' && (
                <div className="space-y-4">
                  {/* Category Filter Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['all', 'OLT', 'Switch Core', 'Switch Distribution', 'Router', 'Rectifier', 'Baterai', 'SFP'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDeviceCategoryFilter(cat)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                          deviceCategoryFilter === cat
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat === 'all' ? 'Semua Kategori' : cat}
                      </button>
                    ))}
                  </div>

                  {filteredDevices.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                      Belum ada perangkat terpasang di POP ini untuk kategori yang dipilih.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredDevices.map((device) => (
                        <div
                          key={device.id}
                          className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                                {device.category}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  device.status === 'active'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : device.status === 'backup'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {device.status}
                              </span>
                            </div>

                            <div>
                              <div className="text-[10px] font-bold uppercase text-slate-400">{device.brand}</div>
                              <h4 className="text-sm font-black text-slate-900">{device.model}</h4>
                            </div>

                            <div className="space-y-1 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                              {device.ipManagement && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">IP Mgmt:</span>
                                  <span className="font-mono font-bold text-slate-800">{device.ipManagement}</span>
                                </div>
                              )}
                              {device.serialNumber && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">SN:</span>
                                  <span className="font-mono text-slate-700">{device.serialNumber}</span>
                                </div>
                              )}
                              {device.macAddress && (
                                <div className="flex justify-between">
                                  <span className="text-slate-400">MAC:</span>
                                  <span className="font-mono text-slate-700">{device.macAddress}</span>
                                </div>
                              )}
                              <div className="flex justify-between border-t border-slate-200/50 pt-1 mt-1">
                                <span className="text-slate-400">Posisi Rak:</span>
                                <span className="font-semibold text-slate-800">{device.rackPosition || '-'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                            <span>Pasang: {device.installedBy || 'Teknisi'}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDevice(device);
                                  setDeviceForm({
                                    category: device.category,
                                    brand: device.brand,
                                    model: device.model,
                                    serial_number: device.serialNumber || '',
                                    mac_address: device.macAddress || '',
                                    ip_management: device.ipManagement || '',
                                    rack_position: device.rackPosition || '',
                                    power_source: device.powerSource || '',
                                    status: device.status as any,
                                    notes: device.notes || '',
                                  });
                                  setIsDeviceModalOpen(true);
                                }}
                                className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteDevice(device)}
                                className="rounded p-1 text-rose-400 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: RIWAYAT WO POP */}
              {popDetailSubTab === 'riwayat_wo' && (
                <div className="space-y-3">
                  {workOrders
                    .filter((w) => w.networkPopId === selectedPop.id)
                    .map((wo) => (
                      <div key={wo.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-800">{wo.id}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                            {wo.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900">{wo.title}</h4>
                        <p className="text-slate-600">{wo.description}</p>
                        <div className="text-[10px] text-slate-400">
                          Teknisi: {wo.assignedTechName || '-'} • Dibuat oleh: {wo.createdBy}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PENUGASAN & MUTASI ALAT POP */}
          {mainTab === 'penugasan_pop' && (
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Status:</span>
                  {[
                    { id: 'all', label: 'Semua Penugasan' },
                    { id: 'pending_lead_tech', label: 'Menunggu Lead Tech' },
                    { id: 'assigned_to_tech', label: 'Ditugaskan' },
                    { id: 'in_progress', label: 'Sedang Dikerjakan' },
                    { id: 'waiting_noc_qc', label: 'Menunggu QC NOC' },
                    { id: 'completed', label: 'Selesai' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setWoStatusFilter(st.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                        woStatusFilter === st.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewWoModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  <span>+ Buat Instruksi POP</span>
                </button>
              </div>

              {/* Work Order Cards List */}
              <div className="space-y-3">
                {filteredWorkOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
                    Tidak ada penugasan POP pada status ini.
                  </div>
                ) : (
                  filteredWorkOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-slate-900">{wo.id}</span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              {wo.popName || wo.networkPopId}
                            </span>
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${
                                wo.actionType === 'add_device'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : wo.actionType === 'replace_device'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {wo.actionType === 'add_device'
                                ? '➕ Tambah Alat'
                                : wo.actionType === 'replace_device'
                                ? '🔁 Ganti Alat'
                                : wo.actionType === 'modify_config'
                                ? '⚙️ Ubah Config'
                                : '➖ Cabut Alat'}
                            </span>
                          </div>
                          <h3 className="mt-1 text-base font-black text-slate-950">{wo.title}</h3>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              wo.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : wo.status === 'waiting_noc_qc'
                                ? 'bg-purple-100 text-purple-800'
                                : wo.status === 'in_progress'
                                ? 'bg-sky-100 text-sky-800'
                                : wo.status === 'assigned_to_tech'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {wo.status === 'completed'
                              ? '🟢 QC Selesai (Masuk Inventori)'
                              : wo.status === 'waiting_noc_qc'
                              ? '🟣 Menunggu QC NOC'
                              : wo.status === 'in_progress'
                              ? '🔵 Sedang Dikerjakan On-Site'
                              : wo.status === 'assigned_to_tech'
                              ? '🔵 Ditugaskan ke Teknisi'
                              : '🟡 Menunggu Penunjukan Lead Tech'}
                          </span>
                          <span className="text-[10px] text-slate-400">Dibuat oleh: {wo.createdBy}</span>
                        </div>
                      </div>

                      {/* Description & Details */}
                      <p className="text-xs text-slate-700 leading-relaxed">{wo.description}</p>

                      <div className="grid gap-3 sm:grid-cols-3 text-xs">
                        {/* Device Target/New */}
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Detail Perangkat</span>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            {wo.newDevicePayload?.brand} {wo.newDevicePayload?.model || 'Device Baru'}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Kategori: {wo.newDevicePayload?.category} • Rak: {wo.newDevicePayload?.rackPosition}
                          </span>
                        </div>

                        {/* Dispatch & Technician */}
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Teknisi Lapangan</span>
                          <span className="font-bold text-slate-900 block mt-0.5">
                            {wo.assignedTechName || 'Belum ditunjuk'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Jadwal: {wo.scheduledDate || 'Belum dijadwalkan'}
                          </span>
                        </div>

                        {/* NOC QC Sign-off Result */}
                        <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Verifikasi QC NOC</span>
                          {wo.nocQcResult ? (
                            <span className="text-emerald-700 font-bold block mt-0.5">
                              ✅ Disetujui ({wo.nocQcResult.verifiedBy})
                            </span>
                          ) : (
                            <span className="text-slate-500 block mt-0.5">Menunggu pengerjaan & QC</span>
                          )}
                          <span className="text-[10px] text-slate-500 truncate block">
                            {wo.nocQcResult?.qcNotes || 'Belum ada catatan QC'}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons Container */}
                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        {/* Lead Tech Assign Button */}
                        {wo.status === 'pending_lead_tech' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWo(wo);
                              setAssignForm({
                                assigned_tech_id: techUsers[0]?.id || '',
                                scheduled_date: new Date().toISOString().slice(0, 10) + ' 10:00',
                              });
                              setIsAssignModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                          >
                            <UserPlus className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Tunjuk Teknisi Lapangan</span>
                          </button>
                        )}

                        {/* Field Tech Start Button */}
                        {wo.status === 'assigned_to_tech' && (
                          <button
                            type="button"
                            onClick={() => void handleStartWork(wo)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition cursor-pointer"
                          >
                            <Wrench className="h-3.5 w-3.5" />
                            <span>Mulai Pengerjaan On-Site</span>
                          </button>
                        )}

                        {/* Field Tech Submit Report Button */}
                        {(wo.status === 'in_progress' || wo.status === 'rejected_by_noc') && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWo(wo);
                              setFieldReportForm({
                                rack_unit: wo.newDevicePayload?.rackPosition || 'Rack 1 Unit U12',
                                serial_number: wo.newDevicePayload?.serialNumber || '',
                                mac_address: wo.newDevicePayload?.macAddress || '',
                                ip_address: wo.newDevicePayload?.ipManagement || '',
                                test_result: 'Perangkat menyala normal, kabel tersambung rapi.',
                                technician_notes: 'Selesai dipasang di rak POP sesuai instruksi NOC.',
                              });
                              setIsFieldReportModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload Laporan On-Site & Kirim ke NOC</span>
                          </button>
                        )}

                        {/* NOC QC Approve Button */}
                        {wo.status === 'waiting_noc_qc' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWo(wo);
                              setNocQcForm({
                                ping_test_success: true,
                                snmp_active: true,
                                rx_tx_power_dbm: '+6.2 dBm',
                                qc_notes: 'Pengujian remote ping dan management IP berhasil. Perangkat siap beroperasi.',
                              });
                              setIsNocQcModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 transition cursor-pointer shadow-xs"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span>QC & Crosscheck Teknis (NOC)</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: TAMBAH POP BARU */}
      {isNewPopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Server className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Registrasi POP / Server Cabang Baru</h3>
              </div>
              <button type="button" onClick={() => setIsNewPopModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePop} className="p-6 space-y-3.5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nama POP / Shelter</label>
                  <input
                    type="text"
                    required
                    value={newPopForm.name}
                    onChange={(e) => setNewPopForm({ ...newPopForm, name: e.target.value })}
                    placeholder="Contoh: POP Sidoarjo Kota - Alun-Alun"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Kode POP</label>
                  <input
                    type="text"
                    required
                    value={newPopForm.code}
                    onChange={(e) => setNewPopForm({ ...newPopForm, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: SDA-01"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none uppercase font-mono font-bold focus:border-emerald-400 bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Wilayah / Cluster</label>
                  <input
                    type="text"
                    required
                    value={newPopForm.region}
                    onChange={(e) => setNewPopForm({ ...newPopForm, region: e.target.value })}
                    placeholder="Contoh: Sidoarjo Kota"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Kapasitas Rak</label>
                  <input
                    type="text"
                    value={newPopForm.rack_capacity}
                    onChange={(e) => setNewPopForm({ ...newPopForm, rack_capacity: e.target.value })}
                    placeholder="Contoh: 42U (Terpakai 12U)"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Alamat Lokasi POP</label>
                <textarea
                  rows={2}
                  required
                  value={newPopForm.address}
                  onChange={(e) => setNewPopForm({ ...newPopForm, address: e.target.value })}
                  placeholder="Alamat lengkap gedung, shelter, atau tiang transmisi..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Nama PIC</label>
                  <input
                    type="text"
                    value={newPopForm.pic_name}
                    onChange={(e) => setNewPopForm({ ...newPopForm, pic_name: e.target.value })}
                    placeholder="Nama penanggung jawab on-site"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">No. Telepon / HP PIC</label>
                  <input
                    type="text"
                    value={newPopForm.pic_phone}
                    onChange={(e) => setNewPopForm({ ...newPopForm, pic_phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Power Backup & Rectifier</label>
                <input
                  type="text"
                  value={newPopForm.power_backup_info}
                  onChange={(e) => setNewPopForm({ ...newPopForm, power_backup_info: e.target.value })}
                  placeholder="Contoh: Rectifier Delta 48V 50A + Baterai Shoto 100Ah"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewPopModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan POP Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT INSTRUKSI POP BARU (NOC) */}
      {isNewWoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <PackagePlus className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Instruksi Kerja & Penugasan POP (NOC)</h3>
                  <p className="text-[11px] text-slate-400">Penambahan, penggantian, konfigurasi, atau pencabutan alat</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsNewWoModalOpen(false)} className="rounded p-1 text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWo} className="p-6 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Target POP / Server Cabang</label>
                  <select
                    required
                    value={newWoForm.network_pop_id}
                    onChange={(e) => setNewWoForm({ ...newWoForm, network_pop_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="">Pilih POP Tujuan...</option>
                    {pops.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Tipe Aksi Pekerjaan</label>
                  <select
                    required
                    value={newWoForm.action_type}
                    onChange={(e) => setNewWoForm({ ...newWoForm, action_type: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="add_device">➕ Penambahan Alat Baru</option>
                    <option value="replace_device">🔁 Penggantian Alat (Swap/Maintenance)</option>
                    <option value="modify_config">⚙️ Perubahan Konfigurasi / Rak</option>
                    <option value="remove_device">➖ Pencabutan Alat (Dismantle)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Judul Instruksi Kerja</label>
                <input
                  type="text"
                  required
                  value={newWoForm.title}
                  onChange={(e) => setNewWoForm({ ...newWoForm, title: e.target.value })}
                  placeholder="Contoh: Instalasi OLT ZTE C320 Baru di Rack 1 POP Sidoarjo"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Deskripsi Detail & Alasan Teknis</label>
                <textarea
                  rows={2}
                  required
                  value={newWoForm.description}
                  onChange={(e) => setNewWoForm({ ...newWoForm, description: e.target.value })}
                  placeholder="Tuliskan tujuan penugasan, port yang dituju, dan instruksi teknis..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-400 bg-white"
                />
              </div>

              {/* Device Detail Payload */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">
                  Spesifikasi Perangkat yang Diminta NOC:
                </span>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Kategori</label>
                    <select
                      value={newWoForm.category}
                      onChange={(e) => setNewWoForm({ ...newWoForm, category: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                    >
                      <option value="OLT">OLT</option>
                      <option value="Switch Core">Switch Core</option>
                      <option value="Switch Distribution">Switch Distribution</option>
                      <option value="Router / BRAS">Router / BRAS</option>
                      <option value="Rectifier">Rectifier</option>
                      <option value="Baterai Bank">Baterai Bank</option>
                      <option value="UPS">UPS</option>
                      <option value="SFP Module">SFP Module</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Brand</label>
                    <input
                      type="text"
                      placeholder="ZTE / MikroTik / Huawei"
                      value={newWoForm.brand}
                      onChange={(e) => setNewWoForm({ ...newWoForm, brand: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Model / Tipe</label>
                    <input
                      type="text"
                      placeholder="ZTE C320 / CCR1036"
                      value={newWoForm.model}
                      onChange={(e) => setNewWoForm({ ...newWoForm, model: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target IP Management</label>
                    <input
                      type="text"
                      placeholder="10.10.1.10"
                      value={newWoForm.ip_management}
                      onChange={(e) => setNewWoForm({ ...newWoForm, ip_management: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Posisi Rak</label>
                    <input
                      type="text"
                      placeholder="Rack 1 - Unit U18-U20"
                      value={newWoForm.rack_position}
                      onChange={(e) => setNewWoForm({ ...newWoForm, rack_position: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Warehouse Materials */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Material yang Perlu Disiapkan Gudang (Opsional, pisahkan koma: Nama, Qty, Unit per baris):
                </label>
                <textarea
                  rows={2}
                  value={newWoForm.warehouse_materials}
                  onChange={(e) => setNewWoForm({ ...newWoForm, warehouse_materials: e.target.value })}
                  placeholder="Contoh:&#10;SFP GPON OLT C++, 2, Pcs&#10;Patchcord SC-UPC 3M, 4, Pcs"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono outline-none focus:border-emerald-400 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewWoModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Instruksi ke Kepala Teknisi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH / ASSIGN TEKNISI (KEPALA TEKNISI) */}
      {isAssignModalOpen && activeWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Tunjuk Teknisi Lapangan</h3>
              </div>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignTech} className="p-5 space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="font-bold text-slate-900 block">{activeWo.title}</span>
                <span className="text-[11px] text-slate-500 font-mono">Target: {activeWo.popName}</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Pilih Teknisi Lapangan</label>
                <select
                  required
                  value={assignForm.assigned_tech_id}
                  onChange={(e) => setAssignForm({ ...assignForm, assigned_tech_id: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold outline-none bg-white"
                >
                  <option value="">Pilih Teknisi...</option>
                  {techUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Jadwal Pengerjaan On-Site</label>
                <input
                  type="text"
                  required
                  value={assignForm.scheduled_date}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduled_date: e.target.value })}
                  placeholder="YYYY-MM-DD HH:mm (contoh: 2026-08-28 10:00)"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
                >
                  {submitting ? 'Menugaskan...' : 'Konfirmasi Penugasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAPORAN ON-SITE TEKNISI LAPANGAN */}
      {isFieldReportModalOpen && activeWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden my-6">
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Laporan Instalasi & Pemasangan On-Site</h3>
              </div>
              <button type="button" onClick={() => setIsFieldReportModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitFieldReport} className="p-6 space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <span className="font-bold text-slate-900 block">{activeWo.title}</span>
                <span className="text-[11px] text-slate-500 font-mono">POP: {activeWo.popName}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Posisi Rak Terpasang</label>
                  <input
                    type="text"
                    required
                    value={fieldReportForm.rack_unit}
                    onChange={(e) => setFieldReportForm({ ...fieldReportForm, rack_unit: e.target.value })}
                    placeholder="Contoh: Rack 1 - Unit U18-U20"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Serial Number Terpasang</label>
                  <input
                    type="text"
                    value={fieldReportForm.serial_number}
                    onChange={(e) => setFieldReportForm({ ...fieldReportForm, serial_number: e.target.value })}
                    placeholder="Scan / Ketik SN fisik perangkat"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">MAC Address Perangkat</label>
                  <input
                    type="text"
                    value={fieldReportForm.mac_address}
                    onChange={(e) => setFieldReportForm({ ...fieldReportForm, mac_address: e.target.value.toUpperCase() })}
                    placeholder="00:1A:C2:7B:44:01"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">IP Address Terkonfigurasi</label>
                  <input
                    type="text"
                    value={fieldReportForm.ip_address}
                    onChange={(e) => setFieldReportForm({ ...fieldReportForm, ip_address: e.target.value })}
                    placeholder="10.10.1.10"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Hasil Uji Awal di Lokasi</label>
                <input
                  type="text"
                  required
                  value={fieldReportForm.test_result}
                  onChange={(e) => setFieldReportForm({ ...fieldReportForm, test_result: e.target.value })}
                  placeholder="Contoh: Lampu indikator hijau, laser optik aktif, tegangan DC normal"
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">Catatan Teknisi Lapangan</label>
                <textarea
                  rows={2}
                  value={fieldReportForm.technician_notes}
                  onChange={(e) => setFieldReportForm({ ...fieldReportForm, technician_notes: e.target.value })}
                  placeholder="Catatan kabeling, nomor rak, kondisi kebersihan POP..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                />
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px] text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Foto bukti fisik instalasi rak otomatis terlampir dan akan dikirim ke antrean QC NOC.</span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFieldReportModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Laporan ke QC NOC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QC & CROSSCHECK TEKNIS NOC */}
      {isNocQcModalOpen && activeWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden my-6">
            <div className="border-b border-slate-100 bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">QC & Crosscheck Teknis POP (NOC)</h3>
                  <p className="text-[11px] text-slate-400">Verifikasi akhir agar perangkat otomatis tercatat di inventori POP</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsNocQcModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleNocQcApprove} className="p-6 space-y-4 text-xs">
              {/* Report Summary Box */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-900">{activeWo.title}</span>
                  <span className="font-mono text-[10px] text-slate-500">{activeWo.popName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">Posisi Rak:</span>
                    <span className="font-bold text-slate-800">{activeWo.fieldReport?.rackUnit || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Serial Number:</span>
                    <span className="font-mono font-bold text-slate-800">{activeWo.fieldReport?.serialNumber || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">MAC Address:</span>
                    <span className="font-mono text-slate-800">{activeWo.fieldReport?.macAddress || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">IP Management:</span>
                    <span className="font-mono text-slate-800">{activeWo.fieldReport?.ipAddress || '-'}</span>
                  </div>
                </div>
              </div>

              {/* NOC Checklist */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 block">Checklist Verifikasi Teknis NOC:</span>

                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={nocQcForm.ping_test_success}
                      onChange={(e) => setNocQcForm({ ...nocQcForm, ping_test_success: e.target.checked })}
                      className="h-4 w-4 rounded text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">Ping & Remote IP Berhasil</span>
                      <span className="text-[10px] text-slate-400">Device merespon ICMP / SSH / Web</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={nocQcForm.snmp_active}
                      onChange={(e) => setNocQcForm({ ...nocQcForm, snmp_active: e.target.checked })}
                      className="h-4 w-4 rounded text-emerald-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block">SNMP & Monitoring Aktif</span>
                      <span className="text-[10px] text-slate-400">Terdaftar di NMS / Cacti / Zabbix</span>
                    </div>
                  </label>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Redaman Optik / Tx-Rx Power (dBm)</label>
                  <input
                    type="text"
                    value={nocQcForm.rx_tx_power_dbm}
                    onChange={(e) => setNocQcForm({ ...nocQcForm, rx_tx_power_dbm: e.target.value })}
                    placeholder="Contoh: +6.2 dBm"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Catatan Verifikasi QC NOC</label>
                  <textarea
                    rows={2}
                    value={nocQcForm.qc_notes}
                    onChange={(e) => setNocQcForm({ ...nocQcForm, qc_notes: e.target.value })}
                    placeholder="Keterangan hasil pengujian remote, VLAN, dan sign-off..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Auto Inventory Notice */}
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-[11px] text-purple-950 flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
                <span>
                  Setelah disetujui, perangkat akan <strong>secara otomatis dimasukkan dan terdaftar di Inventori POP {activeWo.popName}</strong>.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNocQcModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 cursor-pointer disabled:opacity-60 shadow-xs"
                >
                  {submitting ? 'Memproses QC...' : 'Approve & Masukkan ke Inventori POP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL EDIT / ADD POP DEVICE */}
      {isDeviceModalOpen && selectedPop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold">
                  {editingDevice ? 'Edit Perangkat POP' : 'Tambah Perangkat Manual'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsDeviceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-5 space-y-3.5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Kategori</label>
                  <select
                    value={deviceForm.category}
                    onChange={(e) => setDeviceForm({ ...deviceForm, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  >
                    <option value="OLT">OLT</option>
                    <option value="Switch Core">Switch Core</option>
                    <option value="Switch Distribution">Switch Distribution</option>
                    <option value="Router / BRAS">Router / BRAS</option>
                    <option value="Rectifier">Rectifier</option>
                    <option value="Baterai Bank">Baterai Bank</option>
                    <option value="UPS">UPS</option>
                    <option value="SFP Module">SFP Module</option>
                    <option value="Server">Server</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Status</label>
                  <select
                    value={deviceForm.status}
                    onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  >
                    <option value="active">🟢 Aktif</option>
                    <option value="backup">🔵 Backup / Standby</option>
                    <option value="maintenance">🟠 Maintenance</option>
                    <option value="faulty">🔴 Rusak</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Brand</label>
                  <input
                    type="text"
                    required
                    value={deviceForm.brand}
                    onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })}
                    placeholder="Contoh: ZTE / Huawei"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Model</label>
                  <input
                    type="text"
                    required
                    value={deviceForm.model}
                    onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })}
                    placeholder="Contoh: ZXA10 C320"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Serial Number</label>
                  <input
                    type="text"
                    value={deviceForm.serial_number}
                    onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })}
                    placeholder="SN Perangkat"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">IP Management</label>
                  <input
                    type="text"
                    value={deviceForm.ip_management}
                    onChange={(e) => setDeviceForm({ ...deviceForm, ip_management: e.target.value })}
                    placeholder="10.10.1.10"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Posisi Rak</label>
                  <input
                    type="text"
                    value={deviceForm.rack_position}
                    onChange={(e) => setDeviceForm({ ...deviceForm, rack_position: e.target.value })}
                    placeholder="Rack 1 - Unit U18"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Sumber Daya</label>
                  <input
                    type="text"
                    value={deviceForm.power_source}
                    onChange={(e) => setDeviceForm({ ...deviceForm, power_source: e.target.value })}
                    placeholder="Rectifier 48V"
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perangkat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

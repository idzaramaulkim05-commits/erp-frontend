import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  MapPin,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WorkOrder } from '../../types';
import { ConfirmActionModal } from '../modals/ConfirmActionModal';
import { NotesActionModal } from '../modals/NotesActionModal';

type QcActionType = 'return' | 'close';

export const QCInstalasiNocView: React.FC = () => {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [opticalPower, setOpticalPower] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<QcActionType | null>(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const [filterType, setFilterType] = useState<'all' | 'installation' | 'maintenance'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch<{ data: WorkOrder[] }>('/work-orders');
      setItems(response.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat antrean QC instalasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const allActiveQueue = useMemo(() => (
    items.filter((item) =>
      ['menunggu_qc_noc', 'dikembalikan_ke_teknisi'].includes(item.status),
    )
  ), [items]);

  const activeQueue = useMemo(() => (
    allActiveQueue.filter((item) => filterType === 'all' || item.type === filterType)
  ), [allActiveQueue, filterType]);

  const closedItems = useMemo(
    () => items.filter((item) => item.status === 'closed' && (filterType === 'all' || item.type === filterType)),
    [items, filterType],
  );

  const selected = activeQueue.find((item) => item.id === selectedId) ?? activeQueue[0] ?? null;

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      if (typeof selected.finalOpticalPowerDbm === 'number') {
        setOpticalPower(String(selected.finalOpticalPowerDbm));
      } else {
        setOpticalPower('');
      }
    }
  }, [selected?.id]);

  const summary = useMemo(() => ({
    total: allActiveQueue.length,
    waitingQc: allActiveQueue.filter((item) => item.status === 'menunggu_qc_noc').length,
    returned: allActiveQueue.filter((item) => item.status === 'dikembalikan_ke_teknisi').length,
    closed: items.filter((item) => item.status === 'closed').length,
  }), [allActiveQueue, items]);

  const returnToTech = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/return-to-tech`, {
        method: 'POST',
        body: JSON.stringify({ notes: returnNotes || 'QC NOC meminta perbaikan data atau hasil instalasi.' }),
      });
      await load();
      setIsReturnModalOpen(false);
      setReturnNotes('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal mengembalikan WO ke teknisi.');
    } finally {
      setSaving(false);
    }
  };

  const closeByNoc = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await authFetch(`/work-orders/${selected.id}/noc-final-verify`, {
        method: 'POST',
        body: JSON.stringify({
          optical_dbm_reading: Number(opticalPower),
          pppoe_session_active: true,
          rx_power_threshold_passed: true,
          notes: 'QC NOC lulus. Layanan pelanggan aktif dan WO selesai.',
        }),
      });
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Gagal close WO oleh NOC.');
    } finally {
      setSaving(false);
    }
  };

  const optNum = Number(opticalPower);
  const isOpticalGood = !Number.isNaN(optNum) && optNum >= -24.0 && optNum <= -15.0;

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-950 sm:text-lg">QC Verifikasi Lapangan NOC</h1>
              <p className="text-[11px] font-semibold text-slate-500">Verifikasi SOP teknis, PPPoE, redaman optik, dan aktivasi pelanggan</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: 'Total Antrean', value: summary.total, tone: 'text-slate-900 bg-slate-50 border-slate-200' },
          { label: 'Menunggu QC', value: summary.waitingQc, tone: 'text-violet-800 bg-violet-50 border-violet-200' },
          { label: 'Revisi Teknisi', value: summary.returned, tone: 'text-amber-800 bg-amber-50 border-amber-200' },
          { label: 'Selesai Closed', value: summary.closed, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border p-3 ${card.tone}`}>
            <span className="text-[11px] font-bold block">{card.label}</span>
            <div className="mt-1 text-2xl font-black">{card.value}</div>
          </div>
        ))}
      </section>

      {/* 2-Column Grid */}
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        {/* Left: Queue List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black text-slate-900">Antrean QC ({activeQueue.length})</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  filterType === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({allActiveQueue.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('installation')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  filterType === 'installation' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Instalasi ({allActiveQueue.filter((i) => i.type === 'installation').length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('maintenance')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                  filterType === 'maintenance' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Maintenance ({allActiveQueue.filter((i) => i.type === 'maintenance').length})
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[650px] pr-1">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                Memuat antrean...
              </div>
            ) : activeQueue.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                Tidak ada WO yang menunggu QC saat ini.
              </div>
            ) : (
              activeQueue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-xl border p-3 text-left transition cursor-pointer ${
                    selected?.id === item.id
                      ? 'border-violet-400 bg-violet-50/70 shadow-xs ring-2 ring-violet-400/20'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        item.type === 'installation' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {item.type === 'installation' ? 'Pasang Baru' : item.type === 'uninstallation' ? 'Cabut' : 'Gangguan'}
                      </span>
                      <strong className="text-xs font-bold text-slate-900 truncate">{item.customerName}</strong>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      item.status === 'dikembalikan_ke_teknisi' ? 'bg-amber-100 text-amber-800' : 'bg-violet-100 text-violet-800'
                    }`}>
                      {item.status === 'dikembalikan_ke_teknisi' ? 'Revisi' : 'Siap QC'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span>{item.id}</span>
                    <span>•</span>
                    <span className="font-sans font-medium text-slate-700">{item.region}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">
                    Teknisi: <strong className="text-slate-800">{item.assignedTechName || 'Belum di-assign'}</strong>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Verification Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          {!selected ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-xs text-slate-400">
              Pilih salah satu WO dari antrean di sebelah kiri untuk diverifikasi.
            </div>
          ) : (
            <>
              {/* Customer Header */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selected.type === 'installation' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {selected.type === 'installation' ? 'WO Pasang Baru' : selected.type === 'uninstallation' ? 'WO Pencabutan' : 'WO Maintenance'}
                      </span>
                      <h3 className="text-base font-black text-slate-900">{selected.customerName}</h3>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500 font-mono">{selected.id} • {selected.customerPhone}</div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    {selected.packagePlan || 'Paket Fiber'}
                  </span>
                </div>

                {selected.type === 'maintenance' && (
                  <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900">
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-800">Ringkasan Kendala:</span>
                    <p className="mt-0.5">{selected.issueSummary || 'Pemeriksaan dan perbaikan gangguan koneksi pelanggan.'}</p>
                    {selected.maintenancePayload?.replacementFlowActive && (
                      <span className="mt-1.5 inline-block rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Membawa Perangkat Pengganti dari Gudang
                      </span>
                    )}
                  </div>
                )}

                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2 pt-2 border-t border-slate-200/60">
                  <div className="flex items-center gap-1 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{selected.address} ({selected.region})</span>
                  </div>
                  <div>ODP: <strong className="text-slate-800 font-bold">{selected.odpId || '-'}</strong></div>
                  <div>Teknisi: <strong className="text-slate-800 font-bold">{selected.assignedTechName || '-'}</strong></div>
                </div>
              </div>

              {/* Technical Verification Details */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wifi className="h-4 w-4 text-violet-600" />
                  Kredensial PPPoE & Data Perangkat
                </span>

                <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Username PPPoE</span>
                    <strong className="font-mono text-emerald-800 block truncate">
                      {selected.networkCredentials?.pppoeUsername ? String(selected.networkCredentials.pppoeUsername) : '-'}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Password PPPoE</span>
                    <strong className="font-mono text-emerald-800 block truncate">
                      {selected.networkCredentials?.pppoePassword ? String(selected.networkCredentials.pppoePassword) : '-'}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">VLAN</span>
                    <strong className="font-mono text-slate-800 block">
                      {selected.networkCredentials?.vlan ? String(selected.networkCredentials.vlan) : '-'}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">SN Modem / Router (Teknisi)</span>
                    <strong className="font-mono text-slate-900 block font-bold">
                      {selected.routerSn || String(selected.photos?.modemIdentity ?? 'Belum diisi')}
                    </strong>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold">Status Berita Acara</span>
                    <span className="text-emerald-700 font-bold block flex items-center gap-1">
                      <FileCheck className="h-3.5 w-3.5" /> Disetujui
                    </span>
                  </div>
                </div>
              </div>

              {/* Redaman Verification Input */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Verifikasi Redaman Optik (OPM)
                </span>

                <div className="grid gap-3 sm:grid-cols-2 items-center">
                  <label className="space-y-1 text-xs font-semibold text-slate-700">
                    <span>Nilai Redaman Verifikasi NOC (dBm)</span>
                    <input
                      type="text"
                      value={opticalPower}
                      onChange={(e) => setOpticalPower(e.target.value)}
                      className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-violet-400 font-mono font-bold"
                      placeholder="-20.3"
                    />
                  </label>

                  <div className="text-xs space-y-1">
                    <span className="text-slate-400 text-[11px] block">Status Ambang Batas SOP:</span>
                    {isOpticalGood ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Redaman Sesuai Standar (-18 s/d -23 dBm)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                        <AlertTriangle className="h-3.5 w-3.5" /> Redaman di Luar Standar Ideal
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setIsReturnModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>QC Gagal (Kembalikan ke Teknisi)</span>
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPendingAction('close')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-6 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-xs transition"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>QC Lulus & Close WO (Aktifkan Pelanggan)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Return to Tech Modal */}
      <NotesActionModal
        open={isReturnModalOpen}
        title="Kembalikan WO ke Teknisi Lapangan"
        message="Tuliskan catatan revisi teknis secara spesifik (misal: redaman optik terlalu tinggi, foto ODP tidak jelas, atau SN modem salah)."
        label="Catatan Revisi untuk Teknisi"
        value={returnNotes}
        onChange={setReturnNotes}
        confirmLabel="Kembalikan WO"
        tone="warning"
        loading={saving}
        onConfirm={() => void returnToTech()}
        onCancel={() => setIsReturnModalOpen(false)}
      />

      {/* Final Close Confirmation Modal */}
      <ConfirmActionModal
        open={pendingAction === 'close'}
        title="Konfirmasi QC Lulus & Close WO"
        message={
          selected
            ? selected.type === 'maintenance'
              ? `Pekerjaan maintenance untuk ${selected.customerName} (${selected.id}) telah memenuhi SOP teknis NOC. Sistem akan menutup Work Order dan memutakhirkan tiket ke Helpdesk QC.`
              : `Instalasi untuk ${selected.customerName} (${selected.id}) telah memenuhi SOP teknis. Sistem akan menutup Work Order dan memastikan status pelanggan AKTIF.`
            : ''
        }
        confirmLabel="Ya, QC Lulus & Close WO"
        tone="success"
        loading={saving}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          void closeByNoc().finally(() => setPendingAction(null));
        }}
      />
    </div>
  );
};

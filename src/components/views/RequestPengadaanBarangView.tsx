import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileSpreadsheet,
  Info,
  Layers,
  Package,
  PackageCheck,
  PackagePlus,
  Receipt,
  RotateCcw,
  Sparkles,
  Warehouse,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { InventoryItem, ProcurementRequest } from '../../types';
import { WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

const SPECIAL_ITEM_VALUE = '__custom__';

const deriveItemCode = (name: string) => (
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'CUSTOM-ITEM'
);

const QUICK_REASON_PRESETS = [
  'Stok barang di gudang sudah menyentuh batas kritis dan perlu restock segera untuk operasional pasang baru.',
  'Kebutuhan instalasi pelanggan baru meningkat di wilayah operasional.',
  'Penggantian material lapangan yang rusak dan penambahan cadangan teknisi.',
  'Kebutuhan proyek perluasan jaringan dan pemasangan jalur distribusi ODP baru.',
];

export const RequestPengadaanBarangView: React.FC = () => {
  const navigate = useNavigate();
  const {
    inventory,
    procurementRequests,
    createProcurementRequest,
    triggerCelebration,
  } = useIOMS();

  const [selectedItemValue, setSelectedItemValue] = useState<string>('');
  const [itemCode, setItemCode] = useState<string>('');
  const [itemName, setItemName] = useState<string>('Modem ONT GPON ZTE F609 (Dual Band)');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState<string>('Unit');
  const [unitPrice, setUnitPrice] = useState<number>(240000);
  const [reason, setReason] = useState<string>(
    'Stok barang di gudang sudah menyentuh batas kritis dan perlu restock segera untuk operasional pasang baru.',
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Critical stock items
  const criticalItems = useMemo(
    () => inventory.filter((item) => item.stockAvailable <= item.minThreshold),
    [inventory],
  );

  // Recent procurement requests
  const recentRequests = useMemo(
    () => [...procurementRequests].slice(0, 5),
    [procurementRequests],
  );

  // Initialize form with first critical item or first inventory item
  useEffect(() => {
    if (selectedItemValue) return;

    const initialItem = criticalItems[0] || inventory[0];
    if (initialItem) {
      applySelectedItem(initialItem);
    } else {
      setSelectedItemValue(SPECIAL_ITEM_VALUE);
      setItemCode('CUSTOM-ITEM');
      setItemName('Material Lainnya / Khusus');
      setUnit('Unit');
      setUnitPrice(100000);
    }
  }, [inventory, criticalItems]);

  const applySelectedItem = (item: InventoryItem) => {
    setSelectedItemValue(item.code);
    setItemCode(item.code);
    setItemName(item.name);
    setUnit(item.unit);
    setUnitPrice(item.unitPrice);
    setQuantity(Math.max(item.minThreshold * 2, 20));
  };

  const handleCatalogChange = (value: string) => {
    setSelectedItemValue(value);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (value === SPECIAL_ITEM_VALUE) {
      setItemCode('');
      setItemName('Material Lainnya / Khusus');
      setUnitPrice(0);
      setUnit('Unit');
      return;
    }

    const matched = inventory.find((item) => item.code === value);
    if (matched) {
      applySelectedItem(matched);
    }
  };

  const selectedInventoryItem = useMemo(
    () => inventory.find((i) => i.code === selectedItemValue),
    [inventory, selectedItemValue],
  );

  const totalAmount = (quantity || 0) * (unitPrice || 0);
  const isHighValue = totalAmount > 5000000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const finalCode = (itemCode.trim() || deriveItemCode(itemName)).toUpperCase();
      const payload = {
        itemCode: finalCode,
        itemName: itemName.trim(),
        quantity: Number(quantity),
        unit: unit.trim() || 'Unit',
        unitPrice: Number(unitPrice),
        totalAmount,
        reason: reason.trim(),
      };

      await createProcurementRequest(payload);
      triggerCelebration();
      setSuccessMessage(
        `Permintaan pengadaan "${itemName}" (${quantity} ${unit}) senilai Rp ${totalAmount.toLocaleString('id-ID')} berhasil diajukan dan diteruskan ke Finance!`,
      );

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Gagal mengirim permintaan pengadaan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    const fallback = criticalItems[0] || inventory[0];
    if (fallback) {
      applySelectedItem(fallback);
    }
    setReason('Stok barang di gudang sudah menyentuh batas kritis dan perlu restock segera untuk operasional pasang baru.');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              <PackagePlus className="h-4 w-4" />
              <span>Modul Permintaan Barang</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Pengajuan Pengadaan Barang & Material
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Formulir pengajuan resmi untuk pengadaan dan restock barang gudang, modem, kabel drop, dan material operasional ke Finance & Manajemen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/app/inventory')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 shadow-xs"
            >
              <Warehouse className="h-4 w-4 text-emerald-300" />
              <span>Warehouse Console</span>
            </button>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-5 rounded-[24px] border border-emerald-200 bg-emerald-50 text-emerald-950 flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <strong className="block text-sm font-bold text-emerald-900">Pengajuan Berhasil Dikirim!</strong>
              <p>{successMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/inventory')}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
          >
            <span>Pantau di Gudang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-5 rounded-[24px] border border-rose-200 bg-rose-50 text-rose-950 flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Terjadi Kesalahan:</strong>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Grid: Form Left, Monitoring Sidebar Right */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.25fr,0.85fr]">
        {/* Form Container */}
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 sm:p-7 shadow-[0_14px_36px_rgba(15,23,42,0.06)] space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900">Rincian Permintaan Barang</h2>
              <p className="text-xs text-slate-500 mt-1">Lengkapi data barang, kuantitas, harga acuan, dan justifikasi kebutuhan.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* Step 1: Pilih Barang */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-sm">
                  1. Pilih Barang dari Master Katalog Inventaris:
                </label>
                <select
                  value={selectedItemValue}
                  onChange={(e) => handleCatalogChange(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden transition"
                >
                  <optgroup label="Item Inventaris Gudang">
                    {inventory.map((item) => {
                      const isLow = item.stockAvailable <= item.minThreshold;
                      return (
                        <option key={item.id} value={item.code}>
                          {item.name} [{item.code}] — Stok Ready: {item.stockAvailable} {item.unit} {isLow ? '⚠️ (STOK KRITIS)' : ''}
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Khusus / Non-Katalog">
                    <option value={SPECIAL_ITEM_VALUE}>+ Material / Perangkat Lainnya (Input Manual)</option>
                  </optgroup>
                </select>

                {/* Selected Item Snapshot Preview */}
                {selectedInventoryItem && (
                  <div className="mt-3 rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50/70 via-slate-50 to-white p-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/50 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 bg-emerald-100 px-2 py-0.5 rounded-md text-[11px]">
                          {selectedInventoryItem.code}
                        </span>
                        <span className="font-bold text-slate-900">{selectedInventoryItem.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          selectedInventoryItem.stockAvailable <= selectedInventoryItem.minThreshold
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {selectedInventoryItem.stockAvailable <= selectedInventoryItem.minThreshold
                          ? `Stok Kritis (<= ${selectedInventoryItem.minThreshold})`
                          : 'Stok Aman'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Kategori</span>
                        <span className="font-semibold text-slate-800">{selectedInventoryItem.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Brand / Merk</span>
                        <span className="font-semibold text-slate-800">{selectedInventoryItem.brand}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lokasi Rak</span>
                        <span className="font-semibold text-slate-800">{selectedInventoryItem.locationRack}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Harga Acuan Terakhir</span>
                        <span className="font-mono font-bold text-emerald-700">
                          Rp {selectedInventoryItem.unitPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Custom Item Code and Name if custom */}
              {selectedItemValue === SPECIAL_ITEM_VALUE && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 animate-in fade-in duration-200">
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Kode Barang (Opsional):</label>
                    <input
                      type="text"
                      value={itemCode}
                      onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: OTB-24-CORE"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-mono text-xs text-slate-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-900 mb-1">Nama Barang / Material *:</label>
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                      placeholder="Nama lengkap barang pengadaan..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Kuantitas & Harga */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-sm">
                  2. Kuantitas & Estimasi Harga Satuan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block font-semibold text-slate-700 mb-1">Jumlah (Qty) *</span>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="block font-semibold text-slate-700 mb-1">Satuan *</span>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                      placeholder="Unit, Pcs, Roll, Meter, Box"
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="block font-semibold text-slate-700 mb-1">Estimasi Harga Satuan (Rp) *</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-mono text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Total Budget Display & Approval Tier Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                    Total Estimasi Anggaran Pengadaan:
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800">
                    Rp {totalAmount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {quantity} {unit} × Rp {unitPrice.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="shrink-0">
                  <div
                    className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-bold ${
                      isHighValue
                        ? 'border-purple-300 bg-purple-100 text-purple-900'
                        : 'border-emerald-300 bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    <Info className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-[11px] font-black uppercase">
                        {isHighValue ? 'Level Approval: Direktur / Manajemen' : 'Level Approval: Finance Desk'}
                      </div>
                      <div className="text-[10px] font-normal opacity-90">
                        {isHighValue ? 'Nominal > Rp 5 Juta (Wajib ACC Manajemen)' : 'Nominal <= Rp 5 Juta (Cukup ACC Finance)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4: Alasan & Justifikasi Kebutuhan */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-sm">
                  3. Justifikasi & Alasan Kebutuhan Pengadaan:
                </label>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {QUICK_REASON_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReason(preset)}
                      className="rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 transition"
                    >
                      Template #{idx + 1}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Jelaskan kebutuhan pengadaan ini secara rinci..."
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 p-3.5 text-xs text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Form</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || !itemName.trim() || quantity <= 0}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Permintaan Pengadaan ke Finance'}
                  </span>
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Sidebar: Critical Stock Items & Workflow SOP */}
        <div className="space-y-6">
          {/* Critical Stock Card */}
          <section className="rounded-[30px] border border-rose-200 bg-linear-to-b from-rose-50/70 via-white to-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-rose-100 text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-rose-950">Stok Kritis Gudang</h3>
              </div>
              <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-[10px] font-black text-rose-800">
                {criticalItems.length} Item Kritis
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Item-item berikut sudah mencapai ambang batas minimum dan sangat disarankan untuk segera diajukan pengadaannya:
            </p>

            {criticalItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                Semua stok barang gudang saat ini dalam kondisi aman.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {criticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-rose-100 bg-white p-3 shadow-2xs hover:border-emerald-300 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>{item.code}</span>
                        <span>•</span>
                        <span className="text-rose-700 font-bold">
                          Sisa: {item.stockAvailable} {item.unit} (Min: {item.minThreshold})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => applySelectedItem(item)}
                      className="shrink-0 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 text-[11px] font-bold transition"
                    >
                      Pilih Item
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Workflow Guide */}
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-700">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Alur Standar Pengadaan Barang</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[10px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">Pengajuan / Request</strong>
                  <span className="text-slate-500">Gudang / divisi mengisi form permintaan barang & material.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-black text-[10px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">Review & ACC Finance / Manajemen</strong>
                  <span className="text-slate-500">Finance memeriksa anggaran (atau Direktur jika &gt; 5 Juta).</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">Pembelian ke Vendor (Ordered)</strong>
                  <span className="text-slate-500">Kepala Warehouse memproses PO dan menandai item sedang dibeli.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-[10px] shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <strong className="block text-slate-900 font-semibold">Penerimaan & Masuk Stok (Goods Receipt)</strong>
                  <span className="text-slate-500">Barang sampai di gudang, di-QC, dan otomatis menambah stok fisik.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Procurement Requests */}
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Pengajuan Terakhir</h3>
              <button
                type="button"
                onClick={() => navigate('/app/inventory')}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {recentRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{req.itemName}</span>
                    <WorkspaceStatusPill label={req.status.toUpperCase()} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>{req.quantity} {req.unit}</span>
                    <span className="font-bold text-emerald-700">Rp {req.totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

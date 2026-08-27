import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Filter,
  Package,
  PackagePlus,
  Search,
  ShoppingCart,
  Warehouse,
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { InventoryItem } from '../../types';
import { WorkspaceSectionShell, WorkspaceStatusPill } from '../pipeline/PipelineWidgets';

export const StokBarangView: React.FC = () => {
  const navigate = useNavigate();
  const { inventory, searchQuery, setSearchQuery } = useIOMS();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockCondition, setStockCondition] = useState<'all' | 'critical' | 'safe'>('all');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    inventory.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set);
  }, [inventory]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const isLow = item.stockAvailable <= item.minThreshold;

      if (stockCondition === 'critical' && !isLow) return false;
      if (stockCondition === 'safe' && isLow) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cleanName = item.name.toLowerCase();
        const code = item.code.toLowerCase();
        const brand = (item.brand || '').toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const rack = (item.locationRack || '').toLowerCase();

        return (
          cleanName.includes(q) ||
          code.includes(q) ||
          brand.includes(q) ||
          cat.includes(q) ||
          rack.includes(q)
        );
      }

      return true;
    });
  }, [inventory, selectedCategory, stockCondition, searchQuery]);

  const criticalStockItems = useMemo(
    () => inventory.filter((item) => item.stockAvailable <= item.minThreshold),
    [inventory],
  );

  const totalStockAvailable = useMemo(
    () => inventory.reduce((sum, item) => sum + item.stockAvailable, 0),
    [inventory],
  );

  const totalStockInUse = useMemo(
    () => inventory.reduce((sum, item) => sum + item.stockInUse, 0),
    [inventory],
  );

  const cleanItemName = (name: string, code: string) => {
    const cleaned = name.replace(/^(Material\s+Lainnya\s*(\/\s*Khusus)?\s*[-–—:\/]?\s*)/i, '').trim();
    return cleaned || code;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <section className="rounded-[32px] border border-slate-200 bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-sky-300">
              <Boxes className="h-4 w-4" />
              <span>Modul Stok & Material Gudang</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-4xl">
              Katalog Stok Barang & Material
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
              Pencatatan resmi modem, kabel drop, SFP, patch cord, ODP, dan material operasional gudang. Pantau ketersediaan stok fisik dan batas minimum item secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/app/request-pengadaan-barang')}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-md"
            >
              <PackagePlus className="h-4 w-4" />
              <span>Buat Permintaan Barang</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/inventory')}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20 shadow-xs"
            >
              <Warehouse className="h-4 w-4 text-emerald-300" />
              <span>Log Pengadaan Barang</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Overview Metric Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Item Katalog</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{inventory.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Jenis item material terdaftar di database</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stok Kritis</span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{criticalStockItems.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {criticalStockItems.length > 0 ? 'Perlu restock pengadaan segera' : 'Semua item dalam kondisi aman'}
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stok Ready</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalStockAvailable.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-500 mt-1">Unit material fisik di rak gudang</p>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Terpasang</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-800 mt-2">{totalStockInUse.toLocaleString('id-ID')}</p>
          <p className="text-[11px] text-slate-500 mt-1">Sedang aktif di instalasi pelanggan</p>
        </div>
      </div>

      {/* Main Inventory Catalog Table */}
      <WorkspaceSectionShell
        eyebrow="Master Catalog"
        title="Katalog Inventaris & Kondisi Fisik Stok Gudang"
        subtitle="Rincian lengkap ketersediaan stok, batas minimum, harga acuan satuan, dan lokasi penyimpanan barang."
        badge={`${filteredInventory.length} item ditemukan`}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Condition Filter */}
            <div className="flex items-center rounded-2xl bg-slate-100 p-1 text-xs">
              <button
                type="button"
                onClick={() => setStockCondition('all')}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  stockCondition === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({inventory.length})
              </button>
              <button
                type="button"
                onClick={() => setStockCondition('critical')}
                className={`rounded-xl px-3 py-1.5 font-bold transition flex items-center gap-1 ${
                  stockCondition === 'critical' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Kritis ({criticalStockItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setStockCondition('safe')}
                className={`rounded-xl px-3 py-1.5 font-bold transition ${
                  stockCondition === 'safe' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Aman ({inventory.length - criticalStockItems.length})
              </button>
            </div>

            {/* Category Select */}
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Kode & Nama Barang</th>
                <th className="px-4 py-3">Kategori & Brand</th>
                <th className="px-4 py-3">Lokasi Rak</th>
                <th className="px-4 py-3 text-center">Stok Ready</th>
                <th className="px-4 py-3 text-center">Terpasang</th>
                <th className="px-4 py-3">Harga Acuan Satuan</th>
                <th className="px-4 py-3 text-center">Status Stok</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold">Tidak ada barang inventaris yang cocok dengan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock = item.stockAvailable <= item.minThreshold;
                  const nameClean = cleanItemName(item.name, item.code);

                  return (
                    <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 text-sm">{nameClean}</div>
                        <div className="font-mono text-[11px] text-slate-400">{item.code}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{item.brand || 'General'}</div>
                        <div className="text-[11px] text-slate-500">{item.category}</div>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {item.locationRack || 'Gudang Utama'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-sm font-black ${
                            isLowStock ? 'text-rose-700' : 'text-slate-900'
                          }`}
                        >
                          {item.stockAvailable} {item.unit}
                        </span>
                        <div className="text-[10px] text-slate-400">Min: {item.minThreshold} {item.unit}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-500">
                        {item.stockInUse} {item.unit}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold text-emerald-700">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <WorkspaceStatusPill
                          label={isLowStock ? `KRITIS (<= ${item.minThreshold})` : 'AMAN'}
                          tone={isLowStock ? 'rose' : 'emerald'}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => navigate('/app/request-pengadaan-barang')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition"
                          title="Buat pengajuan restock barang ini"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Minta Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </WorkspaceSectionShell>
    </div>
  );
};

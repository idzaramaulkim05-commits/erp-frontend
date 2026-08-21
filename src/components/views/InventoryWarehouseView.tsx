import React, { useState } from 'react';
import {
  Grid,
  Package,
  PackagePlus,
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';

interface InventoryWarehouseViewProps {
  onOpenNewProcurement: () => void;
}

export const InventoryWarehouseView: React.FC<InventoryWarehouseViewProps> = ({
  onOpenNewProcurement,
}) => {
  const {
    inventory,
    procurementRequests,
    receiveProcurementStock,
    searchQuery,
  } = useIOMS();

  const [activeTab, setActiveTab] = useState<'stock' | 'procurement' | 'sn_tracking'>('stock');

  const filteredInventory = inventory.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'stock'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Stok Barang & Material ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'procurement'
                ? 'bg-purple-700 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Permintaan Pengadaan ({procurementRequests.length})
          </button>
        </div>

        <button
          onClick={onOpenNewProcurement}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center space-x-1.5"
        >
          <PackagePlus className="w-4 h-4" />
          <span>+ Buat Permintaan Barang Baru</span>
        </button>
      </div>

      {/* 1. Stock Overview Table */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Katalog Inventaris & Sisa Stok Gudang
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan real-time modem, patch cord, drop cable, dan perangkat pasif ODP/ODC
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Kode & Nama Barang</th>
                  <th className="px-4 py-3">Kategori & Brand</th>
                  <th className="px-4 py-3">Lokasi Rak</th>
                  <th className="px-4 py-3 text-center">Stok Ready</th>
                  <th className="px-4 py-3 text-center">Terpasang di Cust</th>
                  <th className="px-4 py-3">Harga Satuan</th>
                  <th className="px-4 py-3 text-right">Status Kritis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const isLow = item.stockAvailable <= item.minThreshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{item.brand}</span>
                        <span className="text-[11px] text-slate-500 block">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {item.locationRack}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-extrabold text-slate-900">
                          {item.stockAvailable} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500 font-semibold">
                        {item.stockInUse} {item.unit}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                        Rp {item.unitPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLow ? (
                          <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-rose-300">
                            Stok Kritis (&le; {item.minThreshold})
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-300">
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Procurement Requests Log & Stock Check-in */}
      {activeTab === 'procurement' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Riwayat Pengajuan & Penerimaan Barang Masuk (Stock In)
            </h3>
            <p className="text-xs text-slate-500">
              Barang yang disetujui Finance / Manajemen dapat diterima dan di-check in ke stok sistem
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {procurementRequests.map((req) => {
              const isApproved = req.status === 'approved';
              return (
                <div key={req.id} className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {req.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{req.itemName}</h4>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'received'
                            ? 'bg-teal-100 text-teal-800'
                            : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{req.reason}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                      <span>Total: <strong className="text-emerald-700 font-mono">Rp {req.totalAmount.toLocaleString('id-ID')}</strong></span>
                      <span>Qty: <strong>{req.quantity} {req.unit}</strong></span>
                      <span>Diajukan: {req.requestedAt}</span>
                      {req.receivedAt && <span className="text-teal-700">Diterima: {req.receivedAt}</span>}
                    </div>
                  </div>

                  {isApproved && (
                    <button
                      onClick={() => receiveProcurementStock(req.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs shrink-0 flex items-center space-x-1.5"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Terima Barang & Masukkan Stok</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

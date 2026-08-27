import React, { useEffect, useState } from 'react';
import { X, PackagePlus, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { ProcurementRequest } from '../../types';

interface NewProcurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  procurementRequest?: ProcurementRequest | null;
}

const SPECIAL_ITEM_VALUE = '__custom__';

const deriveItemCode = (name: string) => (
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'CUSTOM-ITEM'
);

export const NewProcurementModal: React.FC<NewProcurementModalProps> = ({ isOpen, onClose, procurementRequest = null }) => {
  const { createProcurementRequest, updateProcurementRequest, inventory } = useIOMS();

  const [selectedItemValue, setSelectedItemValue] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('Modem ONT GPON ZTE F609 (Dual Band)');
  const [quantity, setQuantity] = useState<number>(50);
  const [unit, setUnit] = useState('Unit');
  const [unitPrice, setUnitPrice] = useState<number>(240000);
  const [reason, setReason] = useState('Stok modem ONT di rak A1 menipis sisa 14 unit. Kebutuhan pasang baru wilayah Waru & Sidoarjo meningkat.');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (procurementRequest) {
      setItemCode(procurementRequest.itemCode);
      setItemName(procurementRequest.itemName);
      setQuantity(procurementRequest.quantity);
      setUnit(procurementRequest.unit);
      setUnitPrice(procurementRequest.unitPrice);
      setReason(procurementRequest.reason);
      const matched = inventory.find((item) => item.code === procurementRequest.itemCode || item.name === procurementRequest.itemName);
      setSelectedItemValue(matched ? matched.code : SPECIAL_ITEM_VALUE);
      return;
    }

    const fallback = inventory[0];
    if (fallback) {
      setSelectedItemValue(fallback.code);
      setItemCode(fallback.code);
      setItemName(fallback.name);
      setUnit(fallback.unit);
      setUnitPrice(fallback.unitPrice);
    } else {
      setSelectedItemValue(SPECIAL_ITEM_VALUE);
      setItemCode('');
      setItemName('');
      setUnit('Unit');
      setUnitPrice(0);
    }
    setQuantity(50);
    setReason('Stok barang mencapai batas minimum dan perlu restock untuk kebutuhan operasional.');
  }, [inventory, isOpen, procurementRequest]);

  if (!isOpen) return null;

  const totalAmount = quantity * unitPrice;

  const handleItemSelect = (value: string) => {
    setSelectedItemValue(value);
    if (value === SPECIAL_ITEM_VALUE) {
      setItemCode(itemCode || '');
      setItemName(procurementRequest?.itemName ?? '');
      return;
    }

    const matched = inventory.find((i) => i.code === value);
    if (matched) {
      setItemCode(matched.code);
      setItemName(matched.name);
      setUnitPrice(matched.unitPrice);
      setUnit(matched.unit);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanName = itemName.trim();
    cleanName = cleanName.replace(/^(Material\s+Lainnya\s*(\/\s*Khusus)?\s*[-–—:\/]?\s*)/i, '').trim();
    if (!cleanName) {
      cleanName = itemCode.trim() || 'Perangkat Baru';
    }

    const normalizedItemCode = (itemCode.trim() || deriveItemCode(cleanName)).toUpperCase();
    const payload = {
      itemCode: normalizedItemCode,
      itemName: cleanName,
      quantity,
      unit: unit.trim(),
      unitPrice,
      totalAmount,
      reason: reason.trim(),
    };

    if (procurementRequest) {
      await updateProcurementRequest(procurementRequest.id, payload);
    } else {
      createProcurementRequest(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PackagePlus className="w-5 h-5 text-indigo-300" />
            <h3 className="text-sm font-bold">{procurementRequest ? 'Revisi Permintaan Pengadaan Barang' : 'Form Permintaan Pengadaan Barang / Restock'}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-indigo-200 hover:text-white hover:bg-indigo-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Barang dari Katalog:</label>
            <select
              value={selectedItemValue}
              onChange={(e) => handleItemSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              {inventory.map((item) => {
                const cleanName = item.name.replace(/^(Material\s+Lainnya\s*(\/\s*Khusus)?\s*[-–—:\/]?\s*)/i, '').trim() || item.code;
                return (
                  <option key={item.id} value={item.code}>
                    {cleanName} (Stok Sisa: {item.stockAvailable} {item.unit})
                  </option>
                );
              })}
              <option value={SPECIAL_ITEM_VALUE}>+ Material / Perangkat Lainnya (Input Manual)</option>
            </select>
          </div>

          {selectedItemValue === SPECIAL_ITEM_VALUE && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kode Barang:</label>
                <input
                  type="text"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang:</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jumlah (Qty):</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Satuan:</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Estimasi Harga Satuan:</label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseInt(e.target.value) || 0)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Total Price Display */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Estimasi Anggaran:</span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono">
                Rp {totalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                totalAmount > 5000000
                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {totalAmount > 5000000 ? 'Wajib ACC Direktur (> 5 Juta)' : 'Cukup ACC Finance (<= 5 Juta)'}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Justifikasi & Alasan Kebutuhan:</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>{procurementRequest ? 'Simpan Revisi & Kirim Ulang' : 'Kirim Permintaan ke Finance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

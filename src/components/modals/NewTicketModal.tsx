import React, { useState } from 'react';
import { X, HelpCircle, User, AlertTriangle, Send } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';
import { TroubleTicket } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({ isOpen, onClose }) => {
  const { customers, createTroubleTicket } = useIOMS();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || 'CUST-1042');
  const [title, setTitle] = useState<string>('Lampu Indikator LOS Merah Berkedip');
  const [description, setDescription] = useState<string>('Pelanggan komplain internet mati total sejak tadi sore. Lampu LOS di modem ZTE berkedip merah.');
  const [category, setCategory] = useState<'los_red_light' | 'slow_connection' | 'wifi_issue' | 'other'>('los_red_light');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');

  if (!isOpen) return null;

  const selectedCust = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTroubleTicket({
      customerId: selectedCust.id,
      customerName: selectedCust.name,
      customerPhone: selectedCust.phone,
      address: selectedCust.address,
      odpId: selectedCust.odpId,
      region: selectedCust.region,
      title,
      description,
      category,
      priority,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-emerald-300" />
            <h3 className="text-sm font-bold">Buat Tiket Gangguan / Aduan Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Pelanggan:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id}) - {c.odpId} [{c.region}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Masalah:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="los_red_light">LOS Merah (Kabel FO Putus/Drop)</option>
                <option value="slow_connection">Koneksi Lemot / Redaman Naik</option>
                <option value="wifi_issue">Kendala WiFi / Password SSID</option>
                <option value="other">Lainnya / Pertanyaan Billing</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Prioritas Penanganan:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
                <option value="urgent">Kritis (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul Ringkas Keluhan:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Lampu LOS Merah Berkedip"
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Deskripsi Rinci Keluhan:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kondisi kendala yang dialami pelanggan..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900">
            <strong>Alur Otomatisasi:</strong> Tiket baru akan masuk ke stasiun <strong>NOC Review</strong> terlebih dahulu untuk didiagnosis apakah bisa diperbaiki secara remote (mikrotik/OLT) atau memerlukan pengiriman Work Order fisik ke Kepala Teknisi.
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Simpan & Teruskan ke NOC</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

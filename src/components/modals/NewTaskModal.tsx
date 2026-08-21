import React, { useState } from 'react';
import { X, Plus, Layers, ArrowRight, Calendar } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewTaskModal: React.FC<NewTaskModalProps> = ({ isOpen, onClose }) => {
  const { createTask } = useIOMS();

  const [title, setTitle] = useState('Verifikasi Mutasi Rekening BCA Pelanggan CUST-1044');
  const [description, setDescription] = useState('Pelanggan mengirim bukti transfer manual via WhatsApp. Mohon Finance cek mutasi dan update status isolir.');
  const [fromDivision, setFromDivision] = useState('Helpdesk');
  const [toDivision, setToDivision] = useState('Finance');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [dueDate, setDueDate] = useState('2026-08-16');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTask({
      title,
      description,
      fromDivision,
      toDivision,
      priority,
      dueDate,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-purple-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-300" />
            <h3 className="text-sm font-bold">Buat Tugas Koordinasi Antar-Divisi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-purple-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dari Divisi:</label>
              <select
                value={fromDivision}
                onChange={(e) => setFromDivision(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Helpdesk">Helpdesk / CS</option>
                <option value="NOC">NOC (Network Operations)</option>
                <option value="Teknisi Lapangan">Teknisi Lapangan</option>
                <option value="Finance">Finance & Billing</option>
                <option value="Gudang / Inventory">Gudang & Logistik</option>
                <option value="Manajemen">Manajemen / Direksi</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ditujukan Kepada Divisi:</label>
              <select
                value={toDivision}
                onChange={(e) => setToDivision(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Finance">Finance & Billing</option>
                <option value="Helpdesk">Helpdesk / CS</option>
                <option value="NOC">NOC (Network Operations)</option>
                <option value="Teknisi Lapangan">Teknisi Lapangan</option>
                <option value="Gudang / Inventory">Gudang & Logistik</option>
                <option value="Manajemen">Manajemen / Direksi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul Ringkas Task:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Uraian Detail & Instruksi:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Prioritas:</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="low">Rendah</option>
                <option value="medium">Normal</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak (Urgent)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Tenggat Waktu (Due Date):</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
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
              className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Simpan ke Papan Kanban</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

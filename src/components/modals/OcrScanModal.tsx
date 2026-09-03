import React, { useState } from 'react';
import { X, Camera, Upload, Scan, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../../services/apiClient';

interface OcrScanModalProps {
  onSuccess: (result: { serial_number: string; mac_address?: string; brand?: string }) => void;
  onClose: () => void;
}

export const OcrScanModal: React.FC<OcrScanModalProps> = ({ onSuccess, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setError(null);
    }
  };

  const handleRunOcr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setScanning(true);
    setError(null);

    const fd = new FormData();
    fd.append('photo', file);

    try {
      const res = await api.post('/tickets/scan-onu-ocr', fd);
      if (res.success && res.serial_number) {
        onSuccess({
          serial_number: res.serial_number,
          mac_address: res.mac_address || res.mac,
          brand: res.brand || res.model,
        });
        onClose();
      } else {
        setError(res.message || 'Gagal membaca barcode/SN dari foto. Pastikan stiker barcode tampak jelas dan fokus.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memproses OCR barcode.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <Scan className="w-5 h-5 text-indigo-600" />
            <span>Pemindai OCR Barcode ONT</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Ambil atau upload foto stiker belakang modem ONT/ONU untuk membaca Serial Number dan MAC Address secara otomatis.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRunOcr} className="space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition cursor-pointer relative overflow-hidden">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              id="ocr-file-input"
              className="hidden"
            />
            <label htmlFor="ocr-file-input" className="cursor-pointer block space-y-2">
              {preview ? (
                <div className="w-full h-44 rounded-xl overflow-hidden relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-semibold text-xs opacity-0 hover:opacity-100 transition">
                    Ganti Foto
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">Ambil Foto Stiker ONT</div>
                  <p className="text-[11px] text-slate-400">Pilih dari Galeri atau Kamera Smartphone</p>
                </div>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!file || scanning}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 shadow-xs"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memindai OCR...</span>
                </>
              ) : (
                <>
                  <Scan className="w-3.5 h-3.5" />
                  <span>Ekstrak Barcode / SN</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

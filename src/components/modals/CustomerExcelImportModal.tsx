import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  Loader2,
  RefreshCw,
  Trash2,
  UploadCloud,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useIOMS } from '../../context/IOMSContext';

export interface CustomerImportRowData {
  name: string;
  nik?: string;
  phone: string;
  address: string;
  region: string;
  package_plan: string;
  monthly_fee: number;
  odp_id?: string;
  pppoe_username?: string;
  pppoe_password?: string;
  initial_deposit_paid?: boolean;
}

export interface EvaluatedCustomerImportRow {
  row_number: number;
  status: 'valid' | 'warning' | 'error';
  data: CustomerImportRowData;
  errors: string[];
  warnings: string[];
}

export interface CustomerImportPreviewResult {
  total_rows: number;
  valid_count: number;
  error_count: number;
  warning_count: number;
  can_import_all: boolean;
  can_import_valid: boolean;
  rows: EvaluatedCustomerImportRow[];
}

interface CustomerExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerExcelImportModal: React.FC<CustomerExcelImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { authFetch } = useAuth();
  const { refreshAll, triggerCelebration } = useIOMS();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<CustomerImportPreviewResult | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessResult, setImportSuccessResult] = useState<{ imported_count: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    const csvContent =
      '\uFEFF' +
      'Nama Pelanggan,NIK,Nomor HP,Alamat,Wilayah,Paket Layanan,Tarif Bulanan,ODP ID,Status Pembayaran\n' +
      'Budi Santoso,3201123456780001,081234567890,Jl. Mawar No. 12 RT 01 RW 02,Denpasar,Home 50 Mbps,300000,ODP-DPS-01,Lunas\n' +
      'Siti Aminah,3201987654320002,081987654321,Jl. Melati No. 45,Badung,Home 30 Mbps,200000,ODP-BDG-01,Lunas\n' +
      'I Wayan Koster,5101012345670003,082134567899,Jl. Gatot Subroto No. 88,Denpasar,Business 100 Mbps,500000,,Lunas\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_pelanggan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    setSelectedFile(file);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setPreviewResult(null);
    setImportSuccessResult(null);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await authFetch<CustomerImportPreviewResult>('/customers/import/preview', {
        method: 'POST',
        body: formData,
      });

      setPreviewResult(result);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err?.message || 'Gagal membaca dan menganalisis file.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewResult(null);
    setAnalysisError(null);
    setImportError(null);
    setImportSuccessResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async (importMode: 'all' | 'valid_only') => {
    if (!previewResult) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const rowsToImport =
        importMode === 'all'
          ? previewResult.rows.map((r) => r.data)
          : previewResult.rows.filter((r) => r.status === 'valid' || r.status === 'warning').map((r) => r.data);

      if (rowsToImport.length === 0) {
        throw new Error('Tidak ada baris data valid yang dapat diimpor.');
      }

      const res = await authFetch<{ success: boolean; imported_count: number }>('/customers/import/confirm', {
        method: 'POST',
        body: JSON.stringify({ rows: rowsToImport }),
      });

      setImportSuccessResult(res);
      triggerCelebration();
      await refreshAll();
    } catch (err: any) {
      console.error(err);
      setImportError(err?.message || 'Gagal mengimpor data ke database.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRows = useMemo(() => {
    if (!previewResult) return [];
    if (activeTab === 'valid') return previewResult.rows.filter((r) => r.status === 'valid');
    if (activeTab === 'warning') return previewResult.rows.filter((r) => r.status === 'warning');
    if (activeTab === 'error') return previewResult.rows.filter((r) => r.status === 'error');
    return previewResult.rows;
  }, [previewResult, activeTab]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden bg-white rounded-[32px] shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-slate-950 via-slate-900 to-emerald-950 text-white">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Import Data Pelanggan via Excel / CSV</h3>
              <p className="text-xs text-slate-300">Pengecekan dan validasi otomatis sebelum data dimasukkan ke sistem</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition backdrop-blur-xs shadow-xs"
              title="Download Template Excel (.CSV)"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-300" />
              <span>Template Excel</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Step 1: Success State */}
          {importSuccessResult ? (
            <div className="py-12 text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900">Import Data Berhasil!</h4>
                <p className="text-sm text-slate-600">
                  Sebanyak <strong className="text-emerald-700 font-bold">{importSuccessResult.imported_count} pelanggan baru</strong> telah berhasil didaftarkan dan tersimpan ke database.
                </p>
              </div>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Import File Lain
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  Selesai & Lihat Data
                </button>
              </div>
            </div>
          ) : !previewResult && !isAnalyzing ? (
            /* Upload Zone */
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-[28px] bg-slate-50/50 hover:bg-emerald-50/30 cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      void handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 text-emerald-600 group-hover:scale-105 transition">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="mt-4 space-y-1">
                  <p className="text-sm font-bold text-slate-900">
                    Klik untuk memilih file atau seret file ke sini
                  </p>
                  <p className="text-xs text-slate-500">
                    Mendukung format file Excel (.csv, .xlsx, .xls)
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-100/60 px-3 py-1 rounded-full border border-emerald-200">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Format kolom: Nama Pelanggan, NIK, No HP, Alamat, Wilayah, Paket, Tarif, ODP ID
                </div>
              </div>

              {analysisError && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center gap-3 text-xs">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{analysisError}</span>
                </div>
              )}
            </div>
          ) : isAnalyzing ? (
            /* Analyzing Loader */
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-emerald-600" />
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-900">Memeriksa & Memvalidasi Data...</p>
                <p className="text-xs text-slate-500">Mengecek kelengkapan baris, duplikasi nomor HP, dan kecocokan ODP.</p>
              </div>
            </div>
          ) : (
            /* Preview & Validation Results Screen */
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Baris</span>
                  <span className="mt-1 text-2xl font-black text-slate-900">{previewResult?.total_rows ?? 0}</span>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Siap Diimpor (Valid)</span>
                  <span className="mt-1 text-2xl font-black text-emerald-800">{previewResult?.valid_count ?? 0}</span>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">Peringatan (Warning)</span>
                  <span className="mt-1 text-2xl font-black text-amber-800">{previewResult?.warning_count ?? 0}</span>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">Error (Bermasalah)</span>
                  <span className="mt-1 text-2xl font-black text-rose-800">{previewResult?.error_count ?? 0}</span>
                </div>
              </div>

              {/* Status Alert Banner */}
              {previewResult && previewResult.error_count === 0 ? (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center justify-between gap-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">Pengecekan Selesai: Semua Data Valid!</strong>
                      <span>Seluruh {previewResult.valid_count} baris data dapat dimasukkan ke database tanpa kendala.</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-bold text-[10px] uppercase tracking-wider">
                    Siap Import
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Terdapat {previewResult?.error_count} Baris Data Error</strong>
                    <span>
                      Data yang error tidak dapat diimpor karena ada kolom wajib yang kosong atau nomor HP tidak valid. Anda dapat mengimpor <strong>{previewResult?.valid_count} data yang valid saja</strong> atau mengunggah ulang file setelah diperbaiki.
                    </span>
                  </div>
                </div>
              )}

              {/* Filter Tabs & Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', label: `Semua (${previewResult?.total_rows ?? 0})` },
                    { id: 'valid', label: `Valid (${previewResult?.valid_count ?? 0})` },
                    { id: 'warning', label: `Warning (${previewResult?.warning_count ?? 0})` },
                    { id: 'error', label: `Error (${previewResult?.error_count ?? 0})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">{selectedFile?.name}</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-rose-600 font-bold px-2 py-1 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ganti File</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-[11px] font-bold uppercase text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Baris</th>
                      <th className="px-3 py-2.5">Nama Pelanggan</th>
                      <th className="px-3 py-2.5">Kontak</th>
                      <th className="px-3 py-2.5">Alamat & Wilayah</th>
                      <th className="px-3 py-2.5">Paket & Tarif</th>
                      <th className="px-3 py-2.5">ODP</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Catatan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredRows.map((row) => {
                      const isErr = row.status === 'error';
                      const isWarn = row.status === 'warning';

                      return (
                        <tr
                          key={row.row_number}
                          className={`transition hover:bg-slate-50/80 ${
                            isErr ? 'bg-rose-50/30' : isWarn ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5 font-bold font-mono text-slate-500">{row.row_number}</td>
                          <td className="px-3 py-2.5 font-bold text-slate-900">
                            <div>{row.data.name || '<Kosong>'}</div>
                            {row.data.nik && <div className="text-[10px] font-normal text-slate-400 font-mono">NIK: {row.data.nik}</div>}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700">{row.data.phone || '<Kosong>'}</td>
                          <td className="px-3 py-2.5 text-slate-700">
                            <div className="truncate max-w-[160px]" title={row.data.address}>{row.data.address || '-'}</div>
                            <div className="text-[10px] text-slate-400">{row.data.region}</div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-700">
                            <div className="font-semibold text-emerald-800">{row.data.package_plan}</div>
                            <div className="text-[10px] text-slate-400">Rp {Number(row.data.monthly_fee).toLocaleString('id-ID')}</div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">{row.data.odp_id || '-'}</td>
                          <td className="px-3 py-2.5">
                            {isErr ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold">
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            ) : isWarn ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3" /> Warning
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] max-w-[200px]">
                            {row.errors.length > 0 && (
                              <ul className="text-rose-700 list-disc list-inside space-y-0.5 font-medium">
                                {row.errors.map((err, i) => (
                                  <li key={i}>{err}</li>
                                ))}
                              </ul>
                            )}
                            {row.warnings.length > 0 && (
                              <ul className="text-amber-700 list-disc list-inside space-y-0.5 font-medium">
                                {row.warnings.map((warn, i) => (
                                  <li key={i}>{warn}</li>
                                ))}
                              </ul>
                            )}
                            {row.errors.length === 0 && row.warnings.length === 0 && (
                              <span className="text-slate-400">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {importError && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 flex items-center gap-3 text-xs">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {previewResult && !importSuccessResult && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
            <button
              type="button"
              onClick={handleReset}
              disabled={isImporting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Unggah Ulang File
            </button>

            <div className="flex items-center gap-2">
              {previewResult.error_count > 0 && previewResult.valid_count > 0 && (
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => handleConfirmImport('valid_only')}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-800 transition"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Import {previewResult.valid_count} Data Valid Saja</span>
                </button>
              )}

              <button
                type="button"
                disabled={isImporting || previewResult.valid_count === 0 || (previewResult.error_count > 0 && !previewResult.can_import_all)}
                onClick={() => handleConfirmImport('all')}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi & Import Semua ({previewResult.valid_count} Pelanggan)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

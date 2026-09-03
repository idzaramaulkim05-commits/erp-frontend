import React, { useState } from 'react';
import { 
  X, 
  User, 
  MapPin, 
  Phone, 
  CreditCard, 
  Wifi, 
  Radio, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink, 
  Ticket as TicketIcon,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { DataSheetItem } from '../../types';
import { resolveMediaUrl } from '../../services/apiClient';

interface Customer360ModalProps {
  customer: DataSheetItem;
  onClose: () => void;
}

export const Customer360Modal: React.FC<Customer360ModalProps> = ({ customer, onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'tickets' | 'billing'>('profile');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const photos = [
    { label: 'Tampak Depan Rumah', url: customer.foto_rumah_url },
    { label: 'Sambungan Port ODP', url: customer.foto_odp_url },
    { label: 'Stiker Identitas Modem ONT', url: customer.foto_modem_url },
    { label: 'Pengukuran Redaman Optik', url: customer.foto_redaman_url },
    { label: 'Label Nama Kabel di ODP', url: customer.foto_label_kabel_url },
    { label: 'Foto KTP Pelanggan', url: customer.foto_ktp_url },
    { label: 'Berita Acara / Surat Dokumen', url: customer.foto_dokumen_url },
  ].filter(p => !!p.url);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
              {customer.nama_pelanggan.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{customer.nama_pelanggan}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  customer.status_langganan === 'aktif'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {customer.status_langganan.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{customer.username_pppoe}</span>
                <button
                  onClick={() => copyText(customer.username_pppoe, 'pppoe')}
                  className="hover:text-white"
                >
                  {copiedText === 'pppoe' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profil 360°</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'photos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Dokumentasi Foto ({photos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'tickets'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TicketIcon className="w-4 h-4" />
            <span>Riwayat Tiket</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'billing'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Tagihan & Invoicing</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: PROFILE 360 */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Info Pelanggan & Paket */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Informasi Pelanggan</span>
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-bold text-slate-800">{customer.nama_pelanggan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Telepon / WA:</span>
                      <span className="font-mono font-semibold text-indigo-600">{customer.telepon || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">NIK KTP:</span>
                      <span className="font-mono text-slate-700">{customer.nik_ktp || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Alamat Pemasangan:</span>
                      <span className="text-slate-800 text-right max-w-xs">{customer.alamat || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sales / Marketing:</span>
                      <span className="font-semibold text-slate-700">{customer.sales_name || 'EONET'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span>Paket & Billing</span>
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Paket Layanan:</span>
                      <span className="font-bold text-blue-700">{customer.paket || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarif Bulanan:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rp {Number(customer.harga_paket || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tgl Jatuh Tempo:</span>
                      <span className="font-semibold text-slate-800">{customer.tanggal_jatuh_tempo || 'Tiap Tanggal 20'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Pembayaran:</span>
                      <span className="font-bold text-emerald-700">{customer.status_pembayaran || 'LUNAS'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Infrastruktur & Jaringan */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-teal-600" />
                    <span>Infrastruktur ODP & ONT</span>
                  </h4>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Titik ODP:</span>
                      <span className="font-bold text-teal-700">{customer.nama_odp || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Port ODP:</span>
                      <span className="font-semibold text-slate-800">Port {customer.port_odp || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">OLT Server:</span>
                      <span className="font-semibold text-slate-800">{customer.olt_server || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Serial Number ONT:</span>
                      <span className="font-mono font-bold text-slate-900">{customer.pon_sn || customer.serial_number || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">MAC Address:</span>
                      <span className="font-mono text-slate-700">{customer.mac_address || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">VLAN ID:</span>
                      <span className="font-mono text-slate-700">{customer.vlan || '-'}</span>
                    </div>
                  </div>
                </div>

                {customer.lokasi_maps && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      <span>Lokasi Google Maps</span>
                    </h4>
                    <a
                      href={customer.lokasi_maps.startsWith('http') ? customer.lokasi_maps : `https://www.google.com/maps?q=${customer.lokasi_maps}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Buka Titik Rumah di Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PHOTOS (Server Local Storage Gallery) */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.length > 0 ? (
                  photos.map((p, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setSelectedPhoto(resolveMediaUrl(p.url))}
                      className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2 cursor-pointer hover:border-indigo-400 transition group"
                    >
                      <div className="w-full h-36 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                        <img
                          src={resolveMediaUrl(p.url)}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=60';
                          }}
                        />
                      </div>
                      <div className="text-xs font-bold text-slate-800 truncate">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{p.url}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400">
                    Belum ada foto dokumentasi yang diupload untuk pelanggan ini.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TICKETS */}
          {activeTab === 'tickets' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-center">
                Riwayat tiket gangguan dan permintaan pelanggan terhubung ke username PPPoE <span className="font-bold text-slate-700">{customer.username_pppoe}</span>.
              </div>
            </div>
          )}

          {/* TAB 4: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 text-center">
                Data penagihan dan kwitansi pembayaran pelanggan otomatis disinkronkan ke modul Invoicing & Billing.
              </div>
            </div>
          )}
        </div>

        {/* Modal Lightbox for Full Photo Preview */}
        {selectedPhoto && (
          <div 
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-60 animate-in fade-in"
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedPhoto}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

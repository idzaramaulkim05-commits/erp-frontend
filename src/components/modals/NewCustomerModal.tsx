import React, { useState } from 'react';
import { X, UserPlus, Key, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useIOMS } from '../../context/IOMSContext';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose }) => {
  const { activeRole, createCustomer, createServiceRegistration, networkOdps } = useIOMS();

  const [name, setName] = useState('Ir. Hendra Kusuma');
  const [phone, setPhone] = useState('0812-9876-5432');
  const [nik, setNik] = useState('3515082405890001');
  const [address, setAddress] = useState('Jl. Kahuripan Nirwana Blok C-12, Sidoarjo');
  const [region, setRegion] = useState('Sidoarjo Kota');
  const [packagePlan, setPackagePlan] = useState('Home Fiber 50 Mbps');
  const [monthlyFee, setMonthlyFee] = useState<number>(250000);
  const [selectedOdpId, setSelectedOdpId] = useState(networkOdps[0]?.id || 'ODP-SDA-01/01');

  if (!isOpen) return null;

  const handlePackageChange = (plan: string) => {
    setPackagePlan(plan);
    if (plan.includes('20 Mbps')) setMonthlyFee(175000);
    else if (plan.includes('50 Mbps')) setMonthlyFee(250000);
    else if (plan.includes('100 Mbps')) setMonthlyFee(375000);
    else if (plan.includes('Dedicated')) setMonthlyFee(1500000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeRole === 'sales') {
      createServiceRegistration({
        name,
        phone,
        nik,
        address,
        region,
        packagePlan,
        monthlyFee,
        odpId: selectedOdpId,
      });
    } else {
      createCustomer({
        name,
        phone,
        nik,
        address,
        region,
        packagePlan,
        monthlyFee,
        odpId: selectedOdpId,
      }, true);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-300" />
            <h3 className="text-sm font-bold">
              {activeRole === 'sales' ? 'Input Registrasi Pasang Baru' : 'Registrasi & Pemasangan Baru Pelanggan'}
            </h3>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Lengkap:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP:</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor NIK KTP:</label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Wilayah / Kecamatan:</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Sidoarjo Kota">Sidoarjo Kota</option>
                <option value="Waru">Waru</option>
                <option value="Gedangan">Gedangan</option>
                <option value="Candi">Candi</option>
                <option value="Sukodono">Sukodono</option>
                <option value="Porong">Porong</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap Pemasangan:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Paket Layanan:</label>
              <select
                value={packagePlan}
                onChange={(e) => handlePackageChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                <option value="Home Fiber 20 Mbps">Home Fiber 20 Mbps (Rp 175.000)</option>
                <option value="Home Fiber 50 Mbps">Home Fiber 50 Mbps (Rp 250.000)</option>
                <option value="Home Fiber 100 Mbps">Home Fiber 100 Mbps (Rp 375.000)</option>
                <option value="Dedicated Biz 100 Mbps">Dedicated Biz 100 Mbps (Rp 1.500.000)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Titik ODP Terdekat:</label>
              <select
                value={selectedOdpId}
                onChange={(e) => setSelectedOdpId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden"
              >
                {networkOdps.map((odp) => (
                  <option key={odp.id} value={odp.id}>
                    {odp.id} - {odp.address} ({odp.usedPorts}/{odp.totalPorts} Port)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security & Automation Notice */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-900 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Otomatisasi Sistem:</span>
            </div>
            {activeRole === 'sales' ? (
              <>
                <p>1. Data registrasi baru masuk ke antrean finance untuk approval biaya dan deposit.</p>
                <p>2. Setelah finance dan NOC approve, sistem akan membuat PPPoE dan WO instalasi otomatis.</p>
              </>
            ) : (
              <>
                <p>1. Akun PPPoE & Password Acak Unik otomatis dibuat.</p>
                <p>2. Work Order Pemasangan Baru langsung diterbitkan ke antrean Kepala Teknisi.</p>
              </>
            )}
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
              <UserPlus className="w-3.5 h-3.5" />
              <span>{activeRole === 'sales' ? 'Simpan Draft Registrasi' : 'Daftarkan & Terbitkan WO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

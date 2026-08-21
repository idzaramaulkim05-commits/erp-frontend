import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
    <div className="max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center">
      <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto mb-4" />
      <h1 className="text-2xl font-black text-slate-950">Akses Ditolak</h1>
      <p className="text-sm text-slate-500 mt-3">Akun Anda tidak memiliki hak akses untuk membuka halaman ini.</p>
      <Link to="/" className="inline-flex mt-6 rounded-2xl bg-slate-950 text-white font-semibold px-5 py-3">
        Kembali ke Dashboard
      </Link>
    </div>
  </div>
);

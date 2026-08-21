import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
    <div className="max-w-md rounded-3xl bg-white border border-slate-200 shadow-xl p-8 text-center">
      <p className="text-sm font-semibold text-slate-400 uppercase tracking-[0.24em]">404</p>
      <h1 className="text-2xl font-black text-slate-950 mt-3">Halaman tidak ditemukan</h1>
      <p className="text-sm text-slate-500 mt-3">URL yang Anda akses tidak tersedia di aplikasi internal ini.</p>
      <Link to="/" className="inline-flex mt-6 rounded-2xl bg-slate-950 text-white font-semibold px-5 py-3">
        Kembali
      </Link>
    </div>
  </div>
);

# IOMS Internal Ops Frontend

Frontend ini adalah aplikasi React + Vite untuk operasi internal ISP yang terhubung ke backend Laravel melalui API JSON.

## Local Setup

1. Install dependency:
   `npm install`
2. Copy `.env.example` bila diperlukan dan sesuaikan `VITE_API_BASE_URL`.
3. Jalankan development server:
   `npm run dev`

Default lokal:

- frontend: `http://127.0.0.1:3000`
- backend API: `http://127.0.0.1:8000/api`

## Environment

- `VITE_API_BASE_URL`
- `VITE_APP_ENV`
- `VITE_ENABLE_DEMO_ROLE_SWITCH`

Untuk launch produksi internal ops:

- `VITE_APP_ENV=production`
- `VITE_ENABLE_DEMO_ROLE_SWITCH=false`

## Produksi

Build produksi:

```bash
npm run build
```

Hasil build ada di folder `dist` dan dapat disajikan langsung oleh Nginx.

## Auth Flow Produksi

- User wajib masuk lewat halaman `/login`
- Token bearer disimpan untuk sesi frontend
- Aplikasi memuat `/auth/me` sebelum shell operasional dirender
- Token invalid atau expired akan memaksa logout dan kembali ke login

## QA Minimum

- Login valid dan invalid
- Redirect saat token expired
- Role tanpa izin menerima error backend yang jelas
- Build produksi tanpa role-switch demo

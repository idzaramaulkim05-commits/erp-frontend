import React, { useState } from 'react';
import {
  X,
  Code,
  Database,
  Layers,
  Server,
  Terminal,
  Cpu,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface ArchitectureSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureSpecsModal: React.FC<ArchitectureSpecsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stack' | 'database' | 'laravel' | 'vue' | 'docker'>('stack');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Arsitektur Teknis Produksi: Vue.js 3 + Laravel 11 + PostgreSQL</h3>
              <p className="text-[10px] text-slate-400">
                Spesifikasi Blueprint, Skema Database & Pola Integrasi OLT/Mikrotik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-900 px-6 py-2 flex space-x-2 border-b border-slate-800 shrink-0 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('stack')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'stack' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Ringkasan Stack & RBAC
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'database' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Skema PostgreSQL DDL
          </button>
          <button
            onClick={() => setActiveTab('laravel')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'laravel' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Controller & Service Laravel
          </button>
          <button
            onClick={() => setActiveTab('vue')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'vue' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Vue.js 3 SPA & Pinia
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'docker' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            5. Docker Compose Spec
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 font-sans">
          {activeTab === 'stack' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="font-bold text-emerald-900 text-sm mb-1">
                  Arsitektur Direkomendasikan Sesuai Arahan Diskusi:
                </h4>
                <p className="text-emerald-800">
                  Aplikasi dikembangkan menggunakan <strong>Vue.js 3 (Vite + Pinia)</strong> untuk performa antarmuka yang sangat ringan, cepat, dan bersih. Backend ditenagai oleh <strong>Laravel 11 REST API & PostgreSQL 16</strong> untuk integritas transaksi multi-divisi, ACID compliance, dan penguncian relasi data ODP/Port yang ketat.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs block">Frontend: Vue.js 3 Ecosystem</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li><strong>Vue 3 Composition API</strong> (`&lt;script setup lang="ts"&gt;`)</li>
                    <li><strong>Pinia</strong> untuk State Management terpusat (Role-aware stores)</li>
                    <li><strong>Vue Router 4</strong> dengan Navigation Guards berbasis Role</li>
                    <li><strong>Tailwind CSS v4</strong> untuk styling bersih, modern, dan responsif</li>
                    <li><strong>PWA / Mobile-Optimized Layout</strong> untuk teknisi di lapangan</li>
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-xs block">Backend: Laravel 11 + Postgres</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                    <li><strong>Laravel 11 RESTful API</strong> dengan Sanctum token auth</li>
                    <li><strong>PostgreSQL 16</strong> dengan JSONB untuk parameter teknis OLT</li>
                    <li><strong>Laravel Reverb / Soketi</strong> untuk notifikasi tiket real-time</li>
                    <li><strong>RouterOS PHP API Client</strong> untuk sinkronisasi otomatis PPPoE</li>
                    <li><strong>SNMP / Telnet Service Daemon</strong> untuk query laser OLT ZTE & Huawei</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 block">
                Skema PostgreSQL (DDL Migration SQL):
              </span>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`-- PostgreSQL 16 DDL Schema for IOMS
CREATE TYPE user_role AS ENUM ('super_admin', 'management', 'noc', 'helpdesk', 'lead_tech', 'field_tech', 'finance', 'inventory');
CREATE TYPE ticket_status AS ENUM ('open', 'in_noc_review', 'assigned_to_lead', 'field_progress', 'lead_sop_approved', 'noc_verifying', 'closed');
CREATE TYPE billing_status AS ENUM ('paid', 'unpaid');
CREATE TYPE customer_service_status AS ENUM ('active', 'isolated', 'paused', 'uninstal_pending', 'uninstalled');

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE network_odps (
    id VARCHAR(50) PRIMARY KEY, -- e.g. ODP-SDA-01/01
    odc_id VARCHAR(50) NOT NULL,
    olt_host VARCHAR(50) NOT NULL,
    pon_slot VARCHAR(50) NOT NULL,
    region VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    total_ports INT DEFAULT 8,
    used_ports INT DEFAULT 0
);

CREATE TABLE customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    nik VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    region VARCHAR(50) NOT NULL,
    package_plan VARCHAR(50) NOT NULL,
    monthly_fee NUMERIC(12, 2) NOT NULL,
    status customer_service_status DEFAULT 'active',
    billing_status billing_status DEFAULT 'paid',
    pppoe_username VARCHAR(50) UNIQUE NOT NULL,
    pppoe_password VARCHAR(100) NOT NULL,
    ont_serial_number VARCHAR(50),
    optical_power_dbm NUMERIC(5, 2),
    odp_id VARCHAR(50) REFERENCES network_odps(id),
    odp_port_number INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE trouble_tickets (
    id VARCHAR(36) PRIMARY KEY, -- e.g. TIK-2026-0841
    customer_id VARCHAR(36) REFERENCES customers(id),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status ticket_status DEFAULT 'open',
    assigned_tech_id VARCHAR(36) REFERENCES users(id),
    field_report JSONB,
    lead_sop_approval JSONB,
    noc_verification JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);`}
              </pre>
            </div>
          )}

          {activeTab === 'laravel' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 block">
                Contoh Controller Otomatisasi (Laravel 11 Service):
              </span>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`// app/Services/ISPWorkflowService.php
namespace App\\Services;

use App\\Models\\Customer;
use App\\Models\\TroubleTicket;
use App\\Models\\WorkOrder;
use Illuminate\\Support\\Str;

class ISPWorkflowService {
    // Otomatisasi 1: Registrasi -> Generate PPPoE -> Terbitkan WO Pasang Baru
    public function registerCustomer(array $data): Customer {
        $data['pppoe_username'] = strtolower(Str::slug($data['name'])) . '@isp.net';
        $data['pppoe_password'] = Str::random(10); // Password acak aman
        
        $customer = Customer::create($data);
        
        // Terbitkan Work Order Pasang Baru untuk Kepala Teknisi
        WorkOrder::create([
            'id' => 'WO-INST-' . rand(1000, 9999),
            'type' => 'installation',
            'customer_id' => $customer->id,
            'status' => 'pending',
            'scheduled_date' => now()->addDay()->toDateString()
        ]);
        
        return $customer;
    }

    // Otomatisasi 2: Status Uninstal -> Terbitkan WO Cabut Alat
    public function triggerUninstallWorkflow(Customer $customer, string $reason): WorkOrder {
        $customer->update(['status' => 'uninstal_pending']);
        
        return WorkOrder::create([
            'id' => 'WO-CABUT-' . rand(1000, 9999),
            'type' => 'uninstallation',
            'customer_id' => $customer->id,
            'status' => 'pending',
            'notes' => 'Cabut Modem ONT & Patch Cord: ' . $reason
        ]);
    }
}`}
              </pre>
            </div>
          )}

          {activeTab === 'vue' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 block">
                Contoh Komponen Vue.js 3 (Composition API):
              </span>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Vue 3 Clean Role-Based Dashboard Header -->
    <header class="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
          IOMS
        </div>
        <div>
          <h1 class="text-sm font-bold text-slate-900">ISP Operations Management</h1>
          <p class="text-xs text-slate-500">Role: {{ authStore.currentRoleTitle }}</p>
        </div>
      </div>
      
      <!-- Role Switcher -->
      <select v-model="authStore.currentRole" class="rounded-xl border border-slate-300 text-xs px-3 py-1.5">
        <option value="noc">NOC (Network Operations)</option>
        <option value="helpdesk">Helpdesk / CS</option>
        <option value="lead_tech">Kepala Teknisi</option>
        <option value="field_tech">Teknisi Lapangan (Mobile)</option>
        <option value="finance">Finance & Billing</option>
        <option value="inventory">Gudang / Inventory</option>
        <option value="management">Manajemen / Direksi</option>
      </select>
    </header>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
</script>`}
              </pre>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 block">
                Docker Compose Production Deployment:
              </span>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] overflow-x-auto">
{`version: '3.8'
services:
  app-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: ioms-laravel-backend:latest
    restart: unless-stopped
    environment:
      DB_CONNECTION: pgsql
      DB_HOST: db-postgres
      DB_PORT: 5432
      DB_DATABASE: ioms_isp_db
      DB_USERNAME: ioms_user
      DB_PASSWORD: secure_password_2026
    depends_on:
      - db-postgres
      - redis-cache

  app-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - app-backend

  db-postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ioms_isp_db
      POSTGRES_USER: ioms_user
      POSTGRES_PASSWORD: secure_password_2026

  redis-cache:
    image: redis:alpine
    restart: always

volumes:
  pgdata:`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Tutup Spesifikasi
          </button>
        </div>
      </div>
    </div>
  );
};

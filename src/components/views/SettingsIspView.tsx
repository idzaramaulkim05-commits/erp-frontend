import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Router, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Save, 
  Radio, 
  ShieldCheck,
  Building2,
  Phone
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { IspSettingModel } from '../../types';

export const SettingsIspView: React.FC = () => {
  const [settings, setSettings] = useState<IspSettingModel>({
    nama_isp: 'EONET ISP',
    telepon_support: '08123456789',
    alamat_kantor: 'Bandar Lampung',
    mikrotik_ip: '192.168.88.1',
    mikrotik_user: 'admin',
    mikrotik_port: 8728,
    mikrotik_interface_wan: 'ether1-WAN',
    mikrotik_interface_pppoe: 'pppoe-out1',
    fonnte_token: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testingRouter, setTestingRouter] = useState<boolean>(false);
  const [testingWa, setTestingWa] = useState<boolean>(false);
  const [testingTg, setTestingTg] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/isp');
      if (res) {
        setSettings(res.setting || res.data || res);
      }
    } catch (e) {
      console.error('Failed to load ISP settings:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setActionMessage(null);

    try {
      await api.post('/settings/isp', settings);
      setActionMessage({
        type: 'success',
        text: 'Pengaturan ISP & Gateway Notifikasi berhasil disimpan!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Gagal menyimpan pengaturan: ${err.message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestRouter = async () => {
    setTestingRouter(true);
    setActionMessage(null);
    try {
      const res = await api.post('/settings/test-router');
      setActionMessage({
        type: 'success',
        text: res.message || 'Koneksi ke RouterOS MikroTik BERHASIL terhubung!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Koneksi MikroTik GAGAL: ${err.message}`,
      });
    } finally {
      setTestingRouter(false);
    }
  };

  const handleTestWa = async () => {
    setTestingWa(true);
    setActionMessage(null);
    try {
      const res = await api.post('/settings/test-wa');
      setActionMessage({
        type: 'success',
        text: res.message || 'Pesan tes WhatsApp Fonnte berhasil dikirim!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Tes WhatsApp GAGAL: ${err.message}`,
      });
    } finally {
      setTestingWa(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTg(true);
    setActionMessage(null);
    try {
      const res = await api.post('/settings/test-telegram');
      setActionMessage({
        type: 'success',
        text: res.message || 'Notifikasi tes Bot Telegram berhasil dikirim!',
      });
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `Tes Telegram GAGAL: ${err.message}`,
      });
    } finally {
      setTestingTg(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Pengaturan ISP & Gateway Notifikasi</h1>
            <p className="text-xs text-slate-500">Konfigurasi RouterOS Core, WhatsApp Gateway (Fonnte) & Bot Telegram Alert</p>
          </div>
        </div>

        <button
          onClick={loadSettings}
          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Profil ISP */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Profil Perusahaan ISP</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama ISP / Brand</label>
              <input
                type="text"
                value={settings.nama_isp || ''}
                onChange={(e) => setSettings({ ...settings, nama_isp: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telepon Support CS</label>
              <input
                type="text"
                value={settings.telepon_support || ''}
                onChange={(e) => setSettings({ ...settings, telepon_support: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Kantor Operasional</label>
              <input
                type="text"
                value={settings.alamat_kantor || ''}
                onChange={(e) => setSettings({ ...settings, alamat_kantor: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: RouterOS MikroTik Core */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Router className="w-4 h-4 text-blue-600" />
              <span>Koneksi RouterOS MikroTik Core</span>
            </h3>
            <button
              type="button"
              onClick={handleTestRouter}
              disabled={testingRouter}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{testingRouter ? 'Testing...' : 'Test Router'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">IP Router / Host</label>
              <input
                type="text"
                value={settings.mikrotik_ip || ''}
                onChange={(e) => setSettings({ ...settings, mikrotik_ip: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">API Port</label>
              <input
                type="number"
                value={settings.mikrotik_port || 8728}
                onChange={(e) => setSettings({ ...settings, mikrotik_port: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username API</label>
              <input
                type="text"
                value={settings.mikrotik_user || ''}
                onChange={(e) => setSettings({ ...settings, mikrotik_user: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Gateway Fonnte */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Gateway (Fonnte)</span>
            </h3>
            <button
              type="button"
              onClick={handleTestWa}
              disabled={testingWa}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingWa ? 'Testing...' : 'Test WhatsApp'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Fonnte API Token</label>
              <input
                type="password"
                placeholder="Masukkan API Token Fonnte..."
                value={settings.fonnte_token || ''}
                onChange={(e) => setSettings({ ...settings, fonnte_token: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ID Grup WhatsApp NOC</label>
              <input
                type="text"
                placeholder="ID Grup WhatsApp NOC"
                value={settings.fonnte_group_noc || ''}
                onChange={(e) => setSettings({ ...settings, fonnte_group_noc: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ID Grup WhatsApp Teknisi</label>
              <input
                type="text"
                placeholder="ID Grup WhatsApp Teknisi"
                value={settings.fonnte_group_teknisi || ''}
                onChange={(e) => setSettings({ ...settings, fonnte_group_teknisi: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Telegram Bot Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <span>Bot Telegram Alert Notifikasi</span>
            </h3>
            <button
              type="button"
              onClick={handleTestTelegram}
              disabled={testingTg}
              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testingTg ? 'Testing...' : 'Test Telegram'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telegram Bot Token</label>
              <input
                type="password"
                placeholder="Contoh: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={settings.telegram_bot_token || ''}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                placeholder="Contoh: -1001234567890"
                value={settings.telegram_chat_id || ''}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

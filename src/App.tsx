import React, { useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { useIOMS, IOMSProvider } from './context/IOMSContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarNav } from './components/SidebarNav';
import { HeaderNavbar } from './components/HeaderNavbar';

// Views
import { HelpdeskView } from './components/views/HelpdeskView';
import { BuatTiketView } from './components/views/BuatTiketView';
import { ServiceRegistrationsView } from './components/views/ServiceRegistrationsView';
import { NOCDashboardView } from './components/views/NOCDashboardView';
import { FinanceBillingView } from './components/views/FinanceBillingView';
import { InventoryWarehouseView } from './components/views/InventoryWarehouseView';
import { InterDivisionKanbanView } from './components/views/InterDivisionKanbanView';
import { NetworkMappingView } from './components/views/NetworkMappingView';
import { ManagementDashboardView } from './components/views/ManagementDashboardView';
import { SuperadminDashboardView } from './components/views/SuperadminDashboardView';
import { AboutView } from './components/views/AboutView';
import { PelangganView } from './components/views/PelangganView';
import { PenagihanView } from './components/views/PenagihanView';
import { RequestPppoeNocView } from './components/views/RequestPppoeNocView';
import { RequestRembesView } from './components/views/RequestRembesView';
import { ApprovalRembesFinanceView } from './components/views/ApprovalRembesFinanceView';
import { LaporanKeuanganView } from './components/views/LaporanKeuanganView';
import { ReturGudangPerangkatView } from './components/views/ReturGudangPerangkatView';
import { PanelKepalaTeknisiView } from './components/views/PanelKepalaTeknisiView';
import { PanelTeknisiLapanganView } from './components/views/PanelTeknisiLapanganView';
import { PengerjaanInstalasiLapanganView } from './components/views/PengerjaanInstalasiLapanganView';
import { QCInstalasiNocView } from './components/views/QCInstalasiNocView';
import { RegistrasiPelangganBaruView } from './components/views/RegistrasiPelangganBaruView';
import { ValidasiRegistrasiView } from './components/views/ValidasiRegistrasiView';
import { SurveyInstalasiView } from './components/views/SurveyInstalasiView';
import { RequestGudangInstalasiView } from './components/views/RequestGudangInstalasiView';
import { AktivasiInstalasiView } from './components/views/AktivasiInstalasiView';
import { RequestPengadaanBarangView } from './components/views/RequestPengadaanBarangView';
import { StokBarangView } from './components/views/StokBarangView';
import { InventoryPopView } from './components/views/InventoryPopView';

// Modals
import { NewTicketModal } from './components/modals/NewTicketModal';
import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { NewTaskModal } from './components/modals/NewTaskModal';
import { NewProcurementModal } from './components/modals/NewProcurementModal';
import { TicketDetailTimelineModal } from './components/modals/TicketDetailTimelineModal';
import { ArchitectureSpecsModal } from './components/modals/ArchitectureSpecsModal';
import { WorkflowGuideModal } from './components/modals/WorkflowGuideModal';
import { NotificationToastContainer } from './components/NotificationToastContainer';
import { AppModule, TroubleTicket } from './types';
import { LoaderCircle } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { getDashboardModuleForRole, getResolvedAllowedModules, getRoleWorkspace } from './config/roleWorkspace';
import { getDefaultRouteForRole, getRoutePathForModule } from './routing/moduleRoutes';

const FullScreenLoader: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
    <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-xl flex items-center gap-3 text-slate-700">
      <LoaderCircle className="w-5 h-5 animate-spin text-emerald-600" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  </div>
);

const ProtectedRoute: React.FC = () => {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenLoader label="Memulihkan sesi aplikasi..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <IOMSProvider>
      <Outlet />
    </IOMSProvider>
  );
};

const LoginRoute: React.FC = () => {
  const { isAuthenticated, status } = useAuth();

  if (status === 'loading') {
    return <FullScreenLoader label="Memeriksa sesi login..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <LoginPage />;
};

const MainIOMSApp: React.FC = () => {
  const {
    selectedModule,
    activeRole,
    currentUser,
    navigationConfig,
    notifications,
    dismissNotification,
    isSoundEnabled,
    toggleSoundEnabled,
  } = useIOMS();
  const location = useLocation();

  // Modals & Drawer state
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProcurementModalOpen, setIsProcurementModalOpen] = useState(false);
  const [isArchSpecsModalOpen, setIsArchSpecsModalOpen] = useState(false);
  const [isWorkflowGuideOpen, setIsWorkflowGuideOpen] = useState(false);
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<TroubleTicket | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleWorkspace = getRoleWorkspace(activeRole);
  const allowedModules = getResolvedAllowedModules(activeRole, navigationConfig);
  const preferredHomeModule = getDashboardModuleForRole(activeRole, currentUser.dashboardModuleKey);
  const activeModule = activeRole === 'superadmin'
    ? selectedModule
    : allowedModules.includes(selectedModule) || selectedModule === preferredHomeModule
    ? selectedModule
    : (allowedModules.includes(preferredHomeModule) ? preferredHomeModule : allowedModules[0] ?? preferredHomeModule);
  const fallbackRoute = getDefaultRouteForRole(activeRole, currentUser.dashboardModuleKey, navigationConfig);
  const showFooter = roleWorkspace.shellMode !== 'standalone';
  const canOpenSidebar = roleWorkspace.showSidebarNavigation && allowedModules.length > 1;

  if (location.pathname === '/app' || location.pathname === '/app/') {
    return <Navigate to={fallbackRoute} replace />;
  }

  if (selectedModule !== activeModule) {
    return <Navigate to={getRoutePathForModule(activeModule)} replace />;
  }

  const renderModuleView = (moduleId: AppModule) => {
    switch (moduleId) {
      case 'dashboard':
        return activeRole === 'superadmin'
          ? <SuperadminDashboardView selectedModule={activeModule} />
          : <ManagementDashboardView />;
      case 'about':
        return <AboutView />;
      case 'pelanggan':
        return <PelangganView />;
      case 'penagihan':
        return <PenagihanView />;
      case 'request_pppoe_noc':
        return <RequestPppoeNocView />;
      case 'request_rembes':
        return <RequestRembesView />;
      case 'approval_rembes_finance':
        return <ApprovalRembesFinanceView />;
      case 'laporan_keuangan':
        return <LaporanKeuanganView />;
      case 'retur_gudang_perangkat':
        return <ReturGudangPerangkatView />;
      case 'panel_kepala_teknisi':
      case 'lead_tech':
        return <PanelKepalaTeknisiView />;
      case 'panel_teknisi_lapangan':
      case 'field_tech':
        return <PanelTeknisiLapanganView />;
      case 'pengerjaan_instalasi_lapangan':
        return <PengerjaanInstalasiLapanganView />;
      case 'qc_instalasi_noc':
        return <QCInstalasiNocView />;
      case 'registrasi_pelanggan_baru':
        return <RegistrasiPelangganBaruView />;
      case 'validasi_registrasi':
        return <ValidasiRegistrasiView />;
      case 'survey_instalasi':
        return <SurveyInstalasiView />;
      case 'request_gudang_instalasi':
        return <RequestGudangInstalasiView />;
      case 'aktivasi_instalasi':
        return <AktivasiInstalasiView />;
      case 'service_registrations':
        return <ServiceRegistrationsView onOpenNewRegistration={() => setIsCustomerModalOpen(true)} />;
      case 'helpdesk':
        return (
          <HelpdeskView
            onOpenNewTicket={() => setIsTicketModalOpen(true)}
            onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
          />
        );
      case 'buat_tiket':
        return (
          <BuatTiketView
            onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
          />
        );
      case 'noc':
        return (
          <NOCDashboardView
            onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
          />
        );
      case 'finance':
        return <FinanceBillingView />;
      case 'inventory':
        return (
          <InventoryWarehouseView
            onOpenNewProcurement={() => setIsProcurementModalOpen(true)}
          />
        );
      case 'stok_barang':
        return <StokBarangView />;
      case 'inventory_pop':
        return <InventoryPopView />;
      case 'request_pengadaan_barang':
        return <RequestPengadaanBarangView />;
      case 'kanban':
        return (
          <InterDivisionKanbanView
            onOpenNewTask={() => setIsTaskModalOpen(true)}
          />
        );
      case 'network_map':
        return <NetworkMappingView />;
      case 'admin_users':
      case 'admin_roles':
      case 'admin_master':
      case 'admin_modules':
      case 'admin_module_roles':
      case 'admin_mappings':
      case 'admin_audit':
        return <SuperadminDashboardView selectedModule={moduleId} />;
      default:
        return <ManagementDashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans text-slate-900">
      <HeaderNavbar
        onOpenArchSpecs={() => setIsArchSpecsModalOpen(true)}
        onOpenWorkflowGuide={() => setIsWorkflowGuideOpen(true)}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {sidebarOpen && canOpenSidebar && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <SidebarNav
              onOpenTechSpecs={() => {
                setSidebarOpen(false);
                setIsArchSpecsModalOpen(true);
              }}
              onOpenWorkflowGuide={() => {
                setSidebarOpen(false);
                setIsWorkflowGuideOpen(true);
              }}
            />
          </div>
        </div>
      )}

      <main className={`flex-1 w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-4 ${
        roleWorkspace.shellMode === 'standalone' ? 'max-w-[1440px]' : 'max-w-7xl'
      }`}>
        <div className="transition-all duration-200">
          {renderModuleView(activeModule)}
        </div>
      </main>

      {showFooter && (
        <footer className="bg-white border-t border-slate-200 py-3 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {roleWorkspace.title}
              </span>
              <span className="text-slate-300">|</span>
              <span>Versi 1.0 Production</span>
            </div>
          </div>
        </footer>
      )}

      <NotificationToastContainer
        notifications={notifications}
        onDismiss={dismissNotification}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSoundEnabled}
      />

      <NewTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />
      <NewCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
      />
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <NewProcurementModal
        isOpen={isProcurementModalOpen}
        onClose={() => setIsProcurementModalOpen(false)}
      />
      <TicketDetailTimelineModal
        ticket={selectedTicketDetail}
        onClose={() => setSelectedTicketDetail(null)}
      />
      <ArchitectureSpecsModal
        isOpen={isArchSpecsModalOpen}
        onClose={() => setIsArchSpecsModalOpen(false)}
      />
      <WorkflowGuideModal
        isOpen={isWorkflowGuideOpen}
        onClose={() => setIsWorkflowGuideOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/app" element={<MainIOMSApp />} />
            <Route path="/app/dashboard" element={<MainIOMSApp />} />
            <Route path="/app/about" element={<MainIOMSApp />} />
            <Route path="/app/pelanggan" element={<MainIOMSApp />} />
            <Route path="/app/penagihan" element={<MainIOMSApp />} />
            <Route path="/app/request-pppoe-noc" element={<MainIOMSApp />} />
            <Route path="/app/request-rembes" element={<MainIOMSApp />} />
            <Route path="/app/approval-rembes-finance" element={<MainIOMSApp />} />
            <Route path="/app/laporan-keuangan" element={<MainIOMSApp />} />
            <Route path="/app/retur-gudang-perangkat" element={<MainIOMSApp />} />
            <Route path="/app/panel-kepala-teknisi" element={<MainIOMSApp />} />
            <Route path="/app/panel-teknisi-lapangan" element={<MainIOMSApp />} />
            <Route path="/app/pengerjaan-instalasi-lapangan" element={<MainIOMSApp />} />
            <Route path="/app/qc-instalasi-noc" element={<MainIOMSApp />} />
            <Route path="/app/registrasi-pelanggan-baru" element={<MainIOMSApp />} />
            <Route path="/app/validasi-registrasi" element={<MainIOMSApp />} />
            <Route path="/app/survey-instalasi" element={<MainIOMSApp />} />
            <Route path="/app/request-gudang-instalasi" element={<MainIOMSApp />} />
            <Route path="/app/aktivasi-instalasi" element={<MainIOMSApp />} />
            <Route path="/app/service-registrations" element={<MainIOMSApp />} />
            <Route path="/app/helpdesk" element={<MainIOMSApp />} />
            <Route path="/app/buat-tiket" element={<MainIOMSApp />} />
            <Route path="/app/noc" element={<MainIOMSApp />} />
            <Route path="/app/lead-tech" element={<MainIOMSApp />} />
            <Route path="/app/field-tech" element={<MainIOMSApp />} />
            <Route path="/app/finance" element={<MainIOMSApp />} />
            <Route path="/app/inventory" element={<MainIOMSApp />} />
            <Route path="/app/stok-barang" element={<MainIOMSApp />} />
            <Route path="/app/inventory-pop" element={<MainIOMSApp />} />
            <Route path="/app/request-pengadaan-barang" element={<MainIOMSApp />} />
            <Route path="/app/kanban" element={<MainIOMSApp />} />
            <Route path="/app/network-map" element={<MainIOMSApp />} />
            <Route path="/app/admin" element={<MainIOMSApp />} />
            <Route path="/app/admin/users" element={<MainIOMSApp />} />
            <Route path="/app/admin/roles" element={<MainIOMSApp />} />
            <Route path="/app/admin/master" element={<MainIOMSApp />} />
            <Route path="/app/admin/modules" element={<MainIOMSApp />} />
            <Route path="/app/admin/module-roles" element={<MainIOMSApp />} />
            <Route path="/app/admin/mappings" element={<MainIOMSApp />} />
            <Route path="/app/admin/audit" element={<MainIOMSApp />} />
            <Route path="/app/*" element={<MainIOMSApp />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

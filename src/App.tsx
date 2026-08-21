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
import { SearchAndFilterBar } from './components/SearchAndFilterBar';

// Views
import { HelpdeskView } from './components/views/HelpdeskView';
import { ServiceRegistrationsView } from './components/views/ServiceRegistrationsView';
import { NOCDashboardView } from './components/views/NOCDashboardView';
import { LeadTechDashboardView } from './components/views/LeadTechDashboardView';
import { FieldTechMobileView } from './components/views/FieldTechMobileView';
import { FinanceBillingView } from './components/views/FinanceBillingView';
import { InventoryWarehouseView } from './components/views/InventoryWarehouseView';
import { InterDivisionKanbanView } from './components/views/InterDivisionKanbanView';
import { NetworkMappingView } from './components/views/NetworkMappingView';
import { ManagementDashboardView } from './components/views/ManagementDashboardView';
import { SuperadminDashboardView } from './components/views/SuperadminDashboardView';

// Modals
import { NewTicketModal } from './components/modals/NewTicketModal';
import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { NewTaskModal } from './components/modals/NewTaskModal';
import { NewProcurementModal } from './components/modals/NewProcurementModal';
import { TicketDetailTimelineModal } from './components/modals/TicketDetailTimelineModal';
import { ArchitectureSpecsModal } from './components/modals/ArchitectureSpecsModal';
import { WorkflowGuideModal } from './components/modals/WorkflowGuideModal';
import { AppModule, TroubleTicket } from './types';
import { LoaderCircle } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { getRoleWorkspace } from './config/roleWorkspace';

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
    return <Navigate to="/" replace />;
  }

  return <LoginPage />;
};

const MainIOMSApp: React.FC = () => {
  const {
    selectedModule,
    activeRole,
  } = useIOMS();

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
  const activeModule = roleWorkspace.allowedModules.includes(selectedModule)
    ? selectedModule
    : roleWorkspace.defaultModule;
  const showSearchBar = roleWorkspace.shellMode === 'compact';
  const showFooter = roleWorkspace.shellMode !== 'standalone';
  const canOpenSidebar = roleWorkspace.showSidebarNavigation && roleWorkspace.allowedModules.length > 1;

  const renderModuleView = (moduleId: AppModule) => {
    switch (moduleId) {
      case 'dashboard':
        return activeRole === 'superadmin'
          ? <SuperadminDashboardView selectedModule={activeModule} />
          : <ManagementDashboardView />;
      case 'service_registrations':
        return <ServiceRegistrationsView onOpenNewRegistration={() => setIsCustomerModalOpen(true)} />;
      case 'helpdesk':
        return (
          <HelpdeskView
            onOpenNewTicket={() => setIsTicketModalOpen(true)}
            onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
          />
        );
      case 'noc':
        return (
          <NOCDashboardView
            onSelectTicket={(ticket) => setSelectedTicketDetail(ticket)}
          />
        );
      case 'lead_tech':
        return <LeadTechDashboardView />;
      case 'field_tech':
        return <FieldTechMobileView />;
      case 'finance':
        return <FinanceBillingView />;
      case 'inventory':
        return (
          <InventoryWarehouseView
            onOpenNewProcurement={() => setIsProcurementModalOpen(true)}
          />
        );
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
        {showSearchBar && (
          <SearchAndFilterBar
            onOpenNewTicket={() => setIsTicketModalOpen(true)}
            onOpenNewCustomer={() => setIsCustomerModalOpen(true)}
            onOpenNewTask={() => setIsTaskModalOpen(true)}
            onOpenNewProcurement={() => setIsProcurementModalOpen(true)}
          />
        )}

        <div className="transition-all duration-200">
          {renderModuleView(activeModule)}
        </div>
      </main>

      {showFooter && (
        <footer className="bg-white border-t border-slate-200 py-3 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {roleWorkspace.title}
              </span>
              <span className="text-slate-300">|</span>
              <span>Versi 1.0 Production</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsWorkflowGuideOpen(true)}
                className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
              >
                Panduan 6 Alur Kerja
              </button>
              <button
                onClick={() => setIsArchSpecsModalOpen(true)}
                className="text-slate-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
              >
                Spesifikasi Backend
              </button>
            </div>
          </div>
        </footer>
      )}

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
            <Route path="/" element={<MainIOMSApp />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

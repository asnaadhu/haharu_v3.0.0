import React from 'react';
import { motion } from 'motion/react';
import { PropertyProvider, useProperty } from './context/PropertyContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { RoomInventoryView } from './components/RoomInventoryView';
import { BedAssignmentsView } from './components/BedAssignmentsView';
import { PropertySettingsView } from './components/PropertySettingsView';
import { MaintenanceView } from './components/MaintenanceView';
import { UserManagementView } from './components/UserManagementView';
import { ReportsView } from './components/ReportsView';
import { PropertyAvailabilityView } from './components/PropertyAvailabilityView';
import { FoodWasteTrackerView } from './components/FoodWasteTrackerView';
import { TransferTrackerView } from './components/TransferTrackerView';
import { LoginPage } from './components/LoginPage';

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, isLoading } = useProperty();
  const { isAuthenticated, canAccessModule, currentUser } = useAuth();

  // Auto-redirect if active tab is not allowed for current role
  React.useEffect(() => {
    if (!isAuthenticated) return;

    let isTabAllowed = true;
    if (activeTab === 'dashboard') {
      isTabAllowed = canAccessModule('dashboard');
    } else if (activeTab === 'availability') {
      isTabAllowed = canAccessModule('availability');
    } else if (activeTab === 'transferTracker') {
      isTabAllowed = canAccessModule('transferTracker');
    } else if (activeTab === 'foodWaste') {
      isTabAllowed = canAccessModule('foodWaste');
    } else if (activeTab === 'inventory') {
      isTabAllowed = canAccessModule('inventory') || canAccessModule('settings');
    } else if (activeTab === 'assignments') {
      isTabAllowed = canAccessModule('assignments');
    } else if (activeTab === 'maintenance') {
      isTabAllowed = canAccessModule('maintenance');
    } else if (activeTab === 'users') {
      isTabAllowed = canAccessModule('users');
    } else if (activeTab === 'reports') {
      isTabAllowed = canAccessModule('reports');
    } else if (activeTab === 'settings') {
      isTabAllowed = canAccessModule('settings') || canAccessModule('inventory') || canAccessModule('users');
    }

    if (!isTabAllowed) {
      if (canAccessModule('dashboard')) {
        setActiveTab('dashboard');
      } else if (canAccessModule('reports')) {
        setActiveTab('reports');
      }
    }
  }, [activeTab, currentUser.role, currentUser.modulePermissions, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F9F9F8] text-[#1A1A1A] font-semibold text-sm">
        <div className="flex items-center gap-3 bg-white p-6 border border-[#E5E5E1] shadow-md">
          <div className="w-5 h-5 border-2 border-[#1A1A1A] border-t-transparent rounded-full animate-spin" />
          <span className="text-base font-bold">Loading Housing & Accommodation System...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F9F8] text-[#1A1A1A] antialiased font-sans">
      {/* Side Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-12 max-w-7xl w-full mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'availability' && <PropertyAvailabilityView />}
            {activeTab === 'assignments' && <BedAssignmentsView />}
            {activeTab === 'transferTracker' && <TransferTrackerView />}
            {activeTab === 'foodWaste' && <FoodWasteTrackerView />}
            {activeTab === 'maintenance' && <MaintenanceView />}
            {(activeTab === 'settings' || activeTab === 'inventory') && <PropertySettingsView initialSubTab="buildings" />}
            {activeTab === 'users' && <PropertySettingsView initialSubTab="users" />}
            {activeTab === 'reports' && <ReportsView />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PropertyProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </PropertyProvider>
  );
}


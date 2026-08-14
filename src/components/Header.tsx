import React from 'react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Bed, CheckCircle2, Wrench, LogOut, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeTab, data, toggleMobileMenu } = useProperty();
  const { logout } = useAuth();

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard',
      subtitle: 'Real-time occupancy metrics, available beds, and active maintenance alerts.',
    },
    inventory: {
      title: 'Room Inventory Overview',
      subtitle: 'Manage individual rooms across buildings and customize default bed capacities.',
    },
    assignments: {
      title: 'Bed Assignments & Roster',
      subtitle: 'Assign or check out team members with automatic room status synchronization.',
    },
    transferTracker: {
      title: 'Transfer Tracker',
      subtitle: 'Track team member travel transfers, PSA records, arrival & departure tickets, and transit rates.',
    },
    foodWaste: {
      title: 'Food Waste Tracker',
      subtitle: 'Log and monitor meal service waste weights, dining hall locations, and preparation efficiency.',
    },
    maintenance: {
      title: 'Maintenance Request Portal',
      subtitle: 'Track property repairs, assign technicians, update urgency, and complete tickets.',
    },
    users: {
      title: 'User Accounts & Access Control',
      subtitle: 'Manage user profiles, assign roles (Admin, Property Manager, Staff, Tenant).',
    },
    reports: {
      title: 'Reports',
      subtitle: 'Generate and export occupancy, room capacity, bed roster, and maintenance reports in PDF, Excel, and CSV formats.',
    },
    settings: {
      title: 'Settings & Administration',
      subtitle: 'Manage property settings (buildings, room inventory, statuses) and user management.',
    },
  };

  const current = titleMap[activeTab] || titleMap.dashboard;

  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter((b) => b.assignedTo != null).length;
  const openMaintenanceCount = (data.maintenanceRequests || []).filter((r) => r.status !== 'Completed').length;
  const vacantBeds = totalBeds - occupiedBeds;

  const activeBuildingName = data.buildings[0]?.name || 'Main Residential Block';

  return (
    <>
      <header className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-[#E5E5E1] bg-white sticky top-0 z-20 shrink-0 font-sans">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Navigation Toggle Button */}
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-[#1A1A1A] hover:bg-[#F0F0EE] rounded-xs lg:hidden transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-[#1A1A1A] truncate max-w-[180px] sm:max-w-none">
            {current.title}
          </h1>
          <div className="h-4 w-[1px] bg-[#E5E5E1] hidden md:block"></div>
          <div className="hidden lg:flex space-x-6">
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F]">
              Active Property: <span className="text-[#1A1A1A]">{activeBuildingName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Stat Pill 1: Available */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xs bg-[#F9F9F8] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-bold">{vacantBeds}</span>
            <span className="text-[#666662] hidden md:inline">Vacant</span>
          </div>

          {/* Quick Stat Pill 2: Occupied */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xs bg-[#F9F9F8] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium">
            <Bed className="w-3.5 h-3.5 text-[#1A1A1A]" />
            <span className="font-bold">{occupiedBeds}</span>
            <span className="text-[#666662] hidden md:inline">Assigned</span>
          </div>

          {/* Quick Stat Pill 3: Maintenance Alerts */}
          {openMaintenanceCount > 0 && (
            <div className="hidden xs:flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xs bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>{openMaintenanceCount}</span>
              <span className="hidden sm:inline">Repairs</span>
            </div>
          )}

          {/* User & Sign Out */}
          <div className="flex items-center space-x-2 pl-2 sm:pl-4 border-l border-[#E5E5E1]">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border border-[#E5E5E1] hover:bg-[#F0F0EE] text-[#666662] hover:text-[#9E2A2B] rounded-xs text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};


import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useProperty } from '../../context/PropertyContext';
import { UserRole } from '../../types';
import { ShieldCheck, X, Check, Users, ShieldAlert, Building2, Wrench, User, LogOut } from 'lucide-react';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_PRESETS: {
  role: UserRole;
  name: string;
  badge: string;
  color: string;
  permissions: string[];
  description: string;
}[] = [
  {
    role: 'Admin',
    name: 'James Dalton',
    badge: 'Full Authorization',
    color: 'bg-[#1A1A1A] text-white border-[#1A1A1A]',
    permissions: [
      'Full access to Dashboard & Analytics',
      'Manage Property Config (Buildings, Floors, Types)',
      'Manage Rooms, Beds & Assignments',
      'Full Maintenance Request Control & Assignments',
      'User Account & Role Administration',
    ],
    description: 'Executive Operations Lead with unrestricted system rights across all properties.',
  },
  {
    role: 'Property Manager',
    name: 'Sarah Jenkins',
    badge: 'Property Scope',
    color: 'bg-indigo-900 text-white border-indigo-900',
    permissions: [
      'Dashboard & Inventory for assigned properties',
      'Create and edit rooms & bed configurations',
      'Assign & checkout team members',
      'Prioritize & assign maintenance technicians',
      'Restricted from deleting core property infrastructure',
    ],
    description: 'Manager overseeing Horizon Tower A & Cedar Block B operations.',
  },
  {
    role: 'Staff',
    name: 'Alex Rivera',
    badge: 'Operations & Facilities',
    color: 'bg-emerald-900 text-white border-emerald-900',
    permissions: [
      'View Room Inventory & Bed Assignments',
      'Update bed statuses (Cleaning, Occupied, Vacant)',
      'View & update maintenance request statuses',
      'Record technician resolution notes',
      'Restricted from modifying core property settings',
    ],
    description: 'Facilities & Maintenance Lead responsible for inspections & repairs.',
  },
  {
    role: 'Tenant',
    name: 'David Vance',
    badge: 'Resident Portal',
    color: 'bg-amber-900 text-white border-amber-900',
    permissions: [
      'View personal residence, bed number & roommates',
      'Submit maintenance requests for assigned room/bed',
      'Track real-time maintenance ticket status',
      'Restricted from viewing property management tools',
    ],
    description: 'Resident assigned to Horizon Tower A, Room #101 Bed 1.',
  },
  {
    role: 'View Only (Dashboard & Reports)',
    name: 'Auditor / Observer',
    badge: 'View Only',
    color: 'bg-amber-400 text-[#1A1A1A] border-amber-400',
    permissions: [
      'View Dashboard KPI analytics and occupancy metrics',
      'View & export comprehensive operational Reports',
      'Restricted from creating, editing, or deleting data',
      'Restricted from Inventory, Assignments & Users',
    ],
    description: 'Read-only observer role for executive oversight and audit reporting.',
  },
];

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, switchUserById, switchRole, logout } = useAuth();
  const { data, setActiveTab } = useProperty();

  if (!isOpen) return null;

  const handleSelectRole = (role: UserRole) => {
    // Find matching user profile or switch
    const users = data.users || [];
    const matchedUser = users.find((u) => u.role === role);
    if (matchedUser) {
      switchUserById(matchedUser.id);
    } else {
      switchRole(role);
    }

    if (role === 'Staff') {
      setActiveTab('maintenance');
    } else {
      setActiveTab('dashboard');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white max-w-2xl w-full shadow-2xl overflow-hidden border border-[#E5E5E1] my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Switch Role / Preview Persona
              </h3>
              <p className="text-[10px] text-[#A3A39F] uppercase tracking-wider font-bold">
                Instantly evaluate permissions and interfaces for all 5 system roles
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#A3A39F] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="text-xs text-[#666662]">
            Current Active User: <span className="font-bold text-[#1A1A1A]">{currentUser.name}</span> ({currentUser.role})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLE_PRESETS.map((preset) => {
              const isActive = currentUser.role === preset.role;
              return (
                <div
                  key={preset.role}
                  onClick={() => handleSelectRole(preset.role)}
                  className={`p-4 border cursor-pointer transition-all ${
                    isActive
                      ? 'border-[#1A1A1A] bg-[#F9F9F8] shadow-sm ring-1 ring-[#1A1A1A]'
                      : 'border-[#E5E5E1] bg-white hover:border-[#1A1A1A] hover:bg-[#F0F0EE]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${preset.color}`}>
                      {preset.role}
                    </span>
                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A3A39F] font-bold uppercase tracking-widest hover:text-[#1A1A1A]">
                        Switch &rarr;
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-[#1A1A1A]">
                    {preset.name}
                  </h4>
                  <p className="text-[11px] text-[#666662] mb-3">
                    {preset.description}
                  </p>

                  <div className="border-t border-[#E5E5E1] pt-2 space-y-1">
                    <div className="text-[9px] font-bold text-[#A3A39F] uppercase tracking-wider">
                      Granted Permissions:
                    </div>
                    {preset.permissions.slice(0, 3).map((perm, i) => (
                      <div key={i} className="text-[10px] text-[#1A1A1A] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-[#1A1A1A] shrink-0" />
                        <span>{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F9F9F8] border-t border-[#E5E5E1] flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#E5E5E1] hover:bg-[#F0F0EE] text-[#9E2A2B] font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of System</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1A1A1A] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-[#333330] transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

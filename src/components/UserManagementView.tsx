import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth, DEFAULT_ROLE_PERMISSIONS } from '../context/AuthContext';
import { UserProfile, UserRole, ModulePermissions } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Building,
  BedDouble,
  Mail,
  Phone,
  Trash2,
  Edit3,
  Check,
  ShieldAlert,
  UserCheck,
  LayoutGrid,
  List,
  KeyRound,
  Eye,
  CheckCircle2,
  XCircle,
  Sliders,
  Table,
} from 'lucide-react';
import { UserModal } from './modals/UserModal';

export const UserManagementView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { data, deleteUser } = useProperty();
  const { currentUser, switchUserById, switchRole, canEditModule } = useAuth();

  const canManageUsers = currentUser.role === 'Admin' || canEditModule('users');

  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'matrix'>('accounts');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const users = data.users || [];

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchDept = (u.department || '').toLowerCase().includes(q);
      const matchEmp = (u.employeeId || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept && !matchEmp) return false;
    }

    if (selectedRoleFilter !== 'ALL' && u.role !== selectedRoleFilter) return false;

    return true;
  });

  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const pmCount = users.filter((u) => u.role === 'Property Manager').length;
  const staffCount = users.filter((u) => u.role === 'Staff').length;
  const tenantCount = users.filter((u) => u.role === 'Tenant').length;
  const viewOnlyCount = users.filter((u) => u.role === 'View Only (Dashboard & Reports)').length;

  const handleOpenAdd = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setUserToEdit(user);
    setIsUserModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setUserToDelete({ id, name });
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const ROLE_LIST: { name: UserRole; desc: string; badgeColor: string }[] = [
    {
      name: 'Admin',
      desc: 'Full unrestricted control across all modules, properties, users, and system settings.',
      badgeColor: 'bg-[#1A1A1A] text-white',
    },
    {
      name: 'Property Manager',
      desc: 'Full operational control over assigned properties, inventory, bed assignments, and maintenance.',
      badgeColor: 'bg-indigo-900 text-white',
    },
    {
      name: 'Staff',
      desc: 'View inventory and assignments, update bed statuses, and manage maintenance work orders.',
      badgeColor: 'bg-emerald-900 text-white',
    },
    {
      name: 'Tenant',
      desc: 'Resident portal view for tracking personal bed assignment and submitting maintenance requests.',
      badgeColor: 'bg-amber-900 text-white',
    },
    {
      name: 'View Only (Dashboard & Reports)',
      desc: 'Strictly restricted read-only access limited exclusively to Dashboard overview and Reports export.',
      badgeColor: 'bg-amber-400 text-[#1A1A1A]',
    },
  ];

  const renderPermBadge = (level: string) => {
    if (level === 'full') {
      return (
        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#1A1A1A] text-white rounded-xs">
          Full Access
        </span>
      );
    }
    if (level === 'view') {
      return (
        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-[#1A1A1A] rounded-xs">
          View Only
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#F0F0EE] text-[#A3A39F] rounded-xs">
        No Access
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E1] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
              Authorization & Access Control
            </span>
            <Shield className="w-3.5 h-3.5 text-[#1A1A1A]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mt-0.5">
            User Accounts & Module Permissions
          </h1>
        </div>

        {canManageUsers && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs self-start md:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User Account</span>
          </button>
        )}
      </div>

      {/* Role Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs">
          <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
            Administrators
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {adminCount}
          </span>
          <span className="text-[10px] text-[#A3A39F]">Full Rights</span>
        </div>

        <div className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-indigo-900">
          <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
            Property Managers
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {pmCount}
          </span>
          <span className="text-[10px] text-[#A3A39F]">Property Scope</span>
        </div>

        <div className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-emerald-800">
          <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
            Facilities Staff
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {staffCount}
          </span>
          <span className="text-[10px] text-[#A3A39F]">Maintenance</span>
        </div>

        <div className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-amber-800">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
            Tenants / Residents
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {tenantCount}
          </span>
          <span className="text-[10px] text-[#A3A39F]">Resident Portal</span>
        </div>

        <div className="bg-white p-3.5 border border-[#E5E5E1] shadow-2xs border-l-4 border-l-amber-400 col-span-2 md:col-span-1">
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block flex items-center gap-1">
            <Eye className="w-3 h-3 text-amber-600" />
            <span>View Only Role</span>
          </span>
          <span className="font-bold text-2xl text-[#1A1A1A] mt-0.5 block">
            {viewOnlyCount}
          </span>
          <span className="text-[10px] text-[#A3A39F]">Dashboard & Reports</span>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex border-b border-[#E5E5E1] bg-white">
        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
            activeSubTab === 'accounts'
              ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#F9F9F8]'
              : 'border-transparent text-[#666662] hover:text-[#1A1A1A]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-wider transition-colors border-b-2 ${
            activeSubTab === 'matrix'
              ? 'border-[#1A1A1A] text-[#1A1A1A] bg-[#F9F9F8]'
              : 'border-transparent text-[#666662] hover:text-[#1A1A1A]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Module Roles & Access Matrix</span>
        </button>
      </div>

      {activeSubTab === 'matrix' ? (
        /* MODULE ROLES & ACCESS MATRIX */
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
            <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold uppercase tracking-wider block mb-1">
                Module-Level Access Rights Breakdown
              </strong>
              Each role enforces granular permissions for every module. The <strong>View Only (Dashboard & Reports)</strong> role restricts access strictly to viewing the Dashboard and Reports, disabling operational changes across inventory, bed assignments, maintenance, user profiles, and system settings.
            </div>
          </div>

          <div className="bg-white border border-[#E5E5E1] overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4 min-w-[180px]">System Role</th>
                  <th className="py-3 px-2">Dashboard</th>
                  <th className="py-3 px-2">Availability</th>
                  <th className="py-3 px-2">Bed Assignments</th>
                  <th className="py-3 px-2">Food Waste</th>
                  <th className="py-3 px-2">Maintenance</th>
                  <th className="py-3 px-2">Reports</th>
                  <th className="py-3 px-2">Settings</th>
                  <th className="py-3 px-2">Inventory</th>
                  <th className="py-3 px-2">User Mgmt</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1]">
                {ROLE_LIST.map((roleObj) => {
                  const perms = DEFAULT_ROLE_PERMISSIONS[roleObj.name];
                  const isCurrentRole = currentUser.role === roleObj.name;

                  return (
                    <tr key={roleObj.name} className={`hover:bg-[#F9F9F8] transition-colors ${roleObj.name === 'View Only (Dashboard & Reports)' ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 ${roleObj.badgeColor}`}>
                            {roleObj.name}
                          </span>
                          {isCurrentRole && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 border border-emerald-300">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#666662] font-normal leading-tight">
                          {roleObj.desc}
                        </p>
                      </td>

                      <td className="py-4 px-2">{renderPermBadge(perms.dashboard)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.availability)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.assignments)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.foodWaste)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.maintenance)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.reports)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.settings)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.inventory)}</td>
                      <td className="py-4 px-2">{renderPermBadge(perms.users)}</td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => switchRole(roleObj.name)}
                          className="px-3 py-1.5 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Test Role
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ACCOUNTS DIRECTORY TAB */
        <>
          {/* Filter Toolbar */}
          <div className="bg-[#F9F9F8] p-4 border border-[#E5E5E1] flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A39F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search accounts by name, email, employee ID, or department..."
                className="w-full pl-9 pr-3 py-1.5 border border-[#E5E5E1] text-xs font-medium text-[#1A1A1A] bg-white focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Role Filter & View Switcher */}
            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="px-3 py-1.5 border border-[#E5E5E1] text-xs font-bold text-[#1A1A1A] bg-white focus:outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Property Manager">Property Manager</option>
                  <option value="Staff">Staff</option>
                  <option value="Tenant">Tenant</option>
                  <option value="View Only (Dashboard & Reports)">View Only (Dashboard & Reports)</option>
                </select>
              </div>

              {/* List / Grid Toggle */}
              <div className="flex items-center gap-1 bg-[#F0F0EE] p-1 border border-[#E5E5E1]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#1A1A1A] text-white shadow-2xs'
                      : 'text-[#666662] hover:text-[#1A1A1A]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>

                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1A1A1A] text-white shadow-2xs'
                      : 'text-[#666662] hover:text-[#1A1A1A]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid View</span>
                </button>
              </div>
            </div>
          </div>

          {/* Users Content */}
          {viewMode === 'grid' ? (
            /* Grid View Cards */
            filteredUsers.length === 0 ? (
              <div className="bg-white p-12 text-center border border-dashed border-[#E5E5E1]">
                <Users className="w-10 h-10 text-[#A3A39F] mx-auto mb-3" />
                <h3 className="text-[#1A1A1A] text-lg font-bold">No Users Found</h3>
                <p className="text-xs text-[#666662] mt-1">
                  No user accounts match your search query or role filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => {
                  const isLogged = currentUser.id === user.id;

                  let locationBadge = 'Global / All';
                  if (user.role === 'Property Manager' && user.assignedBuildingIds) {
                    const bldgNames = user.assignedBuildingIds
                      .map((id) => (data.buildings || []).find((b) => b.id === id)?.name)
                      .filter(Boolean);
                    locationBadge = bldgNames.length > 0 ? bldgNames.join(', ') : 'No building assigned';
                  } else if (user.role === 'Tenant' && user.assignedBedId) {
                    const bed = (data.beds || []).find((b) => b.id === user.assignedBedId);
                    const room = (data.rooms || []).find((r) => r.id === bed?.roomId);
                    const building = (data.buildings || []).find((b) => b.id === room?.buildingId);
                    locationBadge = building
                      ? `${building.name} • Rm #${room?.roomNumber}`
                      : 'Unassigned';
                  } else if (user.role === 'View Only (Dashboard & Reports)') {
                    locationBadge = 'Dashboard & Reports Only';
                  }

                  return (
                    <div
                      key={user.id}
                      className={`bg-white border p-6 shadow-xs flex flex-col justify-between ${
                        isLogged ? 'border-amber-400 bg-amber-50/20' : 'border-[#E5E5E1]'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-[#E5E5E1]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-base shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-[#1A1A1A] text-base leading-snug">
                                {user.name}
                              </h3>
                              <div className="text-[10px] text-[#A3A39F] font-mono">
                                ID: {user.employeeId || user.id}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 ${
                              user.role === 'Admin'
                                ? 'bg-[#1A1A1A] text-white'
                                : user.role === 'Property Manager'
                                ? 'bg-indigo-900 text-white'
                                : user.role === 'Staff'
                                ? 'bg-emerald-900 text-white'
                                : user.role === 'View Only (Dashboard & Reports)'
                                ? 'bg-amber-400 text-[#1A1A1A]'
                                : 'bg-amber-900 text-white'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>

                        {/* Contact & Scope Details */}
                        <div className="py-4 space-y-2.5 text-xs text-[#666662]">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                            <span className="truncate font-medium text-[#1A1A1A]">{user.email}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                            <span className="font-mono text-xs text-[#1A1A1A]">
                              Password: <strong className="text-[#1A1A1A]">{user.password || '123456'}</strong>
                            </span>
                          </div>

                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-[#A3A39F] shrink-0" />
                            <span>Dept: <strong className="text-[#1A1A1A]">{user.department || 'Operations'}</strong></span>
                          </div>

                          <div className="pt-2 border-t border-[#F0F0EE] text-[11px]">
                            <span className="text-[10px] uppercase font-bold text-[#A3A39F] block mb-0.5">
                              Assigned Scope / Location
                            </span>
                            <span className="font-semibold text-[#1A1A1A]">{locationBadge}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-between">
                        <div>
                          {isLogged ? (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 border border-amber-300">
                              Active User
                            </span>
                          ) : (
                            <button
                              onClick={() => switchUserById(user.id)}
                              className="px-2.5 py-1 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Simulate
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-[#1A1A1A] hover:bg-[#F0F0EE] font-bold text-xs"
                            title="Edit Account"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 font-bold text-xs"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* List View Table */
            <div className="bg-white border border-[#E5E5E1] overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">User / Persona</th>
                    <th className="py-3 px-4">Role & Scope</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Assigned Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#A3A39F]">
                        No user accounts found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isLogged = currentUser.id === user.id;

                      let locationBadge = 'Global / All';
                      if (user.role === 'Property Manager' && user.assignedBuildingIds) {
                        const bldgNames = user.assignedBuildingIds
                          .map((id) => (data.buildings || []).find((b) => b.id === id)?.name)
                          .filter(Boolean);
                        locationBadge = bldgNames.length > 0 ? bldgNames.join(', ') : 'No building assigned';
                      } else if (user.role === 'Tenant' && user.assignedBedId) {
                        const bed = (data.beds || []).find((b) => b.id === user.assignedBedId);
                        const room = (data.rooms || []).find((r) => r.id === bed?.roomId);
                        const building = (data.buildings || []).find((b) => b.id === room?.buildingId);
                        locationBadge = building
                          ? `${building.name} • Rm #${room?.roomNumber} (${bed?.label})`
                          : 'Unassigned';
                      } else if (user.role === 'View Only (Dashboard & Reports)') {
                        locationBadge = 'Dashboard & Reports Only';
                      }

                      return (
                        <tr
                          key={user.id}
                          className={`hover:bg-[#F9F9F8] transition-colors ${
                            isLogged ? 'bg-amber-50/50 font-medium' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm text-[#1A1A1A] font-bold flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {isLogged && (
                                    <span className="text-[9px] font-sans font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 border border-amber-300">
                                      Active Persona
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#A3A39F] font-normal">
                                  ID: {user.employeeId || user.id}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 ${
                                user.role === 'Admin'
                                  ? 'bg-[#1A1A1A] text-white'
                                  : user.role === 'Property Manager'
                                  ? 'bg-indigo-900 text-white'
                                  : user.role === 'Staff'
                                  ? 'bg-emerald-900 text-white'
                                  : user.role === 'View Only (Dashboard & Reports)'
                                  ? 'bg-amber-400 text-[#1A1A1A]'
                                  : 'bg-amber-900 text-white'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-[#666662]">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#A3A39F]" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-[#1A1A1A] font-mono">
                              <KeyRound className="w-3 h-3 text-[#A3A39F]" />
                              <span>Pass: {user.password || '123456'}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-1 text-[10px] text-[#A3A39F]">
                                <Phone className="w-3 h-3 text-[#A3A39F]" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-[#1A1A1A] font-semibold">
                            {user.department || 'Operations'}
                          </td>

                          <td className="py-3 px-4 text-[#666662] max-w-[200px] truncate">
                            <span className="text-[11px] font-medium text-[#1A1A1A]">
                              {locationBadge}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right space-x-2">
                            {!isLogged && (
                              <button
                                onClick={() => switchUserById(user.id)}
                                className="px-2.5 py-1 border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                                title="Switch persona to test this role"
                              >
                                Simulate
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEdit(user)}
                              className="p-1 text-[#1A1A1A] hover:text-amber-700 font-bold"
                              title="Edit Account"
                            >
                              <Edit3 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.name)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        userToEdit={userToEdit}
      />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white border border-[#E5E5E1] shadow-2xl max-w-md w-full overflow-hidden rounded-xs"
          >
            <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">Delete User Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="text-[#A3A39F] hover:text-white p-1 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#666662] leading-relaxed">
                Are you sure you want to delete user account <strong className="text-[#1A1A1A] font-bold">"{userToDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-[#888880] bg-[#F9F9F8] p-3 border border-[#E5E5E1] rounded-xs">
                Deleting this account will remove user permissions and access to the system. This action cannot be undone.
              </p>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

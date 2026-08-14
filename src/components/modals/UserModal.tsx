import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { UserProfile, UserRole, ModulePermissions, ModuleAccessLevel } from '../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../context/AuthContext';
import { UserPlus, X, Save, Shield, Building, BedDouble, Mail, Phone, KeyRound, Lock, Eye, CheckCircle } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit: UserProfile | null;
}

const ROLES: { label: string; value: UserRole; desc: string }[] = [
  { label: 'Admin', value: 'Admin', desc: 'Full system control across all properties and settings' },
  { label: 'Property Manager', value: 'Property Manager', desc: 'Property Settings, Inventory, Dashboard & Bed Assignments' },
  { label: 'Staff', value: 'Staff', desc: 'Access to view assignments, update bed statuses & maintenance tickets' },
  { label: 'Tenant', value: 'Tenant', desc: 'Resident portal view to track bed assignment & submit maintenance' },
  { label: 'View Only (Dashboard & Reports)', value: 'View Only (Dashboard & Reports)', desc: 'Restricted read-only access limited strictly to Dashboard & Reports' },
];

const MODULE_KEYS: { id: keyof ModulePermissions; label: string; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard Module', desc: 'Overview metrics & property stats' },
  { id: 'availability', label: 'Property Availability', desc: 'Live vacancy, bed status & occupancy filter' },
  { id: 'assignments', label: 'Bed Assignments', desc: 'Member occupant check-ins & bed rosters' },
  { id: 'foodWaste', label: 'Food Waste Tracker', desc: 'Daily dining hall food waste log entries' },
  { id: 'maintenance', label: 'Maintenance & Tickets', desc: 'Incident reporting & work orders' },
  { id: 'reports', label: 'Reports & Export', desc: 'Occupancy logs & analytics downloads' },
  { id: 'inventory', label: 'Inventory & Buildings', desc: 'Buildings, floors, room types & status setups' },
  { id: 'users', label: 'User Management', desc: 'Account roles, credentials & access permissions' },
  { id: 'settings', label: 'System Settings', desc: 'Global configuration & master attributes' },
];

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, userToEdit }) => {
  const { data, addUser, updateUser } = useProperty();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedBuildingIds, setAssignedBuildingIds] = useState<string[]>([]);
  const [assignedBedId, setAssignedBedId] = useState('');
  const [customPermissions, setCustomPermissions] = useState<ModulePermissions>(
    DEFAULT_ROLE_PERMISSIONS['Staff']
  );
  const [showCustomPermissions, setShowCustomPermissions] = useState(false);

  useEffect(() => {
    if (userToEdit && isOpen) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setPassword(userToEdit.password || '123456');
      setRole(userToEdit.role);
      setEmployeeId(userToEdit.employeeId || '');
      setDepartment(userToEdit.department || '');
      setPhone(userToEdit.phone || '');
      setAssignedBuildingIds(userToEdit.assignedBuildingIds || []);
      setAssignedBedId(userToEdit.assignedBedId || '');

      const basePerms = DEFAULT_ROLE_PERMISSIONS[userToEdit.role] || DEFAULT_ROLE_PERMISSIONS['Staff'];
      setCustomPermissions({ ...basePerms, ...(userToEdit.modulePermissions || {}) });
      setShowCustomPermissions(!!userToEdit.modulePermissions);
    } else if (isOpen) {
      setName('');
      setEmail('');
      setPassword('123456');
      setRole('Staff');
      setEmployeeId('');
      setDepartment('');
      setPhone('');
      setAssignedBuildingIds([]);
      setAssignedBedId('');
      setCustomPermissions(DEFAULT_ROLE_PERMISSIONS['Staff']);
      setShowCustomPermissions(false);
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setCustomPermissions(DEFAULT_ROLE_PERMISSIONS[newRole] || DEFAULT_ROLE_PERMISSIONS['Staff']);
  };

  const handleModulePermChange = (moduleKey: keyof ModulePermissions, level: ModuleAccessLevel) => {
    setCustomPermissions((prev) => ({
      ...prev,
      [moduleKey]: level,
    }));
  };

  const handleBuildingToggle = (bId: string) => {
    if (assignedBuildingIds.includes(bId)) {
      setAssignedBuildingIds(assignedBuildingIds.filter((id) => id !== bId));
    } else {
      setAssignedBuildingIds([...assignedBuildingIds, bId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const cleanPassword = password.trim() || '123456';

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password: cleanPassword,
      role,
      ...(employeeId.trim() ? { employeeId: employeeId.trim() } : {}),
      ...(department.trim() ? { department: department.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(role === 'Property Manager' && assignedBuildingIds.length > 0 ? { assignedBuildingIds } : {}),
      ...(role === 'Tenant' && assignedBedId ? { assignedBedId } : {}),
      modulePermissions: showCustomPermissions ? customPermissions : DEFAULT_ROLE_PERMISSIONS[role],
    };

    if (userToEdit) {
      updateUser(userToEdit.id, payload);
    } else {
      addUser(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white max-w-lg w-full shadow-2xl overflow-hidden border border-[#E5E5E1] my-8 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">
              {userToEdit ? 'Edit User Account & Role' : 'Create New User Profile'}
            </h3>
          </div>
          <button onClick={onClose} className="text-[#A3A39F] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name & Email */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Mail className="w-3 h-3 text-[#A3A39F]" />
              <span>Email Address *</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sarah.j@haharu.com"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-[#A3A39F]" />
              <span>Login Password *</span>
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set account password (e.g. 123456)"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-mono font-semibold focus:outline-none focus:border-[#1A1A1A] bg-amber-50/20"
            />
            <p className="text-[10px] text-[#A3A39F] mt-1">
              This password is required for this user to sign in at the login screen.
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#1A1A1A]" />
              <span>Assigned System Role *</span>
            </label>
            <select
              value={role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label} &mdash; {r.desc}
                </option>
              ))}
            </select>
          </div>

          {/* Module-based Permissions Customization toggle */}
          <div className="bg-[#F9F9F8] p-3.5 border border-[#E5E5E1] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] block">
                  Module-Level Granular Permissions
                </span>
                <span className="text-[10px] text-[#A3A39F]">
                  Configure per-module access rights (Full Access, View Only, No Access)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomPermissions(!showCustomPermissions)}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white border border-[#E5E5E1] hover:bg-[#F0F0EE] text-[#1A1A1A]"
              >
                {showCustomPermissions ? 'Use Default Role Rights' : 'Customize Modules'}
              </button>
            </div>

            {/* Matrix Table */}
            <div className="space-y-2 pt-2 border-t border-[#E5E5E1]">
              {MODULE_KEYS.map((mod) => {
                const currentLevel = (showCustomPermissions ? customPermissions : (DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS['Staff']))[mod.id];
                return (
                  <div key={mod.id} className="flex items-center justify-between gap-2 p-2 bg-white border border-[#E5E5E1] text-xs">
                    <div>
                      <div className="font-bold text-[#1A1A1A] text-[11px]">{mod.label}</div>
                      <div className="text-[9px] text-[#A3A39F]">{mod.desc}</div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={!showCustomPermissions}
                        onClick={() => handleModulePermChange(mod.id, 'full')}
                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors ${
                          currentLevel === 'full'
                            ? 'bg-[#1A1A1A] text-white font-bold'
                            : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1]'
                        } ${!showCustomPermissions && 'opacity-80 cursor-default'}`}
                      >
                        Full
                      </button>
                      <button
                        type="button"
                        disabled={!showCustomPermissions}
                        onClick={() => handleModulePermChange(mod.id, 'view')}
                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors ${
                          currentLevel === 'view'
                            ? 'bg-amber-400 text-[#1A1A1A] font-bold'
                            : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1]'
                        } ${!showCustomPermissions && 'opacity-80 cursor-default'}`}
                      >
                        View Only
                      </button>
                      <button
                        type="button"
                        disabled={!showCustomPermissions}
                        onClick={() => handleModulePermChange(mod.id, 'none')}
                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-xs transition-colors ${
                          currentLevel === 'none'
                            ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                            : 'bg-[#F0F0EE] text-[#666662] hover:bg-[#E5E5E1]'
                        } ${!showCustomPermissions && 'opacity-80 cursor-default'}`}
                      >
                        No Access
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Department & Employee ID */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Employee ID
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. EMP-9021"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Facilities, Engineering"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#A3A39F]" />
              <span>Contact Phone Number</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 019-2834"
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none"
            />
          </div>

          {/* Conditional Property Manager assigned buildings */}
          {role === 'Property Manager' && (
            <div className="bg-[#F9F9F8] p-3.5 border border-[#E5E5E1] space-y-2">
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest">
                Assigned Properties / Buildings
              </label>
              <div className="space-y-1.5">
                {(data.buildings || []).map((b) => (
                  <label key={b.id} className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assignedBuildingIds.includes(b.id)}
                      onChange={() => handleBuildingToggle(b.id)}
                      className="w-4 h-4 text-[#1A1A1A] border-[#E5E5E1] focus:ring-0"
                    />
                    <span>{b.name} ({b.code})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Conditional Tenant assigned bed */}
          {role === 'Tenant' && (
            <div className="bg-[#F9F9F8] p-3.5 border border-[#E5E5E1] space-y-2">
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>Link Assigned Bed</span>
              </label>
              <select
                value={assignedBedId}
                onChange={(e) => setAssignedBedId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="">-- Unassigned / Pending Check-in --</option>
                {(data.beds || []).map((b) => {
                  const room = (data.rooms || []).find((r) => r.id === b.roomId);
                  const building = (data.buildings || []).find((bg) => bg.id === room?.buildingId);
                  return (
                    <option key={b.id} value={b.id}>
                      {building?.name} &bull; Room #{room?.roomNumber} &bull; {b.label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{userToEdit ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

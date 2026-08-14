import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { MaintenanceRequest, MaintenanceStatus, MaintenanceUrgency } from '../../types';
import { Wrench, X, CheckCircle2, UserCheck, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface EditMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: MaintenanceRequest | null;
}

const STATUS_OPTIONS: { label: string; value: MaintenanceStatus }[] = [
  { label: 'New Ticket', value: 'New' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Pending Parts', value: 'Pending Parts' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export const EditMaintenanceModal: React.FC<EditMaintenanceModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const { data, updateMaintenanceRequest, completeMaintenanceRequest } = useProperty();
  const { currentUser, hasPermission } = useAuth();

  const [status, setStatus] = useState<MaintenanceStatus>('New');
  const [urgency, setUrgency] = useState<MaintenanceUrgency>('Medium');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [assignedTechnicianPhone, setAssignedTechnicianPhone] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [revertRoomBedStatus, setRevertRoomBedStatus] = useState(true);

  useEffect(() => {
    if (request && isOpen) {
      setStatus(request.status);
      setUrgency(request.urgency);
      setAssignedTechnician(request.assignedTechnician || '');
      setAssignedTechnicianPhone(request.assignedTechnicianPhone || '');
      setResolutionNotes(request.resolutionNotes || '');
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const building = (data.buildings || []).find((b) => b.id === request.buildingId);
  const floor = (data.floors || []).find((f) => f.id === request.floorId);
  const room = (data.rooms || []).find((r) => r.id === request.roomId);
  const bed = (data.beds || []).find((b) => b.id === request.bedId);

  // Filter available staff or technicians from user accounts
  const staffMembers = (data.users || []).filter((u) => u.role === 'Staff' || u.role === 'Admin' || u.role === 'Property Manager');

  const handleTechnicianSelect = (techName: string) => {
    setAssignedTechnician(techName);
    const techUser = (data.users || []).find((u) => u.name === techName);
    if (techUser && techUser.phone) {
      setAssignedTechnicianPhone(techUser.phone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (status === 'Completed' && request.status !== 'Completed') {
      completeMaintenanceRequest(request.id, resolutionNotes, revertRoomBedStatus);
    } else {
      updateMaintenanceRequest(request.id, {
        status,
        urgency,
        ...(assignedTechnician ? { assignedTechnician } : {}),
        ...(assignedTechnicianPhone ? { assignedTechnicianPhone } : {}),
        ...(resolutionNotes.trim() ? { resolutionNotes: resolutionNotes.trim() } : {}),
      });
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
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Manage Maintenance Request
              </h3>
              <p className="text-[10px] text-[#A3A39F] uppercase tracking-wider font-bold">
                Ticket #{request.id.replace('maint-', '')} • {request.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#A3A39F] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Ticket Info Card */}
          <div className="bg-[#F9F9F8] p-4 border border-[#E5E5E1] space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#1A1A1A] text-white rounded-xs">
                  {request.category}
                </span>
                <h4 className="text-base font-bold text-[#1A1A1A] mt-1.5">
                  {request.title}
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-xs border ${
                  request.urgency === 'Urgent'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : request.urgency === 'High'
                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                    : request.urgency === 'Medium'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {request.urgency} Urgency
              </span>
            </div>

            {request.description && (
              <p className="text-xs text-[#666662] bg-white p-2.5 border border-[#E5E5E1]">
                "{request.description}"
              </p>
            )}

            {/* Location & Requester */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-[#E5E5E1]">
              <div>
                <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
                  Location
                </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {building?.name || 'Building'} &bull; Room #{room?.roomNumber || ''}
                  {bed ? ` (${bed.label})` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-wider block">
                  Submitted By
                </span>
                <span className="font-semibold text-[#1A1A1A]">
                  {request.requesterName} ({request.requesterRole})
                </span>
              </div>
            </div>
          </div>

          {/* Status & Technician Assignment Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Ticket Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Priority / Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as MaintenanceUrgency)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">Urgent Priority</option>
              </select>
            </div>
          </div>

          {/* Assigned Staff / Technician */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center justify-between">
              <span>Assigned Technician / Lead</span>
              <span className="text-[9px] text-[#A3A39F] font-normal">Select or type custom name</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={assignedTechnician}
                onChange={(e) => handleTechnicianSelect(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none bg-white"
              >
                <option value="">-- Unassigned --</option>
                {staffMembers.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={assignedTechnicianPhone}
                onChange={(e) => setAssignedTechnicianPhone(e.target.value)}
                placeholder="Tech Contact Phone"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Resolution / Technical Notes */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Resolution Notes / Maintenance Log
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={3}
              placeholder="Record repairs conducted, parts replaced, or status updates..."
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Revert Room/Bed status checkbox when marking Completed */}
          {status === 'Completed' && (
            <div className="bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={revertRoomBedStatus}
                  onChange={(e) => setRevertRoomBedStatus(e.target.checked)}
                  className="w-4 h-4 border-emerald-300 text-emerald-700 focus:ring-0"
                />
                <span>Revert Room/Bed status out of "Maintenance" to "Vacant / Available"</span>
              </label>
              <p className="text-[10px] text-emerald-700 pl-6">
                Completing this ticket will restore Room #{room?.roomNumber} {bed ? `(${bed.label})` : ''} to normal operational state.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-between">
            <span className="text-[10px] text-[#A3A39F] uppercase tracking-wider font-bold">
              Updated by {currentUser.name}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Ticket Updates</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

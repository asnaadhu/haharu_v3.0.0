import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { Bed, BedAssignment } from '../../types';
import { X, UserPlus, CheckCircle2, BedDouble } from 'lucide-react';

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  bedToAssign?: Bed | null;
}

export const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  isOpen,
  onClose,
  bedToAssign,
}) => {
  const { data, assignBed } = useProperty();

  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [expectedCheckOutDate, setExpectedCheckOutDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (bedToAssign) {
      setSelectedBedId(bedToAssign.id);
      if (bedToAssign.assignedTo) {
        setMemberName(bedToAssign.assignedTo.memberName);
        setEmployeeId(bedToAssign.assignedTo.employeeId);
        setPosition(bedToAssign.assignedTo.position || '');
        setDepartment(bedToAssign.assignedTo.department);
        setEmail(bedToAssign.assignedTo.email || '');
        setPhone(bedToAssign.assignedTo.phone || '');
        setCheckInDate(bedToAssign.assignedTo.checkInDate || new Date().toISOString().split('T')[0]);
        setExpectedCheckOutDate(bedToAssign.assignedTo.expectedCheckOutDate || '');
        setNotes(bedToAssign.assignedTo.notes || '');
      } else {
        resetFormFields();
      }
    } else {
      const vacantBeds = data.beds.filter((b) => b.assignedTo == null);
      setSelectedBedId(vacantBeds[0]?.id || '');
      resetFormFields();
    }
  }, [bedToAssign, isOpen, data]);

  const resetFormFields = () => {
    setMemberName('');
    setEmployeeId('');
    setPosition('');
    setDepartment('');
    setEmail('');
    setPhone('');
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setExpectedCheckOutDate('');
    setNotes('');
  };

  if (!isOpen) return null;

  const vacantBeds = data.beds.filter((b) => b.assignedTo == null || b.id === selectedBedId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !memberName.trim() || !employeeId.trim()) return;

    const assignmentData: BedAssignment = {
      memberId: `mem-${Date.now()}`,
      memberName: memberName.trim(),
      employeeId: employeeId.trim(),
      position: position.trim(),
      department: department.trim(),
      email: email.trim(),
      phone: phone.trim(),
      checkInDate: checkInDate || new Date().toISOString().split('T')[0],
      ...(expectedCheckOutDate.trim() ? { expectedCheckOutDate: expectedCheckOutDate.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };

    assignBed(selectedBedId, assignmentData);
    onClose();
  };

  const targetBed = data.beds.find((b) => b.id === selectedBedId);
  const targetRoom = data.rooms.find((r) => r.id === targetBed?.roomId);
  const targetBuilding = data.buildings.find((b) => b.id === targetRoom?.buildingId);

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-white max-w-lg w-full shadow-2xl overflow-hidden border border-[#E5E5E1]"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">Assign Team Member to Bed</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A3A39F] hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Bed Slot Selector */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span>Select Bed Slot *</span>
            </label>
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] font-bold text-xs focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              {vacantBeds.length === 0 ? (
                <option value="">No Available Vacant Beds</option>
              ) : (
                vacantBeds.map((bed) => {
                  const room = data.rooms.find((r) => r.id === bed.roomId);
                  const bldg = data.buildings.find((b) => b.id === room?.buildingId);
                  return (
                    <option key={bed.id} value={bed.id}>
                      {bldg?.code || 'BLDG'} • Room #{room?.roomNumber || ''} - {bed.label}
                    </option>
                  );
                })
              )}
            </select>
            {targetBed && targetRoom && (
              <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A] bg-[#F9F9F8] p-2.5 border border-[#E5E5E1] mt-2 font-bold">
                Target: {targetBuilding?.name} • Room #{targetRoom.roomNumber} ({targetBed.label})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Team Member Name *
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="e.g. Ahmed Asnad"
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Employee / ID Number */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Employee / Contractor ID *
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. 30034"
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Position */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Position / Job Title
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. IT Manager"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Department / Team
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. IT"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Contact Email */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. aasnad@avanihotels.com"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +9607292184"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Check-In Date */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Check-In Date *
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Expected Check-Out */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Expected Check-Out
              </label>
              <input
                type="date"
                value={expectedCheckOutDate}
                onChange={(e) => setExpectedCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Assignment Notes / Shift Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Shift Lead, keycard issued..."
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

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
              disabled={!selectedBedId}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] disabled:bg-[#A3A39F] text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm Assignment</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';
import { MaintenanceCategory, MaintenanceUrgency } from '../../types';
import { Wrench, X, AlertTriangle, Building, Layers, DoorClosed, BedDouble } from 'lucide-react';

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedRoomId?: string;
  preselectedBedId?: string;
}

const CATEGORIES: MaintenanceCategory[] = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Appliance',
  'Furniture',
  'Structural',
  'Cleaning',
  'General',
];

const URGENCIES: { label: string; value: MaintenanceUrgency; color: string }[] = [
  { label: 'Low', value: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { label: 'Medium', value: 'Medium', color: 'bg-amber-50 text-amber-800 border-amber-300' },
  { label: 'High', value: 'High', color: 'bg-orange-50 text-orange-800 border-orange-300' },
  { label: 'Urgent', value: 'Urgent', color: 'bg-rose-50 text-rose-800 border-rose-300' },
];

export const CreateMaintenanceModal: React.FC<CreateMaintenanceModalProps> = ({
  isOpen,
  onClose,
  preselectedRoomId,
  preselectedBedId,
}) => {
  const { data, addMaintenanceRequest } = useProperty();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('General');
  const [urgency, setUrgency] = useState<MaintenanceUrgency>('Medium');

  const [buildingId, setBuildingId] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser.phone || '');
  const [setRoomBedMaintenance, setSetRoomBedMaintenance] = useState(true);

  // Auto populate cascading selections if preselected or user assigned bed
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setCategory('General');
      setUrgency('Medium');

      let targetRoomId = preselectedRoomId;
      let targetBedId = preselectedBedId;

      // If user is a tenant with assigned bed
      if (!targetBedId && currentUser.role === 'Tenant' && currentUser.assignedBedId) {
        targetBedId = currentUser.assignedBedId;
        const tenantBed = (data.beds || []).find((b) => b.id === currentUser.assignedBedId);
        if (tenantBed) {
          targetRoomId = tenantBed.roomId;
        }
      }

      if (targetRoomId) {
        const room = (data.rooms || []).find((r) => r.id === targetRoomId);
        if (room) {
          setBuildingId(room.buildingId);
          setFloorId(room.floorId);
          setRoomId(room.id);
          setBedId(targetBedId || '');
          return;
        }
      }

      // Default to first building/floor/room
      const buildings = data.buildings || [];
      if (buildings.length > 0) {
        const bId = buildings[0].id;
        setBuildingId(bId);
        const bFloors = (data.floors || []).filter((f) => f.buildingId === bId);
        const fId = bFloors.length > 0 ? bFloors[0].id : '';
        setFloorId(fId);
        const fRooms = (data.rooms || []).filter((r) => r.floorId === fId);
        const rId = fRooms.length > 0 ? fRooms[0].id : '';
        setRoomId(rId);
        setBedId('');
      }
    }
  }, [isOpen, preselectedRoomId, preselectedBedId, currentUser, data]);

  if (!isOpen) return null;

  // Filtered lists for cascading dropdowns
  const availableFloors = (data.floors || []).filter((f) => f.buildingId === buildingId);
  const availableRooms = (data.rooms || []).filter((r) => r.floorId === floorId);
  const availableBeds = (data.beds || []).filter((b) => b.roomId === roomId);

  const handleBuildingChange = (bId: string) => {
    setBuildingId(bId);
    const bFloors = (data.floors || []).filter((f) => f.buildingId === bId);
    const nextFId = bFloors.length > 0 ? bFloors[0].id : '';
    setFloorId(nextFId);
    const fRooms = (data.rooms || []).filter((r) => r.floorId === nextFId);
    const nextRId = fRooms.length > 0 ? fRooms[0].id : '';
    setRoomId(nextRId);
    setBedId('');
  };

  const handleFloorChange = (fId: string) => {
    setFloorId(fId);
    const fRooms = (data.rooms || []).filter((r) => r.floorId === fId);
    const nextRId = fRooms.length > 0 ? fRooms[0].id : '';
    setRoomId(nextRId);
    setBedId('');
  };

  const handleRoomChange = (rId: string) => {
    setRoomId(rId);
    setBedId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !buildingId || !roomId) return;

    addMaintenanceRequest({
      title: title.trim(),
      description: description.trim(),
      category,
      urgency,
      buildingId,
      floorId,
      roomId,
      ...(bedId ? { bedId } : {}),
      requesterId: currentUser.id,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      ...(contactPhone.trim() ? { contactPhone: contactPhone.trim() } : {}),
      setRoomBedMaintenance,
    });

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
            <Wrench className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                Submit Maintenance Request
              </h3>
              <p className="text-[10px] text-[#A3A39F] uppercase tracking-wider font-bold">
                Report property repair, plumbing, HVAC or furniture issue
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Issue Summary */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Issue Title / Brief Summary *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AC unit not cooling, Leaky bathroom tap"
              required
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Category & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Urgency Level *
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as MaintenanceUrgency)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Cascading Selectors */}
          <div className="bg-[#F9F9F8] p-4 border border-[#E5E5E1] space-y-3">
            <div className="text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span>Location Details</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#666662] mb-1">
                  Building *
                </label>
                <select
                  value={buildingId}
                  onChange={(e) => handleBuildingChange(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium focus:outline-none bg-white"
                >
                  {data.buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#666662] mb-1">
                  Floor *
                </label>
                <select
                  value={floorId}
                  onChange={(e) => handleFloorChange(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium focus:outline-none bg-white"
                >
                  {availableFloors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#666662] mb-1">
                  Room *
                </label>
                <select
                  value={roomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none bg-white"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room #{r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#666662] mb-1">
                  Specific Bed (Optional)
                </label>
                <select
                  value={bedId}
                  onChange={(e) => setBedId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium focus:outline-none bg-white"
                >
                  <option value="">-- Entire Room / Common Area --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Detailed Description & Observation Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what is broken, symptoms, when it started, or special instructions for technicians..."
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Contact Phone & Flag Maintenance Option */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Contact Phone Number
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-[#1A1A1A] mt-4">
                <input
                  type="checkbox"
                  checked={setRoomBedMaintenance}
                  onChange={(e) => setSetRoomBedMaintenance(e.target.checked)}
                  className="w-4 h-4 border-[#E5E5E1] text-[#1A1A1A] focus:ring-0"
                />
                <span>Set Room/Bed status to "Maintenance"</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-between">
            <div className="text-[10px] text-[#A3A39F]">
              Logged as: <span className="font-bold text-[#1A1A1A]">{currentUser.name}</span> ({currentUser.role})
            </div>
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
                <Wrench className="w-3.5 h-3.5" />
                <span>Submit Ticket</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

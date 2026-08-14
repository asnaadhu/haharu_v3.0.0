import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../../context/PropertyContext';
import { Room } from '../../types';
import { X, Save, Trash2, Building2, BedDouble } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomToEdit?: Room | null;
}

export const RoomModal: React.FC<RoomModalProps> = ({ isOpen, onClose, roomToEdit }) => {
  const { data, addRoom, updateRoom, deleteRoom } = useProperty();

  const [buildingId, setBuildingId] = useState<string>('');
  const [floorId, setFloorId] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [totalBeds, setTotalBeds] = useState<number>(1);
  const [statusId, setStatusId] = useState<string>('status-vacant');
  const [notes, setNotes] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (roomToEdit) {
      setBuildingId(roomToEdit.buildingId);
      setFloorId(roomToEdit.floorId);
      setRoomNumber(roomToEdit.roomNumber);
      setRoomTypeId(roomToEdit.roomTypeId);
      setTotalBeds(roomToEdit.totalBeds);
      setStatusId(roomToEdit.statusId);
      setNotes(roomToEdit.notes || '');
    } else {
      const defaultBldg = data.buildings[0]?.id || '';
      setBuildingId(defaultBldg);
      const defaultFloors = data.floors.filter((f) => f.buildingId === defaultBldg);
      setFloorId(defaultFloors[0]?.id || '');
      setRoomNumber('');
      const defaultType = data.roomTypes[0];
      setRoomTypeId(defaultType?.id || '');
      setTotalBeds(defaultType?.defaultBedCount || 1);
      setStatusId('status-vacant');
      setNotes('');
    }
    setShowDeleteConfirm(false);
  }, [roomToEdit, isOpen, data]);

  // When building changes, set available floor
  const handleBuildingChange = (bId: string) => {
    setBuildingId(bId);
    const availableFloors = data.floors.filter((f) => f.buildingId === bId);
    setFloorId(availableFloors[0]?.id || '');
  };

  // When room type changes, update bed count to default if adding
  const handleRoomTypeChange = (typeId: string) => {
    setRoomTypeId(typeId);
    if (!roomToEdit) {
      const selectedType = data.roomTypes.find((rt) => rt.id === typeId);
      if (selectedType) {
        setTotalBeds(selectedType.defaultBedCount);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim() || !buildingId || !floorId || !roomTypeId) return;

    if (roomToEdit) {
      updateRoom(roomToEdit.id, roomNumber.trim(), roomTypeId, totalBeds, statusId, notes);
    } else {
      addRoom(buildingId, floorId, roomNumber.trim(), roomTypeId, totalBeds, notes);
    }
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRoom = () => {
    if (roomToEdit) {
      deleteRoom(roomToEdit.id);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  const filteredFloors = data.floors.filter((f) => f.buildingId === buildingId);

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
            <Building2 className="w-5 h-5 text-white" />
            <h3 className="font-bold text-lg">
              {roomToEdit ? `Edit Room #${roomToEdit.roomNumber}` : 'Create New Room'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A3A39F] hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Building Selection */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Building / Block *
              </label>
              <select
                value={buildingId}
                onChange={(e) => handleBuildingChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {data.buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Selection */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Floor Level *
              </label>
              <select
                value={floorId}
                onChange={(e) => setFloorId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {filteredFloors.length === 0 ? (
                  <option value="">No Floors Configured</option>
                ) : (
                  filteredFloors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} (#
                      {f.number})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Room Number */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Room Number / Identifier *
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 101, 204B"
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Room Category *
              </label>
              <select
                value={roomTypeId}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {data.roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({rt.defaultBedCount} bed default)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-[#F9F9F8] p-4 border border-[#E5E5E1]">
            {/* Custom Total Beds */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>Bed Capacity</span>
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={totalBeds}
                onChange={(e) => setTotalBeds(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-bold focus:outline-none focus:border-[#1A1A1A] bg-white"
              />
              <p className="text-[10px] text-[#A3A39F] mt-1">
                Adjust count to override category default
              </p>
            </div>

            {/* Room Status */}
            <div>
              <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
                Current Status
              </label>
              <select
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
              >
                {data.statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-[#A3A39F] mt-1">
                Auto-updated upon roster assignment
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-[#A3A39F] uppercase tracking-widest mb-1.5">
              Room Remarks / Amenities
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Near elevator, ensuite bath, desk unit..."
              className="w-full px-3 py-2 border border-[#E5E5E1] text-[#1A1A1A] text-xs focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Delete Confirmation Box */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Confirm Room Deletion</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Are you sure you want to delete <strong className="text-rose-950 font-bold">Room #{roomToEdit?.roomNumber}</strong>? All associated bed slots will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-rose-200 text-rose-800 hover:bg-rose-100 font-bold text-[10px] uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRoom}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider transition-colors shadow-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E5E5E1] flex items-center justify-between">
            {roomToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-[#9E2A2B] hover:bg-[#FDF2F0] font-bold text-[10px] uppercase tracking-widest transition-colors border border-transparent hover:border-[#F5C6C2]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Room</span>
              </button>
            ) : <div />}

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
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{roomToEdit ? 'Save Changes' : 'Create Room'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

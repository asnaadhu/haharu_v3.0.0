import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Room } from '../types';
import { RoomModal } from './modals/RoomModal';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Bed,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
} from 'lucide-react';

export const RoomInventoryView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { data, deleteRoom, setActiveTab } = useProperty();
  const { canEditModule } = useAuth();
  const canEditInventory = canEditModule('inventory') || canEditModule('settings');

  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter States
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const confirmDeleteRoom = () => {
    if (roomToDelete) {
      deleteRoom(roomToDelete.id);
      setRoomToDelete(null);
    }
  };

  const handleOpenAddModal = () => {
    setRoomToEdit(null);
    setIsRoomModalOpen(true);
  };

  const handleOpenEditModal = (room: Room) => {
    setRoomToEdit(room);
    setIsRoomModalOpen(true);
  };

  // Filter Floors dropdown based on Building
  const availableFloors = selectedBuilding === 'all'
    ? data.floors
    : data.floors.filter((f) => f.buildingId === selectedBuilding);

  // Filter Rooms
  const filteredRooms = data.rooms.filter((room) => {
    if (selectedBuilding !== 'all' && room.buildingId !== selectedBuilding) return false;
    if (selectedFloor !== 'all' && room.floorId !== selectedFloor) return false;
    if (selectedCategory !== 'all' && room.roomTypeId !== selectedCategory) return false;
    if (selectedStatus !== 'all' && room.statusId !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoomNum = room.roomNumber.toLowerCase().includes(q);
      const roomBeds = data.beds.filter((b) => b.roomId === room.id);
      const matchMember = roomBeds.some((b) =>
        b.assignedTo?.memberName.toLowerCase().includes(q) ||
        b.assignedTo?.employeeId.toLowerCase().includes(q)
      );
      if (!matchRoomNum && !matchMember) return false;
    }

    return true;
  });

  return (
    <div className={embedded ? "space-y-6 font-sans" : "p-10 max-w-7xl mx-auto space-y-8 font-sans"}>
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
            Property Register
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">
            Room & Floor Inventory
          </h2>
        </div>

        {canEditInventory && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[11px] uppercase tracking-widest transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-6 border border-[#E5E5E1] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5 text-[#A3A39F]" />
            <span>Filter Criteria</span>
          </div>

          {(selectedBuilding !== 'all' ||
            selectedFloor !== 'all' ||
            selectedCategory !== 'all' ||
            selectedStatus !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedBuilding('all');
                setSelectedFloor('all');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
              className="text-[10px] uppercase tracking-widest font-bold text-[#1A1A1A] border-b border-[#1A1A1A]"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Building Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setSelectedFloor('all');
              }}
              className="w-full px-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="all">All Buildings ({data.buildings.length})</option>
              {data.buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Floor Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Floor Level
            </label>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full px-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="all">All Floors</option>
              {availableFloors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Room Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="all">All Room Types</option>
              {data.roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="all">All Statuses</option>
              {data.statuses.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Search
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A3A39F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Room # or member..."
                className="w-full pl-8 pr-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Room Count & View Mode Toggle Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#666662] px-1 font-medium">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F]">
          Showing <strong className="text-[#1A1A1A]">{filteredRooms.length}</strong> of{' '}
          {data.rooms.length} Rooms
        </span>

        {/* List / Grid Switcher */}
        <div className="flex items-center gap-1 bg-[#F0F0EE] p-1 border border-[#E5E5E1]">
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
        </div>
      </div>

      {/* Rooms Content */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white p-12 text-center border border-dashed border-[#E5E5E1]">
          <Building2 className="w-10 h-10 text-[#A3A39F] mx-auto mb-3" />
          <h3 className="text-[#1A1A1A] text-lg font-bold">No Matching Rooms Found</h3>
          <p className="text-xs text-[#666662] mt-1 max-w-sm mx-auto">
            Try adjusting your active filters above, or add a new room configuration.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1A1A] text-white font-bold text-[10px] uppercase tracking-widest rounded-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* List View Table */
        <div className="bg-white border border-[#E5E5E1] shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Room Number</th>
                <th className="py-3 px-4">Building & Floor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bed Occupancy</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Cleaned</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredRooms.map((room) => {
                const building = data.buildings.find((b) => b.id === room.buildingId);
                const floor = data.floors.find((f) => f.id === room.floorId);
                const roomType = data.roomTypes.find((rt) => rt.id === room.roomTypeId);
                const statusObj = data.statuses.find((st) => st.id === room.statusId);
                const roomBeds = data.beds.filter((b) => b.roomId === room.id);
                const occupiedCount = roomBeds.filter((b) => b.assignedTo != null).length;

                return (
                  <tr key={room.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#A3A39F] shrink-0" />
                        <div>
                          <span className="text-sm">Room #{room.roomNumber}</span>
                          {room.notes && (
                            <p className="text-[10px] text-[#A3A39F] font-normal line-clamp-1">
                              {room.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#1A1A1A] font-semibold">
                      <div>{building?.name || 'Unassigned Building'} ({building?.code || '-'})</div>
                      <div className="text-[10px] text-[#A3A39F] font-normal">{floor?.label || 'Floor'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className="px-2.5 py-0.5 text-white font-bold text-[9px] uppercase tracking-wider"
                        style={{ backgroundColor: roomType?.badgeColor || '#1A1A1A' }}
                      >
                        {roomType?.name || 'Standard'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#1A1A1A] text-xs">
                        {occupiedCount} / {room.totalBeds} Beds
                      </div>
                      <div className="text-[10px] text-[#A3A39F]">
                        {roomBeds.map((b) => b.assignedTo?.memberName).filter(Boolean).join(', ') || 'No occupants'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white inline-block"
                        style={{ backgroundColor: statusObj?.color || '#1A1A1A' }}
                      >
                        {statusObj?.name || 'Vacant'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#A3A39F] text-[11px] font-mono">
                      {room.lastCleaned || 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="p-1.5 text-[#1A1A1A] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                        title="Edit Room"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete Room #${room.roomNumber}? All associated bed slots will be removed.`
                            )
                          ) {
                            deleteRoom(room.id);
                          }
                        }}
                        className="p-1.5 text-rose-700 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const building = data.buildings.find((b) => b.id === room.buildingId);
            const floor = data.floors.find((f) => f.id === room.floorId);
            const roomType = data.roomTypes.find((rt) => rt.id === room.roomTypeId);
            const statusObj = data.statuses.find((st) => st.id === room.statusId);

            const roomBeds = data.beds.filter((b) => b.roomId === room.id);
            const occupiedCount = roomBeds.filter((b) => b.assignedTo != null).length;

            return (
              <div
                key={room.id}
                className="bg-white border border-[#E5E5E1] p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Header bar */}
                  <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#E5E5E1]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                        {building?.code || 'BLDG'} • {floor?.label || 'Floor'}
                      </div>
                      <h3 className="text-xl font-bold text-[#1A1A1A] mt-1">
                        Room #{room.roomNumber}
                      </h3>
                    </div>

                    {/* Status Badge */}
                    <span
                      className="px-2.5 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider text-white shrink-0"
                      style={{ backgroundColor: statusObj?.color || '#1A1A1A' }}
                    >
                      {statusObj?.name || 'Vacant'}
                    </span>
                  </div>

                  {/* Room Type & Bed count info */}
                  <div className="my-4 flex items-center justify-between text-xs">
                    <span
                      className="px-2.5 py-1 rounded-xs text-white font-bold text-[10px] uppercase tracking-wider"
                      style={{ backgroundColor: roomType?.badgeColor || '#1A1A1A' }}
                    >
                      {roomType?.name || 'Standard'}
                    </span>

                    <span className="font-bold text-[#1A1A1A] bg-[#F0F0EE] px-2.5 py-1 rounded-xs text-[10px] uppercase tracking-wider">
                      {occupiedCount} / {room.totalBeds} Beds Occupied
                    </span>
                  </div>

                  {/* Bed Slots Grid */}
                  <div className="mt-4 bg-[#F9F9F8] p-4 border border-[#E5E5E1] space-y-2.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] flex items-center justify-between">
                      <span>Bed Slots ({roomBeds.length})</span>
                      <button
                        onClick={() => setActiveTab('assignments')}
                        className="text-[#1A1A1A] hover:underline text-[10px] font-bold uppercase tracking-wider"
                      >
                        Assignments
                      </button>
                    </div>

                    <div className="space-y-2">
                      {roomBeds.map((bed) => {
                        const isAssigned = bed.assignedTo != null;
                        const bedStatus = data.statuses.find((s) => s.id === bed.statusId);

                        return (
                          <div
                            key={bed.id}
                            className="flex items-center justify-between px-3 py-2 bg-white border border-[#E5E5E1] text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Bed className="w-3.5 h-3.5 text-[#1A1A1A] shrink-0" />
                              <span className="font-bold text-[#1A1A1A] truncate">{bed.label}</span>
                            </div>

                            {isAssigned ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A] bg-[#F0F0EE] px-2 py-0.5 border border-[#E5E5E1] truncate max-w-[120px]">
                                {bed.assignedTo?.memberName}
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs"
                                style={{
                                  backgroundColor: `${bedStatus?.color || '#10b981'}15`,
                                  color: bedStatus?.color || '#1E5D38',
                                }}
                              >
                                {bedStatus?.name || 'Vacant'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {room.notes && (
                    <p className="text-xs text-[#666662] mt-3 line-clamp-2">
                      "{room.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-[#E5E5E1] flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A39F]">
                    Cleaned: {room.lastCleaned || 'N/A'}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setRoomToDelete(room)}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#9E2A2B] hover:underline"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Creation/Edit Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomToEdit={roomToEdit}
      />

      {/* Delete Room Confirmation Modal */}
      {roomToDelete && (
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
                <h3 className="font-bold text-base">Delete Room Inventory</h3>
              </div>
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                className="text-[#A3A39F] hover:text-white p-1 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#666662] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#1A1A1A] font-bold">Room #{roomToDelete.roomNumber}</strong>?
              </p>
              <p className="text-[11px] text-[#888880] bg-[#F9F9F8] p-3 border border-[#E5E5E1] rounded-xs">
                Deleting this room will also remove all associated bed slots and resident assignment configurations.
              </p>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoomToDelete(null)}
                  className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteRoom}
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

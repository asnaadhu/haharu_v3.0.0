import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { useAuth } from '../context/AuthContext';
import { Bed } from '../types';
import { AssignMemberModal } from './modals/AssignMemberModal';
import {
  BedDouble,
  UserPlus,
  LogOut,
  Search,
  Filter,
  Calendar,
  UserCheck,
  Briefcase,
  Edit2,
  LayoutGrid,
  List,
} from 'lucide-react';

export const BedAssignmentsView: React.FC = () => {
  const { data, checkoutBed, updateBedStatus } = useProperty();
  const { canEditModule } = useAuth();

  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [selectedBedToAssign, setSelectedBedToAssign] = useState<Bed | null>(null);
  const [bedToCheckout, setBedToCheckout] = useState<Bed | null>(null);

  const handleOpenAssignModal = (bed?: Bed) => {
    setSelectedBedToAssign(bed || null);
    setIsAssignModalOpen(true);
  };

  const handleCheckout = (bed: Bed) => {
    setBedToCheckout(bed);
  };

  const confirmCheckout = () => {
    if (bedToCheckout) {
      checkoutBed(bedToCheckout.id);
      setBedToCheckout(null);
    }
  };

  const handleStatusChange = (bed: Bed, newStatusId: string) => {
    updateBedStatus(bed.id, newStatusId);
  };

  // Filter Floors
  const availableFloors = selectedBuilding === 'all'
    ? data.floors
    : data.floors.filter((f) => f.buildingId === selectedBuilding);

  // Filter Beds
  const filteredBeds = data.beds.filter((bed) => {
    const room = data.rooms.find((r) => r.id === bed.roomId);
    if (!room) return false;

    if (selectedBuilding !== 'all' && room.buildingId !== selectedBuilding) return false;
    if (selectedFloor !== 'all' && room.floorId !== selectedFloor) return false;
    if (selectedCategory !== 'all' && room.roomTypeId !== selectedCategory) return false;
    if (selectedStatus !== 'all' && bed.statusId !== selectedStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = room.roomNumber.toLowerCase().includes(q);
      const matchBedLabel = bed.label.toLowerCase().includes(q);
      const matchMemberName = bed.assignedTo?.memberName.toLowerCase().includes(q);
      const matchEmpId = bed.assignedTo?.employeeId.toLowerCase().includes(q);
      const matchDept = bed.assignedTo?.department.toLowerCase().includes(q);
      const matchPos = bed.assignedTo?.position?.toLowerCase().includes(q);

      if (!matchRoom && !matchBedLabel && !matchMemberName && !matchEmpId && !matchDept && !matchPos) {
        return false;
      }
    }

    return true;
  });

  const totalBedsCount = data.beds.length;
  const occupiedBedsCount = data.beds.filter((b) => b.assignedTo != null).length;
  const vacantBedsCount = data.beds.filter((b) => b.assignedTo == null && !data.statuses.find((s) => s.id === b.statusId)?.isMaintenanceState).length;

  return (
    <div className="p-0 sm:p-2 lg:p-6 space-y-6 sm:space-y-8 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
            Personnel Roster
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">
            Bed Assignments & Member Roster
          </h2>
        </div>

        {canEditModule('assignments') && (
          <button
            onClick={() => handleOpenAssignModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[11px] uppercase tracking-widest transition-colors shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign New Member</span>
          </button>
        )}
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-[#E5E5E1] shadow-xs">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
            Total Operational Beds
          </div>
          <div className="text-3xl font-bold text-[#1A1A1A]">
            {totalBedsCount}
          </div>
        </div>

        <div className="bg-white p-6 border border-[#E5E5E1] shadow-xs">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
            Currently Assigned
          </div>
          <div className="text-3xl font-bold text-[#1A1A1A]">
            {occupiedBedsCount}
          </div>
        </div>

        <div className="bg-white p-6 border border-[#E5E5E1] shadow-xs">
          <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
            Immediate Vacancies
          </div>
          <div className="text-3xl font-bold text-[#1E5D38]">
            {vacantBedsCount}
          </div>
        </div>
      </div>

      {/* Dynamic Filter Toolbar */}
      <div className="bg-white p-6 border border-[#E5E5E1] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-[#1A1A1A] uppercase tracking-widest">
            <Filter className="w-3.5 h-3.5 text-[#A3A39F]" />
            <span>Search & Filter Team Members</span>
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
              <option value="all">All Buildings</option>
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
              Floor
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

          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Room Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A] bg-white"
            >
              <option value="all">All Categories</option>
              {data.roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Bed Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Bed Slot Status
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

          {/* Search Box */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3A39F] mb-1.5">
              Search Resident / ID
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#A3A39F]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, ID, Dept, Room..."
                className="w-full pl-8 pr-3 py-2 rounded-xs border border-[#E5E5E1] text-[#1A1A1A] text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Stats Bar & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#666662] px-1 font-medium">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F]">
          Displaying <strong className="text-[#1A1A1A]">{filteredBeds.length}</strong> bed slots
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

      {/* Bed Slots Content */}
      {filteredBeds.length === 0 ? (
        <div className="bg-white p-12 text-center border border-dashed border-[#E5E5E1]">
          <BedDouble className="w-10 h-10 text-[#A3A39F] mx-auto mb-3" />
          <h3 className="text-[#1A1A1A] text-lg font-bold">No Bed Slots Found</h3>
          <p className="text-xs text-[#666662] mt-1 max-w-sm mx-auto">
            No bed slots match your current filter combination.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* List View Table */
        <div className="bg-white border border-[#E5E5E1] shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead className="bg-[#1A1A1A] text-white text-[10px] uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Bed Slot</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Occupant / Resident</th>
                <th className="py-3 px-4">Department & Phone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredBeds.map((bed) => {
                const room = data.rooms.find((r) => r.id === bed.roomId);
                const building = data.buildings.find((b) => b.id === room?.buildingId);
                const floor = data.floors.find((f) => f.id === room?.floorId);
                const bedStatus = data.statuses.find((st) => st.id === bed.statusId);
                const isAssigned = bed.assignedTo != null;

                return (
                  <tr key={bed.id} className="hover:bg-[#F9F9F8] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                      <div className="flex items-center gap-2">
                        <BedDouble className="w-4 h-4 text-[#A3A39F] shrink-0" />
                        <span>{bed.label}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#1A1A1A]">
                      <div className="font-bold">Room #{room?.roomNumber || 'N/A'}</div>
                      <div className="text-[10px] text-[#A3A39F]">
                        {building?.name || 'Building'} • {floor?.label || 'Floor'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-[#1A1A1A]">
                      {isAssigned ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{bed.assignedTo?.memberName}</span>
                          </div>
                          <div className="text-[10px] text-[#A3A39F] font-normal">
                            ID: {bed.assignedTo?.employeeId || '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#A3A39F] italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#666662]">
                      {isAssigned ? (
                        <div>
                          {bed.assignedTo?.position && (
                            <div className="font-semibold text-[#1A1A1A]">{bed.assignedTo.position}</div>
                          )}
                          <div className="text-xs text-[#666662]">{bed.assignedTo?.department || 'General'}</div>
                          <div className="text-[10px] text-[#A3A39F]">
                            {bed.assignedTo?.phone || bed.assignedTo?.contactPhone || '-'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[#A3A39F]">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={bed.statusId}
                        onChange={(e) => handleStatusChange(bed, e.target.value)}
                        className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-[#E5E5E1] bg-white focus:outline-none"
                        style={{ color: bedStatus?.color || '#1A1A1A' }}
                      >
                        {data.statuses.map((st) => (
                          <option key={st.id} value={st.id} style={{ color: '#1A1A1A' }}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      {isAssigned ? (
                        <button
                          onClick={() => handleCheckout(bed)}
                          className="px-2.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 font-bold text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Checkout</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAssignModal(bed)}
                          className="px-2.5 py-1.5 bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      )}
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
          {filteredBeds.map((bed) => {
            const room = data.rooms.find((r) => r.id === bed.roomId);
            const building = data.buildings.find((b) => b.id === room?.buildingId);
            const floor = data.floors.find((f) => f.id === room?.floorId);
            const roomType = data.roomTypes.find((rt) => rt.id === room?.roomTypeId);
            const bedStatus = data.statuses.find((st) => st.id === bed.statusId);

            const isAssigned = bed.assignedTo != null;

            return (
              <div
                key={bed.id}
                className="bg-white border border-[#E5E5E1] p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Bed Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F]">
                        {building?.code || 'BLDG'} • Room #{room?.roomNumber || 'N/A'}
                      </div>
                      <h3 className="font-bold text-[#1A1A1A] text-lg flex items-center gap-2 mt-0.5">
                        <BedDouble className="w-4 h-4 text-[#1A1A1A]" />
                        <span>{bed.label}</span>
                      </h3>
                    </div>

                    {/* Status Badge Dropdown */}
                    <select
                      value={bed.statusId}
                      onChange={(e) => handleStatusChange(bed, e.target.value)}
                      className="px-2.5 py-1 rounded-xs text-[10px] font-bold uppercase tracking-wider text-white cursor-pointer bg-[#1A1A1A] border-0"
                      style={{ backgroundColor: bedStatus?.color || '#1A1A1A' }}
                    >
                      {data.statuses.map((st) => (
                        <option
                          key={st.id}
                          value={st.id}
                          style={{ backgroundColor: '#ffffff', color: '#1A1A1A' }}
                        >
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Category Tag */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#A3A39F]">
                      {roomType?.name} ({floor?.label})
                    </span>
                  </div>

                  {/* Assigned Member Card or Vacant State */}
                  {isAssigned ? (
                    <div className="mt-4 p-4 bg-[#F9F9F8] border border-[#E5E5E1] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-[#1A1A1A] text-base">
                          {bed.assignedTo?.memberName}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white border border-[#E5E5E1] text-[#1A1A1A] px-2 py-0.5">
                          ID: {bed.assignedTo?.employeeId}
                        </span>
                      </div>

                      <div className="text-xs text-[#666662] flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-[#A3A39F]" />
                        <span>
                          {bed.assignedTo?.position ? (
                            <>
                              Position: <strong className="text-[#1A1A1A]">{bed.assignedTo.position}</strong> ({bed.assignedTo.department})
                            </>
                          ) : (
                            <>
                              Dept: <strong className="text-[#1A1A1A]">{bed.assignedTo?.department}</strong>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-[#A3A39F] pt-2 border-t border-[#E5E5E1]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#A3A39F]" />
                          <span>In: {bed.assignedTo?.checkInDate}</span>
                        </span>
                        {bed.assignedTo?.expectedCheckOutDate && (
                          <span>Out: {bed.assignedTo.expectedCheckOutDate}</span>
                        )}
                      </div>

                      {bed.assignedTo?.notes && (
                        <p className="text-xs text-[#666662] line-clamp-1">
                          "{bed.assignedTo.notes}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4 p-6 bg-[#F9F9F8] border border-dashed border-[#E5E5E1] text-center space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#1E5D38]">Slot Vacant</p>
                      <p className="text-[10px] text-[#A3A39F] uppercase tracking-wider">Available for immediate assignment</p>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="mt-5 pt-3 border-t border-[#E5E5E1]">
                  {isAssigned ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleOpenAssignModal(bed)}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-wider transition-colors"
                        title="Edit Resident Details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Details</span>
                      </button>
                      <button
                        onClick={() => handleCheckout(bed)}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xs bg-[#FDF2F0] hover:bg-[#F8E1DC] text-[#9E2A2B] font-bold text-[10px] uppercase tracking-wider border border-[#F5C6C2] transition-colors"
                        title="Check Out Resident"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Check Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenAssignModal(bed)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assign Resident</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assign Member Modal */}
      <AssignMemberModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        bedToAssign={selectedBedToAssign}
      />

      {/* Checkout Confirmation Modal */}
      {bedToCheckout && (
        <div className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-white border border-[#E5E5E1] shadow-2xl max-w-md w-full overflow-hidden rounded-xs"
          >
            <div className="px-6 py-5 bg-[#1A1A1A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <LogOut className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base">Confirm Resident Check Out</h3>
              </div>
              <button
                type="button"
                onClick={() => setBedToCheckout(null)}
                className="text-[#A3A39F] hover:text-white p-1 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#666662] leading-relaxed">
                Are you sure you want to check out <strong className="text-[#1A1A1A] font-bold">{bedToCheckout.assignedTo?.memberName || 'Member'}</strong>
                {bedToCheckout.assignedTo?.employeeId ? ` (ID: ${bedToCheckout.assignedTo.employeeId})` : ''} from bed slot <strong className="text-[#1A1A1A] font-bold">"{bedToCheckout.label}"</strong>?
              </p>
              <p className="text-[11px] text-[#888880] bg-[#F9F9F8] p-3 border border-[#E5E5E1] rounded-xs">
                Checking out will vacate this bed slot and automatically update the room's overall occupancy status.
              </p>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBedToCheckout(null)}
                  className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCheckout}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Confirm Check Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

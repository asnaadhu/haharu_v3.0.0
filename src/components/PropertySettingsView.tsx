import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useProperty } from '../context/PropertyContext';
import { Building, Floor, RoomType, StatusCategory } from '../types';
import { BuildingModal } from './modals/BuildingModal';
import { FloorModal } from './modals/FloorModal';
import { RoomTypeModal } from './modals/RoomTypeModal';
import { StatusModal } from './modals/StatusModal';
import { RoomInventoryView } from './RoomInventoryView';
import { UserManagementView } from './UserManagementView';
import {
  Building2,
  Layers,
  Tag,
  Shield,
  Plus,
  Edit2,
  Trash2,
  BedDouble,
  LayoutGrid,
  List,
  Home,
  Users,
} from 'lucide-react';

export const PropertySettingsView: React.FC<{
  initialSubTab?: 'buildings' | 'rooms' | 'types' | 'statuses' | 'users';
}> = ({ initialSubTab = 'buildings' }) => {
  const {
    data,
    deleteBuilding,
    deleteFloor,
    deleteRoomType,
    deleteStatusCategory,
  } = useProperty();

  const [activeMainGroup, setActiveMainGroup] = useState<'property' | 'users'>(
    initialSubTab === 'users' ? 'users' : 'property'
  );
  const [activeSubTab, setActiveSubTab] = useState<'buildings' | 'rooms' | 'types' | 'statuses' | 'users'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
      if (initialSubTab === 'users') {
        setActiveMainGroup('users');
      } else {
        setActiveMainGroup('property');
      }
    }
  }, [initialSubTab]);

  // Building Modal State
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState<boolean>(false);
  const [buildingToEdit, setBuildingToEdit] = useState<Building | null>(null);

  // Floor Modal State
  const [isFloorModalOpen, setIsFloorModalOpen] = useState<boolean>(false);
  const [floorToEdit, setFloorToEdit] = useState<Floor | null>(null);
  const [selectedBuildingForFloor, setSelectedBuildingForFloor] = useState<string>('');

  // Room Type Modal State
  const [isTypeModalOpen, setIsTypeModalOpen] = useState<boolean>(false);
  const [typeToEdit, setTypeToEdit] = useState<RoomType | null>(null);

  // Status Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [statusToEdit, setStatusToEdit] = useState<StatusCategory | null>(null);

  // General Delete Confirmation State
  const [deleteSettingConfirm, setDeleteSettingConfirm] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Handlers for Building
  const handleOpenAddBuilding = () => {
    setBuildingToEdit(null);
    setIsBuildingModalOpen(true);
  };
  const handleOpenEditBuilding = (b: Building) => {
    setBuildingToEdit(b);
    setIsBuildingModalOpen(true);
  };
  const handleDeleteBuilding = (b: Building) => {
    const associatedRooms = data.rooms.filter((r) => r.buildingId === b.id);
    if (associatedRooms.length > 0) {
      setDeleteSettingConfirm({
        title: `Delete Building '${b.name}'?`,
        message: `Building '${b.name}' has ${associatedRooms.length} room(s) configured. Are you sure you want to delete this building along with all its floors, rooms, and bed slots?`,
        onConfirm: () => deleteBuilding(b.id, true),
      });
    } else {
      setDeleteSettingConfirm({
        title: `Delete Building '${b.name}'?`,
        message: `Are you sure you want to delete building '${b.name}' (${b.code})?`,
        onConfirm: () => deleteBuilding(b.id, false),
      });
    }
  };

  // Handlers for Floor
  const handleOpenAddFloor = (buildingId?: string) => {
    setFloorToEdit(null);
    setSelectedBuildingForFloor(buildingId || data.buildings[0]?.id || '');
    setIsFloorModalOpen(true);
  };
  const handleOpenEditFloor = (f: Floor) => {
    setFloorToEdit(f);
    setSelectedBuildingForFloor(f.buildingId);
    setIsFloorModalOpen(true);
  };
  const handleDeleteFloor = (f: Floor) => {
    const associatedRooms = data.rooms.filter((r) => r.floorId === f.id);
    if (associatedRooms.length > 0) {
      setDeleteSettingConfirm({
        title: `Delete Floor '${f.label}'?`,
        message: `Floor '${f.label}' has ${associatedRooms.length} room(s) configured on it. Are you sure you want to delete this floor along with all its rooms and bed slots?`,
        onConfirm: () => deleteFloor(f.id, true),
      });
    } else {
      setDeleteSettingConfirm({
        title: `Delete Floor '${f.label}'?`,
        message: `Are you sure you want to delete floor '${f.label}'?`,
        onConfirm: () => deleteFloor(f.id, false),
      });
    }
  };

  // Handlers for Room Type
  const handleOpenAddType = () => {
    setTypeToEdit(null);
    setIsTypeModalOpen(true);
  };
  const handleOpenEditType = (rt: RoomType) => {
    setTypeToEdit(rt);
    setIsTypeModalOpen(true);
  };
  const handleDeleteType = (rt: RoomType) => {
    const associatedRooms = data.rooms.filter((r) => r.roomTypeId === rt.id);
    if (associatedRooms.length > 0) {
      setDeleteSettingConfirm({
        title: `Delete Room Type '${rt.name}'?`,
        message: `Room type '${rt.name}' is assigned to ${associatedRooms.length} room(s). Delete category and reassign affected rooms to standard default?`,
        onConfirm: () => deleteRoomType(rt.id, true),
      });
    } else {
      setDeleteSettingConfirm({
        title: `Delete Room Type '${rt.name}'?`,
        message: `Are you sure you want to delete custom room type '${rt.name}'?`,
        onConfirm: () => deleteRoomType(rt.id, false),
      });
    }
  };

  // Handlers for Status Category
  const handleOpenAddStatus = () => {
    setStatusToEdit(null);
    setIsStatusModalOpen(true);
  };
  const handleOpenEditStatus = (st: StatusCategory) => {
    setStatusToEdit(st);
    setIsStatusModalOpen(true);
  };
  const handleDeleteStatus = (st: StatusCategory) => {
    const inUseCount =
      data.rooms.filter((r) => r.statusId === st.id).length +
      data.beds.filter((b) => b.statusId === st.id).length;

    if (inUseCount > 0) {
      setDeleteSettingConfirm({
        title: `Delete Status '${st.name}'?`,
        message: `Status '${st.name}' is currently assigned to ${inUseCount} item(s). Delete status category and reset affected items to Vacant/Available?`,
        onConfirm: () => deleteStatusCategory(st.id, true),
      });
    } else {
      setDeleteSettingConfirm({
        title: `Delete Status '${st.name}'?`,
        message: `Are you sure you want to delete status category '${st.name}'?`,
        onConfirm: () => deleteStatusCategory(st.id, false),
      });
    }
  };

  return (
    <div className="p-0 sm:p-2 lg:p-6 space-y-6 font-sans">
      {/* Top Header & Main Category Grouping */}
      <div className="bg-white p-4 sm:p-6 border border-[#E5E5E1] shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5E5E1]">
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
              System Administration
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Settings & Configuration</h2>
          </div>
          <div className="text-xs text-[#666662] max-w-sm font-medium">
            Manage property architecture, room inventory, custom statuses, and user access control.
          </div>
        </div>

        {/* Two Main Upper Headings / Group Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Main Heading 1: Property Settings */}
          <button
            onClick={() => {
              setActiveMainGroup('property');
              if (activeSubTab === 'users') setActiveSubTab('buildings');
            }}
            className={`p-5 text-left border transition-all rounded-xs ${
              activeMainGroup === 'property'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                : 'bg-[#F9F9F8] text-[#1A1A1A] border-[#E5E5E1] hover:border-[#1A1A1A] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Building2 className={`w-5 h-5 ${activeMainGroup === 'property' ? 'text-white' : 'text-[#1A1A1A]'}`} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Property Settings</h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs ${
                activeMainGroup === 'property' ? 'bg-white/20 text-white' : 'bg-[#E5E5E1] text-[#1A1A1A]'
              }`}>
                4 Modules
              </span>
            </div>
            <p className={`text-xs ${activeMainGroup === 'property' ? 'text-gray-300' : 'text-[#666662]'}`}>
              Buildings & Floors, Room Inventory, Room Types, and Status Categories.
            </p>
          </button>

          {/* Main Heading 2: User Management */}
          <button
            onClick={() => {
              setActiveMainGroup('users');
              setActiveSubTab('users');
            }}
            className={`p-5 text-left border transition-all rounded-xs ${
              activeMainGroup === 'users'
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-xs'
                : 'bg-[#F9F9F8] text-[#1A1A1A] border-[#E5E5E1] hover:border-[#1A1A1A] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Users className={`w-5 h-5 ${activeMainGroup === 'users' ? 'text-white' : 'text-[#1A1A1A]'}`} />
                <h3 className="text-sm font-bold uppercase tracking-wider">User Management</h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-xs ${
                activeMainGroup === 'users' ? 'bg-white/20 text-white' : 'bg-[#E5E5E1] text-[#1A1A1A]'
              }`}>
                {(data.users || []).length} Accounts
              </span>
            </div>
            <p className={`text-xs ${activeMainGroup === 'users' ? 'text-gray-300' : 'text-[#666662]'}`}>
              Manage user profiles, roles (Admin, Property Manager, Staff, Tenant), and access rights.
            </p>
          </button>
        </div>

        {/* Sub-Tab Navigation Bar when Property Settings is selected */}
        {activeMainGroup === 'property' && (
          <div className="pt-3 border-t border-[#E5E5E1] flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('buildings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSubTab === 'buildings'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F9F9F8] text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1]'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Buildings & Floors ({data.buildings.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('rooms')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSubTab === 'rooms'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F9F9F8] text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Room Inventory ({data.rooms.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('types')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSubTab === 'types'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F9F9F8] text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1]'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Room Types & Defaults ({data.roomTypes.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('statuses')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xs text-xs font-bold uppercase tracking-wider transition-colors ${
                activeSubTab === 'statuses'
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F9F9F8] text-[#666662] hover:text-[#1A1A1A] hover:bg-[#E5E5E1]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Status Categories ({data.statuses.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* SUB-TAB 1: BUILDINGS & FLOORS */}
      {activeSubTab === 'buildings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Property Hierarchy
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Buildings & Floor Levels
              </h3>
            </div>
            <button
              onClick={handleOpenAddBuilding}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[11px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Building</span>
            </button>
          </div>

          <div className="space-y-6">
            {data.buildings.length === 0 ? (
              <div className="bg-white p-8 border border-[#E5E5E1] text-center text-[#A3A39F] font-semibold">
                No buildings configured. Click "Add Building" above to create your first property block.
              </div>
            ) : (
              data.buildings.map((bldg) => {
                const bldgFloors = data.floors.filter((f) => f.buildingId === bldg.id);
                const bldgRooms = data.rooms.filter((r) => r.buildingId === bldg.id);

                return (
                  <div key={bldg.id} className="bg-white p-6 border border-[#E5E5E1] shadow-xs space-y-4">
                    {/* Building Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5E5E1]">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-xs bg-[#1A1A1A] text-white font-mono font-bold text-xs tracking-widest">
                          {bldg.code}
                        </span>
                        <div>
                          <h4 className="text-xl font-bold text-[#1A1A1A]">{bldg.name}</h4>
                          {bldg.description && (
                            <p className="text-xs text-[#666662] mt-0.5">{bldg.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#666662] bg-[#F9F9F8] px-3 py-1.5 border border-[#E5E5E1]">
                          {bldgFloors.length} Floors &bull; {bldgRooms.length} Rooms
                        </span>
                        <button
                          onClick={() => handleOpenAddFloor(bldg.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#333330] transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Floor</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditBuilding(bldg)}
                          className="p-1.5 text-[#666662] hover:text-[#1A1A1A] hover:bg-[#F0F0EE] border border-transparent hover:border-[#E5E5E1]"
                          title="Edit Building"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBuilding(bldg)}
                          className="p-1.5 text-[#666662] hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                          title="Delete Building"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Floors List under this building */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-[#A3A39F] mb-3 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Configured Floor Levels ({bldgFloors.length})</span>
                      </div>

                      {bldgFloors.length === 0 ? (
                        <div className="p-4 bg-[#F9F9F8] border border-dashed border-[#E5E5E1] text-xs text-[#A3A39F] flex items-center justify-between">
                          <span>No floors created for this building yet.</span>
                          <button
                            onClick={() => handleOpenAddFloor(bldg.id)}
                            className="text-[#1A1A1A] font-bold underline hover:text-[#333330]"
                          >
                            + Create First Floor
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {bldgFloors.map((flr) => {
                            const floorRooms = data.rooms.filter((r) => r.floorId === flr.id);

                            return (
                              <div
                                key={flr.id}
                                className="p-3.5 bg-[#F9F9F8] border border-[#E5E5E1] flex items-center justify-between hover:border-[#1A1A1A] transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-[#1A1A1A] text-sm flex items-center gap-2">
                                    <span>{flr.label}</span>
                                    <span className="text-[10px] font-mono font-normal text-[#A3A39F]">
                                      (Level #{flr.number})
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-[#666662] mt-0.5">
                                    {floorRooms.length} Rooms Assigned
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditFloor(flr)}
                                    className="p-1 text-[#A3A39F] hover:text-[#1A1A1A]"
                                    title="Edit Floor"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFloor(flr)}
                                    className="p-1 text-[#A3A39F] hover:text-rose-700"
                                    title="Delete Floor"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ROOM INVENTORY */}
      {activeSubTab === 'rooms' && (
        <RoomInventoryView embedded={true} />
      )}

      {/* SUB-TAB 3: ROOM TYPES & BED CONFIGURATIONS */}
      {activeSubTab === 'types' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Category System
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Room Types & Default Bed Counts
              </h3>
            </div>
            <button
              onClick={handleOpenAddType}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {data.roomTypes.map((type) => {
              const configuredRoomsCount = data.rooms.filter((r) => r.roomTypeId === type.id).length;

              return (
                <div
                  key={type.id}
                  className="bg-white p-6 border border-[#E5E5E1] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.badgeColor || '#1A1A1A' }}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditType(type)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-[#1A1A1A] mt-3">{type.name}</h4>
                    {type.description && (
                      <p className="text-xs text-[#666662] mt-1 line-clamp-2">{type.description}</p>
                    )}

                    <div className="mt-4 p-3 bg-[#F9F9F8] border border-[#E5E5E1] flex items-center justify-between text-xs">
                      <span className="text-[#666662] font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-[#1A1A1A]" />
                        <span>Default Beds</span>
                      </span>
                      <span className="font-bold text-[#1A1A1A] text-lg">{type.defaultBedCount}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E5E1] text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">
                    {configuredRoomsCount} Rooms Assigned
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: CUSTOM STATUS CATEGORIES */}
      {activeSubTab === 'statuses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest font-bold text-[#A3A39F] mb-1">
                Operational Taxonomy
              </div>
              <h3 className="text-2xl font-bold text-[#1A1A1A]">
                Custom Status Categories
              </h3>
            </div>
            <button
              onClick={handleOpenAddStatus}
              className="flex items-center gap-2 px-5 py-3 rounded-xs bg-[#1A1A1A] hover:bg-[#333330] text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Status Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.statuses.map((st) => {
              const roomsWithStatus = data.rooms.filter((r) => r.statusId === st.id).length;
              const bedsWithStatus = data.beds.filter((b) => b.statusId === st.id).length;

              return (
                <div
                  key={st.id}
                  className="bg-white p-6 border border-[#E5E5E1] shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
                      <span
                        className="px-3 py-1 rounded-xs text-white font-bold text-[10px] uppercase tracking-wider"
                        style={{ backgroundColor: st.color || '#1A1A1A' }}
                      >
                        {st.name}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditStatus(st)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#1A1A1A]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(st)}
                          className="p-1.5 text-[#A3A39F] hover:text-[#9E2A2B]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#A3A39F] mt-3">
                      Target: <span className="text-[#1A1A1A]">{st.type.toUpperCase()}</span>
                    </div>

                    {st.description && (
                      <p className="text-xs text-[#666662] mt-1">{st.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {st.isOccupiedState && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0F0EE] text-[#1A1A1A] px-2.5 py-0.5 border border-[#E5E5E1]">
                          Occupied State
                        </span>
                      )}
                      {st.isMaintenanceState && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FDF2F0] text-[#9E2A2B] px-2.5 py-0.5 border border-[#F5C6C2]">
                          Maintenance Alert
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[#E5E5E1] text-[10px] uppercase tracking-wider font-bold text-[#A3A39F]">
                    In Use: {roomsWithStatus} Rooms & {bedsWithStatus} Beds
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: USER ACCOUNTS & PERMISSIONS */}
      {activeSubTab === 'users' && (
        <UserManagementView embedded={true} />
      )}

      {/* CRUD Modals */}
      <BuildingModal
        isOpen={isBuildingModalOpen}
        onClose={() => setIsBuildingModalOpen(false)}
        buildingToEdit={buildingToEdit}
      />

      <FloorModal
        isOpen={isFloorModalOpen}
        onClose={() => setIsFloorModalOpen(false)}
        floorToEdit={floorToEdit}
        defaultBuildingId={selectedBuildingForFloor}
      />

      <RoomTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        typeToEdit={typeToEdit}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        statusToEdit={statusToEdit}
      />

      {/* Delete Setting Confirmation Modal */}
      {deleteSettingConfirm && (
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
                <h3 className="font-bold text-base">{deleteSettingConfirm.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSettingConfirm(null)}
                className="text-[#A3A39F] hover:text-white p-1 transition-colors"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-[#666662] leading-relaxed">
                {deleteSettingConfirm.message}
              </p>
              <p className="text-[11px] text-[#888880] bg-[#F9F9F8] p-3 border border-[#E5E5E1] rounded-xs">
                This action will update associated system configurations.
              </p>

              <div className="pt-3 border-t border-[#E5E5E1] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteSettingConfirm(null)}
                  className="px-4 py-2 border border-[#E5E5E1] text-[#666662] hover:bg-[#F0F0EE] font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteSettingConfirm.onConfirm();
                    setDeleteSettingConfirm(null);
                  }}
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

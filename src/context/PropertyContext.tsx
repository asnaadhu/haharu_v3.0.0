import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase as supabaseMaybe } from '../lib/supabase';
// Assert non-null for mutation functions — they're all wrapped in try/catch,
// and loadData() handles the null case by falling back to local initial data.
const supabase = supabaseMaybe as NonNullable<typeof supabaseMaybe>;
import {
  PropertyData,
  Building,
  Floor,
  RoomType,
  StatusCategory,
  Room,
  Bed,
  BedAssignment,
  ActivityLog,
  UserProfile,
  UserRole,
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenanceUrgency,
  MaintenanceStatus,
  FoodWasteLog,
  TransferRecord,
  TransferAuditLogEntry,
} from '../types';
import { INITIAL_PROPERTY_DATA } from '../data/initialData';
import { getFullClientMeta } from '../utils/deviceInfo';
import {
  rowToBuilding, rowToFloor, rowToRoomType, rowToStatus, rowToRoom, rowToBed,
  rowToUser, rowToMaintenance, rowToFoodWaste, rowToTransfer, rowToActivityLog,
  buildingToRow, floorToRow, roomTypeToRow, statusToRow, roomToRow, bedToRow,
  userToRow, maintenanceToRow, foodWasteToRow, transferToRow, activityLogToRow,
  cleanForSupabase,
} from '../lib/transformers';

interface PropertyContextType {
  data: PropertyData;
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  addBuilding: (name: string, code: string, description?: string) => Promise<void>;
  updateBuilding: (id: string, name: string, code: string, description?: string) => Promise<void>;
  deleteBuilding: (id: string, force?: boolean) => Promise<boolean>;

  addFloor: (buildingId: string, number: number, label: string, description?: string) => Promise<void>;
  updateFloor: (id: string, number: number, label: string, description?: string) => Promise<void>;
  deleteFloor: (id: string, force?: boolean) => Promise<boolean>;

  addRoomType: (name: string, defaultBedCount: number, description?: string, badgeColor?: string) => Promise<void>;
  updateRoomType: (id: string, name: string, defaultBedCount: number, description?: string, badgeColor?: string) => Promise<void>;
  deleteRoomType: (id: string, force?: boolean) => Promise<boolean>;

  addStatusCategory: (
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => Promise<void>;
  updateStatusCategory: (
    id: string,
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => Promise<void>;
  deleteStatusCategory: (id: string, force?: boolean) => Promise<boolean>;

  addRoom: (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    roomTypeId: string,
    customBedCount?: number,
    notes?: string
  ) => Promise<void>;
  updateRoom: (
    id: string,
    roomNumber: string,
    roomTypeId: string,
    totalBeds: number,
    statusId: string,
    notes?: string
  ) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  assignBed: (bedId: string, memberData: BedAssignment) => Promise<void>;
  checkoutBed: (bedId: string) => Promise<void>;
  updateBedStatus: (bedId: string, statusId: string, notes?: string) => Promise<void>;

  addMaintenanceRequest: (reqData: {
    title: string;
    description: string;
    category: MaintenanceCategory;
    urgency: MaintenanceUrgency;
    buildingId: string;
    floorId: string;
    roomId: string;
    bedId?: string;
    requesterId: string;
    requesterName: string;
    requesterRole: UserRole;
    contactPhone?: string;
    setRoomBedMaintenance?: boolean;
  }) => Promise<void>;

  updateMaintenanceRequest: (id: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
  completeMaintenanceRequest: (id: string, resolutionNotes?: string, revertRoomBedStatus?: boolean) => Promise<void>;
  deleteMaintenanceRequest: (id: string) => Promise<void>;

  addFoodWasteLog: (logData: Omit<FoodWasteLog, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFoodWasteLog: (id: string, updates: Partial<FoodWasteLog>) => Promise<void>;
  deleteFoodWasteLog: (id: string) => Promise<void>;

  addTransferRecord: (recordData: Omit<TransferRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransferRecord: (id: string, updates: Partial<TransferRecord>) => Promise<void>;
  deleteTransferRecord: (id: string) => Promise<void>;

  addUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  writeLog: (
    action: ActivityLog['action'],
    title: string,
    details: string,
    actorInfo?: {
      actor?: string;
      actorEmail?: string;
      actorRole?: string;
      ipAddress?: string;
      browser?: string;
      deviceType?: string;
    }
  ) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  saveDataToServer: (newData: PropertyData) => Promise<void>;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

const recalculateRoomStatus = (allBeds: Bed[], allStatuses: StatusCategory[], roomId: string, currentRoomStatus: string): string => {
  const roomBeds = allBeds.filter((b) => b.roomId === roomId);
  if (roomBeds.length === 0) return currentRoomStatus;

  const occupiedBeds = roomBeds.filter((b) => {
    const statusObj = allStatuses.find((s) => s.id === b.statusId);
    return b.assignedTo != null || statusObj?.isOccupiedState === true;
  }).length;

  const maintenanceBeds = roomBeds.filter((b) => {
    const statusObj = allStatuses.find((s) => s.id === b.statusId);
    return statusObj?.isMaintenanceState === true;
  }).length;

  if (maintenanceBeds === roomBeds.length) return 'status-maintenance';
  if (occupiedBeds === 0) return 'status-vacant';
  if (occupiedBeds === roomBeds.length) return 'status-occupied';
  return 'status-partially';
};

// Table names in the database
const TABLES = {
  buildings: 'buildings',
  floors: 'floors',
  roomTypes: 'room_types',
  statuses: 'statuses',
  rooms: 'rooms',
  beds: 'beds',
  logs: 'activity_logs',
  users: 'users',
  maintenanceRequests: 'maintenance_requests',
  foodWasteLogs: 'food_waste_logs',
  transferRecords: 'transfer_records',
} as const;

export const PropertyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PropertyData>({
    buildings: [],
    floors: [],
    roomTypes: [],
    statuses: [],
    rooms: [],
    beds: [],
    logs: [],
    users: [],
    maintenanceRequests: [],
    foodWasteLogs: [],
    transferRecords: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Mutable ref mirror of data so async functions always see the latest state
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

  // --- Initial load + realtime subscriptions ---
  useEffect(() => {
    let channel: ReturnType<typeof supabase['channel']> | null = null;

    async function loadData() {
      if (!supabaseMaybe) {
        setData(INITIAL_PROPERTY_DATA);
        setIsLoading(false);
        return;
      }

      try {
        // Check if database is empty — if so, seed initial data
        const { count: buildingCount } = await supabase
          .from(TABLES.buildings)
          .select('*', { count: 'exact', head: true });

        if (buildingCount === 0) {
          // Seed room types, statuses, users, food waste, transfers
          await seedInitialData();
        }

        // Fetch all data in parallel
        const [buildingsRes, floorsRes, roomTypesRes, statusesRes, roomsRes, bedsRes,
          logsRes, usersRes, maintenanceRes, foodWasteRes, transferRes] = await Promise.all([
          supabase.from(TABLES.buildings).select('*'),
          supabase.from(TABLES.floors).select('*'),
          supabase.from(TABLES.roomTypes).select('*'),
          supabase.from(TABLES.statuses).select('*'),
          supabase.from(TABLES.rooms).select('*'),
          supabase.from(TABLES.beds).select('*'),
          supabase.from(TABLES.logs).select('*'),
          supabase.from(TABLES.users).select('*'),
          supabase.from(TABLES.maintenanceRequests).select('*'),
          supabase.from(TABLES.foodWasteLogs).select('*'),
          supabase.from(TABLES.transferRecords).select('*'),
        ]);

        const buildings = (buildingsRes.data || []).map(rowToBuilding);
        const floors = (floorsRes.data || []).map(rowToFloor);
        const roomTypes = (roomTypesRes.data || []).map(rowToRoomType);
        const statuses = (statusesRes.data || []).map(rowToStatus);
        const rooms = (roomsRes.data || []).map(rowToRoom);
        const beds = (bedsRes.data || []).map(rowToBed);
        const logs = (logsRes.data || []).map(rowToActivityLog).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        const users = (usersRes.data || []).map(rowToUser);
        const maintenanceRequests = (maintenanceRes.data || []).map(rowToMaintenance);
        const foodWasteLogs = (foodWasteRes.data || []).map(rowToFoodWaste).sort(
          (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
        );
        const transferRecords = (transferRes.data || []).map(rowToTransfer).sort(
          (a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime()
        );

        setData({
          buildings, floors, roomTypes, statuses, rooms, beds, logs, users,
          maintenanceRequests, foodWasteLogs, transferRecords,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load data from Supabase:', err);
        setData(INITIAL_PROPERTY_DATA);
        setIsLoading(false);
      }
    }

    loadData();

    if (!supabaseMaybe) return;

    // Realtime: refetch all data when any table changes
    channel = supabase
      .channel('property-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.buildings }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.floors }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.roomTypes }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.statuses }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.rooms }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.beds }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.logs }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.users }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.maintenanceRequests }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.foodWasteLogs }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLES.transferRecords }, () => loadData())
      .subscribe();

    return () => {
      if (channel && supabaseMaybe) supabase.removeChannel(channel);
    };
  }, []);

  // --- Seeding ---
  async function seedInitialData() {
    if (!supabaseMaybe) return;
    const initial = INITIAL_PROPERTY_DATA;
    const tables: { table: string; rows: Record<string, unknown>[] }[] = [];

    if (initial.roomTypes.length) {
      tables.push({ table: TABLES.roomTypes, rows: initial.roomTypes.map(rt => cleanForSupabase(roomTypeToRow(rt))) });
    }
    if (initial.statuses.length) {
      tables.push({ table: TABLES.statuses, rows: initial.statuses.map(s => cleanForSupabase(statusToRow(s))) });
    }
    if (initial.users.length) {
      tables.push({ table: TABLES.users, rows: initial.users.map(u => cleanForSupabase(userToRow(u))) });
    }
    if (initial.foodWasteLogs?.length) {
      tables.push({ table: TABLES.foodWasteLogs, rows: initial.foodWasteLogs.map(f => cleanForSupabase(foodWasteToRow(f))) });
    }
    if (initial.transferRecords?.length) {
      tables.push({ table: TABLES.transferRecords, rows: initial.transferRecords.map(t => cleanForSupabase(transferToRow(t))) });
    }

    for (const { table, rows } of tables) {
      if (rows.length === 0) continue;
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (error) console.error(`Seed error for ${table}:`, error);
    }
  }

  // --- Log Writer ---
  const writeLog = async (
    action: ActivityLog['action'],
    title: string,
    details: string,
    actorInfo?: {
      actor?: string;
      actorEmail?: string;
      actorRole?: string;
      ipAddress?: string;
      browser?: string;
      deviceType?: string;
    }
  ) => {
    if (!supabaseMaybe) return;
    try {
      const clientMeta = getFullClientMeta();
      const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newLog: ActivityLog = {
        id: logId,
        timestamp: new Date().toISOString(),
        action,
        title,
        details,
        actor: actorInfo?.actor || 'Admin',
        actorEmail: actorInfo?.actorEmail,
        actorRole: actorInfo?.actorRole,
        ipAddress: actorInfo?.ipAddress || clientMeta.ipAddress,
        browser: actorInfo?.browser || clientMeta.browser,
        deviceType: actorInfo?.deviceType || clientMeta.deviceType,
      };
      const { error } = await supabase.from(TABLES.logs).insert(cleanForSupabase(activityLogToRow(newLog)));
      if (error) console.error('Write log error:', error);
    } catch (err) {
      console.error('Write log error:', err);
    }
  };

  // --- Building Actions ---
  const addBuilding = async (name: string, code: string, description?: string) => {
    try {
      const newBuilding: Building = {
        id: `bldg-${Date.now()}`,
        name, code, description,
        createdAt: new Date().toISOString(),
      };
      const { error } = await supabase.from(TABLES.buildings).insert(cleanForSupabase(buildingToRow(newBuilding)));
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Building Added', `Added building ${name} (${code})`);
    } catch (err) {
      console.error('Add building error:', err);
    }
  };

  const updateBuilding = async (id: string, name: string, code: string, description?: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.buildings)
        .update({ name, code, description: description || '' })
        .eq('id', id);
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Building Updated', `Updated building details for ${name}`);
    } catch (err) {
      console.error('Update building error:', err);
    }
  };

  const deleteBuilding = async (id: string, force = false): Promise<boolean> => {
    try {
      const current = dataRef.current;
      const associatedRooms = current.rooms.filter((r) => r.buildingId === id);
      if (associatedRooms.length > 0 && !force) return false;

      // Delete associated floors, rooms, beds first
      const associatedFloors = current.floors.filter((f) => f.buildingId === id);
      const deletedRoomIds = associatedRooms.map((r) => r.id);
      const associatedBeds = current.beds.filter((b) => deletedRoomIds.includes(b.roomId));
      const deletedBedIds = associatedBeds.map((b) => b.id);

      // Unassign users linked to deleted beds/buildings
      const affectedUsers = (current.users || []).filter(
        (u) =>
          (u.assignedBedId && deletedBedIds.includes(u.assignedBedId)) ||
          u.assignedBuildingIds?.includes(id)
      );

      for (const u of affectedUsers) {
        const nextBedId = u.assignedBedId && deletedBedIds.includes(u.assignedBedId) ? null : u.assignedBedId;
        const nextBuildings = u.assignedBuildingIds ? u.assignedBuildingIds.filter((bId) => bId !== id) : [];
        await supabase.from(TABLES.users)
          .update({ assigned_bed_id: nextBedId, assigned_building_ids: nextBuildings })
          .eq('id', u.id);
      }

      // Delete beds, rooms, floors, building (CASCADE on floors/rooms/beds handles DB side, but be explicit)
      if (associatedBeds.length) {
        await supabase.from(TABLES.beds).delete().in('id', deletedBedIds);
      }
      if (associatedRooms.length) {
        await supabase.from(TABLES.rooms).delete().in('id', deletedRoomIds);
      }
      if (associatedFloors.length) {
        await supabase.from(TABLES.floors).delete().in('id', associatedFloors.map(f => f.id));
      }
      const { error } = await supabase.from(TABLES.buildings).delete().eq('id', id);
      if (error) throw error;

      await writeLog('SETTING_CHANGE', 'Building Removed', `Deleted building ID ${id}`);
      return true;
    } catch (err) {
      console.error('Delete building error:', err);
      return false;
    }
  };

  // --- Floor Actions ---
  const addFloor = async (buildingId: string, number: number, label: string, description?: string) => {
    try {
      const newFloor: Floor = {
        id: `flr-${Date.now()}`,
        buildingId, number, label, description,
      };
      const { error } = await supabase.from(TABLES.floors).insert(cleanForSupabase(floorToRow(newFloor)));
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Floor Added', `Added floor ${label} (#${number})`);
    } catch (err) {
      console.error('Add floor error:', err);
    }
  };

  const updateFloor = async (id: string, number: number, label: string, description?: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.floors)
        .update({ number, label, description: description || '' })
        .eq('id', id);
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Floor Updated', `Updated floor ${label}`);
    } catch (err) {
      console.error('Update floor error:', err);
    }
  };

  const deleteFloor = async (id: string, force = false): Promise<boolean> => {
    try {
      const current = dataRef.current;
      const associatedRooms = current.rooms.filter((r) => r.floorId === id);
      if (associatedRooms.length > 0 && !force) return false;

      const deletedRoomIds = associatedRooms.map((r) => r.id);
      const associatedBeds = current.beds.filter((b) => deletedRoomIds.includes(b.roomId));

      if (associatedBeds.length) {
        await supabase.from(TABLES.beds).delete().in('id', associatedBeds.map(b => b.id));
      }
      if (associatedRooms.length) {
        await supabase.from(TABLES.rooms).delete().in('id', deletedRoomIds);
      }
      const { error } = await supabase.from(TABLES.floors).delete().eq('id', id);
      if (error) throw error;

      await writeLog('SETTING_CHANGE', 'Floor Removed', `Deleted floor ID ${id}`);
      return true;
    } catch (err) {
      console.error('Delete floor error:', err);
      return false;
    }
  };

  // --- Room Type Actions ---
  const addRoomType = async (name: string, defaultBedCount: number, description?: string, badgeColor: string = '#3b82f6') => {
    try {
      const newRoomType: RoomType = {
        id: `rtype-${Date.now()}`,
        name, defaultBedCount, description, badgeColor,
      };
      const { error } = await supabase.from(TABLES.roomTypes).insert(cleanForSupabase(roomTypeToRow(newRoomType)));
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Room Type Added', `Added custom type ${name}`);
    } catch (err) {
      console.error('Add room type error:', err);
    }
  };

  const updateRoomType = async (id: string, name: string, defaultBedCount: number, description?: string, badgeColor?: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.roomTypes)
        .update({
          name, default_bed_count: defaultBedCount,
          description: description || '', badge_color: badgeColor || '#3b82f6',
        })
        .eq('id', id);
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Room Type Updated', `Updated room type ${name}`);
    } catch (err) {
      console.error('Update room type error:', err);
    }
  };

  const deleteRoomType = async (id: string, force = false): Promise<boolean> => {
    try {
      const current = dataRef.current;
      const associatedRooms = current.rooms.filter((r) => r.roomTypeId === id);
      if (associatedRooms.length > 0 && !force) return false;

      const fallbackType = current.roomTypes.find((rt) => rt.id !== id);

      if (associatedRooms.length) {
        await supabase.from(TABLES.rooms)
          .update({ room_type_id: fallbackType?.id || 'rtype-std' })
          .in('id', associatedRooms.map(r => r.id));
      }

      const { error } = await supabase.from(TABLES.roomTypes).delete().eq('id', id);
      if (error) throw error;

      await writeLog('SETTING_CHANGE', 'Room Type Deleted', `Deleted room type ID ${id}`);
      return true;
    } catch (err) {
      console.error('Delete room type error:', err);
      return false;
    }
  };

  // --- Status Category Actions ---
  const addStatusCategory = async (
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState: boolean = false,
    isMaintenanceState: boolean = false
  ) => {
    try {
      const newStatus: StatusCategory = {
        id: `status-${Date.now()}`,
        name, type, color, description, isOccupiedState, isMaintenanceState,
      };
      const { error } = await supabase.from(TABLES.statuses).insert(cleanForSupabase(statusToRow(newStatus)));
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Status Category Added', `Added status '${name}'`);
    } catch (err) {
      console.error('Add status error:', err);
    }
  };

  const updateStatusCategory = async (
    id: string,
    name: string,
    type: 'room' | 'bed' | 'both',
    color: string,
    description?: string,
    isOccupiedState?: boolean,
    isMaintenanceState?: boolean
  ) => {
    try {
      const { error } = await supabase
        .from(TABLES.statuses)
        .update({
          name, type, color, description: description || '',
          is_occupied_state: isOccupiedState ?? false,
          is_maintenance_state: isMaintenanceState ?? false,
        })
        .eq('id', id);
      if (error) throw error;
      await writeLog('SETTING_CHANGE', 'Status Category Updated', `Updated status '${name}'`);
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const deleteStatusCategory = async (id: string, force = false): Promise<boolean> => {
    try {
      const current = dataRef.current;
      const inUseRooms = current.rooms.filter((r) => r.statusId === id);
      const inUseBeds = current.beds.filter((b) => b.statusId === id);
      if ((inUseRooms.length > 0 || inUseBeds.length > 0) && !force) return false;

      if (inUseRooms.length) {
        await supabase.from(TABLES.rooms)
          .update({ status_id: 'status-vacant' })
          .in('id', inUseRooms.map(r => r.id));
      }
      if (inUseBeds.length) {
        await supabase.from(TABLES.beds)
          .update({ status_id: 'status-vacant' })
          .in('id', inUseBeds.map(b => b.id));
      }

      const { error } = await supabase.from(TABLES.statuses).delete().eq('id', id);
      if (error) throw error;

      await writeLog('SETTING_CHANGE', 'Status Category Deleted', `Deleted status category ID ${id}`);
      return true;
    } catch (err) {
      console.error('Delete status error:', err);
      return false;
    }
  };

  // --- Room Actions ---
  const addRoom = async (
    buildingId: string,
    floorId: string,
    roomNumber: string,
    roomTypeId: string,
    customBedCount?: number,
    notes?: string
  ) => {
    try {
      const current = dataRef.current;
      const roomType = current.roomTypes.find((rt) => rt.id === roomTypeId);
      const bedCount = customBedCount || roomType?.defaultBedCount || 1;
      const roomId = `rm-${Date.now()}`;

      const newRoom: Room = {
        id: roomId, buildingId, floorId, roomNumber, roomTypeId,
        totalBeds: bedCount, statusId: 'status-vacant', notes,
        lastCleaned: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      const newBeds: Bed[] = Array.from({ length: bedCount }, (_, i) => ({
        id: `bed-${roomId}-${i + 1}`,
        roomId, bedNumber: i + 1,
        label: bedCount === 1 ? 'Master Bed' : `Bed ${i + 1}`,
        statusId: 'status-vacant', assignedTo: null,
      }));

      const { error: roomErr } = await supabase.from(TABLES.rooms).insert(cleanForSupabase(roomToRow(newRoom)));
      if (roomErr) throw roomErr;

      if (newBeds.length) {
        const { error: bedsErr } = await supabase.from(TABLES.beds)
          .insert(newBeds.map(b => cleanForSupabase(bedToRow(b))));
        if (bedsErr) throw bedsErr;
      }

      await writeLog('ROOM_CREATE', 'Room Created', `Created Room #${roomNumber} with ${bedCount} beds`);
    } catch (err) {
      console.error('Add room error:', err);
    }
  };

  const updateRoom = async (
    id: string,
    roomNumber: string,
    roomTypeId: string,
    totalBeds: number,
    statusId: string,
    notes?: string
  ) => {
    try {
      const current = dataRef.current;
      const currentBeds = current.beds.filter((b) => b.roomId === id);

      if (totalBeds > currentBeds.length) {
        const addedCount = totalBeds - currentBeds.length;
        const newBeds: Record<string, unknown>[] = [];
        for (let i = 0; i < addedCount; i++) {
          const num = currentBeds.length + i + 1;
          newBeds.push(cleanForSupabase(bedToRow({
            id: `bed-${id}-${num}`, roomId: id, bedNumber: num,
            label: `Bed ${num}`, statusId: 'status-vacant', assignedTo: null,
          })));
        }
        const { error } = await supabase.from(TABLES.beds).insert(newBeds);
        if (error) throw error;
      } else if (totalBeds < currentBeds.length) {
        const bedsToRemove = currentBeds.slice(totalBeds);
        const { error } = await supabase.from(TABLES.beds)
          .delete().in('id', bedsToRemove.map(b => b.id));
        if (error) throw error;
      }

      const { error } = await supabase
        .from(TABLES.rooms)
        .update({
          room_number: roomNumber, room_type_id: roomTypeId,
          total_beds: totalBeds, status_id: statusId,
          notes: notes || '', updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;

      await writeLog('ROOM_UPDATE', 'Room Updated', `Updated Room #${roomNumber}`);
    } catch (err) {
      console.error('Update room error:', err);
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      const current = dataRef.current;
      const room = current.rooms.find((r) => r.id === id);
      const associatedBeds = current.beds.filter((b) => b.roomId === id);

      if (associatedBeds.length) {
        await supabase.from(TABLES.beds).delete().in('id', associatedBeds.map(b => b.id));
      }
      const { error } = await supabase.from(TABLES.rooms).delete().eq('id', id);
      if (error) throw error;

      await writeLog('ROOM_UPDATE', 'Room Deleted', `Deleted Room #${room?.roomNumber || id}`);
    } catch (err) {
      console.error('Delete room error:', err);
    }
  };

  // --- Bed & Assignment Actions ---
  const assignBed = async (bedId: string, memberData: BedAssignment) => {
    try {
      const current = dataRef.current;
      const targetBed = current.beds.find((b) => b.id === bedId);
      if (!targetBed) return;

      const { error: bedErr } = await supabase
        .from(TABLES.beds)
        .update({ status_id: 'status-occupied', assigned_to: memberData })
        .eq('id', bedId);
      if (bedErr) throw bedErr;

      const updatedBeds = current.beds.map((b) =>
        b.id === bedId ? { ...b, statusId: 'status-occupied', assignedTo: memberData } : b
      );
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, current.statuses, targetBed.roomId, 'status-occupied');
      const { error: roomErr } = await supabase
        .from(TABLES.rooms)
        .update({ status_id: calcRoomStatus, updated_at: new Date().toISOString() })
        .eq('id', targetBed.roomId);
      if (roomErr) throw roomErr;

      const room = current.rooms.find((r) => r.id === targetBed.roomId);
      await writeLog(
        'ASSIGN', 'Team Member Assigned',
        `Assigned ${memberData.memberName} to Room #${room?.roomNumber || ''} - ${targetBed.label}`
      );
    } catch (err) {
      console.error('Assign bed error:', err);
    }
  };

  const checkoutBed = async (bedId: string) => {
    try {
      const current = dataRef.current;
      const targetBed = current.beds.find((b) => b.id === bedId);
      if (!targetBed) return;
      const assignedName = targetBed.assignedTo?.memberName || 'Member';

      const { error: bedErr } = await supabase
        .from(TABLES.beds)
        .update({ status_id: 'status-vacant', assigned_to: null })
        .eq('id', bedId);
      if (bedErr) throw bedErr;

      const updatedBeds = current.beds.map((b) =>
        b.id === bedId ? { ...b, statusId: 'status-vacant', assignedTo: null } : b
      );
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, current.statuses, targetBed.roomId, 'status-vacant');
      const { error: roomErr } = await supabase
        .from(TABLES.rooms)
        .update({ status_id: calcRoomStatus, updated_at: new Date().toISOString() })
        .eq('id', targetBed.roomId);
      if (roomErr) throw roomErr;

      const room = current.rooms.find((r) => r.id === targetBed.roomId);
      await writeLog(
        'CHECKOUT', 'Bed Checkout',
        `Checked out ${assignedName} from Room #${room?.roomNumber || ''} - ${targetBed.label}`
      );
    } catch (err) {
      console.error('Checkout bed error:', err);
    }
  };

  const updateBedStatus = async (bedId: string, statusId: string, notes?: string) => {
    try {
      const current = dataRef.current;
      const targetBed = current.beds.find((b) => b.id === bedId);
      if (!targetBed) return;

      const updatePayload: Record<string, unknown> = { status_id: statusId };
      if (notes !== undefined) updatePayload.notes = notes;

      const { error: bedErr } = await supabase.from(TABLES.beds).update(updatePayload).eq('id', bedId);
      if (bedErr) throw bedErr;

      const updatedBeds = current.beds.map((b) => (b.id === bedId ? { ...b, statusId, notes: notes ?? b.notes } : b));
      const calcRoomStatus = recalculateRoomStatus(updatedBeds, current.statuses, targetBed.roomId, statusId);
      const { error: roomErr } = await supabase
        .from(TABLES.rooms)
        .update({ status_id: calcRoomStatus, updated_at: new Date().toISOString() })
        .eq('id', targetBed.roomId);
      if (roomErr) throw roomErr;

      const statusObj = current.statuses.find((s) => s.id === statusId);
      await writeLog(
        'STATUS_CHANGE', 'Bed Status Change',
        `Bed ${targetBed.label} status changed to ${statusObj?.name || statusId}`
      );
    } catch (err) {
      console.error('Update bed status error:', err);
    }
  };

  // --- Maintenance Request Actions ---
  const addMaintenanceRequest = async (reqData: {
    title: string;
    description: string;
    category: MaintenanceCategory;
    urgency: MaintenanceUrgency;
    buildingId: string;
    floorId: string;
    roomId: string;
    bedId?: string;
    requesterId: string;
    requesterName: string;
    requesterRole: UserRole;
    contactPhone?: string;
    setRoomBedMaintenance?: boolean;
  }) => {
    try {
      const newReqId = `maint-${Date.now()}`;
      const newRequest: MaintenanceRequest = {
        id: newReqId,
        title: reqData.title,
        description: reqData.description,
        category: reqData.category,
        urgency: reqData.urgency,
        status: 'New' as MaintenanceStatus,
        buildingId: reqData.buildingId,
        floorId: reqData.floorId,
        roomId: reqData.roomId,
        bedId: reqData.bedId,
        requesterId: reqData.requesterId,
        requesterName: reqData.requesterName,
        requesterRole: reqData.requesterRole,
        contactPhone: reqData.contactPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updateRoomBedStatusOnComplete: reqData.setRoomBedMaintenance ?? true,
      };

      const { error } = await supabase.from(TABLES.maintenanceRequests)
        .insert(cleanForSupabase(maintenanceToRow(newRequest)));
      if (error) throw error;

      if (reqData.setRoomBedMaintenance) {
        if (reqData.bedId) {
          await supabase.from(TABLES.beds).update({ status_id: 'status-maintenance' }).eq('id', reqData.bedId);
        }
        if (reqData.roomId) {
          await supabase.from(TABLES.rooms).update({ status_id: 'status-maintenance' }).eq('id', reqData.roomId);
        }
      }

      await writeLog(
        'MAINTENANCE_CREATE', 'Maintenance Request Created',
        `Created [${reqData.urgency}] request: "${reqData.title}" by ${reqData.requesterName}`
      );
    } catch (err) {
      console.error('Add maintenance error:', err);
    }
  };

  const updateMaintenanceRequest = async (id: string, updates: Partial<MaintenanceRequest>) => {
    try {
      const current = dataRef.current;
      const targetReq = current.maintenanceRequests.find((r) => r.id === id);

      const updateRow: Record<string, unknown> = {};
      if (updates.title !== undefined) updateRow.title = updates.title;
      if (updates.description !== undefined) updateRow.description = updates.description;
      if (updates.category !== undefined) updateRow.category = updates.category;
      if (updates.urgency !== undefined) updateRow.urgency = updates.urgency;
      if (updates.status !== undefined) updateRow.status = updates.status;
      if (updates.assignedTechnician !== undefined) updateRow.assigned_technician = updates.assignedTechnician;
      if (updates.assignedTechnicianPhone !== undefined) updateRow.assigned_technician_phone = updates.assignedTechnicianPhone;
      if (updates.contactPhone !== undefined) updateRow.contact_phone = updates.contactPhone;
      if (updates.resolutionNotes !== undefined) updateRow.resolution_notes = updates.resolutionNotes;
      updateRow.updated_at = new Date().toISOString();

      const { error } = await supabase.from(TABLES.maintenanceRequests).update(updateRow).eq('id', id);
      if (error) throw error;

      await writeLog(
        'MAINTENANCE_UPDATE', 'Maintenance Request Updated',
        `Updated maintenance request "${targetReq?.title || id}"`
      );
    } catch (err) {
      console.error('Update maintenance error:', err);
    }
  };

  const completeMaintenanceRequest = async (id: string, resolutionNotes?: string, revertRoomBedStatus: boolean = true) => {
    try {
      const current = dataRef.current;
      const targetReq = current.maintenanceRequests.find((r) => r.id === id);
      if (!targetReq) return;

      const now = new Date().toISOString();
      const { error } = await supabase
        .from(TABLES.maintenanceRequests)
        .update({
          status: 'Completed',
          completed_at: now,
          updated_at: now,
          resolution_notes: resolutionNotes || targetReq.resolutionNotes || 'Maintenance completed successfully.',
        })
        .eq('id', id);
      if (error) throw error;

      if (revertRoomBedStatus) {
        if (targetReq.bedId) {
          const bed = current.beds.find((b) => b.id === targetReq.bedId);
          if (bed && bed.statusId === 'status-maintenance') {
            const nextBedStatus = bed.assignedTo ? 'status-occupied' : 'status-vacant';
            await supabase.from(TABLES.beds).update({ status_id: nextBedStatus }).eq('id', targetReq.bedId);
          }
        }
        if (targetReq.roomId) {
          const room = current.rooms.find((r) => r.id === targetReq.roomId);
          if (room && room.statusId === 'status-maintenance') {
            await supabase.from(TABLES.rooms).update({ status_id: 'status-vacant' }).eq('id', targetReq.roomId);
          }
        }
      }

      await writeLog('MAINTENANCE_UPDATE', 'Maintenance Completed', `Completed request: "${targetReq.title}"`);
    } catch (err) {
      console.error('Complete maintenance error:', err);
    }
  };

  const deleteMaintenanceRequest = async (id: string) => {
    try {
      const current = dataRef.current;
      const targetReq = current.maintenanceRequests.find((r) => r.id === id);
      const { error } = await supabase.from(TABLES.maintenanceRequests).delete().eq('id', id);
      if (error) throw error;
      await writeLog('MAINTENANCE_UPDATE', 'Maintenance Deleted', `Deleted request "${targetReq?.title || id}"`);
    } catch (err) {
      console.error('Delete maintenance error:', err);
    }
  };

  // --- Food Waste Tracker Actions ---
  const addFoodWasteLog = async (logData: Omit<FoodWasteLog, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const logId = `fwl-${Date.now()}`;
      const now = new Date().toISOString();
      const newWasteLog: FoodWasteLog = { ...logData, id: logId, createdAt: now, updatedAt: now };
      const { error } = await supabase.from(TABLES.foodWasteLogs).insert(cleanForSupabase(foodWasteToRow(newWasteLog)));
      if (error) throw error;
      await writeLog(
        'FOOD_WASTE_CREATE', 'Food Waste Recorded',
        `Logged ${logData.weightKg} Kg for ${logData.mealService} service at ${logData.diningHallLocation}`
      );
    } catch (err) {
      console.error('Add food waste error:', err);
    }
  };

  const updateFoodWasteLog = async (id: string, updates: Partial<FoodWasteLog>) => {
    try {
      const current = dataRef.current;
      const target = current.foodWasteLogs.find((f) => f.id === id);

      const updateRow: Record<string, unknown> = {};
      if (updates.date !== undefined) updateRow.date = updates.date;
      if (updates.mealService !== undefined) updateRow.meal_service = updates.mealService;
      if (updates.weightKg !== undefined) updateRow.weight_kg = updates.weightKg;
      if (updates.diningHallLocation !== undefined) updateRow.dining_hall_location = updates.diningHallLocation;
      if (updates.preparedServings !== undefined) updateRow.prepared_servings = updates.preparedServings;
      if (updates.unconsumedServings !== undefined) updateRow.unconsumed_servings = updates.unconsumedServings;
      if (updates.wasteReason !== undefined) updateRow.waste_reason = updates.wasteReason;
      if (updates.shiftNotes !== undefined) updateRow.shift_notes = updates.shiftNotes;
      if (updates.loggedBy !== undefined) updateRow.logged_by = updates.loggedBy;
      if (updates.loggedByRole !== undefined) updateRow.logged_by_role = updates.loggedByRole;
      updateRow.updated_at = new Date().toISOString();

      const { error } = await supabase.from(TABLES.foodWasteLogs).update(updateRow).eq('id', id);
      if (error) throw error;

      await writeLog(
        'FOOD_WASTE_UPDATE', 'Food Waste Record Updated',
        `Updated waste entry for ${target?.mealService || 'service'} on ${target?.date || ''} (${updates.weightKg ?? target?.weightKg ?? 0} Kg)`
      );
    } catch (err) {
      console.error('Update food waste error:', err);
    }
  };

  const deleteFoodWasteLog = async (id: string) => {
    try {
      const current = dataRef.current;
      const target = current.foodWasteLogs.find((f) => f.id === id);
      const { error } = await supabase.from(TABLES.foodWasteLogs).delete().eq('id', id);
      if (error) throw error;
      await writeLog(
        'FOOD_WASTE_DELETE', 'Food Waste Record Deleted',
        `Deleted food waste record of ${target?.weightKg ?? 0} Kg (${target?.mealService ?? 'service'})`
      );
    } catch (err) {
      console.error('Delete food waste error:', err);
    }
  };

  // --- Transfer Tracker Actions ---
  const addTransferRecord = async (recordData: Omit<TransferRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const trfId = `trf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      const random6Digit = Math.floor(100000 + Math.random() * 900000);
      const currentYear = new Date().getFullYear();
      const fallbackReqId = `VFAR-${random6Digit}-${currentYear}`;

      const modifier = recordData.lastModifiedBy || recordData.createdBy || 'System User';
      const initialLog: TransferAuditLogEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: now,
        action: 'Request Created',
        performedBy: modifier,
        details: `Created transfer request ${recordData.requestId || fallbackReqId} for ${recordData.fullName} (${recordData.leaveType || 'Transfer'})`,
      };

      const auditLogs = recordData.auditLogs && recordData.auditLogs.length > 0
        ? recordData.auditLogs
        : [initialLog];

      const newRecord: TransferRecord = {
        requestId: fallbackReqId,
        ...recordData,
        id: trfId,
        createdAt: now,
        updatedAt: now,
        lastModifiedBy: modifier,
        auditLogs,
      };
      const { error } = await supabase.from(TABLES.transferRecords).insert(cleanForSupabase(transferToRow(newRecord)));
      if (error) throw error;
      await writeLog(
        'TRANSFER_CREATE', 'Transfer Request Created',
        `Created transfer request ${recordData.psaNo} for ${recordData.fullName} (${recordData.position})`
      );
    } catch (err) {
      console.error('Add transfer error:', err);
    }
  };

  const updateTransferRecord = async (id: string, updates: Partial<TransferRecord>) => {
    try {
      const current = dataRef.current;
      const target = current.transferRecords.find((t) => t.id === id);
      const now = new Date().toISOString();
      const modifier = updates.lastModifiedBy || 'System User';

      const existingLogs: TransferAuditLogEntry[] = target?.auditLogs ? [...target.auditLogs] : [];

      if (existingLogs.length === 0) {
        existingLogs.push({
          id: `log-init-${id}`,
          timestamp: target?.createdAt || now,
          action: 'Request Created',
          performedBy: target?.createdBy || target?.lastModifiedBy || 'System User',
          details: `Initial record creation for ${target?.fullName || 'team member'}`,
        });
      }

      let updatedLogs = updates.auditLogs;
      if (!updatedLogs) {
        const diffs: string[] = [];
        if (updates.status && updates.status !== target?.status) {
          diffs.push(`Status: ${target?.status || 'Pending'} → ${updates.status}`);
        }
        if (updates.psaNo && updates.psaNo !== target?.psaNo) {
          diffs.push(`PSA No: "${target?.psaNo || ''}" → "${updates.psaNo}"`);
        }
        if (updates.arrivalDate !== undefined && updates.arrivalDate !== target?.arrivalDate) {
          diffs.push(`Arrival Date: "${target?.arrivalDate || '—'}" → "${updates.arrivalDate || '—'}"`);
        }
        if (updates.departureDate !== undefined && updates.departureDate !== target?.departureDate) {
          diffs.push(`Departure Date: "${target?.departureDate || '—'}" → "${updates.departureDate || '—'}"`);
        }
        if (updates.arrivalFlight !== undefined && updates.arrivalFlight !== target?.arrivalFlight) {
          diffs.push(`Arrival Flight: "${target?.arrivalFlight || '—'}" → "${updates.arrivalFlight || '—'}"`);
        }
        if (updates.departureFlight !== undefined && updates.departureFlight !== target?.departureFlight) {
          diffs.push(`Departure Flight: "${target?.departureFlight || '—'}" → "${updates.departureFlight || '—'}"`);
        }
        if (updates.departureTime !== undefined && updates.departureTime !== target?.departureTime) {
          diffs.push(`Departure Time: "${target?.departureTime || '—'}" → "${updates.departureTime || '—'}"`);
        }
        if (updates.rate !== undefined && updates.rate !== target?.rate) {
          diffs.push(`Rate: "${target?.rate || '—'}" → "${updates.rate || '—'}"`);
        }
        if (updates.leaveType !== undefined && updates.leaveType !== target?.leaveType) {
          diffs.push(`Leave Type: "${target?.leaveType || '—'}" → "${updates.leaveType || '—'}"`);
        }
        if (updates.transport !== undefined && updates.transport !== target?.transport) {
          diffs.push(`Transport: "${target?.transport || '—'}" → "${updates.transport || '—'}"`);
        }
        if (updates.preferredFlightTiming !== undefined && updates.preferredFlightTiming !== target?.preferredFlightTiming) {
          diffs.push(`Preferred Timing: "${target?.preferredFlightTiming || 'ANY'}" → "${updates.preferredFlightTiming}"`);
        }
        if (updates.notes !== undefined && updates.notes !== target?.notes) {
          diffs.push(`Notes updated`);
        }

        const changeDetails = diffs.length > 0 ? diffs.join(' • ') : 'Transfer details updated';
        const actionTitle = updates.status && updates.status !== target?.status
          ? `Status changed to ${updates.status}`
          : 'Request Updated';

        const newLogEntry: TransferAuditLogEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: now,
          action: actionTitle,
          performedBy: modifier,
          details: changeDetails,
        };
        updatedLogs = [newLogEntry, ...existingLogs];
      }

      const updateRow: Record<string, unknown> = {};
      const fieldMap: Record<string, string> = {
        psaNo: 'psa_no', fullName: 'full_name', employeeId: 'employee_id',
        position: 'position', department: 'department', transport: 'transport',
        nidWpNo: 'nid_wp_no', requestId: 'request_id', linkedRequestId: 'linked_request_id',
        leaveType: 'leave_type', legType: 'leg_type', tripGroupId: 'trip_group_id',
        linkedTransferId: 'linked_transfer_id', linkedPsaNo: 'linked_psa_no',
        arrivalDate: 'arrival_date', departureDate: 'departure_date',
        arrivalFlight: 'arrival_flight', departureFlight: 'departure_flight',
        flightDetails: 'flight_details', preferredFlightTiming: 'preferred_flight_timing',
        checkInTime: 'check_in_time', checkInClose: 'check_in_close',
        departureTime: 'departure_time', rate: 'rate', notes: 'notes', status: 'status',
      };
      for (const [camel, snake] of Object.entries(fieldMap)) {
        if (updates[camel as keyof TransferRecord] !== undefined) {
          updateRow[snake] = updates[camel as keyof TransferRecord];
        }
      }
      updateRow.updated_at = now;
      updateRow.last_modified_by = modifier;
      updateRow.audit_logs = updatedLogs;

      const { error } = await supabase.from(TABLES.transferRecords).update(updateRow).eq('id', id);
      if (error) throw error;

      await writeLog(
        'TRANSFER_UPDATE', 'Transfer Request Updated',
        `Updated transfer request ${target?.psaNo || id} for ${target?.fullName || 'member'}`
      );
    } catch (err) {
      console.error('Update transfer error:', err);
    }
  };

  const deleteTransferRecord = async (id: string) => {
    try {
      const current = dataRef.current;
      const target = current.transferRecords.find((t) => t.id === id);
      const { error } = await supabase.from(TABLES.transferRecords).delete().eq('id', id);
      if (error) throw error;
      await writeLog(
        'TRANSFER_DELETE', 'Transfer Request Deleted',
        `Deleted transfer request ${target?.psaNo || id} for ${target?.fullName || 'member'}`
      );
    } catch (err) {
      console.error('Delete transfer error:', err);
    }
  };

  // --- User Management Actions ---
  const addUser = async (userData: Omit<UserProfile, 'id' | 'createdAt'>) => {
    try {
      const userId = `usr-${Date.now()}`;
      const newUser: UserProfile = { ...userData, id: userId, createdAt: new Date().toISOString() };
      const { error } = await supabase.from(TABLES.users).insert(cleanForSupabase(userToRow(newUser)));
      if (error) throw error;
      await writeLog('USER_CHANGE', 'User Added', `Added user ${userData.name} (${userData.role})`);
    } catch (err) {
      console.error('Add user error:', err);
    }
  };

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const current = dataRef.current;
      const targetUser = current.users.find((u) => u.id === id);

      const updateRow: Record<string, unknown> = {};
      if (updates.email !== undefined) updateRow.email = updates.email;
      if (updates.password !== undefined) updateRow.password = updates.password;
      if (updates.name !== undefined) updateRow.name = updates.name;
      if (updates.role !== undefined) updateRow.role = updates.role;
      if (updates.employeeId !== undefined) updateRow.employee_id = updates.employeeId;
      if (updates.department !== undefined) updateRow.department = updates.department;
      if (updates.assignedBuildingIds !== undefined) updateRow.assigned_building_ids = updates.assignedBuildingIds;
      if (updates.assignedBedId !== undefined) updateRow.assigned_bed_id = updates.assignedBedId;
      if (updates.phone !== undefined) updateRow.phone = updates.phone;
      if (updates.avatarUrl !== undefined) updateRow.avatar_url = updates.avatarUrl;
      if (updates.modulePermissions !== undefined) updateRow.module_permissions = updates.modulePermissions;

      const { error } = await supabase.from(TABLES.users).update(updateRow).eq('id', id);
      if (error) throw error;

      await writeLog('USER_CHANGE', 'User Updated', `Updated user profile for ${targetUser?.name || id}`);
    } catch (err) {
      console.error('Update user error:', err);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const current = dataRef.current;
      const targetUser = current.users.find((u) => u.id === id);
      const { error } = await supabase.from(TABLES.users).delete().eq('id', id);
      if (error) throw error;
      await writeLog('USER_CHANGE', 'User Deleted', `Deleted user ${targetUser?.name || id}`);
    } catch (err) {
      console.error('Delete user error:', err);
    }
  };

  // --- Reset & Save ---
  const resetToDefaults = async () => {
    try {
      // Delete all data from all tables
      const tableNames = [
        TABLES.buildings, TABLES.floors, TABLES.roomTypes, TABLES.statuses,
        TABLES.rooms, TABLES.beds, TABLES.logs, TABLES.users,
        TABLES.maintenanceRequests, TABLES.foodWasteLogs, TABLES.transferRecords,
      ];
      for (const t of tableNames) {
        await supabase.from(t).delete().neq('id', '__impossible__');
      }
      await seedInitialData();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const saveDataToServer = async (newData: PropertyData) => {
    try {
      // Upsert all provided data
      const upserts: { table: string; rows: Record<string, unknown>[] }[] = [];
      if (newData.buildings?.length) upserts.push({ table: TABLES.buildings, rows: newData.buildings.map(b => cleanForSupabase(buildingToRow(b))) });
      if (newData.floors?.length) upserts.push({ table: TABLES.floors, rows: newData.floors.map(f => cleanForSupabase(floorToRow(f))) });
      if (newData.roomTypes?.length) upserts.push({ table: TABLES.roomTypes, rows: newData.roomTypes.map(rt => cleanForSupabase(roomTypeToRow(rt))) });
      if (newData.statuses?.length) upserts.push({ table: TABLES.statuses, rows: newData.statuses.map(s => cleanForSupabase(statusToRow(s))) });
      if (newData.rooms?.length) upserts.push({ table: TABLES.rooms, rows: newData.rooms.map(r => cleanForSupabase(roomToRow(r))) });
      if (newData.beds?.length) upserts.push({ table: TABLES.beds, rows: newData.beds.map(b => cleanForSupabase(bedToRow(b))) });
      if (newData.logs?.length) upserts.push({ table: TABLES.logs, rows: newData.logs.map(l => cleanForSupabase(activityLogToRow(l))) });
      if (newData.users?.length) upserts.push({ table: TABLES.users, rows: newData.users.map(u => cleanForSupabase(userToRow(u))) });
      if (newData.maintenanceRequests?.length) upserts.push({ table: TABLES.maintenanceRequests, rows: newData.maintenanceRequests.map(m => cleanForSupabase(maintenanceToRow(m))) });
      if (newData.foodWasteLogs?.length) upserts.push({ table: TABLES.foodWasteLogs, rows: newData.foodWasteLogs.map(f => cleanForSupabase(foodWasteToRow(f))) });
      if (newData.transferRecords?.length) upserts.push({ table: TABLES.transferRecords, rows: newData.transferRecords.map(t => cleanForSupabase(transferToRow(t))) });

      for (const { table, rows } of upserts) {
        const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
        if (error) console.error(`Save error for ${table}:`, error);
      }
    } catch (err) {
      console.error('Save data error:', err);
    }
  };

  return (
    <PropertyContext.Provider
      value={{
        data,
        isLoading,
        activeTab,
        setActiveTab,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,

        addBuilding, updateBuilding, deleteBuilding,
        addFloor, updateFloor, deleteFloor,
        addRoomType, updateRoomType, deleteRoomType,
        addStatusCategory, updateStatusCategory, deleteStatusCategory,
        addRoom, updateRoom, deleteRoom,
        assignBed, checkoutBed, updateBedStatus,
        addMaintenanceRequest, updateMaintenanceRequest, completeMaintenanceRequest, deleteMaintenanceRequest,
        addFoodWasteLog, updateFoodWasteLog, deleteFoodWasteLog,
        addTransferRecord, updateTransferRecord, deleteTransferRecord,
        addUser, updateUser, deleteUser,
        writeLog, resetToDefaults, saveDataToServer,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperty = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
};

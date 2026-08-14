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
  MaintenanceRequest,
  FoodWasteLog,
  TransferRecord,
  TransferAuditLogEntry,
} from '../types';

// --- Row types (snake_case from database) ---

interface BuildingRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
}
interface FloorRow {
  id: string;
  building_id: string;
  number: number;
  label: string;
  description: string | null;
}
interface RoomTypeRow {
  id: string;
  name: string;
  default_bed_count: number;
  description: string | null;
  badge_color: string;
}
interface StatusRow {
  id: string;
  name: string;
  type: string;
  color: string;
  description: string | null;
  is_occupied_state: boolean | null;
  is_maintenance_state: boolean | null;
}
interface RoomRow {
  id: string;
  building_id: string;
  floor_id: string;
  room_number: string;
  room_type_id: string;
  total_beds: number;
  status_id: string;
  notes: string | null;
  last_cleaned: string | null;
  updated_at: string;
}
interface BedRow {
  id: string;
  room_id: string;
  bed_number: number;
  label: string;
  status_id: string;
  assigned_to: BedAssignment | null;
  notes: string | null;
}
interface UserRow {
  id: string;
  email: string;
  password: string | null;
  name: string;
  role: string;
  employee_id: string | null;
  department: string | null;
  assigned_building_ids: string[] | null;
  assigned_bed_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  module_permissions: Record<string, string> | null;
}
interface MaintenanceRow {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  building_id: string | null;
  floor_id: string | null;
  room_id: string | null;
  bed_id: string | null;
  requester_id: string | null;
  requester_name: string | null;
  requester_role: string | null;
  contact_phone: string | null;
  assigned_technician: string | null;
  assigned_technician_phone: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  resolution_notes: string | null;
  update_room_bed_status_on_complete: boolean | null;
}
interface FoodWasteRow {
  id: string;
  date: string;
  meal_service: string;
  weight_kg: number;
  dining_hall_location: string;
  prepared_servings: number | null;
  unconsumed_servings: number | null;
  waste_reason: string;
  shift_notes: string | null;
  logged_by: string;
  logged_by_user_id: string | null;
  logged_by_role: string | null;
  created_at: string;
  updated_at: string;
}
interface TransferRow {
  id: string;
  psa_no: string;
  full_name: string;
  employee_id: string;
  position: string;
  department: string | null;
  transport: string | null;
  nid_wp_no: string;
  request_id: string | null;
  linked_request_id: string | null;
  leave_type: string | null;
  leg_type: string | null;
  trip_group_id: string | null;
  linked_transfer_id: string | null;
  linked_psa_no: string | null;
  arrival_date: string | null;
  departure_date: string | null;
  arrival_flight: string | null;
  departure_flight: string | null;
  flight_details: string | null;
  preferred_flight_timing: string | null;
  check_in_time: string | null;
  check_in_close: string | null;
  departure_time: string | null;
  rate: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_modified_by: string | null;
  audit_logs: TransferAuditLogEntry[] | null;
}
interface ActivityLogRow {
  id: string;
  timestamp: string;
  action: string;
  title: string;
  details: string;
  actor: string | null;
  actor_email: string | null;
  actor_role: string | null;
  ip_address: string | null;
  browser: string | null;
  device_type: string | null;
}

// --- Row → App type converters ---

export function rowToBuilding(r: BuildingRow): Building {
  return { id: r.id, name: r.name, code: r.code, description: r.description ?? undefined, createdAt: r.created_at };
}
export function rowToFloor(r: FloorRow): Floor {
  return { id: r.id, buildingId: r.building_id, number: r.number, label: r.label, description: r.description ?? undefined };
}
export function rowToRoomType(r: RoomTypeRow): RoomType {
  return { id: r.id, name: r.name, defaultBedCount: r.default_bed_count, description: r.description ?? undefined, badgeColor: r.badge_color };
}
export function rowToStatus(r: StatusRow): StatusCategory {
  return {
    id: r.id, name: r.name, type: r.type as 'room' | 'bed' | 'both', color: r.color,
    description: r.description ?? undefined,
    isOccupiedState: r.is_occupied_state ?? undefined,
    isMaintenanceState: r.is_maintenance_state ?? undefined,
  };
}
export function rowToRoom(r: RoomRow): Room {
  return {
    id: r.id, buildingId: r.building_id, floorId: r.floor_id, roomNumber: r.room_number,
    roomTypeId: r.room_type_id, totalBeds: r.total_beds, statusId: r.status_id,
    notes: r.notes ?? undefined, lastCleaned: r.last_cleaned ?? undefined, updatedAt: r.updated_at,
  };
}
export function rowToBed(r: BedRow): Bed {
  return {
    id: r.id, roomId: r.room_id, bedNumber: r.bed_number, label: r.label,
    statusId: r.status_id, assignedTo: r.assigned_to ?? null, notes: r.notes ?? undefined,
  };
}
export function rowToUser(r: UserRow): UserProfile {
  return {
    id: r.id, email: r.email, password: r.password ?? undefined, name: r.name,
    role: r.role as UserProfile['role'], employeeId: r.employee_id ?? undefined,
    department: r.department ?? undefined,
    assignedBuildingIds: r.assigned_building_ids ?? undefined,
    assignedBedId: r.assigned_bed_id ?? undefined, phone: r.phone ?? undefined,
    avatarUrl: r.avatar_url ?? undefined, createdAt: r.created_at,
    modulePermissions: r.module_permissions ?? undefined,
  };
}
export function rowToMaintenance(r: MaintenanceRow): MaintenanceRequest {
  return {
    id: r.id, title: r.title, description: r.description,
    category: r.category as MaintenanceRequest['category'],
    urgency: r.urgency as MaintenanceRequest['urgency'],
    status: r.status as MaintenanceRequest['status'],
    buildingId: r.building_id ?? '', floorId: r.floor_id ?? '',
    roomId: r.room_id ?? '', bedId: r.bed_id ?? undefined,
    requesterId: r.requester_id ?? '', requesterName: r.requester_name ?? '',
    requesterRole: r.requester_role as MaintenanceRequest['requesterRole'],
    contactPhone: r.contact_phone ?? undefined,
    assignedTechnician: r.assigned_technician ?? undefined,
    assignedTechnicianPhone: r.assigned_technician_phone ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    completedAt: r.completed_at ?? undefined,
    resolutionNotes: r.resolution_notes ?? undefined,
    updateRoomBedStatusOnComplete: r.update_room_bed_status_on_complete ?? undefined,
  };
}
export function rowToFoodWaste(r: FoodWasteRow): FoodWasteLog {
  return {
    id: r.id, date: r.date, mealService: r.meal_service as FoodWasteLog['mealService'],
    weightKg: Number(r.weight_kg), diningHallLocation: r.dining_hall_location,
    preparedServings: r.prepared_servings ?? undefined,
    unconsumedServings: r.unconsumed_servings ?? undefined,
    wasteReason: r.waste_reason, shiftNotes: r.shift_notes ?? undefined,
    loggedBy: r.logged_by, loggedByUserId: r.logged_by_user_id ?? undefined,
    loggedByRole: r.logged_by_role ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}
export function rowToTransfer(r: TransferRow): TransferRecord {
  return {
    id: r.id, psaNo: r.psa_no, fullName: r.full_name, employeeId: r.employee_id,
    position: r.position, department: r.department ?? undefined,
    transport: r.transport ?? undefined, nidWpNo: r.nid_wp_no,
    requestId: r.request_id ?? undefined, linkedRequestId: r.linked_request_id ?? undefined,
    leaveType: r.leave_type ?? undefined,
    legType: r.leg_type as TransferRecord['legType'] ?? undefined,
    tripGroupId: r.trip_group_id ?? undefined,
    linkedTransferId: r.linked_transfer_id ?? undefined,
    linkedPsaNo: r.linked_psa_no ?? undefined,
    arrivalDate: r.arrival_date ?? undefined, departureDate: r.departure_date ?? undefined,
    arrivalFlight: r.arrival_flight ?? undefined, departureFlight: r.departure_flight ?? undefined,
    flightDetails: r.flight_details ?? undefined,
    preferredFlightTiming: r.preferred_flight_timing ?? undefined,
    checkInTime: r.check_in_time ?? undefined, checkInClose: r.check_in_close ?? undefined,
    departureTime: r.departure_time ?? undefined,
    rate: r.rate ?? '', notes: r.notes ?? undefined,
    status: r.status as TransferRecord['status'],
    createdAt: r.created_at, updatedAt: r.updated_at,
    createdBy: r.created_by ?? undefined, lastModifiedBy: r.last_modified_by ?? undefined,
    auditLogs: r.audit_logs ?? undefined,
  };
}
export function rowToActivityLog(r: ActivityLogRow): ActivityLog {
  return {
    id: r.id, timestamp: r.timestamp, action: r.action as ActivityLog['action'],
    title: r.title, details: r.details, actor: r.actor ?? undefined,
    actorEmail: r.actor_email ?? undefined, actorRole: r.actor_role ?? undefined,
    ipAddress: r.ip_address ?? undefined, browser: r.browser ?? undefined,
    deviceType: r.device_type ?? undefined,
  };
}

// --- App type → Row converters (for inserts/updates) ---

export function buildingToRow(b: Building): Record<string, unknown> {
  return { id: b.id, name: b.name, code: b.code, description: b.description ?? null, created_at: b.createdAt };
}
export function floorToRow(f: Floor): Record<string, unknown> {
  return { id: f.id, building_id: f.buildingId, number: f.number, label: f.label, description: f.description ?? null };
}
export function roomTypeToRow(rt: RoomType): Record<string, unknown> {
  return { id: rt.id, name: rt.name, default_bed_count: rt.defaultBedCount, description: rt.description ?? null, badge_color: rt.badgeColor };
}
export function statusToRow(s: StatusCategory): Record<string, unknown> {
  return {
    id: s.id, name: s.name, type: s.type, color: s.color,
    description: s.description ?? null,
    is_occupied_state: s.isOccupiedState ?? false,
    is_maintenance_state: s.isMaintenanceState ?? false,
  };
}
export function roomToRow(r: Room): Record<string, unknown> {
  return {
    id: r.id, building_id: r.buildingId, floor_id: r.floorId, room_number: r.roomNumber,
    room_type_id: r.roomTypeId, total_beds: r.totalBeds, status_id: r.statusId,
    notes: r.notes ?? null, last_cleaned: r.lastCleaned ?? null, updated_at: r.updatedAt,
  };
}
export function bedToRow(b: Bed): Record<string, unknown> {
  return {
    id: b.id, room_id: b.roomId, bed_number: b.bedNumber, label: b.label,
    status_id: b.statusId, assigned_to: b.assignedTo ?? null, notes: b.notes ?? null,
  };
}
export function userToRow(u: UserProfile): Record<string, unknown> {
  return {
    id: u.id, email: u.email, password: u.password ?? null, name: u.name, role: u.role,
    employee_id: u.employeeId ?? null, department: u.department ?? null,
    assigned_building_ids: u.assignedBuildingIds ?? null,
    assigned_bed_id: u.assignedBedId ?? null, phone: u.phone ?? null,
    avatar_url: u.avatarUrl ?? null, created_at: u.createdAt ?? null,
    module_permissions: u.modulePermissions ?? null,
  };
}
export function maintenanceToRow(m: MaintenanceRequest): Record<string, unknown> {
  return {
    id: m.id, title: m.title, description: m.description, category: m.category,
    urgency: m.urgency, status: m.status, building_id: m.buildingId,
    floor_id: m.floorId, room_id: m.roomId, bed_id: m.bedId ?? null,
    requester_id: m.requesterId, requester_name: m.requesterName,
    requester_role: m.requesterRole, contact_phone: m.contactPhone ?? null,
    assigned_technician: m.assignedTechnician ?? null,
    assigned_technician_phone: m.assignedTechnicianPhone ?? null,
    created_at: m.createdAt, updated_at: m.updatedAt,
    completed_at: m.completedAt ?? null,
    resolution_notes: m.resolutionNotes ?? null,
    update_room_bed_status_on_complete: m.updateRoomBedStatusOnComplete ?? null,
  };
}
export function foodWasteToRow(f: FoodWasteLog): Record<string, unknown> {
  return {
    id: f.id, date: f.date, meal_service: f.mealService, weight_kg: f.weightKg,
    dining_hall_location: f.diningHallLocation,
    prepared_servings: f.preparedServings ?? null,
    unconsumed_servings: f.unconsumedServings ?? null,
    waste_reason: f.wasteReason, shift_notes: f.shiftNotes ?? null,
    logged_by: f.loggedBy, logged_by_user_id: f.loggedByUserId ?? null,
    logged_by_role: f.loggedByRole ?? null,
    created_at: f.createdAt, updated_at: f.updatedAt,
  };
}
export function transferToRow(t: TransferRecord): Record<string, unknown> {
  return {
    id: t.id, psa_no: t.psaNo, full_name: t.fullName, employee_id: t.employeeId,
    position: t.position, department: t.department ?? null, transport: t.transport ?? null,
    nid_wp_no: t.nidWpNo, request_id: t.requestId ?? null,
    linked_request_id: t.linkedRequestId ?? null, leave_type: t.leaveType ?? null,
    leg_type: t.legType ?? null, trip_group_id: t.tripGroupId ?? null,
    linked_transfer_id: t.linkedTransferId ?? null, linked_psa_no: t.linkedPsaNo ?? null,
    arrival_date: t.arrivalDate ?? null, departure_date: t.departureDate ?? null,
    arrival_flight: t.arrivalFlight ?? null, departure_flight: t.departureFlight ?? null,
    flight_details: t.flightDetails ?? null,
    preferred_flight_timing: t.preferredFlightTiming ?? null,
    check_in_time: t.checkInTime ?? null, check_in_close: t.checkInClose ?? null,
    departure_time: t.departureTime ?? null, rate: t.rate ?? null,
    notes: t.notes ?? null, status: t.status, created_at: t.createdAt,
    updated_at: t.updatedAt, created_by: t.createdBy ?? null,
    last_modified_by: t.lastModifiedBy ?? null,
    audit_logs: t.auditLogs ?? null,
  };
}
export function activityLogToRow(l: ActivityLog): Record<string, unknown> {
  return {
    id: l.id, timestamp: l.timestamp, action: l.action, title: l.title,
    details: l.details, actor: l.actor ?? null, actor_email: l.actorEmail ?? null,
    actor_role: l.actorRole ?? null, ip_address: l.ipAddress ?? null,
    browser: l.browser ?? null, device_type: l.deviceType ?? null,
  };
}

// --- Utility to clean undefined values for Supabase inserts/updates ---

export function cleanForSupabase<T extends Record<string, unknown>>(obj: T): T {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

export type { PropertyData };
